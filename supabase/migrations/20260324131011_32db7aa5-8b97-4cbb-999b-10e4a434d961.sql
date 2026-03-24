
-- 1. Drop overly permissive SELECT on user_events
DROP POLICY IF EXISTS "Anyone can view events by session_id" ON public.user_events;

-- 2. Drop overly permissive SELECT on user_sessions  
DROP POLICY IF EXISTS "Anyone can view sessions by session_id" ON public.user_sessions;

-- 3. Create public view for merchant_offers without PIN
CREATE OR REPLACE VIEW public.merchant_offers_public
WITH (security_invoker = on) AS
SELECT id, store_id, offer_name, offer_description,
       start_time, end_time, is_active, created_at, updated_at
FROM public.merchant_offers;
