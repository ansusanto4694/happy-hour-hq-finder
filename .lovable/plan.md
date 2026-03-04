

# Fix: "Cannot access 'neighborhoodCenters' before initialization"

## Root Cause

In `LocationLanding.tsx`, the variable `neighborhoodCenters` is **used on line 359** but **declared on line 436**. JavaScript `const` declarations are not hoisted, so referencing it before its definition throws a `ReferenceError`.

## Fix

Move the `neighborhoodCenters` `useMemo` block (currently around lines 436-460) **above** line 359, so it's declared before it's referenced. Specifically, it should go right before the line `const neighborhoodCenter = selectedNeighborhood ? neighborhoodCenters[selectedNeighborhood] : undefined;`.

No other changes needed — just reordering the declaration.

### File: `src/pages/LocationLanding.tsx`
- Cut the `neighborhoodCenters` `useMemo` block from ~line 436
- Paste it before line 359 (after the `radiusMiles` declaration on line 354)

