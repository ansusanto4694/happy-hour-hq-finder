CREATE OR REPLACE FUNCTION public.enforce_and_stamp_deal_verification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Normalize empty strings to NULL
  IF NEW.source_url IS NOT NULL AND length(trim(NEW.source_url)) = 0 THEN
    NEW.source_url = NULL;
  END IF;
  IF NEW.source_label IS NOT NULL AND length(trim(NEW.source_label)) = 0 THEN
    NEW.source_label = NULL;
  END IF;

  -- Normalize menu_type: empty string or 'not_specified' → NULL
  IF NEW.menu_type IS NOT NULL AND (length(trim(NEW.menu_type)) = 0 OR NEW.menu_type = 'not_specified') THEN
    NEW.menu_type = NULL;
  END IF;

  -- If marking as verified, ensure a source URL exists and stamp metadata
  IF NEW.is_verified IS TRUE THEN
    IF NEW.source_url IS NULL THEN
      RAISE EXCEPTION 'Cannot mark deal as verified without a source_url';
    END IF;
    IF NEW.verified_at IS NULL THEN
      NEW.verified_at = now();
    END IF;
    NEW.verified_by = auth.uid();
  ELSE
    -- If unverified, clear verification metadata
    NEW.verified_at = NULL;
    NEW.verified_by = NULL;
  END IF;

  RETURN NEW;
END;
$$;