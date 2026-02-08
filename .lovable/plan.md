

## Fix: Back Button Requires Double-Tap on Mobile

### Root Cause

The issue is **not** with event propagation or decorative overlays (the previous fixes addressed the wrong layer). The actual culprit is the **Radix Toast Viewport** -- an invisible element that sits on top of the header and intercepts the first tap.

Here's what's happening:

In `src/components/ui/toast.tsx`, the `ToastViewport` is rendered with these classes:

```
fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4
```

This creates an invisible, always-present element that:
- Is positioned at **fixed top-0** (same area as the sticky header)
- Has **z-[100]** (higher than the header's **z-50**, so it sits ON TOP)
- Is **w-full** (spans the entire screen width)
- Has **p-4** (16px padding on all sides, giving it a 32px height even when empty)

Even when there are **zero active toasts**, this empty container is still a DOM element with real dimensions (full width x 32px tall) sitting invisibly over the top of the screen at a higher z-index than the header.

When the user taps the back button:
1. The touch lands on the invisible ToastViewport (z-100) instead of the button (z-50)
2. The button may show a brief highlight/active state, but the click event is consumed by the empty viewport
3. No navigation happens
4. On the second tap, browser behavior or slight position difference allows the event through

This also explains why the **browser's native back button works fine** -- it doesn't rely on tapping the UI.

### The Fix

Add `pointer-events-none` to the `ToastViewport` so it never blocks interactions when empty. The individual toast items already have `pointer-events-auto` in their styling (in the `toastVariants` definition), so actual toast notifications will remain fully interactive and dismissible.

**File: `src/components/ui/toast.tsx`** (1 line changed)

Add `pointer-events-none` to the `ToastViewport` className. This way:
- Empty viewport = passes all taps through to the header below
- Active toasts = each toast has its own `pointer-events-auto` so they still work

### Previous Fixes (Can Be Cleaned Up)

The earlier fixes (`e.stopPropagation()` in handleBack, `pointer-events-none` on decorative overlays) were targeting the wrong cause. They are harmless but unnecessary -- they can optionally be removed to keep the code clean, though leaving them is also fine.
