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
  const locationKey = location.pathname + location.search;
  
  // Use state to track the scroll element so we can react to it being attached
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const hasRestoredRef = useRef(false);
  const savedScrollTopRef = useRef(0);

  // Callback ref that updates state when element is attached/detached
  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    setScrollElement(node);
  }, []);

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
    const scrollTop = scrollElement?.scrollTop || 0;
    const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
    states[locationKey] = {
      isOpen,
      scrollTop,
    };
    sessionStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(states));
    console.log('[DrawerScrollRestoration] Saved state:', { locationKey, isOpen, scrollTop });
  }, [locationKey, isOpen, scrollElement]);

  // Save state on scroll
  const handleScroll = useCallback(() => {
    saveState();
  }, [saveState]);

  // Save state when drawer opens/closes
  useEffect(() => {
    saveState();
  }, [isOpen, saveState]);

  // Attach scroll listener when element is available
  useEffect(() => {
    if (scrollElement && isOpen) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      console.log('[DrawerScrollRestoration] Attached scroll listener to element');
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [scrollElement, isOpen, handleScroll]);

  // Save state before navigating away (on unmount)
  useEffect(() => {
    return () => {
      saveState();
    };
  }, [saveState]);

  // Restore scroll position when element is ready and content is loaded
  useEffect(() => {
    console.log('[DrawerScrollRestoration] Restore check:', {
      navigationType,
      isOpen,
      isContentReady,
      hasRestored: hasRestoredRef.current,
      savedScrollTop: savedScrollTopRef.current,
      scrollElementExists: !!scrollElement,
      scrollHeight: scrollElement?.scrollHeight,
    });

    // Only restore on POP navigation, when drawer is open, content is ready, element exists, and not already restored
    if (navigationType !== 'POP' || !isOpen || !isContentReady || !scrollElement || hasRestoredRef.current) {
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
      if (!scrollElement || hasRestoredRef.current) {
        return;
      }
      
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      
      console.log('[DrawerScrollRestoration] Attempting restore:', {
        target: savedScrollTop,
        scrollHeight,
        clientHeight,
        maxScroll
      });
      
      // Only try to restore if the content is tall enough
      if (maxScroll > 0) {
        scrollElement.scrollTop = savedScrollTop;
        
        // Check if restore was successful (within tolerance or any scroll happened)
        const actualScroll = scrollElement.scrollTop;
        if (actualScroll > 0 || Math.abs(actualScroll - savedScrollTop) < 50) {
          hasRestoredRef.current = true;
          console.log('[DrawerScrollRestoration] ✓ Restored to:', actualScroll);
        } else {
          console.log('[DrawerScrollRestoration] Restore pending, actual:', actualScroll);
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready, then try multiple times
    requestAnimationFrame(() => {
      restoreScroll();
    });
    
    // Additional attempts for async content
    const timeouts = [50, 100, 200, 400].map(delay => 
      setTimeout(() => {
        requestAnimationFrame(restoreScroll);
      }, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [scrollElement, isContentReady, isOpen, navigationType]);

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