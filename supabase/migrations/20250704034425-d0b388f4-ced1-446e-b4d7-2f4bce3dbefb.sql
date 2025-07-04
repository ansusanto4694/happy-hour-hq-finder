
-- First, let's make sure we have a clean slate by dropping any existing triggers
DROP TRIGGER IF EXISTS trigger_merchant_address_change ON Merchant;
DROP FUNCTION IF EXISTS notify_merchant_address_change();

-- Enable the pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the function that will automatically geocode addresses
CREATE OR REPLACE FUNCTION notify_merchant_address_change()
RETURNS TRIGGER AS $$
DECLARE
  full_address TEXT;
  http_request_id BIGINT;
BEGIN
  -- Build the full address from the merchant data
  full_address := NEW.street_address || ', ' || NEW.city || ', ' || NEW.state || ' ' || NEW.zip_code;
  
  -- Log the trigger execution for debugging
  RAISE LOG 'Geocoding trigger fired for merchant ID % with address: %', NEW.id, full_address;
  
  -- Check if this is an INSERT or if any address-related fields have changed in an UPDATE
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.street_address IS DISTINCT FROM NEW.street_address OR
       OLD.city IS DISTINCT FROM NEW.city OR
       OLD.state IS DISTINCT FROM NEW.state OR
       OLD.zip_code IS DISTINCT FROM NEW.zip_code
     )) THEN
    
    -- For updates, clear existing coordinates when address changes
    IF TG_OP = 'UPDATE' THEN
      -- Clear the coordinates in a separate UPDATE to avoid infinite loops
      UPDATE Merchant 
      SET latitude = NULL, longitude = NULL, geocoded_at = NULL 
      WHERE id = NEW.id;
    END IF;
    
    -- Make the HTTP request to our geocoding edge function
    SELECT net.http_post(
      url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/geocode-address',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::jsonb,
      body := json_build_object(
        'merchant_id', NEW.id,
        'address', full_address
      )::jsonb
    ) INTO http_request_id;
    
    -- Log the HTTP request ID for debugging
    RAISE LOG 'HTTP geocoding request sent for merchant ID %, request ID: %', NEW.id, http_request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires AFTER INSERT or UPDATE
CREATE TRIGGER trigger_merchant_address_change
  AFTER INSERT OR UPDATE ON Merchant
  FOR EACH ROW
  EXECUTE FUNCTION notify_merchant_address_change();

-- Also create a helper function to manually trigger geocoding for existing records if needed
CREATE OR REPLACE FUNCTION manual_geocode_merchant(merchant_id INTEGER)
RETURNS VOID AS $$
DECLARE
  merchant_record RECORD;
  full_address TEXT;
  http_request_id BIGINT;
BEGIN
  -- Get the merchant record
  SELECT * INTO merchant_record FROM Merchant WHERE id = merchant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Merchant with ID % not found', merchant_id;
  END IF;
  
  -- Build the full address
  full_address := merchant_record.street_address || ', ' || merchant_record.city || ', ' || merchant_record.state || ' ' || merchant_record.zip_code;
  
  -- Clear existing coordinates
  UPDATE Merchant 
  SET latitude = NULL, longitude = NULL, geocoded_at = NULL 
  WHERE id = merchant_id;
  
  -- Send HTTP request to geocoding edge function
  SELECT net.http_post(
    url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/geocode-address',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::jsonb,
    body := json_build_object(
      'merchant_id', merchant_id,
      'address', full_address
    )::jsonb
  ) INTO http_request_id;
  
  RAISE LOG 'Manual geocoding triggered for merchant ID %, request ID: %', merchant_id, http_request_id;
END;
$$ LANGUAGE plpgsql;
