import { supabase } from '@/integrations/supabase/client';

export interface TrackEventParams {
  eventType: 'click' | 'page_view' | 'form_submit' | 'interaction';
  eventCategory: 'navigation' | 'search' | 'carousel' | 'filter' | 'merchant_interaction' | 'authentication' | 'map_interaction' | 'page_view';
  eventAction: string;
  eventLabel?: string;
  merchantId?: number;
  carouselId?: string;
  searchTerm?: string;
  locationQuery?: string;
  elementId?: string;
  elementText?: string;
  elementClass?: string;
  metadata?: Record<string, any>;
}

export interface FunnelStep {
  step: 'homepage_view' | 'search_initiated' | 'results_viewed' | 'merchant_clicked' | 'profile_viewed' | 'contact_clicked';
  merchantId?: number;
}

let eventQueue: any[] = [];
let sessionStartTime: number | null = null;
let lastActivityTime: number | null = null;

// Session management
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
    sessionStartTime = Date.now();
  }
  
  return sessionId;
};

export const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const isMobileDevice = (): boolean => {
  return getDeviceType() === 'mobile';
};

// Initialize or update session
export const initializeSession = async () => {
  const sessionId = getSessionId();
  const userId = await getUserId();
  const deviceType = getDeviceType();
  const currentPath = window.location.pathname;
  const referrer = document.referrer;
  
  // Check if session already exists
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle();
  
  if (!existingSession) {
    // Create new session
    await supabase.from('user_sessions').insert({
      session_id: sessionId,
      user_id: userId,
      entry_page: currentPath,
      referrer_source: referrer || null,
      device_type: deviceType,
      user_agent: navigator.userAgent,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });
    
    sessionStartTime = Date.now();
  } else {
    // Update existing session
    updateSessionActivity();
  }
  
  lastActivityTime = Date.now();
};

// Update session activity
export const updateSessionActivity = async () => {
  const sessionId = getSessionId();
  const currentPath = window.location.pathname;
  
  const now = Date.now();
  const sessionDuration = sessionStartTime ? Math.floor((now - sessionStartTime) / 1000) : 0;
  
  await supabase
    .from('user_sessions')
    .update({
      last_seen: new Date().toISOString(),
      exit_page: currentPath,
      session_duration_seconds: sessionDuration,
    })
    .eq('session_id', sessionId);
  
  lastActivityTime = now;
};

// Track individual events
export const trackEvent = async (params: TrackEventParams) => {
  const sessionId = getSessionId();
  const userId = await getUserId();
  
  const event = {
    session_id: sessionId,
    user_id: userId,
    event_type: params.eventType,
    event_category: params.eventCategory,
    event_action: params.eventAction,
    event_label: params.eventLabel || null,
    page_url: window.location.href,
    page_path: window.location.pathname,
    referrer_url: document.referrer || null,
    element_id: params.elementId || null,
    element_text: params.elementText || null,
    element_class: params.elementClass || null,
    merchant_id: params.merchantId || null,
    carousel_id: params.carouselId || null,
    search_term: params.searchTerm || null,
    location_query: params.locationQuery || null,
    metadata: params.metadata || null,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    is_mobile: isMobileDevice(),
  };
  
  // Add to queue
  eventQueue.push(event);
  
  // Process queue if it has 5+ events or after 10 seconds
  if (eventQueue.length >= 5) {
    await flushEventQueue();
  } else {
    // Set timeout to flush queue
    setTimeout(flushEventQueue, 10000);
  }
  
  // Update session activity
  updateSessionActivity();
};

// Track page views
export const trackPageView = async (additionalParams?: Partial<TrackEventParams>) => {
  await trackEvent({
    eventType: 'page_view',
    eventCategory: 'page_view',
    eventAction: 'page_load',
    eventLabel: document.title,
    ...additionalParams,
  });
  
  // Increment page view count in session
  const sessionId = getSessionId();
  const { data: session } = await supabase
    .from('user_sessions')
    .select('page_views')
    .eq('session_id', sessionId)
    .single();
  
  if (session) {
    await supabase
      .from('user_sessions')
      .update({ page_views: (session.page_views || 0) + 1 })
      .eq('session_id', sessionId);
  }
};

// Track funnel steps
export const trackFunnelStep = async (params: FunnelStep) => {
  const sessionId = getSessionId();
  const userId = await getUserId();
  
  // Define step order
  const stepOrder: Record<FunnelStep['step'], number> = {
    homepage_view: 1,
    search_initiated: 2,
    results_viewed: 3,
    merchant_clicked: 4,
    profile_viewed: 5,
    contact_clicked: 6,
  };
  
  await supabase.from('funnel_events').insert({
    session_id: sessionId,
    user_id: userId,
    funnel_step: params.step,
    merchant_id: params.merchantId || null,
    step_order: stepOrder[params.step],
  });
};

// Flush event queue
export const flushEventQueue = async () => {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    await supabase.from('user_events').insert(eventsToSend);
    
    // Update total events count in session
    const sessionId = getSessionId();
    const { data: session } = await supabase
      .from('user_sessions')
      .select('total_events')
      .eq('session_id', sessionId)
      .single();
    
    if (session) {
      await supabase
        .from('user_sessions')
        .update({ total_events: (session.total_events || 0) + eventsToSend.length })
        .eq('session_id', sessionId);
    }
  } catch (error) {
    console.error('Error sending analytics events:', error);
    // Re-queue events if failed
    eventQueue = [...eventsToSend, ...eventQueue];
  }
};

// Track clicks with element details
export const trackClick = async (
  element: HTMLElement,
  category: TrackEventParams['eventCategory'],
  action: string,
  additionalParams?: Partial<TrackEventParams>
) => {
  await trackEvent({
    eventType: 'click',
    eventCategory: category,
    eventAction: action,
    elementId: element.id || undefined,
    elementText: element.textContent?.slice(0, 100) || undefined,
    elementClass: element.className || undefined,
    ...additionalParams,
  });
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  flushEventQueue();
  updateSessionActivity();
});

// Periodically update session (every 30 seconds)
setInterval(() => {
  if (lastActivityTime && Date.now() - lastActivityTime < 60000) {
    updateSessionActivity();
  }
}, 30000);
