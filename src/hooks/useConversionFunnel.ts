import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FunnelStep {
  step: string;
  stepOrder: number;
  count: number;
  uniqueSessions: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface ConversionFunnelData {
  steps: FunnelStep[];
  totalSessions: number;
  overallConversionRate: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface UseConversionFunnelOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export const useConversionFunnel = (options: UseConversionFunnelOptions = {}) => {
  const {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days ago
    endDate = new Date().toISOString(),
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['conversion-funnel', startDate, endDate],
    queryFn: async (): Promise<ConversionFunnelData> => {
      // Define the funnel steps in order
      const funnelSteps = [
        { step: 'homepage_view', order: 1, label: 'Homepage View' },
        { step: 'search_initiated', order: 2, label: 'Search Initiated' },
        { step: 'results_viewed', order: 3, label: 'Results Viewed' },
        { step: 'merchant_clicked', order: 4, label: 'Restaurant Clicked' },
        { step: 'profile_viewed', order: 5, label: 'Profile Viewed' },
        { step: 'contact_clicked', order: 6, label: 'Contact Action Taken' }
      ];

      // Query funnel events grouped by step
      const { data: funnelData, error } = await supabase
        .from('funnel_events')
        .select('funnel_step, session_id, step_order')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        console.error('Error fetching funnel data:', error);
        throw error;
      }

      // Calculate metrics for each step
      const stepMetrics = new Map<string, { count: number; sessions: Set<string> }>();
      
      funnelData?.forEach(event => {
        if (!stepMetrics.has(event.funnel_step)) {
          stepMetrics.set(event.funnel_step, { count: 0, sessions: new Set() });
        }
        const metrics = stepMetrics.get(event.funnel_step)!;
        metrics.count++;
        metrics.sessions.add(event.session_id);
      });

      // Get total unique sessions that entered the funnel
      const allSessions = new Set<string>();
      funnelData?.forEach(event => allSessions.add(event.session_id));
      const totalSessions = allSessions.size;

      // Build funnel steps with conversion rates
      const steps: FunnelStep[] = [];
      let previousCount = totalSessions;

      for (const stepDef of funnelSteps) {
        const metrics = stepMetrics.get(stepDef.step);
        const uniqueSessions = metrics?.sessions.size || 0;
        const count = metrics?.count || 0;

        const conversionRate = previousCount > 0 
          ? (uniqueSessions / previousCount) * 100 
          : 0;
        
        const dropOffRate = previousCount > 0 
          ? ((previousCount - uniqueSessions) / previousCount) * 100 
          : 0;

        steps.push({
          step: stepDef.label,
          stepOrder: stepDef.order,
          count,
          uniqueSessions,
          conversionRate: Math.round(conversionRate * 10) / 10,
          dropOffRate: Math.round(dropOffRate * 10) / 10
        });

        previousCount = uniqueSessions;
      }

      // Calculate overall conversion rate (from first to last step)
      const firstStepSessions = steps[0]?.uniqueSessions || 0;
      const lastStepSessions = steps[steps.length - 1]?.uniqueSessions || 0;
      const overallConversionRate = firstStepSessions > 0
        ? Math.round((lastStepSessions / firstStepSessions) * 1000) / 10
        : 0;

      return {
        steps,
        totalSessions,
        overallConversionRate,
        dateRange: {
          start: startDate,
          end: endDate
        }
      };
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook to get contact action breakdown
export const useContactActionBreakdown = (options: UseConversionFunnelOptions = {}) => {
  const {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate = new Date().toISOString(),
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['contact-action-breakdown', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_events')
        .select('event_action, metadata')
        .eq('event_category', 'merchant_interaction')
        .in('event_action', ['phone_clicked', 'website_clicked', 'directions_clicked'])
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        console.error('Error fetching contact actions:', error);
        throw error;
      }

      const breakdown = {
        phone: { count: 0, mobile: 0, desktop: 0 },
        website: { count: 0, mobile: 0, desktop: 0 },
        directions: { count: 0, mobile: 0, desktop: 0 }
      };

      data?.forEach(event => {
        const deviceType = (event.metadata as any)?.deviceType || 'desktop';
        
        if (event.event_action === 'phone_clicked') {
          breakdown.phone.count++;
          if (deviceType === 'mobile') breakdown.phone.mobile++;
          else breakdown.phone.desktop++;
        } else if (event.event_action === 'website_clicked') {
          breakdown.website.count++;
          if (deviceType === 'mobile') breakdown.website.mobile++;
          else breakdown.website.desktop++;
        } else if (event.event_action === 'directions_clicked') {
          breakdown.directions.count++;
          if (deviceType === 'mobile') breakdown.directions.mobile++;
          else breakdown.directions.desktop++;
        }
      });

      return breakdown;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};
