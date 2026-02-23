
## Link Mobile Directions Button to Exact Google Maps Listing

### What Changes
When tapping "Directions" in the mobile CTA bar, users will be taken to the merchant's exact Google Maps listing (same as desktop map preview) instead of a generic address search.

### How It Works
The `ratingData?.googleRatingUrl` is already available in `RestaurantProfileContent.tsx` where one of the two `MobileCTABar` instances lives. It just needs a new optional prop.

### Files Changed (2 files)

1. **`src/components/MobileCTABar.tsx`**
   - Add optional `googleMapsUrl?: string | null` prop to the interface
   - Update the `directionsUrl` to use `googleMapsUrl` when available, falling back to the current address-based URL

2. **`src/components/RestaurantProfileContent.tsx`**
   - Pass `googleMapsUrl={ratingData?.googleRatingUrl}` to the `MobileCTABar` component (line 336)

3. **`src/pages/RestaurantProfile.tsx`**
   - The `MobileCTABar` here does NOT have access to `ratingData`, so it will continue using the address-based fallback (this is fine -- it only renders if the `RestaurantProfileContent` version doesn't)

### Fallback Behavior
- Merchant HAS a Google listing URL: tapping Directions opens the exact Google Maps listing
- Merchant does NOT: tapping Directions opens a Google Maps address search (current behavior, unchanged)
