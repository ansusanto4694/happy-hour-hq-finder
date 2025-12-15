import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_POSITIONS_KEY = 'scroll-positions';

// Disable browser's automatic scroll restoration
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

export const useScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const restoreAttempts = useRef<NodeJS.Timeout[]>([]);
  
  // Create a consistent key using pathname + search
  const locationKey = location.pathname + location.search;

  // Debug: Log navigation info
  console.log('[ScrollRestoration] Navigation:', {
    locationKey,
    navigationType,
    currentScroll: typeof window !== 'undefined' ? window.scrollY : 0
  });

  // Debounced save of scroll position on every scroll
  const saveScrollPosition = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
      positions[locationKey] = window.scrollY;
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
      console.log('[ScrollRestoration] Saved position:', { locationKey, position: window.scrollY });
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
      console.log('[ScrollRestoration] Cleanup - saved position:', { locationKey, position: window.scrollY });
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [saveScrollPosition, locationKey]);

  // Handle scroll restoration on location change
  useEffect(() => {
    // Clear any pending restore attempts from previous navigation
    restoreAttempts.current.forEach(clearTimeout);
    restoreAttempts.current = [];
    
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
    const savedPosition = positions[locationKey];

    console.log('[ScrollRestoration] Restore check:', {
      locationKey,
      navigationType,
      savedPosition,
      allPositions: positions
    });

    if (navigationType === 'POP' && savedPosition !== undefined && savedPosition > 0) {
      console.log('[ScrollRestoration] Attempting to restore to:', savedPosition);
      
      // Back/forward navigation - restore scroll position
      const restoreScroll = () => {
        const before = window.scrollY;
        window.scrollTo(0, savedPosition);
        console.log('[ScrollRestoration] Restore attempt:', { before, after: window.scrollY, target: savedPosition });
      };
      
      // Attempt restoration at multiple intervals to handle async data loading
      const delays = [0, 50, 150, 300, 500, 1000];
      delays.forEach(delay => {
        const timeout = setTimeout(restoreScroll, delay);
        restoreAttempts.current.push(timeout);
      });
    } else if (navigationType === 'PUSH') {
      console.log('[ScrollRestoration] PUSH navigation - scrolling to top');
      window.scrollTo(0, 0);
    }
    
    return () => {
      restoreAttempts.current.forEach(clearTimeout);
      restoreAttempts.current = [];
    };
  }, [locationKey, navigationType]);
};

// Component version for use in App.tsx
export const ScrollRestoration = () => {
  useScrollRestoration();
  return null;
};
