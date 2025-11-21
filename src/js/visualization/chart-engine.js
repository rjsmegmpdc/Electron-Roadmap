/**
 * Chart Engine
 * 
 * Advanced chart rendering system with Canvas/SVG support, multiple chart types,
 * animations, interactions, and responsive design capabilities.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';

export class ChartEngine {
  constructor() {
    this.charts = new Map();
    this.renderers = new Map();
    this.themes = new Map();
    this.plugins = new Map();
    
    this.config = {
      defaultRenderer: configManager.get('charts.defaultRenderer', 'canvas'),
      enableAnimations: configManager.get('charts.animations', true),
      responsiveResize: configManager.get('charts.responsive', true),
      retainPixelRatio: configManager.get('charts.retainPixelRatio', true),
      animationDuration: configManager.get('charts.animationDuration', 750),
      animationEasing: configManager.get('charts.animationEasing', 'easeOutQuart')
    };
    
    this.logger = logger.group ? logger.group('Charts') : logger;
    
    // Default color palettes
    this.colorPalettes = {
      default: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'],
      material: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4'],
      pastel: ['#ffb3ba', '#bae1ff', '#baffc9', '#ffffba', '#ffdfba', '#e0bfff', '#ffc3a0', '#ff9999'],
      dark: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'],
      accessible: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#bcbd22']
    };
    
    // Animation easing functions
    this.easingFunctions = {
      linear: t => t,
      easeInQuad: t => t * t,
      easeOutQuad: t => t * (2 - t),
      easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeInCubic: t => t * t * t,
      easeOutCubic: t => (--t) * t * t + 1,
      easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
      easeInQuart: t => t * t * t * t,
      easeOutQuart: t => 1 - (--t) * t * t * t,
      easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
    };
    
    this._setupEventListeners();
    this._registerDefaultRenderers();
    this._loadDefaultThemes();
  }

  /**
   * Initialize the chart engine
   */
  initialize() {
    try {
      this.logger.info('Initializing chart engine');
      
      // Setup global resize observer
      if (this.config.responsiveResize) {
        this._setupResizeObserver();
      }
      
      // Setup default plugins
      this._registerDefaultPlugins();
      
      this.logger.info('Chart engine initialized successfully');
      
      eventBus.emit('charts:initialized', {
        renderersCount: this.renderers.size,
        themesCount: this.themes.size,
        pluginsCount: this.plugins.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize chart engine', { error: error.message });
      errorHandler.handleError(error, 'ChartEngine.initialize');
    }
  }

  /**
   * Create a new chart
   * @param {HTMLElement} container - Container element
   * @param {Object} config - Chart configuration
   * @returns {Object} Chart instance
   */
  createChart(container, config) {
    try {
      if (!container || !config) {
        throw new Error('Container and config are required');
      }
      
      const chartId = config.id || this._generateChartId();
      
      // Validate configuration
      this._validateConfig(config);
      
      // Create chart instance
      const chart = {
        id: chartId,
        container,
        config: { ...this._getDefaultConfig(), ...config },
        data: config.data || [],
        renderer: null,
        canvas: null,
        context: null,
        dimensions: { width: 0, height: 0 },
        scales: {},
        animations: new Map(),
        plugins: [],
        interactions: {
          hover: null,
          click: null,
          zoom: null,
          pan: null
        },
        state: {
          rendered: false,
          animating: false,
          destroyed: false
        }
      };
      
      // Initialize renderer
      this._initializeRenderer(chart);
      
      // Setup canvas/SVG
      this._setupCanvas(chart);
      
      // Calculate dimensions
      this._calculateDimensions(chart);
      
      // Setup scales
      this._setupScales(chart);
      
      // Setup interactions
      this._setupInteractions(chart);
      
      // Load plugins
      this._loadChartPlugins(chart);
      
      // Store chart
      this.charts.set(chartId, chart);
      
      this.logger.debug('Chart created', { 
        id: chartId, 
        type: chart.config.type,
        renderer: chart.config.renderer 
      });
      
      eventBus.emit('charts:created', { chart });
      
      return chart;
      
    } catch (error) {
      this.logger.error('Failed to create chart', { error: error.message });
      errorHandler.handleError(error, 'ChartEngine.createChart');
      return null;
    }
  }

  /**
   * Render a chart
   * @param {Object} chart - Chart instance
   * @param {Object} options - Rendering options
   * @returns {Promise<boolean>} Render success
   */
  async renderChart(chart, options = {}) {
    try {
      if (!chart || chart.state.destroyed) {
        throw new Error('Invalid or destroyed chart');
      }
      
      chart.state.animating = true;
      
      // Clear canvas
      this._clearCanvas(chart);
      
      // Apply theme
      if (chart.config.theme) {
        this._applyTheme(chart);
      }
      
      // Pre-render plugins
      await this._executePlugins(chart, 'beforeRender');
      
      // Render based on chart type
      const renderer = this.renderers.get(chart.config.renderer);
      if (!renderer) {
        throw new Error(`Renderer '${chart.config.renderer}' not found`);
      }
      
      // Animate if enabled
      if (this.config.enableAnimations && chart.config.animation !== false && !options.immediate) {
        await this._animateChart(chart, () => renderer.render(chart));
      } else {
        renderer.render(chart);
      }
      
      // Post-render plugins
      await this._executePlugins(chart, 'afterRender');
      
      chart.state.rendered = true;
      chart.state.animating = false;
      
      this.logger.debug('Chart rendered', { id: chart.id, type: chart.config.type });
      
      eventBus.emit('charts:rendered', { chart });
      
      return true;
      
    } catch (error) {
      chart.state.animating = false;
      this.logger.error('Failed to render chart', { 
        error: error.message, 
        chartId: chart.id 
      });
      return false;
    }
  }

  /**
   * Update chart data
   * @param {Object} chart - Chart instance
   * @param {Array} newData - New chart data
   * @param {Object} options - Update options
   * @returns {Promise<boolean>} Update success
   */
  async updateChart(chart, newData, options = {}) {
    try {
      if (!chart || chart.state.destroyed) {
        throw new Error('Invalid or destroyed chart');
      }
      
      const oldData = chart.data;
      chart.data = newData;
      
      // Recalculate scales if needed
      if (options.updateScales !== false) {
        this._setupScales(chart);
      }
      
      // Re-render
      const success = await this.renderChart(chart, options);
      
      if (success) {
        eventBus.emit('charts:updated', { chart, oldData, newData });
      }
      
      return success;
      
    } catch (error) {
      this.logger.error('Failed to update chart', { 
        error: error.message, 
        chartId: chart.id 
      });
      return false;
    }
  }

  /**
   * Resize chart
   * @param {Object} chart - Chart instance
   * @param {Object} dimensions - New dimensions (optional)
   * @returns {Promise<boolean>} Resize success
   */
  async resizeChart(chart, dimensions = null) {
    try {
      if (!chart || chart.state.destroyed) {
        throw new Error('Invalid or destroyed chart');
      }
      
      const oldDimensions = { ...chart.dimensions };
      
      // Calculate new dimensions
      if (dimensions) {
        chart.dimensions = dimensions;
      } else {
        this._calculateDimensions(chart);
      }
      
      // Update canvas size
      this._updateCanvasSize(chart);
      
      // Recalculate scales
      this._setupScales(chart);
      
      // Re-render
      const success = await this.renderChart(chart, { immediate: true });
      
      if (success) {
        eventBus.emit('charts:resized', { chart, oldDimensions, newDimensions: chart.dimensions });
      }
      
      return success;
      
    } catch (error) {
      this.logger.error('Failed to resize chart', { 
        error: error.message, 
        chartId: chart.id 
      });
      return false;
    }
  }

  /**
   * Destroy a chart
   * @param {Object} chart - Chart instance
   * @returns {boolean} Destroy success
   */
  destroyChart(chart) {
    try {
      if (!chart || chart.state.destroyed) {
        return true;
      }
      
      // Clear animations
      for (const animation of chart.animations.values()) {
        if (animation.id) {
          cancelAnimationFrame(animation.id);
        }
      }
      chart.animations.clear();
      
      // Remove event listeners
      this._removeInteractions(chart);
      
      // Remove canvas
      if (chart.canvas && chart.canvas.parentNode) {
        chart.canvas.parentNode.removeChild(chart.canvas);
      }
      
      // Execute destroy plugins
      this._executePlugins(chart, 'destroy');
      
      chart.state.destroyed = true;
      
      // Remove from charts map
      this.charts.delete(chart.id);
      
      this.logger.debug('Chart destroyed', { id: chart.id });
      
      eventBus.emit('charts:destroyed', { chart });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to destroy chart', { 
        error: error.message, 
        chartId: chart.id 
      });
      return false;
    }
  }

  /**
   * Get chart by ID
   * @param {string} chartId - Chart ID
   * @returns {Object|null} Chart instance
   */
  getChart(chartId) {
    return this.charts.get(chartId) || null;
  }

  /**
   * Get all charts
   * @returns {Array} Array of chart instances
   */
  getAllCharts() {
    return Array.from(this.charts.values());
  }

  /**
   * Register a custom renderer
   * @param {string} name - Renderer name
   * @param {Object} renderer - Renderer implementation
   */
  registerRenderer(name, renderer) {
    try {
      if (!renderer.render || typeof renderer.render !== 'function') {
        throw new Error('Renderer must have a render method');
      }
      
      this.renderers.set(name, renderer);
      
      this.logger.debug('Renderer registered', { name });
      
      eventBus.emit('charts:renderer:registered', { name, renderer });
      
    } catch (error) {
      this.logger.error('Failed to register renderer', { error: error.message, name });
    }
  }

  /**
   * Register a chart theme
   * @param {string} name - Theme name
   * @param {Object} theme - Theme configuration
   */
  registerTheme(name, theme) {
    try {
      this.themes.set(name, theme);
      
      this.logger.debug('Theme registered', { name });
      
      eventBus.emit('charts:theme:registered', { name, theme });
      
    } catch (error) {
      this.logger.error('Failed to register theme', { error: error.message, name });
    }
  }

  /**
   * Register a chart plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin implementation
   */
  registerPlugin(name, plugin) {
    try {
      this.plugins.set(name, plugin);
      
      this.logger.debug('Plugin registered', { name });
      
      eventBus.emit('charts:plugin:registered', { name, plugin });
      
    } catch (error) {
      this.logger.error('Failed to register plugin', { error: error.message, name });
    }
  }

  /**
   * Export chart as image
   * @param {Object} chart - Chart instance
   * @param {Object} options - Export options
   * @returns {string|null} Data URL or null if failed
   */
  exportChart(chart, options = {}) {
    try {
      if (!chart || chart.state.destroyed || !chart.canvas) {
        throw new Error('Invalid chart or canvas not available');
      }
      
      const format = options.format || 'png';
      const quality = options.quality || 1.0;
      
      if (chart.canvas.toDataURL) {
        return chart.canvas.toDataURL(`image/${format}`, quality);
      } else if (chart.canvas.outerHTML) {
        // SVG export
        const svgData = new XMLSerializer().serializeToString(chart.canvas);
        return 'data:image/svg+xml;base64,' + btoa(svgData);
      }
      
      throw new Error('Export not supported for this chart type');
      
    } catch (error) {
      this.logger.error('Failed to export chart', { 
        error: error.message, 
        chartId: chart.id 
      });
      return null;
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
      if (event.key.startsWith('charts.')) {
        this._updateConfig();
      }
    });
    
    // Theme changes
    eventBus.on('theme:applied', () => {
      // Re-render all charts with new theme
      for (const chart of this.charts.values()) {
        if (chart.config.responsiveTheme !== false) {
          this.renderChart(chart, { immediate: true });
        }
      }
    });
  }

  /**
   * Register default renderers
   * @private
   */
  _registerDefaultRenderers() {
    // Canvas renderer
    this.registerRenderer('canvas', {
      render: (chart) => this._renderCanvas(chart)
    });
    
    // SVG renderer
    this.registerRenderer('svg', {
      render: (chart) => this._renderSVG(chart)
    });
  }

  /**
   * Load default themes
   * @private
   */
  _loadDefaultThemes() {
    // Light theme
    this.registerTheme('light', {
      background: '#ffffff',
      gridColor: '#e0e0e0',
      textColor: '#333333',
      colors: this.colorPalettes.default
    });
    
    // Dark theme
    this.registerTheme('dark', {
      background: '#1a1a1a',
      gridColor: '#404040',
      textColor: '#ffffff',
      colors: this.colorPalettes.dark
    });
    
    // Material theme
    this.registerTheme('material', {
      background: '#fafafa',
      gridColor: '#e0e0e0',
      textColor: '#212121',
      colors: this.colorPalettes.material
    });
  }

  /**
   * Register default plugins
   * @private
   */
  _registerDefaultPlugins() {
    // Legend plugin
    this.registerPlugin('legend', {
      beforeRender: (chart) => this._renderLegend(chart),
      afterRender: (chart) => {}
    });
    
    // Tooltip plugin
    this.registerPlugin('tooltip', {
      beforeRender: (chart) => {},
      afterRender: (chart) => this._setupTooltip(chart)
    });
    
    // Grid plugin
    this.registerPlugin('grid', {
      beforeRender: (chart) => this._renderGrid(chart),
      afterRender: (chart) => {}
    });
    
    // Axis plugin
    this.registerPlugin('axes', {
      beforeRender: (chart) => this._renderAxes(chart),
      afterRender: (chart) => {}
    });
  }

  /**
   * Setup resize observer
   * @private
   */
  _setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const chart = Array.from(this.charts.values()).find(c => 
            c.container === entry.target
          );
          if (chart && !chart.state.animating) {
            this.resizeChart(chart);
          }
        }
      });
    }
  }

  /**
   * Initialize renderer for chart
   * @private
   */
  _initializeRenderer(chart) {
    const rendererName = chart.config.renderer || this.config.defaultRenderer;
    const renderer = this.renderers.get(rendererName);
    
    if (!renderer) {
      throw new Error(`Renderer '${rendererName}' not found`);
    }
    
    chart.renderer = renderer;
    chart.config.renderer = rendererName;
  }

  /**
   * Setup canvas or SVG element
   * @private
   */
  _setupCanvas(chart) {
    const isCanvas = chart.config.renderer === 'canvas';
    
    if (isCanvas) {
      chart.canvas = document.createElement('canvas');
      chart.context = chart.canvas.getContext('2d');
      
      // Handle high DPI displays
      if (this.config.retainPixelRatio) {
        const pixelRatio = window.devicePixelRatio || 1;
        chart.canvas.style.width = '100%';
        chart.canvas.style.height = '100%';
        chart.pixelRatio = pixelRatio;
      }
    } else {
      chart.canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chart.canvas.style.width = '100%';
      chart.canvas.style.height = '100%';
    }
    
    chart.canvas.className = 'chart-canvas';
    chart.container.appendChild(chart.canvas);
    
    // Setup resize observer
    if (this.resizeObserver && chart.config.responsive !== false) {
      this.resizeObserver.observe(chart.container);
    }
  }

  /**
   * Calculate chart dimensions
   * @private
   */
  _calculateDimensions(chart) {
    const container = chart.container;
    const computedStyle = window.getComputedStyle(container);
    
    const width = container.clientWidth - 
                  parseFloat(computedStyle.paddingLeft) - 
                  parseFloat(computedStyle.paddingRight);
    const height = container.clientHeight - 
                   parseFloat(computedStyle.paddingTop) - 
                   parseFloat(computedStyle.paddingBottom);
    
    chart.dimensions = {
      width: Math.max(width, 100),
      height: Math.max(height, 100)
    };
    
    this._updateCanvasSize(chart);
  }

  /**
   * Update canvas size
   * @private
   */
  _updateCanvasSize(chart) {
    const { width, height } = chart.dimensions;
    
    if (chart.config.renderer === 'canvas') {
      const pixelRatio = chart.pixelRatio || 1;
      chart.canvas.width = width * pixelRatio;
      chart.canvas.height = height * pixelRatio;
      chart.canvas.style.width = width + 'px';
      chart.canvas.style.height = height + 'px';
      
      if (pixelRatio !== 1) {
        chart.context.scale(pixelRatio, pixelRatio);
      }
    } else {
      chart.canvas.setAttribute('width', width);
      chart.canvas.setAttribute('height', height);
      chart.canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
  }

  /**
   * Setup chart scales
   * @private
   */
  _setupScales(chart) {
    const data = chart.data;
    if (!data || !data.length) {
      chart.scales = {};
      return;
    }
    
    // Setup scales based on chart type
    switch (chart.config.type) {
      case 'line':
      case 'bar':
      case 'scatter':
        this._setupCartesianScales(chart);
        break;
      case 'pie':
      case 'doughnut':
        this._setupRadialScales(chart);
        break;
      case 'timeline':
        this._setupTimelineScales(chart);
        break;
      default:
        this._setupCartesianScales(chart);
    }
  }

  /**
   * Setup cartesian scales (x, y)
   * @private
   */
  _setupCartesianScales(chart) {
    const data = chart.data;
    const { width, height } = chart.dimensions;
    const margin = chart.config.margin || { top: 20, right: 20, bottom: 40, left: 60 };
    
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    // X scale
    const xValues = data.map(d => d.x || d.label);
    const xMin = Math.min(...xValues.filter(v => typeof v === 'number'));
    const xMax = Math.max(...xValues.filter(v => typeof v === 'number'));
    
    chart.scales.x = {
      type: typeof xValues[0] === 'number' ? 'linear' : 'ordinal',
      domain: typeof xValues[0] === 'number' ? [xMin, xMax] : xValues,
      range: [margin.left, margin.left + plotWidth],
      scale: (value) => {
        if (chart.scales.x.type === 'linear') {
          return margin.left + ((value - xMin) / (xMax - xMin)) * plotWidth;
        } else {
          const index = chart.scales.x.domain.indexOf(value);
          return margin.left + (index / (chart.scales.x.domain.length - 1)) * plotWidth;
        }
      }
    };
    
    // Y scale
    const yValues = data.map(d => d.y || d.value);
    const yMin = Math.min(0, Math.min(...yValues));
    const yMax = Math.max(...yValues);
    const yPadding = (yMax - yMin) * 0.1;
    
    chart.scales.y = {
      type: 'linear',
      domain: [yMin - yPadding, yMax + yPadding],
      range: [margin.top + plotHeight, margin.top],
      scale: (value) => {
        return margin.top + plotHeight - ((value - (yMin - yPadding)) / ((yMax + yPadding) - (yMin - yPadding))) * plotHeight;
      }
    };
  }

  /**
   * Setup radial scales for pie charts
   * @private
   */
  _setupRadialScales(chart) {
    const data = chart.data;
    const { width, height } = chart.dimensions;
    const radius = Math.min(width, height) / 2 - 20;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
    
    chart.scales.radial = {
      type: 'radial',
      radius,
      centerX,
      centerY,
      total,
      getAngle: (value) => (value / total) * 2 * Math.PI
    };
  }

  /**
   * Setup timeline scales
   * @private
   */
  _setupTimelineScales(chart) {
    const data = chart.data;
    const { width, height } = chart.dimensions;
    const margin = chart.config.margin || { top: 20, right: 20, bottom: 40, left: 60 };
    
    const dates = data.map(d => new Date(d.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    chart.scales.time = {
      type: 'time',
      domain: [minDate, maxDate],
      range: [margin.left, width - margin.right],
      scale: (date) => {
        const time = new Date(date).getTime();
        const minTime = minDate.getTime();
        const maxTime = maxDate.getTime();
        return margin.left + ((time - minTime) / (maxTime - minTime)) * (width - margin.left - margin.right);
      }
    };
  }

  /**
   * Setup chart interactions
   * @private
   */
  _setupInteractions(chart) {
    const canvas = chart.canvas;
    
    // Hover interactions
    if (chart.config.interaction?.hover !== false) {
      canvas.addEventListener('mousemove', (event) => {
        this._handleHover(chart, event);
      });
      
      canvas.addEventListener('mouseleave', () => {
        this._clearHover(chart);
      });
    }
    
    // Click interactions
    if (chart.config.interaction?.click !== false) {
      canvas.addEventListener('click', (event) => {
        this._handleClick(chart, event);
      });
    }
    
    // Zoom interactions
    if (chart.config.interaction?.zoom) {
      canvas.addEventListener('wheel', (event) => {
        this._handleZoom(chart, event);
      });
    }
    
    // Pan interactions
    if (chart.config.interaction?.pan) {
      this._setupPanInteractions(chart);
    }
  }

  /**
   * Handle hover interactions
   * @private
   */
  _handleHover(chart, event) {
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find hovered data point
    const hoveredPoint = this._findDataPoint(chart, x, y);
    
    if (hoveredPoint !== chart.interactions.hover) {
      chart.interactions.hover = hoveredPoint;
      
      eventBus.emit('charts:hover', { chart, point: hoveredPoint, x, y });
      
      // Update tooltip
      this._updateTooltip(chart, hoveredPoint, x, y);
    }
  }

  /**
   * Handle click interactions
   * @private
   */
  _handleClick(chart, event) {
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const clickedPoint = this._findDataPoint(chart, x, y);
    
    if (clickedPoint) {
      chart.interactions.click = clickedPoint;
      
      eventBus.emit('charts:click', { chart, point: clickedPoint, x, y });
    }
  }

  /**
   * Load chart plugins
   * @private
   */
  _loadChartPlugins(chart) {
    const pluginNames = chart.config.plugins || ['grid', 'axes', 'legend', 'tooltip'];
    
    chart.plugins = [];
    
    for (const pluginName of pluginNames) {
      const plugin = this.plugins.get(pluginName);
      if (plugin) {
        chart.plugins.push({ name: pluginName, ...plugin });
      }
    }
  }

  /**
   * Execute plugins
   * @private
   */
  async _executePlugins(chart, phase) {
    for (const plugin of chart.plugins) {
      if (plugin[phase] && typeof plugin[phase] === 'function') {
        try {
          await plugin[phase](chart);
        } catch (error) {
          this.logger.warn('Plugin execution failed', { 
            plugin: plugin.name, 
            phase, 
            error: error.message 
          });
        }
      }
    }
  }

  /**
   * Animate chart rendering
   * @private
   */
  async _animateChart(chart, renderFunction) {
    return new Promise((resolve) => {
      const duration = chart.config.animationDuration || this.config.animationDuration;
      const easingName = chart.config.animationEasing || this.config.animationEasing;
      const easing = this.easingFunctions[easingName] || this.easingFunctions.easeOutQuart;
      
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        
        // Store animation progress for use in rendering
        chart.animationProgress = easedProgress;
        
        // Clear and render
        this._clearCanvas(chart);
        renderFunction();
        
        if (progress < 1) {
          chart.animations.set('main', {
            id: requestAnimationFrame(animate)
          });
        } else {
          chart.animationProgress = 1;
          chart.animations.delete('main');
          resolve();
        }
      };
      
      chart.animations.set('main', {
        id: requestAnimationFrame(animate)
      });
    });
  }

  /**
   * Clear canvas
   * @private
   */
  _clearCanvas(chart) {
    if (chart.config.renderer === 'canvas') {
      chart.context.clearRect(0, 0, chart.dimensions.width, chart.dimensions.height);
    } else {
      chart.canvas.innerHTML = '';
    }
  }

  /**
   * Render using canvas
   * @private
   */
  _renderCanvas(chart) {
    const ctx = chart.context;
    
    switch (chart.config.type) {
      case 'line':
        this._renderLineChart(chart, ctx);
        break;
      case 'bar':
        this._renderBarChart(chart, ctx);
        break;
      case 'pie':
        this._renderPieChart(chart, ctx);
        break;
      case 'scatter':
        this._renderScatterChart(chart, ctx);
        break;
      case 'timeline':
        this._renderTimelineChart(chart, ctx);
        break;
      default:
        throw new Error(`Chart type '${chart.config.type}' not supported`);
    }
  }

  /**
   * Render line chart
   * @private
   */
  _renderLineChart(chart, ctx) {
    const data = chart.data;
    const colors = this._getChartColors(chart);
    const progress = chart.animationProgress || 1;
    
    if (!data || !data.length) return;
    
    ctx.save();
    
    // Draw lines
    ctx.beginPath();
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = chart.config.lineWidth || 2;
    
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const x = chart.scales.x.scale(point.x || point.label);
      const y = chart.scales.y.scale(point.y || point.value);
      
      // Apply animation
      const animatedY = chart.scales.y.range[0] + (y - chart.scales.y.range[0]) * progress;
      
      if (i === 0) {
        ctx.moveTo(x, animatedY);
      } else {
        ctx.lineTo(x, animatedY);
      }
    }
    
    ctx.stroke();
    
    // Draw points
    if (chart.config.showPoints !== false) {
      for (let i = 0; i < data.length; i++) {
        const point = data[i];
        const x = chart.scales.x.scale(point.x || point.label);
        const y = chart.scales.y.scale(point.y || point.value);
        const animatedY = chart.scales.y.range[0] + (y - chart.scales.y.range[0]) * progress;
        
        ctx.beginPath();
        ctx.fillStyle = colors[0];
        ctx.arc(x, animatedY, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }

  /**
   * Render bar chart
   * @private
   */
  _renderBarChart(chart, ctx) {
    const data = chart.data;
    const colors = this._getChartColors(chart);
    const progress = chart.animationProgress || 1;
    
    if (!data || !data.length) return;
    
    const barWidth = (chart.scales.x.range[1] - chart.scales.x.range[0]) / data.length * 0.8;
    
    ctx.save();
    
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const x = chart.scales.x.scale(point.x || point.label) - barWidth / 2;
      const baseY = chart.scales.y.scale(0);
      const y = chart.scales.y.scale(point.y || point.value);
      const height = Math.abs(baseY - y) * progress;
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, baseY - (baseY > y ? height : 0), barWidth, height);
    }
    
    ctx.restore();
  }

  /**
   * Render pie chart
   * @private
   */
  _renderPieChart(chart, ctx) {
    const data = chart.data;
    const colors = this._getChartColors(chart);
    const progress = chart.animationProgress || 1;
    const scale = chart.scales.radial;
    
    if (!data || !data.length) return;
    
    ctx.save();
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const sliceAngle = scale.getAngle(point.value) * progress;
      
      ctx.beginPath();
      ctx.moveTo(scale.centerX, scale.centerY);
      ctx.arc(scale.centerX, scale.centerY, scale.radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      currentAngle += sliceAngle;
    }
    
    ctx.restore();
  }

  /**
   * Get chart colors from theme or config
   * @private
   */
  _getChartColors(chart) {
    if (chart.config.colors) {
      return chart.config.colors;
    }
    
    if (chart.config.theme && this.themes.has(chart.config.theme)) {
      const theme = this.themes.get(chart.config.theme);
      return theme.colors || this.colorPalettes.default;
    }
    
    return this.colorPalettes.default;
  }

  /**
   * Get default chart configuration
   * @private
   */
  _getDefaultConfig() {
    return {
      type: 'line',
      renderer: this.config.defaultRenderer,
      responsive: true,
      animation: true,
      interaction: {
        hover: true,
        click: true
      },
      plugins: ['grid', 'axes', 'legend', 'tooltip']
    };
  }

  /**
   * Validate chart configuration
   * @private
   */
  _validateConfig(config) {
    if (!config.type) {
      throw new Error('Chart type is required');
    }
    
    const supportedTypes = ['line', 'bar', 'pie', 'doughnut', 'scatter', 'timeline'];
    if (!supportedTypes.includes(config.type)) {
      throw new Error(`Unsupported chart type: ${config.type}`);
    }
  }

  /**
   * Generate unique chart ID
   * @private
   */
  _generateChartId() {
    return 'chart_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.defaultRenderer = configManager.get('charts.defaultRenderer', 'canvas');
    this.config.enableAnimations = configManager.get('charts.animations', true);
    this.config.responsiveResize = configManager.get('charts.responsive', true);
    this.config.retainPixelRatio = configManager.get('charts.retainPixelRatio', true);
    this.config.animationDuration = configManager.get('charts.animationDuration', 750);
    this.config.animationEasing = configManager.get('charts.animationEasing', 'easeOutQuart');
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const chartEngine = new ChartEngine();

// Auto-initialize
setTimeout(() => {
  chartEngine.initialize();
}, 100);

export default chartEngine;