
-- Create the restaurant_happy_hour table
CREATE TABLE public.restaurant_happy_hour (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  happy_hour_start TIME NOT NULL,
  happy_hour_end TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_restaurant_happy_hour_store_id ON public.restaurant_happy_hour(store_id);
CREATE INDEX idx_restaurant_happy_hour_day_of_week ON public.restaurant_happy_hour(day_of_week);

-- Enable Row Level Security (RLS)
ALTER TABLE public.restaurant_happy_hour ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching the restaurants table)
CREATE POLICY "Anyone can view restaurant happy hours" 
  ON public.restaurant_happy_hour 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert restaurant happy hours" 
  ON public.restaurant_happy_hour 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update restaurant happy hours" 
  ON public.restaurant_happy_hour 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete restaurant happy hours" 
  ON public.restaurant_happy_hour 
  FOR DELETE 
  USING (true);
