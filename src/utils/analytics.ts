import { supabase } from '@/integrations/supabase/client';

export interface TrackEventParams {
  eventType: 'click' | 'page_view' | 'form_submit' | 'interaction' | 'hover' | 'impression' | 'focus' | 'input' | 'change' | 'error';
  eventCategory: 'navigation' | 'search' | 'carousel' | 'filter' | 'merchant_interaction' | 'authentication' | 'map_interaction' | 'page_view' | 'form';
  eventAction: string;
  eventLabel?: string;
  merchantId?: number;
  carouselId?: string;
  searchTerm?: string;
  locationQuery?: string;
  pagePath?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface FunnelStep {
  funnelStep: 'homepage_view' | 'search_initiated' | 'results_viewed' | 'merchant_clicked' | 'profile_viewed' | 'contact_clicked';
  merchantId?: number;
  stepOrder?: number;
}

let eventQueue: any[] = [];
let sessionStartTime: number | null = null;
let lastActivityTime: number | null = null;
let sessionInitialized = false;

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

// Initialize or update session - throttled to run only once per page load
export const initializeSession = async () => {
  // Check if already initialized in this page session
  const sessionInitKey = 'analytics_session_initialized';
  if (sessionInitialized || sessionStorage.getItem(sessionInitKey) === 'true') {
    return;
  }
  
  sessionInitialized = true;
  sessionStorage.setItem(sessionInitKey, 'true');
  
  const sessionId = getSessionId();
  const userId = await getUserId();
  const deviceType = getDeviceType();
  const currentPath = window.location.pathname;
  const referrer = document.referrer;
  const now = new Date().toISOString();
  
  // Use upsert with ON CONFLICT DO UPDATE to handle race conditions
  // This prevents duplicate key errors when multiple tabs/requests initialize simultaneously
  const { error } = await supabase.from('user_sessions').upsert({
    session_id: sessionId,
    user_id: userId,
    entry_page: currentPath,
    referrer_source: referrer || null,
    device_type: deviceType,
    user_agent: navigator.userAgent,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    first_seen: now,
    last_seen: now,
  }, {
    onConflict: 'session_id',
    ignoreDuplicates: false // Update last_seen on conflict
  });
  
  if (error) {
    console.error('Error initializing session:', error);
  }
  
  sessionStartTime = Date.now();
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
    page_path: params.pagePath || window.location.pathname,
    merchant_id: params.merchantId || null,
    carousel_id: params.carouselId || null,
    search_term: params.searchTerm || null,
    location_query: params.locationQuery || null,
    metadata: params.metadata || null,
    is_mobile: isMobileDevice(),
  };
  
  // Add to queue
  eventQueue.push(event);
  
  // Process queue if it has 50+ events or after 45 seconds (optimized batching)
  if (eventQueue.length >= 50) {
    await flushEventQueue();
  } else if (eventQueue.length === 1) {
    // Only set timeout when first event is added to avoid multiple timers
    setTimeout(flushEventQueue, 45000);
  }
  
  // Session activity is updated by the 60-second interval at the bottom of this file
  // No need to update on every event to avoid excessive database requests
};

// Track page views - fully non-blocking, batched with event queue
export const trackPageView = async (additionalParams?: Partial<TrackEventParams>) => {
  // Track the event (queued, non-blocking) - page views will be counted from events
  trackEvent({
    eventType: 'page_view',
    eventCategory: 'page_view',
    eventAction: 'page_load',
    eventLabel: document.title,
    ...additionalParams,
  });
  
  // Page view count will be updated during periodic session updates
  // No immediate database calls to avoid blocking navigation
};

// Track funnel steps
export const trackFunnelStep = async (params: FunnelStep) => {
  const sessionId = getSessionId();
  const userId = await getUserId();
  
  // Define step order
  const stepOrder: Record<FunnelStep['funnelStep'], number> = {
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
    funnel_step: params.funnelStep,
    merchant_id: params.merchantId || null,
    step_order: params.stepOrder || stepOrder[params.funnelStep],
  });
};

// Flush event queue - optimized with combined session update
export const flushEventQueue = async () => {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    const sessionId = getSessionId();
    
    // Count page views in this batch
    const pageViewCount = eventsToSend.filter(e => e.event_type === 'page_view').length;
    
    // Insert events and update session in parallel
    const [_, sessionData] = await Promise.all([
      supabase.from('user_events').insert(eventsToSend),
      supabase
        .from('user_sessions')
        .select('total_events, page_views')
        .eq('session_id', sessionId)
        .single()
    ]);
    
    // Update session counts if we got the data
    if (sessionData.data) {
      const updates: any = {
        total_events: (sessionData.data.total_events || 0) + eventsToSend.length
      };
      
      if (pageViewCount > 0) {
        updates.page_views = (sessionData.data.page_views || 0) + pageViewCount;
      }
      
      await supabase
        .from('user_sessions')
        .update(updates)
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
    ...additionalParams,
  });
};

// Cleanup on page unload - flush events and update session together
window.addEventListener('beforeunload', () => {
  const sessionId = getSessionId();
  const currentPath = window.location.pathname;
  const now = Date.now();
  const sessionDuration = sessionStartTime ? Math.floor((now - sessionStartTime) / 1000) : 0;
  
  // Flush events first
  if (eventQueue.length > 0) {
    flushEventQueue();
  }
  
  // Then update session
  supabase
    .from('user_sessions')
    .update({
      last_seen: new Date().toISOString(),
      exit_page: currentPath,
      session_duration_seconds: sessionDuration,
    })
    .eq('session_id', sessionId);
});

// Periodically update session (every 60 seconds)
setInterval(() => {
  if (lastActivityTime && Date.now() - lastActivityTime < 120000) {
    updateSessionActivity();
  }
}, 60000);
