

# Map Component Performance Optimization Plan

## Summary

This plan optimizes the map component to reduce re-renders, eliminate callback-induced memo failures, and improve interaction smoothness. Most optimizations are **pure performance gains with zero functionality loss**.

---

## Problems Identified

| Issue | Impact | Severity |
|-------|--------|----------|
| **Broken memoization** - callback functions recreated on every parent render | Map re-renders constantly | HIGH |
| **Duplicate analytics tracking** - `handleMoveEnd` + `MapInteractionTracker` both track map moves | Redundant events, wasted processing | MEDIUM |
| **Marker re-renders** - All markers re-render when any restaurant changes | Janky panning/zooming | MEDIUM |
| **Multiple useEffect hooks** - Running on every restaurant list change | Unnecessary processing | LOW |

---

## Optimization Strategy

### Tradeoffs Analysis

| Optimization | Functionality Loss | Performance Gain |
|--------------|-------------------|------------------|
| Fix callback memoization | None | HIGH |
| Remove duplicate analytics | None (keeping sampled tracking) | MEDIUM |
| Memoize marker components | None | MEDIUM |
| Consolidate useEffects | None | LOW |

**All optimizations are pure performance gains with no functionality loss.**

---

## Changes Overview

### 1. Fix Broken Memoization in Results.tsx

**Problem:** The `React.memo` comparison in `ResultsMap.tsx` checks function reference equality for `onMapMove`, `onSearchThisArea`, and `onViewStateChange`. These callbacks are recreated on every render in Results.tsx, causing the memo to always fail.

```typescript
// Current - recreated on every render
const handleMapMove = (bounds) => { ... };
const handleSearchThisArea = async () => { ... };
const handleViewStateChange = (newViewState) => { ... };
```

**Solution:** Wrap all three callbacks with `useCallback` and stable dependencies:

```typescript
// Fixed - stable references
const handleMapMove = useCallback((bounds) => {
  setMapBounds(bounds);
  // ... rest of logic
}, [isMobile, isUsingMapSearch, searchedBounds, hasMapMoved]);

const handleSearchThisArea = useCallback(async () => {
  // ... tracking and state updates
}, [mapBounds, merchants?.length, track]);

const handleViewStateChange = useCallback((newViewState) => {
  setMapViewState(newViewState);
}, []);
```

### 2. Remove Duplicate Analytics in ResultsMap.tsx

**Problem:** Both `handleMoveEnd` and `MapInteractionTracker` fire analytics on map move:

- `handleMoveEnd` (line 197-218): Tracks `map_moved` on every move
- `MapInteractionTracker`: Tracks `map_pan` with sampling and throttling

**Solution:** Remove analytics from `handleMoveEnd` since `MapInteractionTracker` already handles it with better throttling (3s) and sampling (30%). Keep the bounds notification logic.

```typescript
// BEFORE
const handleMoveEnd = useCallback(() => {
  track({
    eventType: 'interaction',
    eventCategory: 'map_interaction',
    eventAction: 'map_moved',   // DUPLICATE - remove this
    metadata: { isMobile },
  });

  if (mapRef.current && onMapMove) {
    // ... bounds notification - KEEP THIS
  }
}, [onMapMove, track, isMobile]);

// AFTER
const handleMoveEnd = useCallback(() => {
  // Analytics handled by MapInteractionTracker with throttling/sampling
  if (mapRef.current && onMapMove) {
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    
    onMapMove({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
  }
}, [onMapMove]);
```

### 3. Memoize Marker Component

**Problem:** All markers re-render whenever the `restaurants` array changes, even if individual restaurant data hasn't changed.

**Solution:** Extract marker rendering to a memoized component:

```typescript
// New memoized component
const RestaurantMarker = React.memo(({ 
  restaurant, 
  isHovered, 
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave 
}) => (
  <Marker
    longitude={restaurant.longitude!}
    latitude={restaurant.latitude!}
    anchor="bottom"
    style={{ zIndex: isHovered ? 1000 : 1 }}
  >
    <div 
      className={`rounded-full flex items-center justify-center ... ${
        isHovered ? 'bg-bright-blue w-9 h-9 scale-110' : 'bg-red-500 w-6 h-6'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="w-2 h-2 bg-white rounded-full"></div>
    </div>
  </Marker>
), (prev, next) => (
  prev.restaurant.id === next.restaurant.id &&
  prev.isHovered === next.isHovered &&
  prev.isSelected === next.isSelected
));
```

### 4. Simplify Memo Comparison

**Problem:** Current memo comparison checks function references which will always fail when parent re-renders.

**Solution:** After fixing callbacks with `useCallback`, the existing memo comparison will work correctly. But we can also simplify by removing callback comparisons entirely (they don't affect visual output):

```typescript
// Simplified comparison - only check data that affects visual output
export const ResultsMap = React.memo(ResultsMapComponent, (prevProps, nextProps) => {
  return (
    prevProps.restaurants === nextProps.restaurants &&
    prevProps.showSearchThisArea === nextProps.showSearchThisArea &&
    prevProps.isUsingMapSearch === nextProps.isUsingMapSearch &&
    prevProps.viewState === nextProps.viewState &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.hoveredRestaurantId === nextProps.hoveredRestaurantId &&
    prevProps.searchLocation === nextProps.searchLocation
    // Removed: onMapMove, onSearchThisArea, onViewStateChange
    // These don't affect visual output, and with useCallback they'll be stable anyway
  );
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Results.tsx` | Wrap `handleMapMove`, `handleSearchThisArea`, `handleViewStateChange` with `useCallback` |
| `src/components/ResultsMap.tsx` | Remove duplicate analytics, extract memoized marker component, simplify memo comparison |

---

## Implementation Details

### Results.tsx - Stabilize Callbacks

```typescript
// Line ~206 - Wrap handleMapMove
const handleMapMove = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
  setMapBounds(bounds);
  
  // Show "search this area" button logic
  if (isMobile) {
    if (isUsingMapSearch && searchedBounds) {
      const boundsChanged = /* ... */;
      if (boundsChanged) setShowSearchThisArea(true);
    } else if (!hasMapMoved) {
      setHasMapMoved(true);
      setShowSearchThisArea(true);
    }
  } else {
    // Desktop logic
    if (isUsingMapSearch && searchedBounds) {
      const boundsChanged = /* ... */;
      if (boundsChanged) setShowSearchThisAreaDesktop(true);
    } else if (!hasMapMoved) {
      setHasMapMoved(true);
      setShowSearchThisAreaDesktop(true);
    }
  }
}, [isMobile, isUsingMapSearch, searchedBounds, hasMapMoved]);

// Line ~252 - Wrap handleSearchThisArea
const handleSearchThisArea = useCallback(async () => {
  await track({ /* ... */ });
  setSearchedBounds(mapBounds);
  setIsUsingMapSearch(true);
  setShowSearchThisArea(false);
  setShowSearchThisAreaDesktop(false);
}, [mapBounds, merchants?.length, track]);

// Line ~270 - Wrap handleViewStateChange
const handleViewStateChange = useCallback((newViewState: { longitude: number; latitude: number; zoom: number }) => {
  setMapViewState(newViewState);
}, []);
```

### ResultsMap.tsx - Remove Duplicate Analytics

```typescript
// Line 197-218 - Simplified handleMoveEnd
const handleMoveEnd = useCallback(() => {
  // Analytics removed - handled by MapInteractionTracker with throttling/sampling
  if (mapRef.current && onMapMove) {
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    
    onMapMove({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
  }
}, [onMapMove]); // Removed track, isMobile dependencies
```

---

## Expected Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| Map re-renders per filter change | Every render | Only when data changes |
| Analytics events per map pan | 2 (duplicate) | 1 (sampled/throttled) |
| Marker re-renders per list update | All N markers | Only changed markers |
| Callback stability | New refs every render | Stable refs with useCallback |

---

## What's Preserved

- All map functionality (pan, zoom, markers, hover, click)
- Search this area feature
- Map/list hover synchronization
- Analytics tracking (via MapInteractionTracker with sampling)
- Mobile and desktop layouts

## What's Removed

- Duplicate `map_moved` analytics event (keeping the throttled/sampled one)
- Unnecessary re-renders from unstable callback references

---

## Bundle Size Note

The Mapbox GL JS bundle (~500KB) is already lazy-loaded via `LazyResultsMap.tsx`. No further bundle optimization is needed for the map component itself - it only loads when the Results page is visited.

