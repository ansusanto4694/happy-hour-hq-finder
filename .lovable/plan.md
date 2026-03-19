

## Offer Redemption with 4-Digit PIN Verification

### How It Works

1. Merchant sets a 4-digit redemption PIN when creating/editing an offer in the portal
2. Customer taps an offer on the restaurant profile page, sees the offer details modal
3. Modal now has a "Redeem" button at the bottom
4. Tapping "Redeem" shows a PIN entry screen (4 digit inputs) within the same modal
5. Correct PIN → green "Offer Redeemed" success state; incorrect → red "Incorrect PIN" message, inputs cleared
6. Each successful redemption is logged to a new `offer_redemptions` table, giving merchants a redemption count in their portal

### Changes

**1. Database migration**

- Add `redemption_pin` column (text, nullable) to `merchant_offers` — 4-digit PIN, nullable so existing offers aren't broken
- Create `offer_redemptions` table:
  - `id` (uuid, PK)
  - `offer_id` (uuid, FK → merchant_offers.id)
  - `store_id` (integer) — denormalized for easy merchant querying
  - `redeemed_at` (timestamptz, default now())
  - `user_id` (uuid, nullable) — if logged in
  - `session_id` (text, nullable) — anonymous tracking
- RLS: anyone can insert redemptions (customers may be anonymous); merchants can select their own (`is_merchant_owner(store_id)`); admins can select all

**2. Update `OfferForm.tsx` (merchant portal)**

- Add a "Redemption PIN" field — 4-digit numeric input, optional
- Validation: must be exactly 4 digits if provided
- Update `OfferFormData` type and `useManageOffers` to include `redemption_pin`

**3. Update `OfferDetailsModal.tsx` (customer-facing)**

- Add a "Redeem Offer" button at the bottom of the modal (only shown if the offer has a PIN set)
- Three states within the modal:
  - **Details** (default): offer info + "Redeem" button
  - **PIN Entry**: four individual digit inputs, "Submit" button
  - **Result**: "Offer Redeemed" (green checkmark) or "Incorrect PIN" (red, with retry/clear)
- On correct PIN: insert a row into `offer_redemptions`, show success state
- On incorrect PIN: show error, clear inputs after a brief delay
- PIN verification happens client-side by comparing against `redemption_pin` from the offer record (it's a convenience PIN, not a security secret)

**4. Update merchant_offers SELECT RLS**

- Need to ensure the `redemption_pin` is readable by public/anon for client-side verification. Since merchant_offers already has a public SELECT policy for active offers, the PIN will be included. This is acceptable because the PIN is a staff-convenience tool, not a security credential — it prevents accidental redemptions, not fraud.

**5. Add redemption count to `PortalOffers.tsx`**

- Query `offer_redemptions` grouped by `offer_id` to show a redemption count badge next to each offer in the merchant's list view

**6. Add redemption count to `PortalDashboard.tsx`**

- Add a "Total Redemptions" stat card showing total redemptions across all offers in the last 30 days

### Technical Details

- PIN input uses 4 individual controlled `<input>` elements with auto-focus advance (type each digit, cursor moves to next)
- The `redemption_pin` column is stored as plain text (not hashed) — it's a 4-digit convenience code, not a password
- Client-side comparison: `enteredPin === offer.redemption_pin`
- On success, the modal transitions to a non-dismissable success state for 3 seconds, then closes
- The redemption insert uses the anon/authenticated Supabase client directly

