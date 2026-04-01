

## Fix: Version Query Keys to Invalidate Stale localStorage Cache

### Problem
The app persists React Query data to localStorage with a 24-hour TTL. After the bulk `match_confidence` update, users with pre-existing cached data hit a crash because the stale cached merchant data has an outdated structure or values that cause a rendering error. Incognito works because there's no cached data.

### Solution
Bump the `buster` version in the React Query persist config. This is a single-character change that forces every returning user's browser to discard old cached data and fetch fresh.

### Files Changed

| File | Change |
|------|--------|
| `src/main.tsx` | Update the `buster` string in `PersistQueryClientProvider` (e.g., `'v2'` → `'v3'`) to invalidate all existing localStorage caches |

This is a 1-line change. Once deployed, every user's browser will automatically discard stale cache and fetch fresh data — no manual cache clearing needed.

