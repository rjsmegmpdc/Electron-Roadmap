/**
 * Keyboard Shortcuts Manager
 * 
 * Advanced keyboard shortcut system with customizable hotkeys,
 * context awareness, accessibility features, and conflict resolution.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';

export class KeyboardShortcutsManager {
  constructor() {
    this.shortcuts = new Map();
    this.contexts = new Map();
    this.sequences = new Map();
    this.activeSequence = null;
    this.sequenceTimeout = null;
    this.pressedKeys = new Set();
    this.disabled = false;
    
    this.config = {
      sequenceTimeout: configManager.get('shortcuts.sequenceTimeout', 2000),
      caseSensitive: configManager.get('shortcuts.caseSensitive', false),
      enableSequences: configManager.get('shortcuts.sequences', true),
      preventDefault: configManager.get('shortcuts.preventDefault', true),
      showHelpOverlay: configManager.get('shortcuts.helpOverlay', true)
    };
    
    this.logger = logger.group ? logger.group('Shortcuts') : logger;
    
    // Modifier key mappings for different platforms
    this.modifierKeys = {
      ctrl: ['Control', 'Ctrl'],
      alt: ['Alt', 'Option'],
      shift: ['Shift'],
      meta: ['Meta', 'Cmd', 'Command'],
      super: ['Super', 'Windows']
    };
    
    // Key aliases for better usability
    this.keyAliases = {
      space: ' ',
      enter: 'Enter',
      return: 'Enter',
      tab: 'Tab',
      escape: 'Escape',
      esc: 'Escape',
      backspace: 'Backspace',
      delete: 'Delete',
      del: 'Delete',
      insert: 'Insert',
      home: 'Home',
      end: 'End',
      pageup: 'PageUp',
      pagedown: 'PageDown',
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight'
    };
    
    this._setupEventListeners();
    this._loadDefaultShortcuts();
  }

  /**
   * Initialize the keyboard shortcuts manager
   */
  initialize() {
    try {
      this.logger.info('Initializing keyboard shortcuts manager');
      
      // Load user customizations
      this._loadUserShortcuts();
      
      // Setup accessibility features
      this._setupAccessibility();
      
      // Initialize help system
      this._initializeHelpSystem();
      
      this.logger.info('Keyboard shortcuts manager initialized successfully');
      
      eventBus.emit('shortcuts:initialized', {
        shortcutsCount: this.shortcuts.size,
        contextsCount: this.contexts.size,
        sequencesCount: this.sequences.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize keyboard shortcuts manager', { error: error.message });
      errorHandler.handleError(error, 'KeyboardShortcutsManager.initialize');
    }
  }

  /**
   * Register a keyboard shortcut
   * @param {string} keys - Key combination (e.g., 'ctrl+s', 'alt+shift+n')
   * @param {Function} callback - Function to execute
   * @param {Object} options - Shortcut options
   */
  register(keys, callback, options = {}) {
    try {
      const shortcut = {
        keys: this._normalizeKeys(keys),
        callback,
        description: options.description || '',
        context: options.context || 'global',
        group: options.group || 'general',
        priority: options.priority || 0,
        preventDefault: options.preventDefault !== false,
        stopPropagation: options.stopPropagation !== false,
        repeatable: options.repeatable !== false,
        enabled: options.enabled !== false,
        global: options.global !== false,
        sequence: options.sequence || false,
        id: options.id || this._generateShortcutId(keys)
      };
      
      // Validate shortcut
      this._validateShortcut(shortcut);
      
      // Check for conflicts
      this._checkConflicts(shortcut);
      
      // Register shortcut
      const shortcutKey = `${shortcut.context}:${shortcut.keys}`;
      this.shortcuts.set(shortcutKey, shortcut);
      
      // Register sequence if needed
      if (shortcut.sequence && this.config.enableSequences) {
        this._registerSequence(shortcut);
      }
      
      this.logger.debug('Shortcut registered', { 
        keys: shortcut.keys, 
        context: shortcut.context,
        id: shortcut.id
      });
      
      eventBus.emit('shortcuts:registered', { shortcut });
      
      return shortcut.id;
      
    } catch (error) {
      this.logger.error('Failed to register shortcut', { error: error.message, keys });
      errorHandler.handleError(error, 'KeyboardShortcutsManager.register', { keys });
      return null;
    }
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} keysOrId - Key combination or shortcut ID
   * @param {string} context - Context (optional if using ID)
   */
  unregister(keysOrId, context = 'global') {
    try {
      let shortcutKey = keysOrId;
      
      // If it looks like an ID, find the shortcut
      if (!keysOrId.includes('+') && !keysOrId.includes(' ')) {
        const found = Array.from(this.shortcuts.entries()).find(([, shortcut]) => 
          shortcut.id === keysOrId
        );
        if (found) {
          shortcutKey = found[0];
        }
      } else {
        shortcutKey = `${context}:${this._normalizeKeys(keysOrId)}`;
      }
      
      const shortcut = this.shortcuts.get(shortcutKey);
      if (!shortcut) {
        this.logger.warn('Shortcut not found for unregistering', { keysOrId, context });
        return false;
      }
      
      // Remove from shortcuts
      this.shortcuts.delete(shortcutKey);
      
      // Remove from sequences if needed
      if (shortcut.sequence) {
        this._unregisterSequence(shortcut);
      }
      
      this.logger.debug('Shortcut unregistered', { 
        keys: shortcut.keys, 
        context: shortcut.context,
        id: shortcut.id
      });
      
      eventBus.emit('shortcuts:unregistered', { shortcut });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to unregister shortcut', { error: error.message, keysOrId });
      return false;
    }
  }

  /**
   * Register a keyboard shortcut sequence
   * @param {Array} sequence - Array of key combinations
   * @param {Function} callback - Function to execute
   * @param {Object} options - Sequence options
   */
  registerSequence(sequence, callback, options = {}) {
    try {
      const sequenceShortcut = {
        sequence: sequence.map(keys => this._normalizeKeys(keys)),
        callback,
        description: options.description || '',
        context: options.context || 'global',
        group: options.group || 'sequences',
        timeout: options.timeout || this.config.sequenceTimeout,
        enabled: options.enabled !== false,
        id: options.id || this._generateSequenceId(sequence)
      };
      
      // Register sequence
      const sequenceKey = `${sequenceShortcut.context}:${sequenceShortcut.sequence.join(' ')}`;
      this.sequences.set(sequenceKey, sequenceShortcut);
      
      this.logger.debug('Sequence registered', { 
        sequence: sequenceShortcut.sequence, 
        context: sequenceShortcut.context,
        id: sequenceShortcut.id
      });
      
      eventBus.emit('shortcuts:sequence:registered', { sequence: sequenceShortcut });
      
      return sequenceShortcut.id;
      
    } catch (error) {
      this.logger.error('Failed to register sequence', { error: error.message, sequence });
      return null;
    }
  }

  /**
   * Register a context
   * @param {string} name - Context name
   * @param {Object} options - Context options
   */
  registerContext(name, options = {}) {
    try {
      const context = {
        name,
        description: options.description || '',
        element: options.element || null,
        selector: options.selector || null,
        condition: options.condition || null,
        priority: options.priority || 0,
        enabled: options.enabled !== false
      };
      
      this.contexts.set(name, context);
      
      this.logger.debug('Context registered', { name });
      
      eventBus.emit('shortcuts:context:registered', { context });
      
    } catch (error) {
      this.logger.error('Failed to register context', { error: error.message, name });
    }
  }

  /**
   * Get current active context
   * @returns {string} Active context name
   */
  getCurrentContext() {
    // Check active element and determine context
    const activeElement = document.activeElement;
    
    // Sort contexts by priority (higher first)
    const sortedContexts = Array.from(this.contexts.entries())
      .sort(([, a], [, b]) => b.priority - a.priority);
    
    for (const [name, context] of sortedContexts) {
      if (!context.enabled) continue;
      
      // Check element-based context
      if (context.element && context.element.contains(activeElement)) {
        return name;
      }
      
      // Check selector-based context
      if (context.selector && activeElement.matches && activeElement.matches(context.selector)) {
        return name;
      }
      
      // Check condition-based context
      if (context.condition && context.condition(activeElement)) {
        return name;
      }
    }
    
    return 'global';
  }

  /**
   * Enable keyboard shortcuts
   */
  enable() {
    this.disabled = false;
    this.logger.debug('Keyboard shortcuts enabled');
    eventBus.emit('shortcuts:enabled');
  }

  /**
   * Disable keyboard shortcuts
   */
  disable() {
    this.disabled = true;
    this._clearActiveSequence();
    this.pressedKeys.clear();
    this.logger.debug('Keyboard shortcuts disabled');
    eventBus.emit('shortcuts:disabled');
  }

  /**
   * Toggle keyboard shortcuts
   * @returns {boolean} New enabled state
   */
  toggle() {
    if (this.disabled) {
      this.enable();
    } else {
      this.disable();
    }
    return !this.disabled;
  }

  /**
   * Enable shortcut by ID
   * @param {string} id - Shortcut ID
   */
  enableShortcut(id) {
    const shortcut = this._findShortcutById(id);
    if (shortcut) {
      shortcut.enabled = true;
      this.logger.debug('Shortcut enabled', { id });
      eventBus.emit('shortcuts:shortcut:enabled', { id, shortcut });
    }
  }

  /**
   * Disable shortcut by ID
   * @param {string} id - Shortcut ID
   */
  disableShortcut(id) {
    const shortcut = this._findShortcutById(id);
    if (shortcut) {
      shortcut.enabled = false;
      this.logger.debug('Shortcut disabled', { id });
      eventBus.emit('shortcuts:shortcut:disabled', { id, shortcut });
    }
  }

  /**
   * Get all shortcuts for a context
   * @param {string} context - Context name
   * @returns {Array} Array of shortcuts
   */
  getShortcuts(context = null) {
    const shortcuts = Array.from(this.shortcuts.values());
    
    if (context) {
      return shortcuts.filter(shortcut => 
        shortcut.context === context || shortcut.global
      );
    }
    
    return shortcuts;
  }

  /**
   * Get shortcuts grouped by category
   * @param {string} context - Context name (optional)
   * @returns {Object} Grouped shortcuts
   */
  getGroupedShortcuts(context = null) {
    const shortcuts = this.getShortcuts(context);
    const grouped = {};
    
    for (const shortcut of shortcuts) {
      const group = shortcut.group || 'general';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(shortcut);
    }
    
    return grouped;
  }

  /**
   * Show help overlay
   */
  showHelp() {
    if (!this.config.showHelpOverlay) {
      return;
    }
    
    const context = this.getCurrentContext();
    const shortcuts = this.getGroupedShortcuts(context);
    
    eventBus.emit('shortcuts:help:show', { context, shortcuts });
  }

  /**
   * Hide help overlay
   */
  hideHelp() {
    eventBus.emit('shortcuts:help:hide');
  }

  /**
   * Save user customizations
   */
  saveCustomizations() {
    try {
      const customizations = {};
      
      for (const [key, shortcut] of this.shortcuts.entries()) {
        if (shortcut.customized) {
          customizations[shortcut.id] = {
            keys: shortcut.keys,
            enabled: shortcut.enabled
          };
        }
      }
      
      configManager.set('shortcuts.customizations', customizations);
      
      this.logger.debug('Shortcut customizations saved', { 
        count: Object.keys(customizations).length 
      });
      
      eventBus.emit('shortcuts:customizations:saved', { customizations });
      
    } catch (error) {
      this.logger.error('Failed to save shortcut customizations', { error: error.message });
    }
  }

  /**
   * Reset shortcuts to defaults
   */
  resetToDefaults() {
    try {
      // Clear current shortcuts
      this.shortcuts.clear();
      this.sequences.clear();
      
      // Reload defaults
      this._loadDefaultShortcuts();
      
      // Clear user customizations
      configManager.delete('shortcuts.customizations');
      
      this.logger.info('Shortcuts reset to defaults');
      
      eventBus.emit('shortcuts:reset', {
        shortcutsCount: this.shortcuts.size
      });
      
    } catch (error) {
      this.logger.error('Failed to reset shortcuts', { error: error.message });
    }
  }

  // Private Methods

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Keyboard event listeners
    document.addEventListener('keydown', this._handleKeyDown.bind(this), true);
    document.addEventListener('keyup', this._handleKeyUp.bind(this), true);
    
    // Focus events to track context changes
    document.addEventListener('focusin', this._handleFocusChange.bind(this));
    document.addEventListener('focusout', this._handleFocusChange.bind(this));
    
    // Configuration changes
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('shortcuts.')) {
        this._updateConfig();
      }
    });

    // Window blur/focus to handle modifier key states
    window.addEventListener('blur', () => {
      this.pressedKeys.clear();
      this._clearActiveSequence();
    });
  }

  /**
   * Handle keydown events
   * @private
   */
  _handleKeyDown(event) {
    if (this.disabled) return;
    
    try {
      // Track pressed keys
      this.pressedKeys.add(event.code);
      
      // Get key combination
      const keyCombination = this._getKeyCombination(event);
      
      // Handle sequences first
      if (this.config.enableSequences && this._handleSequence(keyCombination, event)) {
        return;
      }
      
      // Get current context
      const context = this.getCurrentContext();
      
      // Find matching shortcuts
      const shortcuts = this._findMatchingShortcuts(keyCombination, context);
      
      if (shortcuts.length > 0) {
        // Execute the highest priority shortcut
        const shortcut = shortcuts[0];
        
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }
        
        // Execute callback
        this._executeShortcut(shortcut, event);
      }
      
    } catch (error) {
      this.logger.error('Error handling keydown', { error: error.message });
    }
  }

  /**
   * Handle keyup events
   * @private
   */
  _handleKeyUp(event) {
    if (this.disabled) return;
    
    // Remove from pressed keys
    this.pressedKeys.delete(event.code);
  }

  /**
   * Handle focus changes
   * @private
   */
  _handleFocusChange(event) {
    // Clear pressed keys on focus change to prevent stuck keys
    this.pressedKeys.clear();
    this._clearActiveSequence();
    
    // Emit context change event
    const newContext = this.getCurrentContext();
    eventBus.emit('shortcuts:context:changed', { context: newContext });
  }

  /**
   * Handle keyboard sequences
   * @private
   */
  _handleSequence(keyCombination, event) {
    if (!this.config.enableSequences) return false;
    
    const context = this.getCurrentContext();
    
    // Check if starting a new sequence
    if (!this.activeSequence) {
      // Find sequences that start with this key combination
      const matchingSequences = Array.from(this.sequences.values()).filter(seq => 
        seq.context === context && 
        seq.enabled && 
        seq.sequence[0] === keyCombination
      );
      
      if (matchingSequences.length > 0) {
        this.activeSequence = {
          keys: [keyCombination],
          candidates: matchingSequences,
          timestamp: Date.now()
        };
        
        // Set timeout
        this.sequenceTimeout = setTimeout(() => {
          this._clearActiveSequence();
        }, this.config.sequenceTimeout);
        
        event.preventDefault();
        return true;
      }
    } else {
      // Continue existing sequence
      const newKeys = [...this.activeSequence.keys, keyCombination];
      
      // Filter candidates that still match
      const remainingCandidates = this.activeSequence.candidates.filter(seq => {
        return newKeys.every((key, index) => seq.sequence[index] === key);
      });
      
      if (remainingCandidates.length === 0) {
        // No matching sequences, clear and try as regular shortcut
        this._clearActiveSequence();
        return false;
      }
      
      // Check for complete sequences
      const completedSequences = remainingCandidates.filter(seq => 
        seq.sequence.length === newKeys.length
      );
      
      if (completedSequences.length > 0) {
        // Execute the first completed sequence
        const sequence = completedSequences[0];
        this._executeSequence(sequence, event);
        this._clearActiveSequence();
        event.preventDefault();
        return true;
      } else {
        // Continue sequence
        this.activeSequence.keys = newKeys;
        this.activeSequence.candidates = remainingCandidates;
        
        // Reset timeout
        clearTimeout(this.sequenceTimeout);
        this.sequenceTimeout = setTimeout(() => {
          this._clearActiveSequence();
        }, this.config.sequenceTimeout);
        
        event.preventDefault();
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get key combination from event
   * @private
   */
  _getKeyCombination(event) {
    const parts = [];
    
    // Add modifiers in consistent order
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    // Add main key
    let key = event.key;
    
    // Handle special keys
    if (key === ' ') key = 'space';
    else if (key.length === 1 && !this.config.caseSensitive) {
      key = key.toLowerCase();
    }
    
    // Use alias if available
    const alias = Object.keys(this.keyAliases).find(alias => 
      this.keyAliases[alias] === key
    );
    if (alias) {
      key = alias;
    }
    
    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Find matching shortcuts
   * @private
   */
  _findMatchingShortcuts(keyCombination, context) {
    const shortcuts = [];
    
    // Check context-specific shortcuts
    const contextKey = `${context}:${keyCombination}`;
    const contextShortcut = this.shortcuts.get(contextKey);
    if (contextShortcut && contextShortcut.enabled) {
      shortcuts.push(contextShortcut);
    }
    
    // Check global shortcuts (only if no context-specific match)
    if (shortcuts.length === 0 || context === 'global') {
      const globalKey = `global:${keyCombination}`;
      const globalShortcut = this.shortcuts.get(globalKey);
      if (globalShortcut && globalShortcut.enabled) {
        shortcuts.push(globalShortcut);
      }
    }
    
    // Sort by priority (higher first)
    return shortcuts.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute shortcut
   * @private
   */
  _executeShortcut(shortcut, event) {
    try {
      this.logger.debug('Executing shortcut', { 
        keys: shortcut.keys, 
        id: shortcut.id,
        context: shortcut.context
      });
      
      shortcut.callback(event, shortcut);
      
      eventBus.emit('shortcuts:executed', { shortcut, event });
      
    } catch (error) {
      this.logger.error('Error executing shortcut', { 
        error: error.message, 
        shortcut: shortcut.id 
      });
    }
  }

  /**
   * Execute sequence
   * @private
   */
  _executeSequence(sequence, event) {
    try {
      this.logger.debug('Executing sequence', { 
        sequence: sequence.sequence, 
        id: sequence.id 
      });
      
      sequence.callback(event, sequence);
      
      eventBus.emit('shortcuts:sequence:executed', { sequence, event });
      
    } catch (error) {
      this.logger.error('Error executing sequence', { 
        error: error.message, 
        sequence: sequence.id 
      });
    }
  }

  /**
   * Clear active sequence
   * @private
   */
  _clearActiveSequence() {
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
    this.activeSequence = null;
  }

  /**
   * Normalize keys string
   * @private
   */
  _normalizeKeys(keys) {
    if (typeof keys !== 'string') {
      throw new Error('Keys must be a string');
    }
    
    const parts = keys.toLowerCase().split('+').map(part => part.trim());
    const normalized = [];
    
    // Sort modifiers
    const modifiers = ['ctrl', 'alt', 'shift', 'meta'];
    for (const mod of modifiers) {
      if (parts.includes(mod)) {
        normalized.push(mod);
      }
    }
    
    // Add main key (last non-modifier part)
    const mainKey = parts.find(part => !modifiers.includes(part));
    if (mainKey) {
      // Apply aliases
      const aliasedKey = this.keyAliases[mainKey] || mainKey;
      normalized.push(aliasedKey.toLowerCase());
    }
    
    return normalized.join('+');
  }

  /**
   * Validate shortcut
   * @private
   */
  _validateShortcut(shortcut) {
    if (!shortcut.keys) {
      throw new Error('Shortcut must have keys');
    }
    
    if (typeof shortcut.callback !== 'function') {
      throw new Error('Shortcut callback must be a function');
    }
    
    if (!shortcut.context) {
      throw new Error('Shortcut must have a context');
    }
  }

  /**
   * Check for shortcut conflicts
   * @private
   */
  _checkConflicts(newShortcut) {
    const conflictKey = `${newShortcut.context}:${newShortcut.keys}`;
    const existing = this.shortcuts.get(conflictKey);
    
    if (existing) {
      this.logger.warn('Shortcut conflict detected', {
        keys: newShortcut.keys,
        context: newShortcut.context,
        existing: existing.id,
        new: newShortcut.id
      });
      
      eventBus.emit('shortcuts:conflict', { 
        existing, 
        new: newShortcut 
      });
    }
  }

  /**
   * Register sequence shortcut
   * @private
   */
  _registerSequence(shortcut) {
    // Sequences are handled differently from regular shortcuts
    const sequenceKey = `${shortcut.context}:${shortcut.keys}`;
    this.sequences.set(sequenceKey, shortcut);
  }

  /**
   * Unregister sequence shortcut
   * @private
   */
  _unregisterSequence(shortcut) {
    const sequenceKey = `${shortcut.context}:${shortcut.keys}`;
    this.sequences.delete(sequenceKey);
  }

  /**
   * Find shortcut by ID
   * @private
   */
  _findShortcutById(id) {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.id === id) {
        return shortcut;
      }
    }
    return null;
  }

  /**
   * Generate shortcut ID
   * @private
   */
  _generateShortcutId(keys) {
    return `shortcut_${keys.replace(/[+\s]/g, '_')}_${Date.now()}`;
  }

  /**
   * Generate sequence ID
   * @private
   */
  _generateSequenceId(sequence) {
    return `sequence_${sequence.join('_').replace(/[+\s]/g, '_')}_${Date.now()}`;
  }

  /**
   * Load default shortcuts
   * @private
   */
  _loadDefaultShortcuts() {
    // Application shortcuts
    this.register('ctrl+s', () => eventBus.emit('app:save'), {
      description: 'Save current document',
      group: 'file',
      id: 'app.save'
    });
    
    this.register('ctrl+z', () => eventBus.emit('app:undo'), {
      description: 'Undo last action',
      group: 'edit',
      id: 'app.undo'
    });
    
    this.register('ctrl+y', () => eventBus.emit('app:redo'), {
      description: 'Redo last action',
      group: 'edit',
      id: 'app.redo'
    });
    
    this.register('ctrl+shift+p', () => eventBus.emit('app:command-palette'), {
      description: 'Open command palette',
      group: 'navigation',
      id: 'app.command-palette'
    });
    
    // Help
    this.register('f1', () => this.showHelp(), {
      description: 'Show keyboard shortcuts help',
      group: 'help',
      id: 'shortcuts.help'
    });
    
    this.register('escape', () => this.hideHelp(), {
      description: 'Hide help overlay',
      group: 'help',
      id: 'shortcuts.hide-help'
    });
    
    // Navigation
    this.register('ctrl+tab', () => eventBus.emit('navigation:next-tab'), {
      description: 'Switch to next tab',
      group: 'navigation',
      id: 'navigation.next-tab'
    });
    
    this.register('ctrl+shift+tab', () => eventBus.emit('navigation:prev-tab'), {
      description: 'Switch to previous tab',
      group: 'navigation',
      id: 'navigation.prev-tab'
    });
  }

  /**
   * Load user shortcuts customizations
   * @private
   */
  _loadUserShortcuts() {
    try {
      const customizations = configManager.get('shortcuts.customizations', {});
      
      for (const [id, customization] of Object.entries(customizations)) {
        const shortcut = this._findShortcutById(id);
        if (shortcut) {
          // Apply customization
          if (customization.keys) {
            // Update keys
            const oldKey = `${shortcut.context}:${shortcut.keys}`;
            shortcut.keys = this._normalizeKeys(customization.keys);
            const newKey = `${shortcut.context}:${shortcut.keys}`;
            
            // Update in map
            this.shortcuts.delete(oldKey);
            this.shortcuts.set(newKey, shortcut);
          }
          
          if (customization.enabled !== undefined) {
            shortcut.enabled = customization.enabled;
          }
          
          shortcut.customized = true;
        }
      }
      
      this.logger.debug('User shortcuts loaded', { 
        count: Object.keys(customizations).length 
      });
      
    } catch (error) {
      this.logger.error('Failed to load user shortcuts', { error: error.message });
    }
  }

  /**
   * Setup accessibility features
   * @private
   */
  _setupAccessibility() {
    // Add ARIA live region for shortcut feedback
    if (!document.getElementById('shortcuts-status')) {
      const statusDiv = document.createElement('div');
      statusDiv.id = 'shortcuts-status';
      statusDiv.setAttribute('aria-live', 'polite');
      statusDiv.setAttribute('aria-atomic', 'true');
      statusDiv.style.position = 'absolute';
      statusDiv.style.left = '-10000px';
      statusDiv.style.width = '1px';
      statusDiv.style.height = '1px';
      statusDiv.style.overflow = 'hidden';
      document.body.appendChild(statusDiv);
    }
    
    // Listen for shortcut executions to provide audio feedback
    eventBus.on('shortcuts:executed', (data) => {
      if (data.shortcut.description) {
        const statusDiv = document.getElementById('shortcuts-status');
        if (statusDiv) {
          statusDiv.textContent = `Executed: ${data.shortcut.description}`;
        }
      }
    });
  }

  /**
   * Initialize help system
   * @private
   */
  _initializeHelpSystem() {
    // Register help context
    this.registerContext('help', {
      description: 'Help overlay context',
      selector: '.shortcuts-help-overlay',
      priority: 100
    });
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.sequenceTimeout = configManager.get('shortcuts.sequenceTimeout', 2000);
    this.config.caseSensitive = configManager.get('shortcuts.caseSensitive', false);
    this.config.enableSequences = configManager.get('shortcuts.sequences', true);
    this.config.preventDefault = configManager.get('shortcuts.preventDefault', true);
    this.config.showHelpOverlay = configManager.get('shortcuts.helpOverlay', true);
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const keyboardShortcutsManager = new KeyboardShortcutsManager();

// Auto-initialize
setTimeout(() => {
  keyboardShortcutsManager.initialize();
}, 100);

export default keyboardShortcutsManager;