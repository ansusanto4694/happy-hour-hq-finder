## Phase 1: Donations via BYOK Stripe (one-time payments)

Goal: ship a working "Support SipMunchYap" donation flow that you can launch this week, using the restricted Stripe key you already planned for. Keeps everything on your current Supabase project (`gohcqazhofdhkghfxfok`) — no Lovable Cloud migration.

---

### 1. Stripe account prerequisites (you do this once, outside Lovable)

Before I write any code, you'll need to:

1. **Create the restricted key** in Stripe Dashboard → Developers → API keys → "Create restricted key" with these scopes (matches your earlier plan):
   - **Write**: Checkout Sessions, Products, Prices, Customers
   - **Read**: Payment Intents, Events (for webhook verification)
2. **Create one Product in Stripe** called "SipMunchYap Donation" (no fixed price — we'll pass `price_data` dynamically per checkout so users can choose any amount).
3. **Grab your Webhook signing secret** after we deploy the webhook endpoint (step 4 below) — you'll add it as a second Lovable secret.

I'll prompt you to add two secrets when we get there:
- `STRIPE_SECRET_KEY` — the restricted key from step 1
- `STRIPE_WEBHOOK_SECRET` — generated when you register the webhook URL in Stripe

---

### 2. Database: one new table for donation records

New table `donations` (via migration):

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `stripe_session_id` | text unique | Checkout Session ID |
| `stripe_payment_intent_id` | text nullable | Filled in by webhook |
| `amount_cents` | integer | What was actually charged |
| `currency` | text | default `'usd'` |
| `status` | text | `pending` / `completed` / `failed` |
| `donor_email` | text nullable | From Stripe checkout |
| `donor_name` | text nullable | Optional |
| `message` | text nullable | Optional public thank-you message |
| `user_id` | uuid nullable | Set if logged in (no FK to auth.users) |
| `session_id` | text nullable | Your existing analytics session id, for attribution |
| `created_at` / `updated_at` | timestamptz | defaults |

**RLS policies** (mirrors your existing patterns):
- `INSERT`: only service role (webhook + checkout function write here, never the browser)
- `SELECT`: `is_admin()` only — donations are private financial data
- No public/anon read, no UPDATE/DELETE from clients

---

### 3. Two new Edge Functions

**`create-donation-checkout`** (`verify_jwt = false` so anonymous donors work)
- Input: `{ amount_cents: number, donor_name?: string, message?: string }`
- Validates amount with Zod (min $1 / 100 cents, max $10,000 / 1,000,000 cents — sanity caps)
- Calls Stripe `checkout.sessions.create` with:
  - `mode: 'payment'` (one-time, not subscription)
  - `line_items` using inline `price_data` (USD, the requested amount, product name "SipMunchYap Donation")
  - `success_url` = `https://sipmunchyap.com/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url` = `https://sipmunchyap.com/donate`
  - `customer_creation: 'always'` so Stripe collects email
  - `metadata`: donor_name, message, your analytics session_id, user_id (if logged in)
- Inserts a `donations` row with `status='pending'` using the service role key
- Returns `{ url }` — frontend redirects to Stripe Checkout

**`stripe-webhook`** (`verify_jwt = false`, public endpoint)
- Verifies `Stripe-Signature` header against `STRIPE_WEBHOOK_SECRET` (CRITICAL — without this, anyone can forge donations)
- Handles `checkout.session.completed`: update donation row → `status='completed'`, fill in `stripe_payment_intent_id`, `donor_email`, `amount_cents` (use `amount_total` from the event, in case discount/tax adjusted it)
- Handles `checkout.session.expired` / `checkout.session.async_payment_failed`: → `status='failed'`
- Returns 200 quickly; logs errors but always ACKs valid signatures so Stripe doesn't retry forever
- After deploying, you'll register `https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/stripe-webhook` in Stripe Dashboard → Webhooks and paste the signing secret back into Lovable secrets

---

### 4. Frontend: donation page + thank-you page + footer link

**New page `/donate`** (`src/pages/Donate.tsx`):
- Hero copy explaining why donations help (bridge revenue while we grow toward merchant subscriptions)
- Preset amount buttons: **$5 / $10 / $25 / $50 / Custom**
- Optional fields: Name, Public message (max 280 chars)
- "Donate $X" button → calls `create-donation-checkout` → `window.location.href = url`
- Loading + error states using your existing `sonner` toaster
- SEOHead with appropriate title/description

**New page `/donate/thank-you`** (`src/pages/DonateThankYou.tsx`):
- Reads `session_id` from query params
- Polls `donations` table once via a small read function (or shows generic thank-you if RLS blocks anon reads — simpler: just show a static thank-you, since the webhook is the source of truth)
- "Back to home" CTA

**Wiring**:
- Add both routes to `src/App.tsx`
- Add a subtle "❤️ Support us" link to `src/components/Footer.tsx`
- (Optional, ask later) Add a small banner in the merchant portal sidebar inviting merchants to donate

---

### 5. What we're explicitly NOT doing in Phase 1

- ❌ Recurring/monthly donations (Stripe subscriptions) — adds webhook complexity; can ship as Phase 1.5 if demand
- ❌ Merchant subscription billing — Phase 2, when a merchant crosses 500 monthly profile views
- ❌ Stripe Tax / receipts beyond Stripe's default emailed receipt — donations to a non-501(c)(3) aren't tax-deductible anyway; we just rely on Stripe's auto-receipt email
- ❌ Admin dashboard for donations — you can view via SQL Editor for now; we can add a `/admin/donations` view later if useful

---

### 6. Testing flow

1. Deploy with **Stripe test mode** restricted key first (`rk_test_...`)
2. Use Stripe test card `4242 4242 4242 4242` to make a $5 test donation
3. Verify webhook fires (check Edge Function logs) and donation row flips to `completed`
4. Once happy, swap `STRIPE_SECRET_KEY` to your live restricted key (`rk_live_...`) and update the webhook in Stripe live mode

---

### Order of operations when you approve

1. Run the `donations` table migration
2. Ask you to add `STRIPE_SECRET_KEY` (test mode to start)
3. Build `create-donation-checkout` edge function
4. Build `stripe-webhook` edge function
5. Ask you to register the webhook URL in Stripe and add `STRIPE_WEBHOOK_SECRET`
6. Build `/donate` and `/donate/thank-you` pages + footer link
7. Walk you through a test-mode donation end-to-end

Sound right? If yes, approve and I'll start with the migration.