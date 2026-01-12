import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { trackPageView } from "@/utils/analytics";
import { initPerformanceMonitoring } from "@/utils/performanceMonitoring";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ScrollRestoration } from "@/hooks/useScrollRestoration";
import { Loader2 } from "lucide-react";

// Lazy load all pages for better initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Results = lazy(() => import("./pages/Results"));
const RestaurantProfile = lazy(() => import("./pages/RestaurantProfile"));
const WriteReview = lazy(() => import("./pages/WriteReview"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthConfirm = lazy(() => import("./pages/AuthConfirm"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Account = lazy(() => import("./pages/Account"));
const LocationLanding = lazy(() => import("./pages/LocationLanding").then(m => ({ default: m.LocationLanding })));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Create query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Create persister for localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return null;
};

// URL Sanitizer: Fix malformed URLs where ? is encoded as %3F
// This handles edge cases where the Lovable preview iframe encodes query params incorrectly
const URLSanitizer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const { pathname, search, hash } = location;
    
    // Check if pathname contains encoded query string (e.g., /results%3Fsearch=pizza)
    if (pathname.includes('%3F') || pathname.includes('%3f')) {
      // Decode the pathname to get the actual path and query string
      const decodedPath = decodeURIComponent(pathname);
      const questionMarkIndex = decodedPath.indexOf('?');
      
      if (questionMarkIndex !== -1) {
        const actualPath = decodedPath.substring(0, questionMarkIndex);
        const encodedQueryString = decodedPath.substring(questionMarkIndex + 1); // Skip the ?
        
        // Parse the encoded query params and merge with existing search params
        const encodedParams = new URLSearchParams(encodedQueryString);
        const existingParams = new URLSearchParams(search);
        
        // Merge params, with encoded params taking priority (they're the intended ones)
        const mergedParams = new URLSearchParams();
        encodedParams.forEach((value, key) => mergedParams.set(key, value));
        // Add existing params that aren't duplicates (like __lovable_token)
        existingParams.forEach((value, key) => {
          if (!mergedParams.has(key)) {
            mergedParams.set(key, value);
          }
        });
        
        // Construct the correct URL for React Router navigation
        const correctedUrl = actualPath + '?' + mergedParams.toString() + hash;
        
        console.log('[URLSanitizer] Fixing malformed URL:', {
          original: pathname + search,
          corrected: correctedUrl
        });
        
        // Use React Router navigate with replace to avoid infinite loops
        // This stays within the SPA and doesn't trigger a full page reload
        navigate(correctedUrl, { replace: true });
      }
    }
  }, [location.pathname, navigate]);
  
  return null;
};

// Initialize performance monitoring once
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
}

const App = () => (
  <ErrorBoundary>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteTracker />
            <URLSanitizer />
            <ScrollRestoration />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/results" element={<Results />} />
                <Route path="/restaurant/:id" element={<RestaurantProfile />} />
                <Route path="/restaurant/:id/review" element={<WriteReview />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/account" element={<Account />} />
                <Route path="/happy-hour/:citySlug" element={<LocationLanding />} />
                <Route path="/happy-hour/:citySlug/:neighborhoodSlug" element={<LocationLanding />} />
                {/* Redirect for broken Facebook link typo */}
                <Route path="/We" element={<Navigate to="/" replace />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <MobileBottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
