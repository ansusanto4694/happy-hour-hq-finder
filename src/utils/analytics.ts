import { supabase } from '@/integrations/supabase/client';
import { detectBot } from './botDetection';

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Enable GA4 Debug Mode (shows events in GA4 DebugView)
export const enableGA4Debug = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-2CLJ0848WF', { debug_mode: true });
    console.log('[Analytics] GA4 Debug Mode enabled - check DebugView in GA4');
  }
};

// Verify GA4 is properly initialized
export const verifyGA4Setup = (): boolean => {
  const hasGtag = typeof window !== 'undefined' && typeof window.gtag === 'function';
  const hasDataLayer = typeof window !== 'undefined' && Array.isArray(window.dataLayer);
  
  console.log('[Analytics] GA4 Setup Check:', {
    gtag_available: hasGtag,
    dataLayer_available: hasDataLayer,
    dataLayer_length: hasDataLayer ? window.dataLayer?.length : 0,
  });
  
  return hasGtag && hasDataLayer;
};

// Clean up parameters to avoid sending undefined/null values to GA4
const cleanGA4Params = (params?: Record<string, any>): Record<string, any> => {
  if (!params) return {};
  
  const cleaned: Record<string, any> = {};
  Object.entries(params).forEach(([key, value]) => {
    // Only include defined, non-null values
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

// Session-level safeguards to prevent runaway tracking
const SESSION_EVENT_LIMIT = 500; // Max events per session before throttling
const SESSION_CRITICAL_LIMIT = 1000; // Critical limit - stop tracking entirely
let sessionEventCount = 0;
let sessionThrottled = false;
let sessionBlocked = false;

// Event deduplication cache - prevent duplicate events within short timeframes
const eventDeduplicationCache = new Map<string, number>();
const DEDUPLICATION_WINDOW = 1000; // 1 second window for deduplication

// Check if event is duplicate (same event within deduplication window)
const isDuplicateEvent = (eventKey: string): boolean => {
  const now = Date.now();
  const lastEventTime = eventDeduplicationCache.get(eventKey);
  
  if (lastEventTime && (now - lastEventTime) < DEDUPLICATION_WINDOW) {
    return true;
  }
  
  eventDeduplicationCache.set(eventKey, now);
  
  // Clean up old entries (older than 5 seconds)
  if (eventDeduplicationCache.size > 100) {
    const fiveSecondsAgo = now - 5000;
    for (const [key, time] of eventDeduplicationCache.entries()) {
      if (time < fiveSecondsAgo) {
        eventDeduplicationCache.delete(key);
      }
    }
  }
  
  return false;
};

// Initialize session event count from database by querying actual events
const initializeSessionEventCount = async () => {
  const sessionId = getSessionId();
  
  try {
    // Query actual event count from user_events table
    const { count, error } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    
    if (!error) {
      sessionEventCount = count || 0;
      
      // Check if session should be throttled or blocked
      if (sessionEventCount >= SESSION_CRITICAL_LIMIT) {
        sessionBlocked = true;
        console.warn('[Analytics] Session blocked due to excessive events:', sessionEventCount);
      } else if (sessionEventCount >= SESSION_EVENT_LIMIT) {
        sessionThrottled = true;
        console.warn('[Analytics] Session throttled due to high event count:', sessionEventCount);
      }
    }
  } catch (err) {
    console.error('[Analytics] Error initializing session event count:', err);
  }
};

// List of events that should be marked as conversions in GA4
const CONVERSION_EVENTS = [
  'contact_clicked',
  'search_submitted',
  'merchant_profile_viewed',
  'phone_clicked',
  'website_clicked',
  'directions_clicked',
];

// Helper to send events to GA4 with enhanced attribution
const sendToGA4 = (eventName: string, eventParams?: Record<string, any>) => {
  if (!verifyGA4Setup()) {
    console.warn('[Analytics] GA4 not available - gtag not found on window');
    return;
  }
  
  try {
    // Clean up parameters
    const cleanedParams = cleanGA4Params(eventParams);
    
    // Add enhanced attribution data automatically
    const utmParams = getUtmParameters();
    const referrerInfo = categorizeReferrer(document.referrer);
    
    // Enrich with traffic source data for better attribution
    const enrichedParams: Record<string, any> = {
      ...cleanedParams,
      // Traffic source attribution
      traffic_source: referrerInfo.traffic_source,
      traffic_medium: utmParams.utm_medium || referrerInfo.category || 'none',
      traffic_campaign: utmParams.utm_campaign || '(not set)',
      referrer_url: document.referrer || '(direct)',
      // UTM parameters for campaign tracking
      campaign_source: utmParams.utm_source,
      campaign_medium: utmParams.utm_medium,
      campaign_name: utmParams.utm_campaign,
      campaign_term: utmParams.utm_term,
      campaign_content: utmParams.utm_content,
      // Session context
      session_id: getSessionId(),
      device_category: getDeviceType(),
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      // Page context
      page_location: window.location.href,
      page_title: document.title,
    };
    
    // Mark as conversion if applicable and add conversion value
    if (CONVERSION_EVENTS.includes(eventName)) {
      enrichedParams.conversion = true;
      enrichedParams.value = 1; // Assign conversion value for GA4 reporting
    }
    
    // Send event to GA4
    window.gtag!('event', eventName, enrichedParams);
    
    console.log('[Analytics] GA4 event sent:', eventName, enrichedParams);
  } catch (error) {
    console.error('[Analytics] GA4 error:', error);
  }
};

export interface TrackEventParams {
  eventType: 'click' | 'page_view' | 'form_submit' | 'interaction' | 'hover' | 'impression' | 'focus' | 'input' | 'change' | 'error' | 'performance' | 'scroll' | 'conversion';
  eventCategory: 'navigation' | 'search' | 'carousel' | 'filter' | 'merchant_interaction' | 'authentication' | 'map_interaction' | 'page_view' | 'form' | 'web_vitals' | 'component_render' | 'resources' | 'error_recovery' | 'app_error' | 'location_landing' | 'mobile_filter_drawer' | 'restaurant_profile';
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
  funnelStep: 'homepage_view' | 'search_initiated' | 'results_viewed' | 'merchant_clicked' | 'profile_viewed' | 'contact_clicked' | 'auth_page_view' | 'signup_form_submitted' | 'signup_success' | 'signin_success';
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
  } else if (sessionStartTime === null) {
    // FIX: If session exists but sessionStartTime wasn't set (page refresh/revisit),
    // initialize it from session storage or use current time
    const storedStartTime = sessionStorage.getItem('analytics_session_start_time');
    sessionStartTime = storedStartTime ? parseInt(storedStartTime, 10) : Date.now();
  }
  
  return sessionId;
};

export const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Get or create anonymous user ID for persistent tracking across sessions
// CRITICAL: This MUST always return a valid ID for accurate visitor tracking
export const getAnonymousUserId = (): string => {
  try {
    let anonUserId = localStorage.getItem('analytics_anonymous_user_id');
    
    if (!anonUserId) {
      anonUserId = `anon_user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('analytics_anonymous_user_id', anonUserId);
      console.log('[Analytics] Created new anonymous user ID:', anonUserId);
    }
    
    return anonUserId;
  } catch (error) {
    console.error('[Analytics] Error accessing localStorage for anonymous user ID:', error);
    // Fallback: generate session-only ID if localStorage fails
    // Store in sessionStorage so at least it's consistent within the session
    try {
      let sessionAnonId = sessionStorage.getItem('analytics_anonymous_user_id_fallback');
      if (!sessionAnonId) {
        sessionAnonId = `anon_user_fallback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem('analytics_anonymous_user_id_fallback', sessionAnonId);
      }
      return sessionAnonId;
    } catch {
      // Last resort: generate ephemeral ID (won't persist)
      return `anon_user_temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
  }
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
  traffic_source: string;
} => {
  if (!referrer || referrer.trim() === '') {
    return { category: 'direct', platform: null, traffic_source: 'direct' };
  }

  try {
    const referrerUrl = new URL(referrer);
    const hostname = referrerUrl.hostname.toLowerCase();
    const currentHostname = window.location.hostname.toLowerCase();

    // Internal referral
    if (hostname === currentHostname || hostname.endsWith(`.${currentHostname}`)) {
      return { category: 'internal', platform: currentHostname, traffic_source: 'internal' };
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
        return { category: 'search_engine', platform: engine, traffic_source: 'organic' };
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
        return { category: 'social_media', platform, traffic_source: 'social' };
      }
    }

    // External referral
    return { category: 'referral', platform: hostname, traffic_source: 'referral' };
  } catch (error) {
    console.error('Error parsing referrer:', error);
    return { category: 'direct', platform: null, traffic_source: 'direct' };
  }
};

// Calculate engagement score based on session metrics
export const calculateEngagementScore = (
  pageViews: number,
  sessionDuration: number,
  totalEvents: number
): number => {
  // Engagement score: 0-100
  // - Page views: 10 points each (up to 50 points)
  // - Session duration: 1 point per 6 seconds (up to 30 points)
  // - High event count: bonus 20 points if > 5 events
  
  const pageScore = Math.min(50, pageViews * 10);
  const durationScore = Math.min(30, Math.floor(sessionDuration / 6));
  const eventBonus = totalEvents > 5 ? 20 : 0;
  
  return Math.min(100, Math.max(0, pageScore + durationScore + eventBonus));
};

// Determine if session is engaged
export const isEngagedSession = (
  pageViews: number,
  sessionDuration: number,
  isBounce: boolean,
  isBot: boolean
): boolean => {
  // Engaged session criteria:
  // - More than 1 page view OR session duration > 30 seconds
  // - Not a bounce
  // - Not a bot
  
  return (pageViews > 1 || sessionDuration > 30) && !isBounce && !isBot;
};

// Determine if session is a bounce
export const isBounceSession = (
  pageViews: number,
  sessionDuration: number
): boolean => {
  // Bounce criteria:
  // - 1 or fewer page views AND session duration < 10 seconds
  // OR no activity at all (0 duration and 0 page views)
  
  return (pageViews <= 1 && sessionDuration < 10) || (sessionDuration === 0 && pageViews === 0);
};

// Capture referrer immediately on page load (before React hydration clears it)
const capturedReferrer = typeof document !== 'undefined' ? document.referrer : '';

// Initialize or update session - throttled to run only once per page load
export const initializeSession = async (forceReinitialize: boolean = false) => {
  // Check if already initialized in this page session
  const sessionInitKey = 'analytics_session_initialized';
  if (!forceReinitialize && (sessionInitialized || sessionStorage.getItem(sessionInitKey) === 'true')) {
    return;
  }
  
  const sessionId = getSessionId();
  const userId = await getUserId();
  
  // CRITICAL: Always generate anonymous user ID FIRST before any other operations
  // This ensures 100% of sessions have it
  const anonymousUserId = getAnonymousUserId();
  
  // Verify we got a valid anonymous user ID
  if (!anonymousUserId || anonymousUserId === '') {
    console.error('[Analytics] CRITICAL: Failed to generate anonymous user ID!');
    return; // Don't proceed without anonymous ID
  }
  
  const deviceType = getDeviceType();
  const currentPath = window.location.pathname;
  // FIX: Use captured referrer from page load, not current document.referrer
  const referrer = capturedReferrer;
  const now = new Date().toISOString();
  const utmParams = getUtmParameters();
  const { category: referrerCategory, platform: referrerPlatform, traffic_source } = categorizeReferrer(referrer);
  
  // Detect if this is a bot
  const botDetection = detectBot();
  
  // Determine traffic source (prioritize UTM params over referrer)
  const finalTrafficSource = utmParams.utm_source ? 'campaign' : traffic_source;
  
  console.log('[Analytics] Initializing session with GUARANTEED anonymous_user_id:', {
    sessionId,
    anonymousUserId,
    referrer,
    referrerCategory,
    referrerPlatform,
    deviceType,
    utmParams
  });
  
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
    traffic_source: finalTrafficSource,
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
    is_engaged: false,
    engagement_score: 0,
    is_bounce: false,
  }, {
    onConflict: 'session_id',
    ignoreDuplicates: false // Update last_seen on conflict
  });
  
  if (error) {
    console.error('[Analytics] Error initializing session:', error);
    return; // Don't set flags on error, allow retry
  }
  
  // ONLY set flags after successful database insert
  sessionInitialized = true;
  sessionStorage.setItem(sessionInitKey, 'true');
  
  // FIX: Store session start time in sessionStorage for persistence across page refreshes
  sessionStartTime = Date.now();
  sessionStorage.setItem('analytics_session_start_time', sessionStartTime.toString());
  lastActivityTime = Date.now();
  
  // Initialize session event count for safeguards
  await initializeSessionEventCount();
  
  console.log('[Analytics] Session initialized successfully');
};

// Update session activity with engagement metrics
export const updateSessionActivity = async () => {
  const sessionId = getSessionId();
  const currentPath = window.location.pathname;
  
  const now = Date.now();
  // FIX: Ensure sessionStartTime is initialized (defensive coding)
  if (!sessionStartTime) {
    const storedStartTime = sessionStorage.getItem('analytics_session_start_time');
    sessionStartTime = storedStartTime ? parseInt(storedStartTime, 10) : now;
  }
  
  const sessionDuration = Math.floor((now - sessionStartTime) / 1000);
  
  // Get actual event counts from user_events table for accurate engagement metrics
  const { data: sessionData, error: sessionError } = await supabase
    .from('user_sessions')
    .select('is_bot')
    .eq('session_id', sessionId)
    .maybeSingle();
  
  if (sessionError) {
    console.error('[Analytics] Error fetching session data:', sessionError);
    return;
  }
  
  if (!sessionData) {
    console.warn('[Analytics] Session not found during activity update, will be created on next event flush');
    return;
  }
  
  // Query actual page view count from user_events
  const { count: actualPageViews, error: pageViewError } = await supabase
    .from('user_events')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('event_type', 'page_view');
  
  if (pageViewError) {
    console.error('[Analytics] Error counting page views:', pageViewError);
    return;
  }
  
  // Query actual total event count from user_events
  const { count: actualTotalEvents, error: totalEventsError } = await supabase
    .from('user_events')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);
  
  if (totalEventsError) {
    console.error('[Analytics] Error counting total events:', totalEventsError);
    return;
  }
  
  const pageViews = actualPageViews || 0;
  const totalEvents = actualTotalEvents || 0;
  const isBot = sessionData.is_bot || false;
  
  const isBounce = isBounceSession(pageViews, sessionDuration);
  const isEngaged = isEngagedSession(pageViews, sessionDuration, isBounce, isBot);
  const engagementScore = calculateEngagementScore(pageViews, sessionDuration, totalEvents);
  
  console.log('[Analytics] Updating session activity:', {
    sessionId,
    sessionDuration,
    currentPath,
    pageViews,
    isEngaged,
    engagementScore,
    isBounce
  });
  
  const { error: updateError } = await supabase
    .from('user_sessions')
    .update({
      last_seen: new Date().toISOString(),
      exit_page: currentPath,
      session_duration_seconds: sessionDuration,
      is_bounce: isBounce,
      is_engaged: isEngaged,
      engagement_score: engagementScore,
    })
    .eq('session_id', sessionId);
  
  if (updateError) {
    console.error('[Analytics] Error updating session activity:', updateError);
  }
  
  lastActivityTime = now;
};

// Track individual events with safeguards
export const trackEvent = async (params: TrackEventParams) => {
  // SAFEGUARD 1: Block tracking if session exceeded critical limit
  if (sessionBlocked) {
    console.warn('[Analytics] Event tracking blocked - session exceeded critical limit');
    return;
  }
  
  // SAFEGUARD 2: Deduplicate high-frequency events (hover, impression)
  const highFrequencyEvents = ['hover', 'impression', 'scroll'];
  const isHighFrequency = highFrequencyEvents.includes(params.eventType);
  
  if (isHighFrequency) {
    const eventKey = `${params.eventCategory}_${params.eventAction}_${params.merchantId || 'none'}`;
    
    if (isDuplicateEvent(eventKey)) {
      // Skip duplicate event
      return;
    }
    
    // SAFEGUARD 3: Additional throttling for hover/impression when session is already high
    if (sessionThrottled && Math.random() > 0.1) {
      // Only track 10% of hover/impression events when throttled
      return;
    }
  }
  
  // SAFEGUARD 4: Check if we should start throttling this session
  sessionEventCount++;
  if (sessionEventCount >= SESSION_CRITICAL_LIMIT) {
    sessionBlocked = true;
    console.error('[Analytics] Session BLOCKED - exceeded critical event limit:', sessionEventCount);
    return;
  } else if (sessionEventCount >= SESSION_EVENT_LIMIT && !sessionThrottled) {
    sessionThrottled = true;
    console.warn('[Analytics] Session THROTTLED - exceeded event limit:', sessionEventCount);
  }
  
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
  
  // Send to GA4 in parallel with custom analytics (unless throttled)
  if (!sessionThrottled || !isHighFrequency) {
    const ga4EventName = `${params.eventCategory}_${params.eventAction}`.replace(/\s+/g, '_');
    sendToGA4(ga4EventName, {
      event_category: params.eventCategory,
      event_label: params.eventLabel,
      event_value: params.eventValue,
      // Custom dimensions (configure these in GA4 Admin)
      merchant_id: params.merchantId,
      search_term: params.searchTerm,
      location_query: params.locationQuery,
      page_path: params.pagePath || window.location.pathname,
      user_id: params.userId || await getUserId(),
      device_type: getDeviceType(),
      is_mobile: isMobileDevice(),
    });
  }
  
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
  const utmParams = getUtmParameters();
  const referrerInfo = categorizeReferrer(document.referrer);
  
  // Send enhanced page view to GA4 with full attribution data
  sendToGA4('page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    // Custom dimensions
    merchant_id: additionalParams?.merchantId,
    search_term: additionalParams?.searchTerm,
    location_query: additionalParams?.locationQuery,
    device_type: getDeviceType(),
    user_id: additionalParams?.userId,
    // Enhanced attribution already added by sendToGA4, but we can include specific page-level data
    page_referrer: document.referrer,
    referrer_source: referrerInfo.platform,
    referrer_category: referrerInfo.category,
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
    auth_page_view: 1, // Auth funnel starts here
    signup_form_submitted: 2, // User submitted signup form
    signup_success: 3, // Signup completed successfully
    signin_success: 3, // Signin completed successfully (same level as signup)
  };
  
  await supabase.from('funnel_events').insert({
    session_id: sessionId,
    user_id: userId,
    funnel_step: params.funnelStep,
    merchant_id: params.merchantId || null,
    step_order: params.stepOrder || stepOrder[params.funnelStep],
  });
};

// Flush event queue - SIMPLIFIED: Just insert events, let backfill handle metrics
export const flushEventQueue = async () => {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    // Just insert the events - no counter updates to prevent drift
    const { error: eventInsertError } = await supabase
      .from('user_events')
      .insert(eventsToSend);
    
    if (eventInsertError) {
      console.error('[Analytics] Error inserting events:', eventInsertError);
      // Re-queue events on failure
      eventQueue = [...eventsToSend, ...eventQueue];
    } else {
      console.log(`[Analytics] Successfully flushed ${eventsToSend.length} events to database`);
    }
  } catch (error) {
    console.error('[Analytics] Error sending analytics events:', error);
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
  // Check if this is a conversion event
  const eventName = `${category}_${action}`.replace(/\s+/g, '_');
  const isConversion = CONVERSION_EVENTS.includes(eventName);
  
  await trackEvent({
    eventType: 'click',
    eventCategory: category,
    eventAction: action,
    ...additionalParams,
    metadata: {
      ...additionalParams?.metadata,
      is_conversion: isConversion,
    },
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
