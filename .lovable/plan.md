## Goal
Replace the current invalid `STRIPE_SECRET_KEY` (which starts with `mk_` and is being rejected by Stripe as "Invalid API Key") with the correct key you have ready.

## Steps
1. **Update the secret** — Use the secrets tool to update `STRIPE_SECRET_KEY` with your new value. The `create-donation-checkout` edge function already reads it via `Deno.env.get("STRIPE_SECRET_KEY")`, so no code changes are needed.
2. **Test the donation flow** — From `/donate`, run a $1 test donation:
   - Should redirect to Stripe Checkout (no more "non-2xx" error)
   - Complete payment → land on `/donate/thank-you`
   - The `donations` row flips from `pending` → `completed` (via the webhook, which is already configured)
3. **Check logs if needed** — If anything fails, I can pull `create-donation-checkout` and `stripe-webhook` logs to diagnose.

## Notes
- Expected key prefix: `sk_live_...`, `sk_test_...`, or `rk_live_...` / `rk_test_...` (restricted key with write access to Checkout Sessions, Products, Prices, Customers).
- After approval, you'll get a secure secret-input box — paste the key there, NOT in chat.
- ⚠️ Live keys charge real cards. Use $1 and refund yourself in the Stripe Dashboard after.
