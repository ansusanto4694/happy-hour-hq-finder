import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'latitude and longitude are required numbers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'MAPBOX_ACCESS_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=place,locality,neighborhood,postcode&limit=5&country=US`;

    const resp = await fetch(url);
    let data: any = null;
    if (!resp.ok) {
      const primaryErr = await resp.text().catch(() => '');
      console.error('Mapbox primary error:', resp.status, primaryErr);
      // Fallback: simplify query (drop types) and reduce precision
      const fallbackUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude.toFixed(6)},${latitude.toFixed(6)}.json?access_token=${token}&limit=5&country=US`;
      const resp2 = await fetch(fallbackUrl);
      if (!resp2.ok) {
        const fallbackErr = await resp2.text().catch(() => '');
        return new Response(
          JSON.stringify({ error: `Mapbox error: ${resp.status}`, details: primaryErr, fallback_status: resp2.status, fallback_details: fallbackErr }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      data = await resp2.json();
    } else {
      data = await resp.json();
    }

    const features = Array.isArray(data?.features) ? data.features : [];
    const feature = features.find((f: any) => Array.isArray(f.place_type) && f.place_type.includes('neighborhood'))
      || features.find((f: any) => Array.isArray(f.place_type) && f.place_type.includes('locality'))
      || features.find((f: any) => Array.isArray(f.place_type) && f.place_type.includes('place'))
      || features[0];

    if (!feature) {
      return new Response(
        JSON.stringify({ error: 'No reverse geocode result' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine city, region, and postal code from context
    let city = '';
    let region = '';
    let postalCode = '';
    let locationType = 'place';

    if (Array.isArray(feature.place_type) && feature.place_type.includes('neighborhood')) {
      locationType = 'neighborhood';
    } else if (Array.isArray(feature.place_type) && feature.place_type.includes('locality')) {
      locationType = 'locality';
    } else if (Array.isArray(feature.place_type) && feature.place_type.includes('postcode')) {
      locationType = 'postcode';
    }

    // Prefer borough/locality when available (e.g., Brooklyn over New York)
    let cityLocality = '';
    let cityPlace = '';

    for (const ctx of feature.context || []) {
      if (ctx.id?.startsWith('locality.')) cityLocality = ctx.text;
      if (ctx.id?.startsWith('place.')) cityPlace = ctx.text;
      if (ctx.id?.startsWith('region.')) {
        const short = (ctx.short_code || '').replace(/us-/i, '');
        region = (short || ctx.text || '').toUpperCase();
      }
      if (ctx.id?.startsWith('postcode.')) {
        postalCode = ctx.text;
      }
    }

    if (Array.isArray(feature.place_type) && feature.place_type.includes('locality') && feature.text) {
      city = feature.text;
    } else if (cityLocality) {
      city = cityLocality;
    } else if (!city && cityPlace) {
      city = cityPlace;
    }

    // Fallbacks
    if (!city && feature.text) city = feature.text;
    if (!region && feature.place_name) {
      const parts = String(feature.place_name).split(', ').map((p: string) => p.trim());
      if (parts.length >= 2) region = parts[1].toUpperCase();
    }
    // If postal code still missing, look for a postcode feature among results
    if (!postalCode) {
      const postcodeFeature = features.find((f: any) => Array.isArray(f.place_type) && f.place_type.includes('postcode'));
      if (postcodeFeature?.text) {
        postalCode = postcodeFeature.text;
      }
    }

    // Normalize common US state name to postal abbreviation when obvious
    // Mapbox sometimes provides full state names in ctx.text; convert popular ones we rely on
    const usStateMap: Record<string, string> = {
      'NEW YORK': 'NY',
      'CALIFORNIA': 'CA',
      'TEXAS': 'TX',
      'FLORIDA': 'FL',
      'ILLINOIS': 'IL',
      'PENNSYLVANIA': 'PA',
      'OHIO': 'OH',
      'GEORGIA': 'GA',
      'NORTH CAROLINA': 'NC',
      'MICHIGAN': 'MI',
    };
    if (usStateMap[region]) {
      region = usStateMap[region];
    }


    return new Response(
      JSON.stringify({
        city,
        region,
        place_name: feature.place_name,
        latitude,
        longitude,
        postal_code: postalCode,
        location_type: locationType,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('reverse-geocode error:', e);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
