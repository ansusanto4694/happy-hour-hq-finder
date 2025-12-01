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
      // Query sessions for unique visitors and session count
      let sessionQuery = supabase
        .from('user_sessions')
        .select('created_at, anonymous_user_id, session_id, is_bot');

      if (startDate) {
        sessionQuery = sessionQuery.gte('created_at', startDate);
      }
      if (endDate) {
        sessionQuery = sessionQuery.lte('created_at', endDate);
      }

      // Query user_events for accurate page view counts
      let eventsQuery = supabase
        .from('user_events')
        .select('created_at, session_id, event_type');

      if (startDate) {
        eventsQuery = eventsQuery.gte('created_at', startDate);
      }
      if (endDate) {
        eventsQuery = eventsQuery.lte('created_at', endDate);
      }

      const [sessionsResult, eventsResult] = await Promise.all([
        sessionQuery,
        eventsQuery
      ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const sessions = sessionsResult.data || [];
      const events = eventsResult.data || [];

      // Filter out bot sessions
      const validSessions = sessions.filter(session => !session.is_bot);
      const botSessionIds = new Set(sessions.filter(s => s.is_bot).map(s => s.session_id));
      
      // Count page views from events (excluding bot sessions)
      const pageViewsByDate = events
        .filter(e => e.event_type === 'page_view' && !botSessionIds.has(e.session_id))
        .reduce((acc, event) => {
          const date = new Date(event.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Group sessions by date for visitor and session counts
      const groupedByDate = validSessions.reduce((acc, session) => {
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
        
        return acc;
      }, {} as Record<string, { date: string; uniqueVisitors: Set<string>; totalSessions: number; pageViews: number }>);

      // Merge page view counts from events
      Object.keys(pageViewsByDate).forEach(date => {
        if (groupedByDate[date]) {
          groupedByDate[date].pageViews = pageViewsByDate[date];
        } else {
          // Handle case where we have events but no session (orphaned events)
          groupedByDate[date] = {
            date,
            uniqueVisitors: new Set<string>(),
            totalSessions: 0,
            pageViews: pageViewsByDate[date]
          };
        }
      });

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
