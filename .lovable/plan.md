

# Fix: Make Sitemap Submittable in Google Search Console

## The Problem

Google Search Console only accepts sitemap URLs under your verified domain (`sipmunchyap.com`). The current `robots.txt` points to the Supabase edge function URL, which GSC won't accept.

## The Solution

Create a static `public/sitemap.xml` that acts as a **sitemap index** -- it contains zero actual page URLs, only pointers to the 4 dynamic edge function sub-sitemaps. This gives you:

- A `sipmunchyap.com/sitemap.xml` URL that GSC accepts
- All actual page data still served fresh from the edge function on every crawl

## How It Works

```text
Google Search Console
       |
       v
sipmunchyap.com/sitemap.xml  (static index file -- just 4 links)
       |
       v
Points to 4 dynamic sub-sitemaps (edge function):
  - generate-sitemap?type=static        (3 pages, fresh dates)
  - generate-sitemap?type=cities         (all cities, fresh dates)
  - generate-sitemap?type=neighborhoods  (all neighborhoods, fresh dates)
  - generate-sitemap?type=restaurants    (all restaurants, real updated_at dates)
```

Google follows the links in the index and fetches the sub-sitemaps directly from the edge function, so all the actual content is always dynamic and fresh.

## Changes

### 1. Create `public/sitemap.xml` (new file)

A minimal sitemap index file containing only references to the 4 dynamic sub-sitemaps:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/generate-sitemap?type=static</loc>
  </sitemap>
  <sitemap>
    <loc>https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/generate-sitemap?type=cities</loc>
  </sitemap>
  <sitemap>
    <loc>https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/generate-sitemap?type=neighborhoods</loc>
  </sitemap>
  <sitemap>
    <loc>https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/generate-sitemap?type=restaurants</loc>
  </sitemap>
</sitemapindex>
```

No `lastmod` dates in the index itself -- Google will re-fetch the sub-sitemaps on its own schedule and get fresh dates from the edge function every time.

### 2. Update `public/robots.txt`

Change the Sitemap line back to the local path:

```
Sitemap: https://sipmunchyap.com/sitemap.xml
```

### Google Search Console Steps (after publishing)

1. Go to **Sitemaps** in GSC (left sidebar, under "Indexing")
2. In the "Add a new sitemap" field, type: **sitemap.xml**
3. Click **Submit**
4. Google will fetch it, follow the 4 sub-sitemap links, and discover all your pages with fresh dates

## Files Changed

| File | Action | What Changes |
|------|--------|--------------|
| `public/sitemap.xml` | Create | Minimal sitemap index pointing to 4 dynamic edge function sub-sitemaps |
| `public/robots.txt` | Modify | Change Sitemap URL back to `https://sipmunchyap.com/sitemap.xml` |

No edge function changes needed.

