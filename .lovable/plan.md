
# Phase 1: Speed Up Your Homepage (Zero Visual Changes)

## What We're Fixing

Right now, visitors to SipMunchYap on mobile wait **17.5 seconds** before seeing the full page. This plan makes two "behind the scenes" changes that will speed things up without changing how anything looks.

---

## The Two Changes

### Change 1: Stop the Font from Blocking the Page

**The Problem:**  
When someone visits your site, the browser currently says: "I won't show anything until I download the Poppins font." On slow mobile connections, this adds extra seconds of blank screen.

**The Solution:**  
We'll tell the browser: "Show the page immediately. Swap in the fancy font when it arrives."

**What You'll Notice:** Nothing. The page will just appear faster.

---

### Change 2: Tell the Browser What's Most Important

**The Problem:**  
Right now, the browser treats all images equally. Your SipMunchYap logo competes with restaurant logos that users haven't scrolled to yet.

**The Solution:**  
We'll add invisible "priority tags" to tell the browser:
- "Load the main logo first — it's the most important"
- "These restaurant images can wait until the user scrolls down"

**What You'll Notice:** Nothing. Same images, same layout, just smarter loading order.

---

## Files We'll Update

| File | What We're Changing | Why |
|------|---------------------|-----|
| `index.html` | Make font loading non-blocking | Stop the blank screen wait |
| `Hero.tsx` | Add priority tag to main logo | Load your logo first on mobile |
| `PageHeader.tsx` | Add priority tag to header logo | Load your logo first on desktop |
| `CarouselCard.tsx` | Add image dimensions | Help browser plan the layout |

---

## Expected Speed Improvement

| Metric | Before | After (Estimate) |
|--------|--------|------------------|
| First content appears | 4.2 seconds | ~3.0 seconds |
| Page fully loaded | 17.5 seconds | ~14-15 seconds |

Phase 2 (image optimization) will tackle the bigger improvement to that 17.5 second number.

---

## Technical Details

### index.html Changes

Current font loading (blocking):
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap">
```

New font loading (non-blocking):
```html
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"></noscript>
```

This pattern:
1. Starts downloading the font immediately (preload)
2. Doesn't block the page from rendering
3. Switches to a proper stylesheet once loaded
4. Has a fallback for users without JavaScript

### Hero.tsx Changes

Current logo (no priority):
```jsx
<img 
  src="/lovable-uploads/f30134b8-b54d-491a-b6bc-fc7a20199dd2.png" 
  alt="SipMunchYap Logo" 
  className="h-16 sm:h-20 md:h-32 w-auto"
/>
```

Updated logo (with priority):
```jsx
<img 
  src="/lovable-uploads/f30134b8-b54d-491a-b6bc-fc7a20199dd2.png" 
  alt="SipMunchYap Logo" 
  className="h-16 sm:h-20 md:h-32 w-auto"
  fetchPriority="high"
  loading="eager"
  width={128}
  height={128}
/>
```

### PageHeader.tsx Changes

Same approach — add priority tags to the header logo:
```jsx
<img 
  src="/lovable-uploads/f30134b8-b54d-491a-b6bc-fc7a20199dd2.png" 
  alt="SipMunchYap Logo" 
  className="h-16 md:h-24 lg:h-32 w-auto cursor-pointer"
  onClick={handleLogoClick}
  fetchPriority="high"
  loading="eager"
  width={128}
  height={128}
/>
```

### CarouselCard.tsx Changes

Add explicit dimensions to restaurant logo images:
```jsx
<img
  src={merchant.logo_url}
  alt={`${merchant.restaurant_name} logo`}
  className="w-full h-full object-contain"
  width={96}
  height={96}
  loading="lazy"
/>
```

Note: `MobileCarouselCard.tsx` already has dimensions and lazy loading — no changes needed there.

---

## Summary

| Change | Visual Impact | Speed Impact |
|--------|---------------|--------------|
| Non-blocking fonts | None | ~0.5-1 second faster |
| Logo priority tags | None | ~1-2 seconds faster |
| Image dimensions | None | Prevents layout jumping |

**Total estimated improvement:** 1.5-3 seconds faster initial load

---

## Next Steps After This

Once Phase 1 is complete and published, we should:
1. Run another PageSpeed test to measure the improvement
2. Move to Phase 2 (image optimization) for the bigger LCP improvement
