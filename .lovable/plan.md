
# Fix: Drawer Scroll Restoration Not Working

## Problem
When navigating back from `/merchant` to `/results`, the drawer opens correctly but the scroll position resets to the top. The user expects to return to the exact same scroll position (e.g., where "Blend (Williamsburg)" was visible).

## Root Cause
The current implementation has a timing issue:

1. The Vaul drawer uses a **Portal** - when closed, the drawer content is completely unmounted from the DOM
2. When navigating back, the drawer opens but the scroll container is freshly created
3. The scroll restoration attempts run at fixed delays (0-800ms), but the **merchant data loads asynchronously** via React Query
4. Until the merchant list renders, the scrollable container has no height - setting `scrollTop` has no effect on an empty/short container

## Solution
Wait for the actual content (merchants) to be rendered before attempting scroll restoration. We need to:

1. Add merchants data as a dependency for scroll restoration timing
2. Wait for `isLoading` to be false before restoring scroll
3. Add additional restoration attempts after content renders
4. Use `requestAnimationFrame` to ensure DOM updates are complete

---

## Implementation Steps

### Step 1: Update useDrawerScrollRestoration hook
Pass the loading state and trigger restoration only after content is ready.

**File:** `src/hooks/useDrawerScrollRestoration.ts`

Changes:
- Accept optional `isContentReady` parameter
- Only attempt scroll restoration when content is ready (not loading)
- Reset the `hasRestoredRef` on location change (not just on mount)
- Add longer delay attempts to handle slow content loading

### Step 2: Update MobileListDrawer to expose loading state
Pass the loading state through to enable content-aware restoration.

**File:** `src/components/MobileListDrawer.tsx`

Changes:
- No changes needed - `isLoading` is already available

### Step 3: Update Results.tsx to pass loading state to the hook
Connect the merchant loading state to the scroll restoration hook.

**File:** `src/pages/Results.tsx`

Changes:
- Pass `!isLoading && merchants?.length > 0` to the hook to indicate content is ready

---

## Technical Details

The key insight is that scroll restoration must wait for:
1. The drawer to be open (`isOpen === true`)
2. Navigation type to be POP (`navigationType === 'POP'`)
3. Content to be loaded (`!isLoading && merchants exist`)
4. DOM to be updated (use `requestAnimationFrame`)

Current code:
```typescript
// Attempts restoration at fixed times, regardless of content loading
const delays = [0, 50, 100, 200, 400, 800];
```

Fixed code:
```typescript
// Only attempt restoration when content is actually ready
useEffect(() => {
  if (navigationType === 'POP' && isOpen && isContentReady && !hasRestoredRef.current) {
    // Content is loaded, now we can restore scroll
    requestAnimationFrame(() => {
      if (scrollRef.current && savedScrollTop > 0) {
        scrollRef.current.scrollTop = savedScrollTop;
      }
    });
  }
}, [isContentReady, isOpen, navigationType]);
```

---

## Files to Change
1. `src/hooks/useDrawerScrollRestoration.ts` - Add content-ready awareness
2. `src/pages/Results.tsx` - Pass loading state to the hook

## Testing Steps
1. Search for "Williamsburg, New York"
2. Open the drawer and scroll down to find "Blend (Williamsburg)"
3. Tap on Blend to go to the merchant page
4. Tap the back button in the header
5. Verify: Drawer is open AND scroll position shows Blend (not at top)
