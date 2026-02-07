

## Fix: Remove Duplicate Header in Mobile Results Drawer

**The problem:** The screenshot shows two headers stacked on top of each other, both displaying the same information (result count, location). The drawer header we just added in 1D ("Happy Hours in Queens, NY 11109") duplicates the `SearchResultsHeader` card ("Happy Hour Results / 25 restaurants found / Location: Queens, NY 11109") that sits inside the scrollable list.

**The fix:** Hide the `SearchResultsHeader` card when viewing on mobile, since the drawer header already provides all that context in a cleaner format.

**What changes:**
- On mobile, the card-style "Happy Hour Results" header disappears entirely
- The drawer header remains as the single source of context (title, result count, location, time filter, and filter button)
- On desktop, the `SearchResultsHeader` card continues to display as it does today (no change)

**What stays the same:**
- Desktop results page is completely unaffected
- The drawer header styling from 1D stays as-is
- All filter functionality remains intact

---

### Technical Details

**File: `src/components/SearchResults.tsx`**

Conditionally skip rendering the `SearchResultsHeader` when `isMobile` is `true`. Change the block at lines 226-236 from always rendering the header to only rendering it on desktop:

```tsx
{!isMobile && (
  <SearchResultsHeader 
    resultsCount={totalResults}
    startTime={startTime}
    endTime={endTime}
    location={location}
    currentPage={validatedPage}
    totalPages={totalPages}
    resultsPerPage={RESULTS_PER_PAGE}
    searchTerm={searchTerm}
    isMobile={false}
  />
)}
```

This is a single, clean change -- one conditional wrapper around the existing header. No other files need to change.

