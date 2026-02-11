import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'smyRecentlyViewed';
const MAX_ITEMS = 10;

export interface RecentlyViewedMerchant {
  id: number;
  restaurant_name: string;
  slug: string | null;
  logo_url: string | null;
  neighborhood: string | null;
  merchant_happy_hour: Array<{
    day_of_week: number;
    happy_hour_start: string;
    happy_hour_end: string;
  }>;
  happy_hour_deals: Array<{
    active: boolean;
    menu_type: 'food_and_drinks' | 'drinks_only' | null;
  }>;
  viewedAt: number;
}

function readFromStorage(): RecentlyViewedMerchant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeToStorage(items: RecentlyViewedMerchant[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedMerchant[]>(() => readFromStorage());

  // Sync state if another tab updates localStorage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setRecentlyViewed(readFromStorage());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addRecentlyViewed = useCallback((merchant: {
    id: number;
    restaurant_name: string;
    slug?: string | null;
    logo_url?: string | null;
    neighborhood?: string | null;
    merchant_happy_hour?: Array<{
      day_of_week: number;
      happy_hour_start: string;
      happy_hour_end: string;
    }>;
    happy_hour_deals?: Array<{
      active: boolean;
      menu_type?: string | null;
    }>;
  }) => {
    const entry: RecentlyViewedMerchant = {
      id: merchant.id,
      restaurant_name: merchant.restaurant_name,
      slug: merchant.slug ?? null,
      logo_url: merchant.logo_url ?? null,
      neighborhood: merchant.neighborhood ?? null,
      merchant_happy_hour: merchant.merchant_happy_hour ?? [],
    happy_hour_deals: (merchant.happy_hour_deals ?? []).map(d => ({
        active: d.active,
        menu_type: (d.menu_type as 'food_and_drinks' | 'drinks_only' | null) ?? null,
      })),
      viewedAt: Date.now(),
    };

    setRecentlyViewed(prev => {
      // Remove existing entry for this merchant, then prepend
      const filtered = prev.filter(m => m.id !== merchant.id);
      const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
      writeToStorage(updated);
      return updated;
    });
  }, []);

  return { recentlyViewed, addRecentlyViewed };
}
