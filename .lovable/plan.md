

## Fix: Pass atomic clear callback to UnifiedFilterBar inside the mobile drawer

### Root Cause
The `MobileFilterDrawerV2` component renders `UnifiedFilterBar` but does NOT pass the `onClearAllFilters` prop to it. This means:

- The UnifiedFilterBar's own "Clear All" button (in its card header) falls back to calling individual setters one-by-one
- Each setter creates a new `URLSearchParams` from a stale snapshot, overwriting the previous setter's changes
- Result: filters visually remain active because only the last setter's URL update "wins"

### The Fix (single line addition)
In `src/components/MobileFilterDrawerV2.tsx`, add `onClearAllFilters` to the `UnifiedFilterBar` props (around line 191):

```
onClearAllFilters={onClearAllFilters}
```

This ensures that when the user taps "Clear All" (whether the inline button inside UnifiedFilterBar or the sticky bottom button), the atomic `handleClearAllFilters` from `Results.tsx` is used -- performing a single `setSearchParams` call that removes all filter keys at once.

### Files Changed
- `src/components/MobileFilterDrawerV2.tsx` -- add one prop to the UnifiedFilterBar render

### Why this works
- `Results.tsx` already has the correct atomic `handleClearAllFilters` that deletes all filter params in one URL update
- `MobileFilterDrawer.tsx` already forwards `onClearAllFilters` to `MobileFilterDrawerV2`
- `MobileFilterDrawerV2` already receives `onClearAllFilters` as a prop
- The only missing link is passing it down to the `UnifiedFilterBar` component rendered inside the drawer

### Verification
After the fix:
1. Open mobile filter drawer with active filters (categories + days)
2. Tap "Clear All" (either button)
3. All visual cues should reset immediately
4. URL should no longer contain `categories`, `days`, or other filter params
5. Results count should update to show unfiltered total

