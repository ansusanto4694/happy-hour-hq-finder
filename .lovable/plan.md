
Goal: fix the mobile “Clear All” behavior so visual filter cues (Tue/Wed/Sat + category chips/checks) reliably turn off after clearing.

1) Step-by-step diagnosis (what is actually broken)
- Source of truth for filters is URL query params in `src/pages/Results.tsx` (`categories`, `days`, `radius`, etc.).
- The mobile clear action in `MobileFilterDrawerV2` calls many setters back-to-back:
  - `onCategoryChange([])`, `onRadiusChange(...)`, `onDaysChange([])`, etc.
- In `Results.tsx`, each setter currently builds new params from the same render snapshot:
  - `const newParams = new URLSearchParams(searchParams); ... setSearchParams(newParams, { replace: true })`
- When several setters run in one click, they overwrite each other using stale query snapshots.
- Net effect: earlier clears (like removing `days`/`categories`) get reintroduced by later setter calls, so UI still shows selected day/category states.
- Extra bug found: mobile sticky clear uses `onRadiusChange('5')`, but `RadiusOption` is `'blocks' | 'walking' | 'bike' | 'drive' | 'city'`. `'5'` is invalid and can leave radius state inconsistent.

2) Implementation strategy
Use a single atomic “clear all filters” update from the page-level URL state owner (`Results.tsx`) and route all clear buttons to it.

Why this is safest:
- Eliminates stale-overwrite race from multiple URL writes per click.
- Keeps one source of truth for what “clear all” means.
- Fixes both mobile drawer clear and inline UnifiedFilterBar clear consistently.

3) Planned code changes

A. `src/pages/Results.tsx`
- Add `handleClearAllFilters` that performs one `setSearchParams` call and removes all filter params in one shot:
  - remove: `categories`, `radius`, `offers`, `days`, `startTime`, `endTime`, `menuType`, `happeningNow`, `happeningToday`, and `page`
  - preserve search context params (e.g. `search`, `location`, `zip`, gps/map context) so user stays on same results context but unfiltered.
- Pass this callback down to:
  - mobile flow (`MobileListDrawer` → `MobileFilterDrawer` → `MobileFilterDrawerV2`)
  - desktop/tablet `UnifiedFilterBar` instances.

B. `src/components/MobileListDrawer.tsx`
- Add optional prop: `onClearAllFilters?: () => void`
- Forward it to `MobileFilterDrawer`.

C. `src/components/MobileFilterDrawer.tsx`
- Add optional prop: `onClearAllFilters?: () => void`
- Forward it to `MobileFilterDrawerV2`.

D. `src/components/MobileFilterDrawerV2.tsx`
- Add optional prop: `onClearAllFilters?: () => void`
- Update sticky “Clear All Filters” button:
  - if `onClearAllFilters` exists, call it (single source-of-truth clear)
  - keep analytics event tracking
- Remove invalid radius fallback behavior (`'5'`) in the fallback path; use smart default if fallback is retained.

E. `src/components/UnifiedFilterBar.tsx`
- Add optional prop: `onClearAllFilters?: () => void`
- In `clearAllFilters`, prefer `onClearAllFilters()` when provided; otherwise keep existing fallback behavior.
- This ensures both clear entry points behave identically and prevents recurrence.

4) Validation plan (must verify end-to-end)
Primary repro/verification:
- Open `/results?days=2,5,1&categories=<restaurant-id>` on mobile.
- Open filter drawer, confirm Tue/Wed/Sat + restaurant are visibly active.
- Tap sticky “Clear All Filters”.
- Confirm:
  - day buttons are no longer highlighted
  - category checkbox/chip is cleared
  - filter badge/count updates to no active filters
  - URL no longer contains `days`/`categories` (and other cleared filter params)

Secondary checks:
- Tap inline “Clear All” inside `UnifiedFilterBar` (if visible) and confirm same result.
- Repeat on desktop/tablet filter sidebar to ensure consistent behavior.
- Ensure “Happening Now/Today” toggles also clear correctly.
- Confirm no regressions to single-filter interactions (toggling one day/category still updates URL correctly).

5) Risk and mitigation
- Risk: accidental clearing of non-filter query params.
  - Mitigation: explicitly delete only filter keys; keep search/location/map context keys.
- Risk: duplicated analytics events if both old and new clear paths run.
  - Mitigation: keep event call in the button handler and avoid double invocation in delegated callback path.

6) Expected outcome
- Clear-all performs one atomic URL update.
- Visual cues and URL remain in sync immediately after clear.
- The specific user-reported state (Tue/Wed/Sat + restaurant) fully resets in one tap.
