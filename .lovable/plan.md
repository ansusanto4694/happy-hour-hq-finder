

# Fix: Scroll-to-Item Restoration for Mobile Drawer

## Root Cause Analysis

After tracing through the code, I've identified the issues:

### Issue 1: `scrollIntoView()` targets the wrong scroll container
The `data-merchant-id` attribute is on the `<Link>` element, and `scrollIntoView()` scrolls the nearest scrollable ancestor. However, the Vaul drawer manages its own internal scroll container, and `scrollIntoView()` may not be correctly identifying it as the scroll target.

### Issue 2: The refs may not persist correctly across remounts
When navigating away and back, React remounts the Results component, creating new ref instances. The `lastClickedIdRef` gets populated from session storage during `getInitialOpenState()`, which runs in `useState`, but this only happens once during initial render.

### Issue 3: Timing of content rendering
Mobile uses infinite scroll via `displayedResults` state. On back navigation, merchants are available, but `displayedResults` starts empty and then gets populated via `useEffect`. The restoration attempts may be finding no elements because the "Bright Side" card hasn't rendered yet.

## Solution: Fix the Scroll Container Targeting

We need to:
1. **Explicitly find Vaul's scroll container** and scroll within it (not rely on `scrollIntoView`)
2. **Ensure content is rendered** before attempting restoration
3. **Use longer delays** to account for infinite scroll initialization

## Files to Change

### 1. `src/hooks/useDrawerScrollRestoration.ts`

Completely rewrite the restoration logic to:
- Find Vaul's internal scroll container using `[data-vaul-drawer-content]` selector
- Find the target element within the drawer
- Calculate the offset and set `scrollTop` directly on the drawer's scroll container
- Use `MutationObserver` to detect when the target element appears in the DOM

```typescript
// Instead of scrollIntoView, manually calculate and set scroll position:
const drawerContent = document.querySelector('[data-vaul-drawer-content]');
const scrollContainer = drawerContent?.querySelector('[data-vaul-drawer-scroll]') 
  || drawerContent?.querySelector('.overflow-y-auto')
  || drawerContent;

const targetElement = document.querySelector(`[data-merchant-id="${savedId}"]`);
if (scrollContainer && targetElement) {
  const containerRect = scrollContainer.getBoundingClientRect();
  const elementRect = targetElement.getBoundingClientRect();
  const scrollOffset = elementRect.top - containerRect.top + scrollContainer.scrollTop;
  const centeredOffset = scrollOffset - (containerRect.height / 2) + (elementRect.height / 2);
  scrollContainer.scrollTop = Math.max(0, centeredOffset);
}
```

### 2. `src/components/MobileListDrawer.tsx`

Add a `data-vaul-drawer-scroll` attribute to the scrollable div so we can reliably find it:

```tsx
<div 
  ref={scrollRef} 
  data-vaul-drawer-scroll="true"
  className="px-4 pb-4 overflow-y-auto flex-1"
  style={{ minHeight: 0 }}
>
```

### 3. Alternative: Use MutationObserver

If the element doesn't exist yet (due to infinite scroll), use a MutationObserver to wait for it:

```typescript
const waitForElement = (selector: string, timeout: number = 2000): Promise<Element | null> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};
```

## Implementation Flow

```text
Back Navigation Flow (Fixed):
┌─────────────────────────────────────────────────────────────────┐
│ 1. User hits back button                                        │
│ 2. navigationType === 'POP'                                     │
│ 3. Hook reads savedState from sessionStorage                    │
│    → { isOpen: true, lastClickedMerchantId: 42 }                │
│ 4. isOpen initialized to true → Drawer opens                    │
│ 5. useEffect triggers restoration:                              │
│    a. Wait for drawer to fully open (500ms)                     │
│    b. Find drawer container: [data-vaul-drawer-scroll]          │
│    c. Use MutationObserver to wait for merchant card            │
│    d. Find [data-merchant-id="42"] within drawer                │
│    e. Calculate offset relative to scroll container             │
│    f. Set scrollContainer.scrollTop = centeredOffset            │
│ 6. User sees drawer with "Bright Side" centered                 │
└─────────────────────────────────────────────────────────────────┘
```

## Why This Will Work

1. **Direct scroll control** - Setting `scrollTop` directly is more reliable than `scrollIntoView`
2. **Explicit container targeting** - We find the exact scroll container using a data attribute
3. **MutationObserver** - Handles the case where infinite scroll hasn't rendered the element yet
4. **Longer initial delay** - 500ms gives Vaul time to fully render and open the drawer

## Testing Steps

After implementation:
1. Search for "Williamsburg, Brooklyn"
2. Open the drawer and scroll down to "Bright Side"
3. Tap on "Bright Side" to navigate
4. Tap the back button in the header
5. Verify: Drawer opens AND "Bright Side" is visible/centered in the viewport

