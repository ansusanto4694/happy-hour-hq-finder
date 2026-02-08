
# Fix Stale Sitemap: Point Crawlers to the Dynamic Sitemap

## The Problem

Right now, your `robots.txt` tells Google and all other search engines to look at `https://sipmunchyap.com/sitemap.xml`. That file is a static copy sitting in your `public/` folder with `lastmod` dates frozen at **2025-01-12** -- over a year old. Google sees this and thinks your site hasn't been updated in a year, so it crawls less frequently.

Meanwhile, you already have a perfectly good dynamic sitemap edge function (`generate-sitemap`) that generates fresh dates every time it's called. The crawlers just aren't being sent there.

## The Fix (2 File Changes)

### 1. Update `robots.txt` to point to the dynamic sitemap

Change the `Sitemap:` line from the static file to the edge function URL:

```
Sitemap: https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/generate-sitemap
```

When called without a `?type=` parameter, the edge function already returns a sitemap index that links to all four sub-sitemaps (static, cities, neighborhoods, restaurants) -- each with today's date.

### 2. Delete `public/sitemap.xml`

Remove the stale static file so there's no confusion. The edge function completely replaces it.

## What Happens After This Change

- Googlebot visits `robots.txt`, finds the new `Sitemap:` URL
- Hits the edge function, which returns a fresh sitemap index with today's date
- Follows the sub-sitemap links (also edge function URLs) to discover all your pages
- Restaurant pages show their actual `updated_at` timestamps from your database
- Cities and neighborhoods show today's date
- Google sees fresh content and increases crawl frequency

## Google Search Console Instructions

After this change is deployed and published, you'll want to tell Google about the new sitemap URL. Here's exactly what to do:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your `sipmunchyap.com` property
3. In the left sidebar, click **Sitemaps** (under "Indexing")
4. You'll see the old sitemap `https://sipmunchyap.com/sitemap.xml` listed -- click the three dots next to it and select **Remove sitemap** to clean it up
5. In the "Add a new sitemap" field at the top, paste:
   ```
   https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/generate-sitemap
   ```
6. Click **Submit**
7. Google will fetch it and show a "Success" status within a few minutes
8. You can click on the sitemap to verify it discovered all your URLs (restaurants, cities, neighborhoods)

**Tip:** After submitting, click "See sitemap index" to confirm Google sees all four sub-sitemaps and the correct URL counts.

## Files Changed

| File | Action | What Changes |
|------|--------|--------------|
| `public/robots.txt` | Modify | Update `Sitemap:` URL to point to the edge function |
| `public/sitemap.xml` | Delete | Remove the stale static file |

No edge function changes needed -- `generate-sitemap` already works correctly and produces fresh dates on every request.
