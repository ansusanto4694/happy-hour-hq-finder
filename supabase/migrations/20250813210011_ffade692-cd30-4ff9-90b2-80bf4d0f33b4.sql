-- Fix the security issue with the restaurants_public view
-- Change from security_invoker to security_definer so anonymous users can access it

DROP VIEW IF EXISTS public.restaurants_public;

-- Create the view with security_definer to allow anonymous access to filtered data
CREATE OR REPLACE VIEW public.restaurants_public 
WITH (security_invoker = false) AS
SELECT 
  id,
  restaurant_name,
  city,
  state,
  zip_code,
  latitude,
  longitude,
  logo_url,
  is_active,
  created_at,
  updated_at
FROM public."Merchant"
WHERE is_active = true;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.restaurants_public TO anon;
GRANT SELECT ON public.restaurants_public TO authenticated;