

## Build Out Merchant Portal Offers

### Current State
- `merchant_offers` table exists with columns: `id`, `store_id`, `offer_name`, `offer_description`, `start_time`, `end_time`, `is_active`
- RLS only allows **admins** to manage offers; merchant owners have no write access
- Public-facing display components exist (`OfferCard`, `OfferDetailsModal`, `MerchantOffersSection`)
- Portal sidebar has an "Offers" nav item but it's marked `disabled: true` with a "Coming soon" placeholder

### Changes

**1. Database migration — Add owner RLS policies to `merchant_offers`**

Add three new policies so merchant owners can insert, update, and delete their own offers (matching the pattern used for `happy_hour_deals` and `merchant_events`):
- `Owners can insert offers` — INSERT where `is_merchant_owner(store_id)`
- `Owners can update offers` — UPDATE where `is_merchant_owner(store_id)`
- `Owners can delete offers` — DELETE where `is_merchant_owner(store_id)`

**2. New hook — `src/hooks/useManageOffers.ts`**

Query + mutations for merchant offers CRUD:
- `useQuery` fetches all offers for the merchant (not just active/future ones — owner sees everything)
- `createOffer` mutation (insert)
- `updateOffer` mutation (update by id)
- `deleteOffer` mutation (delete by id)
- `toggleActive` mutation (flip `is_active`)

**3. New component — `src/components/merchant-portal/PortalOffers.tsx`**

Follows the same pattern as `PortalEvents`:
- List view showing all offers (active, expired, inactive) with status badges
- "Add Offer" button opens an inline create form
- Click an offer to edit it inline
- Form fields: offer name, description, start date/time, end date/time
- Delete and deactivate/activate controls inside the edit form
- Empty state with CTA to create first offer

**4. New component — `src/components/merchant-portal/OfferForm.tsx`**

Reusable form for create/edit:
- Offer name (required)
- Description (optional, textarea)
- Start time (datetime-local input, required)
- End time (datetime-local input, required, must be after start)
- When editing: delete button, active/inactive toggle

**5. Update `PortalSidebar.tsx`**

Remove `disabled: true` from the Offers nav item.

**6. Update `MerchantPortal.tsx`**

Replace the "Coming soon" placeholder in the `offers` case with `<PortalOffers merchantId={merchantId} />`.

### Technical Details

- The offer form validates that `end_time > start_time` client-side before submission
- List view shows status: "Active" (green), "Scheduled" (blue, future start), "Expired" (gray, past end), "Inactive" (red, manually deactivated)
- Offers sorted by `start_time` descending (newest first) in the management view
- No new database columns needed — the existing schema is sufficient

