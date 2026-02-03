

# New Approach: Scroll-to-Item Instead of Scroll-Position

## Problem Analysis

After multiple attempts, the root cause is clear: **Vaul drawer manages its own internal scroll container** that's inaccessible through standard React refs. Our attempts to find and attach to this element via DOM queries have been unreliable.

The previous approaches failed because:
1. The scroll container is created by Vaul internally and rendered in a portal
2. Even when we find it, the timing of attachment/restoration is fragile
3. The drawer may reset its scroll on open/close transitions

## New Solution: Track Clicked Item, Not Scroll Position

Instead of saving pixel-based scroll position (which is fragile), we will:

1. **Track which merchant was clicked** - Store the merchant ID when user taps a card
2. **On back navigation, scroll that item into view** - Use `scrollIntoView()` API
3. **Use a small delay** to ensure content is rendered before scrolling

This approach is more robust because:
- No dependency on Vaul's internal scroll handling
- Works with any scroll container (Vaul's or ours)
- Native browser API handles the scrolling reliably

## Files to Change

### 1. `src/hooks/useDrawerScrollRestoration.ts` - Complete Rewrite

Replace the complex scroll-position tracking with simpler item-based tracking:

```typescript
// Store: { isOpen: boolean, lastClickedMerchantId: number | null }

// On merchant click: save the merchant ID
// On POP navigation: scroll that merchant into view after drawer opens
```

Key changes:
- Remove all scroll event listeners and DOM queries
- Store `lastClickedMerchantId` instead of `scrollTop`
- Export a `setLastClickedId` function to call when user clicks a merchant
- On restoration, use `document.querySelector(`[data-merchant-id="${id}"]`)?.scrollIntoView()`

### 2. `src/components/MobileListDrawer.tsx`

Minor changes:
- Remove the complex `scrollRef` handling
- Keep the layout as-is (it's correct now)

### 3. `src/components/SearchResults.tsx` or `src/components/SearchResultCard.tsx`

- Add `data-merchant-id={merchant.id}` attribute to each merchant card
- Call `setLastClickedId(merchant.id)` when a card is clicked

### 4. `src/pages/Results.tsx`

- Pass down the `setLastClickedId` callback from the hook to the drawer/results

## Implementation Details

```text
User Flow:
┌─────────────────────────────────────────────────────────────────┐
│ 1. User scrolls drawer to "Blend" restaurant                    │
│ 2. User taps on "Blend" card                                    │
│    → We save: { isOpen: true, lastClickedMerchantId: 42 }       │
│ 3. User navigates to /merchant/blend                            │
│ 4. User hits back button                                        │
│    → navigationType === 'POP'                                   │
│    → We restore isOpen: true (drawer opens)                     │
│    → After 200ms delay, find [data-merchant-id="42"]            │
│    → Call element.scrollIntoView({ block: 'center' })           │
│ 5. User sees drawer open with "Blend" visible in viewport       │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### New Hook Structure

```typescript
export const useDrawerScrollRestoration = (options) => {
  const [isOpen, setIsOpen] = useState(getInitialOpenState);
  const lastClickedIdRef = useRef<number | null>(null);
  
  // Save clicked merchant ID before navigation
  const setLastClickedId = useCallback((id: number) => {
    lastClickedIdRef.current = id;
    saveState({ isOpen, lastClickedMerchantId: id });
  }, [isOpen]);
  
  // Restore on POP navigation
  useEffect(() => {
    if (navigationType === 'POP' && isOpen && isContentReady) {
      const savedId = getSavedState()?.lastClickedMerchantId;
      if (savedId) {
        // Wait for content to render, then scroll into view
        setTimeout(() => {
          const element = document.querySelector(
            `[data-merchant-id="${savedId}"]`
          );
          element?.scrollIntoView({ block: 'center', behavior: 'instant' });
        }, 300);
      }
    }
  }, [navigationType, isOpen, isContentReady]);
  
  return { isOpen, setIsOpen, setLastClickedId };
};
```

### Merchant Card Changes

```tsx
// In SearchResultCard.tsx or wherever the card is rendered
<div 
  data-merchant-id={merchant.id}
  onClick={() => {
    setLastClickedId?.(merchant.id);
    navigate(`/restaurant/${merchant.slug}`);
  }}
>
  {/* Card content */}
</div>
```

## Why This Approach Will Work

1. **No scroll event dependencies** - We don't need to track scroll position
2. **No DOM query fragility** - We query for a specific data attribute we control
3. **Native browser API** - `scrollIntoView()` works regardless of scroll container
4. **Timing resilience** - 300ms delay ensures content is rendered
5. **Visual correctness** - User sees the item they clicked, which is the expected UX

## Testing Steps

After implementation:
1. Search for "Williamsburg, Brooklyn"
2. Open the drawer and scroll down to find "Blend"
3. Tap on Blend to navigate to merchant page
4. Hit back button
5. Verify: Drawer opens AND "Blend" card is visible in the viewport (scrolled into view)

