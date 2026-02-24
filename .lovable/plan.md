

## Add Sort by Rating and Review Count

### Goal
Add a sort dropdown to both desktop and mobile results views, allowing users to sort merchants by "Highest Rated" or "Most Reviewed", with a "Default" option to return to the original order.

### How It Works
- Sort state is stored as a URL parameter (`sortBy`) so it persists across navigation
- Sorting happens client-side on the already-fetched merchant array -- no backend changes needed
- Rating logic mirrors what `SearchResultCard` already computes: native review average first, Google rating as fallback
- Review count uses native review count first, Google review count as fallback

### Changes

**1. `src/pages/Results.tsx`** -- Sort state and logic
- Read `sortBy` from URL search params (values: `default`, `highest_rated`, `most_reviewed`)
- Add a `setSortBy` helper that updates the URL param
- Add a `sortMerchants()` function that sorts the merchants array based on the selected option
- Pass sorted merchants (instead of raw) to `SearchResults`, `MobileListDrawer`, and the map
- Pass `sortBy` and `setSortBy` down to `SearchResultsHeader` (desktop) and `MobileListDrawer` (mobile)
- Add `sortBy` to the `handleClearAllFilters` cleanup list

**2. `src/components/SearchResultsHeader.tsx`** -- Desktop sort dropdown
- Add `sortBy` and `onSortChange` props
- Render a `Select` dropdown (using existing Radix Select component) next to the results count
- Options: "Default", "Highest Rated", "Most Reviewed"

**3. `src/components/MobileListDrawer.tsx`** -- Mobile sort control
- Add `sortBy` and `onSortChange` props
- Render the same sort `Select` dropdown in the drawer header, next to the existing filter button

**4. `src/components/SearchResults.tsx`** -- Memo comparison update
- Add `sortBy` to the memo comparison so re-renders happen when sort changes

### Sort Logic Detail
```text
Highest Rated:
  For each merchant, compute effective rating:
    1. Native: average of all merchant_review_ratings across published reviews
    2. Fallback: google_rating (if match_confidence != 'no_match')
    3. No rating: treated as 0
  Sort descending by effective rating

Most Reviewed:
  For each merchant, compute effective review count:
    1. Native: count of published merchant_reviews
    2. Fallback: google_review_count (if match_confidence != 'no_match')
    3. No reviews: treated as 0
  Sort descending by effective count
```

### UI Layout

Desktop: Sort dropdown appears in the `SearchResultsHeader` card, right-aligned on the same row as the results count.

Mobile: Sort dropdown appears in the `MobileListDrawer` header row, between the title and the filter button.

