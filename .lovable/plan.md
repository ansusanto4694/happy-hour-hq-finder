## Goal
Replace the existing `STRIPE_SECRET_KEY` secret (which was mapped to the wrong Stripe account) with the new live key you just provided, so the `create-donation-checkout` edge function talks to the correct Stripe account.

## Steps
1. **Update the secret** — Use the secrets tool to overwrite `STRIPE_SECRET_KEY` with the new `sk_live_...` value. No code changes needed; the edge function already reads `Deno.env.get("STRIPE_SECRET_KEY")`.
2. **Verify** — After the secret is updated, the next donation attempt at `/donate` will hit the correct Stripe account. We can confirm by:
   - Triggering a checkout from the Donate page
   - Checking that the Stripe Checkout session loads under the right account branding
   - Watching `create-donation-checkout` edge function logs for any auth errors

## ⚠️ Security recommendation (strongly advised)
You pasted a **live** secret key in plaintext chat. Even though it goes into encrypted storage on our side, the key was exposed in transit and in conversation history. After the rotation below, please:

1. Go to **Stripe Dashboard → Developers → API keys**
2. **Roll** the key `sk_live_51TQD5B...QZHrhnht` to revoke it
3. Generate a fresh restricted key (with only the permissions needed: Checkout Sessions write, PaymentIntents read)
4. Send the new key in chat and I'll re-update the secret

This keeps the exposed key from being usable by anyone who might have access to the chat history.

## Notes
- This is a live key (`sk_live_...`), so real donations will be charged real money once this is in place.
- For initial testing, you may want to switch to a Stripe **test** key (`sk_test_...`) instead until the webhook is configured and the flow is verified end-to-end.
- Webhook setup (the `STRIPE_WEBHOOK_SECRET` step we discussed earlier) is still pending and unaffected by this change.

## What happens after approval
I'll switch to default mode and call the secret-update tool. No files will be edited.