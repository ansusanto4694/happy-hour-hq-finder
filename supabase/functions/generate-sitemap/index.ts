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

    console.log('Generating dynamic sitemap...');

    // Fetch all active merchants
    const { data: merchants, error } = await supabase
      .from('Merchant')
      .select('id, restaurant_name, updated_at, city, state')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching merchants:', error);
      throw error;
    }

    console.log(`Found ${merchants?.length || 0} active merchants`);

    // Get current date for lastmod
    const currentDate = new Date().toISOString().split('T')[0];

    // Start building the sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    const staticPages = [
      { loc: 'https://sipmunchyap.com', priority: '1.0', changefreq: 'daily' },
      { loc: 'https://sipmunchyap.com/about', priority: '0.8', changefreq: 'monthly' },
      { loc: 'https://sipmunchyap.com/contact', priority: '0.7', changefreq: 'monthly' },
      { loc: 'https://sipmunchyap.com/results', priority: '0.9', changefreq: 'daily' },
    ];

    for (const page of staticPages) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${page.loc}</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += '  </url>\n';
    }

    // Add restaurant pages
    if (merchants && merchants.length > 0) {
      for (const merchant of merchants) {
        const lastmod = merchant.updated_at 
          ? new Date(merchant.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        sitemap += '  <url>\n';
        sitemap += `    <loc>https://sipmunchyap.com/restaurant/${merchant.id}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += '  </url>\n';
      }
    }

    // Close the sitemap
    sitemap += '</urlset>';

    console.log('Sitemap generated successfully');

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
