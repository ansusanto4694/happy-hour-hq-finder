

## Refactor Events & Updates on Restaurant Profile

### Current State
The events feed renders each event as a full card with image thumbnail, description, badges, time info, category tags, and a share button — all visible inline. On a 390px mobile viewport this is verbose and pushes content down significantly.

### Proposed Design: Compact List + Detail Modal

**Compact list items** — each event becomes a slim, tappable row:
- Left: small thumbnail (w-12 h-12) or category icon if no image
- Center: event title (single line, truncated), next date + time on a second line
- Right: chevron icon indicating tappability
- No description, no category tags, no share button visible in the list
- Dividers between items instead of card borders (matching the mobile-redesign flat style)

**Event detail modal** — tapping a row opens a Dialog with full details:
- Event image displayed larger at the top (if present)
- Title, recurring/one-time badge
- Full description (no line clamp)
- Next occurrence date, recurrence pattern, time range
- Category tags
- Share button in the modal footer

This mirrors the pattern already used for offers (tap card → `OfferDetailsModal`).

### Changes

**1. New component — `src/components/events/EventDetailsModal.tsx`**

A Dialog that receives an event object and `isOpen`/`onClose` props. Renders:
- Large image or gradient placeholder at top
- Title + type badge
- Full description
- Date/time/recurrence details
- Category tags
- Share button

**2. Refactor `RestaurantEventsFeed.tsx`**

- Replace the nested Card-per-event layout with compact rows
- Each row: thumbnail, title, date+time summary — all clickable
- Remove the outer Card wrapper with the amber border — use a simple section header instead
- Add state for `selectedEvent` and render `EventDetailsModal`
- Move share logic into the modal

**3. No database or data changes needed**

The query, sorting, and `eventUtils` logic remain the same.

### Technical Details

- Compact rows use `py-3` padding with `border-b border-border` dividers
- Thumbnail: `w-12 h-12 rounded-md` with `object-cover`
- Date line combines next date + time into one string (e.g. "Wed, Mar 19 · 7:00 PM")
- Modal uses the existing `Dialog`/`DialogContent` components
- The section heading "Events & Updates" stays, but without the heavy amber-bordered Card container

