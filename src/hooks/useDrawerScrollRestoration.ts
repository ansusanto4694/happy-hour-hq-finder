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
  
  // Store ref to the actual scrollable element (could be our div or Vaul's internal)
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredRef = useRef(false);
  const savedScrollTopRef = useRef(0);
  const scrollListenerAttachedRef = useRef(false);

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
    console.log('[DrawerScroll] Init:', { 
      navigationType, 
      savedState,
    });
    
    if (navigationType === 'POP') {
      savedScrollTopRef.current = savedState?.scrollTop || 0;
      return savedState?.isOpen ?? false;
    }
    return false;
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState);

  // Find the actual scrollable element within the drawer
  const findScrollableElement = useCallback((): HTMLElement | null => {
    // Look for Vaul drawer content - it renders in a portal
    const drawerContent = document.querySelector('[data-vaul-drawer-content]');
    if (drawerContent) {
      // The drawer content itself is scrollable, or find the first scrollable child
      const scrollable = drawerContent.querySelector('[data-scroll-container]') as HTMLElement;
      if (scrollable) return scrollable;
      
      // If no marked container, check if content itself is scrollable
      if (drawerContent.scrollHeight > drawerContent.clientHeight) {
        return drawerContent as HTMLElement;
      }
      
      // Find first element with overflow-y: auto/scroll that has scrollable content
      const allChildren = drawerContent.querySelectorAll('*');
      for (const child of allChildren) {
        const el = child as HTMLElement;
        const style = window.getComputedStyle(el);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && 
            el.scrollHeight > el.clientHeight) {
          return el;
        }
      }
    }
    return null;
  }, []);

  // Save current scroll position
  const saveScrollPosition = useCallback(() => {
    const element = findScrollableElement();
    const scrollTop = element?.scrollTop || 0;
    
    const states = JSON.parse(sessionStorage.getItem(DRAWER_STATE_KEY) || '{}');
    states[locationKey] = {
      isOpen,
      scrollTop,
    };
    sessionStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(states));
    console.log('[DrawerScroll] Saved:', { scrollTop, isOpen });
  }, [locationKey, isOpen, findScrollableElement]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    saveScrollPosition();
  }, [saveScrollPosition]);

  // Attach scroll listener to the actual scrollable element
  useEffect(() => {
    if (!isOpen) {
      scrollListenerAttachedRef.current = false;
      return;
    }

    // Wait for drawer to render
    const attachListener = () => {
      const scrollable = findScrollableElement();
      if (scrollable && !scrollListenerAttachedRef.current) {
        console.log('[DrawerScroll] Attaching listener to:', scrollable.className);
        scrollable.addEventListener('scroll', handleScroll, { passive: true });
        scrollElementRef.current = scrollable as HTMLDivElement;
        scrollListenerAttachedRef.current = true;
        
        return () => {
          scrollable.removeEventListener('scroll', handleScroll);
          scrollListenerAttachedRef.current = false;
        };
      }
    };

    // Try immediately, then with delays for portal rendering
    const cleanup1 = attachListener();
    const timeoutId = setTimeout(() => {
      if (!scrollListenerAttachedRef.current) {
        attachListener();
      }
    }, 100);

    return () => {
      cleanup1?.();
      clearTimeout(timeoutId);
      if (scrollElementRef.current) {
        scrollElementRef.current.removeEventListener('scroll', handleScroll);
      }
      scrollListenerAttachedRef.current = false;
    };
  }, [isOpen, findScrollableElement, handleScroll]);

  // Save state when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      // Delay to ensure drawer is rendered
      const timeoutId = setTimeout(saveScrollPosition, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, saveScrollPosition]);

  // Save state before navigating away
  useEffect(() => {
    const handleBeforeUnload = () => saveScrollPosition();
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  // Restore scroll position
  useEffect(() => {
    if (navigationType !== 'POP' || !isOpen || !isContentReady || hasRestoredRef.current) {
      return;
    }

    const savedScrollTop = savedScrollTopRef.current;
    console.log('[DrawerScroll] Restore check:', { savedScrollTop, isContentReady });
    
    if (savedScrollTop <= 0) {
      hasRestoredRef.current = true;
      return;
    }

    const attemptRestore = () => {
      if (hasRestoredRef.current) return;
      
      const scrollable = findScrollableElement();
      if (!scrollable) {
        console.log('[DrawerScroll] No scrollable element found');
        return;
      }
      
      const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
      console.log('[DrawerScroll] Attempting restore:', { 
        target: savedScrollTop, 
        maxScroll,
        scrollHeight: scrollable.scrollHeight,
        clientHeight: scrollable.clientHeight
      });
      
      if (maxScroll > 0) {
        scrollable.scrollTop = Math.min(savedScrollTop, maxScroll);
        
        // Verify restoration
        requestAnimationFrame(() => {
          const actual = scrollable.scrollTop;
          if (actual > 0) {
            hasRestoredRef.current = true;
            console.log('[DrawerScroll] ✓ Restored to:', actual);
          }
        });
      }
    };

    // Multiple attempts with increasing delays
    const attempts = [0, 50, 100, 200, 400, 800];
    const timeouts = attempts.map(delay => 
      setTimeout(() => requestAnimationFrame(attemptRestore), delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [isOpen, isContentReady, navigationType, findScrollableElement]);

  // Callback ref for backwards compatibility (marks the target container)
  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.setAttribute('data-scroll-container', 'true');
    }
  }, []);

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
