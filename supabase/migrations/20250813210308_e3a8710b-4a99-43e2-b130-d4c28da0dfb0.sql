-- Update the restaurants_public view to include phone numbers and addresses
-- Keep verification data protected but allow public access to contact information

DROP VIEW IF EXISTS public.restaurants_public;

-- Create updated view with contact information included
CREATE OR REPLACE VIEW public.restaurants_public 
WITH (security_invoker = false) AS
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

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.restaurants_public TO anon;
GRANT SELECT ON public.restaurants_public TO authenticated;