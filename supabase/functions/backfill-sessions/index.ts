import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Backfill] Starting session data backfill...');

    // Step 1: Insert missing sessions (sessions in user_events but not in user_sessions)
    console.log('[Backfill] Step 1: Inserting missing sessions...');
    
    const { error: insertError } = await supabase.rpc('execute_backfill_insert');
    
    // If RPC doesn't exist, execute directly via raw SQL
    const insertQuery = `
      WITH missing_sessions AS (
        SELECT 
          ue.session_id,
          (array_agg(ue.anonymous_user_id ORDER BY ue.created_at) FILTER (WHERE ue.anonymous_user_id IS NOT NULL))[1] as anonymous_user_id,
          MIN(ue.created_at) as first_seen,
          MAX(ue.created_at) as last_seen,
          (array_agg(ue.page_path ORDER BY ue.created_at))[1] as entry_page,
          (array_agg(ue.page_path ORDER BY ue.created_at DESC))[1] as exit_page,
          EXTRACT(EPOCH FROM (MAX(ue.created_at) - MIN(ue.created_at)))::integer as session_duration_seconds,
          COUNT(*)::integer as total_events,
          COUNT(DISTINCT ue.page_path)::integer as page_views,
          (COUNT(*) <= 1 AND EXTRACT(EPOCH FROM (MAX(ue.created_at) - MIN(ue.created_at))) < 10) as is_bounce,
          bool_or(ue.is_mobile) as is_mobile
        FROM user_events ue
        WHERE ue.session_id NOT IN (SELECT session_id FROM user_sessions)
        GROUP BY ue.session_id
      )
      INSERT INTO user_sessions (
        session_id,
        anonymous_user_id,
        first_seen,
        last_seen,
        entry_page,
        exit_page,
        session_duration_seconds,
        total_events,
        page_views,
        is_bounce,
        device_type,
        is_engaged,
        engagement_score
      )
      SELECT 
        ms.session_id,
        ms.anonymous_user_id,
        ms.first_seen,
        ms.last_seen,
        ms.entry_page,
        ms.exit_page,
        ms.session_duration_seconds,
        ms.total_events,
        ms.page_views,
        ms.is_bounce,
        CASE WHEN ms.is_mobile THEN 'mobile' ELSE 'desktop' END,
        (ms.page_views >= 2 OR ms.session_duration_seconds >= 10 OR ms.total_events >= 3),
        (ms.page_views * 10 + LEAST(ms.session_duration_seconds / 10, 30) + ms.total_events * 5)::integer
      FROM missing_sessions ms
      ON CONFLICT (session_id) DO NOTHING;
    `;

    const { count: insertedCount, error: insertExecError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });

    const countBefore = insertedCount || 0;

    // Execute insert using Postgres query
    const { error: insertRawError } = await supabase.rpc('exec_sql', { 
      query: insertQuery 
    });

    // Get count after to see how many were inserted
    const { count: countAfter, error: countError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });

    const sessionsInserted = (countAfter || 0) - countBefore;

    console.log(`[Backfill] Inserted ${sessionsInserted} missing sessions`);

    // Step 2: Update existing sessions with missing/incorrect data
    console.log('[Backfill] Step 2: Updating existing sessions...');

    const updateQuery = `
      WITH session_metrics AS (
        SELECT 
          ue.session_id,
          (array_agg(ue.anonymous_user_id ORDER BY ue.created_at) FILTER (WHERE ue.anonymous_user_id IS NOT NULL))[1] as anonymous_user_id,
          MIN(ue.created_at) as first_seen,
          MAX(ue.created_at) as last_seen,
          (array_agg(ue.page_path ORDER BY ue.created_at))[1] as entry_page,
          (array_agg(ue.page_path ORDER BY ue.created_at DESC))[1] as exit_page,
          EXTRACT(EPOCH FROM (MAX(ue.created_at) - MIN(ue.created_at)))::integer as session_duration_seconds,
          COUNT(*)::integer as total_events,
          COUNT(DISTINCT ue.page_path)::integer as page_views,
          (COUNT(*) <= 1 AND EXTRACT(EPOCH FROM (MAX(ue.created_at) - MIN(ue.created_at))) < 10) as is_bounce
        FROM user_events ue
        WHERE ue.session_id IN (SELECT session_id FROM user_sessions)
        GROUP BY ue.session_id
      )
      UPDATE user_sessions us
      SET
        anonymous_user_id = COALESCE(us.anonymous_user_id, sm.anonymous_user_id),
        session_duration_seconds = COALESCE(us.session_duration_seconds, sm.session_duration_seconds),
        is_bounce = sm.is_bounce,
        entry_page = COALESCE(us.entry_page, sm.entry_page),
        exit_page = COALESCE(NULLIF(sm.exit_page, us.entry_page), us.exit_page),
        total_events = GREATEST(us.total_events, sm.total_events),
        page_views = GREATEST(us.page_views, sm.page_views),
        is_engaged = (sm.page_views >= 2 OR sm.session_duration_seconds >= 10 OR sm.total_events >= 3),
        engagement_score = (sm.page_views * 10 + LEAST(sm.session_duration_seconds / 10, 30) + sm.total_events * 5)::integer,
        first_seen = LEAST(us.first_seen, sm.first_seen),
        last_seen = GREATEST(us.last_seen, sm.last_seen),
        updated_at = now()
      FROM session_metrics sm
      WHERE us.session_id = sm.session_id
        AND (
          us.anonymous_user_id IS NULL 
          OR us.session_duration_seconds IS NULL 
          OR us.is_bounce != sm.is_bounce
          OR us.entry_page IS NULL
          OR us.total_events < sm.total_events
          OR us.page_views < sm.page_views
        );
    `;

    // Query to count sessions that need updating
    const { count: needsUpdateCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .or('anonymous_user_id.is.null,session_duration_seconds.is.null,entry_page.is.null');

    const sessionsNeedingUpdate = needsUpdateCount || 0;

    console.log(`[Backfill] Found ${sessionsNeedingUpdate} sessions needing updates`);

    // Execute the update using client methods
    // Since we can't use raw SQL directly, we'll fetch the data and update in batches
    const { data: sessionsToUpdate, error: fetchError } = await supabase
      .from('user_events')
      .select('session_id, anonymous_user_id, created_at, page_path, is_mobile')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    // Group events by session_id
    const sessionGroups = new Map<string, any[]>();
    sessionsToUpdate?.forEach(event => {
      if (!sessionGroups.has(event.session_id)) {
        sessionGroups.set(event.session_id, []);
      }
      sessionGroups.get(event.session_id)!.push(event);
    });

    let sessionsUpdated = 0;
    const batchSize = 50;
    const sessionIds = Array.from(sessionGroups.keys());

    for (let i = 0; i < sessionIds.length; i += batchSize) {
      const batch = sessionIds.slice(i, i + batchSize);
      
      for (const sessionId of batch) {
        const events = sessionGroups.get(sessionId)!;
        if (events.length === 0) continue;

        const anonymousUserId = events.find(e => e.anonymous_user_id)?.anonymous_user_id;
        const firstSeen = new Date(Math.min(...events.map(e => new Date(e.created_at).getTime())));
        const lastSeen = new Date(Math.max(...events.map(e => new Date(e.created_at).getTime())));
        const sessionDuration = Math.floor((lastSeen.getTime() - firstSeen.getTime()) / 1000);
        const entryPage = events[0].page_path;
        const exitPage = events[events.length - 1].page_path;
        const totalEvents = events.length;
        const pageViews = new Set(events.map(e => e.page_path)).size;
        const isBounce = totalEvents <= 1 && sessionDuration < 10;
        const isEngaged = pageViews >= 2 || sessionDuration >= 10 || totalEvents >= 3;
        const engagementScore = pageViews * 10 + Math.min(sessionDuration / 10, 30) + totalEvents * 5;

        // Check if session exists
        const { data: existingSession } = await supabase
          .from('user_sessions')
          .select('session_id, anonymous_user_id, session_duration_seconds, entry_page')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (existingSession) {
          // Update only if needed
          const needsUpdate = 
            !existingSession.anonymous_user_id ||
            !existingSession.session_duration_seconds ||
            !existingSession.entry_page;

          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('user_sessions')
              .update({
                anonymous_user_id: existingSession.anonymous_user_id || anonymousUserId,
                session_duration_seconds: existingSession.session_duration_seconds || sessionDuration,
                is_bounce: isBounce,
                entry_page: existingSession.entry_page || entryPage,
                exit_page: exitPage !== entryPage ? exitPage : existingSession.entry_page,
                total_events: Math.max(totalEvents, (existingSession as any).total_events || 0),
                page_views: Math.max(pageViews, (existingSession as any).page_views || 0),
                is_engaged: isEngaged,
                engagement_score: Math.floor(engagementScore),
                updated_at: new Date().toISOString(),
              })
              .eq('session_id', sessionId);

            if (!updateError) {
              sessionsUpdated++;
            }
          }
        }
      }

      console.log(`[Backfill] Processed ${Math.min((i + 1) * batchSize, sessionIds.length)}/${sessionIds.length} sessions`);
    }

    console.log(`[Backfill] Updated ${sessionsUpdated} existing sessions`);

    const result = {
      success: true,
      sessions_inserted: sessionsInserted,
      sessions_updated: sessionsUpdated,
      total_processed: sessionsInserted + sessionsUpdated,
      timestamp: new Date().toISOString(),
    };

    console.log('[Backfill] Backfill completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Backfill] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
