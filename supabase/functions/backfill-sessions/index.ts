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

    console.log('[Backfill] Starting optimized session data backfill...');

    let sessionsInserted = 0;
    let sessionsUpdated = 0;

    // Step 1: Insert missing sessions (sessions in user_events but not in user_sessions)
    console.log('[Backfill] Step 1: Finding and inserting missing sessions...');
    
    // Get ALL unique session_ids from user_events (use DISTINCT to reduce data)
    const { data: distinctEventSessions, error: eventSessionsError } = await supabase
      .rpc('get_distinct_event_session_ids');

    if (eventSessionsError) {
      // Fallback: Get distinct session_ids using aggregation
      const { data: allEvents, error: fallbackError } = await supabase
        .from('user_events')
        .select('session_id')
        .limit(100000); // Set high limit to get all

      if (fallbackError) {
        throw new Error(`Failed to get event sessions: ${fallbackError.message}`);
      }

      const allEventSessionIds = [...new Set(allEvents?.map(s => s.session_id) || [])];
      console.log(`[Backfill] Found ${allEventSessionIds.length} unique session_ids in user_events (using fallback)`);
      
      // Get all existing session_ids from user_sessions
      const { data: existingSessions, error: existingError } = await supabase
        .from('user_sessions')
        .select('session_id')
        .limit(100000);

      if (existingError) {
        throw new Error(`Failed to get existing sessions: ${existingError.message}`);
      }

      const existingSessionIds = new Set(existingSessions?.map(s => s.session_id) || []);
      console.log(`[Backfill] Found ${existingSessionIds.size} existing sessions in user_sessions`);

      // Find missing session_ids (in events but not in sessions)
      const uniqueMissingIds = allEventSessionIds.filter(id => !existingSessionIds.has(id));
      console.log(`[Backfill] Found ${uniqueMissingIds.length} missing sessions to create`);

    // Process missing sessions in batches
    const insertBatchSize = 100;
    for (let i = 0; i < uniqueMissingIds.length; i += insertBatchSize) {
      const batchIds = uniqueMissingIds.slice(i, i + insertBatchSize);
      
      // Get aggregated data for this batch
      const { data: batchData } = await supabase
        .from('user_events')
        .select('*')
        .in('session_id', batchIds);

      if (!batchData || batchData.length === 0) continue;

      // Group by session_id and aggregate
      const sessionMap = new Map<string, any[]>();
      batchData.forEach(event => {
        if (!sessionMap.has(event.session_id)) {
          sessionMap.set(event.session_id, []);
        }
        sessionMap.get(event.session_id)!.push(event);
      });

      // Build insert records
      const insertRecords = Array.from(sessionMap.entries()).map(([sessionId, events]) => {
        const sortedEvents = events.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        const firstSeen = new Date(firstEvent.created_at);
        const lastSeen = new Date(lastEvent.created_at);
        const sessionDuration = Math.floor((lastSeen.getTime() - firstSeen.getTime()) / 1000);
        const totalEvents = events.length;
        const pageViews = new Set(events.map(e => e.page_path)).size;
        const isBounce = totalEvents <= 1 && sessionDuration < 10;
        const isEngaged = pageViews >= 2 || sessionDuration >= 10 || totalEvents >= 3;
        const engagementScore = Math.floor(pageViews * 10 + Math.min(sessionDuration / 10, 30) + totalEvents * 5);
        const anonymousUserId = events.find(e => e.anonymous_user_id)?.anonymous_user_id;
        const isMobile = events.some(e => e.is_mobile);

        return {
          session_id: sessionId,
          anonymous_user_id: anonymousUserId,
          first_seen: firstSeen.toISOString(),
          last_seen: lastSeen.toISOString(),
          entry_page: firstEvent.page_path,
          exit_page: lastEvent.page_path !== firstEvent.page_path ? lastEvent.page_path : firstEvent.page_path,
          session_duration_seconds: sessionDuration,
          total_events: totalEvents,
          page_views: pageViews,
          is_bounce: isBounce,
          device_type: isMobile ? 'mobile' : 'desktop',
          is_engaged: isEngaged,
          engagement_score: engagementScore,
        };
      });

      // Insert batch
      const { error: insertError } = await supabase
        .from('user_sessions')
        .insert(insertRecords);

      if (insertError) {
        console.error(`[Backfill] Error inserting batch ${i}-${i + insertBatchSize}:`, insertError);
      } else {
        sessionsInserted += insertRecords.length;
        console.log(`[Backfill] Inserted batch: ${insertRecords.length} sessions (total: ${sessionsInserted})`);
      }
    }

    console.log(`[Backfill] Step 1 complete: ${sessionsInserted} sessions inserted`);

    // Step 2: Update existing sessions with missing data
    console.log('[Backfill] Step 2: Updating existing sessions with missing data...');

    // Get sessions that need updates (missing anonymous_user_id, session_duration_seconds, or entry_page)
    const { data: sessionsNeedingUpdate } = await supabase
      .from('user_sessions')
      .select('session_id')
      .or('anonymous_user_id.is.null,session_duration_seconds.is.null,entry_page.is.null');

    const sessionIdsToUpdate = sessionsNeedingUpdate?.map(s => s.session_id) || [];
    console.log(`[Backfill] Found ${sessionIdsToUpdate.length} sessions needing updates`);

    // Process updates in batches
    const updateBatchSize = 100;
    for (let i = 0; i < sessionIdsToUpdate.length; i += updateBatchSize) {
      const batchIds = sessionIdsToUpdate.slice(i, i + updateBatchSize);
      
      // Get events for these sessions
      const { data: batchEvents } = await supabase
        .from('user_events')
        .select('*')
        .in('session_id', batchIds)
        .order('created_at', { ascending: true });

      if (!batchEvents || batchEvents.length === 0) continue;

      // Get current session data
      const { data: currentSessions } = await supabase
        .from('user_sessions')
        .select('*')
        .in('session_id', batchIds);

      if (!currentSessions) continue;

      // Group events by session
      const eventsBySession = new Map<string, any[]>();
      batchEvents.forEach(event => {
        if (!eventsBySession.has(event.session_id)) {
          eventsBySession.set(event.session_id, []);
        }
        eventsBySession.get(event.session_id)!.push(event);
      });

      // Update each session
      for (const session of currentSessions) {
        const events = eventsBySession.get(session.session_id);
        if (!events || events.length === 0) continue;

        const sortedEvents = events.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        const firstSeen = new Date(firstEvent.created_at);
        const lastSeen = new Date(lastEvent.created_at);
        const sessionDuration = Math.floor((lastSeen.getTime() - firstSeen.getTime()) / 1000);
        const totalEvents = events.length;
        const pageViews = new Set(events.map(e => e.page_path)).size;
        const isBounce = totalEvents <= 1 && sessionDuration < 10;
        const isEngaged = pageViews >= 2 || sessionDuration >= 10 || totalEvents >= 3;
        const engagementScore = Math.floor(pageViews * 10 + Math.min(sessionDuration / 10, 30) + totalEvents * 5);
        const anonymousUserId = events.find(e => e.anonymous_user_id)?.anonymous_user_id;

        const updates: any = {
          is_bounce: isBounce,
          is_engaged: isEngaged,
          engagement_score: engagementScore,
          total_events: Math.max(session.total_events || 0, totalEvents),
          page_views: Math.max(session.page_views || 0, pageViews),
          first_seen: new Date(Math.min(new Date(session.first_seen).getTime(), firstSeen.getTime())).toISOString(),
          last_seen: new Date(Math.max(new Date(session.last_seen).getTime(), lastSeen.getTime())).toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Only update if missing
        if (!session.anonymous_user_id && anonymousUserId) {
          updates.anonymous_user_id = anonymousUserId;
        }
        if (!session.session_duration_seconds && sessionDuration > 0) {
          updates.session_duration_seconds = sessionDuration;
        }
        if (!session.entry_page) {
          updates.entry_page = firstEvent.page_path;
        }
        if (!session.exit_page || session.exit_page === session.entry_page) {
          updates.exit_page = lastEvent.page_path !== firstEvent.page_path ? lastEvent.page_path : firstEvent.page_path;
        }

        const { error: updateError } = await supabase
          .from('user_sessions')
          .update(updates)
          .eq('session_id', session.session_id);

        if (!updateError) {
          sessionsUpdated++;
        } else {
          console.error(`[Backfill] Error updating session ${session.session_id}:`, updateError);
        }
      }

      console.log(`[Backfill] Updated batch: ${i + batchIds.length}/${sessionIdsToUpdate.length}`);
    }

    console.log(`[Backfill] Step 2 complete: ${sessionsUpdated} sessions updated`);

    // Get final stats
    const { data: finalStats } = await supabase
      .from('user_sessions')
      .select('anonymous_user_id, session_duration_seconds, is_bounce, total_events, entry_page');

    const stats = {
      total_sessions: finalStats?.length || 0,
      missing_anonymous_id: finalStats?.filter(s => !s.anonymous_user_id).length || 0,
      missing_duration: finalStats?.filter(s => !s.session_duration_seconds).length || 0,
      missing_entry_page: finalStats?.filter(s => !s.entry_page).length || 0,
      incorrect_bounce: finalStats?.filter(s => s.is_bounce && (s.total_events || 0) > 1).length || 0,
    };

    const result = {
      success: true,
      sessions_inserted: sessionsInserted,
      sessions_updated: sessionsUpdated,
      total_processed: sessionsInserted + sessionsUpdated,
      final_stats: stats,
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
