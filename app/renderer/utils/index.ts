/**
 * Utility Functions
 * 
 * This file contains utility functions that can be used throughout
 * the Roadmap-Electron application for common operations.
 */

import { CONSTANTS } from '../constants';
import type { 
  Priority, 
  WorkItemState, 
  EpicSizing, 
  RiskLevel, 
  ValueArea,
  DependencyType,
  FinancialTreatment,
  TestCategory 
} from '../types';

/**
 * Date Utilities
 */
export const dateUtils = {
  /**
   * Format a date according to the application's standard format
   */
  format(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format a date for form inputs (YYYY-MM-DD)
   */
  formatForInput(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  },

  /**
   * Get relative time string (e.g., "2 days ago", "in 3 hours")
   */
  getRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = d.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffInDays) === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (Math.abs(diffInHours) === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes > 0 ? `in ${diffInMinutes} minutes` : `${Math.abs(diffInMinutes)} minutes ago`;
      }
      return diffInHours > 0 ? `in ${diffInHours} hours` : `${Math.abs(diffInHours)} hours ago`;
    }

    return diffInDays > 0 ? `in ${diffInDays} days` : `${Math.abs(diffInDays)} days ago`;
  },

  /**
   * Check if a date is overdue
   */
  isOverdue(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
  },

  /**
   * Get the start of the current sprint/iteration
   */
  getCurrentSprintStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(now.setDate(diff));
  }
};

/**
 * String Utilities
 */
export const stringUtils = {
  /**
   * Capitalize the first letter of a string
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Convert string to title case
   */
  toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  /**
   * Truncate string with ellipsis
   */
  truncate(str: string, maxLength: number = 100): string {
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  },

  /**
   * Remove HTML tags from string
   */
  stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },

  /**
   * Generate a slug from a string
   */
  slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  },

  /**
   * Generate a random string of specified length
   */
  generateRandomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

/**
 * Array Utilities
 */
export const arrayUtils = {
  /**
   * Remove duplicates from array
   */
  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  },

  /**
   * Group array by a property
   */
  groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * Sort array by multiple criteria
   */
  sortBy<T>(array: T[], ...criteria: Array<keyof T | ((item: T) => any)>): T[] {
    return array.slice().sort((a, b) => {
      for (const criterion of criteria) {
        const valueA = typeof criterion === 'function' ? criterion(a) : a[criterion];
        const valueB = typeof criterion === 'function' ? criterion(b) : b[criterion];
        
        if (valueA < valueB) return -1;
        if (valueA > valueB) return 1;
      }
      return 0;
    });
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Flatten nested array
   */
  flatten<T>(array: (T | T[])[]): T[] {
    return array.reduce<T[]>((flat, item) => 
      flat.concat(Array.isArray(item) ? arrayUtils.flatten(item) : item), []);
  }
};

/**
 * Object Utilities
 */
export const objectUtils = {
  /**
   * Deep clone an object
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (Array.isArray(obj)) return obj.map(item => objectUtils.deepClone(item)) as any;
    
    const cloned = {} as T;
    Object.keys(obj).forEach(key => {
      cloned[key as keyof T] = objectUtils.deepClone((obj as any)[key]);
    });
    return cloned;
  },

  /**
   * Deep merge objects
   */
  deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = objectUtils.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  },

  /**
   * Get nested property value safely
   */
  get<T>(obj: any, path: string, defaultValue?: T): T | undefined {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) return defaultValue;
    }
    
    return result;
  },

  /**
   * Set nested property value
   */
  set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  },

  /**
   * Pick specific properties from object
   */
  pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  /**
   * Omit specific properties from object
   */
  omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }
};

/**
 * Local Storage Utilities
 */
export const storageUtils = {
  /**
   * Set item in localStorage with error handling
   */
  setItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting localStorage item:', error);
      return false;
    }
  },

  /**
   * Get item from localStorage with error handling
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : (defaultValue ?? null);
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      return defaultValue ?? null;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing localStorage item:', error);
      return false;
    }
  },

  /**
   * Clear all localStorage items
   */
  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

/**
 * Validation Utilities
 */
export const validationUtils = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if string is not empty (after trimming)
   */
  isNotEmpty(value: string): boolean {
    return value.trim().length > 0;
  },

  /**
   * Validate required fields
   */
  validateRequired(fields: Record<string, any>): string[] {
    const errors: string[] = [];
    Object.entries(fields).forEach(([key, value]) => {
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors.push(`${stringUtils.toTitleCase(key)} is required`);
      }
    });
    return errors;
  },

  /**
   * Validate field length
   */
  validateLength(value: string, min: number, max?: number): string | null {
    if (value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    if (max && value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  }
};

/**
 * Work Item Utilities
 */
export const workItemUtils = {
  /**
   * Get priority label
   */
  getPriorityLabel(priority: Priority): string {
    return CONSTANTS.PRIORITY_OPTIONS.find(p => p.value === priority)?.label || 'Unknown';
  },

  /**
   * Get status label
   */
  getStatusLabel(state: WorkItemState): string {
    return CONSTANTS.WORK_ITEM_STATES.find(s => s.value === state)?.label || 'Unknown';
  },

  /**
   * Get epic sizing label
   */
  getEpicSizingLabel(sizing: EpicSizing): string {
    return CONSTANTS.EPIC_SIZING_OPTIONS.find(s => s.value === sizing)?.label || 'Unknown';
  },

  /**
   * Get risk level label
   */
  getRiskLevelLabel(risk: RiskLevel): string {
    return CONSTANTS.RISK_LEVELS.find(r => r.value === risk)?.label || 'Unknown';
  },

  /**
   * Get value area label
   */
  getValueAreaLabel(area: ValueArea): string {
    return CONSTANTS.VALUE_AREA_OPTIONS.find(a => a.value === area)?.label || 'Unknown';
  },

  /**
   * Get dependency type label
   */
  getDependencyTypeLabel(type: DependencyType): string {
    return CONSTANTS.DEPENDENCY_TYPES.find(t => t.value === type)?.label || 'Unknown';
  },

  /**
   * Get financial treatment label
   */
  getFinancialTreatmentLabel(treatment: FinancialTreatment): string {
    return CONSTANTS.FINANCIAL_TREATMENT_OPTIONS.find(t => t.value === treatment)?.label || 'Unknown';
  },

  /**
   * Get test category label
   */
  getTestCategoryLabel(category: TestCategory): string {
    return CONSTANTS.TEST_CATEGORIES.find(c => c.value === category)?.label || 'Unknown';
  },

  /**
   * Get priority color class
   */
  getPriorityColorClass(priority: Priority): string {
    return `priority-${priority}`;
  },

  /**
   * Get status color class
   */
  getStatusColorClass(state: WorkItemState): string {
    const stateMap: Record<WorkItemState, string> = {
      'New': 'status-new',
      'Active': 'status-active',
      'Resolved': 'status-resolved',
      'Closed': 'status-closed',
      'Removed': 'status-closed'
    };
    return stateMap[state] || 'status-new';
  },

  /**
   * Get risk color class
   */
  getRiskColorClass(risk: RiskLevel): string {
    return `risk-${risk.toLowerCase()}`;
  },

  /**
   * Generate work item ID
   */
  generateId(): string {
    return `WI-${Date.now()}-${stringUtils.generateRandomString(4)}`;
  }
};

/**
 * Form Utilities
 */
export const formUtils = {
  /**
   * Create form data object from FormData
   */
  formDataToObject(formData: FormData): Record<string, any> {
    const obj: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (obj[key]) {
        if (Array.isArray(obj[key])) {
          obj[key].push(value);
        } else {
          obj[key] = [obj[key], value];
        }
      } else {
        obj[key] = value;
      }
    });
    return obj;
  },

  /**
   * Reset form to default values
   */
  resetFormToDefaults<T extends Record<string, any>>(
    currentValues: T,
    defaultValues: Partial<T>
  ): T {
    return objectUtils.deepMerge(currentValues, defaultValues);
  },

  /**
   * Check if form has changes
   */
  hasFormChanged<T extends Record<string, any>>(
    current: T,
    original: T,
    ignoreKeys: string[] = []
  ): boolean {
    const currentFiltered = objectUtils.omit(current, ignoreKeys as any);
    const originalFiltered = objectUtils.omit(original, ignoreKeys as any);
    
    return JSON.stringify(currentFiltered) !== JSON.stringify(originalFiltered);
  }
};

/**
 * URL Utilities
 */
export const urlUtils = {
  /**
   * Build query string from object
   */
  buildQueryString(params: Record<string, any>): string {
    const filtered = Object.entries(params).filter(([_, value]) => 
      value !== undefined && value !== null && value !== ''
    );
    
    if (filtered.length === 0) return '';
    
    const query = filtered
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    return `?${query}`;
  },

  /**
   * Parse query string to object
   */
  parseQueryString(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
    
    query.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });
    
    return params;
  }
};

/**
 * Error Utilities
 */
export const errorUtils = {
  /**
   * Extract error message from various error types
   */
  getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'An unknown error occurred';
  },

  /**
   * Check if error is a network error
   */
  isNetworkError(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' || 
           error?.message?.toLowerCase().includes('network') ||
           error?.message?.toLowerCase().includes('fetch');
  },

  /**
   * Format error for user display
   */
  formatErrorForUser(error: any): string {
    const message = errorUtils.getErrorMessage(error);
    
    // Common error patterns and their user-friendly versions
    const errorMappings: Record<string, string> = {
      'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
      'TIMEOUT': 'Request timed out. Please try again.',
      'UNAUTHORIZED': 'You are not authorized to perform this action.',
      'FORBIDDEN': 'Access denied.',
      'NOT_FOUND': 'The requested resource was not found.',
      'VALIDATION_ERROR': 'Please check your input and try again.'
    };

    // Check for exact matches first
    if (errorMappings[message]) {
      return errorMappings[message];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(errorMappings)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // Return cleaned up original message
    return stringUtils.capitalize(message);
  }
};

/**
 * Performance Utilities
 */
export const performanceUtils = {
  /**
   * Debounce function execution
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },

  /**
   * Throttle function execution
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastExec = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastExec >= delay) {
        func.apply(null, args);
        lastExec = now;
      }
    };
  }
};

// Export all utilities as default
export default {
  dateUtils,
  stringUtils,
  arrayUtils,
  objectUtils,
  storageUtils,
  validationUtils,
  workItemUtils,
  formUtils,
  urlUtils,
  errorUtils,
  performanceUtils
};