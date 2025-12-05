/**
 * Dashboard System Module
 * 
 * Provides comprehensive dashboard management with:
 * - Grid-based layouts with drag-and-drop
 * - Multi-widget support with real-time data binding
 * - Responsive design and theme management
 * - Persistent state management
 * - Performance optimization
 * 
 * @version 2.0.0
 * @author Roadmap Tool Team
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';
import { dragDropManager } from '../ui/drag-drop-enhanced.js';
import { chartEngine } from './chart-engine.js';

export class DashboardSystem {
  constructor() {
    this.dashboards = new Map();
    this.widgets = new Map();
    this.layouts = new Map();
    this.themes = new Map();
    this.templates = new Map();
    
    this.config = {
      defaultGridSize: configManager.get('dashboard.gridSize', 12),
      defaultRowHeight: configManager.get('dashboard.rowHeight', 100),
      minWidgetSize: configManager.get('dashboard.minWidgetSize', { width: 2, height: 2 }),
      maxWidgetSize: configManager.get('dashboard.maxWidgetSize', { width: 12, height: 12 }),
      enableAnimations: configManager.get('dashboard.animations', true),
      autoSave: configManager.get('dashboard.autoSave', true),
      responsive: configManager.get('dashboard.responsive', true)
    };
    
    this.logger = logger.group ? logger.group('Dashboard') : logger;
    
    // Grid breakpoints for responsive design
    this.breakpoints = {
      xs: 480,
      sm: 768,
      md: 992,
      lg: 1200,
      xl: 1600
    };
    
    // Default widget types
    this.widgetTypes = {
      chart: 'Chart Widget',
      metric: 'Metric Widget', 
      text: 'Text Widget',
      table: 'Table Widget',
      iframe: 'IFrame Widget',
      image: 'Image Widget',
      custom: 'Custom Widget'
    };
    
    this._setupEventListeners();
    this._loadDefaultTemplates();
    this._loadDefaultThemes();
  }

  /**
   * Initialize the dashboard system
   */
  initialize() {
    try {
      this.logger.info('Initializing dashboard system');
      
      // Setup drag and drop for widgets
      this._setupDragAndDrop();
      
      // Setup resize observer for responsive layouts
      this._setupResizeObserver();
      
      // Load saved dashboards
      this._loadSavedDashboards();
      
      this.logger.info('Dashboard system initialized successfully');
      
      eventBus.emit('dashboard:initialized', {
        dashboardsCount: this.dashboards.size,
        widgetsCount: this.widgets.size,
        templatesCount: this.templates.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize dashboard system', { error: error.message });
      errorHandler.handleError(error, 'DashboardSystem.initialize');
    }
  }

  /**
   * Create a new dashboard
   * @param {Object} config - Dashboard configuration
   * @returns {Object} Dashboard instance
   */
  createDashboard(config) {
    try {
      const dashboardId = config.id || this._generateDashboardId();
      
      const dashboard = {
        id: dashboardId,
        title: config.title || 'New Dashboard',
        description: config.description || '',
        container: config.container,
        theme: config.theme || 'default',
        layout: {
          gridSize: config.gridSize || this.config.defaultGridSize,
          rowHeight: config.rowHeight || this.config.defaultRowHeight,
          margin: config.margin || [10, 10],
          padding: config.padding || [10, 10],
          responsive: config.responsive !== false
        },
        widgets: new Map(),
        widgetOrder: [],
        settings: {
          editable: config.editable !== false,
          resizable: config.resizable !== false,
          draggable: config.draggable !== false,
          removable: config.removable !== false
        },
        state: {
          initialized: false,
          editing: false,
          loading: false,
          destroyed: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          author: config.author || 'unknown'
        }
      };
      
      // Initialize dashboard container
      this._initializeDashboard(dashboard);
      
      // Apply theme
      if (dashboard.theme) {
        this._applyDashboardTheme(dashboard);
      }
      
      // Store dashboard
      this.dashboards.set(dashboardId, dashboard);
      
      this.logger.debug('Dashboard created', { 
        id: dashboardId, 
        title: dashboard.title 
      });
      
      eventBus.emit('dashboard:created', { dashboard });
      
      return dashboard;
      
    } catch (error) {
      this.logger.error('Failed to create dashboard', { error: error.message });
      errorHandler.handleError(error, 'DashboardSystem.createDashboard');
      return null;
    }
  }

  /**
   * Add widget to dashboard
   * @param {Object} dashboard - Dashboard instance
   * @param {Object} widgetConfig - Widget configuration
   * @returns {Object|null} Widget instance
   */
  addWidget(dashboard, widgetConfig) {
    try {
      if (!dashboard || dashboard.state.destroyed) {
        throw new Error('Invalid or destroyed dashboard');
      }
      
      const widgetId = widgetConfig.id || this._generateWidgetId();
      
      const widget = {
        id: widgetId,
        dashboardId: dashboard.id,
        type: widgetConfig.type || 'chart',
        title: widgetConfig.title || 'New Widget',
        description: widgetConfig.description || '',
        position: {
          x: widgetConfig.x || 0,
          y: widgetConfig.y || 0,
          width: widgetConfig.width || 4,
          height: widgetConfig.height || 4
        },
        config: widgetConfig.config || {},
        data: widgetConfig.data || null,
        element: null,
        content: null,
        state: {
          loading: false,
          error: null,
          visible: true,
          minimized: false
        },
        settings: {
          resizable: widgetConfig.resizable !== false,
          draggable: widgetConfig.draggable !== false,
          removable: widgetConfig.removable !== false,
          refreshable: widgetConfig.refreshable !== false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      // Validate widget position
      this._validateWidgetPosition(dashboard, widget);
      
      // Create widget element
      this._createWidgetElement(dashboard, widget);
      
      // Initialize widget content
      await this._initializeWidgetContent(widget);
      
      // Add to dashboard
      dashboard.widgets.set(widgetId, widget);
      dashboard.widgetOrder.push(widgetId);
      
      // Update layout
      this._updateDashboardLayout(dashboard);
      
      // Auto-save if enabled
      if (this.config.autoSave) {
        this._saveDashboard(dashboard);
      }
      
      this.logger.debug('Widget added to dashboard', { 
        widgetId, 
        dashboardId: dashboard.id,
        type: widget.type 
      });
      
      eventBus.emit('dashboard:widget:added', { dashboard, widget });
      
      return widget;
      
    } catch (error) {
      this.logger.error('Failed to add widget', { 
        error: error.message, 
        dashboardId: dashboard?.id 
      });
      return null;
    }
  }

  /**
   * Remove widget from dashboard
   * @param {Object} dashboard - Dashboard instance
   * @param {string} widgetId - Widget ID
   * @returns {boolean} Remove success
   */
  removeWidget(dashboard, widgetId) {
    try {
      if (!dashboard || dashboard.state.destroyed) {
        throw new Error('Invalid or destroyed dashboard');
      }
      
      const widget = dashboard.widgets.get(widgetId);
      if (!widget) {
        throw new Error(`Widget '${widgetId}' not found`);
      }
      
      // Check if removable
      if (!widget.settings.removable) {
        throw new Error('Widget is not removable');
      }
      
      // Remove widget element
      if (widget.element && widget.element.parentNode) {
        widget.element.parentNode.removeChild(widget.element);
      }
      
      // Clean up widget content
      this._cleanupWidgetContent(widget);
      
      // Remove from dashboard
      dashboard.widgets.delete(widgetId);
      dashboard.widgetOrder = dashboard.widgetOrder.filter(id => id !== widgetId);
      
      // Update layout
      this._updateDashboardLayout(dashboard);
      
      // Auto-save if enabled
      if (this.config.autoSave) {
        this._saveDashboard(dashboard);
      }
      
      this.logger.debug('Widget removed from dashboard', { 
        widgetId, 
        dashboardId: dashboard.id 
      });
      
      eventBus.emit('dashboard:widget:removed', { dashboard, widgetId });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to remove widget', { 
        error: error.message, 
        widgetId 
      });
      return false;
    }
  }

  /**
   * Update widget position and size
   * @param {Object} dashboard - Dashboard instance
   * @param {string} widgetId - Widget ID
   * @param {Object} position - New position and size
   * @returns {boolean} Update success
   */
  updateWidgetPosition(dashboard, widgetId, position) {
    try {
      const widget = dashboard.widgets.get(widgetId);
      if (!widget) {
        throw new Error(`Widget '${widgetId}' not found`);
      }
      
      // Update position
      Object.assign(widget.position, position);
      
      // Validate position
      this._validateWidgetPosition(dashboard, widget);
      
      // Update widget element
      this._updateWidgetElement(dashboard, widget);
      
      // Update layout
      this._updateDashboardLayout(dashboard);
      
      // Auto-save if enabled
      if (this.config.autoSave) {
        this._saveDashboard(dashboard);
      }
      
      eventBus.emit('dashboard:widget:moved', { dashboard, widget, position });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to update widget position', { 
        error: error.message, 
        widgetId 
      });
      return false;
    }
  }

  /**
   * Update widget data
   * @param {string} widgetId - Widget ID
   * @param {*} newData - New data
   * @returns {Promise<boolean>} Update success
   */
  async updateWidgetData(widgetId, newData) {
    try {
      const widget = this._findWidget(widgetId);
      if (!widget) {
        throw new Error(`Widget '${widgetId}' not found`);
      }
      
      const oldData = widget.data;
      widget.data = newData;
      widget.metadata.updatedAt = new Date();
      
      // Refresh widget content
      await this._refreshWidgetContent(widget);
      
      eventBus.emit('dashboard:widget:updated', { widget, oldData, newData });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to update widget data', { 
        error: error.message, 
        widgetId 
      });
      return false;
    }
  }

  /**
   * Enable dashboard editing mode
   * @param {Object} dashboard - Dashboard instance
   */
  enableEditing(dashboard) {
    try {
      if (!dashboard || dashboard.state.destroyed) {
        throw new Error('Invalid or destroyed dashboard');
      }
      
      dashboard.state.editing = true;
      dashboard.container.classList.add('dashboard-editing');
      
      // Enable widget interactions
      for (const widget of dashboard.widgets.values()) {
        this._enableWidgetEditing(widget);
      }
      
      this.logger.debug('Dashboard editing enabled', { id: dashboard.id });
      
      eventBus.emit('dashboard:editing:enabled', { dashboard });
      
    } catch (error) {
      this.logger.error('Failed to enable editing', { error: error.message });
    }
  }

  /**
   * Disable dashboard editing mode
   * @param {Object} dashboard - Dashboard instance
   */
  disableEditing(dashboard) {
    try {
      if (!dashboard || dashboard.state.destroyed) {
        throw new Error('Invalid or destroyed dashboard');
      }
      
      dashboard.state.editing = false;
      dashboard.container.classList.remove('dashboard-editing');
      
      // Disable widget interactions
      for (const widget of dashboard.widgets.values()) {
        this._disableWidgetEditing(widget);
      }
      
      // Auto-save if enabled
      if (this.config.autoSave) {
        this._saveDashboard(dashboard);
      }
      
      this.logger.debug('Dashboard editing disabled', { id: dashboard.id });
      
      eventBus.emit('dashboard:editing:disabled', { dashboard });
      
    } catch (error) {
      this.logger.error('Failed to disable editing', { error: error.message });
    }
  }

  /**
   * Export dashboard configuration
   * @param {Object} dashboard - Dashboard instance
   * @returns {Object|null} Dashboard export data
   */
  exportDashboard(dashboard) {
    try {
      if (!dashboard || dashboard.state.destroyed) {
        throw new Error('Invalid or destroyed dashboard');
      }
      
      const exportData = {
        id: dashboard.id,
        title: dashboard.title,
        description: dashboard.description,
        theme: dashboard.theme,
        layout: { ...dashboard.layout },
        settings: { ...dashboard.settings },
        widgets: [],
        metadata: {
          ...dashboard.metadata,
          exportedAt: new Date().toISOString()
        }
      };
      
      // Export widgets
      for (const widget of dashboard.widgets.values()) {
        exportData.widgets.push({
          id: widget.id,
          type: widget.type,
          title: widget.title,
          description: widget.description,
          position: { ...widget.position },
          config: { ...widget.config },
          settings: { ...widget.settings }
          // Note: Data is not exported for security/size reasons
        });
      }
      
      this.logger.debug('Dashboard exported', { id: dashboard.id });
      
      eventBus.emit('dashboard:exported', { dashboard, exportData });
      
      return exportData;
      
    } catch (error) {
      this.logger.error('Failed to export dashboard', { 
        error: error.message, 
        dashboardId: dashboard?.id 
      });
      return null;
    }
  }

  /**
   * Import dashboard configuration
   * @param {Object} importData - Dashboard import data
   * @param {HTMLElement} container - Container element
   * @returns {Object|null} Created dashboard
   */
  async importDashboard(importData, container) {
    try {
      if (!importData || !container) {
        throw new Error('Import data and container are required');
      }
      
      // Create dashboard
      const dashboard = this.createDashboard({
        ...importData,
        container,
        id: undefined // Generate new ID
      });
      
      if (!dashboard) {
        throw new Error('Failed to create dashboard from import data');
      }
      
      // Import widgets
      if (importData.widgets && importData.widgets.length > 0) {
        for (const widgetData of importData.widgets) {
          await this.addWidget(dashboard, {
            ...widgetData,
            id: undefined // Generate new ID
          });
        }
      }
      
      this.logger.info('Dashboard imported', { 
        id: dashboard.id,
        widgetsCount: importData.widgets?.length || 0
      });
      
      eventBus.emit('dashboard:imported', { dashboard, importData });
      
      return dashboard;
      
    } catch (error) {
      this.logger.error('Failed to import dashboard', { error: error.message });
      return null;
    }
  }

  /**
   * Get dashboard by ID
   * @param {string} dashboardId - Dashboard ID
   * @returns {Object|null} Dashboard instance
   */
  getDashboard(dashboardId) {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get all dashboards
   * @returns {Array} Array of dashboards
   */
  getAllDashboards() {
    return Array.from(this.dashboards.values());
  }

  /**
   * Destroy dashboard
   * @param {Object} dashboard - Dashboard instance
   * @returns {boolean} Destroy success
   */
  destroyDashboard(dashboard) {
    try {
      if (!dashboard || dashboard.state.destroyed) {
        return true;
      }
      
      // Remove all widgets
      const widgetIds = Array.from(dashboard.widgets.keys());
      for (const widgetId of widgetIds) {
        this.removeWidget(dashboard, widgetId);
      }
      
      // Clear container
      if (dashboard.container) {
        dashboard.container.innerHTML = '';
        dashboard.container.classList.remove('dashboard-container', 'dashboard-editing');
      }
      
      dashboard.state.destroyed = true;
      
      // Remove from dashboards map
      this.dashboards.delete(dashboard.id);
      
      this.logger.debug('Dashboard destroyed', { id: dashboard.id });
      
      eventBus.emit('dashboard:destroyed', { dashboard });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to destroy dashboard', { 
        error: error.message, 
        dashboardId: dashboard?.id 
      });
      return false;
    }
  }

  // Private Methods

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Configuration changes
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('dashboard.')) {
        this._updateConfig();
      }
    });
    
    // Theme changes
    eventBus.on('theme:applied', () => {
      // Re-apply dashboard themes
      for (const dashboard of this.dashboards.values()) {
        this._applyDashboardTheme(dashboard);
      }
    });
    
    // Chart updates
    eventBus.on('charts:updated', (event) => {
      // Find widgets that use this chart
      for (const dashboard of this.dashboards.values()) {
        for (const widget of dashboard.widgets.values()) {
          if (widget.type === 'chart' && widget.content === event.chart) {
            eventBus.emit('dashboard:widget:updated', { widget });
          }
        }
      }
    });
  }

  /**
   * Setup drag and drop for widgets
   * @private
   */
  _setupDragAndDrop() {
    // This will be enhanced when widgets are created
    // dragDropManager integration happens in widget creation
  }

  /**
   * Setup resize observer for responsive layouts
   * @private
   */
  _setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const dashboard = Array.from(this.dashboards.values()).find(d => 
            d.container === entry.target
          );
          if (dashboard && dashboard.layout.responsive) {
            this._handleDashboardResize(dashboard);
          }
        }
      });
    }
  }

  /**
   * Load saved dashboards
   * @private
   */
  _loadSavedDashboards() {
    try {
      const savedDashboards = configManager.get('dashboard.saved', []);
      
      this.logger.debug('Loading saved dashboards', { 
        count: savedDashboards.length 
      });
      
      // Note: Dashboards are loaded on-demand when containers are provided
      
    } catch (error) {
      this.logger.error('Failed to load saved dashboards', { error: error.message });
    }
  }

  /**
   * Load default templates
   * @private
   */
  _loadDefaultTemplates() {
    // Analytics Dashboard Template
    this.templates.set('analytics', {
      title: 'Analytics Dashboard',
      description: 'Key performance metrics and analytics',
      widgets: [
        { type: 'metric', title: 'Total Users', x: 0, y: 0, width: 3, height: 2 },
        { type: 'metric', title: 'Revenue', x: 3, y: 0, width: 3, height: 2 },
        { type: 'metric', title: 'Conversion Rate', x: 6, y: 0, width: 3, height: 2 },
        { type: 'metric', title: 'Bounce Rate', x: 9, y: 0, width: 3, height: 2 },
        { type: 'chart', title: 'Traffic Over Time', x: 0, y: 2, width: 8, height: 4 },
        { type: 'chart', title: 'Top Pages', x: 8, y: 2, width: 4, height: 4 },
        { type: 'table', title: 'Recent Activity', x: 0, y: 6, width: 12, height: 3 }
      ]
    });
    
    // Project Management Template
    this.templates.set('project', {
      title: 'Project Dashboard',
      description: 'Project status and team productivity',
      widgets: [
        { type: 'chart', title: 'Task Progress', x: 0, y: 0, width: 6, height: 4 },
        { type: 'chart', title: 'Team Velocity', x: 6, y: 0, width: 6, height: 4 },
        { type: 'metric', title: 'Open Tasks', x: 0, y: 4, width: 3, height: 2 },
        { type: 'metric', title: 'Completed', x: 3, y: 4, width: 3, height: 2 },
        { type: 'metric', title: 'In Progress', x: 6, y: 4, width: 3, height: 2 },
        { type: 'metric', title: 'Blocked', x: 9, y: 4, width: 3, height: 2 },
        { type: 'table', title: 'Recent Updates', x: 0, y: 6, width: 12, height: 3 }
      ]
    });
  }

  /**
   * Load default themes
   * @private
   */
  _loadDefaultThemes() {
    // Default theme
    this.themes.set('default', {
      background: 'var(--primary-bg)',
      widgetBackground: 'var(--secondary-bg)',
      borderColor: 'var(--border-color)',
      textColor: 'var(--primary-text)',
      headerBackground: 'var(--tertiary-bg)'
    });
    
    // Dark theme
    this.themes.set('dark', {
      background: '#1a1a1a',
      widgetBackground: '#2d2d2d',
      borderColor: '#404040',
      textColor: '#ffffff',
      headerBackground: '#404040'
    });
    
    // Light theme
    this.themes.set('light', {
      background: '#f5f5f5',
      widgetBackground: '#ffffff',
      borderColor: '#e0e0e0',
      textColor: '#333333',
      headerBackground: '#f8f9fa'
    });
  }

  /**
   * Initialize dashboard
   * @private
   */
  _initializeDashboard(dashboard) {
    const container = dashboard.container;
    
    // Add dashboard classes
    container.classList.add('dashboard-container');
    container.setAttribute('data-dashboard-id', dashboard.id);
    
    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'dashboard-grid';
    container.appendChild(gridContainer);
    
    dashboard.gridContainer = gridContainer;
    dashboard.state.initialized = true;
    
    // Setup resize observer
    if (this.resizeObserver) {
      this.resizeObserver.observe(container);
    }
  }

  /**
   * Apply dashboard theme
   * @private
   */
  _applyDashboardTheme(dashboard) {
    const theme = this.themes.get(dashboard.theme);
    if (!theme) return;
    
    const container = dashboard.container;
    
    // Apply theme styles
    Object.entries(theme).forEach(([property, value]) => {
      const cssProperty = '--dashboard-' + property.replace(/([A-Z])/g, '-$1').toLowerCase();
      container.style.setProperty(cssProperty, value);
    });
    
    container.setAttribute('data-theme', dashboard.theme);
  }

  /**
   * Create widget element
   * @private
   */
  _createWidgetElement(dashboard, widget) {
    const element = document.createElement('div');
    element.className = 'dashboard-widget';
    element.setAttribute('data-widget-id', widget.id);
    element.setAttribute('data-widget-type', widget.type);
    
    // Create widget header
    const header = document.createElement('div');
    header.className = 'widget-header';
    
    const title = document.createElement('h3');
    title.className = 'widget-title';
    title.textContent = widget.title;
    header.appendChild(title);
    
    // Create widget controls
    const controls = document.createElement('div');
    controls.className = 'widget-controls';
    
    if (widget.settings.refreshable) {
      const refreshBtn = document.createElement('button');
      refreshBtn.className = 'widget-control-btn refresh-btn';
      refreshBtn.innerHTML = '↻';
      refreshBtn.title = 'Refresh';
      refreshBtn.addEventListener('click', () => this._refreshWidgetContent(widget));
      controls.appendChild(refreshBtn);
    }
    
    if (widget.settings.removable) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'widget-control-btn remove-btn';
      removeBtn.innerHTML = '×';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => this.removeWidget(dashboard, widget.id));
      controls.appendChild(removeBtn);
    }
    
    header.appendChild(controls);
    element.appendChild(header);
    
    // Create widget content area
    const content = document.createElement('div');
    content.className = 'widget-content';
    element.appendChild(content);
    
    widget.element = element;
    widget.contentElement = content;
    
    // Position widget
    this._updateWidgetElement(dashboard, widget);
    
    // Add to dashboard
    dashboard.gridContainer.appendChild(element);
  }

  /**
   * Update widget element positioning
   * @private
   */
  _updateWidgetElement(dashboard, widget) {
    const element = widget.element;
    if (!element) return;
    
    const { x, y, width, height } = widget.position;
    const { rowHeight } = dashboard.layout;
    const [marginX, marginY] = dashboard.layout.margin;
    
    // Calculate grid positioning
    const gridCols = dashboard.layout.gridSize;
    const colWidth = `calc((100% - ${marginX * (gridCols + 1)}px) / ${gridCols})`;
    
    element.style.cssText = `
      position: absolute;
      left: calc(${x} * ${colWidth} + ${(x + 1) * marginX}px);
      top: calc(${y * (rowHeight + marginY)}px + ${marginY}px);
      width: calc(${width} * ${colWidth} + ${(width - 1) * marginX}px);
      height: ${height * rowHeight + (height - 1) * marginY}px;
      transition: ${this.config.enableAnimations ? 'all 0.3s ease' : 'none'};
    `;
  }

  /**
   * Initialize widget content
   * @private
   */
  async _initializeWidgetContent(widget) {
    try {
      widget.state.loading = true;
      this._showWidgetLoading(widget);
      
      switch (widget.type) {
        case 'chart':
          await this._initializeChartWidget(widget);
          break;
        case 'metric':
          await this._initializeMetricWidget(widget);
          break;
        case 'text':
          await this._initializeTextWidget(widget);
          break;
        case 'table':
          await this._initializeTableWidget(widget);
          break;
        case 'iframe':
          await this._initializeIFrameWidget(widget);
          break;
        case 'image':
          await this._initializeImageWidget(widget);
          break;
        default:
          await this._initializeCustomWidget(widget);
      }
      
      widget.state.loading = false;
      this._hideWidgetLoading(widget);
      
    } catch (error) {
      widget.state.loading = false;
      widget.state.error = error.message;
      this._showWidgetError(widget, error);
    }
  }

  /**
   * Initialize chart widget
   * @private
   */
  async _initializeChartWidget(widget) {
    const contentElement = widget.contentElement;
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'widget-chart-container';
    chartContainer.style.cssText = 'width: 100%; height: 100%;';
    contentElement.appendChild(chartContainer);
    
    // Create chart if data is available
    if (widget.data && widget.config.chartType) {
      const chart = chartEngine.createChart(chartContainer, {
        type: widget.config.chartType,
        data: widget.data,
        ...widget.config.chartOptions
      });
      
      if (chart) {
        widget.content = chart;
        await chartEngine.renderChart(chart);
      }
    }
  }

  /**
   * Initialize metric widget
   * @private
   */
  async _initializeMetricWidget(widget) {
    const contentElement = widget.contentElement;
    
    const metricContainer = document.createElement('div');
    metricContainer.className = 'widget-metric-container';
    
    const value = document.createElement('div');
    value.className = 'metric-value';
    value.textContent = widget.data?.value || '0';
    
    const label = document.createElement('div');
    label.className = 'metric-label';
    label.textContent = widget.data?.label || widget.title;
    
    metricContainer.appendChild(value);
    metricContainer.appendChild(label);
    contentElement.appendChild(metricContainer);
    
    widget.content = metricContainer;
  }

  /**
   * Initialize text widget
   * @private
   */
  async _initializeTextWidget(widget) {
    const contentElement = widget.contentElement;
    
    const textContainer = document.createElement('div');
    textContainer.className = 'widget-text-container';
    textContainer.innerHTML = widget.data?.html || widget.data?.text || '';
    
    contentElement.appendChild(textContainer);
    widget.content = textContainer;
  }

  /**
   * Refresh widget content
   * @private
   */
  async _refreshWidgetContent(widget) {
    try {
      widget.state.loading = true;
      this._showWidgetLoading(widget);
      
      // Clear current content
      if (widget.contentElement) {
        widget.contentElement.innerHTML = '';
      }
      
      // Reinitialize content
      await this._initializeWidgetContent(widget);
      
      eventBus.emit('dashboard:widget:refreshed', { widget });
      
    } catch (error) {
      widget.state.error = error.message;
      this._showWidgetError(widget, error);
    }
  }

  /**
   * Show widget loading state
   * @private
   */
  _showWidgetLoading(widget) {
    if (!widget.contentElement) return;
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'widget-loading';
    loadingElement.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading...</div>
    `;
    
    widget.contentElement.appendChild(loadingElement);
  }

  /**
   * Hide widget loading state
   * @private
   */
  _hideWidgetLoading(widget) {
    if (!widget.contentElement) return;
    
    const loadingElement = widget.contentElement.querySelector('.widget-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  /**
   * Show widget error state
   * @private
   */
  _showWidgetError(widget, error) {
    if (!widget.contentElement) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'widget-error';
    errorElement.innerHTML = `
      <div class="error-icon">⚠</div>
      <div class="error-message">${error.message}</div>
      <button class="error-retry-btn">Retry</button>
    `;
    
    errorElement.querySelector('.error-retry-btn').addEventListener('click', () => {
      this._refreshWidgetContent(widget);
    });
    
    widget.contentElement.appendChild(errorElement);
  }

  /**
   * Validate widget position
   * @private
   */
  _validateWidgetPosition(dashboard, widget) {
    const { x, y, width, height } = widget.position;
    const gridSize = dashboard.layout.gridSize;
    
    // Ensure widget fits within grid
    if (x + width > gridSize) {
      widget.position.x = Math.max(0, gridSize - width);
    }
    
    if (x < 0) {
      widget.position.x = 0;
    }
    
    if (y < 0) {
      widget.position.y = 0;
    }
    
    // Enforce minimum and maximum sizes
    if (width < this.config.minWidgetSize.width) {
      widget.position.width = this.config.minWidgetSize.width;
    }
    
    if (height < this.config.minWidgetSize.height) {
      widget.position.height = this.config.minWidgetSize.height;
    }
    
    if (width > this.config.maxWidgetSize.width) {
      widget.position.width = this.config.maxWidgetSize.width;
    }
    
    if (height > this.config.maxWidgetSize.height) {
      widget.position.height = this.config.maxWidgetSize.height;
    }
  }

  /**
   * Update dashboard layout
   * @private
   */
  _updateDashboardLayout(dashboard) {
    // Calculate required height
    let maxY = 0;
    for (const widget of dashboard.widgets.values()) {
      maxY = Math.max(maxY, widget.position.y + widget.position.height);
    }
    
    const totalHeight = (maxY * dashboard.layout.rowHeight) + 
                       ((maxY + 1) * dashboard.layout.margin[1]);
    
    dashboard.gridContainer.style.height = `${totalHeight}px`;
  }

  /**
   * Find widget by ID across all dashboards
   * @private
   */
  _findWidget(widgetId) {
    for (const dashboard of this.dashboards.values()) {
      const widget = dashboard.widgets.get(widgetId);
      if (widget) {
        return widget;
      }
    }
    return null;
  }

  /**
   * Generate unique dashboard ID
   * @private
   */
  _generateDashboardId() {
    return 'dashboard_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate unique widget ID
   * @private
   */
  _generateWidgetId() {
    return 'widget_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Save dashboard configuration
   * @private
   */
  _saveDashboard(dashboard) {
    try {
      const savedDashboards = configManager.get('dashboard.saved', []);
      const existingIndex = savedDashboards.findIndex(d => d.id === dashboard.id);
      
      const dashboardData = this.exportDashboard(dashboard);
      
      if (existingIndex >= 0) {
        savedDashboards[existingIndex] = dashboardData;
      } else {
        savedDashboards.push(dashboardData);
      }
      
      configManager.set('dashboard.saved', savedDashboards);
      
      this.logger.debug('Dashboard saved', { id: dashboard.id });
      
    } catch (error) {
      this.logger.error('Failed to save dashboard', { 
        error: error.message, 
        dashboardId: dashboard.id 
      });
    }
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.defaultGridSize = configManager.get('dashboard.gridSize', 12);
    this.config.defaultRowHeight = configManager.get('dashboard.rowHeight', 100);
    this.config.minWidgetSize = configManager.get('dashboard.minWidgetSize', { width: 2, height: 2 });
    this.config.maxWidgetSize = configManager.get('dashboard.maxWidgetSize', { width: 12, height: 12 });
    this.config.enableAnimations = configManager.get('dashboard.animations', true);
    this.config.autoSave = configManager.get('dashboard.autoSave', true);
    this.config.responsive = configManager.get('dashboard.responsive', true);
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const dashboardSystem = new DashboardSystem();

// Auto-initialize
setTimeout(() => {
  dashboardSystem.initialize();
}, 100);

export default dashboardSystem;