

## Link Map Preview to Exact Google Maps Listing

### What Changes
When clicking the map preview on a restaurant profile, users will be taken to the merchant's exact Google Maps listing (the same URL used by the Google rating badge) instead of a generic address search.

### How It Works
The exact Google Maps listing URL (`google_rating_url`) is already fetched by the `useMerchantRating` hook in the profile page. It just needs to be threaded down through two components:

1. **RestaurantProfileContent** -- pass `ratingData.googleRatingUrl` to `RestaurantContactInfo`
2. **RestaurantContactInfo** -- accept the new prop, pass it to `RestaurantMapPreview`
3. **RestaurantMapPreview** -- use the exact URL when available, fall back to the address-based search URL when not

If a merchant doesn't have a Google rating match (or was marked `no_match`), the map click continues to use the current address-based Google Maps search -- so nothing breaks for merchants without Google data.

### Files Changed (3 files, minimal edits)

- `src/components/RestaurantProfileContent.tsx` -- add `googleMapsUrl={ratingData?.googleRatingUrl}` prop to the `RestaurantContactInfo` component
- `src/components/RestaurantContactInfo.tsx` -- add optional `googleMapsUrl` prop to the interface, pass it through to `RestaurantMapPreview`
- `src/components/RestaurantMapPreview.tsx` -- add optional `googleMapsUrl` prop; in `handleMapClick`, use it when available instead of building the address-based URL

### Fallback Behavior
- Merchant HAS a Google listing URL: clicking the map opens the exact Google Maps page
- Merchant does NOT have a Google listing URL: clicking the map opens a Google Maps address search (current behavior, unchanged)

