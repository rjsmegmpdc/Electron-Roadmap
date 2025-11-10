import { StateCreator } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type { Project, ProjectStatus } from '../../main/preload';

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  enableCompression: boolean;
}

// Cached data with metadata
export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  version: string;
}

// Storage keys
export const STORAGE_KEYS = {
  PROJECTS: 'roadmap_projects_cache',
  CURRENT_PROJECT: 'roadmap_current_project',
  PROJECT_STATS: 'roadmap_project_stats',
  USER_PREFERENCES: 'roadmap_user_preferences',
  LAST_SYNC: 'roadmap_last_sync',
  CACHE_METADATA: 'roadmap_cache_metadata',
} as const;

// Version for cache invalidation
export const CACHE_VERSION = '1.0.0';

// Default cache configuration
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  enableCompression: false,
};

class PersistenceManager {
  private config: CacheConfig;
  private storage: Storage;

  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config;
    this.storage = localStorage;
    
    // Initialize cache metadata
    this.initializeCacheMetadata();
    
    // Clean expired items on startup
    this.cleanExpiredItems();
  }

  private initializeCacheMetadata() {
    const metadata = this.getCacheMetadata();
    if (!metadata.version || metadata.version !== CACHE_VERSION) {
      // Version mismatch, clear all cache
      console.log('Cache version mismatch, clearing cache');
      this.clearAll();
      this.setCacheMetadata({
        version: CACHE_VERSION,
        created: Date.now(),
        lastCleanup: Date.now(),
      });
    }
  }

  private getCacheMetadata() {
    try {
      const metadata = this.storage.getItem(STORAGE_KEYS.CACHE_METADATA);
      return metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.error('Error reading cache metadata:', error);
      return {};
    }
  }

  private setCacheMetadata(metadata: any) {
    try {
      this.storage.setItem(STORAGE_KEYS.CACHE_METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error setting cache metadata:', error);
    }
  }

  // Cache management
  public set<T>(key: string, data: T, customTtl?: number): boolean {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ttl: customTtl || this.config.ttl,
        hits: 0,
        version: CACHE_VERSION,
      };

      const serialized = this.config.enableCompression 
        ? this.compress(JSON.stringify(cachedData))
        : JSON.stringify(cachedData);

      this.storage.setItem(key, serialized);
      
      // Update cache size tracking
      this.updateCacheSize();
      
      return true;
    } catch (error) {
      console.error('Error setting cache item:', error);
      
      // Try to free space and retry
      if (this.isStorageFull(error)) {
        this.cleanup();
        try {
          this.storage.setItem(key, JSON.stringify(data));
          return true;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      return false;
    }
  }

  public get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      if (!item) return null;

      const cachedData: CachedData<T> = JSON.parse(
        this.config.enableCompression ? this.decompress(item) : item
      );

      // Check if expired
      if (this.isExpired(cachedData)) {
        this.storage.removeItem(key);
        return null;
      }

      // Update hit count
      cachedData.hits = (cachedData.hits || 0) + 1;
      this.storage.setItem(key, JSON.stringify(cachedData));

      return cachedData.data;
    } catch (error) {
      console.error('Error getting cache item:', error);
      return null;
    }
  }

  public remove(key: string): boolean {
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing cache item:', error);
      return false;
    }
  }

  public has(key: string): boolean {
    try {
      const item = this.storage.getItem(key);
      if (!item) return false;

      const cachedData: CachedData = JSON.parse(item);
      return !this.isExpired(cachedData);
    } catch (error) {
      return false;
    }
  }

  public clear(pattern?: string): number {
    let cleared = 0;
    
    try {
      if (!pattern) {
        // Clear all cache items
        Object.values(STORAGE_KEYS).forEach(key => {
          if (this.storage.getItem(key)) {
            this.storage.removeItem(key);
            cleared++;
          }
        });
      } else {
        // Clear items matching pattern
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key && key.includes(pattern)) {
            this.storage.removeItem(key);
            cleared++;
          }
        }
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
    
    return cleared;
  }

  public clearAll(): number {
    let cleared = 0;
    try {
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith('roadmap_')) {
          this.storage.removeItem(key);
          cleared++;
        }
      });
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
    return cleared;
  }

  // Cache statistics
  public getStats() {
    const stats = {
      totalItems: 0,
      totalSize: 0,
      expiredItems: 0,
      hitCounts: {} as Record<string, number>,
    };

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = this.storage.getItem(key);
        if (item) {
          stats.totalItems++;
          stats.totalSize += item.length;
          
          try {
            const cachedData: CachedData = JSON.parse(item);
            if (this.isExpired(cachedData)) {
              stats.expiredItems++;
            }
            if (cachedData.hits) {
              stats.hitCounts[key] = cachedData.hits;
            }
          } catch (parseError) {
            // Invalid cached data
          }
        }
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return stats;
  }

  // Cleanup expired items
  public cleanExpiredItems(): number {
    let cleaned = 0;
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = this.storage.getItem(key);
        if (item) {
          try {
            const cachedData: CachedData = JSON.parse(item);
            if (this.isExpired(cachedData)) {
              this.storage.removeItem(key);
              cleaned++;
            }
          } catch (parseError) {
            // Invalid cached data, remove it
            this.storage.removeItem(key);
            cleaned++;
          }
        }
      });
      
      // Update last cleanup time
      const metadata = this.getCacheMetadata();
      this.setCacheMetadata({ ...metadata, lastCleanup: Date.now() });
    } catch (error) {
      console.error('Error cleaning expired items:', error);
    }
    
    return cleaned;
  }

  // Private helper methods
  private isExpired(cachedData: CachedData): boolean {
    if (!cachedData.timestamp || !cachedData.ttl) {
      return true; // Invalid data, consider expired
    }
    
    return Date.now() - cachedData.timestamp > cachedData.ttl;
  }

  private isStorageFull(error: any): boolean {
    return error.name === 'QuotaExceededError' || 
           error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
  }

  private cleanup(): number {
    // First, clean expired items
    let cleaned = this.cleanExpiredItems();
    
    // If still need space, remove least recently used items
    if (this.getCacheSize() > this.config.maxSize) {
      cleaned += this.removeOldestItems(Math.floor(this.config.maxSize * 0.2));
    }
    
    return cleaned;
  }

  private removeOldestItems(count: number): number {
    const items: Array<{ key: string; timestamp: number; hits: number }> = [];
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = this.storage.getItem(key);
        if (item) {
          try {
            const cachedData: CachedData = JSON.parse(item);
            items.push({
              key,
              timestamp: cachedData.timestamp || 0,
              hits: cachedData.hits || 0,
            });
          } catch (parseError) {
            // Invalid data, add to removal list
            items.push({ key, timestamp: 0, hits: 0 });
          }
        }
      });
      
      // Sort by hits (ascending) then by timestamp (ascending)
      items.sort((a, b) => {
        if (a.hits !== b.hits) {
          return a.hits - b.hits; // Fewer hits first
        }
        return a.timestamp - b.timestamp; // Older items first
      });
      
      // Remove the least valuable items
      const toRemove = items.slice(0, count);
      toRemove.forEach(({ key }) => {
        this.storage.removeItem(key);
      });
      
      return toRemove.length;
    } catch (error) {
      console.error('Error removing oldest items:', error);
      return 0;
    }
  }

  private getCacheSize(): number {
    let size = 0;
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        if (this.storage.getItem(key)) {
          size++;
        }
      });
    } catch (error) {
      console.error('Error getting cache size:', error);
    }
    return size;
  }

  private updateCacheSize() {
    // Implementation for cache size tracking
    // This could trigger cleanup if needed
    if (this.getCacheSize() > this.config.maxSize) {
      this.cleanup();
    }
  }

  private compress(data: string): string {
    // Simple compression placeholder
    // In a real implementation, you might use LZ-string or similar
    return data;
  }

  private decompress(data: string): string {
    // Simple decompression placeholder
    return data;
  }
}

// Global persistence manager instance
export const persistenceManager = new PersistenceManager();

// Custom storage implementation for Zustand
const createPersistentStorage = (key: string, ttl?: number): StateStorage => ({
  getItem: (name: string) => {
    const data = persistenceManager.get<any>(`${key}_${name}`);
    return data ? JSON.stringify(data) : null;
  },
  setItem: (name: string, value: string) => {
    try {
      const data = JSON.parse(value);
      persistenceManager.set(`${key}_${name}`, data, ttl);
    } catch (error) {
      console.error('Error storing persisted state:', error);
    }
  },
  removeItem: (name: string) => {
    persistenceManager.remove(`${key}_${name}`);
  },
});

// Persistence middleware configurations
export const projectStorePersist = persist(
  // This will be used in the store configuration
  (set, get, api) => ({
    // The store state will be defined in projectStore.ts
  }),
  {
    name: 'project-store',
    storage: createJSONStorage(() => createPersistentStorage('projects', 10 * 60 * 1000)), // 10 minute TTL
    partialize: (state: any) => ({
      // Only persist specific parts of the state
      currentProject: state.currentProject,
      stats: state.stats,
      // Don't persist loading states or errors
    }),
    version: 1,
    migrate: (persistedState: any, version: number) => {
      // Handle migration between versions
      if (version === 0) {
        // Migrate from version 0 to 1
        return {
          ...persistedState,
          // Add any necessary transformations
        };
      }
      return persistedState;
    },
  }
);

// Project-specific persistence functions
export const projectPersistence = {
  // Cache projects list
  cacheProjects: (projects: Project[]) => {
    persistenceManager.set(STORAGE_KEYS.PROJECTS, projects, 5 * 60 * 1000); // 5 minutes
  },

  // Get cached projects
  getCachedProjects: (): Project[] | null => {
    return persistenceManager.get<Project[]>(STORAGE_KEYS.PROJECTS);
  },

  // Cache current project
  cacheCurrentProject: (project: Project | null) => {
    if (project) {
      persistenceManager.set(STORAGE_KEYS.CURRENT_PROJECT, project, 15 * 60 * 1000); // 15 minutes
    } else {
      persistenceManager.remove(STORAGE_KEYS.CURRENT_PROJECT);
    }
  },

  // Get cached current project
  getCachedCurrentProject: (): Project | null => {
    return persistenceManager.get<Project>(STORAGE_KEYS.CURRENT_PROJECT);
  },

  // Cache project stats
  cacheProjectStats: (stats: any) => {
    persistenceManager.set(STORAGE_KEYS.PROJECT_STATS, stats, 10 * 60 * 1000); // 10 minutes
  },

  // Get cached project stats
  getCachedProjectStats: (): any | null => {
    return persistenceManager.get(STORAGE_KEYS.PROJECT_STATS);
  },

  // Set last sync timestamp
  setLastSync: (timestamp: number = Date.now()) => {
    persistenceManager.set(STORAGE_KEYS.LAST_SYNC, timestamp, 24 * 60 * 60 * 1000); // 24 hours
  },

  // Get last sync timestamp
  getLastSync: (): number | null => {
    return persistenceManager.get<number>(STORAGE_KEYS.LAST_SYNC);
  },

  // Check if data should be refreshed
  shouldRefresh: (maxAge: number = 5 * 60 * 1000): boolean => {
    const lastSync = persistenceManager.get<number>(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;
    
    return Date.now() - lastSync > maxAge;
  },

  // Clear all project-related cache
  clearProjectCache: () => {
    return persistenceManager.clear('projects');
  },

  // Get cache statistics
  getCacheStats: () => {
    return persistenceManager.getStats();
  },

  // Manual cleanup
  cleanup: () => {
    return persistenceManager.cleanExpiredItems();
  },
};

// Export types for use in stores
export type PersistenceConfig = typeof projectStorePersist;
export type ProjectPersistence = typeof projectPersistence;

export default persistenceManager;