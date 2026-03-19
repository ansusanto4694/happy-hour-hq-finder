

## Merchant Portal Redesign — Sidebar + Multi-Section SaaS Layout

### Current State
The Merchant Portal is a single-page layout with tabs (Events, Offers). Happy hours and deals are managed through modal dialogs on the public profile page (`RestaurantProfileEditor`), not within the portal. There is no store hours table in the database.

### Proposed Architecture

```text
┌──────────────────────────────────────────────────────┐
│  Header: Logo + Restaurant Name + "View Listing" →   │
├────────────┬─────────────────────────────────────────┤
│  Sidebar   │  Main Content Area                      │
│            │                                         │
│  Dashboard │  (renders section based on sidebar      │
│  Events    │   selection)                            │
│  Offers    │                                         │
│  Happy Hr  │                                         │
│  Store Hrs │                                         │
│  Settings  │                                         │
│            │                                         │
└────────────┴─────────────────────────────────────────┘
```

### Sidebar Sections

1. **Dashboard** — Overview card showing listing health: number of active events, whether happy hours are set, store hours completeness. Quick-glance stats.

2. **Events** — Existing CRUD for one-time and recurring events. Already built; just moves into the new layout.

3. **Offers** — Currently a "coming soon" placeholder. Keeps the placeholder but is now a real nav item.

4. **Happy Hours** — Brings the `HappyHoursForm` (currently inside `RestaurantProfileEditor` dialog) into the portal as a standalone page section. Merchants can manage their happy hour schedule directly. Also surfaces the `HappyHourDealsManager` (menu items) inline below the schedule.

5. **Store Hours** — New feature. Requires a new `merchant_store_hours` table to store regular operating hours (day_of_week, open_time, close_time, is_closed). Similar UI to HappyHoursForm.

6. **Settings** — Brings `BasicInfoForm`, `AddressForm`, and `LogoUpload` from `RestaurantProfileEditor` into a full settings page. No more modal — merchants edit their listing info directly in the portal.

### Technical Plan

**Database migration** — Create `merchant_store_hours` table:
- `id` (uuid, PK)
- `store_id` (integer, FK to Merchant.id)
- `day_of_week` (integer, 0-6)
- `open_time` (time)
- `close_time` (time)
- `is_closed` (boolean, default false)
- `created_at`, `updated_at` (timestamps)
- RLS: public SELECT, admin + merchant owner INSERT/UPDATE/DELETE

**New/modified files:**

| File | Change |
|---|---|
| `src/pages/MerchantPortal.tsx` | Full rewrite: wrap in `SidebarProvider`, render sidebar + routed content area using local state (not URL routes) to switch sections |
| `src/components/merchant-portal/PortalSidebar.tsx` | New — sidebar with nav items (Dashboard, Events, Offers, Happy Hours, Store Hours, Settings), using Shadcn Sidebar with `collapsible="icon"` |
| `src/components/merchant-portal/PortalDashboard.tsx` | New — overview cards showing listing completeness |
| `src/components/merchant-portal/PortalEvents.tsx` | New — extracted events section (existing logic from MerchantPortal) |
| `src/components/merchant-portal/PortalHappyHours.tsx` | New — embeds `HappyHoursForm` + `HappyHourDealsManager` inline |
| `src/components/merchant-portal/PortalStoreHours.tsx` | New — CRUD for store hours using new table |
| `src/components/merchant-portal/PortalSettings.tsx` | New — embeds `BasicInfoForm`, `AddressForm`, `LogoUpload` inline |
| `src/hooks/useMerchantStoreHours.ts` | New — query + mutations for store hours |

**Layout approach**: Uses the Shadcn `SidebarProvider` + `Sidebar` component. On mobile, the sidebar collapses to icon-only or offcanvas. The main content area fills the remaining space. Section switching is managed via local React state (`activeSection`) rather than nested routes, keeping the URL as `/merchant/:id/manage`.

**What stays the same**: The `RestaurantProfileEditor` dialog on the public profile page remains functional for admin quick-edits, but the portal becomes the primary management interface for merchant owners.

### Section Details

**Dashboard** shows:
- Active events count
- Happy hour schedule status (set / not set)
- Store hours status (complete / incomplete)
- Link to view public listing

**Store Hours** UI:
- 7-row form (Mon–Sun), each with open/close time pickers and an "is closed" toggle
- Save button applies all changes at once (delete-and-reinsert pattern, same as happy hours)

**Happy Hours** section:
- Top half: happy hour time schedule (reuses `HappyHoursForm`)
- Bottom half: happy hour menu/deals (reuses `HappyHourDealsManager`, but adapted to work inline instead of in a dialog)

**Settings** section:
- Restaurant name, phone, website
- Full address
- Logo upload
- All using existing form components, just rendered inline instead of in a modal

