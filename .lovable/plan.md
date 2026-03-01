

## Conditional Empty State Messaging

### Problem
Currently, the empty results message always shows "We aren't in your neighborhood yet!" regardless of whether merchants exist in the searched area. We need two distinct messages:

1. **Merchants exist in the area but filters/criteria excluded them** -- "No results found for your given search criteria. Please try another search or browse around!"
2. **No merchants exist in the searched location at all** -- Keep current "We aren't in your neighborhood yet!" message with email link.

### Approach
Determine whether the location itself has merchants by running a lightweight "area check" query alongside the main filtered query. Pass this information down to the empty state component.

### Changes

**1. `src/hooks/useMerchants.ts`**
- Modify the return value to include metadata: instead of returning just the filtered array, return `{ merchants, totalInArea }` -- or more simply, add a second small hook.
- **Better approach**: Create a simple helper hook `useMerchantsInArea` that counts active merchants within the location/radius (no time, day, category, search, or menu filters). This keeps the existing hook untouched.
- Actually, simplest: just add a second query inside `Results.tsx` using the existing supabase client -- a minimal count query filtered only by location/radius.

**On reflection, the cleanest approach**: Pass a `hasLocalMerchants` boolean prop through `SearchResults` to `SearchResultsEmpty`. Compute it in `Results.tsx` by checking if any active filters are applied. If the main query returns 0 results AND no filters are active (no search term, no time, no day, no category, no offers, no menu type), it means the area truly has no merchants. If filters ARE active and results are 0, merchants likely exist but were filtered out.

**Even simpler (no extra query needed)**: The `useMerchants` hook applies filters in stages. We can detect "area has merchants" by checking whether active filters exist. If the user searched a location with filters and got 0 results, show the "try another search" message. If they searched a location with NO filters and got 0 results, show "not in your neighborhood."

**2. `src/components/SearchResultsEmpty.tsx`**
- Add a `hasFiltersApplied` prop (boolean).
- If `true`: Show "No results found for your given search criteria. Please try another search or browse around!"
- If `false`: Show current "We aren't in your neighborhood yet!" message with email link.

**3. `src/components/SearchResults.tsx`**
- Accept and pass through the new `hasFiltersApplied` prop to `SearchResultsEmpty`.

**4. `src/pages/Results.tsx`**
- Compute `hasFiltersApplied` by checking if any of these are active: `searchTerm`, `startTime`, `endTime`, `selectedDays`, `selectedCategories`, `showOffersOnly`, `menuType !== 'all'`, `happeningNow`, `happeningToday`.
- Pass it to `SearchResults`.

### Technical Details

The "filters applied" check in `Results.tsx`:
```text
const hasFiltersApplied = Boolean(
  searchTerm ||
  currentStartTime ||
  currentEndTime ||
  (effectiveDays.length > 0) ||
  (selectedCategories.length > 0) ||
  showOffersOnly ||
  (selectedMenuType !== 'all') ||
  happeningNow ||
  happeningToday
);
```

This avoids any extra database queries and covers the two scenarios correctly:
- User searches "10001" with no filters, 0 results -- area has no merchants -- "not in your neighborhood"
- User searches "Williamsburg" with "oysters" filter, 0 results -- area has merchants but criteria didn't match -- "try another search"

