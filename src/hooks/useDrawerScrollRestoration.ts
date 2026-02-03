import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const DRAWER_STATE_KEY = 'drawer-state';

interface DrawerState {
  isOpen: boolean;
  lastClickedMerchantId: number | null;
}

interface UseDrawerScrollRestorationOptions {
  isContentReady?: boolean;
}

export const useDrawerScrollRestoration = (options: UseDrawerScrollRestorationOptions = {}) => {
  const { isContentReady = true } = options;
  const location = useLocation();
  const navigationType = useNavigationType();
  const locationKey = location.pathname + location.search;
  
  const hasRestoredRef = useRef(false);
  const lastClickedIdRef = useRef<number | null>(null);

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
  const saveState = useCallback((state: DrawerState) => {
    try {
      const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
      states[locationKey] = state;
      sessionStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(states));
      console.log('[DrawerScroll] Saved state:', state);
    } catch (e) {
      console.error('[DrawerScroll] Failed to save state:', e);
    }
  }, [locationKey]);

  // Get initial drawer state based on navigation type
  const getInitialOpenState = (): boolean => {
    const savedState = getSavedState();
    console.log('[DrawerScroll] Init:', { 
      navigationType, 
      savedState,
    });
    
    if (navigationType === 'POP' && savedState?.isOpen) {
      lastClickedIdRef.current = savedState.lastClickedMerchantId;
      return true;
    }
    return false;
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState);

  // Track which merchant was clicked before navigation
  const setLastClickedId = useCallback((id: number) => {
    lastClickedIdRef.current = id;
    saveState({ isOpen: true, lastClickedMerchantId: id });
    console.log('[DrawerScroll] Saved clicked merchant:', id);
  }, [saveState]);

  // Save drawer open/close state
  useEffect(() => {
    saveState({ 
      isOpen, 
      lastClickedMerchantId: lastClickedIdRef.current 
    });
  }, [isOpen, saveState]);

  // Restore scroll position by scrolling to the last clicked item
  useEffect(() => {
    if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
      return;
    }

    const savedId = lastClickedIdRef.current;
    console.log('[DrawerScroll] Attempting restore for merchant:', savedId);
    
    if (!savedId) {
      hasRestoredRef.current = true;
      return;
    }

    // Multiple attempts with increasing delays to ensure content is rendered
    const attemptRestore = (delay: number) => {
      setTimeout(() => {
        if (hasRestoredRef.current) return;
        
        const element = document.querySelector(`[data-merchant-id="${savedId}"]`);
        console.log('[DrawerScroll] Found element:', !!element, 'after', delay, 'ms');
        
        if (element) {
          element.scrollIntoView({ block: 'center', behavior: 'instant' });
          hasRestoredRef.current = true;
          console.log('[DrawerScroll] ✓ Scrolled to merchant:', savedId);
        }
      }, delay);
    };

    // Try multiple times with increasing delays
    [100, 200, 400, 600, 800].forEach(attemptRestore);

    return () => {
      hasRestoredRef.current = true;
    };
  }, [isOpen, isContentReady, navigationType]);

  // Wrapper to update isOpen with state saving
  const setIsOpenWithSave = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setIsOpen(prev => {
      const newValue = typeof open === 'function' ? open(prev) : open;
      return newValue;
    });
  }, []);

  // Dummy scrollRef for backwards compatibility (no longer used for scrolling)
  const scrollRef = useCallback((_node: HTMLDivElement | null) => {
    // No-op - kept for API compatibility
  }, []);

  return { 
    scrollRef, 
    isOpen, 
    setIsOpen: setIsOpenWithSave,
    setLastClickedId
  };
};
