
-- Create a table for happy hour deals
CREATE TABLE public.happy_hour_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  deal_title TEXT NOT NULL,
  deal_description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index for faster queries by restaurant_id
CREATE INDEX idx_happy_hour_deals_restaurant_id ON public.happy_hour_deals(restaurant_id);

-- Create an index for active deals
CREATE INDEX idx_happy_hour_deals_active ON public.happy_hour_deals(active);

-- Add Row Level Security (RLS) - making it public for now since no auth is implemented
ALTER TABLE public.happy_hour_deals ENABLE ROW LEVEL SECURITY;

-- Create policy that allows everyone to read deals (since this is public information)
CREATE POLICY "Anyone can view happy hour deals" 
  ON public.happy_hour_deals 
  FOR SELECT 
  USING (true);

-- For now, allow all operations since you're the sole operator
-- You can restrict this later when auth is implemented
CREATE POLICY "Allow all operations for now" 
  ON public.happy_hour_deals 
  FOR ALL 
  USING (true)
  WITH CHECK (true);
