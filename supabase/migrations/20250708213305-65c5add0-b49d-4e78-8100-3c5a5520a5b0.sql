-- Add trigger to automatically geocode merchants when address fields are updated
CREATE TRIGGER trigger_auto_geocode_merchant_update
    AFTER UPDATE OF street_address, street_address_line_2, city, state, zip_code ON public."Merchant"
    FOR EACH ROW
    WHEN (
        OLD.street_address IS DISTINCT FROM NEW.street_address OR
        OLD.street_address_line_2 IS DISTINCT FROM NEW.street_address_line_2 OR
        OLD.city IS DISTINCT FROM NEW.city OR
        OLD.state IS DISTINCT FROM NEW.state OR
        OLD.zip_code IS DISTINCT FROM NEW.zip_code
    )
    EXECUTE FUNCTION public.auto_geocode_merchant();