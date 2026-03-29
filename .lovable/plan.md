

## Restructure Merchant Categories — Updated Plan (Cuisine Finalized)

### Bar Subcategories (Finalized — 17)

Cocktail Bar, Wine Bar, Sports Bar, Pub, Dive Bar, Speakeasy, Lounge, Nightclub, Hotel Bar, Rooftop Bar, Tiki Bar, Brewery/Brewpub, Beer Garden, Karaoke Bar, Piano Bar, Pool Hall, Hookah Lounge

### Cuisine (Finalized — 51)

African, American, Argentine, Asian, BBQ, Brazilian, Cajun/Creole, Caribbean, Chinese, Colombian, Cuban, Dim Sum, Dominican, Ethiopian, Filipino, French, German, Greek, Hawaiian/Polynesian, Indian, Indonesian, Italian, Jamaican, Japanese, Korean, Latin, Lebanese, Malaysian, Mediterranean, Mexican, Middle Eastern, Moroccan, Persian, Peruvian, Pizza, Puerto Rican, Ramen, Salvadoran, Seafood, Soul Food, Southern, Spanish, Steakhouse, Sushi, Tacos, Taiwanese, Tex-Mex, Thai, Turkish, Vietnamese

### Restaurant Subcategories (Pending Review — 5)

Fine Dining, Casual Dining, Fast Casual, Bistro, Gastropub

### Experience (Pending Review — 7)

Brunch, Dance Floor, Trivia Night, Karaoke Night, Sports Viewing, Live Music, Rooftop Dining

### Dietary (Pending Review — 5)

Vegan, Vegetarian, Gluten-free, Farm-to-table, Organic

### Beverage (Pending Review — 4)

Coffee, Tea, Craft Beer, Natural Wine

### Standalone Venue

Cafe

---

### Implementation Plan

**Phase 1 — Database migration:**
- Add `category_type` column to `categories` table (text, default `'venue_type'`)
- Create new L1 parents: Cuisine, Dietary, Experience, Beverage, Cafe
- Insert all new L2 categories under correct parents
- Reparent existing cuisine rows from Restaurant to the new Cuisine parent
- Reparent dietary/beverage/experience items to their new parents
- Set `category_type` on all rows

**Phase 2 — Frontend updates:**
- `useCategories.ts` — add `category_type` to the Category type, add `getCategoriesByType()` helper
- `UnifiedFilterBar.tsx` — group filter chips by category type (Venue Type, Cuisine, Experience, etc.)
- `MobileFilterDrawerV2.tsx` — same grouped filter layout for mobile
- No changes needed to `useMerchants.ts` or `merchant_categories` — category IDs work the same

### Files Affected

- 1 new SQL migration
- `src/hooks/useCategories.ts`
- `src/components/UnifiedFilterBar.tsx`
- `src/components/MobileFilterDrawerV2.tsx`
- `src/integrations/supabase/types.ts` (auto-updated)

### Next Step

Shall we review **Restaurant**, **Experience**, **Dietary**, and **Beverage** now, or are you happy with those as-is and ready to implement?

