import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";

const NotFound = () => {
  const location = useLocation();
  const { track } = useAnalytics();

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SEOHead 
        title="Page Not Found - SipMunchYap"
        description="The page you're looking for doesn't exist."
        canonical="https://sipmunchyap.com/404"
        noIndex={true}
      />
      
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
