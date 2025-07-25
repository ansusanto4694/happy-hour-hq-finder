import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  text: string;
  context?: Array<{ id: string; text: string }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    // Use Mapbox Geocoding API for location suggestions
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=7&types=place,postcode,locality,neighborhood,poi&country=US`;
    
    console.log('Fetching location suggestions for:', query);
    
    const response = await fetch(mapboxUrl);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const suggestions = data.features.map((feature: any) => {
      // Determine location type for display
      let locationType = 'Location';
      if (feature.place_type.includes('place')) locationType = 'City';
      else if (feature.place_type.includes('neighborhood')) locationType = 'Neighborhood';
      else if (feature.place_type.includes('locality')) locationType = 'Area';
      else if (feature.place_type.includes('postcode')) locationType = 'ZIP Code';
      else if (feature.place_type.includes('poi')) locationType = 'Point of Interest';
      
      return {
        id: feature.id,
        place_name: feature.place_name,
        center: feature.center,
        place_type: feature.place_type,
        text: feature.text,
        location_type: locationType,
        context: feature.context
      };
    });

    console.log(`Found ${suggestions.length} suggestions for query: ${query}`);
    
    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in location-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});