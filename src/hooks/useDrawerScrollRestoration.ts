import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const DRAWER_SCROLL_KEY = 'drawer-scroll-positions';

export const useDrawerScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollRef = useRef<HTMLDivElement>(null);
  const locationKey = location.pathname + location.search;
  const hasRestoredRef = useRef(false);
  const restoreAttempts = useRef<NodeJS.Timeout[]>([]);

  // Save scroll position on scroll
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const positions = JSON.parse(sessionStorage.getItem(DRAWER_SCROLL_KEY) || '{}');
      positions[locationKey] = scrollRef.current.scrollTop;
      sessionStorage.setItem(DRAWER_SCROLL_KEY, JSON.stringify(positions));
    }
  }, [locationKey]);

  // Save position before navigating away
  useEffect(() => {
    const currentRef = scrollRef.current;
    
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
        // Save final position before unmount
        const positions = JSON.parse(sessionStorage.getItem(DRAWER_SCROLL_KEY) || '{}');
        positions[locationKey] = currentRef.scrollTop;
        sessionStorage.setItem(DRAWER_SCROLL_KEY, JSON.stringify(positions));
      }
    };
  }, [locationKey, handleScroll]);

  // Restore scroll position on POP navigation
  useEffect(() => {
    // Clear pending attempts
    restoreAttempts.current.forEach(clearTimeout);
    restoreAttempts.current = [];
    hasRestoredRef.current = false;

    if (navigationType === 'POP') {
      const positions = JSON.parse(sessionStorage.getItem(DRAWER_SCROLL_KEY) || '{}');
      const savedPosition = positions[locationKey];

      if (savedPosition !== undefined && savedPosition > 0) {
        const restoreScroll = () => {
          if (hasRestoredRef.current || !scrollRef.current) return;
          
          scrollRef.current.scrollTop = savedPosition;
          
          // Check if restore was successful
          if (Math.abs(scrollRef.current.scrollTop - savedPosition) < 50) {
            hasRestoredRef.current = true;
            console.log('[DrawerScrollRestoration] Restored to:', savedPosition);
          }
        };

        // Attempt restoration at multiple intervals (content may load async)
        const delays = [0, 50, 100, 200, 400, 800];
        delays.forEach(delay => {
          const timeout = setTimeout(restoreScroll, delay);
          restoreAttempts.current.push(timeout);
        });
      }
    }

    return () => {
      restoreAttempts.current.forEach(clearTimeout);
      restoreAttempts.current = [];
    };
  }, [locationKey, navigationType]);

  return scrollRef;
};
