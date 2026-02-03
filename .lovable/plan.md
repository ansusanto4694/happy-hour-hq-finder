

# N+1 Query Optimization Plan

## Summary

This plan eliminates N+1 query patterns in the search results flow. The current implementation is already **well-optimized** for the main merchant query, but there are **two optimization opportunities** that provide **pure performance gains with zero functionality loss**.

---

## Current State Analysis

### What's Already Optimized (No Changes Needed)

The `useMerchants.ts` hook already uses **nested selects** to fetch related data in a single query:

```sql
SELECT ... FROM Merchant
  LEFT JOIN merchant_happy_hour
  LEFT JOIN happy_hour_deals
  LEFT JOIN merchant_categories -> categories
  LEFT JOIN merchant_offers
  LEFT JOIN merchant_reviews -> merchant_review_ratings
```

This fetches all data for 30+ merchants in **1 database call** - excellent implementation.

### Identified N+1 Patterns

| Issue | Impact | Location |
|-------|--------|----------|
| **useFavorites** fetches all favorites on every render | 1 query per page load (acceptable) | `useFavorites.ts` |
| **useMerchantRating** - individual queries per merchant | N queries if used in lists | `useMerchantRating.ts` |
| **Location normalization** - edge function calls | 1-4 queries for cache miss | `useMerchants.ts` |

---

## Tradeoffs Analysis

### Pure Optimizations (No Functionality Loss)

1. **Remove `useMerchantRating` from SearchResultCard**
   - Rating data is already included in the main query via `merchant_reviews.merchant_review_ratings`
   - The hook exists for the RestaurantProfile page (where it's appropriate)
   - SearchResultCard already calculates ratings from the nested data
   - **Result**: Zero additional queries, same functionality

2. **Pre-warm location cache for common searches**
   - Currently, a cache miss triggers an edge function call
   - We can pre-populate common locations (NYC neighborhoods, major cities)
   - **Result**: Fewer edge function invocations, same functionality

### Already Optimized (No Changes Needed)

1. **Favorites**: The `useFavorites` hook fetches once per user session and caches the result. React Query prevents duplicate fetches.

2. **Main merchant query**: Uses efficient nested selects - no N+1 pattern.

---

## What We're NOT Changing

After analyzing the code, I found that the implementation is already well-architected:

- `SearchResultCard` does NOT call `useMerchantRating()` - it calculates ratings locally from pre-fetched data
- The main query in `useMerchants.ts` is already batched with proper nested selects
- React Query's caching prevents redundant fetches

---

## Recommended Optimizations

### 1. Location Cache Pre-warming (Optional Enhancement)

**Current behavior**: When a user searches "East Village, NY" for the first time:
1. Check `location_cache` table (1 query)
2. If miss, call `normalize-location` edge function (slow)

**Proposed**: Add common locations to the cache proactively via a seed script.

### 2. Code Cleanup: Remove Unused `useMerchantRating` Import Check

Verify that `useMerchantRating` is not being called from within list views. If found, replace with the pre-fetched data pattern already used in `SearchResultCard`.

---

## Implementation Plan

### Phase 1: Audit for Hidden N+1 Patterns ✅ COMPLETED

| File | Check | Status |
|------|-------|--------|
| `SearchResultCard.tsx` | Confirm no `useMerchantRating` call | ✅ Already optimal |
| `MobileCarouselCard.tsx` | Check for individual rating fetches | ✅ Fixed |
| `CarouselCard.tsx` | Check for individual rating fetches | ✅ Fixed |
| `MerchantMapPreviewCard.tsx` | Check for individual rating fetches | ✅ No rating display |

### Phase 2: Fix Any Discovered Issues ✅ COMPLETED

Changes made:
1. **useHomepageCarousels.ts**: Added `merchant_reviews` with nested `merchant_review_ratings` to the query
2. **MobileCarouselCard.tsx**: Replaced `useMerchantRating` hook with local `useMemo` calculation
3. **CarouselCard.tsx**: Replaced `useMerchantRating` hook with local `useMemo` calculation

### Phase 3: Location Cache Optimization (Lower Priority)

Seed the `location_cache` table with common NYC neighborhoods and major cities to reduce edge function calls.

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Queries per search | 1-4 | 1 |
| Edge function calls | 1 per new location | 0 for common locations |
| Code changes | - | Minimal (audit + potential cleanup) |
| Functionality loss | - | None |

---

## Technical Details

### Current Rating Calculation in SearchResultCard (Already Optimal)

```typescript
// Lines 32-52 - calculates from pre-fetched data
const ratingData = useMemo(() => {
  const reviews = restaurant.merchant_reviews?.filter((r: any) => r.status === 'published') || [];
  if (reviews.length === 0) return null;
  
  let totalSum = 0;
  let totalCount = 0;
  
  reviews.forEach((review: any) => {
    review.merchant_review_ratings?.forEach((r: { rating: number }) => {
      totalSum += r.rating;
      totalCount += 1;
    });
  });
  
  // ... returns calculated average
}, [restaurant.merchant_reviews]);
```

This pattern should be replicated in any other card components if they're making individual rating queries.

---

## Conclusion

The search results flow is **already well-optimized**. The main improvement opportunity is:

1. **Audit other card components** to ensure they follow the same pattern as `SearchResultCard`
2. **Pre-warm location cache** to reduce edge function calls for common searches

Both are pure optimizations with no functionality tradeoffs.

