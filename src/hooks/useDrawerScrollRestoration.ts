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

// Wait for an element to appear in the DOM using MutationObserver
const waitForElement = (selector: string, timeout: number = 2000): Promise<Element | null> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};

// Find the scroll container within the drawer
const findScrollContainer = (): Element | null => {
  // First try our custom data attribute
  const customScroll = document.querySelector('[data-vaul-drawer-scroll="true"]');
  if (customScroll) return customScroll;
  
  // Fallback to finding the overflow-y-auto inside drawer content
  const drawerContent = document.querySelector('[data-vaul-drawer]');
  if (drawerContent) {
    const scrollable = drawerContent.querySelector('.overflow-y-auto');
    if (scrollable) return scrollable;
  }
  
  return null;
};

// Scroll element into view within a specific container
const scrollElementIntoContainer = (container: Element, element: Element) => {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  
  // Calculate where the element is relative to the container's current scroll
  const elementOffsetFromContainerTop = elementRect.top - containerRect.top;
  const currentScrollTop = container.scrollTop;
  
  // Calculate the absolute offset of the element from the top of scrollable content
  const absoluteElementOffset = currentScrollTop + elementOffsetFromContainerTop;
  
  // Center the element in the container
  const centeredScrollTop = absoluteElementOffset - (containerRect.height / 2) + (elementRect.height / 2);
  
  container.scrollTop = Math.max(0, centeredScrollTop);
  
  console.log('[DrawerScroll] Scrolled container:', {
    containerRect: { height: containerRect.height, top: containerRect.top },
    elementRect: { height: elementRect.height, top: elementRect.top },
    scrollTop: container.scrollTop,
    centeredScrollTop
  });
};

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
    // Always log conditions for debugging - this helps identify why restoration fails
    console.log('[DrawerScroll] Effect check:', { 
      navigationType, 
      isOpen, 
      isContentReady, 
      hasRestored: hasRestoredRef.current,
      savedId: lastClickedIdRef.current 
    });
    
    if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
      return;
    }

    const savedId = lastClickedIdRef.current;
    console.log('[DrawerScroll] Attempting restore for merchant:', savedId);
    
    if (!savedId) {
      hasRestoredRef.current = true;
      return;
    }

    const performRestoration = async () => {
      // Wait for drawer to fully open and animate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (hasRestoredRef.current) return;
      
      // Wait for the target element to appear (handles infinite scroll)
      const targetElement = await waitForElement(`[data-merchant-id="${savedId}"]`, 2000);
      
      if (hasRestoredRef.current) return;
      
      if (!targetElement) {
        console.log('[DrawerScroll] Target element not found after waiting');
        hasRestoredRef.current = true;
        return;
      }
      
      // Wait for element to be fully rendered and painted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify element has dimensions (is actually rendered)
      let rect = targetElement.getBoundingClientRect();
      if (rect.height === 0) {
        console.log('[DrawerScroll] Element found but not rendered yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 200));
        rect = targetElement.getBoundingClientRect();
      }
      
      if (rect.height === 0) {
        console.log('[DrawerScroll] Element still has no height, falling back to scrollIntoView');
        targetElement.scrollIntoView({ block: 'center', behavior: 'instant' });
        hasRestoredRef.current = true;
        return;
      }
      
      console.log('[DrawerScroll] Found target element with rect:', rect);
      
      // Find the scroll container
      const scrollContainer = findScrollContainer();
      
      if (!scrollContainer) {
        console.log('[DrawerScroll] Scroll container not found, falling back to scrollIntoView');
        targetElement.scrollIntoView({ block: 'center', behavior: 'instant' });
        hasRestoredRef.current = true;
        return;
      }
      
      console.log('[DrawerScroll] Found scroll container:', scrollContainer);
      
      // Scroll the element into view within the container
      scrollElementIntoContainer(scrollContainer, targetElement);
      hasRestoredRef.current = true;
      console.log('[DrawerScroll] ✓ Restored scroll to merchant:', savedId);
    };

    performRestoration();
    
    // NO cleanup function - we only mark hasRestoredRef.current = true after successful scroll
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
