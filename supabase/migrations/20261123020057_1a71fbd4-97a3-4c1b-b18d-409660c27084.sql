ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS search_vector_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_events_search_vector ON public.events USING GIN (search_vector);

CREATE OR REPLACE FUNCTION public.refresh_event_search_vectors(target_event_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  WITH aggregated_menus AS (
    SELECT em.event_id,
           string_agg(mn.title, ' ') AS menu_titles,
           string_agg(mn.menu_text, ' ') AS menu_texts
    FROM public.event_menus em
    JOIN public.menus mn ON mn.id = em.menu_id
    WHERE mn.is_active = true
    GROUP BY em.event_id
  )
  UPDATE public.events e
  SET search_vector =
        setweight(to_tsvector('english', coalesce(m.restaurant_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(e.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(m.neighborhood, '')), 'B') ||
        setweight(to_tsvector('english', replace(coalesce(e.event_type, ''), '_', ' ')), 'B') ||
        setweight(to_tsvector('english', coalesce(am.menu_titles, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(e.description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(am.menu_texts, '')), 'D'),
      search_vector_updated_at = now()
  FROM public."Merchant" m
  LEFT JOIN aggregated_menus am ON true
  WHERE e.merchant_id = m.id
    AND (am.event_id IS NULL OR am.event_id = e.id)
    AND (target_event_id IS NULL OR e.id = target_event_id);

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_event_search_vectors(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_event_search_vectors(UUID) TO authenticated, service_role;

SELECT public.refresh_event_search_vectors();