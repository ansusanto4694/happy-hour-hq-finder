

# Fix Security Definer Views

## What We're Doing

Two database views (`profile_display_names` and `restaurants_public`) currently run with the database owner's permissions instead of the querying user's permissions. This means they bypass Row Level Security (RLS) policies, potentially exposing data that should be protected.

We will recreate both views with `security_invoker = on` so that RLS policies are properly enforced for whoever is querying.

## Changes

A single database migration that:

1. Drops and recreates `profile_display_names` with `security_invoker = on`
2. Drops and recreates `restaurants_public` with `security_invoker = on`

Both views keep their exact same column definitions and logic -- the only change is adding the security invoker flag.

## Technical Details

```sql
-- Recreate profile_display_names
DROP VIEW IF EXISTS public.profile_display_names;
CREATE VIEW public.profile_display_names
WITH (security_invoker = on) AS
SELECT
  profiles.id,
  profiles.first_name,
  CASE
    WHEN profiles.last_name IS NOT NULL AND length(profiles.last_name) > 0
    THEN left(profiles.last_name, 1) || '.'
    ELSE NULL
  END AS last_name_initial
FROM profiles;

-- Recreate restaurants_public
DROP VIEW IF EXISTS public.restaurants_public;
CREATE VIEW public.restaurants_public
WITH (security_invoker = on) AS
SELECT
  "Merchant".id,
  "Merchant".restaurant_name,
  "Merchant".street_address,
  "Merchant".street_address_line_2,
  "Merchant".city,
  "Merchant".state,
  "Merchant".zip_code,
  "Merchant".phone_number,
  "Merchant".website,
  "Merchant".latitude,
  "Merchant".longitude,
  "Merchant".logo_url,
  "Merchant".is_active,
  "Merchant".created_at,
  "Merchant".updated_at
FROM "Merchant"
WHERE "Merchant".is_active = true;
```

No application code changes are needed -- the views' columns and names remain identical.

