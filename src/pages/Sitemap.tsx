import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Sitemap = () => {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        console.log('Fetching sitemap from edge function...');
        
        const { data, error } = await supabase.functions.invoke('generate-sitemap', {
          method: 'GET',
        });

        if (error) {
          console.error('Error fetching sitemap:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        // The response should be XML text
        const xmlText = typeof data === 'string' ? data : new XMLSerializer().serializeToString(data);
        setSitemapXml(xmlText);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sitemap:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sitemap');
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  // Set document content type to XML
  useEffect(() => {
    if (sitemapXml) {
      // Update the document to show XML
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${sitemapXml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
      
      return () => {
        document.body.innerHTML = originalContent;
      };
    }
  }, [sitemapXml]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sitemap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading sitemap</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return null; // The XML is rendered directly in the useEffect
};

export default Sitemap;
