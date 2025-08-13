-- First, let's drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view restaurants" ON public."Merchant";

-- Create a more secure policy that only exposes essential public information
-- This will require creating a view for public access and restricting direct table access

-- Create a public view that only exposes necessary restaurant information
CREATE OR REPLACE VIEW public.restaurants_public AS
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

-- Enable RLS on the view
ALTER VIEW public.restaurants_public SET (security_invoker = true);

-- Create a new RLS policy that restricts direct table access to authenticated users only
CREATE POLICY "Authenticated users can view all restaurant data"
  ON public."Merchant"
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a policy for public access to only basic restaurant information
-- This will be handled through the view instead of direct table access

-- Grant public access to the view
GRANT SELECT ON public.restaurants_public TO anon;
GRANT SELECT ON public.restaurants_public TO authenticated;

-- Create a function to get full restaurant details (including sensitive info) for authenticated users
CREATE OR REPLACE FUNCTION public.get_restaurant_details(restaurant_id integer)
RETURNS TABLE (
  id integer,
  restaurant_name text,
  street_address text,
  street_address_line_2 text,
  city text,
  state text,
  zip_code text,
  phone_number text,
  website text,
  latitude numeric,
  longitude numeric,
  logo_url text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    m.id,
    m.restaurant_name,
    m.street_address,
    m.street_address_line_2,
    m.city,
    m.state,
    m.zip_code,
    m.phone_number,
    m.website,
    m.latitude,
    m.longitude,
    m.logo_url,
    m.is_active,
    m.created_at,
    m.updated_at
  FROM public."Merchant" m
  WHERE m.id = restaurant_id 
  AND m.is_active = true;
$$;

-- Grant execute permission on the function to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_restaurant_details(integer) TO authenticated;