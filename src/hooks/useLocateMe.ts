import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LocateResult {
  display: string;
  latitude: number | null;
  longitude: number | null;
  method: 'gps' | 'ip';
}

export function useLocateMe() {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60_000,
    });
  });

  const reverseGeocode = async (lat: number, lng: number) => {
    const { data, error } = await supabase.functions.invoke('reverse-geocode', {
      body: { latitude: lat, longitude: lng },
    });
    if (error) throw error;
    const city = data?.city || '';
    const region = data?.region || '';
    const place = data?.place_name || '';
    const postal = data?.postal_code || '';
    const display = city && region ? `${city}, ${region}${postal ? ` ${postal}` : ''}` : (place || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    return { display, latitude: lat, longitude: lng };
  };

  const ipGeolocate = async () => {
    const { data, error } = await supabase.functions.invoke('ip-geolocate', {});
    if (error) throw error;
    const city = data?.city || '';
    const region = data?.region || '';
    const lat = typeof data?.latitude === 'number' ? data.latitude : null;
    const lng = typeof data?.longitude === 'number' ? data.longitude : null;
    const display = city && region ? `${city}, ${region}` : (city || region || 'Current location');
    return { display, latitude: lat, longitude: lng };
  };

  const locate = async (): Promise<LocateResult | null> => {
    setIsLocating(true);
    try {
      try {
        const pos = await getPosition();
        const r = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        toast({ title: 'Location detected', description: r.display });
        return { ...r, method: 'gps' };
      } catch (gpsError) {
        // Fallback to IP-based geolocation
        const r = await ipGeolocate();
        toast({ title: 'Using approximate location', description: r.display });
        return { ...r, method: 'ip' };
      }
    } catch (e) {
      console.error('locate me failed:', e);
      toast({ title: 'Could not determine your location', description: 'Please enter a city or ZIP manually.' });
      return null;
    } finally {
      setIsLocating(false);
    }
  };

  return { locate, isLocating };
}
