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

    const today = new Date().toISOString().split('T')[0];

    // Deactivate recurring events whose repeat_until date has passed
    const { data, error, count } = await supabase
      .from('merchant_events')
      .update({ is_active: false })
      .eq('event_type', 'recurring')
      .eq('is_active', true)
      .lt('repeat_until', today)
      .not('repeat_until', 'is', null)
      .select('id, title, repeat_until');

    if (error) {
      throw error;
    }

    const result = {
      success: true,
      deactivated_count: data?.length ?? 0,
      deactivated_events: data,
      checked_at: new Date().toISOString(),
    };

    console.log('[Deactivate Expired Events]', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Deactivate Expired Events] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
