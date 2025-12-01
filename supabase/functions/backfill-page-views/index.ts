import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

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

    console.log('[Backfill Page Views] Starting page_views count correction...');

    let sessionsUpdated = 0;
    let totalPageViewsCorrected = 0;
    const errors: string[] = [];

    // Get all sessions
    const { data: allSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id, session_id, page_views');

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    if (!allSessions || allSessions.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No sessions found to update',
        sessions_updated: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`[Backfill Page Views] Found ${allSessions.length} sessions to process`);

    // Process sessions in batches of 50 for efficiency
    const batchSize = 50;
    for (let i = 0; i < allSessions.length; i += batchSize) {
      const batch = allSessions.slice(i, i + batchSize);
      const sessionIds = batch.map(s => s.session_id);

      // Get actual page_view events for these sessions
      const { data: pageViewEvents, error: eventsError } = await supabase
        .from('user_events')
        .select('session_id, event_type')
        .in('session_id', sessionIds)
        .eq('event_type', 'page_view');

      if (eventsError) {
        const errorMsg = `Failed to fetch events for batch ${i}-${i + batchSize}: ${eventsError.message}`;
        console.error(`[Backfill Page Views] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      // Count page views per session
      const pageViewCounts = new Map<string, number>();
      pageViewEvents?.forEach(event => {
        const count = pageViewCounts.get(event.session_id) || 0;
        pageViewCounts.set(event.session_id, count + 1);
      });

      // Update each session with correct page_views count
      for (const session of batch) {
        const actualPageViews = pageViewCounts.get(session.session_id) || 0;
        const currentPageViews = session.page_views || 0;

        // Only update if the count is different
        if (actualPageViews !== currentPageViews) {
          const { error: updateError } = await supabase
            .from('user_sessions')
            .update({
              page_views: actualPageViews,
              updated_at: new Date().toISOString(),
            })
            .eq('session_id', session.session_id);

          if (updateError) {
            const errorMsg = `Failed to update session ${session.session_id}: ${updateError.message}`;
            console.error(`[Backfill Page Views] ${errorMsg}`);
            errors.push(errorMsg);
          } else {
            sessionsUpdated++;
            totalPageViewsCorrected += Math.abs(actualPageViews - currentPageViews);
            
            if (sessionsUpdated % 100 === 0) {
              console.log(`[Backfill Page Views] Progress: ${sessionsUpdated} sessions updated`);
            }
          }
        }
      }
    }

    // Get final statistics
    const { data: finalSessions } = await supabase
      .from('user_sessions')
      .select('page_views');

    const totalPageViews = finalSessions?.reduce((sum, s) => sum + (s.page_views || 0), 0) || 0;

    const { count: totalPageViewEvents } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view');

    const result = {
      success: true,
      sessions_processed: allSessions.length,
      sessions_updated: sessionsUpdated,
      total_page_views_corrected: totalPageViewsCorrected,
      final_stats: {
        total_sessions: allSessions.length,
        total_page_views_in_sessions: totalPageViews,
        total_page_view_events: totalPageViewEvents || 0,
        accuracy: totalPageViewEvents ? ((totalPageViews / totalPageViewEvents) * 100).toFixed(2) + '%' : 'N/A',
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
      timestamp: new Date().toISOString(),
    };

    console.log('[Backfill Page Views] Completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Backfill Page Views] Fatal error:', error);
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
