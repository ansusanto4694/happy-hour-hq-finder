import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationSuggestion {
  id: string;
  place_name: string;
  place_type: string[];
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

interface MapboxResponse {
  features: Array<{
    id: string;
    place_name: string;
    place_type: string[];
    center: [number, number];
    context?: Array<{ id: string; text: string }>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      console.error('MAPBOX_ACCESS_TOKEN not found');
      return new Response(JSON.stringify({ error: 'Mapbox token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build Mapbox Geocoding API URL
    const encodedQuery = encodeURIComponent(query.trim());
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
      `access_token=${mapboxToken}&` +
      `limit=7&` +
      `types=country,region,postcode,district,place,locality,neighborhood,address,poi&` +
      `country=US&` +
      `autocomplete=true`;

    console.log('Fetching suggestions for query:', query);

    const response = await fetch(mapboxUrl);
    
    if (!response.ok) {
      console.error('Mapbox API error:', response.status, response.statusText);
      return new Response(JSON.stringify({ error: 'Failed to fetch suggestions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data: MapboxResponse = await response.json();

    // Transform and filter suggestions
    const suggestions: LocationSuggestion[] = data.features
      .filter(feature => {
        // Include neighborhoods, landmarks (POI), cities, states
        const relevantTypes = ['neighborhood', 'poi', 'place', 'locality', 'district', 'region'];
        return feature.place_type.some(type => relevantTypes.includes(type));
      })
      .map(feature => ({
        id: feature.id,
        place_name: feature.place_name,
        place_type: feature.place_type,
        center: feature.center,
        context: feature.context
      }))
      .slice(0, 7); // Ensure max 7 results

    console.log(`Found ${suggestions.length} suggestions for "${query}"`);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in location-suggestions function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});