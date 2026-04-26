import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type LocationSource = 'gps' | 'manual' | 'ip';
export type LocationStatus =
  | 'idle'
  | 'asking'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'manual'
  | 'ip-fallback'
  | 'error';

export interface NearMeLocation {
  lat: number;
  lng: number;
  label: string;
  source: LocationSource;
  /** ms epoch when this was resolved */
  resolvedAt: number;
  /** Optional accuracy from GPS in meters */
  accuracyMeters?: number;
}

interface PersistedLocation extends NearMeLocation {
  version: 1;
}

const STORAGE_KEY = 'sip:near-me-location:v1';
const PROMPT_DISMISSED_KEY = 'sip:near-me-prompt-dismissed:v1';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function readPersisted(): NearMeLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedLocation;
    if (parsed?.version !== 1) return null;
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null;
    if (Date.now() - parsed.resolvedAt > MAX_AGE_MS) return null;
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      label: parsed.label,
      source: parsed.source,
      resolvedAt: parsed.resolvedAt,
      accuracyMeters: parsed.accuracyMeters,
    };
  } catch {
    return null;
  }
}

function writePersisted(loc: NearMeLocation) {
  try {
    const payload: PersistedLocation = { version: 1, ...loc };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / privacy errors */
  }
}

function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function reverseGeocodeLabel(lat: number, lng: number): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('reverse-geocode', {
      body: { latitude: lat, longitude: lng },
    });
    if (error) throw error;
    const neighborhood = data?.neighborhood as string | null | undefined;
    const city = data?.city as string | undefined;
    const region = data?.region as string | undefined;
    if (neighborhood && city) return `${neighborhood}, ${city}`;
    if (city && region) return `${city}, ${region}`;
    if (city) return city;
    return 'Current location';
  } catch {
    return 'Current location';
  }
}

interface UseNearMeLocationReturn {
  location: NearMeLocation | null;
  status: LocationStatus;
  error: string | null;
  /** True while any resolution is in progress */
  isResolving: boolean;
  /** True if user has previously dismissed the inline prompt */
  promptDismissed: boolean;

  /** Trigger the GPS prompt (shows browser permission dialog if not yet granted) */
  requestGps: () => Promise<void>;
  /** Set a manually-chosen location (typically from a typeahead suggestion) */
  setManual: (input: { lat: number; lng: number; label: string }) => void;
  /** Resolve from IP geolocation (no permission needed) */
  useIpFallback: () => Promise<void>;
  /** Clear stored location entirely */
  clear: () => void;
  /** Mark the inline prompt as dismissed (persists) */
  dismissPrompt: () => void;
}

/**
 * Resolution chain: persisted → (caller decides) GPS → manual → IP fallback.
 * The hook does NOT auto-trigger anything on mount beyond reading localStorage,
 * so the UI controls the permission prompt timing (avoids surprise prompts).
 */
export function useNearMeLocation(): UseNearMeLocationReturn {
  const [location, setLocation] = useState<NearMeLocation | null>(() => readPersisted());
  const [status, setStatus] = useState<LocationStatus>(() => (readPersisted() ? 'granted' : 'idle'));
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PROMPT_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSet = useCallback((loc: NearMeLocation) => {
    if (!mountedRef.current) return;
    setLocation(loc);
    writePersisted(loc);
  }, []);

  const requestGps = useCallback(async () => {
    setError(null);
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      setError('Geolocation not supported');
      return;
    }
    setStatus('asking');
    setIsResolving(true);

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          // Optimistic label, refined async
          const optimistic: NearMeLocation = {
            lat,
            lng,
            label: 'Current location',
            source: 'gps',
            resolvedAt: Date.now(),
            accuracyMeters: position.coords.accuracy,
          };
          safeSet(optimistic);
          if (mountedRef.current) {
            setStatus('granted');
            setIsResolving(false);
          }
          const label = await reverseGeocodeLabel(lat, lng);
          if (mountedRef.current) {
            safeSet({ ...optimistic, label });
          }
          resolve();
        },
        (err) => {
          if (!mountedRef.current) return resolve();
          if (err.code === err.PERMISSION_DENIED) {
            setStatus('denied');
            setError('Location permission denied');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setStatus('unavailable');
            setError('Position unavailable');
          } else {
            setStatus('error');
            setError(err.message || 'Geolocation error');
          }
          setIsResolving(false);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 },
      );
    });
  }, [safeSet]);

  const setManual = useCallback(
    ({ lat, lng, label }: { lat: number; lng: number; label: string }) => {
      const loc: NearMeLocation = {
        lat,
        lng,
        label,
        source: 'manual',
        resolvedAt: Date.now(),
      };
      safeSet(loc);
      setStatus('manual');
      setError(null);
    },
    [safeSet],
  );

  const useIpFallback = useCallback(async () => {
    setError(null);
    setIsResolving(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ip-geolocate', {
        body: {},
      });
      if (invokeError) throw invokeError;
      const lat = typeof data?.latitude === 'number' ? data.latitude : null;
      const lng = typeof data?.longitude === 'number' ? data.longitude : null;
      if (lat == null || lng == null) {
        throw new Error('IP geolocation returned no coordinates');
      }
      const city = (data?.city as string) || '';
      const region = (data?.region as string) || '';
      const label = city && region ? `${city}, ${region}` : city || 'Approximate location';
      const loc: NearMeLocation = {
        lat,
        lng,
        label,
        source: 'ip',
        resolvedAt: Date.now(),
      };
      safeSet(loc);
      if (mountedRef.current) setStatus('ip-fallback');
    } catch (e) {
      if (!mountedRef.current) return;
      setStatus('error');
      setError(e instanceof Error ? e.message : 'IP fallback failed');
    } finally {
      if (mountedRef.current) setIsResolving(false);
    }
  }, [safeSet]);

  const clear = useCallback(() => {
    clearPersisted();
    setLocation(null);
    setStatus('idle');
    setError(null);
  }, []);

  const dismissPrompt = useCallback(() => {
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
    setPromptDismissed(true);
  }, []);

  return {
    location,
    status,
    error,
    isResolving,
    promptDismissed,
    requestGps,
    setManual,
    useIpFallback,
    clear,
    dismissPrompt,
  };
}
