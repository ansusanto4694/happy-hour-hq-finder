
-- Create merchant_store_hours table
CREATE TABLE public.merchant_store_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id integer NOT NULL REFERENCES "Merchant"(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_store_hours ENABLE ROW LEVEL SECURITY;

-- Anyone can view store hours
CREATE POLICY "Anyone can view store hours"
  ON public.merchant_store_hours FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins or merchant owners can manage store hours
CREATE POLICY "Admins or owners can insert store hours"
  ON public.merchant_store_hours FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR is_merchant_owner(store_id));

CREATE POLICY "Admins or owners can update store hours"
  ON public.merchant_store_hours FOR UPDATE
  TO authenticated
  USING (is_admin() OR is_merchant_owner(store_id));

CREATE POLICY "Admins or owners can delete store hours"
  ON public.merchant_store_hours FOR DELETE
  TO authenticated
  USING (is_admin() OR is_merchant_owner(store_id));

-- Updated_at trigger
CREATE TRIGGER update_merchant_store_hours_updated_at
  BEFORE UPDATE ON public.merchant_store_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Also update RLS on merchant_happy_hour to allow merchant owners
CREATE POLICY "Owners can insert happy hours"
  ON public.merchant_happy_hour FOR INSERT
  TO authenticated
  WITH CHECK (is_merchant_owner(store_id));

CREATE POLICY "Owners can update happy hours"
  ON public.merchant_happy_hour FOR UPDATE
  TO authenticated
  USING (is_merchant_owner(store_id));

CREATE POLICY "Owners can delete happy hours"
  ON public.merchant_happy_hour FOR DELETE
  TO authenticated
  USING (is_merchant_owner(store_id));

-- Also update RLS on happy_hour_deals to allow merchant owners
CREATE POLICY "Owners can insert deals"
  ON public.happy_hour_deals FOR INSERT
  TO authenticated
  WITH CHECK (is_merchant_owner(restaurant_id));

CREATE POLICY "Owners can update deals"
  ON public.happy_hour_deals FOR UPDATE
  TO authenticated
  USING (is_merchant_owner(restaurant_id));

CREATE POLICY "Owners can delete deals"
  ON public.happy_hour_deals FOR DELETE
  TO authenticated
  USING (is_merchant_owner(restaurant_id));

-- Allow merchant owners to update their own Merchant row (for settings)
CREATE POLICY "Owners can update their merchant"
  ON public."Merchant" FOR UPDATE
  TO authenticated
  USING (is_merchant_owner(id));
