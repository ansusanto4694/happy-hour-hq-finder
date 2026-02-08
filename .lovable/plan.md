

## "Happening Today" Quick Filter

### What It Does
A companion button to "Happening Now" that filters results to show all merchants with happy hours scheduled for today -- regardless of whether they're currently active. Perfect for planning ahead during the day.

### How the Two Buttons Work Together

```text
+-----------------------------+-----------------------------+
|     [clock] Happening Now   |  [calendar] Happening Today |
+-----------------------------+-----------------------------+
```

- They sit side-by-side in a row at the top of the filter panel
- They are **mutually exclusive** -- tapping one turns off the other
- Both auto-deactivate when the user manually touches day or time filters
- "Clear All" clears both

### Behavior Comparison

| | Happening Now | Happening Today |
|---|---|---|
| Day filter | Today only | Today only |
| Time filter | Current time (point-in-time) | None (all hours) |
| Results | Only active-right-now happy hours | All happy hours scheduled today |
| Icon | Clock | Calendar |
| Active color | Orange-to-amber gradient | Blue-to-indigo gradient |
| Pulsing dot | Green (live indicator) | None (not "live") |

### User Flow

1. User opens /results and sees two buttons at the top of the filters: "Happening Now" and "Happening Today"
2. They tap "Happening Today" -- it lights up with a blue gradient
3. Results show all merchants that have any happy hour on today's day of the week (e.g., all Wednesday happy hours)
4. They tap "Happening Now" instead -- "Happening Today" turns off, "Happening Now" lights up with the orange gradient and pulsing dot, results narrow to only currently-active happy hours
5. They tap a day button (e.g., "Fri") -- both quick filters turn off, results update for Friday
6. "Clear All" resets everything including both quick filters

### What Stays the Same
- All existing filter logic
- The "Happening Now" button behavior and styling
- Mobile filter drawer structure
- URL parameter persistence

---

### Technical Details

**Approach: Same client-side pattern as "Happening Now"**

"Happening Today" sets the day filter to today but leaves time filters empty, so `useMerchants` returns all merchants with happy hours on that day. No changes to the data-fetching layer.

**Files to modify:**

1. **`src/pages/Results.tsx`** (~20 lines changed)
   - Add `happeningToday` URL param state (boolean), similar to `happeningNow`
   - Add `setHappeningToday` function that clears `happeningNow`, manual days, and manual times when activated
   - Update `setHappeningNow` to also clear `happeningToday` when activated (mutual exclusivity)
   - Update `handleDaysChange`, `handleStartTimeChange`, `handleEndTimeChange` to also auto-off `happeningToday`
   - Update `effectiveDays`: if `happeningToday` is true, set to current day (same mapping as `happeningNow`)
   - Update `effectiveStartTime`/`effectiveEndTime`: if `happeningToday` is true, leave as empty strings (no time filter)
   - Pass `happeningToday` and `onHappeningTodayChange` to `UnifiedFilterBar` and `MobileListDrawer`
   - Pass `happeningToday` to `SearchResults`
   - Include `happeningToday` in the clear-all reset

2. **`src/components/UnifiedFilterBar.tsx`** (~25 lines changed)
   - Add `happeningToday` and `onHappeningTodayChange` props
   - Replace the single full-width button with a two-button row layout using `grid grid-cols-2 gap-2`
   - Add "Happening Today" button with calendar icon and blue-to-indigo gradient when active
   - When day or time controls are manually changed, also call `onHappeningTodayChange(false)`
   - Include `happeningToday` in `hasAnyFilters` and `clearAllFilters`

3. **`src/components/MobileFilterDrawerV2.tsx`** (~2 lines changed)
   - Pass through `happeningToday` and `onHappeningTodayChange` props

4. **`src/components/MobileListDrawer.tsx`** (~4 lines changed)
   - Accept and pass through `happeningToday` and `onHappeningTodayChange` props
   - Pass `happeningToday` to `SearchResults`

5. **`src/components/SearchResults.tsx`** (~2 lines changed)
   - Accept and pass `happeningToday` to `SearchResultsHeader`

6. **`src/components/SearchResultsHeader.tsx`** (~10 lines changed)
   - Add `happeningToday` prop
   - Add a third display branch: when `happeningToday` is true, show "Happening Today" label with a calendar icon (no pulsing dot, since it's not "live")
   - Display order: Happening Now > Happening Today > manual time range

**Filtering logic (in Results.tsx):**

```text
effectiveDays:
  if happeningNow -> [currentDay]
  else if happeningToday -> [currentDay]
  else -> selectedDays (manual)

effectiveStartTime / effectiveEndTime:
  if happeningNow -> currentTime / currentTime
  if happeningToday -> "" / "" (no time filter = show all hours today)
  else -> manual startTime / endTime
```

**Mutual exclusivity (in Results.tsx):**

```text
setHappeningNow(true):
  set happeningNow = true
  set happeningToday = false  // NEW
  clear days, startTime, endTime

setHappeningToday(true):
  set happeningToday = true
  set happeningNow = false   // NEW
  clear days, startTime, endTime

setHappeningToday(false):
  just remove happeningToday param
```

**Visual styling for the two-button row (in UnifiedFilterBar.tsx):**

```text
Layout: grid grid-cols-2 gap-2

"Happening Now" (left):
  OFF: outline, muted, clock icon
  ON: orange-to-amber gradient, white text, pulsing green dot

"Happening Today" (right):
  OFF: outline, muted, calendar icon
  ON: blue-to-indigo gradient (from-blue-500 to-indigo-500), white text, no pulsing dot
```
