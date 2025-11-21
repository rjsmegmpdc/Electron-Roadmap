/**
 * UI Components Manager
 * 
 * Advanced component system for dynamic UI rendering, state management,
 * and component lifecycle management with reusability and modularity.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';

export class UIComponentsManager {
  constructor() {
    this.components = new Map();
    this.instances = new Map();
    this.templates = new Map();
    this.globalState = {};
    this.observers = new Map();
    
    this.config = {
      autoMount: configManager.get('ui.autoMount', true),
      enableAnimations: configManager.get('ui.animations', true),
      componentCache: configManager.get('ui.componentCache', true),
      lazyLoading: configManager.get('ui.lazyLoading', true)
    };
    
    this.logger = logger.group ? logger.group('UIComponents') : logger;
    
    this._setupEventListeners();
    this._initializeBuiltinComponents();
  }

  /**
   * Initialize the UI components manager
   */
  initialize() {
    try {
      this.logger.info('Initializing UI components manager');
      
      // Setup DOM observer for auto-mounting
      if (this.config.autoMount) {
        this._setupDOMObserver();
      }
      
      // Initialize component templates
      this._loadTemplates();
      
      // Setup global styles
      this._setupGlobalStyles();
      
      this.logger.info('UI components manager initialized successfully');
      
      eventBus.emit('ui:components:initialized', {
        componentsCount: this.components.size,
        templatesCount: this.templates.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize UI components manager', { error: error.message });
      errorHandler.handleError(error, 'UIComponentsManager.initialize');
    }
  }

  /**
   * Register a UI component
   * @param {string} name - Component name
   * @param {Object} definition - Component definition
   */
  registerComponent(name, definition) {
    try {
      const component = {
        name,
        template: definition.template || '',
        styles: definition.styles || '',
        props: definition.props || {},
        state: definition.state || {},
        methods: definition.methods || {},
        lifecycle: {
          beforeMount: definition.beforeMount || null,
          mounted: definition.mounted || null,
          beforeUpdate: definition.beforeUpdate || null,
          updated: definition.updated || null,
          beforeUnmount: definition.beforeUnmount || null,
          unmounted: definition.unmounted || null
        },
        computed: definition.computed || {},
        watch: definition.watch || {},
        dependencies: definition.dependencies || [],
        version: definition.version || '1.0.0',
        description: definition.description || ''
      };
      
      // Validate component definition
      this._validateComponent(component);
      
      this.components.set(name, component);
      
      // Load dependencies
      if (component.dependencies.length > 0) {
        this._loadDependencies(component.dependencies);
      }
      
      this.logger.debug('Component registered', { name, version: component.version });
      
      eventBus.emit('ui:component:registered', { name, component });
      
    } catch (error) {
      this.logger.error('Failed to register component', { error: error.message, name });
      errorHandler.handleError(error, 'UIComponentsManager.registerComponent', { name });
    }
  }

  /**
   * Create component instance
   * @param {string} componentName - Component name
   * @param {Object} props - Component props
   * @param {HTMLElement} container - Container element
   * @returns {Object} Component instance
   */
  createInstance(componentName, props = {}, container = null) {
    try {
      const component = this.components.get(componentName);
      if (!component) {
        throw new Error(`Component '${componentName}' not found`);
      }
      
      const instanceId = this._generateInstanceId();
      
      const instance = {
        id: instanceId,
        componentName,
        component,
        element: null,
        container,
        props: { ...component.props, ...props },
        state: { ...component.state },
        computedCache: {},
        watchers: new Map(),
        mounted: false,
        updating: false,
        destroyed: false
      };
      
      // Bind methods to instance
      for (const [methodName, method] of Object.entries(component.methods)) {
        instance[methodName] = method.bind(instance);
      }
      
      // Setup computed properties
      this._setupComputedProperties(instance);
      
      // Setup watchers
      this._setupWatchers(instance);
      
      // Store instance
      this.instances.set(instanceId, instance);
      
      this.logger.debug('Component instance created', { componentName, instanceId });
      
      eventBus.emit('ui:instance:created', { componentName, instanceId, props });
      
      return instance;
      
    } catch (error) {
      this.logger.error('Failed to create component instance', { error: error.message, componentName });
      errorHandler.handleError(error, 'UIComponentsManager.createInstance', { componentName });
      return null;
    }
  }

  /**
   * Mount component instance
   * @param {Object} instance - Component instance
   * @param {HTMLElement} container - Container element
   * @returns {Promise<boolean>} Mount success
   */
  async mountInstance(instance, container = null) {
    try {
      if (instance.mounted) {
        this.logger.warn('Instance already mounted', { instanceId: instance.id });
        return false;
      }
      
      const mountContainer = container || instance.container;
      if (!mountContainer) {
        throw new Error('No container provided for mounting');
      }
      
      // Call beforeMount lifecycle
      if (instance.component.lifecycle.beforeMount) {
        await instance.component.lifecycle.beforeMount.call(instance);
      }
      
      // Render component
      const element = await this._renderComponent(instance);
      
      // Mount to DOM
      mountContainer.appendChild(element);
      instance.element = element;
      instance.container = mountContainer;
      instance.mounted = true;
      
      // Setup event listeners
      this._setupEventListeners(instance);
      
      // Call mounted lifecycle
      if (instance.component.lifecycle.mounted) {
        await instance.component.lifecycle.mounted.call(instance);
      }
      
      this.logger.debug('Component instance mounted', { 
        instanceId: instance.id,
        componentName: instance.componentName 
      });
      
      eventBus.emit('ui:instance:mounted', { 
        instanceId: instance.id,
        componentName: instance.componentName 
      });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to mount component instance', { 
        error: error.message, 
        instanceId: instance.id 
      });
      return false;
    }
  }

  /**
   * Update component instance
   * @param {Object} instance - Component instance
   * @param {Object} newProps - New props
   * @returns {Promise<boolean>} Update success
   */
  async updateInstance(instance, newProps = {}) {
    try {
      if (!instance.mounted || instance.updating || instance.destroyed) {
        return false;
      }
      
      instance.updating = true;
      
      // Call beforeUpdate lifecycle
      if (instance.component.lifecycle.beforeUpdate) {
        await instance.component.lifecycle.beforeUpdate.call(instance, newProps);
      }
      
      // Update props
      const oldProps = { ...instance.props };
      instance.props = { ...instance.props, ...newProps };
      
      // Re-render if needed
      const shouldUpdate = this._shouldUpdate(instance, oldProps, newProps);
      if (shouldUpdate) {
        const newElement = await this._renderComponent(instance);
        
        if (instance.element && instance.element.parentNode) {
          instance.element.parentNode.replaceChild(newElement, instance.element);
          instance.element = newElement;
          this._setupEventListeners(instance);
        }
      }
      
      instance.updating = false;
      
      // Call updated lifecycle
      if (instance.component.lifecycle.updated) {
        await instance.component.lifecycle.updated.call(instance, oldProps, newProps);
      }
      
      this.logger.debug('Component instance updated', { 
        instanceId: instance.id,
        propsChanged: Object.keys(newProps).length
      });
      
      eventBus.emit('ui:instance:updated', { 
        instanceId: instance.id,
        oldProps,
        newProps 
      });
      
      return true;
      
    } catch (error) {
      instance.updating = false;
      this.logger.error('Failed to update component instance', { 
        error: error.message, 
        instanceId: instance.id 
      });
      return false;
    }
  }

  /**
   * Unmount component instance
   * @param {Object} instance - Component instance
   * @returns {Promise<boolean>} Unmount success
   */
  async unmountInstance(instance) {
    try {
      if (!instance.mounted || instance.destroyed) {
        return false;
      }
      
      // Call beforeUnmount lifecycle
      if (instance.component.lifecycle.beforeUnmount) {
        await instance.component.lifecycle.beforeUnmount.call(instance);
      }
      
      // Remove from DOM
      if (instance.element && instance.element.parentNode) {
        instance.element.parentNode.removeChild(instance.element);
      }
      
      // Cleanup watchers
      for (const unwatch of instance.watchers.values()) {
        if (typeof unwatch === 'function') {
          unwatch();
        }
      }
      
      // Mark as destroyed
      instance.mounted = false;
      instance.destroyed = true;
      
      // Remove from instances map
      this.instances.delete(instance.id);
      
      // Call unmounted lifecycle
      if (instance.component.lifecycle.unmounted) {
        await instance.component.lifecycle.unmounted.call(instance);
      }
      
      this.logger.debug('Component instance unmounted', { 
        instanceId: instance.id,
        componentName: instance.componentName 
      });
      
      eventBus.emit('ui:instance:unmounted', { 
        instanceId: instance.id,
        componentName: instance.componentName 
      });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to unmount component instance', { 
        error: error.message, 
        instanceId: instance.id 
      });
      return false;
    }
  }

  /**
   * Create and mount component in one step
   * @param {string} componentName - Component name
   * @param {Object} props - Component props
   * @param {HTMLElement} container - Container element
   * @returns {Promise<Object|null>} Component instance
   */
  async mount(componentName, props = {}, container = null) {
    try {
      const instance = this.createInstance(componentName, props, container);
      if (!instance) {
        return null;
      }
      
      const mounted = await this.mountInstance(instance, container);
      if (!mounted) {
        this.instances.delete(instance.id);
        return null;
      }
      
      return instance;
      
    } catch (error) {
      this.logger.error('Failed to create and mount component', { 
        error: error.message, 
        componentName 
      });
      return null;
    }
  }

  /**
   * Find component instances
   * @param {string} componentName - Component name (optional)
   * @returns {Array} Component instances
   */
  findInstances(componentName = null) {
    const instances = Array.from(this.instances.values());
    
    if (componentName) {
      return instances.filter(instance => 
        instance.componentName === componentName && !instance.destroyed
      );
    }
    
    return instances.filter(instance => !instance.destroyed);
  }

  /**
   * Get component instance by ID
   * @param {string} instanceId - Instance ID
   * @returns {Object|null} Component instance
   */
  getInstance(instanceId) {
    return this.instances.get(instanceId) || null;
  }

  /**
   * Set global state
   * @param {Object} state - State to merge
   */
  setGlobalState(state) {
    try {
      const oldState = { ...this.globalState };
      this.globalState = { ...this.globalState, ...state };
      
      // Notify all instances of state change
      for (const instance of this.instances.values()) {
        if (!instance.destroyed) {
          this._notifyStateChange(instance, oldState, this.globalState);
        }
      }
      
      eventBus.emit('ui:state:changed', { oldState, newState: this.globalState });
      
    } catch (error) {
      this.logger.error('Failed to set global state', { error: error.message });
    }
  }

  /**
   * Get global state
   * @returns {Object} Global state
   */
  getGlobalState() {
    return { ...this.globalState };
  }

  /**
   * Get registered components
   * @returns {Array} Component definitions
   */
  getComponents() {
    return Array.from(this.components.entries()).map(([name, component]) => ({
      name,
      version: component.version,
      description: component.description,
      dependencies: component.dependencies
    }));
  }

  /**
   * Cleanup destroyed instances
   */
  cleanup() {
    let cleanupCount = 0;
    
    for (const [instanceId, instance] of this.instances.entries()) {
      if (instance.destroyed) {
        this.instances.delete(instanceId);
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      this.logger.debug('Cleaned up destroyed instances', { count: cleanupCount });
    }
  }

  // Private Methods

  /**
   * Setup event listeners for manager
   * @private
   */
  _setupEventListeners() {
    // Listen for configuration changes
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('ui.')) {
        this._updateConfig();
      }
    });

    // Periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  /**
   * Initialize built-in components
   * @private
   */
  _initializeBuiltinComponents() {
    // Register basic components
    this._registerLoadingComponent();
    this._registerModalComponent();
    this._registerTooltipComponent();
    this._registerAlertComponent();
  }

  /**
   * Register loading component
   * @private
   */
  _registerLoadingComponent() {
    this.registerComponent('loading', {
      template: `
        <div class="loading-spinner" data-testid="loading">
          <div class="spinner"></div>
          <span class="loading-text">{{text}}</span>
        </div>
      `,
      styles: `
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-text {
          margin-top: 10px;
          font-size: 14px;
          color: #666;
        }
      `,
      props: {
        text: 'Loading...'
      }
    });
  }

  /**
   * Register modal component
   * @private
   */
  _registerModalComponent() {
    this.registerComponent('modal', {
      template: `
        <div class="modal-overlay" style="display: {{visible ? 'flex' : 'none'}}">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{title}}</h3>
              <button class="modal-close" data-action="close">×</button>
            </div>
            <div class="modal-body">
              {{content}}
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-action="cancel">{{cancelText}}</button>
              <button class="btn btn-primary" data-action="confirm">{{confirmText}}</button>
            </div>
          </div>
        </div>
      `,
      styles: `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80%;
          overflow: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        .modal-header h3 {
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
        }
        .modal-body {
          padding: 20px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #eee;
        }
      `,
      props: {
        title: 'Modal',
        content: '',
        visible: false,
        cancelText: 'Cancel',
        confirmText: 'OK'
      },
      methods: {
        show() {
          this.state.visible = true;
          this._update();
        },
        hide() {
          this.state.visible = false;
          this._update();
        },
        close() {
          this.hide();
          eventBus.emit('ui:modal:closed', { instanceId: this.id });
        },
        confirm() {
          eventBus.emit('ui:modal:confirmed', { instanceId: this.id });
          this.hide();
        }
      }
    });
  }

  /**
   * Register tooltip component
   * @private
   */
  _registerTooltipComponent() {
    this.registerComponent('tooltip', {
      template: `
        <div class="tooltip" style="display: {{visible ? 'block' : 'none'}}; left: {{x}}px; top: {{y}}px;">
          {{content}}
        </div>
      `,
      styles: `
        .tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1001;
          pointer-events: none;
        }
      `,
      props: {
        content: '',
        visible: false,
        x: 0,
        y: 0
      },
      methods: {
        show(x, y, content = null) {
          this.state.visible = true;
          this.state.x = x;
          this.state.y = y;
          if (content !== null) {
            this.props.content = content;
          }
          this._update();
        },
        hide() {
          this.state.visible = false;
          this._update();
        }
      }
    });
  }

  /**
   * Register alert component
   * @private
   */
  _registerAlertComponent() {
    this.registerComponent('alert', {
      template: `
        <div class="alert alert-{{type}}" style="display: {{visible ? 'block' : 'none'}}">
          <span class="alert-icon">{{icon}}</span>
          <span class="alert-message">{{message}}</span>
          <button class="alert-close" data-action="close">×</button>
        </div>
      `,
      styles: `
        .alert {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 4px;
          margin: 10px 0;
        }
        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .alert-warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .alert-info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        .alert-icon {
          margin-right: 10px;
        }
        .alert-message {
          flex: 1;
        }
        .alert-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          margin-left: 10px;
          opacity: 0.7;
        }
        .alert-close:hover {
          opacity: 1;
        }
      `,
      props: {
        type: 'info',
        message: '',
        visible: true,
        autoClose: 0
      },
      computed: {
        icon() {
          const icons = {
            success: '✓',
            warning: '⚠',
            error: '✗',
            info: 'ℹ'
          };
          return icons[this.props.type] || icons.info;
        }
      },
      methods: {
        show(message, type = 'info', autoClose = 0) {
          this.props.message = message;
          this.props.type = type;
          this.state.visible = true;
          this._update();
          
          if (autoClose > 0) {
            setTimeout(() => {
              this.hide();
            }, autoClose);
          }
        },
        hide() {
          this.state.visible = false;
          this._update();
        }
      }
    });
  }

  /**
   * Validate component definition
   * @private
   */
  _validateComponent(component) {
    if (!component.name || typeof component.name !== 'string') {
      throw new Error('Component must have a valid name');
    }
    
    if (component.template && typeof component.template !== 'string') {
      throw new Error('Component template must be a string');
    }
    
    // Additional validation rules can be added here
  }

  /**
   * Load component dependencies
   * @private
   */
  async _loadDependencies(dependencies) {
    for (const dependency of dependencies) {
      if (!this.components.has(dependency)) {
        this.logger.warn('Component dependency not found', { dependency });
      }
    }
  }

  /**
   * Setup DOM observer for auto-mounting
   * @private
   */
  _setupDOMObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this._checkForAutoMount(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.domObserver = observer;
  }

  /**
   * Check element for auto-mount attributes
   * @private
   */
  _checkForAutoMount(element) {
    const componentName = element.getAttribute('data-component');
    if (componentName && this.components.has(componentName)) {
      const propsAttr = element.getAttribute('data-props');
      let props = {};
      
      if (propsAttr) {
        try {
          props = JSON.parse(propsAttr);
        } catch (error) {
          this.logger.warn('Invalid props JSON', { componentName, propsAttr });
        }
      }
      
      this.mount(componentName, props, element);
    }
  }

  /**
   * Load templates
   * @private
   */
  _loadTemplates() {
    // Load templates from script tags or external files
    const templateElements = document.querySelectorAll('script[type="text/template"]');
    
    templateElements.forEach((element) => {
      const templateName = element.getAttribute('data-template');
      if (templateName) {
        this.templates.set(templateName, element.textContent);
      }
    });
  }

  /**
   * Setup global styles
   * @private
   */
  _setupGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Button styles */
      .btn {
        display: inline-block;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.5;
        text-align: center;
        text-decoration: none;
        vertical-align: middle;
        cursor: pointer;
        border: 1px solid transparent;
        border-radius: 4px;
        background: transparent;
        transition: all 0.2s ease-in-out;
      }
      
      .btn-primary {
        color: #fff;
        background-color: #007bff;
        border-color: #007bff;
      }
      
      .btn-primary:hover {
        background-color: #0056b3;
        border-color: #0056b3;
      }
      
      .btn-secondary {
        color: #6c757d;
        background-color: transparent;
        border-color: #6c757d;
      }
      
      .btn-secondary:hover {
        color: #fff;
        background-color: #6c757d;
      }
      
      /* Utility classes */
      .hidden {
        display: none !important;
      }
      
      .visible {
        visibility: visible !important;
      }
      
      .invisible {
        visibility: hidden !important;
      }
      
      .fade-in {
        animation: fadeIn 0.3s ease-in;
      }
      
      .fade-out {
        animation: fadeOut 0.3s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Render component to DOM element
   * @private
   */
  async _renderComponent(instance) {
    try {
      let template = instance.component.template;
      
      // Process template variables
      template = this._processTemplate(template, instance);
      
      // Create element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = template.trim();
      
      const element = tempDiv.firstElementChild;
      if (!element) {
        throw new Error('Invalid template - must contain a root element');
      }
      
      // Add component styles
      if (instance.component.styles) {
        this._addComponentStyles(instance.component.name, instance.component.styles);
      }
      
      // Add component class
      element.classList.add(`component-${instance.component.name}`);
      element.setAttribute('data-component-id', instance.id);
      
      return element;
      
    } catch (error) {
      this.logger.error('Failed to render component', { 
        error: error.message,
        instanceId: instance.id 
      });
      
      // Return error element
      const errorElement = document.createElement('div');
      errorElement.className = 'component-error';
      errorElement.textContent = `Error rendering component: ${error.message}`;
      return errorElement;
    }
  }

  /**
   * Process template variables
   * @private
   */
  _processTemplate(template, instance) {
    // Simple template processing (in production, use a proper template engine)
    return template.replace(/\{\{(.*?)\}\}/g, (match, expression) => {
      try {
        // Handle simple property access and computed properties
        const trimmedExpression = expression.trim();
        
        if (instance.props.hasOwnProperty(trimmedExpression)) {
          return String(instance.props[trimmedExpression] || '');
        }
        
        if (instance.state.hasOwnProperty(trimmedExpression)) {
          return String(instance.state[trimmedExpression] || '');
        }
        
        if (instance.computedCache.hasOwnProperty(trimmedExpression)) {
          return String(instance.computedCache[trimmedExpression] || '');
        }
        
        // Handle simple expressions like "visible ? 'flex' : 'none'"
        if (trimmedExpression.includes('?')) {
          return this._evaluateSimpleExpression(trimmedExpression, instance);
        }
        
        return '';
        
      } catch (error) {
        this.logger.warn('Template processing error', { 
          expression, 
          error: error.message 
        });
        return '';
      }
    });
  }

  /**
   * Evaluate simple template expressions
   * @private
   */
  _evaluateSimpleExpression(expression, instance) {
    // Very basic ternary expression evaluation
    const ternaryMatch = expression.match(/(.+?)\s*\?\s*['"]?(.*?)['"]?\s*:\s*['"]?(.*?)['"]?$/);
    
    if (ternaryMatch) {
      const [, condition, trueValue, falseValue] = ternaryMatch;
      const conditionValue = this._getValueFromInstance(condition.trim(), instance);
      return conditionValue ? trueValue : falseValue;
    }
    
    return '';
  }

  /**
   * Get value from instance
   * @private
   */
  _getValueFromInstance(key, instance) {
    if (instance.props.hasOwnProperty(key)) {
      return instance.props[key];
    }
    if (instance.state.hasOwnProperty(key)) {
      return instance.state[key];
    }
    if (instance.computedCache.hasOwnProperty(key)) {
      return instance.computedCache[key];
    }
    return null;
  }

  /**
   * Add component styles to document
   * @private
   */
  _addComponentStyles(componentName, styles) {
    const styleId = `component-styles-${componentName}`;
    
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }
  }

  /**
   * Setup computed properties for instance
   * @private
   */
  _setupComputedProperties(instance) {
    for (const [name, computeFn] of Object.entries(instance.component.computed)) {
      Object.defineProperty(instance, name, {
        get: () => {
          if (!instance.computedCache.hasOwnProperty(name)) {
            instance.computedCache[name] = computeFn.call(instance);
          }
          return instance.computedCache[name];
        },
        enumerable: true
      });
    }
  }

  /**
   * Setup watchers for instance
   * @private
   */
  _setupWatchers(instance) {
    for (const [watchPath, handler] of Object.entries(instance.component.watch)) {
      const unwatch = this._createWatcher(instance, watchPath, handler);
      instance.watchers.set(watchPath, unwatch);
    }
  }

  /**
   * Create watcher for property
   * @private
   */
  _createWatcher(instance, watchPath, handler) {
    // Simple property watching (in production, use a proper reactivity system)
    let oldValue = this._getValueFromInstance(watchPath, instance);
    
    const checkForChanges = () => {
      const newValue = this._getValueFromInstance(watchPath, instance);
      if (newValue !== oldValue) {
        handler.call(instance, newValue, oldValue);
        oldValue = newValue;
      }
    };
    
    const interval = setInterval(checkForChanges, 100);
    
    return () => clearInterval(interval);
  }

  /**
   * Setup event listeners for instance
   * @private
   */
  _setupEventListeners(instance) {
    if (!instance.element) return;
    
    // Setup data-action event listeners
    const actionElements = instance.element.querySelectorAll('[data-action]');
    
    actionElements.forEach((element) => {
      const action = element.getAttribute('data-action');
      
      element.addEventListener('click', (event) => {
        event.preventDefault();
        
        if (instance[action] && typeof instance[action] === 'function') {
          instance[action](event);
        } else {
          this.logger.warn('Action method not found', { action, instanceId: instance.id });
        }
      });
    });
  }

  /**
   * Check if instance should update
   * @private
   */
  _shouldUpdate(instance, oldProps, newProps) {
    // Simple check - update if any prop changed
    for (const key of Object.keys(newProps)) {
      if (oldProps[key] !== newProps[key]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Notify instance of global state change
   * @private
   */
  _notifyStateChange(instance, oldState, newState) {
    // Trigger watchers that depend on global state
    // This is a simplified implementation
    if (instance.component.watch['$state']) {
      instance.component.watch['$state'].call(instance, newState, oldState);
    }
  }

  /**
   * Generate unique instance ID
   * @private
   */
  _generateInstanceId() {
    return 'component_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.autoMount = configManager.get('ui.autoMount', true);
    this.config.enableAnimations = configManager.get('ui.animations', true);
    this.config.componentCache = configManager.get('ui.componentCache', true);
    this.config.lazyLoading = configManager.get('ui.lazyLoading', true);
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const uiComponentsManager = new UIComponentsManager();

// Auto-initialize
setTimeout(() => {
  uiComponentsManager.initialize();
}, 100);

export default uiComponentsManager;