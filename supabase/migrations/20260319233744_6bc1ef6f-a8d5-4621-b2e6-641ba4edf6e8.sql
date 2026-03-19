
-- Add redemption_pin column to merchant_offers
ALTER TABLE public.merchant_offers ADD COLUMN redemption_pin text;

-- Create offer_redemptions table
CREATE TABLE public.offer_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.merchant_offers(id) ON DELETE CASCADE,
  store_id integer NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  session_id text
);

-- Enable RLS
ALTER TABLE public.offer_redemptions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert redemptions (customers may be anonymous)
CREATE POLICY "Anyone can insert redemptions"
  ON public.offer_redemptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Merchants can view their own redemptions
CREATE POLICY "Owners can view their redemptions"
  ON public.offer_redemptions FOR SELECT
  TO authenticated
  USING (is_merchant_owner(store_id));

-- Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
  ON public.offer_redemptions FOR SELECT
  TO authenticated
  USING (is_admin());
