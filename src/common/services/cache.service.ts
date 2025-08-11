import { Injectable, Logger } from '@nestjs/common';

interface CacheItem<T> {
  data: T;
  expiresAt: number;
  key: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, CacheItem<any>>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTtl,
  ): Promise<T> {
    // Check if cached data exists and is still valid
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return cached.data;
    }

    // Execute factory function and cache result
    this.logger.debug(`Cache miss for key: ${key}, executing factory function`);
    const data = await factory();
    
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTtl): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt, key });
    
    this.logger.debug(`Cached data for key: ${key}, expires at: ${new Date(expiresAt).toISOString()}`);
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup();
    }
  }

  /**
   * Get cached data without fallback
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    
    // Remove expired entry
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Invalidated cache for key: ${key}`);
  }

  /**
   * Invalidate cache keys matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.logger.debug(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cleared all cache entries (${size} items)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    expired: number;
  } {
    let expired = 0;
    const now = Date.now();
    
    for (const item of this.cache.values()) {
      if (item.expiresAt <= now) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      expired,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }
}