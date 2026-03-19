
-- Add RLS policies for merchant owners on merchant_offers
-- Also need a SELECT policy for owners to see all their offers (not just active ones)
CREATE POLICY "Owners can view their offers"
ON public.merchant_offers
FOR SELECT
TO authenticated
USING (is_merchant_owner(store_id));

CREATE POLICY "Owners can insert offers"
ON public.merchant_offers
FOR INSERT
TO authenticated
WITH CHECK (is_merchant_owner(store_id));

CREATE POLICY "Owners can update offers"
ON public.merchant_offers
FOR UPDATE
TO authenticated
USING (is_merchant_owner(store_id));

CREATE POLICY "Owners can delete offers"
ON public.merchant_offers
FOR DELETE
TO authenticated
USING (is_merchant_owner(store_id));
