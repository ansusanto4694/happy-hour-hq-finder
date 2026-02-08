

## Smart Default Radius Based on Location Type

### The Problem

When a user searches for "230 Fifth" in "New York, New York, United States", they get 0 results because:

1. The location geocodes to downtown Manhattan (~40.71, -74.01)
2. 230 Fifth Rooftop Bar is at (~40.74, -73.99) -- about 2 miles away
3. The default radius is always "walking" (1 mile), which excludes the result
4. The user has to manually discover and change the radius filter to get results

This is a poor experience for city-level searches. Yelp and Google solve this by dynamically adjusting the search area based on how specific the location input is.

### The Solution

The location autocomplete system already classifies each suggestion into a **location type** (City, Neighborhood, ZIP Code, etc.) via the Mapbox API. We just need to:

1. **Propagate** that location type through the URL when searching
2. **Use it** to pick a smart default radius on the results page
3. **Let users override** with the existing filter (their manual choice always wins)

### Smart Defaults

| Location Type | Default Radius | Why |
|---|---|---|
| Neighborhood | 1 mile (walking) | Small area, nearby results expected |
| ZIP Code | 3 miles (bike) | ZIP codes are compact, but adjacent areas are relevant |
| City / Borough | 25 miles | Covers the full metro area (all of NYC, etc.) |
| GPS (Locate Me) | 1 mile (walking) | User is physically there, want nearby spots |
| Unknown / manual input | 5 miles (drive) | Generous fallback |

For reference, "walking" (1 mile) today misses 230 Fifth because it's 2 miles from the geocoded NYC center. With 25 miles for cities, every merchant in the NYC metro area will appear. The user can always tighten it using the filter bar.

### How It Works (User Perspective)

**Before**: Search "230 Fifth" in "New York" → 0 results → confused → manually change distance to "Drive" → see results

**After**: Search "230 Fifth" in "New York" → auto-selects generous city radius → results appear immediately → user can optionally tighten the radius filter

The distance filter in the sidebar still works as normal. If the user manually picks a radius, their choice sticks (saved in URL). The smart default only applies when no explicit choice has been made.

### Technical Details

**Files to modify:**

**1. `src/components/SearchBar.tsx`** (Desktop search bar)
- Track the `location_type` from the selected suggestion in component state
- When a location suggestion is selected, store its `location_type` (e.g., "City", "Neighborhood", "ZIP Code")
- In `handleSearch`, include `locationType` as a URL parameter
- Also detect ZIP code pattern (5 digits) for manually typed locations without suggestion selection

**2. `src/components/MobileSearchBar.tsx`** (Mobile homepage search)
- Same changes as SearchBar: track `location_type` from suggestion selection
- Pass `locationType` in URL params during `handleSearch`

**3. `src/components/MobileResultsSearchBar.tsx`** (Mobile results page search)
- Same changes as above: track and propagate `location_type`

**4. `src/pages/Results.tsx`** (Results page -- main logic change)
- Read `locationType` from URL params
- Change the default radius logic: if user has NOT explicitly set a `radius` param, compute a smart default from `locationType`
- The existing `selectedRadius` will reflect the smart default, so the filter bar UI stays consistent
- Map: city → 25 miles, neighborhood → 1 mile, zipcode → 3 miles, gps → 1 mile, default → 5 miles

**5. `src/components/RadiusFilter.tsx`**
- Add a new helper function `getSmartDefaultRadius(locationType, useGPS)` that returns the appropriate `RadiusOption`
- Extend `getRadiusMiles` to handle a new `'city'` option (25 miles) for city-level searches
- Add the "City-wide" option to the radius options list so users can see what's selected

**6. `src/hooks/useLocationSuggestions.ts`**
- No changes needed -- already provides `location_type` on each suggestion

**7. `supabase/functions/location-suggestions/index.ts`**
- No changes needed -- already classifies suggestions as City/Neighborhood/ZIP Code/etc.

### Edge Cases Handled

- **User types location manually** (no suggestion selected): detect ZIP code via regex (5-digit pattern), default everything else to "drive" (5 miles) as a safe fallback
- **User uses GPS / Locate Me**: defaults to "walking" (1 mile) since they are physically present
- **User manually changes radius**: their choice is saved in URL and always takes priority over the smart default
- **"Clear All" filters**: resets to the smart default for the current location type (not back to 1 mile)
- **No location provided**: radius filter is disabled (existing behavior, unchanged)

