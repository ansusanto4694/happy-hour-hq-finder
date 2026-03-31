

## Hide Empty Categories from Filter UI

### Problem
Categories with zero merchants tagged still appear in the filter sidebar (desktop and mobile), cluttering the UI.

### Approach
Create a new hook that fetches the set of category IDs that have at least one active merchant. Then use that set inside `UnifiedFilterBar` to hide categories (both parents and children) that have no merchants.

### Technical Details

**1. New hook: `src/hooks/useCategoriesWithMerchants.ts`**
- Query `merchant_categories` joined with `Merchant` (active only) to get distinct `category_id` values
- Returns a `Set<string>` of category IDs that have merchants
- Uses React Query with a long stale time (5 min) since this changes infrequently

```ts
// Pseudocode
const { data } = useQuery({
  queryKey: ['categories-with-merchants'],
  queryFn: async () => {
    const { data } = await supabase
      .from('merchant_categories')
      .select('category_id, Merchant!inner(is_active)')
      .eq('Merchant.is_active', true);
    return new Set(data?.map(r => r.category_id));
  },
  staleTime: 5 * 60 * 1000,
});
```

**2. Update `src/components/UnifiedFilterBar.tsx`**
- Import and call the new hook
- When rendering dimension parents: skip parents that have no merchants AND whose children all have no merchants
- When rendering subcategories: skip individual subs that have no merchants
- A parent with subcategories is shown if it itself has merchants OR any of its children do
- A standalone parent (no subs) is shown only if it has merchants

### Files Changed
| File | Change |
|------|--------|
| `src/hooks/useCategoriesWithMerchants.ts` | New hook — fetch active category IDs |
| `src/components/UnifiedFilterBar.tsx` | Filter displayed categories using the hook |

Both desktop sidebar and mobile drawer are covered since mobile uses `UnifiedFilterBar` internally.

