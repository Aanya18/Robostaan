// Cache Service - In-memory and localStorage caching for Supabase data
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  prefix?: string;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private memoryCache = new Map<string, CachedData<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly PREFIX = 'robostaan_cache_';

  /**
   * Set data in cache (both memory and localStorage)
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const prefixedKey = `${options.prefix || this.PREFIX}${key}`;
    
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory cache
    this.memoryCache.set(prefixedKey, cachedData);

    // Store in localStorage for persistence
    try {
      localStorage.setItem(prefixedKey, JSON.stringify(cachedData));
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  /**
   * Get data from cache (check memory first, then localStorage)
   */
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const prefixedKey = `${options.prefix || this.PREFIX}${key}`;
    
    // Check memory cache first
    let cachedData = this.memoryCache.get(prefixedKey);
    
    // If not in memory, check localStorage
    if (!cachedData) {
      try {
        const stored = localStorage.getItem(prefixedKey);
        if (stored) {
          cachedData = JSON.parse(stored);
          // Restore to memory cache
          if (cachedData) {
            this.memoryCache.set(prefixedKey, cachedData);
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return null;
      }
    }

    if (!cachedData) return null;

    // Check if expired
    const now = Date.now();
    if (now - cachedData.timestamp > cachedData.ttl) {
      this.delete(key, options);
      return null;
    }

    return cachedData.data;
  }

  /**
   * Delete from cache
   */
  delete(key: string, options: CacheOptions = {}): void {
    const prefixedKey = `${options.prefix || this.PREFIX}${key}`;
    
    this.memoryCache.delete(prefixedKey);
    
    try {
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear(options: CacheOptions = {}): void {
    const prefix = options.prefix || this.PREFIX;
    
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      localStorageSize: Object.keys(localStorage).filter(key => 
        key.startsWith(this.PREFIX)
      ).length
    };
  }

  /**
   * Invalidate cache based on pattern
   */
  invalidatePattern(pattern: string, options: CacheOptions = {}): void {
    const prefix = options.prefix || this.PREFIX;
    const regex = new RegExp(pattern);

    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix) && regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && regex.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear pattern from localStorage:', error);
    }
  }
}

export const cacheService = new CacheService();