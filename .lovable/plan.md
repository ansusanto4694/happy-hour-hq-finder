

## Problem

The Recently Viewed carousel **does** use the same card components (`CarouselCard` / `MobileCarouselCard`) as other carousels. The issue is a **data gap**: Google rating data (`merchant_google_ratings`) is never saved to localStorage, so it's unavailable when rendering the Recently Viewed carousel.

## Root Cause

1. `useRecentlyViewed.ts` -- the `RecentlyViewedMerchant` interface and `addRecentlyViewed` function don't include `merchant_google_ratings`.
2. `Index.tsx` -- the mapping from recently viewed data to `CarouselType` doesn't pass `merchant_google_ratings` through.
3. `RestaurantProfile.tsx` (where `addRecentlyViewed` is called) -- doesn't pass Google rating data to the hook.

## Plan

### 1. Update `useRecentlyViewed.ts`

- Add `merchant_google_ratings` to the `RecentlyViewedMerchant` interface (matching the shape used by carousel cards).
- Accept and persist `merchant_google_ratings` in `addRecentlyViewed`.

### 2. Update `Index.tsx`

- Include `merchant_google_ratings` in the recently viewed carousel data mapping so the card components receive it.

### 3. Update the call site in `RestaurantProfile.tsx`

- Pass `merchant_google_ratings` when calling `addRecentlyViewed` so the data gets stored in localStorage.

This is a small, surgical fix -- no new components or architectural changes needed. The cards already handle Google ratings correctly; they just need the data.

