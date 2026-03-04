

## Mobile Neighborhood Pages — Match /results Mobile Experience

### Current state (mobile)
Lines 526-646 in `LocationLanding.tsx`: Large orange hero banner, breadcrumb nav, flat card grid, basic list/map toggle, no filters, no sort, no drawer pattern.

### Target state (mobile)
Identical to `/results` mobile (lines 454-608 in `Results.tsx`):
- **Fixed compact header** (h-16, z-50) with breadcrumb text or `MobileResultsSearchBar`
- **Full-screen map** (`LazyResultsMap`) behind everything
- **"Search this area" button** (fixed, top-20)
- **Swipe-up peek handle** showing result count + "Swipe up for list"
- **`MobileListDrawer`** with sort, all filters, and results — including neighborhood dropdown passed through the chain

### Changes

**1. `src/pages/LocationLanding.tsx` (lines 526-646)**
Replace the entire mobile block with the Results mobile pattern:
- Fixed header bar with neighborhood name breadcrumb and back link to city page
- Full-screen `LazyResultsMap` (already wired up in this file)
- "Search this area" fixed button (use existing `showSearchThisArea` state)
- Peek handle with result count
- `MobileListDrawer` with all filter props already managed in this file, plus `neighborhoods`/`selectedNeighborhood`/`onNeighborhoodChange` for city pages

**2. `src/components/MobileListDrawer.tsx`**
Add optional props: `neighborhoods`, `selectedNeighborhood`, `onNeighborhoodChange`. Pass them through to `MobileFilterDrawer`.

**3. `src/components/MobileFilterDrawer.tsx`**
Add same optional props. Pass them through to `MobileFilterDrawerV2`.

**4. `src/components/MobileFilterDrawerV2.tsx`**
Add same optional props. Pass them through to `UnifiedFilterBar` (which already accepts them).

### What stays the same
- All filter state management and URL param logic (already built for desktop, reused)
- Desktop layout (untouched)
- The `MobileBottomNav` (already rendered at app level)
- SEO head, structured data, page title logic

