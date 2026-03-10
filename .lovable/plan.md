

# Fix: Preserve map position across restaurant profile navigation

## Problem
When a user searches without a location (no GPS, no typed location), the map defaults to Upper West Side (40.7831, -73.9712). If they pan the map, click a restaurant, then go back, the Results page remounts and the map resets to UWS because `mapViewState` is stored in React component state (lost on unmount).

With GPS enabled, the URL contains `lat`/`lng` params that re-center the map correctly on back-navigation — which is why it "works" after enabling location services.

## Solution

Persist the map's current view (latitude, longitude, zoom) in `sessionStorage` so it survives component remounts during back-navigation.

### Changes

**`src/pages/Results.tsx`**
1. On mount, initialize `mapViewState` from `sessionStorage` if available, otherwise fall back to URL GPS coords or the UWS default.
2. When `mapViewState` changes (user pans/zooms), write the new position to `sessionStorage`.
3. This is a lightweight change — no new components, no URL param additions, just ~15 lines of code.

```text
Flow:
  User searches → Results mounts → map renders at default/GPS position
  User pans map → mapViewState updates → sessionStorage updated
  User clicks restaurant → navigates to /restaurant/:id
  User hits back → Results remounts → reads sessionStorage → map restores position
```

### Why sessionStorage
- Survives same-tab navigation (back/forward) but clears on tab close — appropriate for ephemeral map state.
- No URL clutter with lat/lng/zoom params.
- No external dependencies.

### Scope
- One file changed: `src/pages/Results.tsx`
- ~15 lines added
- No risk to existing functionality — pure additive with fallback to current defaults

