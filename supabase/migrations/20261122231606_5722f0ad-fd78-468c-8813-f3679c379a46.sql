CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id INTEGER NOT NULL REFERENCES public."Merchant"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  menu_type TEXT,
  menu_text TEXT,
  source_url TEXT,
  source_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  legacy_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menus TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menus TO authenticated;
GRANT ALL ON public.menus TO service_role;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active menus" ON public.menus FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage menus" ON public.menus FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners manage own menus" ON public.menus FOR ALL TO authenticated USING (public.is_merchant_owner(merchant_id)) WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE INDEX idx_menus_merchant_id ON public.menus(merchant_id);
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON public.menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, menu_id)
);
GRANT SELECT ON public.event_menus TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_menus TO authenticated;
GRANT ALL ON public.event_menus TO service_role;
ALTER TABLE public.event_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view event menus" ON public.event_menus FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_active)
  AND EXISTS (SELECT 1 FROM public.menus m WHERE m.id = menu_id AND m.is_active));
CREATE POLICY "Admins manage event menus" ON public.event_menus FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners manage own event menus" ON public.event_menus FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e JOIN public.menus m ON m.id = menu_id WHERE e.id = event_id AND public.is_merchant_owner(e.merchant_id) AND m.merchant_id = e.merchant_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e JOIN public.menus m ON m.id = menu_id WHERE e.id = event_id AND public.is_merchant_owner(e.merchant_id) AND m.merchant_id = e.merchant_id));
CREATE INDEX idx_event_menus_event_id ON public.event_menus(event_id);
CREATE INDEX idx_event_menus_menu_id ON public.event_menus(menu_id);

-- Move happy hour menu text out of events (legacy tables untouched)
INSERT INTO public.menus (merchant_id, title, menu_type, menu_text, source_url, source_label, is_active, legacy_event_id)
SELECT merchant_id, title, menu_type, description, source_url, source_label, is_active, id
FROM public.events
WHERE event_type = 'happy_hour' AND (description IS NOT NULL OR menu_type IS NOT NULL);

INSERT INTO public.event_menus (event_id, menu_id, display_order)
SELECT legacy_event_id, id, 0 FROM public.menus WHERE legacy_event_id IS NOT NULL;

UPDATE public.events e SET description = NULL
WHERE EXISTS (SELECT 1 FROM public.menus m WHERE m.legacy_event_id = e.id);

-- Non-happy-hour events that carried a menu_type but no menu: keep the type on an empty menu
INSERT INTO public.menus (merchant_id, title, menu_type, is_active, legacy_event_id)
SELECT merchant_id, title, menu_type, is_active, id FROM public.events
WHERE menu_type IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.menus m WHERE m.legacy_event_id = events.id);
INSERT INTO public.event_menus (event_id, menu_id)
SELECT m.legacy_event_id, m.id FROM public.menus m
WHERE NOT EXISTS (SELECT 1 FROM public.event_menus em WHERE em.menu_id = m.id);

ALTER TABLE public.events DROP COLUMN menu_type;