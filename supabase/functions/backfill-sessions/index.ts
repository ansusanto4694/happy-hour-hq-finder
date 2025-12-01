import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

// Version 2.0 - Complete rewrite with optimized queries
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Backfill v2] Starting session metrics recalculation...');

    let sessionsUpdated = 0;
    const updateBatchSize = 50;

    // Get all sessions to recalculate
    const { data: allSessions } = await supabase
      .from('user_sessions')
      .select('session_id');

    const sessionIds = allSessions?.map(s => s.session_id) || [];
    console.log(`[Backfill v2] Found ${sessionIds.length} sessions to process`);

    // Process in smaller batches
    for (let i = 0; i < sessionIds.length; i += updateBatchSize) {
      const batchIds = sessionIds.slice(i, i + updateBatchSize);
      
      for (const sessionId of batchIds) {
        try {
          // Get session
          const { data: session } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();

          if (!session) continue;

          // Get event count
          const { count: totalEvents } = await supabase
            .from('user_events')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

          // Skip sessions with too many events
          if (totalEvents && totalEvents > 10000) {
            console.log(`[Backfill v2] Skipping ${sessionId} with ${totalEvents} events`);
            continue;
          }

          // Get first event
          const { data: firstEvent } = await supabase
            .from('user_events')
            .select('created_at, page_path, anonymous_user_id, is_mobile')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          // Get last event
          const { data: lastEvent } = await supabase
            .from('user_events')
            .select('created_at, page_path')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!firstEvent || !lastEvent) continue;

          // Count page views
          const { count: pageViews } = await supabase
            .from('user_events')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
            .eq('event_type', 'page_view');

          // Calculate metrics
          const firstSeen = new Date(firstEvent.created_at);
          const lastSeen = new Date(lastEvent.created_at);
          const sessionDuration = Math.floor((lastSeen.getTime() - firstSeen.getTime()) / 1000);
          const pageViewCount = pageViews || 0;
          const eventCount = totalEvents || 0;
          
          const isBounce = eventCount <= 1 && sessionDuration < 10;
          const isEngaged = pageViewCount >= 2 || sessionDuration >= 10 || eventCount >= 3;
          const engagementScore = Math.floor(pageViewCount * 10 + Math.min(sessionDuration / 10, 30) + eventCount * 5);

          // Update session with recalculated metrics
          const { error: updateError } = await supabase
            .from('user_sessions')
            .update({
              total_events: eventCount,
              page_views: pageViewCount,
              session_duration_seconds: sessionDuration,
              is_bounce: isBounce,
              is_engaged: isEngaged,
              engagement_score: engagementScore,
              first_seen: new Date(Math.min(new Date(session.first_seen).getTime(), firstSeen.getTime())).toISOString(),
              last_seen: new Date(Math.max(new Date(session.last_seen).getTime(), lastSeen.getTime())).toISOString(),
              entry_page: firstEvent.page_path,
              exit_page: lastEvent.page_path !== firstEvent.page_path ? lastEvent.page_path : firstEvent.page_path,
              anonymous_user_id: session.anonymous_user_id || firstEvent.anonymous_user_id,
              device_type: firstEvent.is_mobile ? 'mobile' : 'desktop',
              updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId);

          if (!updateError) {
            sessionsUpdated++;
          } else {
            console.error(`[Backfill v2] Error updating ${sessionId}:`, updateError);
          }
        } catch (error) {
          console.error(`[Backfill v2] Error processing ${sessionId}:`, error);
        }
      }

      console.log(`[Backfill v2] Processed ${Math.min(i + updateBatchSize, sessionIds.length)}/${sessionIds.length} sessions`);
    }

    // Get final stats
    const { data: finalStats } = await supabase
      .from('user_sessions')
      .select('page_views, total_events, session_duration_seconds');

    const totalPageViews = finalStats?.reduce((sum, s) => sum + (s.page_views || 0), 0) || 0;
    const totalEvents = finalStats?.reduce((sum, s) => sum + (s.total_events || 0), 0) || 0;

    const result = {
      success: true,
      sessions_updated: sessionsUpdated,
      total_sessions: sessionIds.length,
      total_page_views: totalPageViews,
      total_events: totalEvents,
      timestamp: new Date().toISOString(),
    };

    console.log('[Backfill v2] Completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Backfill v2] Error:', error);
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
