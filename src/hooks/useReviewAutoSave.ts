import { useState, useEffect, useRef, useCallback } from 'react';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseReviewAutoSaveOptions {
  onSave: () => Promise<boolean>;
  debounceMs?: number;
}

export const useReviewAutoSave = ({ onSave, debounceMs = 3000 }: UseReviewAutoSaveOptions) => {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [isDirty, setIsDirty] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setStatus('pending');
  }, []);

  const triggerSave = useCallback(async () => {
    if (!isDirty) return;
    
    // Prevent rapid saves
    const now = Date.now();
    if (now - lastSaveRef.current < 1000) return;
    
    setStatus('saving');
    try {
      const success = await onSave();
      if (success) {
        setIsDirty(false);
        setStatus('saved');
        lastSaveRef.current = Date.now();
        // Reset to idle after showing "saved" for a moment
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setStatus('error');
    }
  }, [isDirty, onSave]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!isDirty) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      triggerSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, debounceMs, triggerSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    isDirty,
    markDirty,
    triggerSave,
  };
};
