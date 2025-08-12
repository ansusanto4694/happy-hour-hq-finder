-- 1) Add verification-related columns to happy_hour_deals
ALTER TABLE public.happy_hour_deals
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_label text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- 2) Add FK to profiles(id) for verified_by if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'happy_hour_deals_verified_by_fkey'
  ) THEN
    ALTER TABLE public.happy_hour_deals
      ADD CONSTRAINT happy_hour_deals_verified_by_fkey
      FOREIGN KEY (verified_by) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Create trigger function to enforce verification invariants and stamp metadata
CREATE OR REPLACE FUNCTION public.enforce_and_stamp_deal_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalize empty strings to NULL
  IF NEW.source_url IS NOT NULL AND length(trim(NEW.source_url)) = 0 THEN
    NEW.source_url = NULL;
  END IF;
  IF NEW.source_label IS NOT NULL AND length(trim(NEW.source_label)) = 0 THEN
    NEW.source_label = NULL;
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

-- 4) Attach trigger on INSERT/UPDATE
DROP TRIGGER IF EXISTS trg_happy_hour_deals_verification_biu ON public.happy_hour_deals;
CREATE TRIGGER trg_happy_hour_deals_verification_biu
BEFORE INSERT OR UPDATE ON public.happy_hour_deals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_and_stamp_deal_verification();