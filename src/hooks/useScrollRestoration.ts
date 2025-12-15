import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_POSITIONS_KEY = 'scroll-positions';

// Disable browser's automatic scroll restoration
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Store the current scroll position before navigation happens
let lastLocationKey = '';
let lastScrollY = 0;

// Save scroll position on every scroll (outside of React lifecycle)
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    if (lastLocationKey) {
      lastScrollY = window.scrollY;
    }
  }, { passive: true });

  // Save position right before navigation (beforeunload won't work for SPA, but popstate will)
  window.addEventListener('beforeunload', () => {
    if (lastLocationKey && lastScrollY > 0) {
      const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
      positions[lastLocationKey] = lastScrollY;
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
    }
  });
}

export const useScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoreAttempts = useRef<NodeJS.Timeout[]>([]);
  const hasRestoredRef = useRef(false);
  
  // Create a consistent key using pathname + search
  const locationKey = location.pathname + location.search;

  // Save the previous location's scroll position BEFORE updating the key
  useEffect(() => {
    // If we're navigating to a new page (PUSH), save the old position first
    if (lastLocationKey && lastLocationKey !== locationKey && lastScrollY > 0) {
      const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}');
      positions[lastLocationKey] = lastScrollY;
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
      console.log('[ScrollRestoration] Saved previous position:', { 
        previousKey: lastLocationKey, 
        position: lastScrollY,
        newKey: locationKey 
      });
    }
    
    // Update the current location key
    lastLocationKey = locationKey;
    lastScrollY = window.scrollY;
    hasRestoredRef.current = false;
    
    console.log('[ScrollRestoration] Location changed:', { locationKey, navigationType });
  }, [locationKey, navigationType]);

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
      console.log('[ScrollRestoration] Will restore to:', savedPosition);
      
      const restoreScroll = () => {
        if (hasRestoredRef.current) return;
        
        const before = window.scrollY;
        window.scrollTo(0, savedPosition);
        
        // Check if scroll was successful (content is tall enough)
        if (Math.abs(window.scrollY - savedPosition) < 50) {
          hasRestoredRef.current = true;
          console.log('[ScrollRestoration] Restored successfully:', { before, after: window.scrollY, target: savedPosition });
        } else {
          console.log('[ScrollRestoration] Restore attempt (waiting for content):', { before, after: window.scrollY, target: savedPosition });
        }
      };
      
      // Attempt restoration at multiple intervals to handle async data loading
      const delays = [0, 50, 100, 200, 400, 800, 1500];
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
