

## Phase 1: Merchant Portal — Event Management

You're right that events and deals are fundamentally different. The existing tables already reflect this:
- **`merchant_events`** — for things like "Trivia Night" or "NBA Watch Party" (one-time or recurring)
- **`merchant_offers`** — for things like "10% off $20+" (time-bounded deals)

We should keep them separate and evolve each table independently.

### What we're building

1. **Merchant Portal page** — a new `/merchant/:id/manage` route where authenticated merchant owners (and admins) can manage their listing's events and offers
2. **Event creation form** — supports one-time and recurring events
3. **Homepage events feed** — neighborhood-filtered, Instagram-style feed

### Scope for this slice

Given the size, I recommend we split into **two implementation slices**:

**Slice A (this build):** Database schema + Merchant Portal with event CRUD on merchant profiles
**Slice B (next build):** Homepage neighborhood events feed

---

### Slice A: Schema + Merchant Portal

#### 1. Database migration

**Evolve `merchant_events`** (add recurring support + denormalized location):

```sql
ALTER TABLE merchant_events
  ADD COLUMN event_type text NOT NULL DEFAULT 'one_time',  -- 'one_time' | 'recurring'
  ADD COLUMN recurrence_rule text,          -- 'weekly' | 'biweekly' | 'monthly'
  ADD COLUMN recurrence_day integer,        -- 0=Sun, 1=Mon, ..., 6=Sat
  ADD COLUMN start_time time,               -- e.g. 19:00 for "7 PM"
  ADD COLUMN end_time time,                 -- optional end time
  ADD COLUMN neighborhood text,             -- denormalized from Merchant
  ADD COLUMN city text,                     -- denormalized from Merchant
  ADD COLUMN category_tags text[] DEFAULT '{}',  -- ['trivia','watch-party','live-music']
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;
```

**Create `merchant_owners`** (links users to merchants they can manage):

```sql
CREATE TABLE merchant_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id integer NOT NULL REFERENCES "Merchant"(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, merchant_id)
);
```

**Add RLS:**
- `merchant_events`: admin OR owner of the merchant can INSERT/UPDATE/DELETE
- `merchant_owners`: admin can manage all; users can view their own rows

**Add trigger** to auto-copy `neighborhood` and `city` from `Merchant` into `merchant_events` on insert.

**Create helper function** `is_merchant_owner(merchant_id)` for RLS policies.

#### 2. Merchant Portal page

**New route:** `/merchant/:id/manage`

**Access:** Authenticated users who are either admin OR have an approved row in `merchant_owners` for that merchant.

**Page layout:**
- Header with merchant name + logo
- Tabs: "Events" | "Offers" (offers tab is future, but we set up the tab structure now)
- Events tab shows:
  - "Add Event" button → opens form
  - List of existing events with edit/delete actions

#### 3. Event creation form

**Fields:**
- Event type toggle: One-time / Recurring
- Title (required)
- Description (optional, textarea)
- Image URL (optional, text input — image upload can come later)
- Category tags (multi-select chips: trivia, watch-party, live-music, karaoke, comedy, DJ, brunch, open-mic, sports)
- **If one-time:** Date picker + optional start/end time
- **If recurring:** Day of week picker + start time + optional end time + recurrence rule (weekly/biweekly/monthly)

#### 4. Access from merchant profile

- Add "Manage Listing" button on `RestaurantProfileContent.tsx` (visible to admins and merchant owners)
- Links to `/merchant/:id/manage`

---

### Files to create
- `src/pages/MerchantPortal.tsx` — portal page with tabs
- `src/components/events/EventCreateForm.tsx` — event form
- `src/components/events/MerchantEventsList.tsx` — list with edit/delete
- `src/hooks/useManageEvents.ts` — CRUD operations
- `src/hooks/useMerchantOwnership.ts` — check if user owns a merchant

### Files to modify
- `src/App.tsx` — add `/merchant/:id/manage` route
- `src/components/RestaurantProfileContent.tsx` — add "Manage Listing" button, uncomment events feed
- `src/components/RestaurantEventsFeed.tsx` — update to handle recurring events display

### Build order
1. Database migration (schema + RLS + trigger + helper function)
2. Merchant portal page with event CRUD
3. Update merchant profile to link to portal + show events

