import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_POSITIONS_KEY = 'scroll-positions';

export const useScrollRestoration = () => {
  const location = useLocation();
  const isNavigatingBack = useRef(false);
  
  // Create a consistent key using pathname + search (not location.key which changes)
  const locationKey = location.pathname + location.search;

  // Listen for popstate to detect back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      isNavigatingBack.current = true;
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save scroll position when leaving this route
  useEffect(() => {
    const saveScrollPosition = () => {
      const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
      positions[locationKey] = window.scrollY;
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
    };

    window.addEventListener('beforeunload', saveScrollPosition);
    
    return () => {
      saveScrollPosition();
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, [locationKey]);

  // Restore scroll position when navigating back, or scroll to top for new pages
  useEffect(() => {
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
    const savedPosition = positions[locationKey];

    if (isNavigatingBack.current && savedPosition !== undefined) {
      // Navigating back - restore position after DOM renders
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, savedPosition);
        });
      });
      isNavigatingBack.current = false;
    } else if (!isNavigatingBack.current) {
      // New navigation - scroll to top
      window.scrollTo(0, 0);
    }
  }, [locationKey]);
};

// Component version for use in App.tsx
export const ScrollRestoration = () => {
  useScrollRestoration();
  return null;
};
