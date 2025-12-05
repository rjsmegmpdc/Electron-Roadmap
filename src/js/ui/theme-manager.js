/**
 * Theme Manager
 * 
 * Advanced theming system with dynamic theme switching, customization,
 * accessibility features, and user preferences management.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';

export class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.currentTheme = null;
    this.customizations = new Map();
    this.observers = [];
    this.transitionDuration = 300;
    
    this.config = {
      autoSwitchEnabled: configManager.get('theme.autoSwitch', true),
      respectSystemTheme: configManager.get('theme.respectSystem', true),
      persistUserChoice: configManager.get('theme.persistChoice', true),
      enableTransitions: configManager.get('theme.transitions', true),
      highContrast: configManager.get('theme.highContrast', false),
      reducedMotion: configManager.get('theme.reducedMotion', false)
    };
    
    this.logger = logger.group ? logger.group('Theme') : logger;
    
    // CSS custom properties for theming
    this.cssVariables = new Map();
    
    // Theme categories for organization
    this.categories = {
      light: 'Light themes',
      dark: 'Dark themes',
      high_contrast: 'High contrast themes',
      custom: 'Custom themes'
    };
    
    this._setupEventListeners();
    this._loadBuiltinThemes();
    this._detectSystemPreferences();
  }

  /**
   * Initialize the theme manager
   */
  initialize() {
    try {
      this.logger.info('Initializing theme manager');
      
      // Load user customizations
      this._loadCustomizations();
      
      // Setup accessibility features
      this._setupAccessibility();
      
      // Apply initial theme
      this._applyInitialTheme();
      
      // Setup system theme detection
      this._setupSystemThemeDetection();
      
      this.logger.info('Theme manager initialized successfully');
      
      eventBus.emit('theme:initialized', {
        themesCount: this.themes.size,
        currentTheme: this.currentTheme?.id,
        systemThemeSupported: this._supportsSystemTheme()
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize theme manager', { error: error.message });
      errorHandler.handleError(error, 'ThemeManager.initialize');
    }
  }

  /**
   * Register a theme
   * @param {string} id - Theme identifier
   * @param {Object} definition - Theme definition
   */
  registerTheme(id, definition) {
    try {
      const theme = {
        id,
        name: definition.name || id,
        description: definition.description || '',
        category: definition.category || 'custom',
        version: definition.version || '1.0.0',
        author: definition.author || '',
        variables: definition.variables || {},
        css: definition.css || '',
        extends: definition.extends || null,
        accessibility: {
          highContrast: definition.highContrast || false,
          reducedMotion: definition.reducedMotion || false,
          colorBlindness: definition.colorBlindness || false
        },
        preview: definition.preview || null,
        metadata: definition.metadata || {}
      };
      
      // Validate theme
      this._validateTheme(theme);
      
      // Process inheritance
      if (theme.extends) {
        this._processThemeInheritance(theme);
      }
      
      // Register theme
      this.themes.set(id, theme);
      
      this.logger.debug('Theme registered', { 
        id, 
        name: theme.name,
        category: theme.category 
      });
      
      eventBus.emit('theme:registered', { theme });
      
    } catch (error) {
      this.logger.error('Failed to register theme', { error: error.message, id });
      errorHandler.handleError(error, 'ThemeManager.registerTheme', { id });
    }
  }

  /**
   * Apply a theme
   * @param {string} themeId - Theme identifier
   * @param {Object} options - Application options
   * @returns {Promise<boolean>} Application success
   */
  async applyTheme(themeId, options = {}) {
    try {
      const theme = this.themes.get(themeId);
      if (!theme) {
        throw new Error(`Theme '${themeId}' not found`);
      }
      
      const previousTheme = this.currentTheme;
      
      // Apply transition if enabled
      if (this.config.enableTransitions && !options.immediate) {
        await this._applyWithTransition(theme, previousTheme);
      } else {
        await this._applyThemeDirectly(theme);
      }
      
      this.currentTheme = theme;
      
      // Save user preference
      if (this.config.persistUserChoice && !options.temporary) {
        configManager.set('theme.current', themeId);
      }
      
      this.logger.debug('Theme applied', { 
        themeId, 
        name: theme.name,
        previous: previousTheme?.id 
      });
      
      eventBus.emit('theme:applied', { 
        theme, 
        previousTheme,
        options 
      });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to apply theme', { error: error.message, themeId });
      return false;
    }
  }

  /**
   * Get current theme
   * @returns {Object|null} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get all registered themes
   * @param {string} category - Filter by category (optional)
   * @returns {Array} Array of themes
   */
  getThemes(category = null) {
    const themes = Array.from(this.themes.values());
    
    if (category) {
      return themes.filter(theme => theme.category === category);
    }
    
    return themes;
  }

  /**
   * Get themes grouped by category
   * @returns {Object} Grouped themes
   */
  getGroupedThemes() {
    const grouped = {};
    
    for (const theme of this.themes.values()) {
      const category = theme.category || 'custom';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(theme);
    }
    
    return grouped;
  }

  /**
   * Customize theme variable
   * @param {string} variable - CSS variable name
   * @param {string} value - CSS value
   * @param {boolean} persistent - Whether to persist the customization
   */
  customizeVariable(variable, value, persistent = true) {
    try {
      // Apply immediately
      document.documentElement.style.setProperty(`--${variable}`, value);
      
      // Store customization
      this.customizations.set(variable, value);
      
      // Persist if requested
      if (persistent) {
        this._saveCustomizations();
      }
      
      this.logger.debug('Theme variable customized', { variable, value });
      
      eventBus.emit('theme:variable:changed', { variable, value });
      
    } catch (error) {
      this.logger.error('Failed to customize variable', { 
        error: error.message, 
        variable, 
        value 
      });
    }
  }

  /**
   * Reset customizations
   * @param {Array} variables - Specific variables to reset (optional)
   */
  resetCustomizations(variables = null) {
    try {
      const toReset = variables || Array.from(this.customizations.keys());
      
      for (const variable of toReset) {
        // Remove custom property
        document.documentElement.style.removeProperty(`--${variable}`);
        
        // Remove from customizations
        this.customizations.delete(variable);
      }
      
      // Re-apply current theme to restore defaults
      if (this.currentTheme) {
        this._applyThemeVariables(this.currentTheme);
      }
      
      // Save changes
      this._saveCustomizations();
      
      this.logger.debug('Customizations reset', { variables: toReset });
      
      eventBus.emit('theme:customizations:reset', { variables: toReset });
      
    } catch (error) {
      this.logger.error('Failed to reset customizations', { error: error.message });
    }
  }

  /**
   * Export current theme with customizations
   * @returns {Object} Exportable theme data
   */
  exportCurrentTheme() {
    try {
      if (!this.currentTheme) {
        throw new Error('No theme is currently applied');
      }
      
      const exportData = {
        id: `${this.currentTheme.id}_custom_${Date.now()}`,
        name: `${this.currentTheme.name} (Custom)`,
        description: `Customized version of ${this.currentTheme.name}`,
        category: 'custom',
        extends: this.currentTheme.id,
        variables: Object.fromEntries(this.customizations),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      this.logger.debug('Theme exported', { id: exportData.id });
      
      eventBus.emit('theme:exported', { exportData });
      
      return exportData;
      
    } catch (error) {
      this.logger.error('Failed to export theme', { error: error.message });
      return null;
    }
  }

  /**
   * Import theme
   * @param {Object} themeData - Theme data to import
   * @returns {boolean} Import success
   */
  importTheme(themeData) {
    try {
      // Validate import data
      if (!themeData.id || !themeData.name) {
        throw new Error('Invalid theme data: missing required fields');
      }
      
      // Check for conflicts
      if (this.themes.has(themeData.id)) {
        throw new Error(`Theme '${themeData.id}' already exists`);
      }
      
      // Register imported theme
      this.registerTheme(themeData.id, themeData);
      
      this.logger.info('Theme imported', { 
        id: themeData.id, 
        name: themeData.name 
      });
      
      eventBus.emit('theme:imported', { theme: themeData });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to import theme', { error: error.message });
      return false;
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleDarkMode() {
    try {
      const currentCategory = this.currentTheme?.category;
      let targetThemeId = null;
      
      if (currentCategory === 'light') {
        // Switch to dark theme
        const darkThemes = this.getThemes('dark');
        targetThemeId = darkThemes[0]?.id || 'dark';
      } else {
        // Switch to light theme
        const lightThemes = this.getThemes('light');
        targetThemeId = lightThemes[0]?.id || 'light';
      }
      
      if (targetThemeId) {
        this.applyTheme(targetThemeId);
      }
      
    } catch (error) {
      this.logger.error('Failed to toggle dark mode', { error: error.message });
    }
  }

  /**
   * Get system theme preference
   * @returns {string} 'light' or 'dark'
   */
  getSystemTheme() {
    if (!this._supportsSystemTheme()) {
      return 'light';
    }
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Enable automatic theme switching based on system preference
   */
  enableAutoSwitch() {
    this.config.autoSwitchEnabled = true;
    configManager.set('theme.autoSwitch', true);
    
    if (this.config.respectSystemTheme) {
      this._applySystemTheme();
    }
    
    this.logger.debug('Auto theme switching enabled');
    eventBus.emit('theme:auto-switch:enabled');
  }

  /**
   * Disable automatic theme switching
   */
  disableAutoSwitch() {
    this.config.autoSwitchEnabled = false;
    configManager.set('theme.autoSwitch', false);
    
    this.logger.debug('Auto theme switching disabled');
    eventBus.emit('theme:auto-switch:disabled');
  }

  /**
   * Get theme preview data
   * @param {string} themeId - Theme identifier
   * @returns {Object|null} Preview data
   */
  getThemePreview(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) {
      return null;
    }
    
    return {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      category: theme.category,
      preview: theme.preview,
      primaryColors: this._extractPrimaryColors(theme),
      accessibility: theme.accessibility
    };
  }

  // Private Methods

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Configuration changes
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('theme.')) {
        this._updateConfig();
      }
    });
    
    // Window events
    window.addEventListener('storage', (event) => {
      if (event.key === 'theme.current') {
        this._handleStorageChange(event);
      }
    });
  }

  /**
   * Load built-in themes
   * @private
   */
  _loadBuiltinThemes() {
    // Light theme
    this.registerTheme('light', {
      name: 'Light',
      description: 'Clean light theme',
      category: 'light',
      variables: {
        'primary-bg': '#ffffff',
        'secondary-bg': '#f8f9fa',
        'tertiary-bg': '#e9ecef',
        'primary-text': '#212529',
        'secondary-text': '#6c757d',
        'muted-text': '#adb5bd',
        'primary-color': '#007bff',
        'success-color': '#28a745',
        'warning-color': '#ffc107',
        'danger-color': '#dc3545',
        'info-color': '#17a2b8',
        'border-color': '#dee2e6',
        'shadow-color': 'rgba(0, 0, 0, 0.1)',
        'focus-color': 'rgba(0, 123, 255, 0.25)',
        'selection-bg': 'rgba(0, 123, 255, 0.2)'
      }
    });
    
    // Dark theme
    this.registerTheme('dark', {
      name: 'Dark',
      description: 'Modern dark theme',
      category: 'dark',
      variables: {
        'primary-bg': '#1a1a1a',
        'secondary-bg': '#2d2d2d',
        'tertiary-bg': '#404040',
        'primary-text': '#ffffff',
        'secondary-text': '#b3b3b3',
        'muted-text': '#666666',
        'primary-color': '#0d6efd',
        'success-color': '#198754',
        'warning-color': '#ffc107',
        'danger-color': '#dc3545',
        'info-color': '#0dcaf0',
        'border-color': '#495057',
        'shadow-color': 'rgba(0, 0, 0, 0.3)',
        'focus-color': 'rgba(13, 110, 253, 0.25)',
        'selection-bg': 'rgba(13, 110, 253, 0.3)'
      }
    });
    
    // High contrast theme
    this.registerTheme('high-contrast', {
      name: 'High Contrast',
      description: 'High contrast theme for accessibility',
      category: 'high_contrast',
      accessibility: {
        highContrast: true
      },
      variables: {
        'primary-bg': '#000000',
        'secondary-bg': '#1a1a1a',
        'tertiary-bg': '#333333',
        'primary-text': '#ffffff',
        'secondary-text': '#ffffff',
        'muted-text': '#cccccc',
        'primary-color': '#ffff00',
        'success-color': '#00ff00',
        'warning-color': '#ffff00',
        'danger-color': '#ff0000',
        'info-color': '#00ffff',
        'border-color': '#ffffff',
        'shadow-color': 'rgba(255, 255, 255, 0.3)',
        'focus-color': 'rgba(255, 255, 0, 0.5)',
        'selection-bg': 'rgba(255, 255, 0, 0.3)'
      }
    });
    
    // Blue theme
    this.registerTheme('blue', {
      name: 'Ocean Blue',
      description: 'Cool blue theme',
      category: 'light',
      variables: {
        'primary-bg': '#f0f8ff',
        'secondary-bg': '#e6f3ff',
        'tertiary-bg': '#d1ebff',
        'primary-text': '#1e3a5f',
        'secondary-text': '#4a6b8a',
        'muted-text': '#7d95b3',
        'primary-color': '#0066cc',
        'success-color': '#006600',
        'warning-color': '#cc6600',
        'danger-color': '#cc0000',
        'info-color': '#0099cc',
        'border-color': '#b3d9ff',
        'shadow-color': 'rgba(0, 102, 204, 0.1)',
        'focus-color': 'rgba(0, 102, 204, 0.25)',
        'selection-bg': 'rgba(0, 102, 204, 0.2)'
      }
    });
  }

  /**
   * Detect system preferences
   * @private
   */
  _detectSystemPreferences() {
    try {
      // Detect high contrast preference
      if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        this.config.highContrast = true;
      }
      
      // Detect reduced motion preference
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.config.reducedMotion = true;
        this.config.enableTransitions = false;
      }
      
      this.logger.debug('System preferences detected', {
        highContrast: this.config.highContrast,
        reducedMotion: this.config.reducedMotion
      });
      
    } catch (error) {
      this.logger.warn('Failed to detect system preferences', { error: error.message });
    }
  }

  /**
   * Load user customizations
   * @private
   */
  _loadCustomizations() {
    try {
      const saved = configManager.get('theme.customizations', {});
      
      for (const [variable, value] of Object.entries(saved)) {
        this.customizations.set(variable, value);
      }
      
      this.logger.debug('Customizations loaded', { 
        count: this.customizations.size 
      });
      
    } catch (error) {
      this.logger.error('Failed to load customizations', { error: error.message });
    }
  }

  /**
   * Save user customizations
   * @private
   */
  _saveCustomizations() {
    try {
      const customizations = Object.fromEntries(this.customizations);
      configManager.set('theme.customizations', customizations);
      
      this.logger.debug('Customizations saved', { 
        count: Object.keys(customizations).length 
      });
      
    } catch (error) {
      this.logger.error('Failed to save customizations', { error: error.message });
    }
  }

  /**
   * Setup accessibility features
   * @private
   */
  _setupAccessibility() {
    // Monitor accessibility preferences
    if (window.matchMedia) {
      // High contrast detection
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      highContrastQuery.addListener((event) => {
        if (event.matches && !this.currentTheme?.accessibility.highContrast) {
          this._suggestHighContrastTheme();
        }
      });
      
      // Reduced motion detection
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionQuery.addListener((event) => {
        this.config.reducedMotion = event.matches;
        this.config.enableTransitions = !event.matches;
        
        eventBus.emit('theme:accessibility:motion-changed', { 
          reducedMotion: this.config.reducedMotion 
        });
      });
    }
    
    // Add theme announcement for screen readers
    this._setupThemeAnnouncement();
  }

  /**
   * Setup theme announcement for accessibility
   * @private
   */
  _setupThemeAnnouncement() {
    // Create ARIA live region for theme changes
    if (!document.getElementById('theme-status')) {
      const statusDiv = document.createElement('div');
      statusDiv.id = 'theme-status';
      statusDiv.setAttribute('aria-live', 'polite');
      statusDiv.setAttribute('aria-atomic', 'true');
      statusDiv.style.position = 'absolute';
      statusDiv.style.left = '-10000px';
      statusDiv.style.width = '1px';
      statusDiv.style.height = '1px';
      statusDiv.style.overflow = 'hidden';
      document.body.appendChild(statusDiv);
    }
    
    // Announce theme changes
    eventBus.on('theme:applied', (data) => {
      const statusDiv = document.getElementById('theme-status');
      if (statusDiv && data.theme.name) {
        statusDiv.textContent = `Theme changed to ${data.theme.name}`;
      }
    });
  }

  /**
   * Apply initial theme
   * @private
   */
  _applyInitialTheme() {
    let themeId = null;
    
    // Try user's saved preference
    if (this.config.persistUserChoice) {
      themeId = configManager.get('theme.current');
    }
    
    // Fall back to system theme if enabled
    if (!themeId && this.config.respectSystemTheme && this.config.autoSwitchEnabled) {
      const systemTheme = this.getSystemTheme();
      const themes = this.getThemes(systemTheme);
      themeId = themes[0]?.id;
    }
    
    // Final fallback to light theme
    if (!themeId) {
      themeId = 'light';
    }
    
    // Apply high contrast theme if needed
    if (this.config.highContrast) {
      const highContrastThemes = this.getThemes('high_contrast');
      if (highContrastThemes.length > 0) {
        themeId = highContrastThemes[0].id;
      }
    }
    
    this.applyTheme(themeId, { immediate: true });
  }

  /**
   * Setup system theme detection
   * @private
   */
  _setupSystemThemeDetection() {
    if (!this._supportsSystemTheme()) {
      return;
    }
    
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (event) => {
      if (this.config.autoSwitchEnabled && this.config.respectSystemTheme) {
        this._applySystemTheme();
      }
      
      eventBus.emit('theme:system:changed', { 
        isDark: event.matches,
        theme: event.matches ? 'dark' : 'light'
      });
    };
    
    darkModeQuery.addListener(handleSystemThemeChange);
  }

  /**
   * Apply system theme
   * @private
   */
  _applySystemTheme() {
    const systemTheme = this.getSystemTheme();
    const themes = this.getThemes(systemTheme);
    
    if (themes.length > 0) {
      this.applyTheme(themes[0].id, { temporary: true });
    }
  }

  /**
   * Check if system theme detection is supported
   * @private
   */
  _supportsSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all';
  }

  /**
   * Apply theme with transition
   * @private
   */
  async _applyWithTransition(theme, previousTheme) {
    return new Promise((resolve) => {
      if (!this.config.enableTransitions || this.config.reducedMotion) {
        this._applyThemeDirectly(theme);
        resolve();
        return;
      }
      
      // Add transition class
      document.documentElement.classList.add('theme-transitioning');
      
      // Apply theme
      this._applyThemeDirectly(theme);
      
      // Remove transition class after animation
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
        resolve();
      }, this.transitionDuration);
    });
  }

  /**
   * Apply theme directly
   * @private
   */
  _applyThemeDirectly(theme) {
    // Apply CSS variables
    this._applyThemeVariables(theme);
    
    // Apply custom CSS
    if (theme.css) {
      this._applyThemeCSS(theme);
    }
    
    // Apply customizations
    this._applyCustomizations();
    
    // Update body classes
    this._updateBodyClasses(theme);
  }

  /**
   * Apply theme variables
   * @private
   */
  _applyThemeVariables(theme) {
    const root = document.documentElement;
    
    // Remove existing theme variables
    this._clearThemeVariables();
    
    // Apply theme variables
    for (const [variable, value] of Object.entries(theme.variables)) {
      root.style.setProperty(`--${variable}`, value);
      this.cssVariables.set(variable, value);
    }
  }

  /**
   * Clear theme variables
   * @private
   */
  _clearThemeVariables() {
    const root = document.documentElement;
    
    for (const variable of this.cssVariables.keys()) {
      if (!this.customizations.has(variable)) {
        root.style.removeProperty(`--${variable}`);
      }
    }
    
    this.cssVariables.clear();
  }

  /**
   * Apply theme CSS
   * @private
   */
  _applyThemeCSS(theme) {
    let styleElement = document.getElementById(`theme-css-${theme.id}`);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = `theme-css-${theme.id}`;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = theme.css;
  }

  /**
   * Apply user customizations
   * @private
   */
  _applyCustomizations() {
    const root = document.documentElement;
    
    for (const [variable, value] of this.customizations) {
      root.style.setProperty(`--${variable}`, value);
    }
  }

  /**
   * Update body classes for theme
   * @private
   */
  _updateBodyClasses(theme) {
    const body = document.body;
    
    // Remove existing theme classes
    const existingThemeClasses = Array.from(body.classList).filter(cls => 
      cls.startsWith('theme-')
    );
    body.classList.remove(...existingThemeClasses);
    
    // Add new theme classes
    body.classList.add(`theme-${theme.id}`);
    body.classList.add(`theme-category-${theme.category}`);
    
    // Add accessibility classes
    if (theme.accessibility.highContrast) {
      body.classList.add('theme-high-contrast');
    }
    
    if (this.config.reducedMotion) {
      body.classList.add('theme-reduced-motion');
    }
  }

  /**
   * Validate theme definition
   * @private
   */
  _validateTheme(theme) {
    if (!theme.id || typeof theme.id !== 'string') {
      throw new Error('Theme must have a valid ID');
    }
    
    if (!theme.name || typeof theme.name !== 'string') {
      throw new Error('Theme must have a valid name');
    }
    
    if (theme.variables && typeof theme.variables !== 'object') {
      throw new Error('Theme variables must be an object');
    }
  }

  /**
   * Process theme inheritance
   * @private
   */
  _processThemeInheritance(theme) {
    const parentTheme = this.themes.get(theme.extends);
    if (!parentTheme) {
      this.logger.warn('Parent theme not found for inheritance', { 
        child: theme.id, 
        parent: theme.extends 
      });
      return;
    }
    
    // Merge variables (child overrides parent)
    theme.variables = {
      ...parentTheme.variables,
      ...theme.variables
    };
    
    // Inherit CSS if not provided
    if (!theme.css && parentTheme.css) {
      theme.css = parentTheme.css;
    }
    
    // Inherit accessibility settings
    theme.accessibility = {
      ...parentTheme.accessibility,
      ...theme.accessibility
    };
  }

  /**
   * Extract primary colors from theme
   * @private
   */
  _extractPrimaryColors(theme) {
    const colors = {};
    const colorKeys = [
      'primary-color', 'secondary-color', 'success-color', 
      'warning-color', 'danger-color', 'info-color'
    ];
    
    for (const key of colorKeys) {
      if (theme.variables[key]) {
        colors[key] = theme.variables[key];
      }
    }
    
    return colors;
  }

  /**
   * Suggest high contrast theme
   * @private
   */
  _suggestHighContrastTheme() {
    const highContrastThemes = this.getThemes('high_contrast');
    
    if (highContrastThemes.length > 0) {
      eventBus.emit('theme:accessibility:suggestion', {
        type: 'high-contrast',
        themes: highContrastThemes,
        message: 'A high contrast theme is recommended for better accessibility'
      });
    }
  }

  /**
   * Handle storage changes
   * @private
   */
  _handleStorageChange(event) {
    if (event.newValue && event.newValue !== this.currentTheme?.id) {
      this.applyTheme(event.newValue, { immediate: true });
    }
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.autoSwitchEnabled = configManager.get('theme.autoSwitch', true);
    this.config.respectSystemTheme = configManager.get('theme.respectSystem', true);
    this.config.persistUserChoice = configManager.get('theme.persistChoice', true);
    this.config.enableTransitions = configManager.get('theme.transitions', true);
    this.config.highContrast = configManager.get('theme.highContrast', false);
    this.config.reducedMotion = configManager.get('theme.reducedMotion', false);
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const themeManager = new ThemeManager();

// Auto-initialize
setTimeout(() => {
  themeManager.initialize();
}, 100);

export default themeManager;