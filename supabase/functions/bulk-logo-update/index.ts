import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller has service role key
    const authHeader = req.headers.get("Authorization") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");
    if (token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    const { merchants } = await req.json();
    // merchants: [{ id: number, image_url: string }]

    const results = [];

    for (const merchant of merchants) {
      try {
        // Download image
        const imgRes = await fetch(merchant.image_url);
        if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
        const blob = await imgRes.blob();
        
        const ext = imgRes.headers.get("content-type")?.includes("png") ? "png" : "jpg";
        const filePath = `${merchant.id}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabaseAdmin.storage
          .from("restaurant-logos")
          .upload(filePath, blob, {
            cacheControl: "2592000",
            upsert: true,
            contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from("restaurant-logos")
          .getPublicUrl(filePath);

        // Update merchant
        const { error: updateError } = await supabaseAdmin
          .from("Merchant")
          .update({ logo_url: publicUrl })
          .eq("id", merchant.id);

        if (updateError) throw updateError;

        results.push({ id: merchant.id, status: "success", logo_url: publicUrl });
      } catch (err) {
        results.push({ id: merchant.id, status: "error", error: err.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
