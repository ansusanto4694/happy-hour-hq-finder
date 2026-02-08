

# Solving the SPA Rendering Problem for SEO

## The Problem

SipMunchYap is a client-side React SPA. When a crawler or social media bot visits any page, the initial HTML it receives is always the same generic `index.html`:

```text
<title>SipMunchYap - Find the Best Happy Hours Near You</title>
<meta property="og:title" content="SipMunchYap - Find the Best Happy Hours Near You">
<meta property="og:image" content="...generic-social-image.png">
```

The restaurant-specific titles, descriptions, OG tags, and structured data are only injected later by JavaScript via `react-helmet-async`. This means:

- **Social sharing previews** (iMessage, Facebook, Twitter, LinkedIn, Slack) all show the generic SipMunchYap card instead of "Ainslie - Happy Hour in Brooklyn, NY" with the restaurant's logo
- **Non-Google crawlers** (Bing, DuckDuckGo, Apple) may not execute JS at all
- **Google** does execute JS but deprioritizes pages where metadata arrives late

## The Solution: Meta Proxy Edge Function

Create a lightweight edge function that acts as a "meta proxy" -- it intercepts shared/crawled URLs, fetches the relevant data from Supabase, and returns a minimal HTML page with all the correct meta tags and a transparent redirect to the real SPA.

This approach:
- Changes **zero** frontend code or UI components
- Has **zero** performance impact on the SPA (the proxy is a separate path)
- Works with the existing Lovable Cloud hosting and Supabase stack

```text
User shares link
       |
       v
  Bot/Crawler hits meta proxy URL
       |
       v
  Edge function fetches restaurant data from Supabase
       |
       v
  Returns HTML with correct OG tags + redirect
       |
       v
  Bot sees: "Ainslie - Happy Hour in Brooklyn, NY" + restaurant logo
  Human sees: Instant redirect to the SPA page
```

## Implementation Steps

### Step 1: Create the `og-meta` Edge Function

A new Supabase edge function at `supabase/functions/og-meta/index.ts` that:

- Accepts a `path` query parameter (e.g., `?path=/restaurant/ainslie-williamsburg-brooklyn`)
- Parses the path to determine the page type (restaurant, location landing, homepage)
- Fetches the relevant data from Supabase (restaurant name, city, logo, etc.)
- Returns a minimal HTML document containing:
  - Correct `<title>` tag
  - Correct `og:title`, `og:description`, `og:image`, `og:url` meta tags
  - Correct `twitter:card`, `twitter:title`, etc.
  - JSON-LD structured data
  - A `<meta http-equiv="refresh">` redirect to the real SPA URL
  - A JavaScript `window.location.replace()` fallback redirect
- For human visitors, the redirect happens instantly (under 100ms)
- For bots, they get the meta tags they need without executing any JavaScript

Supported page types:
- `/restaurant/:slug` -- Fetches merchant data, returns restaurant-specific meta
- `/happy-hour/:citySlug` -- Returns city-specific meta
- `/happy-hour/:citySlug/:neighborhoodSlug` -- Returns neighborhood-specific meta
- `/` and other static pages -- Returns appropriate defaults

### Step 2: Update the Share Function

Modify `useShareProfile.ts` so that the `buildShareUrl()` method generates a meta proxy URL instead of the raw SPA URL. The proxy URL will look like:

```
https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/og-meta?path=/restaurant/ainslie-williamsburg-brooklyn&utm_source=share&utm_medium=profile
```

When a human clicks this link:
1. The edge function returns HTML with correct OG tags
2. The `<meta http-equiv="refresh" content="0;url=https://sipmunchyap.com/restaurant/ainslie-williamsburg-brooklyn?utm_source=share&utm_medium=profile">` immediately redirects them to the SPA
3. Total added latency: ~50-100ms (imperceptible)

When a bot/crawler processes this link:
1. It reads the HTML directly
2. It sees the correct title, description, OG image, and structured data
3. Social previews render correctly with the restaurant name and image

### Step 3: Update Event Sharing

The `RestaurantEventsFeed.tsx` component also has share functionality that bypasses the `useShareProfile` hook. Update it to also route through the meta proxy for consistent social previews.

### Step 4: Register the Edge Function

Add the function to `supabase/config.toml` with `verify_jwt = false` since it needs to be publicly accessible to crawlers.

## What This Does NOT Change

- No changes to the SPA code, routing, or rendering
- No changes to the UI/UX -- users see the same pages, same performance
- No SSR, no framework migration, no build process changes
- No impact on Lighthouse scores or Core Web Vitals
- `react-helmet-async` and `SEOHead` continue working as-is for in-app navigation

## Technical Details

### Edge Function Response (for `/restaurant/ainslie-williamsburg-brooklyn`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ainslie - Happy Hour in Brooklyn, NY | SipMunchYap</title>
  <meta name="description" content="Find happy hour deals at Ainslie in Brooklyn. Check hours, menu, and location details.">
  <meta property="og:title" content="Ainslie - Happy Hour in Brooklyn, NY">
  <meta property="og:description" content="Find happy hour deals at Ainslie in Brooklyn.">
  <meta property="og:image" content="https://...ainslie-logo.png">
  <meta property="og:url" content="https://sipmunchyap.com/restaurant/ainslie-williamsburg-brooklyn">
  <meta name="twitter:card" content="summary_large_image">
  <!-- ... more meta tags ... -->
  <script type="application/ld+json">{ restaurant structured data }</script>
  <meta http-equiv="refresh" content="0;url=https://sipmunchyap.com/restaurant/ainslie-williamsburg-brooklyn">
</head>
<body>
  <p>Redirecting to <a href="https://sipmunchyap.com/restaurant/ainslie-williamsburg-brooklyn">Ainslie on SipMunchYap</a>...</p>
  <script>window.location.replace("https://sipmunchyap.com/restaurant/ainslie-williamsburg-brooklyn");</script>
</body>
</html>
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/og-meta/index.ts` | Create -- the meta proxy edge function |
| `supabase/config.toml` | Modify -- add `[functions.og-meta]` with `verify_jwt = false` |
| `src/hooks/useShareProfile.ts` | Modify -- update `buildShareUrl()` to generate proxy URLs |
| `src/components/RestaurantEventsFeed.tsx` | Modify -- route event sharing through the proxy |

### Future Enhancement (Optional, Not in This Plan)

Once the meta proxy is working, the dynamic sitemap edge function could also reference the proxy URLs. This would give search engines the pre-rendered meta tags even when crawling from the sitemap, but this is only needed if Google Search Console shows indexing issues.

