-- Update function to fix search path security warning
CREATE OR REPLACE FUNCTION public.handle_carousel_merchant_deactivation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If merchant is being deactivated, set removed_at timestamp
  IF OLD.is_active = true AND NEW.is_active = false THEN
    NEW.removed_at = now();
  END IF;
  
  -- If merchant is being reactivated, clear removed_at and update added_at
  IF OLD.is_active = false AND NEW.is_active = true THEN
    NEW.removed_at = NULL;
    NEW.added_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;