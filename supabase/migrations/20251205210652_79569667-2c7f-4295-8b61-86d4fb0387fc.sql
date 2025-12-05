-- Create trigger function to auto-generate merchant slug
CREATE OR REPLACE FUNCTION public.auto_generate_merchant_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Only regenerate slug if relevant fields changed or slug is null
  IF TG_OP = 'INSERT' OR 
     NEW.slug IS NULL OR
     OLD.restaurant_name IS DISTINCT FROM NEW.restaurant_name OR 
     OLD.neighborhood IS DISTINCT FROM NEW.neighborhood OR 
     OLD.city IS DISTINCT FROM NEW.city THEN
    
    -- Generate base slug using existing function
    base_slug := generate_merchant_slug(NEW.restaurant_name, NEW.neighborhood, NEW.city);
    final_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (
      SELECT 1 FROM "Merchant" 
      WHERE slug = final_slug AND id != NEW.id
    ) LOOP
      final_slug := base_slug || '-' || NEW.id::text;
      counter := counter + 1;
      -- Safety exit after one iteration since we're using ID
      EXIT;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_merchant_slug ON "Merchant";
CREATE TRIGGER trigger_auto_generate_merchant_slug
  BEFORE INSERT OR UPDATE ON "Merchant"
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_merchant_slug();