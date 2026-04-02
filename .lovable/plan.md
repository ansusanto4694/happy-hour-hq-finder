

## Bug: MobileCTABar — Mobile conversion tracking silently broken

### Root Cause

All three buttons (Call, Directions, Website) use Radix's `asChild` prop, which replaces the `Button` element with the child `<a>` tag. When `asChild` is used, the `onClick` handler placed on `<Button>` is **not forwarded** to the rendered `<a>` element — it's silently discarded. This means `handlePhoneClick`, `handleDirectionsClick`, and `handleWebsiteClick` never execute.

Zero mobile conversion events (calls, directions, website clicks) are being recorded from this component.

### Fix

Move the `onClick` handler from the `<Button>` to the child `<a>` element for all three buttons. This ensures the click handler is on the actual rendered DOM element.

**File: `src/components/MobileCTABar.tsx`**

For each of the three buttons, change from:

```tsx
<Button asChild onClick={handlePhoneClick}>
  <a href={...} className="...">
```

To:

```tsx
<Button asChild>
  <a href={...} onClick={handlePhoneClick} className="...">
```

This applies to:
- **Call button** (line 116→118): move `onClick={handlePhoneClick}` to the `<a>` tag
- **Directions button** (line 132→134): move `onClick={handleDirectionsClick}` to the `<a>` tag
- **Website button** (line 149→151): move `onClick={handleWebsiteClick}` to the `<a>` tag

No other files need changes. The `merchantId` prop is already correctly passed from `RestaurantProfileContent`.

