import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// --- Rate limiting (in-memory, per-isolate) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

const BLOCKED_UAS = [
  'python-requests', 'scrapy', 'curl/', 'wget/', 'httpie',
  'go-http-client', 'java/', 'libwww-perl', 'mechanize',
  'phantomjs', 'selenium', 'headlesschrome',
  'python-urllib', 'aiohttp', 'node-fetch',
];

const SEARCH_ENGINE_BOTS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider',
];

const MAX_RESULTS = 1000;

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';
}

function isBlockedUA(ua: string): boolean {
  const lower = ua.toLowerCase();
  if (SEARCH_ENGINE_BOTS.some(bot => lower.includes(bot))) return false;
  return BLOCKED_UAS.some(blocked => lower.includes(blocked));
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// --- Search utilities (replicated from client) ---
function generateSearchVariations(searchTerm: string): string[] {
  if (!searchTerm?.trim()) return [];
  const normalized = searchTerm.trim().toLowerCase();
  const variations = new Set<string>([normalized]);
  const words = normalized.split(/\s+/);

  const wordVariations = words.map(word => {
    const ws = new Set<string>([word]);
    if (word.endsWith('s') && word.length > 1) {
      if (word.endsWith('ies') && word.length > 3) ws.add(word.slice(0, -3) + 'y');
      else if (word.endsWith('es') && word.length > 2) { ws.add(word.slice(0, -2)); ws.add(word.slice(0, -1)); }
      else ws.add(word.slice(0, -1));
    }
    if (!word.endsWith('s')) {
      if (word.endsWith('y') && word.length > 1 && !'aeiou'.includes(word[word.length - 2]))
        ws.add(word.slice(0, -1) + 'ies');
      else if (word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z'))
        ws.add(word + 'es');
      else ws.add(word + 's');
    }
    return Array.from(ws);
  });

  const combine = (arrays: string[][], idx = 0): string[][] => {
    if (idx >= arrays.length) return [[]];
    const rest = combine(arrays, idx + 1);
    const result: string[][] = [];
    for (const item of arrays[idx]) for (const c of rest) result.push([item, ...c]);
    return result;
  };

  for (const c of combine(wordVariations)) variations.add(c.join(' '));
  return Array.from(variations).filter(v => v.trim().length > 0);
}

function createSearchConditions(searchTerm: string, field: string): string {
  return generateSearchVariations(searchTerm).map(v => `${field}.ilike.%${v}%`).join(',');
}

// --- Handlers ---

async function handleSearch(supabase: any, params: any) {
  const {
    searchTerm, categoryIds, bounds, neighborhood, carouselId,
    limit = MAX_RESULTS,
  } = params;

  const effectiveLimit = Math.min(limit, MAX_RESULTS);

  let merchantIds: number[] | null = null;

  // Carousel filter
  if (carouselId) {
    const { data: cm, error } = await supabase
      .from('carousel_merchants').select('merchant_id')
      .eq('carousel_id', carouselId).eq('is_active', true);
    if (error) throw error;
    merchantIds = cm?.map((c: any) => c.merchant_id) || [];
    if (merchantIds!.length === 0) return [];
  }

  // Search term
  if (searchTerm?.trim()) {
    const nameConditions = createSearchConditions(searchTerm.trim(), 'restaurant_name');
    const categoryConditions = createSearchConditions(searchTerm.trim(), 'name');
    const variations = generateSearchVariations(searchTerm.trim());
    const dealConditions = variations.flatMap(v => [
      `deal_title.ilike.%${v}%`, `deal_description.ilike.%${v}%`
    ]).join(',');

    const [nameRes, dealRes, catRes] = await Promise.all([
      supabase.from('Merchant').select('id').or(nameConditions).eq('is_active', true),
      supabase.from('happy_hour_deals').select('restaurant_id, Merchant!inner(is_active)')
        .or(dealConditions).eq('active', true).eq('Merchant.is_active', true),
      supabase.from('categories').select('id').or(categoryConditions),
    ]);

    if (nameRes.error) throw nameRes.error;
    if (dealRes.error) throw dealRes.error;
    if (catRes.error) throw catRes.error;

    let categoryMerchantIds: number[] = [];
    if (catRes.data?.length > 0) {
      const { data: mc, error } = await supabase
        .from('merchant_categories').select('merchant_id, Merchant!inner(is_active)')
        .in('category_id', catRes.data.map((c: any) => c.id))
        .eq('Merchant.is_active', true);
      if (error) throw error;
      categoryMerchantIds = mc?.map((m: any) => m.merchant_id) || [];
    }

    const nameIds = nameRes.data?.map((m: any) => m.id) || [];
    const dealIds = dealRes.data?.map((d: any) => d.restaurant_id) || [];
    const searchIds = [...new Set([...nameIds, ...dealIds, ...categoryMerchantIds])];

    if (merchantIds) {
      merchantIds = merchantIds.filter(id => searchIds.includes(id));
    } else {
      merchantIds = searchIds;
    }

    if (merchantIds.length === 0) return [];
  }

  // Category filter
  if (categoryIds?.length > 0) {
    const { data: fc, error } = await supabase
      .from('merchant_categories').select('merchant_id')
      .in('category_id', categoryIds);
    if (error) throw error;
    const catFilteredIds = fc?.map((m: any) => m.merchant_id) || [];
    if (merchantIds) {
      merchantIds = merchantIds.filter(id => catFilteredIds.includes(id));
    } else {
      merchantIds = catFilteredIds;
    }
    if (merchantIds.length === 0) return [];
  }

  // Main query
  let query = supabase
    .from('Merchant')
    .select(`
      id, restaurant_name, street_address, city, state, zip_code,
      latitude, longitude, logo_url, neighborhood, slug, is_active,
      merchant_happy_hour (id, day_of_week, happy_hour_start, happy_hour_end),
      happy_hour_deals (id, active, menu_type),
      merchant_categories (id, categories (id, name, slug, parent_id)),
      merchant_offers (id, is_active, end_time),
      merchant_reviews!left (id, status, merchant_review_ratings (rating)),
      merchant_google_ratings (google_rating, google_review_count, google_rating_url, match_confidence)
    `)
    .eq('is_active', true);

  if (merchantIds) query = query.in('id', merchantIds);
  if (neighborhood) query = query.ilike('neighborhood', neighborhood);
  if (bounds) {
    query = query
      .gte('latitude', bounds.south).lte('latitude', bounds.north)
      .gte('longitude', bounds.west).lte('longitude', bounds.east);
  }

  const { data, error } = await query.order('restaurant_name').limit(effectiveLimit);
  if (error) throw error;
  return data || [];
}

async function handleGet(supabase: any, params: any) {
  const { id, isNumericId } = params;
  if (!id) throw new Error('Restaurant identifier is required');

  let query = supabase
    .from('Merchant')
    .select(`
      *,
      merchant_happy_hour (id, day_of_week, happy_hour_start, happy_hour_end),
      merchant_categories (id, categories (id, name, slug, parent_id)),
      happy_hour_deals!happy_hour_deals_restaurant_id_fkey (id, deal_title, deal_description, active, menu_type),
      merchant_reviews!left (id, status, merchant_review_ratings (rating)),
      merchant_google_ratings (google_rating, google_review_count, match_confidence)
    `);

  if (isNumericId) {
    query = query.eq('id', parseInt(id, 10));
  } else {
    query = query.eq('slug', id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function handleCarousels(supabase: any) {
  const { data, error } = await supabase
    .from('homepage_carousels')
    .select(`
      id, name, description, display_order,
      carousel_merchants!inner (
        id, merchant_id, display_order,
        Merchant!inner (
          id, restaurant_name, street_address, street_address_line_2,
          city, state, zip_code, phone_number, website,
          latitude, longitude, logo_url, neighborhood, slug, is_active,
          merchant_happy_hour (day_of_week, happy_hour_start, happy_hour_end),
          happy_hour_deals (id, active, menu_type),
          merchant_reviews!left (id, status, merchant_review_ratings (rating)),
          merchant_google_ratings (google_rating, google_review_count, google_rating_url, match_confidence)
        )
      )
    `)
    .eq('is_active', true)
    .eq('carousel_merchants.is_active', true)
    .eq('carousel_merchants.Merchant.is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data || []).map((carousel: any) => ({
    ...carousel,
    merchants: (carousel.carousel_merchants || [])
      .map((cm: any) => ({ ...cm, merchant: cm.Merchant }))
      .sort((a: any, b: any) => a.display_order - b.display_order),
  }));
}

async function handleDeals(supabase: any, params: any) {
  const { restaurantId } = params;
  if (!restaurantId) throw new Error('restaurantId is required');

  const { data, error } = await supabase
    .from('happy_hour_deals')
    .select('id, deal_title, deal_description, active, is_verified, verified_at, source_url, source_label, menu_type')
    .eq('restaurant_id', restaurantId)
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function handleRatings(supabase: any, params: any) {
  const { merchantId } = params;
  if (!merchantId) throw new Error('merchantId is required');

  const [reviewsResult, googleResult] = await Promise.all([
    supabase
      .from('merchant_reviews')
      .select('id, ratings:merchant_review_ratings(rating)')
      .eq('merchant_id', merchantId)
      .eq('status', 'published'),
    supabase
      .from('merchant_google_ratings')
      .select('google_rating, google_review_count, google_rating_url, match_confidence')
      .eq('merchant_id', merchantId)
      .maybeSingle(),
  ]);

  if (reviewsResult.error) throw reviewsResult.error;
  return { reviews: reviewsResult.data || [], google: googleResult.data };
}

async function handleCategoriesWithMerchants(supabase: any) {
  const { data, error } = await supabase
    .from('merchant_categories')
    .select('category_id, Merchant!inner(is_active)')
    .eq('Merchant.is_active', true);

  if (error) throw error;
  const ids = data?.map((r: any) => r.category_id) || [];
  return [...new Set(ids)];
}

// --- Main handler ---
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ua = req.headers.get('user-agent') || '';
  if (isBlockedUA(ua)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { action, params = {} } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let result;
    switch (action) {
      case 'search':
        result = await handleSearch(supabase, params);
        break;
      case 'get':
        result = await handleGet(supabase, params);
        break;
      case 'carousels':
        result = await handleCarousels(supabase);
        break;
      case 'deals':
        result = await handleDeals(supabase, params);
        break;
      case 'ratings':
        result = await handleRatings(supabase, params);
        break;
      case 'categories_with_merchants':
        result = await handleCategoriesWithMerchants(supabase);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('merchant-api error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
