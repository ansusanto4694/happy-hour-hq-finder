-- Check and fix permissions for anonymous users on filtering-related tables
-- Anonymous users need read access to these tables for search functionality to work

-- Allow anonymous users to view merchant offers (needed for offers filter)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'merchant_offers' 
        AND policyname = 'Anyone can view active merchant offers'
    ) THEN
        CREATE POLICY "Anyone can view active merchant offers"
        ON public.merchant_offers
        FOR SELECT
        TO public
        USING (is_active = true);
    END IF;
END $$;

-- Allow anonymous users to view merchant happy hours (needed for time-based filtering)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'merchant_happy_hour' 
        AND policyname = 'Anyone can view merchant happy hours'
    ) THEN
        CREATE POLICY "Anyone can view merchant happy hours"
        ON public.merchant_happy_hour
        FOR SELECT
        TO public
        USING (true);
    END IF;
END $$;