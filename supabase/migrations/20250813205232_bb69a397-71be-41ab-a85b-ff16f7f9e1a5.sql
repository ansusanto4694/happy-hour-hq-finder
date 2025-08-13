-- Fix the search path security issue for the get_restaurant_details function
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
SET search_path = public
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