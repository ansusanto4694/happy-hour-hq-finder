

## Fix: Separate Cache Keys for Display vs Manager

### Problem
The happy hour display (public profile) and the manager (edit modal) share the same React Query key `['happy-hour-deals', restaurantId]`. When you visit the profile page, the display component caches its result first. The manager then reads that cached data instead of fetching fresh data with `select('*')`. This causes `menu_type` (and potentially other fields) to appear incorrectly.

### Solution
Give each query its own unique cache key so they never collide:

| File | Change |
|------|--------|
| `src/components/HappyHourDealsDisplay.tsx` | Change query key to `['happy-hour-deals-display', restaurantId]` |
| `src/components/happy-hour-deals/hooks/useHappyHourDeals.ts` | Change query key to `['happy-hour-deals-manage', restaurantId]` and update all `invalidateQueries` calls to match |

This is a 2-file, ~10-line change. No logic changes needed — just key renaming to prevent cache collisions permanently.

