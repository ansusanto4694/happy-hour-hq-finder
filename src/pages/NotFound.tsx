import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PageHeader } from "@/components/PageHeader";
import { Footer } from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { track } = useAnalytics();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Track 404 event
    track({
      eventType: 'error',
      eventCategory: 'app_error',
      eventAction: '404_page_view',
      metadata: {
        attemptedPath: location.pathname
      }
    });
  }, [location.pathname, track]);

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
        
        <div className={`flex-1 flex items-center justify-center ${isMobile ? 'px-4' : 'pt-32'}`}>
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
