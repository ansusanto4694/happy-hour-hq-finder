# Menu and schedule consistency review

## Rule
Each menu must have its own published days and times. Unconfirmed hours must not be presented as confirmed. Permanently closed merchants must not appear as active programming.

## Scope and verification
The authorized scope remains corrections to the parallel `events` and `event_schedules` dataset. No API, frontend, legacy records, permissions, settings, or example data were changed in this review. The findings below come from reading the relevant code branches and current database definitions, not browser end-to-end tests.

## Places checked

| Place | Code read | Result |
| --- | --- | --- |
| New event dataset | Creation and correction migrations; current event/schedule query | Down The Hatch brunch has Saturday/Sunday noon–4 PM schedules; City Coffee has Saturday/Sunday 8 AM–4 PM; Savoi has no events. Yuca weekday 11 AM starts remain assumptions. |
| Search results, day/time and menu filters | `Results.tsx`, `useMerchants.ts`, `SearchResults.tsx` search/filter branches | Still reads legacy hours and menus independently, so new corrections are not adopted. Current-time filtering uses the viewer's browser clock. |
| City and neighborhood pages | `LocationLanding.tsx` effective-day/time and fetch branches | Same legacy limitation and browser-clock behavior as search. |
| Search cards and map previews | `SearchResultCard.tsx`, `ResultsMap.tsx`, `MerchantMapPreviewCard.tsx`, `timeUtils.ts` schedule branches | Show legacy merchant-wide hours, not the hours associated with an individual menu. Monday-first happy-hour day numbering is consistent here. |
| Homepage carousels, desktop/mobile | `Index.tsx`, `useHomepageCarousels.ts`, `CarouselCard.tsx`, `MobileCarouselCard.tsx` menu/hour branches | Still uses the legacy payload and shows merchant-wide hours. |
| Recently viewed | `useRecentlyViewed.ts`, homepage/card branches above | Stores a local snapshot of legacy hours and menus; closure is not revalidated in the snapshot flow. |
| Merchant profile: menu, hours, events | `RestaurantProfile.tsx`, `RestaurantProfileContent.tsx`, `RestaurantBasicInfo.tsx`, `RestaurantDealsSection.tsx`, `HappyHourDealsDisplay.tsx`, `RestaurantHappyHours.tsx`, `RestaurantEventsFeed.tsx` | Menus and hours remain independent legacy sections. Events feed reads active legacy events. Profile search-engine weekday labels incorrectly use Sunday-first numbering for Monday-first happy-hour data. |
| Profile editor and menu manager | `RestaurantProfileEditor.tsx`, `HappyHoursForm.tsx`, `useRestaurantMutations.ts`, `useHappyHourDeals.ts` | Saves schedules and menus separately to legacy tables; no synchronization with new tables. |
| Merchant portal: dashboard, happy hours, events | `PortalDashboard.tsx`, `PortalHappyHours.tsx`, `PortalEvents.tsx`, `useManageEvents.ts`, `MerchantEventsList.tsx` | Reads/edits legacy data only; current event day numbering remains separate from happy-hour numbering. |
| Favorites | `Favorites.tsx`, `useFavorites.ts` | Displays saved merchant records without an explicit active-merchant filter in these branches; no new-event adoption. |
| Public merchant API | `merchant-api/index.ts` search/get/carousels/deals branches | Search/carousels filter active merchants; direct profile lookup does not. Deals lookup checks active deals but not parent merchant activity. All use legacy data. Savoi remains active in legacy Merchant data under the preservation constraint. |
| AI agent tools | `src/lib/mcp/tools/get-merchant.ts`, `search-events.ts`; matching generated function branches | Merchant lookup checks active merchants but uses legacy hours/events. Event search checks event activity without a parent-merchant activity filter in the tool query. |
| Event date calculation | `eventUtils.ts` | Computes legacy next occurrences using browser-local dates; does not consume new schedules. |
| Background event expiry | `deactivate-expired-events/index.ts` | Updates expired legacy recurring events only; does not expire new schedules or handle merchant closure. |
| Sitemap and social-sharing pages | `generate-sitemap/index.ts`, `og-meta/index.ts` active-merchant query branches | Filter on legacy Merchant activity; removing Savoi from new events alone does not remove its legacy listing or sitemap entry. |
| Database triggers/functions | Live definitions of `update_updated_at_column`, `enforce_and_stamp_deal_verification`, `denormalize_event_location`; attached triggers queried | Timestamp, verification, and location functions do not parse menus or synchronize old/new schedules. New tables have timestamp triggers only. No public view referencing these scheduling tables was returned by the view-definition query. |

## Remaining uncertainties
- Yuca's website confirms bottomless until 4 PM every day, but its brunch menu confirms the 11 AM start only on Saturday/Sunday. Weekday starts remain unverified and unchanged.
- The previously estimated Cooper's closing time, Whiskey On Grand start/end, and Mommy's weekend-night interpretation were not reverified in this review.
- No browser flow or authenticated merchant editing flow was run; code reading does not establish deployed end-to-end behavior.
- The 38 previously reported database warnings remain outside this review and unchanged.

## Decision needed
API/frontend adoption and broader closure/time-handling fixes would exceed the user's database-only scope. Keep them untouched unless the user expands that scope.