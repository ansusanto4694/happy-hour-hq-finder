

## Fix: Neighborhood search on `/results` returns all results

### Problem
`getSmartDefaultRadius` returns `'neighborhood'` for any neighborhood-type location, including `/results`. This sets `radiusMiles=0` (falsy), which skips geo-filtering entirely. The `'neighborhood'` option should only apply on the `LocationLanding` page.

### Changes

| File | Change |
|---|---|
| **`src/components/RadiusFilter.tsx`** | Add optional 3rd param `isNeighborhoodPage = false` to `getSmartDefaultRadius`. In the neighborhood/locality case: return `'neighborhood'` only when `isNeighborhoodPage` is true; otherwise return `'blocks'` (0.25mi geo-radius). |
| **`src/pages/LocationLanding.tsx`** (line 181) | Pass `true` as the 3rd arg: `getSmartDefaultRadius(locationTypeForRadius, false, true)` |
| **`src/pages/Results.tsx`** (line 37) | No change needed — defaults to `false`, gets `'blocks'` for neighborhood searches. |
| **`src/components/UnifiedFilterBar.tsx`** (line 93) | Pass `isNeighborhoodPage` prop through: `getSmartDefaultRadius(locationType, useGPS, isNeighborhoodPage)` |
| **`src/components/MobileFilterDrawer.tsx`** (line 67) | Same: `getSmartDefaultRadius(locationType ?? null, useGPS, isNeighborhoodPage)` |

### Result
- `/results?locationType=Neighborhood` → defaults to `'blocks'` (0.25mi geo-radius), same as before the neighborhood feature
- `/happy-hour/new-york/long-island-city` → defaults to `'neighborhood'` (DB column filter, shows all tagged merchants)
- User can still manually change radius on either page

