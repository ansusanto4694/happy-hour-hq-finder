

## Fix UnifiedFilterBar: Add City-wide Radius Option and Smart "Clear All"

### Problem

Two issues exist in the `UnifiedFilterBar` component after the smart default radius feature was implemented:

1. **Missing "City-wide" option**: The `RADIUS_OPTIONS` array only has 4 options (blocks, walking, bike, drive) but the smart default can select `city` (25 miles). When `city` is active, no radio button appears checked in the Distance filter -- the UI is out of sync with the actual filter state.

2. **Hardcoded "Clear All" reset**: The `clearAllFilters` function always resets the radius to `walking` (1 mile). If the user searched for "New York" (city-level), clearing filters should reset back to "City-wide (25 miles)" -- the smart default for that location type -- not to "walking".

3. **Incorrect "has filters" detection**: The `hasAnyFilters` check compares radius against `walking` as the baseline. So when the smart default is `city`, the filter bar incorrectly shows the "Clear All" button even when nothing has been manually changed.

### Changes

**File: `src/components/UnifiedFilterBar.tsx`**

1. **Add `city` to `RADIUS_OPTIONS` array** (line 39-44): Add `{ value: 'city', label: 'City-wide (within 25 miles)' }` so the radio button renders when the smart default or manual selection is "city".

2. **Add `locationType` prop** to the component interface: This allows the component to compute the smart default radius for "Clear All" behavior. The prop is optional (defaults to `null`).

3. **Import `getSmartDefaultRadius` and `inferLocationTypeFromInput`** from `RadiusFilter.tsx` to compute the smart default within the component.

4. **Fix `clearAllFilters`** (line 219): Replace the hardcoded `onRadiusChange('walking')` with `onRadiusChange(smartDefault)` where `smartDefault` is computed from the `locationType` prop.

5. **Fix `hasAnyFilters`** (line 234): Replace the hardcoded `selectedRadius !== 'walking'` check with `selectedRadius !== smartDefault` so the "Clear All" button only appears when the user has actually changed something from the default.

**File: `src/pages/Results.tsx`**

6. **Pass `locationType` prop** to both `UnifiedFilterBar` instances (tablet on line 520 and desktop on line 583): Pass `locationTypeParam || inferLocationTypeFromInput(locationParam)` so the filter bar knows the current location context.

**File: `src/components/MobileFilterDrawerV2.tsx`**

7. No changes needed -- it passes through all props from the parent, and the `UnifiedFilterBar` will handle the logic internally with the new `locationType` prop.

**File: `src/components/MobileListDrawer.tsx`**

8. **Pass `locationType` prop** through to `UnifiedFilterBar` if it renders one (need to verify). If the mobile list drawer renders the filter bar, it also needs the `locationType`.

### Technical Details

The new `locationType` prop flows like this:

```text
URL param "locationType" 
  -> Results.tsx reads it 
  -> passes to UnifiedFilterBar as prop
  -> UnifiedFilterBar computes smartDefault = getSmartDefaultRadius(locationType, useGPS)
  -> Uses smartDefault for "Clear All" reset and "has filters" detection
```

The `RADIUS_OPTIONS` constant becomes:

```text
blocks  -> Nearby (within .25 miles)
walking -> Walking (within 1 mile)
bike    -> Bike (within 3 miles)
drive   -> Drive (within 5 miles)
city    -> City-wide (within 25 miles)
```

This is a small, focused fix -- 3-4 files, no new dependencies, no database changes.

