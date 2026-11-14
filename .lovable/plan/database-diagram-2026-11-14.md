# Database diagram

Create a chart in Files (`database_diagram.mmd`) showing all 27 tables and how they link to each other.

## What it shows
- **Restaurants:** Merchant and business, plus hours, happy hours, deals, events, offers, redemptions, Google ratings, categories and listing issues.
- **Reviews:** reviews, review ratings and review media.
- **People:** profiles, user roles, merchant owners and favorites.
- **Homepage:** carousels and carousel merchants.
- **Analytics:** sessions, events and funnel events.
- **Other:** donations, location cache and sitemap pings, which link to nothing else.

Each box shows the table's ID, its linking fields and a few key fields. Each line shows one link, for example "restaurant has many deals".

## Technical details
- Mermaid `erDiagram` built from the current schema's foreign keys, saved to `/mnt/documents/database_diagram.mmd` and shown with `text/vnd.mermaid`.
- No app or database changes.
