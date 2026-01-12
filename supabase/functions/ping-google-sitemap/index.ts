import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITEMAP_URL = 'https://happyhourhawaii.com/sitemap.xml';
const GOOGLE_PING_URL = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.info('Pinging Google with sitemap update...');
    
    // Ping Google
    const googleResponse = await fetch(GOOGLE_PING_URL, {
      method: 'GET',
    });

    const googleStatus = googleResponse.status;
    const googleSuccess = googleStatus === 200;

    console.info(`Google ping response: ${googleStatus}`);

    // Log the ping to a table for tracking (optional - create table if needed)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to log the ping (table may not exist yet)
    try {
      await supabase.from('sitemap_pings').insert({
        google_status: googleStatus,
        google_success: googleSuccess,
        sitemap_url: SITEMAP_URL,
      });
    } catch (logError) {
      // Table might not exist, that's okay
      console.info('Could not log ping (table may not exist):', logError);
    }

    return new Response(
      JSON.stringify({
        success: googleSuccess,
        google: {
          status: googleStatus,
          success: googleSuccess,
        },
        sitemap_url: SITEMAP_URL,
        pinged_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error pinging search engines:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
