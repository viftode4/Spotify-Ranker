/**
 * Cache utilities for localStorage
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Default TTL is 5 minutes
export const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Get an item from localStorage cache
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @returns The cached data if valid, or null if expired or not found
 */
export function getCachedItem<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
  try {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;
    
    const { data, timestamp }: CacheItem<T> = JSON.parse(cachedData);
    const now = Date.now();
    
    // Return null if cache is expired
    if (now - timestamp > ttl) return null;
    
    return data;
  } catch (error) {
    console.error(`Error retrieving cached item ${key}:`, error);
    return null;
  }
}

/**
 * Set an item in localStorage cache
 * @param key Cache key
 * @param data Data to cache
 * @returns true if successful, false otherwise
 */
export function setCachedItem<T>(key: string, data: T): boolean {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(cacheItem));
    return true;
  } catch (error) {
    console.error(`Error caching item ${key}:`, error);
    return false;
  }
}

/**
 * Clear a specific item from cache
 * @param key Cache key
 */
export function clearCacheItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing cache item ${key}:`, error);
  }
}

/**
 * Clear all cache items that match a prefix
 * @param prefix Cache key prefix
 */
export function clearCacheByPrefix(prefix: string): void {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error(`Error clearing cache with prefix ${prefix}:`, error);
  }
}

/**
 * Clear all cache created by the app
 */
export function clearAllCache(): void {
  try {
    clearCacheByPrefix('cached_');
  } catch (error) {
    console.error("Error clearing all cache:", error);
  }
} 