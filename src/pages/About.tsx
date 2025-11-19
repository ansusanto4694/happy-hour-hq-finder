import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthButton } from '@/components/AuthButton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Footer } from '@/components/Footer';

const About = () => {
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
      <Footer />
    </div>
  );
};

export default About;