import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://sipmunchyap.lovable.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const SITE_NAME = "SipMunchYap";

interface MetaData {
  title: string;
  description: string;
  ogImage: string;
  canonicalUrl: string;
  structuredData?: Record<string, unknown>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtml(meta: MetaData, redirectUrl: string): string {
  const safeTitle = escapeHtml(meta.title);
  const safeDescription = escapeHtml(meta.description);
  const jsonLd = meta.structuredData
    ? `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${meta.ogImage}">
  <meta property="og:url" content="${meta.canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${meta.ogImage}">
  <link rel="canonical" href="${meta.canonicalUrl}">
  ${jsonLd}
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body>
  <p>Redirecting to <a href="${redirectUrl}">${safeTitle}</a>...</p>
  <script>window.location.replace("${redirectUrl}");</script>
</body>
</html>`;
}

async function getRestaurantMeta(
  supabase: ReturnType<typeof createClient>,
  slug: string
): Promise<MetaData | null> {
  // Try slug first, then try as numeric ID
  let query = supabase
    .from("Merchant")
    .select("id, restaurant_name, city, state, neighborhood, logo_url, street_address, zip_code, latitude, longitude, slug")
    .eq("is_active", true);

  const isNumeric = /^\d+$/.test(slug);
  if (isNumeric) {
    query = query.eq("id", parseInt(slug, 10));
  } else {
    query = query.eq("slug", slug);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;

  const locationParts = [data.neighborhood, data.city, data.state].filter(Boolean);
  const location = locationParts.join(", ");
  const canonicalSlug = data.slug || data.id;

  const title = `${data.restaurant_name} - Happy Hour in ${data.city}, ${data.state} | ${SITE_NAME}`;
  const description = `Find happy hour deals at ${data.restaurant_name} in ${location}. Check hours, menu, and location details on ${SITE_NAME}.`;

  const address: Record<string, string> = {
    "@type": "PostalAddress",
    streetAddress: data.street_address,
    addressLocality: data.city,
    addressRegion: data.state,
    postalCode: data.zip_code,
    addressCountry: "US",
  };

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: data.restaurant_name,
    address,
    url: `${SITE_URL}/restaurant/${canonicalSlug}`,
  };

  if (data.logo_url) {
    structuredData.image = data.logo_url;
  }
  if (data.latitude && data.longitude) {
    structuredData.geo = {
      "@type": "GeoCoordinates",
      latitude: data.latitude.toString(),
      longitude: data.longitude.toString(),
    };
  }

  return {
    title,
    description,
    ogImage: data.logo_url || DEFAULT_OG_IMAGE,
    canonicalUrl: `${SITE_URL}/restaurant/${canonicalSlug}`,
    structuredData,
  };
}

function getLocationMeta(citySlug: string, neighborhoodSlug?: string): MetaData {
  // Convert slugs to display names
  const city = citySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (neighborhoodSlug) {
    const neighborhood = neighborhoodSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      title: `Happy Hour in ${neighborhood}, ${city} | ${SITE_NAME}`,
      description: `Discover the best happy hour deals in ${neighborhood}, ${city}. Find bars and restaurants with drink specials near you.`,
      ogImage: DEFAULT_OG_IMAGE,
      canonicalUrl: `${SITE_URL}/happy-hour/${citySlug}/${neighborhoodSlug}`,
    };
  }

  return {
    title: `Happy Hour in ${city} | ${SITE_NAME}`,
    description: `Find the best happy hour deals in ${city}. Browse bars and restaurants with drink specials, food deals, and more.`,
    ogImage: DEFAULT_OG_IMAGE,
    canonicalUrl: `${SITE_URL}/happy-hour/${citySlug}`,
  };
}

function getDefaultMeta(): MetaData {
  return {
    title: `${SITE_NAME} - Find the Best Happy Hours Near You`,
    description:
      "Discover amazing happy hour deals, great drinks, and perfect spots to unwind after work. Find the best happy hours near you!",
    ogImage: DEFAULT_OG_IMAGE,
    canonicalUrl: SITE_URL,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";

    // Collect UTM params to forward
    const utmParams = new URLSearchParams();
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const val = url.searchParams.get(key);
      if (val) utmParams.set(key, val);
    }

    let meta: MetaData;

    // Parse the path to determine page type
    const restaurantMatch = path.match(/^\/restaurant\/(.+)$/);
    const locationMatch = path.match(/^\/happy-hour\/([^/]+)(?:\/([^/]+))?$/);

    if (restaurantMatch) {
      const slug = restaurantMatch[1];
      const isNumeric = /^\d+$/.test(slug);
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // If numeric ID, look up the slug and issue a 301 redirect
      if (isNumeric) {
        const { data } = await supabase
          .from("Merchant")
          .select("slug")
          .eq("id", parseInt(slug, 10))
          .eq("is_active", true)
          .maybeSingle();

        if (data?.slug) {
          const redirectTarget = new URL(`${SITE_URL}/restaurant/${data.slug}`);
          utmParams.forEach((val, key) => redirectTarget.searchParams.set(key, val));
          return new Response(null, {
            status: 301,
            headers: {
              ...corsHeaders,
              "Location": redirectTarget.toString(),
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }

      const restaurantMeta = await getRestaurantMeta(supabase, slug);
      meta = restaurantMeta || getDefaultMeta();
    } else if (locationMatch) {
      meta = getLocationMeta(locationMatch[1], locationMatch[2]);
    } else {
      meta = getDefaultMeta();
    }

    // Build redirect URL with UTM params
    const redirectUrl = new URL(meta.canonicalUrl);
    utmParams.forEach((val, key) => redirectUrl.searchParams.set(key, val));

    const html = buildHtml(meta, redirectUrl.toString());

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("og-meta error:", err);

    // Fallback: redirect to homepage
    const html = buildHtml(getDefaultMeta(), SITE_URL);
    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
});
