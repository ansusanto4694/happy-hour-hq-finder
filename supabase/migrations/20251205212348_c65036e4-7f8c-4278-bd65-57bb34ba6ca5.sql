-- Create a public view for reviewer display names
-- This exposes only the necessary fields for displaying reviewer names publicly
CREATE OR REPLACE VIEW public.profile_display_names AS
SELECT 
  id,
  first_name,
  CASE 
    WHEN last_name IS NOT NULL AND length(last_name) > 0 
    THEN left(last_name, 1) || '.'
    ELSE NULL
  END as last_name_initial
FROM public.profiles;

-- Grant SELECT access to everyone (including anonymous users)
GRANT SELECT ON public.profile_display_names TO anon, authenticated;