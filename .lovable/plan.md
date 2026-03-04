

## Your idea — in plain English

**Your proposal is absolutely valid and a great idea.** Here's why:

Right now, if someone lands on `/happy-hour/new-york-ny/west-village`, they see West Village results — but there's no way to browse other neighborhoods from that page. They're stuck. The neighborhood filter dropdown doesn't even show up on neighborhood pages. It's like walking into a store that only has one aisle and no signs pointing to the rest of the store.

Your idea: **show the same neighborhood dropdown on neighborhood pages, just pre-selected to the current one.** If someone picks "Williamsburg" from the dropdown, the page navigates to `/new-york-ny/williamsburg`. If they clear it, they go back to `/new-york-ny` (the full city view). Simple, intuitive, and it turns a dead-end page into a discovery tool.

## What's wrong today (no code jargon)

Two things block this:

1. **The neighborhood dropdown is deliberately hidden** on neighborhood pages. The code says: "if we're already on a neighborhood page, don't show any neighborhood options." So the filter just doesn't appear.

2. **Picking a neighborhood uses a search parameter** (like `?neighborhood=Williamsburg`) instead of changing the URL path. So even if we showed the dropdown, selecting a new neighborhood wouldn't take you to its dedicated page — it would just tack on a filter to the current page.

## What we'll change

**Three small changes, all in one file** (`LocationLanding.tsx`):

1. **Always show the neighborhood dropdown** — remove the rule that hides it on neighborhood pages. Whether you're on the city page or a specific neighborhood page, the dropdown appears with all available neighborhoods listed.

2. **Pre-select the current neighborhood** — if you're on `/west-village`, the dropdown shows "West Village" already selected, so you know where you are.

3. **Navigate to the new neighborhood URL when you pick one** — instead of adding a search parameter, selecting "Williamsburg" takes you to `/happy-hour/new-york-ny/williamsburg`. Clearing the filter takes you back to `/happy-hour/new-york-ny`. This keeps your SEO-friendly URLs intact and makes the browser back button work naturally.

Also applies the same geo-radius filtering (center-of-neighborhood + distance) for URL-based neighborhood pages, not just dropdown selections — so the distance slider works consistently everywhere.

## The user experience after this change

- **Land on** `/new-york-ny/west-village` → see West Village results, dropdown shows "West Village" selected
- **Pick "Williamsburg"** from dropdown → URL changes to `/new-york-ny/williamsburg`, results update
- **Clear the filter** → URL changes to `/new-york-ny`, see all city results
- **Distance slider** works the same way on all views

