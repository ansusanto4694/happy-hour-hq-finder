-- First, check what views exist and drop the problematic security definer view completely
DROP VIEW IF EXISTS public.restaurants_public CASCADE;

-- Ensure the base Merchant table has the correct RLS policy for anonymous users
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON public."Merchant";
CREATE POLICY "Anyone can view active restaurants" 
ON public."Merchant" 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Ensure merchant_categories allows anonymous access
DROP POLICY IF EXISTS "Anyone can view merchant categories" ON public.merchant_categories;
CREATE POLICY "Anyone can view merchant categories" 
ON public.merchant_categories 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure merchant_happy_hour allows anonymous access  
DROP POLICY IF EXISTS "Anyone can view merchant happy hours" ON public.merchant_happy_hour;
CREATE POLICY "Anyone can view merchant happy hours" 
ON public.merchant_happy_hour 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure merchant_offers allows anonymous access
DROP POLICY IF EXISTS "Anyone can view active merchant offers" ON public.merchant_offers;
CREATE POLICY "Anyone can view active merchant offers" 
ON public.merchant_offers 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Create a simple view without security definer (this will inherit the base table's RLS policies)
CREATE VIEW public.restaurants_public AS 
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

-- Grant explicit permissions to anonymous and authenticated users
GRANT SELECT ON public.restaurants_public TO anon;
GRANT SELECT ON public.restaurants_public TO authenticated;