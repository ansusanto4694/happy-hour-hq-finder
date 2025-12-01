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

    console.log('[Cleanup] Starting cleanup of problematic sessions with excessive events...');

    // The 4 problematic sessions with 10k-75k events
    const problematicSessions = [
      'session_1764348095010_bd5iaz1l6',  // 75,217 events
      'session_1764361982731_3j5tax0fk',  // 29,908 events
      'session_1764347494391_n2vkbyeu5',  // 19,233 events
      'session_1764273752336_mdqsde1s2',  // 11,219 events
    ];

    let eventsDeleted = 0;
    let sessionsDeleted = 0;

    // Delete events for these sessions
    console.log('[Cleanup] Deleting events for problematic sessions...');
    const { error: eventsError, count: eventsCount } = await supabase
      .from('user_events')
      .delete({ count: 'exact' })
      .in('session_id', problematicSessions);

    if (eventsError) {
      throw new Error(`Failed to delete events: ${eventsError.message}`);
    }

    eventsDeleted = eventsCount || 0;
    console.log(`[Cleanup] Deleted ${eventsDeleted} events`);

    // Delete the sessions themselves
    console.log('[Cleanup] Deleting problem sessions...');
    const { error: sessionsError, count: sessionsCount } = await supabase
      .from('user_sessions')
      .delete({ count: 'exact' })
      .in('session_id', problematicSessions);

    if (sessionsError) {
      throw new Error(`Failed to delete sessions: ${sessionsError.message}`);
    }

    sessionsDeleted = sessionsCount || 0;
    console.log(`[Cleanup] Deleted ${sessionsDeleted} sessions`);

    // Get updated stats
    const { data: pageViewStats } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view');

    const { data: sessionStats } = await supabase
      .from('user_sessions')
      .select('page_views');

    const totalSessionPageViews = sessionStats?.reduce((sum, s) => sum + (s.page_views || 0), 0) || 0;
    const actualPageViews = pageViewStats || 0;

    const result = {
      success: true,
      events_deleted: eventsDeleted,
      sessions_deleted: sessionsDeleted,
      problematic_sessions: problematicSessions,
      stats: {
        total_session_page_views: totalSessionPageViews,
        actual_page_views: actualPageViews,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('[Cleanup] Cleanup completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Cleanup] Error:', error);
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
