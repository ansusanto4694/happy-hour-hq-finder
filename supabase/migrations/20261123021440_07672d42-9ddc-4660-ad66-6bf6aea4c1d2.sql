CREATE OR REPLACE FUNCTION public.strip_digit_lexemes(v tsvector)
RETURNS tsvector LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT ts_delete(v, ARRAY(SELECT lexeme FROM unnest(v) WHERE lexeme ~ '[0-9]'));
$$;

CREATE OR REPLACE FUNCTION public.refresh_event_search_vectors(target_event_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE public.events e
  SET search_vector =
        setweight(to_tsvector('english', coalesce(m.restaurant_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(e.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(m.neighborhood, '')), 'B') ||
        setweight(to_tsvector('english', replace(coalesce(e.event_type, ''), '_', ' ')), 'B') ||
        setweight(to_tsvector('english', coalesce((SELECT string_agg(mn.title, ' ') FROM public.event_menus em JOIN public.menus mn ON mn.id = em.menu_id AND mn.is_active WHERE em.event_id = e.id), '')), 'B') ||
        setweight(public.strip_digit_lexemes(to_tsvector('english', coalesce(e.description, ''))), 'C') ||
        setweight(public.strip_digit_lexemes(to_tsvector('english', coalesce((SELECT string_agg(mn.menu_text, ' ') FROM public.event_menus em JOIN public.menus mn ON mn.id = em.menu_id AND mn.is_active WHERE em.event_id = e.id), ''))), 'D'),
      search_vector_updated_at = now()
  FROM public."Merchant" m
  WHERE e.merchant_id = m.id
    AND (target_event_id IS NULL OR e.id = target_event_id);

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_event_search_vectors(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_event_search_vectors(UUID) TO service_role;

SELECT public.refresh_event_search_vectors();