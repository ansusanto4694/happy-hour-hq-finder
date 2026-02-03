import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const DRAWER_STATE_KEY = 'drawer-state';

interface DrawerState {
  isOpen: boolean;
  scrollTop: number;
}

interface UseDrawerScrollRestorationOptions {
  isContentReady?: boolean;
}

export const useDrawerScrollRestoration = (options: UseDrawerScrollRestorationOptions = {}) => {
  const { isContentReady = true } = options;
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollRef = useRef<HTMLDivElement>(null);
  const locationKey = location.pathname + location.search;
  const hasRestoredRef = useRef(false);
  const savedScrollTopRef = useRef(0);

  // Get initial drawer state based on navigation type
  const getInitialOpenState = (): boolean => {
    if (navigationType === 'POP') {
      const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
      const savedState = states[locationKey] as DrawerState | undefined;
      return savedState?.isOpen ?? false;
    }
    return false;
  };

  // Get saved scroll position
  const getSavedScrollTop = (): number => {
    const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
    const savedState = states[locationKey] as DrawerState | undefined;
    return savedState?.scrollTop || 0;
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState);

  // Reset restoration flag when location changes
  useEffect(() => {
    hasRestoredRef.current = false;
    savedScrollTopRef.current = getSavedScrollTop();
  }, [locationKey]);

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

  // Restore scroll position when content is ready
  useEffect(() => {
    // Only restore on POP navigation, when drawer is open, content is ready, and not already restored
    if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
      return;
    }

    const savedScrollTop = savedScrollTopRef.current;
    
    if (savedScrollTop <= 0) {
      hasRestoredRef.current = true;
      return;
    }

    const restoreScroll = () => {
      if (!scrollRef.current || hasRestoredRef.current) return;
      
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (scrollRef.current && !hasRestoredRef.current) {
          scrollRef.current.scrollTop = savedScrollTop;
          
          // Check if restore was successful (within tolerance)
          if (Math.abs(scrollRef.current.scrollTop - savedScrollTop) < 50) {
            hasRestoredRef.current = true;
            console.log('[DrawerScrollRestoration] Restored to:', savedScrollTop);
          } else {
            console.log('[DrawerScrollRestoration] Scroll restore pending, content height:', scrollRef.current.scrollHeight);
          }
        }
      });
    };

    // Attempt restoration immediately and with delays (content may still be rendering)
    restoreScroll();
    const timeouts = [50, 100, 200, 400].map(delay => 
      setTimeout(restoreScroll, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isContentReady, isOpen, navigationType]);

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
