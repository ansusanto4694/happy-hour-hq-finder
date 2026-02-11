

# Make Recently Viewed Carousel Consistent with Other Carousels

## Problem

The `RecentlyViewedCarousel` component duplicates the carousel wrapper logic (header, navigation buttons, scroll container) instead of reusing the existing `HomepageCarousel` and `MobileCarousel` components. While both use the same card components (`CarouselCard` / `MobileCarouselCard`), the surrounding structure is reimplemented inline, creating maintenance burden and subtle styling differences.

Additionally, the Recently Viewed data stored in localStorage is missing `merchant_reviews`, so those cards cannot display star ratings like the other carousels do.

## Plan

### Step 1: Add review data to the Recently Viewed storage

Update `useRecentlyViewed.ts`:
- Add `merchant_reviews` to the `RecentlyViewedMerchant` interface
- Update `addRecentlyViewed` to accept and store review data
- This allows recently viewed cards to show star ratings, matching the other carousels

### Step 2: Store review data when visiting a merchant profile

Update the call site in `RestaurantProfile.tsx` (or wherever `addRecentlyViewed` is called) to pass `merchant_reviews` data along with the other merchant fields.

### Step 3: Refactor RecentlyViewedCarousel to reuse existing carousel wrappers

Reshape the recently viewed data to match the `HomepageCarousel` type structure, then pass it directly to the existing `HomepageCarousel` (desktop) and `MobileCarousel` (mobile) components. The only differences:
- No "View All" button (since there are only up to 10 items)
- The title is "Recently Viewed" instead of a database-driven name

To handle this cleanly, add an optional `hideViewAll` prop to `HomepageCarousel` and `MobileCarousel`, then delete the standalone `RecentlyViewedCarousel.tsx` component entirely.

### Step 4: Update homepage to use the refactored component

Update `Index.tsx` to pass the recently viewed data through the shared carousel components instead of rendering `RecentlyViewedCarousel` directly.

## Technical Details

**Files to modify:**
- `src/hooks/useRecentlyViewed.ts` — add `merchant_reviews` to the stored type
- `src/components/HomepageCarousel.tsx` — add optional `hideViewAll` prop
- `src/components/MobileCarousel.tsx` — add optional `hideViewAll` prop
- `src/pages/RestaurantProfile.tsx` — pass review data to `addRecentlyViewed`
- `src/pages/Index.tsx` — replace `RecentlyViewedCarousel` usage with shared carousel

**Files to delete:**
- `src/components/RecentlyViewedCarousel.tsx` — no longer needed

**No new dependencies required.**

