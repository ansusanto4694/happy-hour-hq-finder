

# Plan: Improve Initial Page Load Speed (Core Web Vitals)

## The Problem Explained Simply

When someone visits your website, their browser needs to download and process a lot of "stuff" before they can see the page. Think of it like unpacking a moving truck - the more boxes you have to unpack before you can sit on your couch, the longer you wait.

Right now, your site's "First Contentful Paint" (FCP) and "Largest Contentful Paint" (LCP) scores are around **22 seconds** in testing. While this is likely inflated by the development environment, there are real improvements we can make.

**What these terms mean:**
- **FCP (First Contentful Paint)**: How long until a visitor sees *something* on screen
- **LCP (Largest Contentful Paint)**: How long until the main content (like your hero section) is visible

---

## What's Already Working Well

Before we discuss improvements, here's what's already optimized:

1. **Page-level code splitting** - Each page only loads when needed
2. **Lazy-loaded map** - The heavy Mapbox component only loads when the results page is viewed  
3. **Lazy image loading** - Restaurant logos load as you scroll

---

## What We'll Improve (3 Changes)

### 1. Smart Bundle Splitting in Vite Configuration

**The Problem:** All your third-party libraries (like Supabase, React Query, date formatting, etc.) are currently bundled together. This means even for a simple page, the browser downloads everything.

**The Solution:** Configure Vite to automatically separate large libraries into their own "chunks" that can be:
- Cached independently (so repeat visitors load faster)
- Loaded in parallel (multiple smaller downloads are often faster than one big one)
- Deferred for non-critical libraries

**Tradeoffs:** None. This is pure optimization with no downsides.

---

### 2. Critical Resource Preloading

**The Problem:** The browser discovers resources (like your main JavaScript file, CSS, and Supabase connection) as it reads the HTML, causing a waterfall of sequential downloads.

**The Solution:** Add "preload" hints in the HTML `<head>` that tell the browser "start downloading these important things immediately" before it even knows it needs them.

We'll preload:
- The main entry JavaScript module
- DNS prefetch for the map service (Mapbox)
- Critical API connection (Supabase is already prefetched - good!)

**Tradeoffs:** None. This is a browser optimization hint.

---

### 3. Defer Non-Critical Initialization

**The Problem:** Some systems start working immediately when the page loads, even though they're not needed for the first paint:
- Session analytics initialization makes database calls
- Performance monitoring sets up multiple observers
- Google Analytics configuration runs synchronously

**The Solution:** Delay these initializations until *after* the first paint using `requestIdleCallback` (or a timeout fallback). The user sees the page faster, and the background systems start once the main content is visible.

**Tradeoffs:** 
- Analytics events in the first ~100-200ms might be slightly delayed
- This is acceptable because users don't notice, and the page feels faster

---

## Technical Implementation Details

### File Changes

```text
Files to Modify:
+------------------+----------------------------------------+
| File             | Change Description                     |
+------------------+----------------------------------------+
| vite.config.ts   | Add build configuration with manual    |
|                  | chunk splitting for large libraries    |
+------------------+----------------------------------------+
| index.html       | Add modulepreload for entry script     |
|                  | Add preconnect for Mapbox API          |
+------------------+----------------------------------------+
| src/App.tsx      | Wrap performance monitoring init in    |
|                  | requestIdleCallback for deferral       |
+------------------+----------------------------------------+
| src/hooks/       | Defer session initialization until     |
| useAnalytics.ts  | after first paint                      |
+------------------+----------------------------------------+
```

### Vite Manual Chunks Configuration

We'll split these libraries into separate cached chunks:
- **react-vendor**: React + React DOM + React Router
- **query-vendor**: TanStack Query (React Query)
- **supabase-vendor**: Supabase client
- **ui-vendor**: Radix UI components
- **map-vendor**: Mapbox GL
- **date-vendor**: date-fns
- **charts-vendor**: Recharts

### Deferred Initialization Pattern

```text
Current Flow:
Page loads -> Everything runs immediately -> User sees content

New Flow:
Page loads -> Critical rendering only -> User sees content -> Background systems start
```

---

## Expected Improvements

| Metric | Current (estimated) | Expected After |
|--------|---------------------|----------------|
| FCP | 2-4 seconds (prod) | 1-1.5 seconds |
| LCP | 3-5 seconds (prod) | 1.5-2.5 seconds |
| Cache efficiency | Low | High (vendor chunks cached separately) |
| Repeat visit speed | Same as first | Significantly faster |

*Note: The 22-second measurements were from the development preview. Production numbers will be much better, and these optimizations will make them even faster.*

---

## Summary

This optimization plan focuses on three strategies:

1. **Split the delivery** - Separate third-party code into cacheable chunks
2. **Start downloads sooner** - Tell the browser what's important upfront
3. **Defer background work** - Analytics and monitoring wait until users see content

All changes are pure improvements with no functionality loss or meaningful tradeoffs.

