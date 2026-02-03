

# Plan: Optimize Mobile Search Bar Performance

## The Problem Explained Simply

Think of the Mobile Search Bar like a busy restaurant kitchen. Right now, every time someone types a letter in the location field, the kitchen (your app) has to:

1. Remember lots of different things (13+ pieces of information)
2. Send a request to a server asking "what locations match this?"
3. Update the screen based on the response
4. Re-cook the entire dish every time any ingredient changes

This is like having a chef restart the entire meal from scratch every time a customer adds salt. It works, but it's inefficient and can make the app feel sluggish, especially on slower phones.

**The main issues:**

1. **Too many things to track** - The component manages 13+ separate pieces of information, and changing any one of them causes the entire screen to refresh
2. **Duplicated work** - The same location-fetching code exists in both the Mobile Search Bar and the Desktop Search Bar (two separate files doing identical work)
3. **Server calls on every keystroke** - Even with a small delay (300ms), fast typers still trigger many server requests

---

## What We'll Improve (3 Changes)

### 1. Create a Reusable "Location Suggestions" Helper

**What it does:** Instead of having the same location-fetching code written twice (once for mobile, once for desktop), we'll create a single shared "helper" that both can use.

**Business analogy:** Instead of having two cashiers who each built their own calculator, we give them both the same reliable calculator from the supply closet.

**Benefits:**
- Fixes bugs once, fixes them everywhere
- Less code to maintain
- Easier to add improvements later (like smarter caching)

---

### 2. Combine Related Information Together

**What it does:** Instead of tracking 13+ separate pieces of information, we'll group related items together. For example, all the location-related data (suggestions list, loading state, selected item) will be managed as one unit.

**Business analogy:** Instead of having 13 separate sticky notes on your desk, you organize them into 3 labeled folders: "Search Terms," "Location Info," and "Time Filters."

**Benefits:**
- Fewer screen refreshes when information changes
- The app only updates the parts that actually changed
- Smoother scrolling and typing experience

---

### 3. Smarter Server Request Management

**What it does:** We'll improve how location requests are handled by:
- Canceling old requests when a new one starts (already partially done)
- Increasing the delay slightly for mobile (from 300ms to 400ms) since mobile typing is slower
- Adding a minimum character requirement before searching (already done - 2 chars)

**Business analogy:** Instead of the chef starting 5 different versions of a dish as the customer keeps changing their order, the chef waits until the customer finishes talking before cooking.

**Benefits:**
- Fewer unnecessary server calls
- Saved bandwidth for users on mobile data
- Faster response when suggestions do appear

---

## Trade-offs and Decisions

| Decision | What We Gain | What We Give Up |
|----------|--------------|-----------------|
| Create shared hook | Less duplicated code, consistent behavior | A few extra lines of code initially |
| Group state together | Fewer re-renders, smoother experience | Slightly more complex internal logic (invisible to users) |
| Increase debounce to 400ms | Fewer server calls, better for slow connections | Suggestions appear 100ms later (barely noticeable) |

**Overall verdict:** These are all "free upgrades" - users get a smoother experience with no visible downsides. The 100ms delay increase is so small that users won't notice, but it significantly reduces unnecessary work.

---

## Technical Implementation Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useLocationSuggestions.ts` | New shared helper for location autocomplete logic |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/MobileSearchBar.tsx` | Replace inline location logic with the new shared helper, group related state |
| `src/components/SearchBar.tsx` | Replace inline location logic with the new shared helper |

### What the New Helper Provides

The new `useLocationSuggestions` hook will encapsulate:

- Location suggestions list
- Loading state
- Selected suggestion index
- Show/hide suggestions flag
- Functions: fetch suggestions, select a suggestion, handle keyboard navigation, clear suggestions

### State Grouping Strategy

Before (13+ separate pieces):
```text
searchTerm, location, startTime, endTime, gpsCoordinates,
locationSuggestions, showSuggestions, selectedSuggestionIndex,
isLoadingSuggestions, isExpanded, (various refs)
```

After (logically grouped):
```text
Search State: { term, suggestions state via hook }
Location State: { via useLocationSuggestions hook }
Time State: { start, end }
UI State: { isExpanded, gpsCoordinates }
```

This reduces the number of independent state updates that can trigger re-renders.

---

## Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| Server requests while typing | 3-5 per search | 1-2 per search |
| Code duplication | ~150 lines duplicated | 0 (shared hook) |
| State variables in component | 13+ | 6-8 |
| Re-renders per keystroke | 2-3 | 1 |

---

## Summary

This optimization consolidates duplicated code into a reusable helper and groups related information together. The result is a smoother mobile search experience with fewer unnecessary server calls and screen updates.

**No functionality changes** - users will search exactly the same way, but the experience will feel snappier, especially on slower devices or connections.

