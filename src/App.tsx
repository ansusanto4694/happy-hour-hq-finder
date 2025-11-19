
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { trackPageView } from "@/utils/analytics";
import { initPerformanceMonitoring } from "@/utils/performanceMonitoring";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Results from "./pages/Results";
import RestaurantProfile from "./pages/RestaurantProfile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Sitemap from "./pages/Sitemap";
import NotFound from "./pages/NotFound";

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
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/results" element={<Results />} />
              <Route path="/restaurant/:id" element={<RestaurantProfile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/sitemap.xml" element={<Sitemap />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
