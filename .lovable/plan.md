

## Enrich Mobile Map Preview Card Content

### What Changes

Replace the address-focused content in the mobile map preview card with discovery-oriented information that helps users decide whether to tap "View Restaurant":

**Current (address-focused):**
- Line 1: Merchant Name
- Line 2: Street Address
- Line 3: City, State

**New (discovery-focused):**
- Line 1: Merchant Name (bold, prominent)
- Line 2: Deal type badge -- "Food & Drinks" (teal) or "Drinks Only" (purple), plus today's happy hour time as a secondary badge
- Line 3: Category tags -- compact outline badges (e.g., "Sushi", "Mexican", "Sports Bar")

### Visual Design

The card will feel more like a rich mini-preview of the SearchResultCard, giving users a "taste" of what they'll find:

```text
+----------------------------------------------+
|  [Logo]   Merchant Name                   [X] |
|           [Food & Drinks] [4-7 PM]            |
|           Sushi  Mexican  +1                  |
|                                               |
|         [  View Restaurant  ]                 |
+----------------------------------------------+
```

- Deal type badges use the same teal/purple color coding from the search result cards
- Happy hour time badge uses the amber color from search cards
- Category badges use subtle outline style, matching the card pattern
- If no deals exist, that line gracefully falls back to the neighborhood name so the line is never empty
- Categories are capped at 2 visible + a "+N" overflow badge to prevent wrapping

### Technical Details

**Data flow fix:** The `Restaurant` interface in both `ResultsMap.tsx` and `MerchantMapPreviewCard.tsx` currently omits the deal/category data. The full merchant objects from `useMerchants` already contain `merchant_happy_hour`, `happy_hour_deals`, `merchant_categories`, and `merchant_offers` -- we just need to widen the interface and pass them through.

**Files to modify:**

1. **`src/components/ResultsMap.tsx`** (~5 lines)
   - Expand the `Restaurant` interface to include optional fields: `merchant_happy_hour`, `happy_hour_deals`, `merchant_categories`, `merchant_offers`, `neighborhood`
   - No other logic changes needed -- the restaurant objects passed in already carry this data

2. **`src/components/MerchantMapPreviewCard.tsx`** (~40 lines)
   - Expand the `Restaurant` interface to match (add same optional fields)
   - Import `Badge` component, `getMenuTypeBadge`, and `getAllTodaysHappyHours` utilities
   - Replace mobile Line 2 (street address) with a badges row:
     - Menu type badge (teal for Food & Drinks, purple for Drinks Only) using `getMenuTypeBadge()`
     - Today's happy hour time badge (amber) using `getAllTodaysHappyHours()`
     - If neither exists, fall back to neighborhood/city name
   - Replace mobile Line 3 (city, state) with category tags:
     - Show up to 2 category names as outline badges from `merchant_categories`
     - Show "+N" overflow badge if more than 2
     - If no categories, omit the line entirely (no empty space)
   - Desktop card remains unchanged (it's a simple hover tooltip and works fine as-is)

**No new dependencies.** All utilities (`getMenuTypeBadge`, `getAllTodaysHappyHours`) and components (`Badge`) already exist and are used by `SearchResultCard.tsx`.

