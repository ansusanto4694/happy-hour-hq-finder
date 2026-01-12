-- Create table to log sitemap pings
CREATE TABLE IF NOT EXISTS public.sitemap_pings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_status INTEGER,
  google_success BOOLEAN,
  sitemap_url TEXT,
  trigger_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read for transparency, no public write)
ALTER TABLE public.sitemap_pings ENABLE ROW LEVEL SECURITY;

-- Allow admins to view ping logs
CREATE POLICY "Admins can view sitemap pings"
ON public.sitemap_pings
FOR SELECT
USING (public.is_admin());

-- Create function to notify sitemap update via edge function
CREATE OR REPLACE FUNCTION public.notify_sitemap_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_id BIGINT;
BEGIN
  -- Call the ping-google-sitemap edge function
  SELECT net.http_post(
    url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/ping-google-sitemap',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::JSONB,
    body := jsonb_build_object('trigger_reason', TG_OP || ' on ' || TG_TABLE_NAME)
  ) INTO request_id;
  
  RAISE NOTICE 'Sitemap ping triggered: % on %', TG_OP, TG_TABLE_NAME;
  
  RETURN NEW;
END;
$function$;

-- Trigger when a new active merchant is inserted
CREATE TRIGGER trigger_sitemap_ping_on_merchant_insert
AFTER INSERT ON public."Merchant"
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.notify_sitemap_update();

-- Trigger when a merchant is activated (status changes to active)
CREATE TRIGGER trigger_sitemap_ping_on_merchant_activate
AFTER UPDATE OF is_active ON public."Merchant"
FOR EACH ROW
WHEN (OLD.is_active = false AND NEW.is_active = true)
EXECUTE FUNCTION public.notify_sitemap_update();

-- Trigger when city or neighborhood is added/changed on an active merchant
CREATE TRIGGER trigger_sitemap_ping_on_location_change
AFTER UPDATE OF city, neighborhood ON public."Merchant"
FOR EACH ROW
WHEN (NEW.is_active = true AND (OLD.city IS DISTINCT FROM NEW.city OR OLD.neighborhood IS DISTINCT FROM NEW.neighborhood))
EXECUTE FUNCTION public.notify_sitemap_update();