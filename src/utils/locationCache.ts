interface CacheEntry {
  suggestions: any[];
  timestamp: number;
}

class LocationCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  get(query: string): any[] | null {
    const entry = this.cache.get(query.toLowerCase());
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(query.toLowerCase());
      return null;
    }

    return entry.suggestions;
  }

  set(query: string, suggestions: any[]): void {
    this.cache.set(query.toLowerCase(), {
      suggestions,
      timestamp: Date.now(),
    });

    // Clean up expired entries (limit cache size)
    if (this.cache.size > 100) {
      this.cleanExpired();
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const locationCache = new LocationCache();
