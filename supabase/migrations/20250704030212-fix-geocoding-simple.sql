
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_merchant_address_change ON Merchant;
DROP FUNCTION IF EXISTS notify_merchant_address_change();

-- Create a simpler function that just logs and makes the HTTP call
CREATE OR REPLACE FUNCTION notify_merchant_address_change()
RETURNS TRIGGER AS $$
DECLARE
  full_address TEXT;
  http_request_id BIGINT;
BEGIN
  -- Build the full address
  full_address := NEW.street_address || ', ' || NEW.city || ', ' || NEW.state || ' ' || NEW.zip_code;
  
  -- Log the trigger execution
  RAISE LOG 'Geocoding trigger fired for merchant ID % with address: %', NEW.id, full_address;
  
  -- Check if any address-related fields have changed (for updates) or if this is an insert
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.street_address IS DISTINCT FROM NEW.street_address OR
       OLD.city IS DISTINCT FROM NEW.city OR
       OLD.state IS DISTINCT FROM NEW.state OR
       OLD.zip_code IS DISTINCT FROM NEW.zip_code
     )) THEN
    
    -- Clear existing coordinates when address changes (only for updates)
    IF TG_OP = 'UPDATE' THEN
      UPDATE Merchant 
      SET latitude = NULL, longitude = NULL, geocoded_at = NULL 
      WHERE id = NEW.id;
    END IF;
    
    -- Make the HTTP request and capture the ID
    SELECT net.http_post(
      url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/geocode-address',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::jsonb,
      body := json_build_object(
        'merchant_id', NEW.id,
        'address', full_address
      )::jsonb
    ) INTO http_request_id;
    
    -- Log the request ID
    RAISE LOG 'HTTP request sent for merchant ID %, request ID: %', NEW.id, http_request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for AFTER INSERT and UPDATE operations
CREATE TRIGGER trigger_merchant_address_change
  AFTER INSERT OR UPDATE ON Merchant
  FOR EACH ROW
  EXECUTE FUNCTION notify_merchant_address_change();
