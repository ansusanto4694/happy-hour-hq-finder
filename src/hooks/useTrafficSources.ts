import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
}

interface UseTrafficSourcesOptions {
  startDate?: string;
  endDate?: string;
}

export const useTrafficSources = ({ startDate, endDate }: UseTrafficSourcesOptions = {}) => {
  return useQuery({
    queryKey: ['traffic-sources', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('user_sessions')
        .select('traffic_source, is_bot');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const sessions = (data || []).filter(session => !session.is_bot);
      const totalSessions = sessions.length;

      // Group by traffic source
      const sourceGroups = sessions.reduce((acc, session) => {
        const source = session.traffic_source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convert to array and calculate percentages
      const result: TrafficSource[] = Object.entries(sourceGroups)
        .map(([source, sessions]) => ({
          source: source.charAt(0).toUpperCase() + source.slice(1),
          sessions,
          percentage: parseFloat(((sessions / totalSessions) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.sessions - a.sessions);

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
