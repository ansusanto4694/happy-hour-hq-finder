

## Offer Redemption Analytics in Merchant Portal

### What Merchants Will See

When a merchant clicks on an offer in their Offers list, they currently see the edit form. We'll add a **Redemption History** section below the form (when editing) that shows:

- A count summary: "X total redemptions"
- A table/list of each redemption with:
  - **Who**: user's first name + last initial (from `profile_display_names` view), or "Guest" if anonymous
  - **When**: formatted date and time of redemption

The existing redemption count badge on the offer list item already shows the aggregate — this adds the detailed breakdown when viewing a specific offer.

### Changes

**1. Update `PortalOffers.tsx` — fetch detailed redemptions when editing**

When `editingOffer` is set, query `offer_redemptions` for that specific offer, joined with `profile_display_names` to get user display names. Show a "Redemption History" card below the `OfferForm`.

The query:
```sql
SELECT r.id, r.redeemed_at, r.user_id, 
       p.first_name, p.last_name_initial
FROM offer_redemptions r
LEFT JOIN profile_display_names p ON p.id = r.user_id
WHERE r.offer_id = :offerId
ORDER BY r.redeemed_at DESC
```

**2. New component — `src/components/merchant-portal/OfferRedemptionHistory.tsx`**

A simple card component that receives an offer ID and merchant ID, fetches redemptions, and renders:
- Header with total count
- Scrollable list of redemption rows (user name + timestamp)
- Empty state if no redemptions yet

**3. No database changes needed**

- `offer_redemptions` table already exists with the right columns
- `profile_display_names` view is already public and provides safe display names
- RLS already allows merchant owners to SELECT their own redemptions via `is_merchant_owner(store_id)`

### Technical Details

- Uses `useQuery` with key `['offer-redemptions-detail', offerId]` 
- Joins against `profile_display_names` view — since this is a Postgres view, we'll do two queries: one for redemptions, one for the user IDs found, then merge client-side (Supabase JS doesn't support cross-table joins on unrelated tables easily)
- Alternatively, fetch redemptions then batch-fetch display names for the unique user_ids — simpler and avoids RLS complications
- Timestamps formatted as "Mar 21, 2026 at 2:30 PM"
- Anonymous redemptions (null user_id) show as "Guest"

