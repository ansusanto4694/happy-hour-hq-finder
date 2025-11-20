import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  location?: string;
  businessType?: 'restaurant' | 'bar' | 'happy_hour';
  structuredData?: any;
  noIndex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "SipMunchYap - Find the Best Happy Hours Near You",
  description = "Discover amazing happy hour deals, great drinks, and perfect spots to unwind after work. Find the best happy hours near you!",
  keywords = "happy hour, drinks, bars, restaurants, deals, food, nightlife",
  canonical,
  ogImage = "https://lovable.dev/opengraph-image-p98pqg.png",
  location,
  businessType = 'happy_hour',
  structuredData,
  noIndex = false
}) => {
  const enhancedTitle = location ? `Happy Hour in ${location} - ${title}` : title;
  const enhancedDescription = location 
    ? `Find the best happy hour deals in ${location}. ${description}`
    : description;
  
  const enhancedKeywords = location 
    ? `${keywords}, happy hour ${location}, bars ${location}, drinks ${location}, ${location} restaurants`
    : keywords;

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SipMunchYap",
    "description": enhancedDescription,
    "url": typeof window !== 'undefined' ? window.location.origin : '',
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${typeof window !== 'undefined' ? window.location.origin : ''}/results?location={search_term_string}&category=happy-hour`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <title>{enhancedTitle}</title>
      <meta name="description" content={enhancedDescription} />
      <meta name="keywords" content={enhancedKeywords} />
      <meta name="author" content="SipMunchYap" />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={enhancedTitle} />
      <meta property="og:description" content={enhancedDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SipMunchYap" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@sipmunchyap" />
      <meta name="twitter:title" content={enhancedTitle} />
      <meta name="twitter:description" content={enhancedDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Local Business Schema */}
      {location && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "SipMunchYap",
            "description": enhancedDescription,
            "url": typeof window !== 'undefined' ? window.location.href : '',
            "serviceArea": {
              "@type": "Place",
              "name": location
            },
            "knowsAbout": [
              "Happy Hour",
              "Restaurant Deals",
              "Bar Specials",
              "Food and Drink"
            ]
          })}
        </script>
      )}
      
      {/* General Structured Data */}
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((schema, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )
      )}
      {!structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(defaultStructuredData)}
        </script>
      )}
    </Helmet>
  );
};