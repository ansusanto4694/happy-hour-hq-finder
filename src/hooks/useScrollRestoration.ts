import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_POSITIONS_KEY = 'scroll-positions';

export const useScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Save scroll position before navigation
    const saveScrollPosition = () => {
      const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
      positions[location.key || location.pathname] = window.scrollY;
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
    };

    // Save on scroll (debounced via beforeunload and popstate)
    window.addEventListener('beforeunload', saveScrollPosition);
    
    return () => {
      // Save position when leaving this route
      saveScrollPosition();
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, [location.key, location.pathname]);

  useEffect(() => {
    // Restore scroll position when navigating back
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
    const savedPosition = positions[location.key || location.pathname];

    if (savedPosition !== undefined && window.history.state?.idx !== undefined) {
      // Small delay to ensure DOM is rendered
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    } else {
      // Scroll to top for new pages
      window.scrollTo(0, 0);
    }
  }, [location.key, location.pathname]);
};

// Component version for use in App.tsx
export const ScrollRestoration = () => {
  useScrollRestoration();
  return null;
};
