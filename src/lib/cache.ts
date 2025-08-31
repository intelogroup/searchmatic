/**
 * Performance-optimized caching layer for Searchmatic
 * Implements multiple caching strategies for different data types
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size
  persist?: boolean // Whether to persist to localStorage
}

class PerformanceCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = [] // For LRU eviction
  private maxSize: number
  private defaultTTL: number

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.ttl || 5 * 60 * 1000 // 5 minutes default
    
    // Load from localStorage if persist is enabled
    if (options.persist) {
      this.loadFromStorage()
    }
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiry = now + (ttl || this.defaultTTL)

    // Remove existing key from access order
    const existingIndex = this.accessOrder.indexOf(key)
    if (existingIndex > -1) {
      this.accessOrder.splice(existingIndex, 1)
    }

    // Add to front (most recently accessed)
    this.accessOrder.unshift(key)

    // Set the cache entry
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry
    })

    // Evict if over size limit
    this.evictIfNecessary()
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      return null
    }

    // Move to front of access order
    this.moveToFront(key)
    
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    this.removeFromAccessOrder(key)
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  size(): number {
    return this.cache.size
  }

  // Get cache statistics
  getStats() {
    let expired = 0
    let valid = 0
    const now = Date.now()

    this.cache.forEach(entry => {
      if (now > entry.expiry) {
        expired++
      } else {
        valid++
      }
    })

    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.maxSize,
      accessOrder: this.accessOrder.length
    }
  }

  private evictIfNecessary(): void {
    while (this.cache.size > this.maxSize && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.pop()
      if (lruKey) {
        this.cache.delete(lruKey)
      }
    }
  }

  private moveToFront(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
      this.accessOrder.unshift(key)
    }
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('searchmatic_cache')
      if (stored) {
        const data = JSON.parse(stored)
        // Only load non-expired entries
        const now = Date.now()
        Object.entries(data).forEach(([key, entry]: [string, any]) => {
          if (entry.expiry > now) {
            this.cache.set(key, entry)
            this.accessOrder.push(key)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error)
    }
  }

  saveToStorage(): void {
    try {
      const data: Record<string, CacheEntry<T>> = {}
      this.cache.forEach((entry, key) => {
        data[key] = entry
      })
      localStorage.setItem('searchmatic_cache', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error)
    }
  }
}

// Specialized cache instances for different data types
export const searchResultsCache = new PerformanceCache({
  ttl: 10 * 60 * 1000, // 10 minutes for search results
  maxSize: 50,
  persist: true
})

export const projectCache = new PerformanceCache({
  ttl: 5 * 60 * 1000, // 5 minutes for project data
  maxSize: 100,
  persist: false // Projects change more frequently
})

export const articleCache = new PerformanceCache({
  ttl: 15 * 60 * 1000, // 15 minutes for articles
  maxSize: 200,
  persist: true
})

export const apiCache = new PerformanceCache({
  ttl: 2 * 60 * 1000, // 2 minutes for API calls
  maxSize: 50,
  persist: false
})

// Cache key generators
export const cacheKeys = {
  searchResults: (query: string, projectId: string, filters?: any) => 
    `search:${projectId}:${query}:${JSON.stringify(filters || {})}`,
  
  projectArticles: (projectId: string, status?: string, page?: number) => 
    `articles:${projectId}:${status || 'all'}:${page || 0}`,
  
  projectStats: (projectId: string) => 
    `stats:${projectId}`,
  
  userProjects: (userId: string) => 
    `projects:${userId}`,
  
  apiCall: (endpoint: string, params?: any) => 
    `api:${endpoint}:${JSON.stringify(params || {})}`
}

// Utility functions
export const withCache = async <T>(
  cache: PerformanceCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Try cache first
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }

  // Fetch and cache
  try {
    const data = await fetcher()
    cache.set(key, data, ttl)
    return data
  } catch (error) {
    // Don't cache errors, just throw
    throw error
  }
}

// Background cache cleanup
export const startCacheCleanup = () => {
  const cleanup = () => {
    [searchResultsCache, projectCache, articleCache, apiCache].forEach(cache => {
      const stats = cache.getStats()
      console.log('Cache cleanup:', stats)
      
      // Remove expired entries
      const keys = Array.from((cache as any).cache.keys())
      keys.forEach(key => {
        cache.get(key) // This will remove expired entries
      })
    })
    
    // Save persistent caches
    searchResultsCache.saveToStorage()
    articleCache.saveToStorage()
  }

  // Clean up every 5 minutes
  setInterval(cleanup, 5 * 60 * 1000)
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    searchResultsCache.saveToStorage()
    articleCache.saveToStorage()
  })
}

export default PerformanceCache