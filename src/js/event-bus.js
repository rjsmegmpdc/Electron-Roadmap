/**
 * Event Bus System
 * 
 * Provides a centralized event system for decoupled communication between modules.
 * Implements the Observer pattern to allow modules to emit and listen for events
 * without directly referencing each other.
 * 
 * This improves testability, maintainability, and allows for easier feature addition.
 */

export default class EventBus {
  constructor() {
    this._listeners = new Map();
    this._wildcardListeners = new Set();
    this._onceListeners = new Map();
    this._eventHistory = [];
    this._maxHistorySize = 100;
    this._isEnabled = true;
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} options - Optional configuration
   * @param {Object} options.context - Context to bind callback to
   * @param {number} options.priority - Priority for callback execution (higher = earlier)
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback, options = {}) {
    if (!this._isValidEventName(eventName) || typeof callback !== 'function') {
      throw new Error('Invalid event name or callback');
    }

    const listener = {
      callback,
      context: options.context || null,
      priority: options.priority || 0,
      id: this._generateListenerId()
    };

    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, []);
    }

    const listeners = this._listeners.get(eventName);
    listeners.push(listener);
    
    // Sort by priority (higher first)
    listeners.sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event that will only fire once
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} options - Optional configuration
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback, options = {}) {
    if (!this._isValidEventName(eventName) || typeof callback !== 'function') {
      throw new Error('Invalid event name or callback');
    }

    const wrappedCallback = (...args) => {
      // Remove the listener after first execution
      this.off(eventName, wrappedCallback);
      
      // Call the original callback
      if (options.context) {
        callback.call(options.context, ...args);
      } else {
        callback(...args);
      }
    };

    return this.on(eventName, wrappedCallback, options);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function to remove
   */
  off(eventName, callback) {
    if (!this._listeners.has(eventName)) {
      return;
    }

    const listeners = this._listeners.get(eventName);
    const filteredListeners = listeners.filter(listener => listener.callback !== callback);
    
    if (filteredListeners.length === 0) {
      this._listeners.delete(eventName);
    } else {
      this._listeners.set(eventName, filteredListeners);
    }
  }

  /**
   * Remove all listeners for an event, or all listeners if no event specified
   * @param {string} eventName - Optional event name to clear
   */
  removeAllListeners(eventName = null) {
    if (eventName) {
      this._listeners.delete(eventName);
    } else {
      this._listeners.clear();
      this._wildcardListeners.clear();
      this._onceListeners.clear();
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - Name of the event to emit
   * @param {*} data - Data to pass to event listeners
   * @param {Object} options - Optional configuration
   * @param {boolean} options.async - Whether to emit asynchronously
   * @param {boolean} options.recordHistory - Whether to record this event in history
   * @returns {Promise|undefined} Promise if async, undefined if sync
   */
  emit(eventName, data = null, options = {}) {
    if (!this._isEnabled) {
      return;
    }

    if (!this._isValidEventName(eventName)) {
      throw new Error('Invalid event name');
    }

    const event = {
      name: eventName,
      data,
      timestamp: new Date().toISOString(),
      id: this._generateEventId()
    };

    // Record in history if enabled
    if (options.recordHistory !== false) {
      this._recordEvent(event);
    }

    if (options.async) {
      return this._emitAsync(event);
    } else {
      this._emitSync(event);
    }
  }

  /**
   * Subscribe to all events (wildcard listener)
   * @param {Function} callback - Function to call for all events
   * @param {Object} options - Optional configuration
   * @returns {Function} Unsubscribe function
   */
  onAny(callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Invalid callback');
    }

    const listener = {
      callback,
      context: options.context || null,
      priority: options.priority || 0,
      id: this._generateListenerId()
    };

    this._wildcardListeners.add(listener);

    // Return unsubscribe function
    return () => this._wildcardListeners.delete(listener);
  }

  /**
   * Get list of all event names that have listeners
   * @returns {string[]} Array of event names
   */
  getEventNames() {
    return Array.from(this._listeners.keys());
  }

  /**
   * Get number of listeners for a specific event
   * @param {string} eventName - Name of the event
   * @returns {number} Number of listeners
   */
  getListenerCount(eventName) {
    return this._listeners.has(eventName) ? this._listeners.get(eventName).length : 0;
  }

  /**
   * Get event history
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} Array of recent events
   */
  getEventHistory(limit = 50) {
    return this._eventHistory.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearEventHistory() {
    this._eventHistory = [];
  }

  /**
   * Enable or disable the event bus
   * @param {boolean} enabled - Whether the event bus should be enabled
   */
  setEnabled(enabled) {
    this._isEnabled = Boolean(enabled);
  }

  /**
   * Check if the event bus is enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this._isEnabled;
  }

  /**
   * Wait for a specific event to be emitted
   * @param {string} eventName - Name of the event to wait for
   * @param {number} timeout - Timeout in milliseconds (optional)
   * @returns {Promise} Promise that resolves with the event data
   */
  waitFor(eventName, timeout = null) {
    return new Promise((resolve, reject) => {
      let timeoutId = null;
      
      const unsubscribe = this.once(eventName, (data) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(data);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Timeout waiting for event: ${eventName}`));
        }, timeout);
      }
    });
  }

  /**
   * Emit event synchronously
   * @private
   * @param {Object} event - Event object
   */
  _emitSync(event) {
    const listeners = this._getListenersForEvent(event.name);
    
    for (const listener of listeners) {
      try {
        if (listener.context) {
          listener.callback.call(listener.context, event.data, event);
        } else {
          listener.callback(event.data, event);
        }
      } catch (error) {
        console.error(`Error in event listener for "${event.name}":`, error);
        // Continue with other listeners even if one fails
      }
    }
  }

  /**
   * Emit event asynchronously
   * @private
   * @param {Object} event - Event object
   * @returns {Promise} Promise that resolves when all listeners complete
   */
  async _emitAsync(event) {
    const listeners = this._getListenersForEvent(event.name);
    const promises = [];
    
    for (const listener of listeners) {
      const promise = new Promise((resolve) => {
        try {
          let result;
          if (listener.context) {
            result = listener.callback.call(listener.context, event.data, event);
          } else {
            result = listener.callback(event.data, event);
          }
          
          // Handle promises returned by listeners
          if (result && typeof result.then === 'function') {
            result.then(resolve).catch((error) => {
              console.error(`Error in async event listener for "${event.name}":`, error);
              resolve();
            });
          } else {
            resolve();
          }
        } catch (error) {
          console.error(`Error in event listener for "${event.name}":`, error);
          resolve();
        }
      });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
  }

  /**
   * Get all listeners for an event (including wildcard)
   * @private
   * @param {string} eventName - Name of the event
   * @returns {Array} Array of listeners
   */
  _getListenersForEvent(eventName) {
    const listeners = [];
    
    // Add specific event listeners
    if (this._listeners.has(eventName)) {
      listeners.push(...this._listeners.get(eventName));
    }
    
    // Add wildcard listeners
    for (const wildcardListener of this._wildcardListeners) {
      listeners.push(wildcardListener);
    }
    
    return listeners;
  }

  /**
   * Record event in history
   * @private
   * @param {Object} event - Event object
   */
  _recordEvent(event) {
    this._eventHistory.push(event);
    
    // Keep history size under control
    if (this._eventHistory.length > this._maxHistorySize) {
      this._eventHistory = this._eventHistory.slice(-this._maxHistorySize);
    }
  }

  /**
   * Validate event name
   * @private
   * @param {string} eventName - Event name to validate
   * @returns {boolean} True if valid
   */
  _isValidEventName(eventName) {
    return typeof eventName === 'string' && eventName.length > 0;
  }

  /**
   * Generate unique listener ID
   * @private
   * @returns {string} Unique ID
   */
  _generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   * @private
   * @returns {string} Unique ID
   */
  _generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Export both the class and singleton for different use cases
export { EventBus, eventBus };

// Standard application events that modules can use
export const AppEvents = {
  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated', 
  PROJECT_DELETED: 'project.deleted',
  PROJECT_STATUS_CHANGED: 'project.status.changed',
  
  // Task events
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  TASK_STATUS_CHANGED: 'task.status.changed',
  
  // Resource events
  RESOURCE_ALLOCATED: 'resource.allocated',
  RESOURCE_DEALLOCATED: 'resource.deallocated',
  RESOURCE_OVERALLOCATED: 'resource.overallocated',
  
  // Financial events
  BUDGET_UPDATED: 'budget.updated',
  COST_CALCULATED: 'cost.calculated',
  VARIANCE_DETECTED: 'variance.detected',
  
  // Forecast events
  FORECAST_GENERATED: 'forecast.generated',
  FORECAST_UPDATED: 'forecast.updated',
  
  // Data events
  DATA_SAVED: 'data.saved',
  DATA_LOADED: 'data.loaded',
  BACKUP_CREATED: 'backup.created',
  DATA_RESTORED: 'data.restored',
  
  // UI events
  UI_THEME_CHANGED: 'ui.theme.changed',
  UI_PAGE_CHANGED: 'ui.page.changed',
  UI_ERROR_SHOWN: 'ui.error.shown',
  
  // System events
  APP_INITIALIZED: 'app.initialized',
  CONFIG_CHANGED: 'config.changed',
  FEATURE_TOGGLED: 'feature.toggled',
  ERROR_OCCURRED: 'error.occurred'
};