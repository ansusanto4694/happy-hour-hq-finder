-- Create homepage carousels table
CREATE TABLE public.homepage_carousels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create carousel merchants junction table
CREATE TABLE public.carousel_merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carousel_id UUID NOT NULL REFERENCES public.homepage_carousels(id) ON DELETE CASCADE,
  merchant_id INTEGER NOT NULL REFERENCES public."Merchant"(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  removed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(carousel_id, merchant_id)
);

-- Enable RLS on both tables
ALTER TABLE public.homepage_carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_merchants ENABLE ROW LEVEL SECURITY;

-- RLS policies for homepage_carousels
CREATE POLICY "Anyone can view active carousels"
ON public.homepage_carousels 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage carousels"
ON public.homepage_carousels 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- RLS policies for carousel_merchants
CREATE POLICY "Anyone can view active carousel merchants"
ON public.carousel_merchants 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage carousel merchants"
ON public.carousel_merchants 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create indexes for performance
CREATE INDEX idx_homepage_carousels_active_display_order ON public.homepage_carousels(is_active, display_order);
CREATE INDEX idx_carousel_merchants_carousel_display_order ON public.carousel_merchants(carousel_id, is_active, display_order);
CREATE INDEX idx_carousel_merchants_merchant ON public.carousel_merchants(merchant_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_homepage_carousels_updated_at
BEFORE UPDATE ON public.homepage_carousels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carousel_merchants_updated_at
BEFORE UPDATE ON public.carousel_merchants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle merchant removal tracking
CREATE OR REPLACE FUNCTION public.handle_carousel_merchant_deactivation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If merchant is being deactivated, set removed_at timestamp
  IF OLD.is_active = true AND NEW.is_active = false THEN
    NEW.removed_at = now();
  END IF;
  
  -- If merchant is being reactivated, clear removed_at and update added_at
  IF OLD.is_active = false AND NEW.is_active = true THEN
    NEW.removed_at = NULL;
    NEW.added_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for carousel merchant deactivation tracking
CREATE TRIGGER handle_carousel_merchant_deactivation_trigger
BEFORE UPDATE ON public.carousel_merchants
FOR EACH ROW
EXECUTE FUNCTION public.handle_carousel_merchant_deactivation();