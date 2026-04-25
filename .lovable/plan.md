## Goal
Store the Stripe webhook signing secret (`whsec_...`) you just retrieved from your Stripe dashboard so the `stripe-webhook` edge function can verify incoming events from Stripe and mark donations as `completed` in the database.

## Steps
1. **Add the secret** — Use the secrets tool to add `STRIPE_WEBHOOK_SECRET` with the `whsec_...` value you provide. The edge function already reads it via `Deno.env.get("STRIPE_WEBHOOK_SECRET")`, so no code changes are needed.
2. **Test end-to-end** — From `/donate`, run a small test donation:
   - Complete a Stripe Checkout session
   - Land on `/donate/thank-you`
   - Confirm the matching row in the `donations` table flips from `pending` → `completed`
3. **Check logs if needed** — If anything looks off, check the `stripe-webhook` edge function logs for signature verification errors.

## Notes
- ⚠️ You're using a **live** Stripe key, so test donations will charge a real card. Use a small amount (e.g. $1) and refund yourself in the Stripe Dashboard after.
- After approval, I'll prompt you with a secure secret-input box — paste the `whsec_...` value there, NOT in chat.
