

## Simplify Mobile Events Feed — Tap-to-Expand with Modal

### Problem
On mobile, the Events & Updates section uses nested cards with 80px thumbnails, badges, descriptions, tags, and share buttons — too much visual clutter for a 390px viewport.

### Design
**Mobile only** — replace the card-based layout with a clean, minimal list. Each event is a single tappable row showing just the event name and a brief date/time hint. Tapping opens a dialog modal with the full details. Desktop stays unchanged.

### Changes

**1. New component — `src/components/EventDetailsModal.tsx`**

A `Dialog` that receives an event object and shows:
- Event image (if any) at top
- Title, recurring/one-time badge
- Description
- Next occurrence date, recurrence info, time range
- Category tags
- Share button
- Close button

**2. Update `RestaurantEventsFeed.tsx`**

- Import `useIsMobile` and the new `EventDetailsModal`
- **Mobile path**: render a simple list inside the existing card wrapper. Each row is a `div` with:
  - Event title (truncated)
  - Small right-aligned date hint (e.g. "Tue 6 PM")
  - Chevron-right icon to indicate tappable
  - `onClick` opens the `EventDetailsModal` for that event
- **Desktop path**: keep the existing card-based layout exactly as-is
- Track which event is selected via local state (`selectedEvent`)

### Technical Details
- The modal uses the existing `Dialog` / `DialogContent` component from the UI library
- No data fetching changes — same query, same sorted events
- Share functionality moves into the modal on mobile
- The row list uses a simple divider (`border-b`) between items for a clean, Yelp-like feel matching the mobile redesign direction

