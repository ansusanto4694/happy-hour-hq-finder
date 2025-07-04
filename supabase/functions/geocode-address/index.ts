
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
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      return { latitude, longitude };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { merchant_id, address } = await req.json();
    
    console.log(`Geocoding merchant ${merchant_id}: ${address}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get coordinates from Mapbox
    const coordinates = await geocodeAddress(address);
    
    if (coordinates) {
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
          JSON.stringify({ success: false, error: 'Failed to update database' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log(`Successfully geocoded merchant ${merchant_id}:`, coordinates);
      return new Response(
        JSON.stringify({ success: true, coordinates }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.warn(`Failed to geocode merchant ${merchant_id}: ${address}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Geocoding failed' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
