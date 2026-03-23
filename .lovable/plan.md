

## Stripe Payment Integration — Donations + Merchant Payment Infrastructure

### Summary

Enable Stripe to power two payment flows: (1) a "Buy Me a Coffee" style donation button for immediate monetization, and (2) future merchant subscription/commission infrastructure.

### What Needs to Happen First

Before any code can be written, the Stripe integration must be enabled in Lovable. This will:
- Connect your Stripe account (or create one)
- Make Stripe tools and APIs available
- Provide the detailed implementation patterns for building checkout flows

### Phase 1 — Immediate: Donation/Tip Jar
- Add a "Support SipMunchYap" button (likely in the footer and/or a floating element)
- Stripe Checkout session for one-time payments with preset amounts ($3, $5, $10, custom)
- Edge function to create the checkout session
- Success/cancel redirect pages

### Phase 2 — Future: Merchant Payments
- Monthly subscription tiers for merchants (e.g., featured listings, priority placement)
- Per-transaction commission tracking on offer redemptions
- Merchant billing dashboard in the portal

### Next Step
I need to enable Stripe before I can provide the detailed technical plan. Once enabled, I'll have access to the specific Stripe tools and can build out the donation flow immediately.

