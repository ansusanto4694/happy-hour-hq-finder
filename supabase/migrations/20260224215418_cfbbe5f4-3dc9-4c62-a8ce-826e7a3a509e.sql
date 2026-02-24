
-- Recreate profile_display_names with security_invoker = on
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

-- Recreate restaurants_public with security_invoker = on
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
