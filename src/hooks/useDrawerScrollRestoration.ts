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

  // Get saved state from sessionStorage
  const getSavedState = (): DrawerState | undefined => {
    try {
      const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
      return states[locationKey] as DrawerState | undefined;
    } catch {
      return undefined;
    }
  };

  // Get initial drawer state based on navigation type
  const getInitialOpenState = (): boolean => {
    const savedState = getSavedState();
    console.log('[DrawerScrollRestoration] Init:', { 
      navigationType, 
      locationKey, 
      savedState,
      willOpen: navigationType === 'POP' && (savedState?.isOpen ?? false)
    });
    
    if (navigationType === 'POP') {
      // Store the scroll position for later restoration
      savedScrollTopRef.current = savedState?.scrollTop || 0;
      return savedState?.isOpen ?? false;
    }
    return false;
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState);

  // Save drawer state (open + scroll) whenever it changes
  const saveState = useCallback(() => {
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
    states[locationKey] = {
      isOpen,
      scrollTop,
    };
    sessionStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(states));
    console.log('[DrawerScrollRestoration] Saved state:', { locationKey, isOpen, scrollTop });
  }, [locationKey, isOpen]);

  // Save state on scroll (debounced via passive listener)
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
      console.log('[DrawerScrollRestoration] Attached scroll listener');
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
    console.log('[DrawerScrollRestoration] Restore check:', {
      navigationType,
      isOpen,
      isContentReady,
      hasRestored: hasRestoredRef.current,
      savedScrollTop: savedScrollTopRef.current,
      scrollRefExists: !!scrollRef.current
    });

    // Only restore on POP navigation, when drawer is open, content is ready, and not already restored
    if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
      return;
    }

    const savedScrollTop = savedScrollTopRef.current;
    
    if (savedScrollTop <= 0) {
      console.log('[DrawerScrollRestoration] No scroll to restore (position was 0)');
      hasRestoredRef.current = true;
      return;
    }

    console.log('[DrawerScrollRestoration] Will attempt to restore to:', savedScrollTop);

    const restoreScroll = () => {
      if (!scrollRef.current || hasRestoredRef.current) {
        console.log('[DrawerScrollRestoration] Cannot restore - ref missing or already restored');
        return;
      }
      
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (scrollRef.current && !hasRestoredRef.current) {
          const scrollHeight = scrollRef.current.scrollHeight;
          const clientHeight = scrollRef.current.clientHeight;
          const maxScroll = scrollHeight - clientHeight;
          
          console.log('[DrawerScrollRestoration] Attempting restore:', {
            target: savedScrollTop,
            scrollHeight,
            clientHeight,
            maxScroll
          });
          
          scrollRef.current.scrollTop = savedScrollTop;
          
          // Check if restore was successful (within tolerance)
          const actualScroll = scrollRef.current.scrollTop;
          if (Math.abs(actualScroll - savedScrollTop) < 50 || actualScroll > 0) {
            hasRestoredRef.current = true;
            console.log('[DrawerScrollRestoration] ✓ Restored to:', actualScroll);
          } else {
            console.log('[DrawerScrollRestoration] Restore pending, actual:', actualScroll);
          }
        }
      });
    };

    // Attempt restoration immediately and with delays (content may still be rendering)
    restoreScroll();
    const timeouts = [50, 100, 200, 400, 800].map(delay => 
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
