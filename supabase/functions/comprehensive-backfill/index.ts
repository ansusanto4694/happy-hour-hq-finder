import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate engagement metrics from event data
const calculateEngagementScore = (pageViews: number, durationSeconds: number, totalEvents: number): number => {
  let score = 0;
  
  // Page views contribution (0-40 points)
  score += Math.min(pageViews * 5, 40);
  
  // Duration contribution (0-40 points)
  const durationMinutes = durationSeconds / 60;
  score += Math.min(durationMinutes * 4, 40);
  
  // Event interaction contribution (0-20 points)
  score += Math.min(totalEvents * 0.5, 20);
  
  return Math.min(Math.round(score), 100);
};

const isEngagedSession = (pageViews: number, durationSeconds: number, isBounce: boolean, isBot: boolean): boolean => {
  if (isBot || isBounce) return false;
  
  // Engaged if: 2+ page views OR 60+ seconds OR both
  return pageViews >= 2 || durationSeconds >= 60;
};

const isBounceSession = (pageViews: number, durationSeconds: number): boolean => {
  // Bounce if only 1 page view AND less than 10 seconds
  return pageViews <= 1 && durationSeconds < 10;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Define background processing function
    const processBackfill = async () => {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      try {
        console.log('[Comprehensive Backfill] Starting accurate session metrics calculation...');

        // Get all sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from('user_sessions')
          .select('session_id, is_bot, first_seen, last_seen')
          .order('created_at', { ascending: true });

        if (sessionsError) {
          throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
        }

        console.log(`[Comprehensive Backfill] Found ${sessions.length} sessions to process`);

        let processedCount = 0;
        let updatedCount = 0;
        const batchSize = 50;

        // Process sessions in batches
        for (let i = 0; i < sessions.length; i += batchSize) {
          const batch = sessions.slice(i, i + batchSize);
          const sessionIds = batch.map(s => s.session_id);

          // Fetch ALL events for these sessions in one query
          const { data: events, error: eventsError } = await supabase
            .from('user_events')
            .select('session_id, event_type, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: true });

          if (eventsError) {
            console.error('[Comprehensive Backfill] Error fetching events:', eventsError);
            continue;
          }

          // Group events by session
          const eventsBySession = events.reduce((acc, event) => {
            if (!acc[event.session_id]) {
              acc[event.session_id] = [];
            }
            acc[event.session_id].push(event);
            return acc;
          }, {} as Record<string, any[]>);

          // Process each session
          for (const session of batch) {
            const sessionEvents = eventsBySession[session.session_id] || [];
            
            // Calculate accurate metrics directly from events
            const totalEvents = sessionEvents.length;
            const pageViews = sessionEvents.filter(e => e.event_type === 'page_view').length;
            
            // Calculate session duration from first and last event
            let sessionDuration = 0;
            if (sessionEvents.length > 0) {
              const firstEvent = new Date(sessionEvents[0].created_at);
              const lastEvent = new Date(sessionEvents[sessionEvents.length - 1].created_at);
              sessionDuration = Math.round((lastEvent.getTime() - firstEvent.getTime()) / 1000);
            }

            // Calculate engagement metrics
            const isBounce = isBounceSession(pageViews, sessionDuration);
            const isEngaged = isEngagedSession(pageViews, sessionDuration, isBounce, session.is_bot);
            const engagementScore = calculateEngagementScore(pageViews, sessionDuration, totalEvents);

            // Update session with accurate engagement metrics (no longer updating counters)
            const { error: updateError } = await supabase
              .from('user_sessions')
              .update({
                session_duration_seconds: sessionDuration,
                is_bounce: isBounce,
                is_engaged: isEngaged,
                engagement_score: engagementScore,
                updated_at: new Date().toISOString(),
              })
              .eq('session_id', session.session_id);

            if (updateError) {
              console.error(`[Comprehensive Backfill] Error updating session ${session.session_id}:`, updateError);
            } else {
              updatedCount++;
            }

            processedCount++;
            
            if (processedCount % 100 === 0) {
              console.log(`[Comprehensive Backfill] Processed ${processedCount}/${sessions.length} sessions`);
            }
          }
        }

        // Get summary stats (comparing actual events to engagement metrics)
        const { data: sessionStats, count: totalSessions } = await supabase
          .from('user_sessions')
          .select('*', { count: 'exact', head: true });

        const { count: totalEventCount } = await supabase
          .from('user_events')
          .select('*', { count: 'exact', head: true });

        const { count: totalPageViews } = await supabase
          .from('user_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view');

        const result = {
          success: true,
          sessions_processed: processedCount,
          sessions_updated: updatedCount,
          total_sessions: sessions.length,
          summary: {
            total_sessions: totalSessions,
            total_events: totalEventCount,
            total_page_views: totalPageViews,
            avg_events_per_session: totalSessions > 0 ? (totalEventCount / totalSessions).toFixed(2) : 0,
            avg_page_views_per_session: totalSessions > 0 ? (totalPageViews / totalSessions).toFixed(2) : 0,
          },
          timestamp: new Date().toISOString(),
        };

        console.log('[Comprehensive Backfill] Completed:', result);
      } catch (error) {
        console.error('[Comprehensive Backfill] Background error:', error);
      }
    };

    // Start background processing without waiting
    EdgeRuntime.waitUntil(processBackfill());

    // Return immediate response
    return new Response(JSON.stringify({
      success: true,
      message: 'Backfill started in background',
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202, // Accepted
    });
  } catch (error) {
    console.error('[Comprehensive Backfill] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
