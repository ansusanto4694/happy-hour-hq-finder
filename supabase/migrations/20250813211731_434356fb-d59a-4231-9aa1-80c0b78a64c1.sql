-- Remove restrictive RLS policies that are blocking anonymous access
-- and allow anonymous read access to all merchant-related tables

-- Drop existing policies on merchant_offers and merchant_happy_hour
DROP POLICY IF EXISTS "Anonymous users can view merchant offers" ON public.merchant_offers;
DROP POLICY IF EXISTS "Anonymous users can view merchant happy hours" ON public.merchant_happy_hour;

-- Allow anonymous read access to merchant_offers
CREATE POLICY "Public read access to merchant offers" 
ON public.merchant_offers 
FOR SELECT 
USING (true);

-- Allow anonymous read access to merchant_happy_hour
CREATE POLICY "Public read access to merchant happy hours" 
ON public.merchant_happy_hour 
FOR SELECT 
USING (true);

-- Allow anonymous read access to merchant_categories
CREATE POLICY "Public read access to merchant categories" 
ON public.merchant_categories 
FOR SELECT 
USING (true);

-- Ensure Merchant table allows anonymous read access (this should already exist but let's be sure)
DROP POLICY IF EXISTS "Public can view all merchant data" ON public."Merchant";
CREATE POLICY "Public can view all merchant data" 
ON public."Merchant" 
FOR SELECT 
USING (true);