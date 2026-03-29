## Security Hardening Plan — Fix All Vulnerabilities

### Critical Fixes

**1. Hide `redemption_pin` from public queries on `merchant_offers`**

The current SELECT policy lets anonymous users see all columns including `redemption_pin`. Fix: create a database view that excludes the PIN column, and update the public-facing query to use it. Merchants/admins still query the table directly (RLS already scopes that).

- Create a `merchant_offers_public` view (security_invoker = on) that selects all columns except `redemption_pin`
- Update `src/components/merchant-offers/MerchantOffersSection.tsx` and `src/hooks/useMerchantOffers.ts` to query the view instead of the table
- Keep `OfferDetailsModal` PIN verification working by moving PIN check to an edge function (server-side only)

**2. Lock down `user_events` SELECT policy**

Current policy `"Anyone can view events by session_id"` uses `USING (session_id IS NOT NULL)` which is always true — every row has a session_id. This exposes 60k+ behavioral records.

- Drop the `"Anyone can view events by session_id"` policy
- The admin SELECT policy already covers analytics needs
- Client-side event insertion still works (INSERT policy unchanged)

**3. Lock down `user_sessions` SELECT and UPDATE policies**

Current SELECT policy `"Anyone can view sessions by session_id"` is always true. UPDATE policy similarly too broad.

- Drop `"Anyone can view sessions by session_id"` SELECT policy
- Replace UPDATE policy: restrict to rows matching the client's own `session_id` by requiring the session_id in the filter (keep `USING (session_id IS NOT NULL)` but scope the client code to only update its own session)
- Since the client needs to upsert its own session, add a narrow SELECT policy: `USING (session_id = current_setting('request.headers')::json->>'x-session-id')` — or accept the trade-off per the existing risk acceptance note and keep the UPDATE as-is but remove the broad SELECT

Given the existing risk acceptance for anonymous tracking, the pragmatic fix:
- Remove the public SELECT policy (admin SELECT remains)
- Keep the UPDATE policy (required for session tracking upserts — already accepted risk)
- Adjust client code to not rely on SELECT for upserts (use `INSERT ... ON CONFLICT` via raw SQL or handle errors gracefully)

**4. Add RLS to `profile_display_names`**

This is a view with `security_invoker = on`, so it inherits RLS from the underlying `profiles` table. The existing `profiles` policies already restrict access. No action needed — this is a false positive.

### Medium Priority

**5. Create edge function for PIN verification**

Move the PIN check server-side so the client never receives the PIN value:
- New edge function `verify-offer-pin` that accepts `{offer_id, pin}` and returns `{valid: boolean}`
- Records the redemption server-side if valid
- Update `OfferDetailsModal` to call the edge function instead of comparing client-side

### Migration SQL (single migration)

```sql
-- 1. Drop overly permissive SELECT on user_events
DROP POLICY "Anyone can view events by session_id" ON public.user_events;

-- 2. Drop overly permissive SELECT on user_sessions
DROP POLICY "Anyone can view sessions by session_id" ON public.user_sessions;

-- 3. Create public view for merchant_offers without PIN
CREATE OR REPLACE VIEW public.merchant_offers_public
WITH (security_invoker = on) AS
SELECT id, store_id, offer_name, offer_description,
       start_time, end_time, is_active, created_at, updated_at
FROM public.merchant_offers;
```

### Edge Function: `verify-offer-pin`

- Accepts POST `{offer_id, pin}`
- Requires authenticated user (JWT check)
- Uses service role to read the actual PIN from `merchant_offers`
- Compares, records redemption if match, returns result
- Client never sees the PIN

### Client Code Changes

- `useMerchantOffers.ts` — query `merchant_offers_public` view instead of `merchant_offers`
- `OfferDetailsModal.tsx` — call `verify-offer-pin` edge function instead of client-side PIN comparison
- `useAnalytics.ts` / session tracking — handle potential SELECT failures gracefully since the broad SELECT policy is removed

### Files Affected

- New: `supabase/functions/verify-offer-pin/index.ts`
- New: 1 database migration
- Modified: `src/components/merchant-offers/OfferDetailsModal.tsx`
- Modified: `src/hooks/useMerchantOffers.ts`
- Modified: `src/hooks/useAnalytics.ts` (if session upsert relies on SELECT)

## Restructure Merchant Categories — IMPLEMENTED

### Summary

Migration applied successfully. Categories restructured into 5 dimensions:

- **Venue Type**: Bar (17 subcategories), Restaurant (5 subcategories), Cafe
- **Cuisine**: 51 categories (African through Vietnamese)
- **Experience**: 7 categories (Brunch, Dance Floor, Trivia Night, etc.)
- **Dietary**: 5 categories (Vegan, Vegetarian, Gluten-free, Farm-to-table, Organic)
- **Beverage**: 4 categories (Coffee, Tea, Craft Beer, Natural Wine)

### Changes Made

- Database: Added `category_type` column, created new L1 parents, reparented existing items, inserted all new categories
- `src/hooks/useCategories.ts` — Added `category_type` to type, added `getCategoryDimensions()` helper
- `src/components/UnifiedFilterBar.tsx` — Grouped filters by dimension (Venue Type, Cuisine, Experience, Dietary, Beverage)
- MobileFilterDrawerV2 passes through to UnifiedFilterBar (no changes needed)
