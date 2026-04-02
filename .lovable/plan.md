
## Root cause

This does not look like a Mapbox-vs-Google issue.

From the code, the most likely reason the app is hitting the global `ErrorBoundary` so often is a rendering crash caused by incomplete category relations in merchant data, especially on large result sets like `/happy-hour/new-york-ny`.

The risky pattern appears in multiple places:

- `src/components/SearchResultCard.tsx`
- `src/components/RestaurantProfileContent.tsx`

Those components render:

```text
merchantCategory.categories.name
```

But elsewhere in the codebase, the same relation is already treated as nullable, which means `categories` can legitimately be `null` for some rows. If even one merchant in the NYC result set has a broken/orphaned `merchant_categories` relation, React throws, and the whole route falls into:

```text
Something went wrong
```

That matches what you described:
- homepage loads
- click “NYC Happy Hours”
- big merchant list renders
- one bad row crashes the whole page
- happens intermittently depending on cached data / route / dataset returned

## Why it happens often

A city landing page like NYC loads a lot of merchants at once. That increases the odds that one malformed related record is included.

So this is likely a data-tolerance bug in the frontend:
- the database may contain some merchant-category rows whose `categories` relation is missing
- the frontend assumes every relation is present
- one bad merchant can crash the entire page

This also explains why the generic error appears in different browsers and for signed-out users too: it is probably public page data, not auth-specific behavior.

## Plan to fix

1. Harden category rendering everywhere it is used
   - Replace direct `merchantCategory.categories.name` access with a safe fallback
   - Example approach:
     - use `merchantCategory.categories?.name`
     - skip badges when category is missing
     - optionally fallback to `"Uncategorized"` only if desired

2. Normalize category lists before rendering
   - In result cards and profile pages, filter out invalid category entries before `.map()`
   - This prevents one orphaned relation from crashing the whole component tree

3. Add defensive handling on NYC/results-style pages
   - Ensure list rendering can survive partially malformed merchant records
   - Keep bad subfields from taking down the entire route

4. Improve error visibility
   - Update `ErrorBoundary` tracking to include route/pathname and possibly a small payload about the failing page
   - That will make future crashes much easier to trace

5. Audit related nullable relations
   - Check other places where 1:many or joined relations are rendered without null guards
   - The same pattern may exist outside categories

## Files to update

- `src/components/SearchResultCard.tsx`
- `src/components/RestaurantProfileContent.tsx`
- potentially `src/pages/LocationLanding.tsx` only if we want lightweight route-level guarding/logging
- potentially `src/components/ErrorBoundary.tsx` for better diagnostics

## Technical details

```text
Current unsafe pattern:
merchantCategory.categories.name

Safer pattern:
merchantCategory.categories?.name

Best pattern:
restaurant.merchant_categories
  ?.filter(mc => mc?.categories?.name)
  .map(mc => mc.categories.name)
```

This is the key issue because the Supabase-generated types already indicate the joined relation can be null in some places, but the UI still assumes it always exists.

## Expected result after fix

- Clicking “NYC Happy Hours” should no longer crash because of one malformed merchant record
- signed-out users should be able to browse large city pages reliably
- bad category data will degrade gracefully instead of taking down the page
- future debugging becomes easier with better error metadata
