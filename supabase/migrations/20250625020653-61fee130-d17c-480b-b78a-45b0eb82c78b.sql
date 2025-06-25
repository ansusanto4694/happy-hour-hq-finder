
-- Create a table for restaurant events
CREATE TABLE public.restaurant_events (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance when querying events by restaurant
CREATE INDEX idx_restaurant_events_restaurant_id ON public.restaurant_events(restaurant_id);

-- Create index for ordering events by creation date
CREATE INDEX idx_restaurant_events_created_at ON public.restaurant_events(created_at DESC);

-- Enable Row Level Security (since this is public data, we'll make it readable by everyone)
ALTER TABLE public.restaurant_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read events (public feed)
CREATE POLICY "Anyone can view restaurant events" 
  ON public.restaurant_events 
  FOR SELECT 
  TO public
  USING (true);

-- Insert some sample events for the restaurant
INSERT INTO public.restaurant_events (restaurant_id, title, description, event_date, image_url) VALUES
(1, 'Happy Hour Special', 'Join us for our extended happy hour with 50% off all drinks and appetizers!', NOW() + INTERVAL '2 days', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400'),
(1, 'Live Music Night', 'Acoustic guitar performance by local artist Sarah Johnson. Come enjoy great food and music!', NOW() + INTERVAL '5 days', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
(1, 'Vietnamese Cooking Class', 'Learn to make authentic pho from our head chef. Limited spots available!', NOW() + INTERVAL '1 week', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400');
