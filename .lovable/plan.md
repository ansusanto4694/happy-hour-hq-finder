

# Fix: Drawer Scroll Restoration Not Executing

## Root Cause Analysis

After tracing through the code, I've identified the likely issue:

### The Problem: Effect Dependencies and Timing

Looking at the restoration useEffect in `useDrawerScrollRestoration.ts`:

```typescript
useEffect(() => {
  if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
    return; // Early exit - no logs printed!
  }
  // ... restoration code with console.logs
}, [isOpen, isContentReady, navigationType]);
```

**The issue is that when any condition fails, the effect returns early WITHOUT logging anything.** This is why there are no `[DrawerScroll]` logs - the effect is exiting before reaching the log statements.

Possible failure points:
1. **`navigationType` might not be `'POP'`** - Although `navigate(-1)` should trigger POP, it needs verification
2. **`isContentReady` timing** - The merchants may not be loaded yet when the effect first runs, and the `hasRestoredRef` gets set to `true` in the cleanup before content is ready
3. **`hasRestoredRef.current` cleanup issue** - The cleanup function sets `hasRestoredRef.current = true` which can prevent restoration if the effect re-runs

### Critical Bug: Cleanup Function Sabotage

```typescript
return () => {
  hasRestoredRef.current = true;  // BUG: This prevents future restoration attempts!
};
```

If the effect runs when content isn't ready, exits early, but the cleanup still runs (on unmount or dependency change), it will mark restoration as complete even though it never happened.

## Solution

### 1. Add diagnostic logging at the start of the effect

Log all conditions immediately so we can see why restoration isn't running.

### 2. Fix the cleanup function logic

Only set `hasRestoredRef.current = true` after successful restoration, not in cleanup.

### 3. Use a different approach: Retry mechanism

Instead of a single effect with cleanup, use a retry mechanism that keeps checking until content is rendered and restoration completes.

## Files to Change

### `src/hooks/useDrawerScrollRestoration.ts`

**Changes:**
1. Add logging at the very start of the effect to show all condition values
2. Remove the problematic cleanup function that sets `hasRestoredRef.current = true`
3. Add a retry mechanism that polls for the element if it's not found initially
4. Only mark restoration complete after successfully scrolling

```typescript
// BEFORE (problematic):
useEffect(() => {
  if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
    return;
  }
  // ...
  return () => {
    hasRestoredRef.current = true; // BUG: runs even when restoration failed
  };
}, [isOpen, isContentReady, navigationType]);

// AFTER (fixed):
useEffect(() => {
  // Always log conditions for debugging
  console.log('[DrawerScroll] Effect check:', { 
    navigationType, 
    isOpen, 
    isContentReady, 
    hasRestored: hasRestoredRef.current,
    savedId: lastClickedIdRef.current 
  });
  
  if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
    return;
  }
  
  // ... restoration code
  // Only set hasRestoredRef.current = true AFTER successful scroll
  
  // NO cleanup function that could sabotage restoration
}, [isOpen, isContentReady, navigationType]);
```

## Implementation Details

```text
Fixed Flow:
┌─────────────────────────────────────────────────────────────────┐
│ 1. Back navigation triggers POP                                 │
│ 2. isOpen restored from sessionStorage = true                   │
│ 3. Effect runs immediately with:                                │
│    - navigationType: 'POP' ✓                                    │
│    - isOpen: true ✓                                             │
│    - isContentReady: false ✗ (merchants still loading)          │
│ 4. Effect logs conditions and exits (no cleanup damage)         │
│ 5. Merchants load, isContentReady becomes true                  │
│ 6. Effect re-runs with all conditions met                       │
│ 7. Restoration executes and scrolls to saved merchant           │
│ 8. hasRestoredRef.current set to true (only after success)      │
└─────────────────────────────────────────────────────────────────┘
```

## Testing Steps

After implementation:
1. Search for "Williamsburg, Brooklyn"
2. Open the drawer and scroll to "Bright Side"
3. Tap on "Bright Side" to navigate
4. Open browser DevTools console
5. Tap the back button in the header
6. Check console for `[DrawerScroll] Effect check:` logs showing all conditions
7. Verify: Drawer opens AND "Bright Side" is visible/centered in the viewport

The new logging will reveal exactly which condition is failing.

