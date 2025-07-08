-- Update the auto_geocode_merchant function to pass merchantId to the edge function
CREATE OR REPLACE FUNCTION public.auto_geocode_merchant()
RETURNS TRIGGER AS $$
DECLARE
    full_address TEXT;
    request_id BIGINT;
BEGIN
    -- Build the full address from the merchant data
    full_address := NEW.street_address || ', ' || NEW.city || ', ' || NEW.state || ' ' || NEW.zip_code;
    
    -- Make HTTP request to the geocode-address edge function with merchantId
    SELECT net.http_post(
        url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/geocode-address',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::JSONB,
        body := jsonb_build_object(
            'address', full_address,
            'merchantId', NEW.id
        )
    ) INTO request_id;
    
    RAISE NOTICE 'Geocoding request initiated for merchant % (ID: %): %', NEW.restaurant_name, NEW.id, full_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;