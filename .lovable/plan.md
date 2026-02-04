

# Plan: Compress Images on Upload (Option B)

## What We're Building

A client-side image compression system that automatically shrinks and optimizes logo images **before** they are uploaded to Supabase Storage. This happens in the browser, requires no additional server costs, and is invisible to the person uploading.

---

## Current State

| Aspect | Current Behavior |
|--------|------------------|
| Upload location | `LogoUpload.tsx` component |
| Storage bucket | `restaurant-logos` |
| Size limit | 5MB maximum |
| Compression | None - original file uploaded as-is |
| Existing logos | 601 merchants have logos already uploaded |

---

## Proposed Solution: Client-Side Compression

### How It Works

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS IMAGE                          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: Load image into browser memory                             │
│  (Using Canvas API - built into all modern browsers)                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Resize to maximum 512x512 pixels                           │
│  (Larger than any display size on your site - future-proof)         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Convert to WebP format at 85% quality                      │
│  (WebP is ~30% smaller than JPEG/PNG at same quality)               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: Upload compressed image to Supabase Storage                │
│  (Same bucket, same process - just smaller file)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Why Client-Side Compression?

| Approach | Cost | Speed | Complexity |
|----------|------|-------|------------|
| **Client-side (recommended)** | Free | Fast - compression happens in browser | Low |
| Edge function compression | Free | Slower - upload full file, process on server | Medium |
| Supabase Pro image transforms | Paid | Fast | Low |

Client-side is the best fit because:
- **No additional costs** - uses browser's built-in Canvas API
- **Faster uploads** - smaller file travels over the network
- **Works offline** - processing happens locally
- **No server changes** - just modifies the upload component

---

## What Will Change

### For Users Uploading Logos

| Before | After |
|--------|-------|
| Upload 2MB photo | Upload same 2MB photo |
| Wait for upload | Slight processing pause (~1 second) |
| 2MB stored | ~30-80KB stored (after compression) |
| Same visual quality | Same visual quality |

The experience is nearly identical - just faster uploads and smaller files.

### File Sizes (Expected)

| Original Size | After Compression |
|---------------|-------------------|
| 500KB - 1MB | ~20-40KB |
| 1MB - 2MB | ~30-60KB |
| 2MB - 5MB | ~40-80KB |

---

## Handling Existing 601 Logos

You have **601 existing logos** that were uploaded without compression. There are two options:

### Option A: Leave Existing Logos (Recommended Start)

| Pros | Cons |
|------|------|
| No risk of breaking anything | Existing logos remain oversized |
| Immediate benefit for new uploads | Full optimization takes time |
| Simple implementation | |

**Gradual improvement:** As merchants update their profiles, their logos will be re-uploaded with compression automatically.

### Option B: One-Time Backfill Script

Create an admin-only tool that:
1. Downloads each existing logo
2. Compresses it client-side
3. Re-uploads with new filename
4. Updates database reference

| Pros | Cons |
|------|------|
| All logos optimized immediately | More complex to build |
| Maximum performance benefit | Risk of something going wrong |
| | Requires admin to run it |

**Recommendation:** Start with Option A (new uploads only), and we can add the backfill tool later if desired.

---

## Technical Implementation

### New Utility File: `src/utils/imageCompression.ts`

A reusable image compression utility that:
- Takes any image File as input
- Resizes to maximum dimensions (512x512 for logos)
- Converts to WebP format for best compression
- Falls back to JPEG if WebP not supported
- Returns a compressed Blob ready for upload

### Modified File: `LogoUpload.tsx`

Update the upload flow to:
1. Call compression utility before upload
2. Use compressed blob instead of original file
3. Save with `.webp` extension
4. No other changes to UI or behavior

### Modified File: `useReview.ts` (Optional)

Apply same compression to review media uploads for consistency.

---

## What Will NOT Change

| Aspect | Status |
|--------|--------|
| Upload UI | Identical - same drag/drop, same buttons |
| Supported formats | Same - JPEG, PNG, WebP, GIF accepted |
| File size limit | Same 5MB limit (though files will be much smaller) |
| Storage bucket | Same `restaurant-logos` bucket |
| Display logic | Unchanged - same components, same sizes |
| Desktop experience | Unchanged |
| Mobile layout | Unchanged |

---

## Expected Performance Impact

| Metric | Current | After (New Uploads) | After (All Logos) |
|--------|---------|---------------------|-------------------|
| Average logo size | ~200-400KB | ~30-60KB | ~30-60KB |
| Homepage image payload | ~3-4MB | Gradual decrease | ~0.3-0.5MB |
| Mobile PageSpeed | 64-70 | 72-78 | 82-90 |
| LCP | ~4.7s | ~3.5s | ~2s |

---

## Summary

- **What:** Automatic image compression before upload
- **Where:** Browser-side, in the LogoUpload component
- **Cost:** Free (uses built-in browser APIs)
- **Impact:** 80-90% file size reduction for new uploads
- **User experience:** Nearly invisible - same workflow, faster uploads
- **Existing logos:** Optimized gradually as merchants update, or via optional backfill tool later

This sets you up for permanently optimized images going forward, with the option to clean up existing logos whenever you're ready.

