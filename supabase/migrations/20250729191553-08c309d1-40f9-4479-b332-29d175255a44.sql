-- Create merchant_offers table
CREATE TABLE public.merchant_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES public."Merchant"(id) ON DELETE CASCADE,
  offer_name TEXT NOT NULL,
  offer_description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.merchant_offers ENABLE ROW LEVEL SECURITY;

-- Create policies for merchant offers
CREATE POLICY "Anyone can view active merchant offers" 
ON public.merchant_offers 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage merchant offers" 
ON public.merchant_offers 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_merchant_offers_updated_at
BEFORE UPDATE ON public.merchant_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance on store_id queries
CREATE INDEX idx_merchant_offers_store_id ON public.merchant_offers(store_id);

-- Add index for active offers queries
CREATE INDEX idx_merchant_offers_active ON public.merchant_offers(is_active, start_time, end_time);