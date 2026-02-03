import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const DRAWER_STATE_KEY = 'drawer-state';

interface DrawerState {
  isOpen: boolean;
  scrollTop: number;
}

export const useDrawerScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollRef = useRef<HTMLDivElement>(null);
  const locationKey = location.pathname + location.search;
  const hasRestoredRef = useRef(false);
  const restoreAttempts = useRef<NodeJS.Timeout[]>([]);

  // Get initial drawer state based on navigation type
  const getInitialOpenState = (): boolean => {
    if (navigationType === 'POP') {
      const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
      const savedState = states[locationKey] as DrawerState | undefined;
      return savedState?.isOpen ?? false;
    }
    return false;
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState);

  // Save drawer state (open + scroll) whenever it changes
  const saveState = useCallback(() => {
    const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
    states[locationKey] = {
      isOpen,
      scrollTop: scrollRef.current?.scrollTop || 0,
    };
    sessionStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(states));
  }, [locationKey, isOpen]);

  // Save state on scroll
  const handleScroll = useCallback(() => {
    saveState();
  }, [saveState]);

  // Save state when drawer opens/closes
  useEffect(() => {
    saveState();
  }, [isOpen, saveState]);

  // Attach scroll listener to save position
  useEffect(() => {
    const currentRef = scrollRef.current;
    
    if (currentRef && isOpen) {
      currentRef.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen, handleScroll]);

  // Save state before navigating away (on unmount)
  useEffect(() => {
    return () => {
      saveState();
    };
  }, [saveState]);

  // Restore scroll position on POP navigation when drawer opens
  useEffect(() => {
    // Clear pending attempts
    restoreAttempts.current.forEach(clearTimeout);
    restoreAttempts.current = [];

    if (navigationType === 'POP' && isOpen && !hasRestoredRef.current) {
      const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
      const savedState = states[locationKey] as DrawerState | undefined;
      const savedScrollTop = savedState?.scrollTop || 0;

      if (savedScrollTop > 0) {
        const restoreScroll = () => {
          if (hasRestoredRef.current || !scrollRef.current) return;
          
          scrollRef.current.scrollTop = savedScrollTop;
          
          // Check if restore was successful
          if (Math.abs(scrollRef.current.scrollTop - savedScrollTop) < 50) {
            hasRestoredRef.current = true;
            console.log('[DrawerScrollRestoration] Restored to:', savedScrollTop);
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
  }, [locationKey, navigationType, isOpen]);

  // Custom setter that also saves state
  const setIsOpenWithSave = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setIsOpen(prev => {
      const newValue = typeof open === 'function' ? open(prev) : open;
      return newValue;
    });
  }, []);

  return { 
    scrollRef, 
    isOpen, 
    setIsOpen: setIsOpenWithSave 
  };
};
