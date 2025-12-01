import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrafficOverviewData {
  date: string;
  uniqueVisitors: number;
  totalSessions: number;
  pageViews: number;
}

interface UseTrafficOverviewOptions {
  startDate?: string;
  endDate?: string;
}

export const useTrafficOverview = ({ startDate, endDate }: UseTrafficOverviewOptions = {}) => {
  return useQuery({
    queryKey: ['traffic-overview', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('user_sessions')
        .select('created_at, anonymous_user_id, session_id, page_views, is_bot');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by date and calculate metrics
      const groupedByDate = (data || [])
        .filter(session => !session.is_bot)
        .reduce((acc, session) => {
          const date = new Date(session.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = {
              date,
              uniqueVisitors: new Set<string>(),
              totalSessions: 0,
              pageViews: 0,
            };
          }
          
          // Count unique visitors (prefer anonymous_user_id, fallback to session_id)
          const visitorId = session.anonymous_user_id || session.session_id;
          acc[date].uniqueVisitors.add(visitorId);
          acc[date].totalSessions++;
          acc[date].pageViews += session.page_views || 0;
          
          return acc;
        }, {} as Record<string, { date: string; uniqueVisitors: Set<string>; totalSessions: number; pageViews: number }>);

      // Convert to array and format
      const result: TrafficOverviewData[] = Object.values(groupedByDate)
        .map(item => ({
          date: item.date,
          uniqueVisitors: item.uniqueVisitors.size,
          totalSessions: item.totalSessions,
          pageViews: item.pageViews,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
