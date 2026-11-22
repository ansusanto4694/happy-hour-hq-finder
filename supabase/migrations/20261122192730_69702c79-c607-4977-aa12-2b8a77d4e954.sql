CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id INTEGER NOT NULL REFERENCES public."Merchant"(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'happy_hour',
  title TEXT NOT NULL,
  description TEXT,
  menu_type TEXT CHECK (menu_type IN ('food_and_drinks','drinks_only')),
  image_url TEXT,
  category_tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  source_url TEXT,
  source_label TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  legacy_source TEXT,
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active events" ON public.events FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners manage own events" ON public.events FOR ALL TO authenticated USING (public.is_merchant_owner(merchant_id)) WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE INDEX idx_events_merchant_id ON public.events(merchant_id);
CREATE INDEX idx_events_type_active ON public.events(event_type, is_active);
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL DEFAULT 'recurring' CHECK (schedule_type IN ('recurring','one_off')),
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  specific_date DATE,
  recurrence_rule TEXT DEFAULT 'weekly' CHECK (recurrence_rule IN ('weekly','biweekly','monthly')),
  recurrence_nth_week SMALLINT CHECK (recurrence_nth_week BETWEEN 1 AND 5),
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  legacy_source TEXT,
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((schedule_type = 'one_off' AND specific_date IS NOT NULL) OR (schedule_type = 'recurring' AND day_of_week IS NOT NULL))
);
GRANT SELECT ON public.event_schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_schedules TO authenticated;
GRANT ALL ON public.event_schedules TO service_role;
ALTER TABLE public.event_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active schedules" ON public.event_schedules FOR SELECT USING (is_active = true AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_active));
CREATE POLICY "Admins manage schedules" ON public.event_schedules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners manage own schedules" ON public.event_schedules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.is_merchant_owner(e.merchant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.is_merchant_owner(e.merchant_id)));
CREATE INDEX idx_event_schedules_event_id ON public.event_schedules(event_id);
CREATE INDEX idx_event_schedules_lookup ON public.event_schedules(day_of_week, start_time, end_time) WHERE is_active;
CREATE TRIGGER update_event_schedules_updated_at BEFORE UPDATE ON public.event_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Data copy (reads only from legacy tables)
INSERT INTO public.events (id, merchant_id, event_type, title, description, menu_type, is_active, is_verified, verified_at, verified_by, source_url, source_label, display_order, legacy_source, legacy_id, created_at, updated_at)
SELECT d.id, d.restaurant_id, 'happy_hour', d.deal_title, d.deal_description,
  CASE WHEN d.menu_type IN ('food_and_drinks','drinks_only') THEN d.menu_type END,
  d.active, d.is_verified, d.verified_at, d.verified_by, d.source_url, d.source_label, coalesce(d.display_order,0),
  'happy_hour_deals', d.id::text, d.created_at, d.updated_at
FROM public.happy_hour_deals d;

-- Placeholder events for merchants with hours but no deal
INSERT INTO public.events (merchant_id, event_type, title, legacy_source, legacy_id)
SELECT DISTINCT h.store_id, 'happy_hour', 'Happy Hour', 'merchant_happy_hour_placeholder', h.store_id::text
FROM public.merchant_happy_hour h
WHERE NOT EXISTS (SELECT 1 FROM public.happy_hour_deals d WHERE d.restaurant_id = h.store_id);

-- Happy hour time slots: attach every slot to every happy hour event of that merchant (mirrors current behavior)
INSERT INTO public.event_schedules (event_id, schedule_type, day_of_week, start_time, end_time, recurrence_rule, legacy_source, legacy_id, created_at, updated_at)
SELECT e.id, 'recurring', h.day_of_week, h.happy_hour_start, h.happy_hour_end, 'weekly', 'merchant_happy_hour', h.id::text, h.created_at, h.updated_at
FROM public.merchant_happy_hour h
JOIN public.events e ON e.merchant_id = h.store_id AND e.event_type = 'happy_hour';

-- Legacy merchant_events
INSERT INTO public.events (merchant_id, event_type, title, description, image_url, category_tags, is_active, legacy_source, legacy_id, created_at, updated_at)
SELECT restaurant_id, coalesce(category_tags[1], 'event'), title, description, image_url, category_tags, is_active, 'merchant_events', id::text, created_at, updated_at
FROM public.merchant_events;

INSERT INTO public.event_schedules (event_id, schedule_type, day_of_week, start_time, end_time, specific_date, recurrence_rule, valid_from, valid_until, legacy_source, legacy_id)
SELECT e.id,
  CASE WHEN m.recurrence_rule IS NULL THEN 'one_off' ELSE 'recurring' END,
  CASE WHEN m.recurrence_rule IS NULL THEN NULL ELSE coalesce(m.recurrence_day, extract(dow FROM (m.event_date AT TIME ZONE 'America/New_York'))::int) END,
  coalesce(m.start_time, (m.event_date AT TIME ZONE 'America/New_York')::time, '00:00'),
  coalesce(m.end_time, '23:59'),
  CASE WHEN m.recurrence_rule IS NULL THEN (m.event_date AT TIME ZONE 'America/New_York')::date END,
  CASE WHEN m.recurrence_rule IS NULL THEN NULL ELSE m.recurrence_rule END,
  (m.event_date AT TIME ZONE 'America/New_York')::date,
  m.repeat_until,
  'merchant_events', m.id::text
FROM public.merchant_events m
JOIN public.events e ON e.legacy_source = 'merchant_events' AND e.legacy_id = m.id::text;