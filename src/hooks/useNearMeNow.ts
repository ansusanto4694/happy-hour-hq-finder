import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NearMeMerchant {
  id: number;
  restaurant_name: string;
  slug: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  latitude: number;
  longitude: number;
}

export interface PouringNowItem {
  merchant: NearMeMerchant;
  distance_mi: number;
  happy_hour_start: string;
  happy_hour_end: string;
}

export interface NearMeEvent {
  id: number;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  image_url: string | null;
  category_tags: string[] | null;
  neighborhood: string | null;
  city: string | null;
  restaurant_id: number;
}

export interface StartingSoonItem {
  event: NearMeEvent;
  merchant: NearMeMerchant;
  distance_mi: number;
  starts_in_min: number;
}

export interface TonightItem {
  event: NearMeEvent;
  merchant: NearMeMerchant;
  distance_mi: number;
}

export interface NearMeNowResponse {
  pouring_now: PouringNowItem[];
  starting_soon: StartingSoonItem[];
  tonight: TonightItem[];
  radius_used: { now_soon: number; tonight: number };
  expanded: boolean;
  debug?: Record<string, unknown>;
}

interface Args {
  lat: number | null | undefined;
  lng: number | null | undefined;
  enabled?: boolean;
}

export function useNearMeNow({ lat, lng, enabled = true }: Args) {
  return useQuery<NearMeNowResponse>({
    queryKey: ['near-me-now', lat, lng],
    enabled: enabled && typeof lat === 'number' && typeof lng === 'number',
    staleTime: 60 * 1000, // 1 min
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('merchant-api', {
        body: { action: 'near_me_now', lat, lng },
      });
      if (error) throw error;
      const payload = (data?.data ?? data) as NearMeNowResponse;
      return {
        pouring_now: payload.pouring_now ?? [],
        starting_soon: payload.starting_soon ?? [],
        tonight: payload.tonight ?? [],
        radius_used: payload.radius_used ?? { now_soon: 1, tonight: 5 },
        expanded: !!payload.expanded,
        debug: payload.debug,
      };
    },
  });
}
