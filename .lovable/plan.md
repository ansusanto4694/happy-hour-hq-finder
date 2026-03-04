

## Add "Within Neighborhood" Distance Filter for Neighborhood Pages

### Problem
Neighborhood pages default to "Nearby (0.25mi)" geo-radius from the neighborhood center, showing only ~4 of 25 merchants. The 0.25mi default was designed for GPS "locate me", not for browsing a neighborhood.

### Solution
Add a `'neighborhood'` value to `RadiusOption` that uses the DB column filter (`Merchant.neighborhood`) instead of geo-radius. This becomes the default on neighborhood pages. The `/results` page is unaffected and keeps "Nearby" as before.

### Changes

**1. `src/components/RadiusFilter.tsx`**
- Extend type: `'neighborhood' | 'blocks' | 'walking' | ...`
- `getRadiusMiles('neighborhood')` returns `0` (signals: skip geo-radius)
- `getSmartDefaultRadius`: when `locationType === 'neighborhood'` and NOT GPS, return `'neighborhood'`
- Accept optional `isNeighborhoodPage` prop; when true, replace "Nearby (within .25 miles)" with "Within neighborhood" in the radio list

**2. `src/pages/LocationLanding.tsx` (~line 390-404)**
When `selectedRadius === 'neighborhood'` and a neighborhood is active:
- Pass `undefined` for `radiusMiles` and `gpsCoordinates` (no geo filtering)
- Pass the neighborhood name to the `neighborhood` DB filter parameter
- This returns ALL merchants tagged to that neighborhood

```text
selectedRadius === 'neighborhood'
  → useMerchants(..., radiusMiles=undefined, gpsCoordinates=undefined, neighborhood=neighborhoodName)

selectedRadius === 'walking' | 'bike' | etc.
  → existing geo-radius logic (unchanged)
```

**3. `src/components/UnifiedFilterBar.tsx`**
- Accept `isNeighborhoodPage?: boolean`, pass it to `RadiusFilter`

**4. Prop drilling: `MobileListDrawer` → `MobileFilterDrawer` → `MobileFilterDrawerV2`**
- Add `isNeighborhoodPage?: boolean` prop to each, pass through to `UnifiedFilterBar`

### Entry point logic (unchanged for /results)
- `/results` page: keeps "Nearby (0.25mi)" — no `isNeighborhoodPage` prop
- `/happy-hour/{city}/{neighborhood}`: gets `isNeighborhoodPage=true`, defaults to "Within neighborhood"
- User can still manually select Walking, Bike, Drive, City-wide to expand beyond the neighborhood

