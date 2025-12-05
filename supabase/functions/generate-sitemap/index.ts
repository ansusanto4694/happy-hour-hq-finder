import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating dynamic sitemap with SEO-friendly slugs...');

    // Fetch all active merchants with neighborhoods and slugs
    const { data: merchants, error } = await supabase
      .from('Merchant')
      .select('id, restaurant_name, updated_at, city, state, neighborhood, slug')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching merchants:', error);
      throw error;
    }

    console.log(`Found ${merchants?.length || 0} active merchants`);

    // Extract unique city/neighborhood combinations
    const locationSet = new Set<string>();
    if (merchants && merchants.length > 0) {
      for (const merchant of merchants) {
        const citySlug = slugify(`${merchant.city}-${merchant.state}`);
        
        // Add city page
        locationSet.add(`city:${citySlug}`);
        
        // Add neighborhood page if available
        if (merchant.neighborhood) {
          const neighborhoodSlug = slugify(merchant.neighborhood);
          locationSet.add(`neighborhood:${citySlug}:${neighborhoodSlug}`);
        }
      }
    }

    console.log(`Found ${locationSet.size} unique location pages`);

    // Get current date for lastmod
    const currentDate = new Date().toISOString().split('T')[0];

    // Start building the sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add core static pages
    const staticPages = [
      { loc: 'https://sipmunchyap.com/', priority: '1.0', changefreq: 'daily' },
      { loc: 'https://sipmunchyap.com/about', priority: '0.7', changefreq: 'monthly' },
      { loc: 'https://sipmunchyap.com/contact', priority: '0.7', changefreq: 'monthly' },
    ];

    for (const page of staticPages) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${page.loc}</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += '  </url>\n';
    }

    // Add location landing pages (city and neighborhood)
    for (const location of locationSet) {
      if (location.startsWith('city:')) {
        const citySlug = location.replace('city:', '');
        sitemap += '  <url>\n';
        sitemap += `    <loc>https://sipmunchyap.com/happy-hour/${citySlug}</loc>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += `    <changefreq>daily</changefreq>\n`;
        sitemap += `    <priority>0.9</priority>\n`;
        sitemap += '  </url>\n';
      } else if (location.startsWith('neighborhood:')) {
        const parts = location.replace('neighborhood:', '').split(':');
        const citySlug = parts[0];
        const neighborhoodSlug = parts[1];
        sitemap += '  <url>\n';
        sitemap += `    <loc>https://sipmunchyap.com/happy-hour/${citySlug}/${neighborhoodSlug}</loc>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += `    <changefreq>daily</changefreq>\n`;
        sitemap += `    <priority>0.85</priority>\n`;
        sitemap += '  </url>\n';
      }
    }

    // Add restaurant pages using SEO-friendly slugs
    if (merchants && merchants.length > 0) {
      for (const merchant of merchants) {
        const lastmod = merchant.updated_at 
          ? new Date(merchant.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        // Use slug if available, fallback to ID
        const urlIdentifier = merchant.slug || merchant.id.toString();
        
        sitemap += '  <url>\n';
        sitemap += `    <loc>https://sipmunchyap.com/restaurant/${urlIdentifier}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += '  </url>\n';
      }
    }

    // Close the sitemap
    sitemap += '</urlset>';

    console.log('Sitemap generated successfully with SEO-friendly slugs');

    // Return the sitemap with proper XML content type
    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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
