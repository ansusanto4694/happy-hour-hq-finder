
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_merchant_address_change ON Merchant;
DROP FUNCTION IF EXISTS notify_merchant_address_change();

-- Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create an improved function with service role authentication
CREATE OR REPLACE FUNCTION notify_merchant_address_change()
RETURNS TRIGGER AS $$
DECLARE
  full_address TEXT;
  response_id BIGINT;
  request_result RECORD;
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
    
    -- Send webhook to Edge Function for geocoding using service role key
    BEGIN
      SELECT INTO request_result * FROM net.http_post(
        url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/geocode-address',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'merchant_id', NEW.id,
          'address', full_address
        )
      );
      
      -- Log the response
      RAISE LOG 'HTTP request sent for merchant ID %, status: %', NEW.id, request_result.status_code;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log any errors but don't fail the transaction
      RAISE LOG 'Failed to send geocoding request for merchant ID %: %', NEW.id, SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for AFTER INSERT and UPDATE operations
CREATE TRIGGER trigger_merchant_address_change
  AFTER INSERT OR UPDATE ON Merchant
  FOR EACH ROW
  EXECUTE FUNCTION notify_merchant_address_change();

-- Set the service role key as a database setting (you'll need to replace with actual key)
-- This needs to be run manually with the actual service role key
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
