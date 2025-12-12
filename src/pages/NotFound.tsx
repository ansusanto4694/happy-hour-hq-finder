import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PageHeader } from "@/components/PageHeader";
import { Footer } from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const isMobile = useIsMobile();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const { pathname, search, hash } = location;
    
    // Check if pathname contains encoded query string (e.g., /results%3Fsearch=pizza)
    if (pathname.includes('%3F') || pathname.includes('%3f')) {
      const decodedPath = decodeURIComponent(pathname);
      const questionMarkIndex = decodedPath.indexOf('?');
      
      if (questionMarkIndex !== -1) {
        const actualPath = decodedPath.substring(0, questionMarkIndex);
        const encodedQueryString = decodedPath.substring(questionMarkIndex + 1);
        
        // Parse and merge params
        const encodedParams = new URLSearchParams(encodedQueryString);
        const existingParams = new URLSearchParams(search);
        const mergedParams = new URLSearchParams();
        
        encodedParams.forEach((value, key) => mergedParams.set(key, value));
        existingParams.forEach((value, key) => {
          if (!mergedParams.has(key)) {
            mergedParams.set(key, value);
          }
        });
        
        const correctedUrl = actualPath + '?' + mergedParams.toString() + hash;
        
        console.log('[NotFound] Fixing malformed URL:', {
          original: pathname + search,
          corrected: correctedUrl
        });
        
        setIsRedirecting(true);
        navigate(correctedUrl, { replace: true });
        return;
      }
    }
    
    // Only log 404 if we're not redirecting
    if (!isRedirecting) {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        pathname
      );
      
      track({
        eventType: 'error',
        eventCategory: 'app_error',
        eventAction: '404_page_view',
        metadata: {
          attemptedPath: pathname
        }
      });
    }
  }, [location.pathname, location.search, location.hash, navigate, track, isRedirecting]);

  // Don't render 404 page if we're redirecting
  if (isRedirecting) {
    return null;
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <SEOHead 
          title="Page Not Found - SipMunchYap"
          description="The page you're looking for doesn't exist."
          canonical="https://sipmunchyap.com/404"
          noIndex={true}
        />
        
        {!isMobile && <PageHeader />}
        
        <div className={`flex-1 flex items-center justify-center ${isMobile ? 'px-4' : 'pt-40'}`}>
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl max-w-md mx-auto">
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default NotFound;
