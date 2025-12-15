import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_POSITIONS_KEY = 'scroll-positions';

// Disable browser's automatic scroll restoration
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

export const useScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' for back/forward, 'PUSH' for new navigation
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasRestored = useRef(false);
  
  // Create a consistent key using pathname + search
  const locationKey = location.pathname + location.search;

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
      // Save final position on cleanup
      const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
      positions[locationKey] = window.scrollY;
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [saveScrollPosition, locationKey]);

  // Handle scroll restoration on location change
  useEffect(() => {
    // Reset restored flag for new location
    hasRestored.current = false;
    
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
    const savedPosition = positions[locationKey];

    if (navigationType === 'POP' && savedPosition !== undefined) {
      // Back/forward navigation - restore scroll position after render
      const restoreScroll = () => {
        if (!hasRestored.current) {
          window.scrollTo(0, savedPosition);
          hasRestored.current = true;
        }
      };
      
      // Multiple attempts to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreScroll);
      });
      setTimeout(restoreScroll, 100);
    } else if (navigationType === 'PUSH') {
      // New forward navigation - scroll to top
      window.scrollTo(0, 0);
    }
    // REPLACE navigations (like URL sanitizer) don't change scroll
  }, [locationKey, navigationType]);
};

// Component version for use in App.tsx
export const ScrollRestoration = () => {
  useScrollRestoration();
  return null;
};
