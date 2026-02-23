import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Haversine distance in meters
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getConfidence(distanceMeters: number): string {
  if (distanceMeters <= 100) return "high";
  if (distanceMeters <= 500) return "medium";
  if (distanceMeters <= 2000) return "low";
  return "no_match";
}

interface MerchantRow {
  id: number;
  restaurant_name: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

async function fetchGoogleRating(merchant: MerchantRow) {
  const query = `${merchant.restaurant_name} ${merchant.city} ${merchant.state}`;

  const body: any = {
    textQuery: query,
    maxResultCount: 1,
  };

  if (merchant.latitude && merchant.longitude) {
    body.locationBias = {
      circle: {
        center: {
          latitude: merchant.latitude,
          longitude: merchant.longitude,
        },
        radius: 500.0,
      },
    };
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.rating,places.userRatingCount,places.googleMapsUri,places.location",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Google API error for merchant ${merchant.id}: ${response.status} ${errorText}`
    );
    return null;
  }

  const data = await response.json();
  const place = data.places?.[0];
  if (!place) {
    console.log(`No Google Places result for merchant ${merchant.id}`);
    return null;
  }

  let confidence = "no_match";
  if (merchant.latitude && merchant.longitude && place.location) {
    const dist = haversineMeters(
      merchant.latitude,
      merchant.longitude,
      place.location.latitude,
      place.location.longitude
    );
    confidence = getConfidence(dist);
  }

  return {
    merchant_id: merchant.id,
    google_place_id: place.id || null,
    google_rating: place.rating || null,
    google_review_count: place.userRatingCount || null,
    google_rating_url: place.googleMapsUri || null,
    match_confidence: confidence,
    fetched_at: new Date().toISOString(),
  };
}

async function processMerchants(
  supabase: any,
  merchants: MerchantRow[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const merchant of merchants) {
    try {
      const result = await fetchGoogleRating(merchant);
      if (result) {
        const { error: upsertError } = await supabase
          .from("merchant_google_ratings")
          .upsert(result, { onConflict: "merchant_id" });

        if (upsertError) {
          console.error(`Upsert error for ${merchant.id}:`, upsertError);
          failed++;
        } else {
          success++;
        }
      } else {
        failed++;
      }
      // Rate limiting: 100ms between requests
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      console.error(`Error processing merchant ${merchant.id}:`, e);
      failed++;
    }
  }

  return { success, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { merchantId, mode, batchSize = 50 } = await req.json();

    if (mode === "backfill") {
      // Get merchants with no google rating entry
      const { data: existingRatings } = await supabase
        .from("merchant_google_ratings")
        .select("merchant_id");

      const existingIds =
        existingRatings?.map((r: any) => r.merchant_id) || [];

      let query = supabase
        .from("Merchant")
        .select("id, restaurant_name, city, state, latitude, longitude")
        .eq("is_active", true)
        .order("id", { ascending: true })
        .limit(batchSize);

      if (existingIds.length > 0) {
        query = query.not("id", "in", `(${existingIds.join(",")})`);
      }

      const { data: merchants, error: merchantError } = await query;
      if (merchantError) throw merchantError;

      const totalRemaining = (() => {
        // We can't easily count with the filter, so estimate
        return merchants?.length || 0;
      })();

      const { success, failed } = await processMerchants(
        supabase,
        merchants || []
      );

      // Check how many remain after this batch
      const { count: remainingCount } = await supabase
        .from("Merchant")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .not(
          "id",
          "in",
          `(${[...existingIds, ...(merchants || []).map((m: any) => m.id)].join(",")})`
        );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Batch complete. Success: ${success}, Failed: ${failed}`,
          results: {
            success,
            failed,
            total: (merchants || []).length,
            remaining: remainingCount || 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "refresh") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: staleRatings } = await supabase
        .from("merchant_google_ratings")
        .select("merchant_id")
        .lt("fetched_at", thirtyDaysAgo.toISOString());

      const staleIds = staleRatings?.map((r: any) => r.merchant_id) || [];

      if (staleIds.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "No stale ratings to refresh.",
            results: { success: 0, failed: 0, total: 0, remaining: 0 },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: merchants, error: merchantError } = await supabase
        .from("Merchant")
        .select("id, restaurant_name, city, state, latitude, longitude")
        .in("id", staleIds.slice(0, batchSize));

      if (merchantError) throw merchantError;

      const { success, failed } = await processMerchants(
        supabase,
        merchants || []
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Refresh complete. Success: ${success}, Failed: ${failed}`,
          results: {
            success,
            failed,
            total: (merchants || []).length,
            remaining: Math.max(0, staleIds.length - batchSize),
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single merchant mode
    if (!merchantId) {
      return new Response(
        JSON.stringify({ error: "merchantId or mode required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: merchant, error: merchantError } = await supabase
      .from("Merchant")
      .select("id, restaurant_name, city, state, latitude, longitude")
      .eq("id", merchantId)
      .single();

    if (merchantError || !merchant) {
      return new Response(
        JSON.stringify({ error: "Merchant not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await fetchGoogleRating(merchant);
    if (!result) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No Google Places match found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: upsertError } = await supabase
      .from("merchant_google_ratings")
      .upsert(result, { onConflict: "merchant_id" });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
