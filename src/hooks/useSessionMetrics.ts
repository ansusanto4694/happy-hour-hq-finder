import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SessionMetrics {
  avgSessionDuration: number;
  bounceRate: number;
  engagementRate: number;
  avgPageViews: number;
  totalSessions: number;
}

interface UseSessionMetricsOptions {
  startDate?: string;
  endDate?: string;
}

export const useSessionMetrics = ({ startDate, endDate }: UseSessionMetricsOptions = {}) => {
  return useQuery({
    queryKey: ['session-metrics', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('user_sessions')
        .select('session_duration_seconds, is_bounce, is_engaged, is_bot');

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

      if (totalSessions === 0) {
        return {
          avgSessionDuration: 0,
          bounceRate: 0,
          engagementRate: 0,
          avgPageViews: 0,
          totalSessions: 0,
        };
      }

      const totalDuration = sessions.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0);
      const bounces = sessions.filter(s => s.is_bounce).length;
      const engaged = sessions.filter(s => s.is_engaged).length;

      // Query actual page views from user_events for accuracy
      let eventsQuery = supabase
        .from('user_events')
        .select('session_id', { count: 'exact' })
        .eq('event_type', 'page_view');

      if (startDate) {
        eventsQuery = eventsQuery.gte('created_at', startDate);
      }
      if (endDate) {
        eventsQuery = eventsQuery.lte('created_at', endDate);
      }

      const { count: totalPageViews } = await eventsQuery;
      const pageViewCount = totalPageViews || 0;

      const result: SessionMetrics = {
        avgSessionDuration: Math.round(totalDuration / totalSessions),
        bounceRate: parseFloat(((bounces / totalSessions) * 100).toFixed(1)),
        engagementRate: parseFloat(((engaged / totalSessions) * 100).toFixed(1)),
        avgPageViews: parseFloat((pageViewCount / totalSessions).toFixed(1)),
        totalSessions,
      };

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
