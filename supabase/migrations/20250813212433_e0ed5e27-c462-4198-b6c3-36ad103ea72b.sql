-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.restaurants_public;

-- Create a regular view (not security definer) that shows public restaurant data
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

-- Ensure all tables have proper public read access policies
-- Drop any overly restrictive policies and recreate them properly

-- Fix Merchant table policies
DROP POLICY IF EXISTS "Public can view all merchant data" ON public."Merchant";
DROP POLICY IF EXISTS "Authenticated users can view all restaurant data" ON public."Merchant";

CREATE POLICY "Anyone can view active restaurants" 
ON public."Merchant" 
FOR SELECT 
USING (is_active = true);

-- Fix merchant_categories policies  
DROP POLICY IF EXISTS "Public read access to merchant categories" ON public.merchant_categories;
DROP POLICY IF EXISTS "Anyone can view merchant categories" ON public.merchant_categories;

CREATE POLICY "Anyone can view merchant categories" 
ON public.merchant_categories 
FOR SELECT 
USING (true);

-- Fix merchant_happy_hour policies
DROP POLICY IF EXISTS "Public read access to merchant happy hours" ON public.merchant_happy_hour;
DROP POLICY IF EXISTS "Anyone can view merchant happy hours" ON public.merchant_happy_hour;
DROP POLICY IF EXISTS "Anyone can view restaurant happy hours" ON public.merchant_happy_hour;

CREATE POLICY "Anyone can view merchant happy hours" 
ON public.merchant_happy_hour 
FOR SELECT 
USING (true);

-- Fix merchant_offers policies
DROP POLICY IF EXISTS "Public read access to merchant offers" ON public.merchant_offers;
DROP POLICY IF EXISTS "Anyone can view active merchant offers" ON public.merchant_offers;

CREATE POLICY "Anyone can view active merchant offers" 
ON public.merchant_offers 
FOR SELECT 
USING (is_active = true);

-- Grant necessary permissions on the view
GRANT SELECT ON public.restaurants_public TO anon;
GRANT SELECT ON public.restaurants_public TO authenticated;