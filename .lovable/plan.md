

## Comprehensive Site Reliability Audit Plan

### Goal
Systematically identify and fix any issues that prevent users from successfully browsing the site — from landing on the homepage to viewing a merchant profile.

---

### The 5 Core User Journeys to Audit

```text
Journey 1: Homepage → City Landing Page → Merchant Profile
Journey 2: Homepage → Search Results → Merchant Profile
Journey 3: Direct link to City Landing Page (e.g. from Google)
Journey 4: Direct link to Merchant Profile (e.g. shared link)
Journey 5: Mobile versions of all above
```

---

### Phase 1: Crash-Proofing (Defensive Code Audit)

**What we're checking:** Every place the app accesses nested data from the database without safety checks. If even one record is malformed, it can crash the whole page.

**Specific areas to audit:**
- `CarouselCard.tsx` and `MobileCarouselCard.tsx` — do they safely handle merchants with missing categories, ratings, or happy hours?
- `HomepageCarousel.tsx` — does it crash if a carousel has zero merchants or a merchant reference is broken?
- `RestaurantProfile.tsx` — the main query joins 6+ related tables; if any join returns unexpected data, does the page survive?
- `MerchantReviews.tsx` — does it handle reviews with missing rating dimensions?
- `RestaurantHappyHours.tsx` and `RestaurantDealsSection.tsx` — do they handle empty or null arrays?
- `ResultsMap.tsx` / `LazyResultsMap.tsx` — does the map crash if a merchant has null lat/lng?

**Action:** Add optional chaining (`?.`) and array filtering everywhere nested database relations are rendered. We already fixed `SearchResultCard` and `RestaurantProfileContent` — this extends that pattern to every other component.

---

### Phase 2: Error Boundary Improvements

**Current state:** One global `ErrorBoundary` catches everything and shows "Something went wrong." Users have no idea what happened or which page broke.

**Improvements:**
1. Add **route-level error boundaries** around each major page (Results, LocationLanding, RestaurantProfile) so a crash on one page doesn't require going back to the homepage
2. Make the error message more helpful — e.g., "This page couldn't load. Try refreshing or go back to search results"
3. Add a **"Refresh this page"** button that reloads just the current route (not the whole app)
4. Log which route/component crashed to analytics so we can track problem areas

---

### Phase 3: Data Query Resilience

**What we're checking:** How the app behaves when database queries fail or return unexpected results.

**Specific scenarios:**
- Supabase is temporarily slow or returns a timeout — does the user see a loading spinner forever, or a helpful message?
- A merchant ID in the URL doesn't exist (deleted or deactivated) — does the profile page show a clear "not found" message?
- The `useMerchants` hook returns an empty array for a valid city — is the "no results" state clear and helpful?
- Network goes offline mid-browse — does the cached data (from React Query persistence) still work, or does it crash?

**Action:** Review error and empty states across `SearchResults`, `LocationLanding`, `RestaurantProfile`, and homepage carousels. Ensure every query has proper `isLoading`, `error`, and "empty" handling.

---

### Phase 4: Mobile-Specific Testing

**Why separate:** Your analytics show mobile is a major traffic source, and mobile has unique components (`MobileCarousel`, `MobileListDrawer`, `MobileBottomNav`, `MobileCTABar`).

**What to test:**
- Does the mobile drawer open/close reliably on city landing pages with 100+ results?
- Does scroll position restore correctly when navigating back from a merchant profile?
- Do touch interactions work on carousel cards?
- Does the map view toggle work without crashing on mobile?
- Is the mobile search bar functional from the results page?

---

### Phase 5: Navigation & URL Handling

**What we're checking:** Broken or unexpected URLs that users might hit.

**Specific scenarios:**
- Merchant slugs with special characters (apostrophes, ampersands, accents)
- City slugs that don't match any data in the database
- Neighborhood slugs that exist but have zero active merchants
- The `URLSanitizer` component — does it handle all edge cases with encoded query params?
- Back/forward browser navigation — does state restore correctly?

---

### Phase 6: Performance Under Load

**What we're checking:** Pages with lots of data that might be slow or unresponsive.

**Key pages:**
- NYC landing page (likely 200+ merchants) — does pagination/infinite scroll work?
- Merchant profiles with many reviews, events, and deals
- Homepage with multiple carousels, each containing many merchants

**Action:** Verify that large result sets don't cause React to render thousands of DOM elements at once.

---

### Implementation Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Phase 1: Crash-proofing | Medium | High — directly prevents "Something went wrong" |
| 2 | Phase 2: Error boundaries | Medium | High — better recovery when things do break |
| 3 | Phase 3: Query resilience | Small | Medium — handles edge cases gracefully |
| 4 | Phase 5: URL handling | Small | Medium — prevents confusion from bad URLs |
| 5 | Phase 4: Mobile testing | Manual | High — large user segment |
| 6 | Phase 6: Performance | Medium | Medium — affects large cities |

---

### How We'll Know It's Working

1. **Before:** Track how many "error_boundary_triggered" events fire per day in analytics (already logging this)
2. **After:** That number should drop to near zero
3. Add a simple dashboard counter on the `/analytics` page showing error boundary triggers over the last 7 days

---

### Files Likely Affected

- `src/components/CarouselCard.tsx`
- `src/components/MobileCarouselCard.tsx`
- `src/components/HomepageCarousel.tsx`
- `src/components/MobileCarousel.tsx`
- `src/components/RestaurantHappyHours.tsx`
- `src/components/RestaurantDealsSection.tsx`
- `src/components/RestaurantEventsFeed.tsx`
- `src/components/MerchantReviews.tsx`
- `src/components/ResultsMap.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/pages/LocationLanding.tsx`
- `src/pages/Results.tsx`
- `src/pages/RestaurantProfile.tsx`

