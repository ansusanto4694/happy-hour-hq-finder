import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_HOST = 'sipmunchyap.com';
const SITEMAP_URL = `https://${SITE_HOST}/sitemap.xml`;
// IndexNow API key - must match the key file at /{key}.txt
const INDEXNOW_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;

// IndexNow endpoints (Bing, Yandex, and others share the protocol)
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

interface IndexNowResult {
  endpoint: string;
  status: number;
  success: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for trigger reason and optional URL list
    let triggerReason = 'manual';
    let urlsToSubmit: string[] = [SITEMAP_URL];
    
    try {
      const body = await req.json();
      triggerReason = body.trigger_reason || 'manual';
      if (body.urls && Array.isArray(body.urls)) {
        urlsToSubmit = body.urls;
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.info(`IndexNow submission triggered: ${triggerReason}`);
    console.info(`Submitting ${urlsToSubmit.length} URL(s) to IndexNow...`);

    const results: IndexNowResult[] = [];

    // Submit to each IndexNow endpoint
    for (const endpoint of INDEXNOW_ENDPOINTS) {
      try {
        const payload = {
          host: SITE_HOST,
          key: INDEXNOW_KEY,
          keyLocation: KEY_LOCATION,
          urlList: urlsToSubmit,
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const status = response.status;
        // IndexNow returns 200 (OK), 202 (Accepted), or 204 (No Content) for success
        const success = status >= 200 && status < 300;
        
        console.info(`${endpoint}: ${status} (${success ? 'success' : 'failed'})`);
        
        results.push({
          endpoint,
          status,
          success,
        });
      } catch (endpointError) {
        console.error(`Error submitting to ${endpoint}:`, endpointError);
        results.push({
          endpoint,
          status: 0,
          success: false,
        });
      }
    }

    const overallSuccess = results.some(r => r.success);
    
    // Log the ping to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      // Find the best result (first successful one, or first failure)
      const bestResult = results.find(r => r.success) || results[0];
      
      await supabase.from('sitemap_pings').insert({
        google_status: bestResult?.status || 0,
        google_success: overallSuccess,
        sitemap_url: SITEMAP_URL,
        trigger_reason: triggerReason,
      });
      console.info('Ping logged to database');
    } catch (logError) {
      console.error('Could not log ping:', logError);
    }

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        results,
        urls_submitted: urlsToSubmit,
        trigger_reason: triggerReason,
        submitted_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error submitting to IndexNow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
