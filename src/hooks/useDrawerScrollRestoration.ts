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
    const scrollContainer = findScrollContainer();
    const scrollTop = scrollContainer?.scrollTop || 0;
    
    console.log('[DrawerScroll] Saving state before navigation:', { id, scrollTop });
    saveState({ 
      isOpen: true, 
      scrollTop,
      lastClickedMerchantId: id 
    });
  }, [saveState]);

  // Save drawer open/close state
  useEffect(() => {
    saveState({ isOpen });
  }, [isOpen, saveState]);

  // Capture scroll position periodically while drawer is open
  useEffect(() => {
    if (!isOpen) return;
    
    const captureScrollPosition = () => {
      const scrollContainer = findScrollContainer();
      if (scrollContainer) {
        scrollContainerRef.current = scrollContainer;
      }
    };
    
    // Capture after drawer animation completes
    const timer = setTimeout(captureScrollPosition, 500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Restore scroll position on back navigation
  useEffect(() => {
    console.log('[DrawerScroll] Restore effect:', { 
      navigationType, 
      isOpen, 
      isContentReady, 
      hasRestored: hasRestoredRef.current 
    });
    
    if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
      return;
    }

    const savedState = getSavedState();
    const savedScrollTop = savedState?.scrollTop || 0;
    
    console.log('[DrawerScroll] Attempting to restore scrollTop:', savedScrollTop);
    
    if (savedScrollTop === 0) {
      hasRestoredRef.current = true;
      return;
    }

    const performRestoration = async () => {
      // Wait for drawer to fully open and content to render
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (hasRestoredRef.current) return;
      
      const scrollContainer = findScrollContainer();
      console.log('[DrawerScroll] Found scroll container:', !!scrollContainer);
      
      if (!scrollContainer) {
        console.log('[DrawerScroll] No scroll container found');
        hasRestoredRef.current = true;
        return;
      }
      
      // Check if content is tall enough to scroll
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      console.log('[DrawerScroll] Container dimensions:', { scrollHeight, clientHeight, savedScrollTop });
      
      if (scrollHeight <= clientHeight) {
        console.log('[DrawerScroll] Content not tall enough to scroll, waiting for more content...');
        // Wait for more content to load
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Try to restore scroll position
      scrollContainer.scrollTop = savedScrollTop;
      
      // Verify it worked
      const actualScrollTop = scrollContainer.scrollTop;
      console.log('[DrawerScroll] ✓ Restored scroll:', { requested: savedScrollTop, actual: actualScrollTop });
      
      // If scroll didn't work (content not tall enough), try again after a delay
      if (actualScrollTop < savedScrollTop * 0.5) {
        console.log('[DrawerScroll] Scroll position not fully restored, retrying...');
        await new Promise(resolve => setTimeout(resolve, 500));
        scrollContainer.scrollTop = savedScrollTop;
        console.log('[DrawerScroll] Retry result:', scrollContainer.scrollTop);
      }
      
      hasRestoredRef.current = true;
    };

    performRestoration();
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
