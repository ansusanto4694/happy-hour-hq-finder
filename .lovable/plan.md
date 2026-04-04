

## Fix: Allow NULL values in happy_hour_deals menu_type constraint

### Problem
The `happy_hour_deals_menu_type_check` constraint rejects `NULL` values for `menu_type`, but the application code intentionally converts `'not_specified'` to `NULL` before inserting. This causes CSV imports and deal creation to fail.

### Migration
A single migration that drops the existing constraint and recreates it to allow `NULL`:

```sql
ALTER TABLE happy_hour_deals DROP CONSTRAINT happy_hour_deals_menu_type_check;
ALTER TABLE happy_hour_deals ADD CONSTRAINT happy_hour_deals_menu_type_check 
  CHECK (menu_type IS NULL OR menu_type IN ('food_and_drinks', 'drinks_only'));
```

### Scope
- One migration file only. No code changes needed -- the app already handles the `NULL` conversion correctly.

