import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;
    const { data: roleData } = await authClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create Supabase client with service role for elevated privileges
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting neighborhood backfill process...');

    // Fetch ALL merchants with coordinates but no neighborhood (bypassing RLS)
    const { data: merchants, error: fetchError } = await supabase
      .from('Merchant')
      .select('id, latitude, longitude, street_address, city, state, zip_code, neighborhood, restaurant_name')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .is('neighborhood', null);

    if (fetchError) {
      console.error('Error fetching merchants:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${merchants?.length || 0} merchants without neighborhoods`);

    if (!merchants || merchants.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No merchants need neighborhood backfill',
          results: { total: 0, success: 0, failed: 0, skipped: 0 }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const failedMerchants: any[] = [];

    // Process each merchant
    for (const merchant of merchants) {
      console.log(`Processing merchant ${merchant.id} (${merchant.restaurant_name}): ${merchant.city}, ${merchant.state}`);

      try {
        // Call reverse-geocode function
        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('reverse-geocode', {
          body: { 
            latitude: merchant.latitude,
            longitude: merchant.longitude
          }
        });

        if (geocodeError) {
          console.error(`Geocode error for merchant ${merchant.id}:`, geocodeError);
          failedCount++;
          failedMerchants.push({ id: merchant.id, name: merchant.restaurant_name, reason: 'geocode_error' });
          continue;
        }

        if (!geocodeData || !geocodeData.neighborhood) {
          console.log(`No neighborhood found for merchant ${merchant.id} at ${merchant.city}, ${merchant.state}`);
          failedCount++;
          failedMerchants.push({ id: merchant.id, name: merchant.restaurant_name, reason: 'no_neighborhood_data' });
          continue;
        }

        // Update merchant with neighborhood
        const { error: updateError } = await supabase
          .from('Merchant')
          .update({ neighborhood: geocodeData.neighborhood })
          .eq('id', merchant.id);

        if (updateError) {
          console.error(`Failed to update merchant ${merchant.id}:`, updateError);
          failedCount++;
          failedMerchants.push({ id: merchant.id, name: merchant.restaurant_name, reason: 'update_error' });
        } else {
          successCount++;
          console.log(`✅ Updated merchant ${merchant.id} with neighborhood: ${geocodeData.neighborhood}`);
        }

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`Error processing merchant ${merchant.id}:`, err);
        failedCount++;
        failedMerchants.push({ id: merchant.id, name: merchant.restaurant_name, reason: 'exception' });
      }
    }

    const results = {
      total: merchants.length,
      success: successCount,
      failed: failedCount,
      failedMerchants: failedMerchants.slice(0, 10) // Return first 10 failures for debugging
    };

    console.log('Backfill complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backfill complete! Success: ${successCount}, Failed: ${failedCount}`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
