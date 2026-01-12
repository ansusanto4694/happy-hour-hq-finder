import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://sipmunchyap.com';
const FUNCTION_URL = 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/generate-sitemap';

interface Merchant {
  id: number;
  restaurant_name: string;
  updated_at: string;
  city: string;
  state: string;
  neighborhood: string | null;
  slug: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateSitemapIndex(currentDate: string): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const sitemapTypes = ['static', 'cities', 'neighborhoods', 'restaurants'];
  
  for (const type of sitemapTypes) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${FUNCTION_URL}?type=${type}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  
  xml += '</sitemapindex>';
  return xml;
}

function generateStaticSitemap(currentDate: string): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const staticPages = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${BASE_URL}/about`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${BASE_URL}/contact`, priority: '0.7', changefreq: 'monthly' },
  ];
  
  for (const page of staticPages) {
    xml += '  <url>\n';
    xml += `    <loc>${page.loc}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

function generateCitiesSitemap(merchants: Merchant[], currentDate: string): string {
  const citySet = new Set<string>();
  
  for (const merchant of merchants) {
    const citySlug = slugify(`${merchant.city}-${merchant.state}`);
    citySet.add(citySlug);
  }
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const citySlug of citySet) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/happy-hour/${citySlug}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

function generateNeighborhoodsSitemap(merchants: Merchant[], currentDate: string): string {
  const neighborhoodSet = new Set<string>();
  
  for (const merchant of merchants) {
    if (merchant.neighborhood) {
      const citySlug = slugify(`${merchant.city}-${merchant.state}`);
      const neighborhoodSlug = slugify(merchant.neighborhood);
      neighborhoodSet.add(`${citySlug}/${neighborhoodSlug}`);
    }
  }
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const path of neighborhoodSet) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/happy-hour/${path}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

function generateRestaurantsSitemap(merchants: Merchant[], currentDate: string): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const merchant of merchants) {
    const lastmod = merchant.updated_at 
      ? new Date(merchant.updated_at).toISOString().split('T')[0]
      : currentDate;
    
    const urlIdentifier = merchant.slug || merchant.id.toString();
    
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/restaurant/${urlIdentifier}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sitemapType = url.searchParams.get('type');
    const currentDate = getCurrentDate();

    console.log(`Sitemap request received: type=${sitemapType || 'index'}`);

    // If no type specified, return the sitemap index
    if (!sitemapType) {
      console.log('Generating sitemap index');
      const xml = generateSitemapIndex(currentDate);
      return new Response(xml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // For static sitemap, no database query needed
    if (sitemapType === 'static') {
      console.log('Generating static sitemap (3 URLs)');
      const xml = generateStaticSitemap(currentDate);
      return new Response(xml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400', // 24 hours for static
        },
      });
    }

    // For other types, we need merchant data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: merchants, error } = await supabase
      .from('Merchant')
      .select('id, restaurant_name, updated_at, city, state, neighborhood, slug')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching merchants:', error);
      throw error;
    }

    console.log(`Fetched ${merchants?.length || 0} active merchants`);

    let xml: string;
    let cacheControl = 'public, max-age=3600'; // 1 hour default

    switch (sitemapType) {
      case 'cities': {
        const cityCount = new Set(merchants?.map(m => slugify(`${m.city}-${m.state}`)) || []).size;
        console.log(`Generating cities sitemap (${cityCount} URLs)`);
        xml = generateCitiesSitemap(merchants || [], currentDate);
        break;
      }
      case 'neighborhoods': {
        const neighborhoodCount = new Set(
          merchants?.filter(m => m.neighborhood).map(m => {
            const citySlug = slugify(`${m.city}-${m.state}`);
            const neighborhoodSlug = slugify(m.neighborhood!);
            return `${citySlug}/${neighborhoodSlug}`;
          }) || []
        ).size;
        console.log(`Generating neighborhoods sitemap (${neighborhoodCount} URLs)`);
        xml = generateNeighborhoodsSitemap(merchants || [], currentDate);
        break;
      }
      case 'restaurants': {
        console.log(`Generating restaurants sitemap (${merchants?.length || 0} URLs)`);
        xml = generateRestaurantsSitemap(merchants || [], currentDate);
        cacheControl = 'public, max-age=7200'; // 2 hours for restaurants
        break;
      }
      default:
        console.error(`Invalid sitemap type: ${sitemapType}`);
        return new Response(
          JSON.stringify({ error: `Invalid sitemap type: ${sitemapType}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': cacheControl,
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
