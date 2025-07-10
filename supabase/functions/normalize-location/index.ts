import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationData {
  canonical_city: string;
  canonical_state: string;
  latitude: number;
  longitude: number;
  original_input: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();
    
    if (!location || typeof location !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Location parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Normalizing location:', location);

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cachedResult } = await supabase
      .from('location_cache')
      .select('*')
      .eq('original_input', location.trim().toLowerCase())
      .maybeSingle();

    if (cachedResult) {
      console.log('Found cached result for:', location);
      return new Response(
        JSON.stringify({
          canonical_city: cachedResult.canonical_city,
          canonical_state: cachedResult.canonical_state,
          latitude: cachedResult.latitude,
          longitude: cachedResult.longitude,
          cached: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Mapbox Geocoding API
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN not configured');
    }

    const encodedLocation = encodeURIComponent(location);
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}&country=US&types=place,locality,neighborhood&limit=1`;
    
    console.log('Calling Mapbox API for:', location);
    const mapboxResponse = await fetch(mapboxUrl);
    
    if (!mapboxResponse.ok) {
      throw new Error(`Mapbox API error: ${mapboxResponse.status}`);
    }

    const mapboxData = await mapboxResponse.json();
    console.log('Mapbox response:', JSON.stringify(mapboxData, null, 2));

    if (!mapboxData.features || mapboxData.features.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Location not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const feature = mapboxData.features[0];
    const [longitude, latitude] = feature.center;
    
    // Extract city and state from the feature
    let canonicalCity = '';
    let canonicalState = '';
    
    // Mapbox context provides hierarchical location data
    for (const context of feature.context || []) {
      if (context.id.startsWith('place.')) {
        canonicalCity = context.text;
      } else if (context.id.startsWith('region.')) {
        canonicalState = context.short_code?.replace('us-', '').toUpperCase() || context.text;
      }
    }
    
    // If no context, use the place_name
    if (!canonicalCity && feature.place_name) {
      const parts = feature.place_name.split(', ');
      if (parts.length >= 2) {
        canonicalCity = parts[0];
        canonicalState = parts[1];
      }
    }

    // Normalize state format to match database (always use abbreviation)
    if (canonicalState === 'New York' || canonicalState === 'US-NY' || canonicalState.toLowerCase() === 'new york') {
      canonicalState = 'NY';
    }

    // Only normalize if user actually searches for "NYC" or "New York City"  
    // Don't normalize specific boroughs like Brooklyn, Manhattan, etc.
    if (canonicalCity.toLowerCase().includes('new york city') || canonicalCity.toLowerCase() === 'nyc') {
      canonicalCity = 'New York';
      canonicalState = 'NY';
    }

    const result: LocationData = {
      canonical_city: canonicalCity,
      canonical_state: canonicalState,
      latitude,
      longitude,
      original_input: location
    };

    // Cache the result
    const { error: cacheError } = await supabase
      .from('location_cache')
      .insert({
        original_input: location.trim().toLowerCase(),
        canonical_city: canonicalCity,
        canonical_state: canonicalState,
        latitude,
        longitude,
        created_at: new Date().toISOString()
      });

    if (cacheError) {
      console.error('Failed to cache result:', cacheError);
    } else {
      console.log('Cached result for:', location);
    }

    return new Response(
      JSON.stringify({
        canonical_city: canonicalCity,
        canonical_state: canonicalState,
        latitude,
        longitude,
        cached: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in normalize-location function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});