-- Enable pg_net extension for HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to automatically geocode new merchants
CREATE OR REPLACE FUNCTION public.auto_geocode_merchant()
RETURNS TRIGGER AS $$
DECLARE
    full_address TEXT;
    request_id BIGINT;
    response_data JSONB;
BEGIN
    -- Build the full address from the merchant data
    full_address := NEW.street_address || ', ' || NEW.city || ', ' || NEW.state || ' ' || NEW.zip_code;
    
    -- Make HTTP request to the geocode-address edge function
    SELECT net.http_post(
        url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/geocode-address',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::JSONB,
        body := jsonb_build_object('address', full_address)
    ) INTO request_id;
    
    -- Note: The HTTP request is async, so we'll need to handle the response separately
    -- For now, we'll just log that geocoding was attempted
    RAISE NOTICE 'Geocoding request initiated for merchant %: %', NEW.id, full_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically geocode new merchants
CREATE TRIGGER trigger_auto_geocode_merchant
    AFTER INSERT ON public."Merchant"
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_geocode_merchant();

-- Create a function to handle geocoding responses (this will be called by a webhook)
CREATE OR REPLACE FUNCTION public.update_merchant_coordinates(
    merchant_id INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
)
RETURNS VOID AS $$
BEGIN
    UPDATE public."Merchant" 
    SET 
        latitude = update_merchant_coordinates.latitude,
        longitude = update_merchant_coordinates.longitude,
        geocoded_at = NOW()
    WHERE id = merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;