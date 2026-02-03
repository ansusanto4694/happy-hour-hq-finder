import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - loaded on every page
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Data fetching - loaded early but can be deferred
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-persist-client', '@tanstack/query-sync-storage-persister'],
          // Supabase client - loaded for authenticated features
          'supabase-vendor': ['@supabase/supabase-js'],
          // UI components - loaded progressively
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          // Map - only loaded on results page
          'map-vendor': ['mapbox-gl', 'react-map-gl'],
          // Date utilities - used throughout
          'date-vendor': ['date-fns'],
          // Charts - only loaded on analytics page
          'charts-vendor': ['recharts'],
          // Carousel - loaded after initial paint
          'carousel-vendor': ['embla-carousel-react'],
        },
      },
    },
    // Increase chunk size warning limit for vendor chunks
    chunkSizeWarningLimit: 600,
  },
}));
