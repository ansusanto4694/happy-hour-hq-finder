
## Fix Empty State: Check Area Merchant Count

### Problem
The current `hasFiltersApplied` approach is incorrect. Searching "Whiskey" in zip code 94112 (San Francisco) shows "No results found for your given search criteria" because the search term is considered a filter. The correct behavior: since we have **zero** merchants in 94112 at all, it should show "We aren't in your neighborhood yet!"

### Correct Approach
Run a **second lightweight query** that checks if any active merchants exist in the searched location/radius -- with no search term, no category, no time, no day, or other filters applied. Compare:

- **Area query returns 0** -> "We aren't in your neighborhood yet!"
- **Area query returns >0 but filtered query returns 0** -> "No results found for your given search criteria."

### Changes

**1. `src/pages/Results.tsx`**
- Add a second `useMerchants` call with ONLY location/radius parameters (no `searchTerm`, no `categoryIds`, no time filters, no `showOffersOnly`, no `selectedDays`, no `menuType`).
- Compute `hasLocalMerchants = (areaMerchants?.length ?? 0) > 0`.
- Replace the current `hasFiltersApplied` logic with `hasLocalMerchants`.
- Pass `hasLocalMerchants` (instead of `hasFiltersApplied`) to `SearchResults` and `MobileListDrawer`.
- Remove the duplicate `onSortChange={setSortBy}` lines introduced in the last diff.

The second query call:
```text
const { data: areaMerchants } = useMerchants(
  undefined,   // no categories
  undefined,   // no search term
  undefined,   // no start time
  undefined,   // no end time
  location,    // same location
  bounds,      // same bounds (if map search)
  radiusMiles, // same radius
  false,       // no offers filter
  undefined,   // no days
  gpsCoordinates, // same GPS
  undefined,   // no carousel
  undefined,   // no neighborhood
  'all'        // no menu type filter
);
```

This reuses the existing `useMerchants` hook and its caching. The query is lightweight because it skips all the search/filter sub-queries.

**2. `src/components/SearchResults.tsx`**
- Rename prop from `hasFiltersApplied` to `hasLocalMerchants` (boolean).
- Pass it through to `SearchResultsEmpty`.

**3. `src/components/SearchResultsEmpty.tsx`**
- Rename prop from `hasFiltersApplied` to `hasLocalMerchants`.
- If `hasLocalMerchants` is true and results are empty: show "No results found for your given search criteria."
- If `hasLocalMerchants` is false: show "We aren't in your neighborhood yet!"

**4. `src/components/MobileListDrawer.tsx`**
- Rename prop from `hasFiltersApplied` to `hasLocalMerchants`.

### Why This Works
- Search "Whiskey" + 94112: Area query finds 0 merchants in 94112 -> "Not in your neighborhood"
- Search "Oysters" + Williamsburg: Area query finds 69 merchants -> filtered query returns 0 -> "No results for criteria"
- Search Williamsburg with no filters: Area query finds 69, filtered also finds 69 -> results shown normally

### Bug Fix
The last diff introduced duplicate `onSortChange={setSortBy}` props in two places in `Results.tsx`. These will be removed.
