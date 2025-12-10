import React from 'react';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { SEOHead } from '@/components/SEOHead';

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SipMunchYap",
  "url": "https://sipmunchyap.com",
  "logo": "https://sipmunchyap.com/logo.png",
  "description": "SipMunchYap helps you discover the best happy hour deals at local restaurants and bars in NYC.",
  "foundingDate": "2024",
  "areaServed": {
    "@type": "City",
    "name": "New York"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "andrew@sipmunchyap.com",
    "contactType": "customer service"
  },
  "sameAs": []
};

const About = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex flex-col">
      <SEOHead 
        title="About SipMunchYap - Your Happy Hour Discovery Platform"
        description="Learn about SipMunchYap and our mission to help you discover the best happy hour deals in NYC. Find local restaurants and bars with amazing specials."
        keywords="about sipmunchyap, happy hour platform, restaurant discovery, bar finder"
        canonical="https://sipmunchyap.com/about"
        structuredData={organizationSchema}
      />
      
      
      {/* Header with logo, search bar, and navigation */}
      <PageHeader showSearchBar={true} searchBarVariant="results" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      {/* Main content - flex-grow to push footer down */}
      <div className="relative z-10 flex-grow flex items-center justify-center pt-40">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">About Us</h1>
          <div className="space-y-6 text-center">
            <p className="text-xl leading-relaxed text-white/90">
              Why is it so hard to figure out if a restaurant or bar has a happy hour?
            </p>
            
            <p className="text-2xl font-bold text-yellow-200">
              FRET NO MORE!
            </p>
            
            <p className="text-lg leading-relaxed text-white/90">
              SipMunchYap is the newest and greatest way to discover happy hours, deals, and offers from local restaurants and bars.
            </p>
            
            <p className="text-lg leading-relaxed text-white/90">
              If you found this, we're currently operating in beta. We're also operating only in NY! We'll be adding more restaurants and bars every single week, so be sure to check back in and see what's new!
            </p>
            
            <p className="text-lg leading-relaxed font-medium text-white">
              Start planning your next social outing with your homies so you can sip, munch, and yap!
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default About;