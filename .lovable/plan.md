

# Neighborhood + Distance: Geo-Based Approach

## The Problem

Currently, selecting a neighborhood does a strict DB column match (`ilike('neighborhood', 'The Bowery')`). This misses restaurants that are physically nearby but tagged with a different or missing neighborhood value. Users can't expand their search beyond what's in the data.

## Your Proposal (and My Take)

Your idea — auto-set radius to "Nearby" (0.25mi) when a neighborhood is selected, then let users expand — is the right direction. But it requires one key ingredient: **the geocoded center of each neighborhood**.

Without coordinates for the neighborhood, there's nothing to measure distance from. Here's how I'd refine the approach:

## Recommended Approach

**When a user selects a neighborhood:**

1. **Look up the neighborhood's center coordinates** — either from a pre-built lookup table or by averaging the lat/lng of all merchants tagged with that neighborhood
2. **Auto-set the radius to "Nearby" (0.25mi)** as a smart default
3. **Switch from DB column matching to geo-radius filtering** — use Haversine distance from the neighborhood center instead of `ilike('neighborhood', ...)`
4. The user can then expand to walking (1mi), bike (3mi), etc. to widen results

This means the neighborhood dropdown becomes a **location shortcut** rather than a strict tag filter. It effectively says "center my search on this neighborhood" and the radius controls how wide to cast the net.

## Implementation

### 1. Compute neighborhood centers (runtime, no new tables)

In `LocationLanding.tsx`, derive a center coordinate for each neighborhood from the merchant data we already have:

```typescript
const neighborhoodCenters = useMemo(() => {
  // Average lat/lng of all merchants tagged with each neighborhood
  const centers: Record<string, { lat: number; lng: number }> = {};
  allMerchants?.forEach(m => {
    if (m.neighborhood && m.latitude && m.longitude) {
      // accumulate and average
    }
  });
  return centers;
}, [allMerchants]);
```

### 2. Change `useMerchants` behavior when neighborhood + radius are combined

- **Stop passing `neighborhood` as a DB filter** when the user selects one from the dropdown
- **Instead pass the neighborhood's center coordinates as `gpsCoordinates`** along with the radius
- This way, `useMerchants` uses geo-radius filtering (which it already supports) instead of exact column matching

### 3. Auto-set radius to "Nearby" on neighborhood selection

In `LocationLanding.tsx`, when `setSelectedNeighborhood` is called:
- Set `selectedRadius` to `'blocks'` (0.25mi) automatically
- User can then manually expand to walking, bike, drive, city-wide

### 4. Update `UnifiedFilterBar` radius label

When a neighborhood is selected, the "Distance from location" label could say "Distance from [Neighborhood]" to make the mental model clear.

### Files to modify:
- `src/pages/LocationLanding.tsx` — compute neighborhood centers, change how neighborhood selection feeds into `useMerchants`, auto-set radius
- `src/hooks/useMerchants.ts` — no changes needed (already supports `gpsCoordinates` + `radiusMiles`)
- `src/components/UnifiedFilterBar.tsx` — minor: update distance label when neighborhood is active

### Trade-off vs. alternative

An alternative is to keep the DB filter as the primary and only add geo-radius as a fallback. But that creates confusing behavior — "why do I see restaurants not in this neighborhood?" The geo-only approach is cleaner: the dropdown picks a location, the radius controls the scope. Simple mental model.

