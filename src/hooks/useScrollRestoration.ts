import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_POSITIONS_KEY = 'scroll-positions';

// Disable browser's automatic scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

export const useScrollRestoration = () => {
  const location = useLocation();
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigationTypeRef = useRef<'push' | 'pop' | 'initial'>('initial');
  
  // Create a consistent key using pathname + search
  const locationKey = location.pathname + location.search;

  // Listen for popstate to detect back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      navigationTypeRef.current = 'pop';
    };
    
    // Intercept link clicks to save scroll immediately before navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
        // Save scroll position immediately before navigation
        const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
        positions[locationKey] = window.scrollY;
        sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
        navigationTypeRef.current = 'push';
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick, { capture: true });
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [locationKey]);

  // Debounced save of scroll position on every scroll
  const saveScrollPosition = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
      positions[locationKey] = window.scrollY;
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
    }, 100);
  }, [locationKey]);

  // Save scroll position on every scroll (debounced)
  useEffect(() => {
    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [saveScrollPosition]);

  // Handle scroll restoration on location change
  useEffect(() => {
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
    const savedPosition = positions[locationKey];

    if (navigationTypeRef.current === 'pop' && savedPosition !== undefined) {
      // Back/forward navigation - restore scroll position
      // Wait for DOM to be fully rendered
      const restoreScroll = () => {
        window.scrollTo(0, savedPosition);
      };
      
      // Try multiple times to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScroll();
          // Backup attempt after a short delay
          setTimeout(restoreScroll, 50);
        });
      });
    } else if (navigationTypeRef.current === 'push') {
      // New forward navigation - scroll to top
      window.scrollTo(0, 0);
    }
    // Don't do anything on 'initial' - let the browser handle initial load
    
    // Reset for next navigation (but not immediately, to allow effect to use the value)
    const resetTimeout = setTimeout(() => {
      if (navigationTypeRef.current !== 'initial') {
        navigationTypeRef.current = 'push'; // Default for next navigation
      }
    }, 100);
    
    return () => clearTimeout(resetTimeout);
  }, [locationKey]);
};

// Component version for use in App.tsx
export const ScrollRestoration = () => {
  useScrollRestoration();
  return null;
};
