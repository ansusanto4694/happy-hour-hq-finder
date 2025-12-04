import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  address: string;
  merchantId?: number; // Optional - for automatic database updates
}

interface GeocodeResponse {
  success: boolean;
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for database updates
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the user from the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    ).auth.getUser(token);

    if (userError || !user) {
      console.error('Invalid token or user not found:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`User ${user.id} attempting geocode operation`);

    // Check if the user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error(`User ${user.id} is not an admin:`, roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Admin user ${user.id} authorized for geocoding`);

    const { address, merchantId }: GeocodeRequest = await req.json();
    
    if (!address) {
      return new Response(
        JSON.stringify({ success: false, error: 'Address is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      console.error('MAPBOX_ACCESS_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Mapbox API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Geocoding address: ${address}${merchantId ? ` for merchant ${merchantId}` : ''}`);
    
    const encodedAddress = encodeURIComponent(address);
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1`;
    
    const response = await fetch(mapboxUrl);
    
    if (!response.ok) {
      console.error(`Mapbox API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Mapbox API error details: ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Geocoding failed: ${response.status}` 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      
      // Extract neighborhood from Mapbox context array
      let neighborhood: string | null = null;
      if (data.features[0].context) {
        // Mapbox context array contains hierarchical location data
        // Format: [{ id: "neighborhood.123", text: "Greenwich Village" }, ...]
        const neighborhoodContext = data.features[0].context.find(
          (ctx: any) => ctx.id.startsWith('neighborhood.')
        );
        
        if (neighborhoodContext) {
          neighborhood = neighborhoodContext.text;
          console.log(`Extracted neighborhood: ${neighborhood}`);
        } else {
          console.log('No neighborhood found in Mapbox response');
        }
      }
      
      console.log(`Successfully geocoded "${address}" to coordinates: ${latitude}, ${longitude}`);
      
      // If merchantId is provided, update the database automatically
      if (merchantId) {
        try {
          const { error: updateError } = await supabase
            .from('Merchant')
            .update({
              latitude: latitude,
              longitude: longitude,
              neighborhood: neighborhood,
              geocoded_at: new Date().toISOString()
            })
            .eq('id', merchantId);
          
          if (updateError) {
            console.error(`Failed to update merchant ${merchantId}:`, updateError);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Failed to update merchant coordinates: ${updateError.message}` 
              }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
          
          console.log(`Successfully updated merchant ${merchantId} with coordinates by admin ${user.id}`);
        } catch (dbError) {
          console.error(`Database error for merchant ${merchantId}:`, dbError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Database update failed' 
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
      
      const result: GeocodeResponse = {
        success: true,
        latitude,
        longitude,
        neighborhood: neighborhood || undefined,
      };
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.warn(`No results found for address: ${address}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No coordinates found for this address' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
  } catch (error) {
    console.error('Error in geocode-address function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during geocoding' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
