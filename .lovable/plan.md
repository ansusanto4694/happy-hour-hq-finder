

## Fix Badge Wrapping on Mobile Map Preview Card

### Problem
The deal type badge ("Drinks Only") and happy hour time badge ("4:00 PM – 6:00 PM") are wrapping onto separate lines because the time format is too verbose for the available space.

### Solution
Two small changes that together guarantee both badges fit on one line:

1. **Compact time format** -- Use a shorter time display like "4-6PM" instead of "4:00 PM - 6:00 PM". Drop the minutes when they're `:00` and remove the space before AM/PM. This alone saves ~60% of the time badge width.

2. **Prevent wrapping** -- Change the badge container from `flex-wrap` to `flex-nowrap` so they always stay on one line.

### Before vs After

```text
Before:  [Drinks Only]
         [4:00 PM – 6:00 PM]

After:   [Drinks Only] [4-6PM]
```

### Technical Details

**File: `src/components/MerchantMapPreviewCard.tsx`** (~10 lines changed)

- Add a local `formatCompactTime` helper that formats times concisely:
  - "4:00 PM" becomes "4PM"
  - "4:30 PM" becomes "4:30PM"
  - "12:00 PM" becomes "12PM"
- Update the time badge to use this compact format: `{compact start}-{compact end}`
- Change the badge row from `flex flex-wrap` to `flex flex-nowrap` to prevent any wrapping
- No changes to the shared `formatTime` utility (other components keep the full format)

