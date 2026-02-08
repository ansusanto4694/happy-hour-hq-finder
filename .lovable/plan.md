

## "Happening Now" Quick Filter

### What It Does
A prominent toggle that instantly filters results to only show merchants whose happy hour is active right now -- based on the current day of the week and time of day.

### User Experience

**Desktop (filter sidebar on /results):**
- At the very top of the filter panel, above Categories and all other filters, there is a large, eye-catching "Happening Now" toggle button
- It uses a distinct visual style -- a gradient pill (orange-to-amber, matching the existing day-of-week selected style) with a clock/zap icon and the text "Happening Now"
- When OFF: it looks like a muted outline button, clearly tappable
- When ON: it fills with the orange gradient, glows slightly, and a small pulsing dot appears next to the text to convey "live" status
- The Day of the Week and Happy Hour Time sections remain fully interactive at all times
- If the user toggles "Happening Now" ON and then touches any day button or changes a start/end time, "Happening Now" automatically turns OFF -- no confirmation needed, no jarring layout shift
- This feels natural: "I was looking at what's live, but now I want to plan for Friday evening" -- the toggle simply deactivates as the manual controls take over
- The "Clear All" button also clears "Happening Now"

**Mobile (filter drawer):**
- Same toggle appears at the top of the filter drawer content, before Categories
- Same auto-off behavior when day/time controls are touched
- Same visual treatment (gradient pill with pulsing dot when active)

### How It Feels Step-by-Step

1. User opens /results and sees "Happening Now" at the top of the filters, styled as a clear call-to-action
2. They tap it -- the button lights up with the orange gradient and a pulsing dot
3. The results list instantly updates to show only places with active happy hours right now
4. They scroll through results, then decide to check Friday deals instead
5. They tap "Fri" in the Days section -- "Happening Now" silently turns off, the button returns to its muted state, and results update to show Friday happy hours
6. If they want to go back to "live" results, they just tap "Happening Now" again -- it clears their manual day/time selections and re-applies the current moment filter

### What Stays the Same
- All existing filter logic (categories, distance, menu type, offers)
- The filter sidebar layout and scrolling behavior
- Mobile filter drawer structure
- URL parameter persistence for other filters

---

### Technical Details

**Approach: Client-side filtering (fastest possible)**

The `merchant_happy_hour` data (day_of_week, happy_hour_start, happy_hour_end) is already fetched in the main `useMerchants` query. "Happening Now" will simply set the day and time filters to the current values, meaning zero additional network calls.

**Files to modify:**

1. **`src/pages/Results.tsx`** (~15 lines changed)
   - Add `happeningNow` URL param state (boolean, persisted like other filters)
   - When `happeningNow` is true, compute the current day-of-week (0-6, matching the DB schema) and current time, then pass those as the `selectedDays` and `startTime`/`endTime` to `useMerchants` instead of the manual values
   - When `handleDaysChange` or `handleStartTimeChange`/`handleEndTimeChange` are called AND `happeningNow` is true, auto-set `happeningNow` to false before applying the manual change
   - Pass `happeningNow` and `onHappeningNowChange` to `UnifiedFilterBar` and `MobileFilterDrawerV2`
   - Include `happeningNow` in the "Clear All" reset logic

2. **`src/components/UnifiedFilterBar.tsx`** (~30 lines changed)
   - Add `happeningNow` and `onHappeningNowChange` to the props interface
   - Add the "Happening Now" toggle button at the top of CardContent, before all other filter sections
   - Visual: a full-width button with clock icon, gradient when active, pulsing dot indicator
   - When day buttons are clicked or time dropdowns are changed inside UnifiedFilterBar, call `onHappeningNowChange(false)` before applying the change
   - Include `happeningNow` in the `hasAnyFilters` check
   - Include `happeningNow` in the `clearAllFilters` function

3. **`src/components/MobileFilterDrawerV2.tsx`** (~5 lines changed)
   - Pass through `happeningNow` and `onHappeningNowChange` props to `UnifiedFilterBar`

**Filtering logic (in Results.tsx):**

```text
if happeningNow is true:
  currentDay = new Date().getDay()  -- convert to 0=Mon...6=Sun format
  currentTime = format current time as HH:MM string
  pass [currentDay] as selectedDays
  pass currentTime as both startTime and endTime to useMerchants
else:
  use manual day/time filter values as today
```

This reuses the existing time/day filtering in `useMerchants` (lines 269-305) with no changes needed to the data-fetching layer.

**Auto-off behavior (in Results.tsx):**

```text
handleDaysChange(days):
  if happeningNow: set happeningNow = false
  update days URL param as normal

handleStartTimeChange(time):
  if happeningNow: set happeningNow = false  
  update startTime URL param as normal

handleEndTimeChange(time):
  if happeningNow: set happeningNow = false
  update endTime URL param as normal
```

**Visual styling for the toggle (in UnifiedFilterBar.tsx):**

```text
When OFF:
  - Outline style, muted text, clock icon
  - "Happening Now" label

When ON:
  - Orange-to-amber gradient background (bg-gradient-to-r from-orange-500 to-amber-500)
  - White text, clock icon
  - Small pulsing green dot (animate-pulse) to indicate "live"
  - "Happening Now" label
```

