

# Final Egress Reduction Plan

## Problem
Supabase cached egress is at 6.27 GB, exceeding the 5 GB free tier limit. The `user_events` table (227K rows, 138 MB) is the primary driver.

## Changes

### 1. Route low-value events to GA4 only (skip Supabase insert)

**File:** `src/utils/analytics.ts`

Events that will no longer be written to Supabase (but still sent to GA4):
- `impression` (~71K existing rows)
- `performance` (~42K existing rows)
- `hover` (~22K existing rows)
- `scroll`

Events that continue writing to Supabase (used in dashboards/reports):
- `page_view`, `click`, `search`, `interaction`, `filter`, `navigation`, `engagement`, `funnel`

### 2. Remove per-event session count database query

**File:** `src/utils/analytics.ts`

Replace the `SELECT count(*) FROM user_events WHERE session_id = ?` call in `initializeSessionEventCount()` with a simple in-memory counter that starts at 0 per page load. The 500/1000 event throttle limits still apply per session -- they just reset on page refresh, which is fine for abuse prevention.

### 3. Purge existing low-value events from the database

**Database migration (one-time cleanup):**

```sql
DELETE FROM user_events
WHERE event_type IN ('impression', 'performance', 'hover', 'scroll');
```

This removes ~135K rows (~60% of the table), reclaiming significant storage and reducing egress from any future reads.

### 4. Trim merchant query payload

**File:** `src/hooks/useMerchants.ts`

Remove columns from the `select()` that are not used in search result cards or map markers:
- `created_at`
- `updated_at`
- `phone_number`
- `website`
- `street_address_line_2`

These fields are only needed on the individual restaurant profile page, which uses its own query.

### 5. Increase homepage carousel cache duration

**File:** `src/hooks/useHomepageCarousels.ts`

Change `staleTime` from 5 minutes to 30 minutes. Carousel data rarely changes and is already persisted to localStorage across sessions.

## What is NOT affected

- All analytics dashboards (they query `user_sessions` and `funnel_events`, not the pruned event types)
- GA4 reporting (still receives every event type)
- Search, filtering, map, and restaurant profile functionality
- Page view, click, search, and funnel tracking in Supabase

## Estimated Impact

| Change | Egress Reduction |
|--------|-----------------|
| GA4-only routing for low-value events | ~40-50% of future egress |
| Remove session count query | ~10-15% |
| Purge old low-value events | One-time: ~80 MB reclaimed |
| Trim merchant query fields | ~5-10% |
| Increase carousel staleTime | ~2-5% |
| **Total** | **~60-70% reduction** |

## Files Modified
- `src/utils/analytics.ts` -- GA4-only routing + remove session count query
- `src/hooks/useMerchants.ts` -- trim select fields
- `src/hooks/useHomepageCarousels.ts` -- increase staleTime
- One database migration -- purge old events

