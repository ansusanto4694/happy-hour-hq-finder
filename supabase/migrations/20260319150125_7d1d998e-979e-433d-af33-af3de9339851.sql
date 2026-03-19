
-- 1. Evolve merchant_events table
ALTER TABLE merchant_events
  ADD COLUMN event_type text NOT NULL DEFAULT 'one_time',
  ADD COLUMN recurrence_rule text,
  ADD COLUMN recurrence_day integer,
  ADD COLUMN start_time time,
  ADD COLUMN end_time time,
  ADD COLUMN neighborhood text,
  ADD COLUMN city text,
  ADD COLUMN category_tags text[] DEFAULT '{}',
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- 2. Create merchant_owners table
CREATE TABLE merchant_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id integer NOT NULL REFERENCES "Merchant"(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, merchant_id)
);

ALTER TABLE merchant_owners ENABLE ROW LEVEL SECURITY;

-- 3. Helper function: is_merchant_owner
CREATE OR REPLACE FUNCTION public.is_merchant_owner(_merchant_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.merchant_owners
    WHERE user_id = auth.uid()
      AND merchant_id = _merchant_id
      AND status = 'approved'
  );
$$;

-- 4. RLS for merchant_owners
CREATE POLICY "Users can view their own merchant ownership"
  ON merchant_owners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all merchant ownership"
  ON merchant_owners FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 5. RLS for merchant_events: admin or owner can INSERT/UPDATE/DELETE
CREATE POLICY "Admins or owners can insert events"
  ON merchant_events FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_merchant_owner(restaurant_id));

CREATE POLICY "Admins or owners can update events"
  ON merchant_events FOR UPDATE TO authenticated
  USING (is_admin() OR is_merchant_owner(restaurant_id));

CREATE POLICY "Admins or owners can delete events"
  ON merchant_events FOR DELETE TO authenticated
  USING (is_admin() OR is_merchant_owner(restaurant_id));

-- 6. Trigger to denormalize neighborhood/city from Merchant
CREATE OR REPLACE FUNCTION public.denormalize_event_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT m.neighborhood, m.city
  INTO NEW.neighborhood, NEW.city
  FROM "Merchant" m
  WHERE m.id = NEW.restaurant_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_denormalize_event_location
  BEFORE INSERT OR UPDATE ON merchant_events
  FOR EACH ROW
  EXECUTE FUNCTION denormalize_event_location();
