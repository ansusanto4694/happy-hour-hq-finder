import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeviceBreakdown {
  device: string;
  sessions: number;
  percentage: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface UseDeviceBreakdownOptions {
  startDate?: string;
  endDate?: string;
}

export const useDeviceBreakdown = ({ startDate, endDate }: UseDeviceBreakdownOptions = {}) => {
  return useQuery({
    queryKey: ['device-breakdown', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('user_sessions')
        .select('device_type, session_duration_seconds, is_bounce, is_bot');

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

      // Group by device type
      const deviceGroups = sessions.reduce((acc, session) => {
        const device = session.device_type || 'unknown';
        if (!acc[device]) {
          acc[device] = {
            sessions: [],
            bounces: 0,
          };
        }
        acc[device].sessions.push(session);
        if (session.is_bounce) {
          acc[device].bounces++;
        }
        return acc;
      }, {} as Record<string, { sessions: typeof sessions; bounces: number }>);

      // Convert to array and calculate metrics
      const result: DeviceBreakdown[] = Object.entries(deviceGroups)
        .map(([device, data]) => {
          const sessionCount = data.sessions.length;
          const totalDuration = data.sessions.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0);
          
          return {
            device: device.charAt(0).toUpperCase() + device.slice(1),
            sessions: sessionCount,
            percentage: parseFloat(((sessionCount / totalSessions) * 100).toFixed(1)),
            avgSessionDuration: Math.round(totalDuration / sessionCount),
            bounceRate: parseFloat(((data.bounces / sessionCount) * 100).toFixed(1)),
          };
        })
        .sort((a, b) => b.sessions - a.sessions);

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
