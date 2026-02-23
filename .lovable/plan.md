

# Google Places Rating Integration

## Overview
Import Google Places star ratings and review counts for all merchants, store them in a dedicated table, display as trust signals across the app, and auto-fetch for new merchants going forward.

## Prerequisites
- Store `GOOGLE_PLACES_API_KEY` as a Supabase edge function secret (first step)

## Step 1: Database Migration

Create `merchant_google_ratings` table:

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default gen_random_uuid() |
| merchant_id | integer (FK, UNIQUE) | References Merchant(id) |
| google_place_id | text | For cheap future lookups |
| google_rating | numeric(2,1) | e.g. 4.3 |
| google_review_count | integer | Total Google reviews |
| google_rating_url | text | Link to Google Maps page |
| match_confidence | text | 'high', 'medium', 'low', 'no_match' |
| fetched_at | timestamptz | Tracks data freshness |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

RLS Policies:
- SELECT: anyone can view (public trust signal)
- ALL (insert/update/delete): service_role only

Add `AFTER INSERT` trigger on `Merchant` table to auto-call the edge function for new merchants (same pattern as `auto_geocode_merchant`).

## Step 2: Edge Function -- `fetch-google-places`

New file: `supabase/functions/fetch-google-places/index.ts`

Two modes:
1. **Single merchant**: `{ merchantId: 123 }` -- called by trigger
2. **Batch refresh**: `{ mode: "refresh" }` -- called by cron or admin backfill

Matching logic:
1. Build query: `restaurant_name + city + state`
2. Call Google Text Search (New) with `locationBias` using merchant's lat/lng
3. Validate: compare Google's returned coordinates with ours (within ~100m = high confidence)
4. Fetch rating + review count from response
5. Construct Google Maps URL from place_id
6. Upsert into `merchant_google_ratings`

## Step 3: Monthly Incremental Refresh (pg_cron)

Schedule a monthly cron job targeting:
- Merchants with no entry in `merchant_google_ratings`
- Merchants where `fetched_at` older than 30 days

## Step 4: Frontend -- GoogleRatingBadge Component

New file: `src/components/GoogleRatingBadge.tsx`

Displays:
- Star icon + rating number (e.g. "4.3")
- Review count (e.g. "(127)")
- Google attribution
- Links to Google Maps page

## Step 5: Update Data Fetching Hooks

- `useMerchants.ts`: Add `merchant_google_ratings` to the select join
- `useMerchantRating.ts`: Return Google rating as fallback when no native reviews exist

## Step 6: Display on UI Surfaces

Update these components to show GoogleRatingBadge when no native rating exists:
- `SearchResultCard.tsx`
- `CarouselCard.tsx`
- `MobileCarouselCard.tsx`
- `RestaurantProfileContent.tsx`

## Step 7: Admin Backfill Tool

New component similar to `GeocodingManager.tsx` -- provides a button to trigger batch Google Places lookups for all merchants missing data. Shows progress and results. Admin-only access.

## Cost

| Scenario | API Calls/Month | Cost |
|---|---|---|
| Initial backfill (728 merchants) | ~1,456 | $0 |
| Monthly refresh | ~1,456 | $0 |
| New merchants (~10/mo) | ~20 | $0 |
| At 10,000 merchants | ~20,000 | ~$50/mo |

