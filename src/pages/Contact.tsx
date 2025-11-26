import React, { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { SEOHead } from '@/components/SEOHead';
import { MobilePageHeader } from '@/components/MobilePageHeader';
import { useIsMobile } from '@/hooks/use-mobile';

const Contact = () => {
  const { trackPage } = useAnalytics();
  const isMobile = useIsMobile();

  useEffect(() => {
    trackPage();
  }, [trackPage]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex flex-col">
      <SEOHead 
        title="Contact SipMunchYap - Get in Touch"
        description="Have questions or want to list your restaurant? Contact SipMunchYap to learn more about our happy hour platform and business opportunities."
        keywords="contact sipmunchyap, restaurant listings, bar partnerships"
        canonical="https://sipmunchyap.com/contact"
      />
      
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Header with logo, search bar, and navigation */}
      {isMobile ? (
        <MobilePageHeader title="Contact" />
      ) : (
        <PageHeader showSearchBar={true} searchBarVariant="results" />
      )}
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      {/* Main content - flex-grow to push footer down */}
      <div className={`relative z-10 flex-grow flex items-center justify-center ${isMobile ? 'pt-20 pb-20' : 'pt-32'}`}>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Contact Us</h1>
          <div className="space-y-6 text-center">
            <p className="text-xl leading-relaxed text-white font-medium">
              Contact me at <a href="mailto:andrew@sipmunchyap.com" className="text-yellow-200 hover:text-yellow-100 transition-colors underline">andrew@sipmunchyap.com</a>
            </p>
            
            <p className="text-lg leading-relaxed text-white/90">
              Please submit any feedback you have! I'd love to hear if you found our website helpful or useful.
            </p>
            
            <p className="text-lg leading-relaxed text-white/90">
              If you own a restaurant or bar and want to be listed on our platform or if you want to claim your listing, please email me so I can assist you!
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

export default Contact;