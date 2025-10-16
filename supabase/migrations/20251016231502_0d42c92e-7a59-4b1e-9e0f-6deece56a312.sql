-- Create user_events table for tracking all user interactions
CREATE TABLE public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_category text NOT NULL,
  event_action text NOT NULL,
  event_label text,
  page_url text NOT NULL,
  page_path text NOT NULL,
  referrer_url text,
  element_id text,
  element_text text,
  element_class text,
  merchant_id integer REFERENCES public."Merchant"(id) ON DELETE SET NULL,
  carousel_id uuid REFERENCES public.homepage_carousels(id) ON DELETE SET NULL,
  search_term text,
  location_query text,
  metadata jsonb,
  viewport_width integer,
  viewport_height integer,
  is_mobile boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_sessions table for session-level tracking
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_seen timestamp with time zone NOT NULL DEFAULT now(),
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  page_views integer NOT NULL DEFAULT 0,
  total_events integer NOT NULL DEFAULT 0,
  entry_page text NOT NULL,
  exit_page text,
  referrer_source text,
  device_type text NOT NULL,
  user_agent text,
  is_bounce boolean NOT NULL DEFAULT false,
  session_duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create funnel_events table for conversion tracking
CREATE TABLE public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  funnel_step text NOT NULL,
  merchant_id integer REFERENCES public."Merchant"(id) ON DELETE SET NULL,
  step_order integer NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_events_session_created ON public.user_events(session_id, created_at DESC);
CREATE INDEX idx_user_events_user_created ON public.user_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_user_events_category_action ON public.user_events(event_category, event_action);
CREATE INDEX idx_user_events_merchant ON public.user_events(merchant_id) WHERE merchant_id IS NOT NULL;
CREATE INDEX idx_user_sessions_session ON public.user_sessions(session_id);
CREATE INDEX idx_funnel_events_session_order ON public.funnel_events(session_id, step_order);

-- Enable RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_events
CREATE POLICY "Anyone can insert events"
  ON public.user_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all events"
  ON public.user_events
  FOR SELECT
  USING (is_admin());

-- RLS Policies for user_sessions
CREATE POLICY "Anyone can insert sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own session"
  ON public.user_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  USING (is_admin());

-- RLS Policies for funnel_events
CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all funnel events"
  ON public.funnel_events
  FOR SELECT
  USING (is_admin());