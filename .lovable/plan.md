

## Phase 5: Navigation & URL Handling Audit

### What we're checking and why

Phase 5 is about making sure users don't hit dead ends, broken pages, or confusing errors when navigating via URLs — whether they click a link on the site, come from Google, or share a link with a friend.

---

### Issue 1: Inconsistent city/state data causes broken location pages

**The problem:** The database has inconsistent city/state formatting:
- 25 Brooklyn merchants have state = "New York" instead of "NY"
- 14 Long Island City merchants have state = "New York"
- Some cities are lowercase ("ardmore", "miami", "coral gables")
- One entry has a leading space in state (" NY")

**Why it matters:** The location landing page URL format is `/happy-hour/new-york-ny`. It parses the last segment as the state code. If a user navigates to `/happy-hour/brooklyn-new-york`, the parser splits this as city="Brooklyn New" and state="YORK" — which matches nothing.

**Fix:**
1. Run a database migration to normalize all state values to 2-letter uppercase codes and capitalize city names properly
2. Add a fallback in `LocationLanding.tsx` slug parser to handle multi-word states (e.g., treat "new-york" as state "NY")

---

### Issue 2: Special characters in neighborhood names get mangled in URLs

**The problem:** The `displayNameToSlug` function only strips apostrophes and spaces. Characters like `&`, parentheses, or accents in neighborhood names (e.g., "Child's Heights") could produce unexpected slugs. Going the reverse direction, `slugToDisplayName` naively capitalizes every word after splitting on `-`, so "hell-s-kitchen" becomes "Hell S Kitchen" instead of "Hell's Kitchen".

**Why it matters:** When a user selects a neighborhood filter, the app navigates to a slug URL. If that slug can't be decoded back to the original neighborhood name, the database query finds no matches and shows a 404.

**Fix:**
1. Improve `displayNameToSlug` to strip `&`, parentheses, and other punctuation
2. For neighborhood matching, use `ilike` fuzzy matching in the Supabase query instead of relying on exact slug-to-name roundtripping

---

### Issue 3: Invalid city slugs show an empty page instead of a clear 404

**The problem:** If someone visits `/happy-hour/fakecity-xx`, the page loads, queries for "Fakecity, XX", gets zero results, and shows an empty results state — not a 404. The `isInvalidLocation` logic only triggers for invalid *neighborhood* slugs, not invalid city slugs.

**Fix:** Extend `isInvalidLocation` to also return true when the city-level query returns zero results and no filters are active.

---

### Issue 4: Back/forward browser navigation and scroll restoration

**The problem:** The `ScrollRestoration` hook and `useLayoutEffect` in `LocationLanding` both force scroll to top. When a user hits the back button from a merchant profile, they lose their scroll position in the results list.

**Fix:** Audit `ScrollRestoration` to ensure it respects browser history navigation (back/forward) and doesn't forcibly reset scroll on pop-state events.

---

### Issue 5: Map crashes on null coordinates

**The problem:** `ResultsMap.tsx` renders markers for all merchants. If a merchant has `null` latitude or longitude, the Mapbox marker component may throw.

**Fix:** Filter out merchants with null lat/lng before passing to the map component (same defensive pattern from Phase 1).

---

### Implementation plan

| Step | What | File(s) |
|------|------|---------|
| 1 | Normalize city/state data in DB | New SQL migration |
| 2 | Add multi-word state fallback to slug parser | `LocationLanding.tsx` |
| 3 | Harden `displayNameToSlug` / `slugToDisplayName` for special chars | `LocationLanding.tsx` |
| 4 | Extend 404 detection to city-level (not just neighborhoods) | `LocationLanding.tsx` |
| 5 | Audit scroll restoration for back/forward | `useScrollRestoration.ts`, `LocationLanding.tsx` |
| 6 | Filter null-coordinate merchants before map render | `ResultsMap.tsx` |

### Data cleanup (migration)

Normalize the 40+ inconsistent records:
- `UPDATE "Merchant" SET state = 'NY' WHERE state = 'New York'`
- `UPDATE "Merchant" SET city = initcap(city) WHERE city = lower(city)`
- `UPDATE "Merchant" SET state = trim(state) WHERE state != trim(state)`

