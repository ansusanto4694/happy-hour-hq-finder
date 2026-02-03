

# Phase 4: Optimize Cache Lifetimes (Repeat Visitor Speed Boost)

## The Business Problem

When someone visits your site **for the first time**, their browser downloads everything — images, code, fonts. This takes time.

When they visit **again**, the browser could remember what it already downloaded. But right now, it's only remembering things for **1 hour**. After that, it downloads everything fresh again.

Think of it like a library. You check out a book, read it, return it. If you want to read it again tomorrow, you have to check it out again — even though you just had it yesterday. What if you could keep books for a month instead?

---

## What's Happening Now

| Resource | Current "Keep Time" | Browser Behavior |
|----------|-------------------|------------------|
| Restaurant logos | 1 hour | After 1 hour, browser downloads logos again |
| Your app code (JS/CSS) | Controlled by Lovable platform | We can't change this |
| Google Fonts | Long (30 days) | Already optimized |
| Mapbox tiles | Controlled by Mapbox | We can't change this |

The **4,983 KB savings** from PageSpeed is mostly about those restaurant logos and some other images. Every repeat visitor within an hour uses cached images — but anyone coming back after an hour re-downloads all ~5MB of logos.

---

## What We Can Control vs. What We Can't

| Resource Type | Who Controls Caching | Can We Change? |
|---------------|---------------------|----------------|
| **Supabase Storage images** (logos) | You — via upload settings | **Yes** |
| App JavaScript/CSS | Lovable hosting platform | No |
| Google Fonts | Google CDN | No (already optimal) |
| Mapbox map tiles | Mapbox CDN | No |

**Good news:** The biggest opportunity (restaurant logos) is something we can fix!

---

## The Solution: Tell Browsers to Remember Logos Longer

When merchants upload logos, we tell Supabase Storage how long browsers should keep the file. Currently it's set to **1 hour (3600 seconds)**.

We can change this to **30 days (2,592,000 seconds)** — the standard for images that rarely change.

```text
BEFORE: "Keep this logo for 1 hour, then download again"
AFTER:  "Keep this logo for 30 days, then check if it changed"
```

---

## Trade-offs: What Are We Giving Up?

### The Concern: "What if a merchant changes their logo?"

Currently, if a merchant uploads a new logo, visitors see it within 1 hour maximum.

With 30-day caching, **in theory** a visitor could see an old logo for up to 30 days.

### Why This Isn't Really a Problem

**Your app already solves this.** Here's how:

1. When a merchant uploads a new logo, it gets a **new filename** (with timestamp)
   - Old: `123-1700000000.png`
   - New: `123-1700100000.png`

2. The database stores the **new URL**

3. The carousel loads the **new URL** from the database

4. The browser has never seen this new URL before, so it downloads the new logo

**Result:** Logo changes appear instantly because new logos = new URLs.

The 30-day cache only applies to files at the same URL. Since your app creates new URLs for new uploads, there's no conflict.

---

## Summary of Trade-offs

| What You Give Up | What You Gain |
|------------------|---------------|
| **Nothing** (because new logos get new URLs) | Repeat visitors don't re-download 5MB of logos |
| | Faster load times for returning visitors |
| | Better PageSpeed scores |
| | Reduced bandwidth costs |

**This is a pure win with zero visual impact.**

---

## Technical Implementation

### File to Change

| File | Change | Why |
|------|--------|-----|
| `src/components/restaurant-profile-editor/LogoUpload.tsx` | Change `cacheControl` from `'3600'` to `'2592000'` | 30 days instead of 1 hour |

### The Actual Code Change

```typescript
// BEFORE (line 62):
cacheControl: '3600',  // 1 hour

// AFTER:
cacheControl: '2592000',  // 30 days
```

That's it — one number change.

---

## Important Note: Existing Logos

The cache setting is applied **when a logo is uploaded**. This means:

| Logos | Cache Duration |
|-------|---------------|
| **Already uploaded** (601 existing logos) | Stuck at 1 hour until re-uploaded |
| **New uploads** (after this change) | Will use 30-day caching |

### Options for Existing Logos

| Option | Effort | Result |
|--------|--------|--------|
| **A) Do nothing** | None | New uploads benefit immediately; existing logos stay as-is |
| **B) Re-upload all logos** | High | All logos get 30-day caching |

I recommend **Option A** for now. The performance benefit will grow naturally as merchants update their profiles or as new restaurants are added.

If you want Option B later, we could create an admin tool to batch-process existing logos — but that's a larger effort.

---

## Expected Results

| Metric | First Visit | Repeat Visit (Within 30 Days) |
|--------|-------------|------------------------------|
| Logo downloads | ~5MB | ~0 (cached) |
| Homepage load | Current speed | Significantly faster |
| PageSpeed "cache" warning | Still appears for first visit | Would be resolved for repeat visits |

**Note:** PageSpeed tests simulate first-time visitors, so you won't see the "cache lifetimes" warning disappear immediately. However, your **real returning users** will experience faster loads.

---

## What This Won't Fix

This optimization specifically helps **returning visitors**. It doesn't speed up:

- First-time visitors (they still download everything)
- The PageSpeed test (which simulates first visits)

For first-time visitor speed, the main remaining opportunity is still image optimization (Phase 2), which you've chosen to defer.

---

## Summary

| Aspect | Details |
|--------|---------|
| **Change** | Update cache duration from 1 hour to 30 days |
| **Files modified** | 1 file (LogoUpload.tsx) |
| **Risk** | None — new logos get new URLs anyway |
| **Visual changes** | None |
| **Functionality changes** | None |
| **Benefit** | ~5MB saved for every returning visitor |
| **Limitation** | Only affects newly uploaded logos |

