
## Fix: Mobile Directions Button Still Using Address Search

### Root Cause
The app uses **React Query persistence to localStorage** (`PersistQueryClientProvider`) with a 24-hour garbage collection time. The `merchant-rating` query results cached in localStorage are stale -- they were saved before the `googleRatingUrl` field was properly included in all return paths of `useMerchantRating`.

Even after the code was updated, the browser keeps serving the old cached result (which lacks `googleRatingUrl`), so `MobileCTABar` falls back to the address-based Google Maps search.

Additionally, the hook has a structural bug: when a merchant has native reviews, the `googleRatingUrl` is dropped entirely from the return value. This affects merchants like Ainslie that have both native reviews AND a valid Google listing URL.

### Fix (2 changes in 1 file)

**File: `src/hooks/useMerchantRating.ts`**

1. **Always preserve `googleRatingUrl` in the native-review return path**
   - Extract the Google listing URL from `googleResult.data` before the native review early-return
   - Include it in the native return branch so it's available for navigation even when native ratings are displayed

2. **Bust stale cache by updating the query key**
   - Change `queryKey` from `['merchant-rating', merchantId]` to `['merchant-rating-v2', merchantId]`
   - This forces React Query to ignore the old cached data and fetch fresh results
   - All existing consumers use the hook (not the key directly), so no other files need updating

### Updated Hook Logic (simplified)

```text
1. Fetch native reviews + Google rating in parallel
2. Extract googleRatingUrl from Google data (if match_confidence != 'no_match')
3. If native reviews exist -> return { source: 'native', ..., googleRatingUrl }
4. If Google rating exists -> return { source: 'google', ..., googleRatingUrl }
5. Fallback -> return { source: null, ..., googleRatingUrl: null }
```

### Why This Fixes Both Merchants
- **Boqueria Flatiron** (no native reviews): Cache bust forces a fresh fetch that properly includes `googleRatingUrl` from the Google path
- **Ainslie** (has native reviews): The native path now preserves the Google listing URL instead of dropping it

### No Other Files Change
- `MobileCTABar.tsx` already has the `googleMapsUrl` prop wired correctly
- `RestaurantProfileContent.tsx` already passes `ratingData?.googleRatingUrl`
