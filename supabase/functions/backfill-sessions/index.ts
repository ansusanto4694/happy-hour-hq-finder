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

    console.log('[Backfill] Starting complete session data backfill...');

    let sessionsInserted = 0;
    let sessionsUpdated = 0;
    let totalIterations = 0;
    const maxIterations = 50; // Safety limit to prevent infinite loops
    const insertBatchSize = 100;

    // Step 1: Insert ALL missing sessions by looping until none remain
    console.log('[Backfill] Step 1: Draining all orphaned sessions...');
    
    let hasMoreOrphans = true;
    while (hasMoreOrphans && totalIterations < maxIterations) {
      totalIterations++;
      
      // Get orphaned session IDs directly from database function
      const { data: orphanedSessions, error: orphanedError } = await supabase
        .rpc('get_orphaned_session_ids');

      if (orphanedError) {
        throw new Error(`Failed to get orphaned sessions: ${orphanedError.message}`);
      }

      const uniqueMissingIds = orphanedSessions?.map(s => s.session_id) || [];
      console.log(`[Backfill] Iteration ${totalIterations}: Found ${uniqueMissingIds.length} orphaned sessions`);

      if (uniqueMissingIds.length === 0) {
        hasMoreOrphans = false;
        break;
      }

      // Process this iteration's orphaned sessions in batches
      for (let i = 0; i < uniqueMissingIds.length; i += insertBatchSize) {
        const batchIds = uniqueMissingIds.slice(i, i + insertBatchSize);
        
        // Build insert records efficiently for each session
        const insertRecords = [];
        for (const sessionId of batchIds) {
          // Get event count
          const { count: eventCount } = await supabase
            .from('user_events')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

          if (!eventCount || eventCount === 0) continue;

          // Skip sessions with excessive events
          if (eventCount > 10000) {
            console.log(`[Backfill] Skipping orphaned session ${sessionId} with ${eventCount} events (too large)`);
            continue;
          }

          // Get first and last events
          const { data: firstEvent } = await supabase
            .from('user_events')
            .select('created_at, page_path, anonymous_user_id, is_mobile')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          const { data: lastEvent } = await supabase
            .from('user_events')
            .select('created_at, page_path')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!firstEvent || !lastEvent) continue;

          // Count page views
          const { count: pageViewCount } = await supabase
            .from('user_events')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
            .eq('event_type', 'page_view');

          const firstSeen = new Date(firstEvent.created_at);
          const lastSeen = new Date(lastEvent.created_at);
          const sessionDuration = Math.floor((lastSeen.getTime() - firstSeen.getTime()) / 1000);
          const totalEvents = eventCount;
          const pageViews = pageViewCount || 0;
          
          const isBounce = totalEvents <= 1 && sessionDuration < 10;
          const isEngaged = pageViews >= 2 || sessionDuration >= 10 || totalEvents >= 3;
          const engagementScore = Math.floor(pageViews * 10 + Math.min(sessionDuration / 10, 30) + totalEvents * 5);

          insertRecords.push({
            session_id: sessionId,
            anonymous_user_id: firstEvent.anonymous_user_id,
            first_seen: firstSeen.toISOString(),
            last_seen: lastSeen.toISOString(),
            entry_page: firstEvent.page_path,
            exit_page: lastEvent.page_path !== firstEvent.page_path ? lastEvent.page_path : firstEvent.page_path,
            session_duration_seconds: sessionDuration,
            total_events: totalEvents,
            page_views: pageViews,
            is_bounce: isBounce,
            device_type: firstEvent.is_mobile ? 'mobile' : 'desktop',
            is_engaged: isEngaged,
            engagement_score: engagementScore,
          });
        }

        // Insert batch
        const { error: insertError } = await supabase
          .from('user_sessions')
          .insert(insertRecords);

        if (insertError) {
          console.error(`[Backfill] Error inserting batch:`, insertError);
        } else {
          sessionsInserted += insertRecords.length;
          console.log(`[Backfill] Inserted batch: ${insertRecords.length} sessions (total: ${sessionsInserted})`);
        }
      }
    }

    if (totalIterations >= maxIterations) {
      console.log(`[Backfill] Reached max iterations (${maxIterations}), stopping...`);
    }

    console.log(`[Backfill] Step 1 complete: ${sessionsInserted} sessions inserted in ${totalIterations} iterations`);

    // Step 2: Update ALL existing sessions to recalculate metrics
    console.log('[Backfill] Step 2: Recalculating metrics for all existing sessions...');

    // Get all sessions to ensure page_views and total_events are accurate
    const { data: sessionsNeedingUpdate } = await supabase
      .from('user_sessions')
      .select('session_id');

    const sessionIdsToUpdate = sessionsNeedingUpdate?.map(s => s.session_id) || [];
    console.log(`[Backfill] Found ${sessionIdsToUpdate.length} sessions needing updates`);

    // Process updates in batches
    const updateBatchSize = 100;
    for (let i = 0; i < sessionIdsToUpdate.length; i += updateBatchSize) {
      const batchIds = sessionIdsToUpdate.slice(i, i + updateBatchSize);
      
      // Get current session data
      const { data: currentSessions } = await supabase
        .from('user_sessions')
        .select('*')
        .in('session_id', batchIds);

      if (!currentSessions) continue;

      // Update each session using efficient aggregated queries
      for (const session of currentSessions) {
        // First, get count of events for this session
        const { count: eventCount } = await supabase
          .from('user_events')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.session_id);

        // Skip sessions with excessive events (will handle separately)
        if (eventCount && eventCount > 10000) {
          console.log(`[Backfill] Skipping session ${session.session_id} with ${eventCount} events (too large)`);
          continue;
        }

        // Get first and last events for timing
        const { data: firstEventData } = await supabase
          .from('user_events')
          .select('created_at, page_path, anonymous_user_id')
          .eq('session_id', session.session_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        const { data: lastEventData } = await supabase
          .from('user_events')
          .select('created_at, page_path')
          .eq('session_id', session.session_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!firstEventData || !lastEventData) continue;

        // Count page views using COUNT query
        const { count: pageViewCount } = await supabase
          .from('user_events')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.session_id)
          .eq('event_type', 'page_view');

        const firstSeen = new Date(firstEventData.created_at);
        const lastSeen = new Date(lastEventData.created_at);
        const sessionDuration = Math.floor((lastSeen.getTime() - firstSeen.getTime()) / 1000);
        const totalEvents = eventCount || 0;
        const pageViews = pageViewCount || 0;
        
        const isBounce = totalEvents <= 1 && sessionDuration < 10;
        const isEngaged = pageViews >= 2 || sessionDuration >= 10 || totalEvents >= 3;
        const engagementScore = Math.floor(pageViews * 10 + Math.min(sessionDuration / 10, 30) + totalEvents * 5);
        const anonymousUserId = firstEventData.anonymous_user_id;

        const updates: any = {
          is_bounce: isBounce,
          is_engaged: isEngaged,
          engagement_score: engagementScore,
          // ALWAYS recalculate these from actual event data
          total_events: totalEvents,
          page_views: pageViews,
          first_seen: new Date(Math.min(new Date(session.first_seen).getTime(), firstSeen.getTime())).toISOString(),
          last_seen: new Date(Math.max(new Date(session.last_seen).getTime(), lastSeen.getTime())).toISOString(),
          session_duration_seconds: sessionDuration,
          updated_at: new Date().toISOString(),
        };

        // Only update if missing
        if (!session.anonymous_user_id && anonymousUserId) {
          updates.anonymous_user_id = anonymousUserId;
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
