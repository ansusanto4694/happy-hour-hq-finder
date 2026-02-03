import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const DRAWER_STATE_KEY = 'drawer-state';

interface DrawerState {
  isOpen: boolean;
  scrollTop: number;
  lastClickedMerchantId: number | null;
}

interface UseDrawerScrollRestorationOptions {
  isContentReady?: boolean;
}

// Find the scroll container within the drawer
const findScrollContainer = (): HTMLElement | null => {
  const customScroll = document.querySelector('[data-vaul-drawer-scroll="true"]');
  if (customScroll) return customScroll as HTMLElement;
  
  const drawerContent = document.querySelector('[data-vaul-drawer]');
  if (drawerContent) {
    const scrollable = drawerContent.querySelector('.overflow-y-auto');
    if (scrollable) return scrollable as HTMLElement;
  }
  
  return null;
};

export const useDrawerScrollRestoration = (options: UseDrawerScrollRestorationOptions = {}) => {
  const { isContentReady = true } = options;
  const location = useLocation();
  const navigationType = useNavigationType();
  const locationKey = location.pathname + location.search;
  
  const hasRestoredRef = useRef(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Get saved state from sessionStorage
  const getSavedState = (): DrawerState | undefined => {
    try {
      const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
      return states[locationKey] as DrawerState | undefined;
    } catch {
      return undefined;
    }
  };

  // Save state to sessionStorage
  const saveState = useCallback((state: Partial<DrawerState>) => {
    try {
      const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
      states[locationKey] = { ...states[locationKey], ...state };
      sessionStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(states));
    } catch (e) {
      console.error('[DrawerScroll] Failed to save state:', e);
    }
  }, [locationKey]);

  // Get initial drawer state based on navigation type
  const getInitialOpenState = (): boolean => {
    const savedState = getSavedState();
    console.log('[DrawerScroll] Init:', { navigationType, savedState });
    
    if (navigationType === 'POP' && savedState?.isOpen) {
      return true;
    }
    return false;
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState);

  // Save scroll position when user clicks a merchant (before navigating away)
  const setLastClickedId = useCallback((id: number) => {
    // Try multiple selectors to find the scroll container
    const scrollContainer = findScrollContainer();
    const scrollTop = scrollContainer?.scrollTop || 0;
    
    console.log('[DrawerScroll] ===== SAVING STATE =====');
    console.log('[DrawerScroll] Merchant ID:', id);
    console.log('[DrawerScroll] Scroll container found:', !!scrollContainer);
    console.log('[DrawerScroll] Scroll container element:', scrollContainer?.className);
    console.log('[DrawerScroll] Current scrollTop:', scrollTop);
    console.log('[DrawerScroll] Location key:', locationKey);
    
    saveState({ 
      isOpen: true, 
      scrollTop,
      lastClickedMerchantId: id 
    });
    
    // Verify it was saved
    const verifyState = getSavedState();
    console.log('[DrawerScroll] Verified saved state:', verifyState);
  }, [saveState, locationKey]);

  // Save drawer open/close state and capture scroll container reference
  useEffect(() => {
    saveState({ isOpen });
    
    // Capture scroll container after drawer opens
    if (isOpen) {
      const timer = setTimeout(() => {
        const scrollContainer = findScrollContainer();
        if (scrollContainer) {
          scrollContainerRef.current = scrollContainer;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, saveState]);

  // Restore scroll position on back navigation
  useEffect(() => {
    if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
      return;
    }

    const savedState = getSavedState();
    const savedScrollTop = savedState?.scrollTop || 0;
    
    if (savedScrollTop === 0) {
      hasRestoredRef.current = true;
      return;
    }

    // Use a fast restoration approach with multiple attempts
    const restoreScroll = () => {
      const scrollContainer = findScrollContainer();
      if (!scrollContainer) return false;
      
      // Check if content is tall enough
      if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
        return false; // Content not ready yet
      }
      
      scrollContainer.scrollTop = savedScrollTop;
      return scrollContainer.scrollTop > 0;
    };

    // Attempt 1: Immediate (content might already be ready)
    if (restoreScroll()) {
      hasRestoredRef.current = true;
      console.log('[DrawerScroll] ✓ Restored immediately');
      return;
    }

    // Attempt 2: Next animation frame (after browser paint)
    let rafId = requestAnimationFrame(() => {
      if (hasRestoredRef.current) return;
      if (restoreScroll()) {
        hasRestoredRef.current = true;
        console.log('[DrawerScroll] ✓ Restored on RAF');
        return;
      }
      
      // Attempt 3: Short delay for content to render
      const timer1 = setTimeout(() => {
        if (hasRestoredRef.current) return;
        if (restoreScroll()) {
          hasRestoredRef.current = true;
          console.log('[DrawerScroll] ✓ Restored after 100ms');
          return;
        }
        
        // Attempt 4: Longer delay if infinite scroll needs time
        const timer2 = setTimeout(() => {
          if (hasRestoredRef.current) return;
          restoreScroll();
          hasRestoredRef.current = true;
          console.log('[DrawerScroll] ✓ Restored after 400ms');
        }, 300);
        
        return () => clearTimeout(timer2);
      }, 100);
      
      return () => clearTimeout(timer1);
    });

    return () => cancelAnimationFrame(rafId);
  }, [isOpen, isContentReady, navigationType]);

  // Wrapper to update isOpen with state saving
  const setIsOpenWithSave = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setIsOpen(prev => {
      const newValue = typeof open === 'function' ? open(prev) : open;
      return newValue;
    });
  }, []);

  return { 
    isOpen, 
    setIsOpen: setIsOpenWithSave,
    setLastClickedId
  };
};
