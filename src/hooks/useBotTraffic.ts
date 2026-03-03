import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BotTrafficData {
  totalSessions: number;
  humanSessions: number;
  botSessions: number;
  botPercentage: number;
  botBreakdown: Record<string, number>;
  humanVisitors: number;
  humanPageViews: number;
  humanBounceRate: number;
  humanAvgDuration: number;
}

interface UseBotTrafficOptions {
  startDate?: string;
  endDate?: string;
}

export const useBotTraffic = ({ startDate, endDate }: UseBotTrafficOptions = {}) => {
  return useQuery({
    queryKey: ['bot-traffic', startDate, endDate],
    queryFn: async (): Promise<BotTrafficData> => {
      let sessionQuery = supabase
        .from('user_sessions')
        .select('is_bot, bot_type, anonymous_user_id, session_id, session_duration_seconds, is_bounce');

      if (startDate) sessionQuery = sessionQuery.gte('created_at', startDate);
      if (endDate) sessionQuery = sessionQuery.lte('created_at', endDate);

      const { data: sessions, error } = await sessionQuery;
      if (error) throw error;

      const all = sessions || [];
      const bots = all.filter(s => s.is_bot);
      const humans = all.filter(s => !s.is_bot);

      // Bot breakdown by type
      const botBreakdown: Record<string, number> = {};
      bots.forEach(s => {
        const type = s.bot_type || 'unknown';
        botBreakdown[type] = (botBreakdown[type] || 0) + 1;
      });

      // Human metrics
      const humanVisitorSet = new Set(humans.map(s => s.anonymous_user_id || s.session_id));
      const totalDuration = humans.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0);
      const bounces = humans.filter(s => s.is_bounce).length;

      // Page views (human only)
      let eventsQuery = supabase
        .from('user_events')
        .select('session_id', { count: 'exact' })
        .eq('event_type', 'page_view');

      if (startDate) eventsQuery = eventsQuery.gte('created_at', startDate);
      if (endDate) eventsQuery = eventsQuery.lte('created_at', endDate);

      const botSessionIds = new Set(bots.map(s => s.session_id));
      const { count: totalPageViews } = await eventsQuery;

      // We can't filter by NOT IN via supabase client easily, so estimate
      // by ratio of human sessions to total
      const humanRatio = all.length > 0 ? humans.length / all.length : 1;
      const estimatedHumanPageViews = Math.round((totalPageViews || 0) * humanRatio);

      return {
        totalSessions: all.length,
        humanSessions: humans.length,
        botSessions: bots.length,
        botPercentage: all.length > 0 ? parseFloat(((bots.length / all.length) * 100).toFixed(1)) : 0,
        botBreakdown,
        humanVisitors: humanVisitorSet.size,
        humanPageViews: estimatedHumanPageViews,
        humanBounceRate: humans.length > 0 ? parseFloat(((bounces / humans.length) * 100).toFixed(1)) : 0,
        humanAvgDuration: humans.length > 0 ? Math.round(totalDuration / humans.length) : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
