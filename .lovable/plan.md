
# Fix: Drawer Scroll Position Not Being Captured

## Problem Identified
After analyzing the console logs, I found the root cause:

**The scroll position is always being saved as `0` because we're listening to the wrong element.**

The logs show:
- `scrollTop: 0` - Always 0, even when scrolling down
- `scrollHeight: 174` - Very small height (should be thousands of pixels for a merchant list)

**Why this happens:** The Vaul drawer library manages scrolling internally on the `DrawerContent` element. Our `scrollRef` is attached to an inner `div`, but that div isn't actually scrolling - the Vaul drawer's content wrapper is handling the scroll events.

## Solution
We need to make our inner `div` the actual scroll container instead of letting Vaul handle it. This requires:

1. **Modify DrawerContent styles** - Add `overflow-hidden` to prevent Vaul from scrolling
2. **Make inner div the scroll container** - Ensure it fills available space and handles overflow
3. **Add proper height constraints** - The inner div needs explicit height constraints to become scrollable

## Files to Change

### 1. `src/components/MobileListDrawer.tsx`
- Change `DrawerContent` to have `overflow-hidden` (prevents Vaul scroll)
- Ensure the scrollable div has proper height constraints with `flex-1 min-h-0 overflow-y-auto`
- Add a wrapper structure that properly contains the scroll

### 2. `src/hooks/useDrawerScrollRestoration.ts`  
- Add more debug logging to verify scroll events are now being captured correctly
- No major logic changes needed - just ensure the ref attaches properly

## Implementation Details

```
Current structure (broken):
┌─────────────────────────────────┐
│ DrawerContent (scrolling here)  │ ← Vaul handles scroll
│ ┌─────────────────────────────┐ │
│ │ div with scrollRef          │ │ ← Our ref, but NOT scrolling
│ │ (overflow-y-auto)           │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ SearchResults           │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Fixed structure:
┌─────────────────────────────────┐
│ DrawerContent (overflow-hidden) │ ← Block Vaul scrolling
│ ┌─────────────────────────────┐ │
│ │ div with scrollRef          │ │ ← Our ref IS the scroller
│ │ (overflow-y-auto + height)  │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ SearchResults           │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

The key insight is that for a child div to be scrollable:
1. It must have a **constrained height** (not auto-growing)
2. It must have `overflow-y: auto` or `scroll`
3. Its content must exceed its height

Currently, the parent DrawerContent is handling overflow, so our div never gets a chance to scroll.

## Technical Changes

**MobileListDrawer.tsx:**
```tsx
<DrawerContent className="max-h-[85vh] flex flex-col overflow-hidden">
  <DrawerHeader className="flex-shrink-0">
    {/* Header content */}
  </DrawerHeader>
  
  {/* This div MUST be the scroll container */}
  <div 
    ref={scrollRef} 
    className="flex-1 overflow-y-auto px-4 pb-4"
    style={{ minHeight: 0 }}  // Critical for flex scrolling
  >
    <SearchResults ... />
  </div>
</DrawerContent>
```

## Testing Steps
After implementation:
1. Search for "Williamsburg, Brooklyn"
2. Open the drawer
3. Scroll down in the drawer - check console for `[DrawerScrollRestoration] Saved state:` with `scrollTop > 0`
4. Tap on a merchant to navigate to their page
5. Hit back button
6. Verify drawer opens at the same scroll position
