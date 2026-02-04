

# Plan: Optimize Initial Image Loading on Mobile

## What We're Doing

Making your homepage load faster on mobile by being smarter about when restaurant logos are loaded. Instead of loading all logos at once (even ones you can't see yet), we'll only load logos that are visible or about to become visible.

---

## Current Situation

Right now, when a visitor opens your homepage on their phone:

| What Happens | Impact |
|--------------|--------|
| All carousel logos start loading immediately | ~3-4MB of data downloaded upfront |
| Browser already has `loading="lazy"` on images | Good start, but not optimized enough |
| All merchants in all carousels load at once | More data than needed for initial view |

The `loading="lazy"` attribute is already present, which is good. However, the browser's built-in lazy loading isn't always aggressive enough - it often preloads images that are slightly off-screen "just in case."

---

## What We're Going to Improve

### 1. Add Lower Priority to Carousel Images

Tell the browser explicitly that these images are not urgent - focus on more important things first (like text and layout), then load logos when there's bandwidth available.

**What this means for visitors:** The page structure appears faster, and logos fill in smoothly as they scroll.

---

### 2. Add Asynchronous Image Decoding

Allow the browser to decode (process) images in the background without freezing the page. This prevents the "janky" feeling when multiple images load at once.

**What this means for visitors:** Smoother scrolling while logos are loading.

---

### 3. Limit Visible Carousel Items on Initial Load (Mobile Only)

On mobile, we currently show all merchants in a horizontally scrollable carousel. We'll optimize this to prioritize the first few visible items while the rest load in the background.

**What this means for visitors:** The first 2-3 logos they actually see load instantly; the rest load as they swipe.

---

## What Will NOT Change

| Aspect | Status |
|--------|--------|
| Visual design | Identical - logos appear in the same places, same sizes |
| How uploads work | Unchanged - merchants upload exactly as before |
| Desktop experience | Unchanged - desktop already performs well |
| Mobile layout | Unchanged - same carousel, same scrolling behavior |

---

## Expected Improvement

| Metric | Before | After (Estimated) |
|--------|--------|-------------------|
| Initial image requests | All logos at once | Only visible logos first |
| Time to interactive | Delayed by image loading | Faster response |
| Largest Contentful Paint | ~4.7 seconds | ~3-4 seconds |
| Mobile PageSpeed | 64 | 70-75 (estimated) |

This is a modest but meaningful improvement. The bigger wins will come from Option B (compress on upload) when we implement that later.

---

## Technical Details

**Files to modify:**

1. **MobileCarouselCard.tsx** - Add `fetchpriority="low"` and `decoding="async"` to logo images
2. **CarouselCard.tsx** - Add the same optimizations for consistency (even though desktop is less affected)
3. **SearchResultCard.tsx** - Apply the same pattern to search result logos
4. **MobileCarousel.tsx** - Optionally limit initial render to first N items, with the rest loading as user scrolls

**New utility (optional):** Create a small helper to standardize image loading attributes across all logo images, making future optimizations easier to apply.

---

## Summary

This optimization teaches the browser to be smarter about loading images:
- Load what's visible first
- Process images in the background
- Don't block the page while waiting for logos

It's a "quick win" that improves mobile performance without changing anything about how your site looks or works.

