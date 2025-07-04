
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW5zdXNhbnRvNDY5NCIsImEiOiJjbWNudDdob28weTZlMmtxMTBmbDc5YTM4In0.qwR9SIqDBrETlROMvhnKvw';

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  try {
    console.log(`Starting geocoding for address: ${address}`);
    
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    
    console.log(`Mapbox URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Mapbox API error: ${response.status} ${response.statusText}`);
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Mapbox response:`, JSON.stringify(data, null, 2));
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      console.log(`Coordinates found: lat=${latitude}, lng=${longitude}`);
      return { latitude, longitude };
    }
    
    console.log('No coordinates found in Mapbox response');
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

serve(async (req) => {
  console.log(`=== GEOCODE FUNCTION START ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers:`, Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log(`Request body: ${requestBody}`);
    
    if (!requestBody) {
      console.error('Empty request body received');
      return new Response(
        JSON.stringify({ success: false, error: 'Empty request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { merchant_id, address } = JSON.parse(requestBody);
    
    console.log(`Processing geocoding request for merchant ${merchant_id}: ${address}`);
    
    if (!merchant_id || !address) {
      console.error('Missing merchant_id or address in request');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing merchant_id or address' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      console.error(`SUPABASE_URL present: ${!!supabaseUrl}`);
      console.error(`SUPABASE_SERVICE_ROLE_KEY present: ${!!supabaseKey}`);
      throw new Error('Missing Supabase configuration');
    }
    
    console.log(`Supabase URL: ${supabaseUrl}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get coordinates from Mapbox
    const coordinates = await geocodeAddress(address);
    
    if (coordinates) {
      console.log(`Updating merchant ${merchant_id} with coordinates:`, coordinates);
      
      // Update merchant with coordinates
      const { error } = await supabase
        .from('Merchant')
        .update({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          geocoded_at: new Date().toISOString()
        })
        .eq('id', merchant_id);
      
      if (error) {
        console.error(`Failed to update coordinates for merchant ${merchant_id}:`, error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update database', details: error }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log(`Successfully geocoded and updated merchant ${merchant_id}:`, coordinates);
      return new Response(
        JSON.stringify({ success: true, coordinates }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.warn(`Failed to geocode merchant ${merchant_id}: ${address}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Geocoding failed - no coordinates found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR ===');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
