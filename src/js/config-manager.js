/**
 * Configuration Management System
 * 
 * Centralizes all application configuration settings and provides
 * environment-specific configurations, feature flags, and user preferences.
 * 
 * This follows the single source of truth principle for configuration.
 */

export default class ConfigManager {
  constructor() {
    this._configs = new Map();
    this._environment = this._detectEnvironment();
    this._loadConfigurations();
  }

  /**
   * Get configuration value by key with optional environment override
   * @param {string} key - Configuration key (supports dot notation like 'app.name')
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Configuration value
   */
  get(key, defaultValue = null) {
    // Try environment-specific config first
    const envKey = `${this._environment}.${key}`;
    if (this._configs.has(envKey)) {
      return this._configs.get(envKey);
    }
    
    // Fall back to general config
    if (this._configs.has(key)) {
      return this._configs.get(key);
    }
    
    return defaultValue;
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   */
  set(key, value) {
    this._configs.set(key, value);
    this._persistUserPreferences();
  }

  /**
   * Get all configurations for debugging
   * @returns {Object} All configurations as plain object
   */
  getAll() {
    const result = {};
    for (const [key, value] of this._configs) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Check if feature flag is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} True if feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Get current environment
   * @returns {string} Current environment (development|production|test)
   */
  getEnvironment() {
    return this._environment;
  }

  /**
   * Detect current environment based on various factors
   * @private
   * @returns {string} Detected environment
   */
  _detectEnvironment() {
    // Check for test environment
    if (typeof global !== 'undefined' && global.process?.env?.NODE_ENV === 'test') {
      return 'test';
    }
    
    // Check if running in Jest test environment
    if (typeof jest !== 'undefined') {
      return 'test';
    }
    
    // Check for development indicators
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // Local development indicators
      if (hostname === 'localhost' || hostname === '127.0.0.1' || port === '8000') {
        return 'development';
      }
    }
    
    return 'production';
  }

  /**
   * Load all configuration settings
   * @private
   */
  _loadConfigurations() {
    // Application metadata
    this._configs.set('app.name', 'Roadmap Tool v2');
    this._configs.set('app.version', '1.0.0');
    this._configs.set('app.description', 'Comprehensive project roadmap and strategic planning tool');

    // Storage configurations
    this._configs.set('storage.main.key', 'roadmapData');
    this._configs.set('storage.backup.prefix', 'roadmapBackup_');
    this._configs.set('storage.preferences.key', 'roadmapPreferences');
    this._configs.set('storage.max.backups', 10);

    // Development environment overrides
    this._configs.set('development.server.port', 8000);
    this._configs.set('development.server.host', 'localhost');
    this._configs.set('development.logging.level', 'debug');
    this._configs.set('development.features.debug_mode', true);

    // Production environment overrides
    this._configs.set('production.logging.level', 'warn');
    this._configs.set('production.features.debug_mode', false);
    this._configs.set('production.performance.enable_monitoring', true);

    // Test environment overrides
    this._configs.set('test.storage.main.key', 'roadmapData_test');
    this._configs.set('test.storage.backup.prefix', 'roadmapBackup_test_');
    this._configs.set('test.logging.level', 'error');

    // Feature flags
    this._configs.set('features.drag_drop', true);
    this._configs.set('features.csv_import_export', true);
    this._configs.set('features.github_integration', false); // Will be enabled when implemented
    this._configs.set('features.strategic_planning', true);
    this._configs.set('features.forecasting', true);
    this._configs.set('features.advanced_reporting', false); // Future feature

    // UI Configuration
    this._configs.set('ui.theme', 'default');
    this._configs.set('ui.date_format', 'DD-MM-YYYY'); // New Zealand format
    this._configs.set('ui.currency_symbol', '$');
    this._configs.set('ui.timezone', 'Pacific/Auckland');
    this._configs.set('ui.items_per_page', 20);
    this._configs.set('ui.auto_save_interval', 30000); // 30 seconds

    // Validation settings
    this._configs.set('validation.project.title.max_length', 255);
    this._configs.set('validation.project.description.max_length', 2000);
    this._configs.set('validation.task.title.max_length', 255);
    this._configs.set('validation.budget.max_value', 999999999999); // $9,999,999,999.99

    // API Configuration (for future integrations)
    this._configs.set('api.github.base_url', 'https://api.github.com');
    this._configs.set('api.timeout', 30000); // 30 seconds
    this._configs.set('api.retry.max_attempts', 3);
    this._configs.set('api.retry.delay', 1000); // 1 second

    // Performance settings
    this._configs.set('performance.cache.ttl', 300000); // 5 minutes
    this._configs.set('performance.debounce.search', 300); // 300ms
    this._configs.set('performance.debounce.input', 500); // 500ms

    // Error handling
    this._configs.set('errors.max_stack_trace_length', 1000);
    this._configs.set('errors.user_friendly_messages', true);
    this._configs.set('errors.log_client_errors', true);

    // Load user preferences from localStorage
    this._loadUserPreferences();
  }

  /**
   * Load user preferences from localStorage
   * @private
   */
  _loadUserPreferences() {
    try {
      const preferencesKey = this.get('storage.preferences.key');
      const stored = localStorage.getItem(preferencesKey);
      
      if (stored) {
        const preferences = JSON.parse(stored);
        
        // Apply user preferences with 'user.' prefix to avoid conflicts
        for (const [key, value] of Object.entries(preferences)) {
          this._configs.set(`user.${key}`, value);
        }
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error.message);
    }
  }

  /**
   * Persist user preferences to localStorage
   * @private
   */
  _persistUserPreferences() {
    try {
      const userPreferences = {};
      
      // Extract user preferences (keys starting with 'user.')
      for (const [key, value] of this._configs) {
        if (key.startsWith('user.')) {
          const prefKey = key.substring(5); // Remove 'user.' prefix
          userPreferences[prefKey] = value;
        }
      }
      
      const preferencesKey = this.get('storage.preferences.key');
      localStorage.setItem(preferencesKey, JSON.stringify(userPreferences));
    } catch (error) {
      console.warn('Failed to persist user preferences:', error.message);
    }
  }
}

// Create singleton instance
const configManager = new ConfigManager();

// Export both the class and singleton for different use cases
export { ConfigManager, configManager };