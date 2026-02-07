

# Phase 1B (Revised): Clean Up Mobile Search Result Cards

## Summary of Changes

A balanced cleanup that removes visual clutter while keeping the information that helps users decide which merchant to tap. Every change is mobile-only -- the desktop layout stays exactly as it is today.

## What Changes

### 1. Remove the left border accent
The thick left border on every card (which appears dark gray instead of orange) gets removed. Cards will have a clean, flat edge like you'd see on Google Maps or Yelp listings.

### 2. Happy hour time: only show it when relevant
- If the merchant has a happy hour today, show the time (e.g., "4:00 PM - 7:00 PM")
- If there's more than one happy hour today, show the first time plus "+1 more"
- If there's no happy hour today, show nothing -- the row simply won't appear, saving vertical space for merchants that don't have one today

### 3. Menu type badge: keep it, but tone it down
This is the key balance point. The menu type badge ("Food & Drinks" or "Drinks Only") stays because it helps users like you who specifically want food deals. But instead of being a separate brightly-colored pill, it gets placed right next to the happy hour time as a subtle companion badge. The visual treatment:

- **Food & Drinks**: Keeps a distinct color (teal) so it stands out as a "bonus" -- this merchant has food deals, not just drinks
- **Drinks Only**: Uses a softer color (muted purple/gray) since this is the default expectation for happy hours

The result: when a user scans the list, "Food & Drinks" pops as a differentiator, while "Drinks Only" fades into the background. The information is there if you look for it, but it doesn't scream at you.

### 4. Remove emojis from all badges
No more party popper, beer mugs, or plate emojis. The badge colors and text already communicate what they are. This immediately reduces the "noisy carnival" feel.

### 5. Category badges: keep current logic
The existing behavior stays: show up to 2 category badges, plus a "+N" overflow indicator. No changes here.

### 6. Offer badge: keep it but remove emoji
The green "Offer" badge stays (it's valuable signal) but drops the party popper emoji. It becomes a clean green pill that says "Offer".

## Before vs. After (what a card looks like)

**Before (current):**
```
[Logo]  Merchant Name                    [heart]
        East Village  ★ 4.2
        [🎉 Offer] [🍻 4:00 PM - 7:00 PM] [🍽️ Food & Drinks]
        [Japanese] [Sushi] [+1]
```
Five colored badges, three emojis, left border accent.

**After (revised):**
```
[Logo]  Merchant Name                    [heart]
        East Village  ★ 4.2
        [Offer] [4:00 PM - 7:00 PM] [Food & Drinks]
        [Japanese] [Sushi] [+1]
```
Same information, no emojis, no left border. Cleaner but still visually actionable.

**When there's no happy hour today:**
```
[Logo]  Merchant Name                    [heart]
        East Village  ★ 4.2
        [Offer]
        [Japanese] [Sushi]
```
The happy hour row items simply aren't shown, making the card shorter and signaling "nothing happening today" without needing to say it.

## Technical Details

**File changed:** `src/components/SearchResultCard.tsx` (mobile section only, lines ~168-290)

**Specific edits:**

1. **Line 172**: Remove `border-l-4 border-l-primary/40` from the mobile Card className

2. **Lines 228-234**: Change the Offer badge from `🎉 Offer` to just `Offer` (remove emoji, keep green styling)

3. **Lines 236-251**: Update happy hour badge logic:
   - Keep the amber-colored badge but remove the beer emoji
   - Remove the entire `else` branch that renders "No HH Today" -- when `todaysHappyHours.length === 0`, render nothing

4. **Lines 252-263**: Keep the menu type badge but remove the emoji prefix -- change `{menuTypeBadge.emoji} {menuTypeBadge.label}` to just `{menuTypeBadge.label}`. Keep the existing color differentiation (teal for food & drinks, purple for drinks only)

**No changes to:**
- Desktop layout (lines 292+)
- Category badge logic (lines 267-289)
- Logo, name, location, rating, or favorite button
- Any data fetching, analytics tracking, or memoization logic

