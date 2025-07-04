
-- Create a function to notify when merchant addresses change
CREATE OR REPLACE FUNCTION notify_merchant_address_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any address-related fields have changed
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.street_address IS DISTINCT FROM NEW.street_address OR
       OLD.city IS DISTINCT FROM NEW.city OR
       OLD.state IS DISTINCT FROM NEW.state OR
       OLD.zip_code IS DISTINCT FROM NEW.zip_code
     )) THEN
    
    -- Clear existing coordinates when address changes
    IF TG_OP = 'UPDATE' THEN
      NEW.latitude = NULL;
      NEW.longitude = NULL;
      NEW.geocoded_at = NULL;
    END IF;
    
    -- Send webhook to Edge Function for geocoding
    PERFORM
      net.http_post(
        url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/geocode-address',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::jsonb,
        body := json_build_object(
          'merchant_id', NEW.id,
          'address', NEW.street_address || ', ' || NEW.city || ', ' || NEW.state || ' ' || NEW.zip_code
        )::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE operations
DROP TRIGGER IF EXISTS trigger_merchant_address_change ON Merchant;
CREATE TRIGGER trigger_merchant_address_change
  BEFORE INSERT OR UPDATE ON Merchant
  FOR EACH ROW
  EXECUTE FUNCTION notify_merchant_address_change();

-- Enable the pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;
