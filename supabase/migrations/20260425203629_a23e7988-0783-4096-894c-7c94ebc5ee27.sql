-- Create donations table for one-time Stripe Checkout donations
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  donor_email TEXT,
  donor_name TEXT,
  message TEXT,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_donations_stripe_session_id ON public.donations(stripe_session_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_user_id ON public.donations(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Only admins can read donations (private financial data)
CREATE POLICY "Admins can view all donations"
ON public.donations
FOR SELECT
USING (is_admin());

-- No client-side INSERT/UPDATE/DELETE policies — only the service role
-- (used by edge functions) can write. Service role bypasses RLS.

-- Auto-update updated_at
CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();