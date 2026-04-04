

## Fix: Normalize blank menu_type to NULL on insert/update

### Problem
The existing trigger `enforce_and_stamp_deal_verification` normalizes empty strings to NULL for `source_url` and `source_label`, but does not do the same for `menu_type`. Blank CSV cells arrive as `''` (empty string), which fails the check constraint.

### Solution
One migration that updates the existing trigger function to also normalize `menu_type`:

```sql
CREATE OR REPLACE FUNCTION public.enforce_and_stamp_deal_verification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Normalize empty strings to NULL
  IF NEW.source_url IS NOT NULL AND length(trim(NEW.source_url)) = 0 THEN
    NEW.source_url = NULL;
  END IF;
  IF NEW.source_label IS NOT NULL AND length(trim(NEW.source_label)) = 0 THEN
    NEW.source_label = NULL;
  END IF;

  -- Normalize menu_type: empty string or 'not_specified' → NULL
  IF NEW.menu_type IS NOT NULL AND (length(trim(NEW.menu_type)) = 0 OR NEW.menu_type = 'not_specified') THEN
    NEW.menu_type = NULL;
  END IF;

  -- Existing verification logic (unchanged)
  IF NEW.is_verified IS TRUE THEN
    IF NEW.source_url IS NULL THEN
      RAISE EXCEPTION 'Cannot mark deal as verified without a source_url';
    END IF;
    IF NEW.verified_at IS NULL THEN
      NEW.verified_at = now();
    END IF;
    NEW.verified_by = auth.uid();
  ELSE
    NEW.verified_at = NULL;
    NEW.verified_by = NULL;
  END IF;

  RETURN NEW;
END;
$$;
```

### What this does
- Adds 3 lines to the existing trigger to convert blank or `'not_specified'` menu_type values into proper NULL before the row hits the check constraint
- No app code changes needed
- CSV imports with blank menu_type cells will work again

### Scope
- One migration file, one function update, zero code changes

