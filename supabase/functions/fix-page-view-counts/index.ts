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

    console.log('[Fix Page Views] Starting page view count correction...');

    let sessionsUpdated = 0;
    let totalPageViewsAdded = 0;
    
    // Get all sessions
    const { data: allSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('session_id, page_views');

    if (sessionsError) {
      throw new Error(`Failed to get sessions: ${sessionsError.message}`);
    }

    console.log(`[Fix Page Views] Found ${allSessions?.length || 0} sessions to check`);

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < (allSessions?.length || 0); i += batchSize) {
      const batchSessions = allSessions!.slice(i, i + batchSize);
      const sessionIds = batchSessions.map(s => s.session_id);
      
      // Get all events for these sessions
      const { data: events, error: eventsError } = await supabase
        .from('user_events')
        .select('session_id, event_type')
        .in('session_id', sessionIds);

      if (eventsError) {
        console.error(`[Fix Page Views] Error fetching events for batch ${i}:`, eventsError);
        continue;
      }

      // Count page_view events per session
      const pageViewCounts = new Map<string, number>();
      events?.forEach(event => {
        if (event.event_type === 'page_view') {
          pageViewCounts.set(event.session_id, (pageViewCounts.get(event.session_id) || 0) + 1);
        }
      });

      // Update sessions with correct page_view counts
      for (const session of batchSessions) {
        const actualPageViews = pageViewCounts.get(session.session_id) || 0;
        const currentPageViews = session.page_views || 0;

        // Only update if there's a discrepancy
        if (actualPageViews !== currentPageViews) {
          const { error: updateError } = await supabase
            .from('user_sessions')
            .update({ page_views: actualPageViews })
            .eq('session_id', session.session_id);

          if (updateError) {
            console.error(`[Fix Page Views] Error updating session ${session.session_id}:`, updateError);
          } else {
            sessionsUpdated++;
            totalPageViewsAdded += (actualPageViews - currentPageViews);
            
            if (sessionsUpdated % 100 === 0) {
              console.log(`[Fix Page Views] Progress: ${sessionsUpdated} sessions updated`);
            }
          }
        }
      }
    }

    // Get final stats
    const { data: finalStats } = await supabase
      .from('user_sessions')
      .select('page_views');
    
    const totalPageViewsInSessions = finalStats?.reduce((sum, s) => sum + (s.page_views || 0), 0) || 0;
    
    const { count: totalPageViewEvents } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view');

    const accuracy = totalPageViewEvents ? ((totalPageViewsInSessions / totalPageViewEvents) * 100).toFixed(2) : 0;

    const result = {
      success: true,
      sessions_updated: sessionsUpdated,
      total_page_views_added: totalPageViewsAdded,
      final_stats: {
        total_page_views_in_sessions: totalPageViewsInSessions,
        total_page_view_events: totalPageViewEvents,
        accuracy_percent: accuracy,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('[Fix Page Views] Correction completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Fix Page Views] Error:', error);
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
