-- Create table for merchant listing issue reports
CREATE TABLE public.merchant_listing_issue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES public."Merchant"(id) ON DELETE CASCADE,
  reporter_email TEXT,
  issue_types TEXT[] NOT NULL,
  additional_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.merchant_listing_issue ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to submit reports
CREATE POLICY "Anyone can submit merchant listing issues" 
ON public.merchant_listing_issue 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view all reports
CREATE POLICY "Admins can view all merchant listing issues" 
ON public.merchant_listing_issue 
FOR SELECT 
USING (is_admin());

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_merchant_listing_issue_updated_at
BEFORE UPDATE ON public.merchant_listing_issue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();