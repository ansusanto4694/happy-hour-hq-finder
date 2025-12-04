-- Explicitly set SECURITY INVOKER on restaurants_public view
DROP VIEW IF EXISTS public.restaurants_public;
CREATE VIEW public.restaurants_public 
WITH (security_invoker = true)
AS
SELECT 
  id, 
  restaurant_name, 
  street_address, 
  street_address_line_2, 
  city, 
  state, 
  zip_code, 
  phone_number, 
  website, 
  latitude, 
  longitude, 
  logo_url, 
  is_active, 
  created_at, 
  updated_at
FROM public."Merchant"
WHERE is_active = true;