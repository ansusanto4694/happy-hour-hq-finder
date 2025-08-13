-- Ensure anonymous users can access merchant categories for filtering
-- This is needed for category-based searches to work for anonymous users

-- Check if there's already a policy for anonymous access to merchant_categories
-- If not, create one for read-only access

-- Allow anonymous users to view merchant categories (needed for search filtering)
DO $$
BEGIN
    -- Check if policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'merchant_categories' 
        AND policyname = 'Anyone can view merchant categories'
    ) THEN
        CREATE POLICY "Anyone can view merchant categories"
        ON public.merchant_categories
        FOR SELECT
        TO public
        USING (true);
    END IF;
END $$;