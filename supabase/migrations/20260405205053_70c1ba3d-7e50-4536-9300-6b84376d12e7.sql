
-- ============================================
-- Phase 3: Lock down anon access to merchant data tables
-- All public reads now go through the merchant-api edge function (service_role)
-- ============================================

-- 1. MERCHANT TABLE: Remove anon from SELECT, keep authenticated
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON public."Merchant";

CREATE POLICY "Authenticated users can view active restaurants"
ON public."Merchant"
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. HAPPY_HOUR_DEALS: Remove public SELECT, keep authenticated
DROP POLICY IF EXISTS "Anyone can view happy hour deals" ON public.happy_hour_deals;

CREATE POLICY "Authenticated users can view happy hour deals"
ON public.happy_hour_deals
FOR SELECT
TO authenticated
USING (true);

-- 3. MERCHANT_HAPPY_HOUR: Change from anon,authenticated to authenticated only
DROP POLICY IF EXISTS "Anyone can view merchant happy hours" ON public.merchant_happy_hour;

CREATE POLICY "Authenticated users can view merchant happy hours"
ON public.merchant_happy_hour
FOR SELECT
TO authenticated
USING (true);

-- 4. MERCHANT_GOOGLE_RATINGS: Remove public SELECT, keep authenticated
DROP POLICY IF EXISTS "Anyone can view google ratings" ON public.merchant_google_ratings;

CREATE POLICY "Authenticated users can view google ratings"
ON public.merchant_google_ratings
FOR SELECT
TO authenticated
USING (true);

-- 5. MERCHANT_CATEGORIES: Change from anon,authenticated to authenticated only
DROP POLICY IF EXISTS "Anyone can view merchant categories" ON public.merchant_categories;

CREATE POLICY "Authenticated users can view merchant categories"
ON public.merchant_categories
FOR SELECT
TO authenticated
USING (true);
