

## Fix: Add Loading Indicators for Initial Search Results

### The Problem

When you submit a search from the homepage and land on the Results page, there's a jarring flash of empty content before data arrives. This happens because `isLoading` is `true` during the initial fetch, but the page layout doesn't account for it in several places:

**Mobile:**
- The map renders immediately with an empty restaurant array -- showing a blank map with zero markers
- The peek handle at the bottom shows "0 results" instead of a loading indicator
- The list drawer's skeletons only show if the drawer is already open

**Desktop/Tablet:**
- The `SearchResults` component correctly shows skeleton cards (this part works)
- But the map panel renders with an empty array -- showing an empty map card with no markers and no visual indication that data is loading

### The Fix

**File: `src/pages/Results.tsx`**

1. **Mobile map area (lines 428-444):** Wrap the map in a conditional. When `isLoading` is true, show a full-screen loading skeleton (pulsing gray background with a centered spinner and "Finding happy hours..." text) instead of the empty map. Once data arrives, the real map renders with markers.

2. **Mobile peek handle (lines 446-477):** When `isLoading` is true, change the text from "0 results" to a loading indicator like "Searching..." with a small spinner icon, so users see immediate feedback.

3. **Desktop/Tablet map panels (lines 562-575 and 627-641):** Pass `isLoading` to `LazyResultsMap` so it can show a loading state when data hasn't arrived yet.

**File: `src/components/LazyResultsMap.tsx`**

4. **Add `isLoading` prop:** Accept an optional `isLoading` boolean and pass it through to `ResultsMap`. Also use it to show a data-loading fallback (distinct from the JS-bundle Suspense fallback). When `isLoading` is true and restaurants is empty, show a skeleton map state with a spinner overlay saying "Finding restaurants..."

**File: `src/components/ResultsMap.tsx`**

5. **Add `isLoading` prop to the component and its memo comparator:** When `isLoading` is true and the restaurants array is empty, render a loading overlay on top of the map (or instead of the empty map). This avoids showing a fully interactive but empty map.

### User Experience Before vs After

**Before:**
- Submit search from homepage
- See a blank map with no markers + "0 results" text at the bottom
- After 1-2 seconds, markers suddenly pop in and the count updates
- Feels broken or slow

**After:**
- Submit search from homepage
- **Mobile:** See a subtle loading state with a spinner and "Finding happy hours..." text where the map will be. The peek handle shows "Searching..." instead of "0 results"
- **Desktop:** See skeleton cards in the results panel (already works) + a loading overlay on the map panel with a spinner
- After 1-2 seconds, the real map with markers smoothly appears and the results list populates
- Feels responsive and intentional

### Technical Details

The changes are localized to 3 files:

```text
Results.tsx        - Conditional rendering for mobile map/peek handle during loading
LazyResultsMap.tsx - Accept and forward isLoading prop; show data-loading fallback  
ResultsMap.tsx     - Accept isLoading prop; add to memo comparator
```

No new dependencies. No database changes. The existing `SearchResultsLoading` skeleton component for the list view already works correctly and is not modified.

The loading state uses the same visual language (Loader2 spinner, muted backgrounds, skeleton-like appearance) already established by `MapLoadingFallback` and `SearchResultsLoading` for consistency.

