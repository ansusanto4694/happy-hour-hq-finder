import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthButton } from '@/components/AuthButton';
import { useAnalytics } from '@/hooks/useAnalytics';

const Contact = () => {
  const { trackPage } = useAnalytics();

  useEffect(() => {
    trackPage();
  }, [trackPage]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Header with company name and navigation */}
      <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-20 flex justify-between items-center">
        <Link to="/" className="text-xl sm:text-2xl md:text-3xl font-bold text-white hover:text-yellow-200 transition-colors">
          SipMunchYap
        </Link>
        <nav className="flex items-center space-x-4 md:space-x-6">
          <Link 
            to="/about" 
            className="text-white/90 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            About
          </Link>
          <Link 
            to="/contact" 
            className="text-white/90 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Contact
          </Link>
          <AuthButton />
        </nav>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
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
  );
};

export default Contact;