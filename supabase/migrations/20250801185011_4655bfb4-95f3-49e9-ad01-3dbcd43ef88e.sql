-- Enable Row Level Security on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on merchant_categories table  
ALTER TABLE public.merchant_categories ENABLE ROW LEVEL SECURITY;

-- Categories policies: publicly readable, admin-only modifications
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update categories" 
ON public.categories 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Only admins can delete categories" 
ON public.categories 
FOR DELETE 
USING (is_admin());

-- Merchant categories policies: publicly readable, admin-only modifications
CREATE POLICY "Anyone can view merchant categories" 
ON public.merchant_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert merchant categories" 
ON public.merchant_categories 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update merchant categories" 
ON public.merchant_categories 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Only admins can delete merchant categories" 
ON public.merchant_categories 
FOR DELETE 
USING (is_admin());