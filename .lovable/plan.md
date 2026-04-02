

## Phase 4: Mobile UX Audit & Fixes

This phase uses browser testing at a mobile viewport to walk through the 3 key user journeys on a phone-sized screen, identify real issues, and fix them.

### What we'll do

**Step 1: Browser-based mobile testing of all 3 journeys**

Using the browser tools at a 390x844 viewport (iPhone 14), manually walk through:

1. **Homepage → "NYC Happy Hours" → Merchant Profile → Back**
   - Verify homepage carousels render and are swipeable
   - Tap a city link, confirm the map + peek handle load
   - Swipe up to open the drawer, tap a merchant
   - Hit back button, confirm drawer reopens and scroll position restores

2. **Homepage → Search → Results → Merchant Profile**
   - Use the mobile search bar, enter a location, submit
   - Verify results page loads with map + drawer
   - Tap a merchant card, confirm profile loads
   - Hit back, verify state restores

3. **Direct link to merchant profile (e.g. /restaurant/some-slug)**
   - Verify profile loads, CTA bar shows, no crash

**Step 2: Fix any issues found during testing**

Based on what the testing reveals. Likely areas from code review:

- **Drawer scroll restoration**: The `useDrawerScrollRestoration` hook saves/restores scroll but `LocationLanding.tsx` uses its own `isListDrawerOpen` state instead of this hook -- scroll position is likely lost on back navigation
- **`useLayoutEffect` scroll-to-top**: Line 211 in `LocationLanding.tsx` calls `window.scrollTo(0, 0)` on every render when `citySlug` or `neighborhoodSlug` changes, but does NOT check `navigationType` -- so it scrolls to top even on back button presses, contradicting the comment above it
- **Touch event listener cleanup**: The peek handle's `onTouchStart` (line 650) adds `touchmove`/`touchend` listeners to `document` but relies on the touch ending to clean up -- rapid interactions could leak listeners

### Implementation approach

1. Start by testing in the browser at mobile viewport
2. Document each issue found
3. Fix the scroll-to-top bug in `LocationLanding.tsx` (check `navigationType` before scrolling)
4. Integrate `useDrawerScrollRestoration` into `LocationLanding.tsx` for proper drawer state persistence
5. Fix any other issues found during testing

### Files likely affected

| File | Change |
|------|--------|
| `src/pages/LocationLanding.tsx` | Fix scroll-to-top to respect back navigation; integrate drawer scroll restoration |
| `src/hooks/useDrawerScrollRestoration.ts` | May need adjustments based on testing |
| `src/components/MobileListDrawer.tsx` | May need `data-vaul-drawer-scroll` or scroll container fixes |

