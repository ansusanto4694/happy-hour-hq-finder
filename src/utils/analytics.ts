import { supabase } from '@/integrations/supabase/client';
import { detectBot } from './botDetection';

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Helper to send events to GA4
const sendToGA4 = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

export interface TrackEventParams {
  eventType: 'click' | 'page_view' | 'form_submit' | 'interaction' | 'hover' | 'impression' | 'focus' | 'input' | 'change' | 'error' | 'performance';
  eventCategory: 'navigation' | 'search' | 'carousel' | 'filter' | 'merchant_interaction' | 'authentication' | 'map_interaction' | 'page_view' | 'form' | 'web_vitals' | 'component_render' | 'resources' | 'error_recovery' | 'app_error';
  eventAction: string;
  eventLabel?: string;
  eventValue?: number;
  merchantId?: number;
  carouselId?: string;
  searchTerm?: string;
  locationQuery?: string;
  pagePath?: string;
  userId?: string;
  errorMessage?: string;
  errorStack?: string;
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

// Throttle/Debounce cache
const throttleTimers = new Map<string, number>();
const debounceTimers = new Map<string, NodeJS.Timeout>();

// Metadata size limit (1KB)
const METADATA_SIZE_LIMIT = 1024;

// Utility: Throttle function calls
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  key: string,
  delay: number
): ((...args: Parameters<T>) => void) => {
  return (...args: Parameters<T>) => {
    const lastRun = throttleTimers.get(key);
    const now = Date.now();
    
    if (!lastRun || now - lastRun >= delay) {
      throttleTimers.set(key, now);
      fn(...args);
    }
  };
};

// Utility: Debounce function calls
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  key: string,
  delay: number
): ((...args: Parameters<T>) => void) => {
  return (...args: Parameters<T>) => {
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(() => {
      debounceTimers.delete(key);
      fn(...args);
    }, delay);
    
    debounceTimers.set(key, timer);
  };
};

// Utility: Sample events (return true if should track)
export const shouldSampleEvent = (sampleRate: number): boolean => {
  return Math.random() < sampleRate;
};

// Utility: Limit metadata size to prevent large payloads
export const limitMetadataSize = (metadata: Record<string, any> | null | undefined): Record<string, any> | null => {
  if (!metadata) return null;
  
  const jsonString = JSON.stringify(metadata);
  if (jsonString.length <= METADATA_SIZE_LIMIT) {
    return metadata;
  }
  
  // If too large, strip non-essential fields and truncate
  const essential = {
    ...metadata,
    _truncated: true,
    _originalSize: jsonString.length,
  };
  
  // Remove large arrays/objects
  Object.keys(essential).forEach(key => {
    const value = essential[key];
    if (Array.isArray(value) && value.length > 10) {
      essential[key] = `[Array(${value.length})]`;
    } else if (typeof value === 'object' && value !== null) {
      const stringified = JSON.stringify(value);
      if (stringified.length > 200) {
        essential[key] = '[Large Object]';
      }
    } else if (typeof value === 'string' && value.length > 200) {
      essential[key] = value.substring(0, 200) + '...';
    }
  });
  
  return essential;
};

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

// Get or create anonymous user ID for persistent tracking across sessions
export const getAnonymousUserId = (): string => {
  let anonUserId = localStorage.getItem('analytics_anonymous_user_id');
  
  if (!anonUserId) {
    anonUserId = `anon_user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('analytics_anonymous_user_id', anonUserId);
  }
  
  return anonUserId;
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

// Parse UTM parameters from URL
export const getUtmParameters = (): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
} => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
  };
};

// Categorize and parse referrer information
export const categorizeReferrer = (referrer: string): {
  category: string | null;
  platform: string | null;
} => {
  if (!referrer || referrer.trim() === '') {
    return { category: 'direct', platform: null };
  }

  try {
    const referrerUrl = new URL(referrer);
    const hostname = referrerUrl.hostname.toLowerCase();
    const currentHostname = window.location.hostname.toLowerCase();

    // Internal referral
    if (hostname === currentHostname || hostname.endsWith(`.${currentHostname}`)) {
      return { category: 'internal', platform: currentHostname };
    }

    // Search engines
    const searchEngines = {
      'google.com': 'google',
      'google.co.uk': 'google',
      'google.ca': 'google',
      'bing.com': 'bing',
      'yahoo.com': 'yahoo',
      'duckduckgo.com': 'duckduckgo',
      'baidu.com': 'baidu',
      'yandex.com': 'yandex',
      'ask.com': 'ask',
      'aol.com': 'aol',
      'ecosia.org': 'ecosia',
      'startpage.com': 'startpage',
    };

    for (const [domain, engine] of Object.entries(searchEngines)) {
      if (hostname.includes(domain)) {
        return { category: 'search_engine', platform: engine };
      }
    }

    // Social media platforms
    const socialPlatforms = {
      'facebook.com': 'facebook',
      'fb.com': 'facebook',
      'twitter.com': 'twitter',
      'x.com': 'twitter',
      't.co': 'twitter',
      'instagram.com': 'instagram',
      'linkedin.com': 'linkedin',
      'reddit.com': 'reddit',
      'pinterest.com': 'pinterest',
      'tiktok.com': 'tiktok',
      'youtube.com': 'youtube',
      'snapchat.com': 'snapchat',
      'tumblr.com': 'tumblr',
      'whatsapp.com': 'whatsapp',
      'telegram.org': 'telegram',
      'discord.com': 'discord',
      'threads.net': 'threads',
    };

    for (const [domain, platform] of Object.entries(socialPlatforms)) {
      if (hostname.includes(domain)) {
        return { category: 'social_media', platform };
      }
    }

    // External referral
    return { category: 'referral', platform: hostname };
  } catch (error) {
    console.error('Error parsing referrer:', error);
    return { category: 'direct', platform: null };
  }
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
  const anonymousUserId = getAnonymousUserId();
  const deviceType = getDeviceType();
  const currentPath = window.location.pathname;
  const referrer = document.referrer;
  const now = new Date().toISOString();
  const utmParams = getUtmParameters();
  const { category: referrerCategory, platform: referrerPlatform } = categorizeReferrer(referrer);
  
  // Detect if this is a bot
  const botDetection = detectBot();
  
  // Use upsert with ON CONFLICT DO UPDATE to handle race conditions
  // This prevents duplicate key errors when multiple tabs/requests initialize simultaneously
  const { error } = await supabase.from('user_sessions').upsert({
    session_id: sessionId,
    user_id: userId,
    anonymous_user_id: anonymousUserId,
    entry_page: currentPath,
    referrer_source: referrer || null,
    referrer_category: referrerCategory,
    referrer_platform: referrerPlatform,
    device_type: deviceType,
    user_agent: navigator.userAgent,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    first_seen: now,
    last_seen: now,
    utm_source: utmParams.utm_source,
    utm_medium: utmParams.utm_medium,
    utm_campaign: utmParams.utm_campaign,
    utm_content: utmParams.utm_content,
    utm_term: utmParams.utm_term,
    is_bot: botDetection.isBot,
    bot_type: botDetection.botType,
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
  const anonymousUserId = getAnonymousUserId();
  
  const event = {
    session_id: sessionId,
    user_id: userId,
    anonymous_user_id: anonymousUserId,
    event_type: params.eventType,
    event_category: params.eventCategory,
    event_action: params.eventAction,
    event_label: params.eventLabel || null,
    page_path: params.pagePath || window.location.pathname,
    merchant_id: params.merchantId || null,
    carousel_id: params.carouselId || null,
    search_term: params.searchTerm || null,
    location_query: params.locationQuery || null,
    metadata: limitMetadataSize(params.metadata),
    is_mobile: isMobileDevice(),
  };
  
  // Send to GA4 in parallel with custom analytics
  const ga4EventName = `${params.eventCategory}_${params.eventAction}`.replace(/\s+/g, '_');
  sendToGA4(ga4EventName, {
    event_category: params.eventCategory,
    event_label: params.eventLabel,
    event_value: params.eventValue,
    merchant_id: params.merchantId,
    search_term: params.searchTerm,
    location_query: params.locationQuery,
  });
  
  // Add to queue
  eventQueue.push(event);
  
  // Mobile: flush more aggressively (20 events or 15s) to ensure data capture
  // Desktop: flush at 50 events or 45s for performance
  const batchSize = isMobileDevice() ? 20 : 50;
  const batchTimeout = isMobileDevice() ? 15000 : 45000;
  
  if (eventQueue.length >= batchSize) {
    await flushEventQueue();
  } else if (eventQueue.length === 1) {
    // Only set timeout when first event is added to avoid multiple timers
    setTimeout(flushEventQueue, batchTimeout);
  }
  
  // Session activity is updated by the 60-second interval at the bottom of this file
  // No need to update on every event to avoid excessive database requests
};

// Track page views - fully non-blocking, batched with event queue
export const trackPageView = async (additionalParams?: Partial<TrackEventParams>) => {
  // Send page view to GA4
  sendToGA4('page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
  
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

// Helper to flush and update session (used by multiple event listeners)
const flushAndUpdateSession = async () => {
  const sessionId = getSessionId();
  const currentPath = window.location.pathname;
  const now = Date.now();
  const sessionDuration = sessionStartTime ? Math.floor((now - sessionStartTime) / 1000) : 0;
  
  // Flush events first
  if (eventQueue.length > 0) {
    await flushEventQueue();
  }
  
  // Update session with current state
  await supabase
    .from('user_sessions')
    .update({
      last_seen: new Date().toISOString(),
      exit_page: currentPath,
      session_duration_seconds: sessionDuration,
    })
    .eq('session_id', sessionId);
};

// Mobile-friendly cleanup: Use Page Visibility API + pagehide (more reliable than beforeunload on mobile)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // User switched tabs or minimized browser - flush immediately
    flushAndUpdateSession();
  } else {
    // User returned - update last activity
    lastActivityTime = Date.now();
  }
});

// pagehide is more reliable on mobile browsers (especially iOS Safari)
window.addEventListener('pagehide', () => {
  flushAndUpdateSession();
});

// Keep beforeunload for desktop browsers
window.addEventListener('beforeunload', () => {
  flushAndUpdateSession();
});

// Periodically update session - more frequent on mobile (30s mobile, 60s desktop)
const updateInterval = isMobileDevice() ? 30000 : 60000;
setInterval(() => {
  const inactivityThreshold = isMobileDevice() ? 60000 : 120000; // 1 min mobile, 2 min desktop
  if (lastActivityTime && Date.now() - lastActivityTime < inactivityThreshold) {
    updateSessionActivity();
  }
}, updateInterval);

// Track user interactions to update lastActivityTime (for mobile engagement tracking)
const trackActivity = () => {
  lastActivityTime = Date.now();
};

// Mobile-specific: Track touches and scrolls to detect engagement
if (isMobileDevice()) {
  window.addEventListener('touchstart', trackActivity, { passive: true });
  window.addEventListener('scroll', trackActivity, { passive: true });
} else {
  window.addEventListener('mousemove', trackActivity, { passive: true });
  window.addEventListener('click', trackActivity, { passive: true });
}
