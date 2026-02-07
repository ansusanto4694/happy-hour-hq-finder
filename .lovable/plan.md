

## Fix: Bottom Navigation Always Tappable Over the Results Drawer

**The problem in plain terms:** When you pull up the results list on `/results`, the drawer covers the entire screen -- including the Home, Search, Favorites, and Account buttons at the bottom. Even though those buttons look like they should be on top, the drawer is actually blocking your taps from reaching them.

**Why previous fixes didn't work:** Raising the navigation bar's priority (z-index) alone doesn't solve it because the drawer library applies a visual effect (`shouldScaleBackground`) that fundamentally changes how the browser decides what's "on top." It traps the navigation bar behind the drawer no matter how high we set its priority.

**The fix (two small changes):**

1. **Disable the background scaling effect on the results drawer** -- This is a one-line change in `MobileListDrawer.tsx`. It removes the visual trick that traps the navigation bar. The drawer will still slide up and work exactly the same; you just won't see a subtle background zoom effect (which most users never notice anyway).

2. **Remove the dark overlay behind the drawer** -- The drawer currently puts a dark semi-transparent layer over the entire screen (including over the nav bar). We'll remove this overlay specifically for the results drawer since the drawer sits on top of a map and doesn't need a dimming effect. This ensures nothing blocks your taps on the navigation buttons.

**What stays the same:**
- The drawer still slides up and down as before
- Scrolling through the merchant list works identically
- The bottom padding we already added keeps merchant cards from hiding behind the nav bar
- All other drawers/modals in the app are unaffected

---

### Technical Details

**File 1: `src/components/MobileListDrawer.tsx`**
- Add `shouldScaleBackground={false}` to the `Drawer` component on line 79
- Change: `<Drawer open={isOpen} onOpenChange={onOpenChange}>` becomes `<Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground={false}>`

**File 2: `src/components/MobileListDrawer.tsx`**
- Pass a custom className to `DrawerContent` to remove the overlay
- Change: `<DrawerContent className="max-h-[85vh] flex flex-col overflow-hidden">` becomes `<DrawerContent className="max-h-[85vh] flex flex-col overflow-hidden" overlayClassName="pointer-events-none bg-transparent">`

Since `DrawerContent` doesn't currently support an `overlayClassName` prop, we'll instead customize the overlay directly:

**File 2 (revised): `src/components/ui/drawer.tsx`**
- Make the `DrawerOverlay` accept an optional prop to disable pointer events
- Update `DrawerContent` to accept an optional `overlayProps` or simply allow passing overlay className

**Simpler approach -- just two changes:**

**File 1: `src/components/MobileListDrawer.tsx` (line 79)**
- Add `shouldScaleBackground={false}` and `modal={false}` to the Drawer
- `modal={false}` tells the drawer library not to trap focus or block interactions outside the drawer
- This is the key fix: it allows taps on the nav bar to go through

**File 2: `src/components/MobileListDrawer.tsx` (line 80)**  
- Add a custom overlay style to `DrawerContent` -- we won't need to change the shared drawer component at all since `modal={false}` removes the overlay behavior

**Final implementation -- exactly two lines change in one file:**

`src/components/MobileListDrawer.tsx`:
1. Line 79: `<Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground={false} modal={false}>`
2. No other files need to change

Setting `modal={false}` means:
- The drawer no longer blocks interactions with the rest of the page
- Users can tap Home, Search, Favorites, Account while the drawer is open
- The drawer still opens, closes, and scrolls normally
- `shouldScaleBackground={false}` prevents the stacking context issue

