-- Create business table to group merchants
CREATE TABLE public.business (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on business table
ALTER TABLE public.business ENABLE ROW LEVEL SECURITY;

-- Create policies for business table
CREATE POLICY "Anyone can view businesses" 
ON public.business 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert businesses" 
ON public.business 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update businesses" 
ON public.business 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Only admins can delete businesses" 
ON public.business 
FOR DELETE 
USING (is_admin());

-- Add business_id column to Merchant table
ALTER TABLE public."Merchant" 
ADD COLUMN business_id UUID REFERENCES public.business(id);

-- Add trigger for updated_at on business table
CREATE TRIGGER update_business_updated_at
  BEFORE UPDATE ON public.business
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on business_id lookups
CREATE INDEX idx_merchant_business_id ON public."Merchant"(business_id);