# Phase 1 — Backend foundation: `near_me_now` action

Scope is intentionally narrow: **edge function only, no frontend touched**. Goal is to ship a verifiable data layer before any UI is built on top.

## What gets built

### 1. New action in `supabase/functions/merchant-api/index.ts`

Add a `near_me_now` case to the existing action switch. Reuses the existing CORS, rate-limit, UA-block, and service-role client infrastructure already in the file.

**Request shape:**
```json
{
  "action": "near_me_now",
  "params": {
    "lat": 40.7338,
    "lng": -74.0027,
    "nowIso": "2026-04-26T20:30:00-04:00"   // optional, defaults to server now
  }
}
```

**Response shape:**
```json
{
  "data": {
    "pouring_now":   [ { merchant, distance_mi, ... } ],
    "starting_soon": [ { event, merchant, distance_mi, starts_in_min, ... } ],
    "tonight":       [ { event, merchant, distance_mi, start_time, ... } ],
    "radius_used":   { "now_soon": 1, "tonight": 5 },
    "expanded":      false
  }
}
```

### 2. Bucket logic

**`pouring_now`** — Active happy hours right now
- Query `merchant_happy_hour` joined to active `Merchant` where `day_of_week` = current ET weekday and current ET time is between `happy_hour_start` and `happy_hour_end`
- Filter merchants by Haversine distance ≤ radius (start 1mi)
- Sort: distance ascending
- Limit 20

**`starting_soon`** — One-time events starting in the next 120 minutes
- Query `merchant_events` where `event_type = 'one_time'`, `is_active = true`, `event_date` is today (ET), and `start_time` is between `now` and `now + 120min` ET
- Join to active `Merchant`, filter by Haversine ≤ radius
- Sort: `start_time` ascending, then distance
- Limit 20

**`tonight`** — One-time events starting later tonight, capped at 2:00 AM ET cutoff
- Query `merchant_events` where `event_type = 'one_time'`, `is_active = true`, and the event's start datetime falls between `now + 120min` and the next 2:00 AM ET boundary
- Join to active `Merchant`, filter by Haversine ≤ **fixed 5mi**
- Sort: `start_time` ascending
- Limit 30

### 3. Adaptive radius (Now/Soon only)

```
radius = 1mi
fetch pouring_now + starting_soon
if combined.length < 5:
  radius = 2mi
  refetch
if combined.length < 5:
  radius = 5mi
  refetch
return with radius_used.now_soon = final radius
       expanded = (radius > 1)
```

`tonight` always uses fixed 5mi — runs in parallel, not part of the adaptive loop.

### 4. Distance calculation

In-function Haversine (no DB extension needed):
```ts
function haversineMi(lat1, lng1, lat2, lng2): number
```
Pulled coordinates from `Merchant.latitude` / `Merchant.longitude` after a coarse bounding-box prefilter (`gte/lte` on lat/lng) to avoid scanning the full table. Bounding box is computed from radius using ~69mi/deg lat and `cos(lat) * 69mi/deg` lng.

### 5. ET time handling

Reuse the established Eastern Time -5h offset convention (per `mem://analytics/date-filtering-context`). All "today", "tonight", "2am cutoff" calculations done in ET, then converted back to UTC for the SQL filter on `merchant_events.event_date`.

### 6. Input validation

- `lat`: number, -90 to 90
- `lng`: number, -180 to 180
- `nowIso`: optional ISO string; if invalid, fall back to server `Date.now()`
- Reject with 400 + clear field errors on validation failure

## What does NOT change

- No frontend files touched
- No new tables, no migrations
- No new components, no new hooks
- Existing `search`, `get`, `carousels`, `deals`, `ratings`, `categories_with_merchants` actions untouched
- No analytics events wired (Phase 4)

## Verification (built into this phase)

After deploy, run `supabase--curl_edge_functions` against `/merchant-api` with three NYC test coordinates and verify the response by inspection:

| Test | Coordinates | Neighborhood | Expectation |
|---|---|---|---|
| 1 | `40.7338, -74.0027` | West Village | Dense — should return at 1mi without expansion |
| 2 | `40.6782, -73.9442` | Crown Heights | Mid-density — may expand to 2mi |
| 3 | `40.7282, -73.9942` | East Village late night | Confirm `tonight` populates and respects 2am cutoff |

For each test, manually verify:
- ✅ Three buckets present in response
- ✅ `radius_used` and `expanded` flags reflect the adaptive logic
- ✅ Distances are reasonable (no >5mi results in tonight, no >5mi in now/soon)
- ✅ Sort order is correct (distance for pouring_now, time for events)
- ✅ Inactive merchants/events excluded
- ✅ Validation: bad lat/lng returns 400
- ✅ Performance: response < 1.5s

If anything is off, fix in this phase before moving to Phase 2.

## Files modified

- **Edit**: `supabase/functions/merchant-api/index.ts` (add `handleNearMeNow` + Haversine helper + ET helpers + switch case)

That's the entire change set for Phase 1. One file. ~200 lines added.

## What comes next (not in this phase)

- **Phase 2**: `useNearMeLocation` hook + `LocationStrip` / `LocationEditSheet` / `LocationPrompt` components, mounted to a debug surface
- **Phase 3**: `useNearMeNow` + `LiveFeedRow` + `AFrameCard`, mounted below existing hero
- **Phase 4**: Cutover + `DiscoveryChips` + analytics + RecentlyViewed reordering
