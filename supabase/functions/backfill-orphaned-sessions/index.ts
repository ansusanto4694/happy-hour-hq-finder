import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Verify caller is admin
  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin only" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Query orphaned sessions from user_events
  const { data: orphanedSessions, error: queryError } = await supabase.rpc(
    "get_orphaned_session_ids"
  );

  if (queryError) {
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const orphanedIds = (orphanedSessions || []).map(
    (r: { session_id: string }) => r.session_id
  );

  if (orphanedIds.length === 0) {
    return new Response(
      JSON.stringify({ message: "No orphaned sessions found", inserted: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Process in batches of 50
  const batchSize = 50;
  let totalInserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < orphanedIds.length; i += batchSize) {
    const batch = orphanedIds.slice(i, i + batchSize);

    // Get aggregated event data for this batch
    const { data: events, error: eventsError } = await supabase
      .from("user_events")
      .select("session_id, created_at, page_path, user_id, anonymous_user_id, is_mobile, metadata")
      .in("session_id", batch)
      .order("created_at", { ascending: true });

    if (eventsError) {
      errors.push(`Batch ${i}: ${eventsError.message}`);
      continue;
    }

    // Group events by session_id
    const sessionMap = new Map<string, typeof events>();
    for (const event of events || []) {
      const existing = sessionMap.get(event.session_id) || [];
      existing.push(event);
      sessionMap.set(event.session_id, existing);
    }

    const rows = [];
    for (const [sessionId, sessionEvents] of sessionMap) {
      const firstEvent = sessionEvents[0];
      const lastEvent = sessionEvents[sessionEvents.length - 1];
      const firstSeen = new Date(firstEvent.created_at);
      const lastSeen = new Date(lastEvent.created_at);
      const durationSeconds = Math.round(
        (lastSeen.getTime() - firstSeen.getTime()) / 1000
      );
      const isMobile = sessionEvents.some((e) => e.is_mobile);
      const isBounce = sessionEvents.length <= 1;
      const uniquePages = new Set(sessionEvents.map((e) => e.page_path));

      // Try to extract referrer info from metadata of first event
      let referrerSource: string | null = null;
      let trafficSource = "direct";
      if (firstEvent.metadata && typeof firstEvent.metadata === "object") {
        const meta = firstEvent.metadata as Record<string, unknown>;
        if (meta.referrer_source) referrerSource = String(meta.referrer_source);
        if (meta.traffic_source) trafficSource = String(meta.traffic_source);
      }

      rows.push({
        session_id: sessionId,
        device_type: isMobile ? "mobile" : "desktop",
        entry_page: firstEvent.page_path,
        exit_page: lastEvent.page_path,
        first_seen: firstEvent.created_at,
        last_seen: lastEvent.created_at,
        session_duration_seconds: durationSeconds,
        is_bounce: isBounce,
        is_bot: false,
        is_engaged: uniquePages.size > 1 || durationSeconds > 10,
        engagement_score: Math.min(sessionEvents.length, 100),
        user_id: firstEvent.user_id || null,
        anonymous_user_id: firstEvent.anonymous_user_id || null,
        user_agent: null,
        traffic_source: trafficSource,
        referrer_source: referrerSource,
        attribution_type: "first_touch",
      });
    }

    if (rows.length > 0) {
      const { error: insertError, count } = await supabase
        .from("user_sessions")
        .insert(rows);

      if (insertError) {
        errors.push(`Insert batch ${i}: ${insertError.message}`);
      } else {
        totalInserted += rows.length;
      }
    }
  }

  return new Response(
    JSON.stringify({
      message: "Backfill complete",
      orphaned_found: orphanedIds.length,
      inserted: totalInserted,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
