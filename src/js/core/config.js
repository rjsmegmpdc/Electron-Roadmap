/**
 * Core Configuration - Central configuration management for Roadmap Tool
 * 
 * Provides centralized configuration management with environment-specific
 * settings, validation, and type safety.
 */

export const APP_CONFIG = {
  // Application metadata
  name: 'Roadmap Tool v2',
  version: '2.0.0',
  
  // Date format standardization
  dateFormat: {
    // Primary NZ date format used throughout the application
    nz: 'DD-MM-YYYY',
    // ISO format for internal storage and API communication
    iso: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    // Display formats
    display: {
      short: 'DD/MM/YY',
      long: 'DD MMMM YYYY',
      datetime: 'DD-MM-YYYY HH:mm'
    }
  },
  
  // Entity ID prefixes for consistent identification
  idPrefixes: {
    project: 'proj',
    task: 'task',
    resource: 'res',
    vision: 'vis',
    goal: 'goal',
    initiative: 'init',
    forecast: 'fc',
    kpi: 'kpi',
    criteria: 'crit',
    milestone: 'ms',
    risk: 'risk',
    issue: 'iss',
    audit: 'audit'
  },
  
  // Status definitions for different entity types
  statuses: {
    project: {
      concept: 'concept-design',
      solution: 'solution-design', 
      engineering: 'engineering',
      uat: 'uat',
      release: 'release'
    },
    task: {
      planned: 'planned',
      inProgress: 'in-progress',
      blocked: 'blocked',
      completed: 'completed',
      onHold: 'on-hold'
    },
    strategic: {
      draft: 'draft',
      active: 'active',
      onHold: 'on-hold',
      achieved: 'achieved',
      discontinued: 'discontinued'
    },
    initiative: {
      planning: 'planning',
      active: 'active',
      onHold: 'on-hold',
      completed: 'completed',
      cancelled: 'cancelled'
    }
  },
  
  // Priority levels standardized across all entities
  priorities: {
    critical: 'P0',
    high: 'P1',
    medium: 'P2', 
    low: 'P3'
  },
  
  // Risk levels
  riskLevels: ['low', 'medium', 'high'],
  
  // Financial treatment options
  financialTreatment: ['CAPEX', 'OPEX', 'MIXED'],
  
  // Validation rules
  validation: {
    title: {
      maxLength: 200,
      minLength: 3
    },
    description: {
      maxLength: 5000,
      minLength: 10
    },
    budgetRange: {
      min: 0,
      max: 999999999 // $999M NZD
    }
  },
  
  // Integration settings
  integrations: {
    github: {
      enabled: true,
      apiVersion: '2022-11-28',
      maxLabelsPerIssue: 20,
      maxAssigneesPerIssue: 10
    },
    azureDevOps: {
      enabled: true,
      apiVersion: '6.1',
      maxTagsPerWorkItem: 400
    }
  },
  
  // UI settings
  ui: {
    pagination: {
      defaultPageSize: 25,
      maxPageSize: 100
    },
    theme: {
      primary: '#0078d4',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107', 
      danger: '#dc3545',
      info: '#17a2b8'
    }
  },
  
  // Storage settings
  storage: {
    defaultProvider: 'localStorage',
    fallbackProvider: 'memory',
    compressionEnabled: true,
    maxStorageSize: '50MB'
  }
};

/**
 * Environment-specific configuration
 */
export const ENV_CONFIG = {
  development: {
    debug: true,
    logging: {
      level: 'debug',
      console: true,
      file: false
    },
    mock: {
      enabled: true,
      delayMs: 100
    }
  },
  
  production: {
    debug: false,
    logging: {
      level: 'error',
      console: false,
      file: true
    },
    mock: {
      enabled: false,
      delayMs: 0
    }
  },
  
  test: {
    debug: false,
    logging: {
      level: 'warn',
      console: false,
      file: false
    },
    mock: {
      enabled: true,
      delayMs: 0
    }
  }
};

/**
 * Get current environment configuration
 * @returns {Object} Environment-specific configuration
 */
export function getCurrentEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env] || ENV_CONFIG.development;
}

/**
 * Validate configuration values
 * @param {*} value - Value to validate
 * @param {string} type - Expected type
 * @param {Object} constraints - Additional constraints
 * @returns {boolean} Whether value is valid
 */
export function validateConfigValue(value, type, constraints = {}) {
  // Type validation
  if (typeof value !== type && value !== null && value !== undefined) {
    return false;
  }
  
  // String constraints
  if (type === 'string' && value) {
    if (constraints.maxLength && value.length > constraints.maxLength) {
      return false;
    }
    if (constraints.minLength && value.length < constraints.minLength) {
      return false;
    }
    if (constraints.pattern && !constraints.pattern.test(value)) {
      return false;
    }
  }
  
  // Number constraints
  if (type === 'number' && value !== null && value !== undefined) {
    if (constraints.min !== undefined && value < constraints.min) {
      return false;
    }
    if (constraints.max !== undefined && value > constraints.max) {
      return false;
    }
  }
  
  // Array constraints
  if (Array.isArray(value) && constraints.allowedValues) {
    return constraints.allowedValues.includes(value);
  }
  
  return true;
}

/**
 * Get configuration value with fallback
 * @param {string} path - Dot-notation path to config value
 * @param {*} fallback - Fallback value if not found
 * @returns {*} Configuration value or fallback
 */
export function getConfigValue(path, fallback = null) {
  const keys = path.split('.');
  let current = APP_CONFIG;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return fallback;
    }
  }
  
  return current;
}

export default APP_CONFIG;