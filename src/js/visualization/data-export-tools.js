/**
 * Data Export & Visualization Tools
 * 
 * Advanced data export functionality and specialized visualization tools
 * including heatmaps, treemaps, network diagrams, and various export formats.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';
import { chartEngine } from './chart-engine.js';

export class DataExportTools {
  constructor() {
    this.exporters = new Map();
    this.visualizers = new Map();
    this.processors = new Map();
    this.templates = new Map();
    
    this.config = {
      defaultFormat: configManager.get('export.defaultFormat', 'json'),
      enableCompression: configManager.get('export.compression', false),
      maxFileSize: configManager.get('export.maxFileSize', 10 * 1024 * 1024), // 10MB
      enableBatching: configManager.get('export.batching', true),
      batchSize: configManager.get('export.batchSize', 1000),
      watermarkEnabled: configManager.get('export.watermark', false)
    };
    
    this.logger = logger.group ? logger.group('DataExport') : logger;
    
    // Export formats
    this.supportedFormats = {
      JSON: 'json',
      CSV: 'csv',
      XLSX: 'xlsx',
      XML: 'xml',
      PDF: 'pdf',
      PNG: 'png',
      JPEG: 'jpeg',
      SVG: 'svg',
      TXT: 'txt'
    };
    
    // Visualization types
    this.visualizationTypes = {
      HEATMAP: 'heatmap',
      TREEMAP: 'treemap',
      NETWORK: 'network',
      SANKEY: 'sankey',
      SUNBURST: 'sunburst',
      CALENDAR: 'calendar',
      CHORD: 'chord',
      FORCE_DIRECTED: 'force-directed'
    };
    
    this._setupEventListeners();
    this._registerDefaultExporters();
    this._registerDefaultVisualizers();
  }

  /**
   * Initialize the data export tools
   */
  initialize() {
    try {
      this.logger.info('Initializing data export tools');
      
      // Setup file system API support detection
      this._detectFileSystemSupport();
      
      // Initialize export templates
      this._loadExportTemplates();
      
      // Setup compression support
      if (this.config.enableCompression) {
        this._setupCompressionSupport();
      }
      
      this.logger.info('Data export tools initialized successfully');
      
      eventBus.emit('export:initialized', {
        exportersCount: this.exporters.size,
        visualizersCount: this.visualizers.size,
        supportedFormats: Object.values(this.supportedFormats)
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize data export tools', { error: error.message });
      errorHandler.handleError(error, 'DataExportTools.initialize');
    }
  }

  /**
   * Export data to specified format
   * @param {*} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportData(data, options = {}) {
    try {
      const {
        format = this.config.defaultFormat,
        filename = `export_${Date.now()}`,
        compression = false,
        metadata = {},
        template = null,
        filters = null,
        transformations = null
      } = options;
      
      // Validate export format
      if (!this.exporters.has(format)) {
        throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Process data if needed
      let processedData = data;
      
      if (filters) {
        processedData = this._applyFilters(processedData, filters);
      }
      
      if (transformations) {
        processedData = this._applyTransformations(processedData, transformations);
      }
      
      // Get exporter
      const exporter = this.exporters.get(format);
      
      // Export data
      const exportResult = await exporter.export(processedData, {
        filename,
        metadata,
        template,
        compression: compression || this.config.enableCompression
      });
      
      // Add watermark if enabled
      if (this.config.watermarkEnabled && exportResult.blob) {
        exportResult.blob = await this._addWatermark(exportResult.blob, format);
      }
      
      this.logger.debug('Data exported', { 
        format, 
        filename, 
        size: exportResult.size 
      });
      
      eventBus.emit('export:completed', { 
        format, 
        filename, 
        result: exportResult 
      });
      
      return exportResult;
      
    } catch (error) {
      this.logger.error('Failed to export data', { error: error.message });
      errorHandler.handleError(error, 'DataExportTools.exportData');
      return null;
    }
  }

  /**
   * Create specialized visualization
   * @param {string} type - Visualization type
   * @param {HTMLElement} container - Container element
   * @param {*} data - Visualization data
   * @param {Object} options - Visualization options
   * @returns {Promise<Object>} Visualization instance
   */
  async createVisualization(type, container, data, options = {}) {
    try {
      if (!this.visualizers.has(type)) {
        throw new Error(`Unsupported visualization type: ${type}`);
      }
      
      const visualizer = this.visualizers.get(type);
      
      // Create visualization
      const visualization = await visualizer.create(container, data, options);
      
      this.logger.debug('Visualization created', { 
        type, 
        dataPoints: Array.isArray(data) ? data.length : 'N/A'
      });
      
      eventBus.emit('export:visualization:created', { 
        type, 
        visualization 
      });
      
      return visualization;
      
    } catch (error) {
      this.logger.error('Failed to create visualization', { 
        error: error.message, 
        type 
      });
      return null;
    }
  }

  /**
   * Create heatmap visualization
   * @param {HTMLElement} container - Container element
   * @param {Array} data - Heatmap data
   * @param {Object} options - Heatmap options
   * @returns {Promise<Object>} Heatmap instance
   */
  async createHeatmap(container, data, options = {}) {
    return this.createVisualization(this.visualizationTypes.HEATMAP, container, data, options);
  }

  /**
   * Create treemap visualization
   * @param {HTMLElement} container - Container element
   * @param {Object} data - Treemap data (hierarchical)
   * @param {Object} options - Treemap options
   * @returns {Promise<Object>} Treemap instance
   */
  async createTreemap(container, data, options = {}) {
    return this.createVisualization(this.visualizationTypes.TREEMAP, container, data, options);
  }

  /**
   * Create network diagram
   * @param {HTMLElement} container - Container element
   * @param {Object} data - Network data (nodes and edges)
   * @param {Object} options - Network options
   * @returns {Promise<Object>} Network instance
   */
  async createNetworkDiagram(container, data, options = {}) {
    return this.createVisualization(this.visualizationTypes.NETWORK, container, data, options);
  }

  /**
   * Batch export multiple datasets
   * @param {Array} datasets - Array of data and options
   * @returns {Promise<Array>} Array of export results
   */
  async batchExport(datasets) {
    try {
      const results = [];
      const batchSize = this.config.batchSize;
      
      for (let i = 0; i < datasets.length; i += batchSize) {
        const batch = datasets.slice(i, i + batchSize);
        
        const batchPromises = batch.map(({ data, options }) =>
          this.exportData(data, options)
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < datasets.length) {
          await this._delay(100);
        }
      }
      
      this.logger.info('Batch export completed', { 
        totalDatasets: datasets.length,
        successCount: results.filter(r => r !== null).length
      });
      
      eventBus.emit('export:batch:completed', { results });
      
      return results;
      
    } catch (error) {
      this.logger.error('Failed to batch export', { error: error.message });
      return [];
    }
  }

  /**
   * Register custom exporter
   * @param {string} format - Export format
   * @param {Object} exporter - Exporter implementation
   */
  registerExporter(format, exporter) {
    try {
      if (!exporter.export || typeof exporter.export !== 'function') {
        throw new Error('Exporter must have an export method');
      }
      
      this.exporters.set(format, exporter);
      
      this.logger.debug('Exporter registered', { format });
      
      eventBus.emit('export:exporter:registered', { format });
      
    } catch (error) {
      this.logger.error('Failed to register exporter', { error: error.message, format });
    }
  }

  /**
   * Register custom visualizer
   * @param {string} type - Visualization type
   * @param {Object} visualizer - Visualizer implementation
   */
  registerVisualizer(type, visualizer) {
    try {
      if (!visualizer.create || typeof visualizer.create !== 'function') {
        throw new Error('Visualizer must have a create method');
      }
      
      this.visualizers.set(type, visualizer);
      
      this.logger.debug('Visualizer registered', { type });
      
      eventBus.emit('export:visualizer:registered', { type });
      
    } catch (error) {
      this.logger.error('Failed to register visualizer', { error: error.message, type });
    }
  }

  /**
   * Download exported data
   * @param {Blob|string} data - Data to download
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  downloadData(data, filename, mimeType = 'application/octet-stream') {
    try {
      let blob;
      
      if (data instanceof Blob) {
        blob = data;
      } else {
        blob = new Blob([data], { type: mimeType });
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      this.logger.debug('File downloaded', { filename, size: blob.size });
      
      eventBus.emit('export:downloaded', { filename, size: blob.size });
      
    } catch (error) {
      this.logger.error('Failed to download data', { error: error.message });
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
      if (event.key.startsWith('export.')) {
        this._updateConfig();
      }
    });
    
    // Chart export requests
    eventBus.on('charts:export:requested', async (data) => {
      const { chart, format, filename } = data;
      const exportData = chartEngine.exportChart(chart, { format });
      
      if (exportData) {
        this.downloadData(exportData, filename || `chart_${Date.now()}.${format}`);
      }
    });
  }

  /**
   * Register default exporters
   * @private
   */
  _registerDefaultExporters() {
    // JSON Exporter
    this.registerExporter('json', {
      export: async (data, options) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        return {
          blob,
          data: jsonString,
          size: blob.size,
          mimeType: 'application/json'
        };
      }
    });
    
    // CSV Exporter
    this.registerExporter('csv', {
      export: async (data, options) => {
        const csv = this._convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        
        return {
          blob,
          data: csv,
          size: blob.size,
          mimeType: 'text/csv'
        };
      }
    });
    
    // XML Exporter
    this.registerExporter('xml', {
      export: async (data, options) => {
        const xml = this._convertToXML(data);
        const blob = new Blob([xml], { type: 'application/xml' });
        
        return {
          blob,
          data: xml,
          size: blob.size,
          mimeType: 'application/xml'
        };
      }
    });
    
    // PDF Exporter (basic implementation)
    this.registerExporter('pdf', {
      export: async (data, options) => {
        const pdfContent = this._generatePDF(data, options);
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        
        return {
          blob,
          data: pdfContent,
          size: blob.size,
          mimeType: 'application/pdf'
        };
      }
    });
  }

  /**
   * Register default visualizers
   * @private
   */
  _registerDefaultVisualizers() {
    // Heatmap Visualizer
    this.registerVisualizer('heatmap', {
      create: async (container, data, options) => {
        return this._createHeatmapVisualization(container, data, options);
      }
    });
    
    // Treemap Visualizer
    this.registerVisualizer('treemap', {
      create: async (container, data, options) => {
        return this._createTreemapVisualization(container, data, options);
      }
    });
    
    // Network Visualizer
    this.registerVisualizer('network', {
      create: async (container, data, options) => {
        return this._createNetworkVisualization(container, data, options);
      }
    });
    
    // Calendar Visualizer
    this.registerVisualizer('calendar', {
      create: async (container, data, options) => {
        return this._createCalendarVisualization(container, data, options);
      }
    });
    
    // Sankey Visualizer
    this.registerVisualizer('sankey', {
      create: async (container, data, options) => {
        return this._createSankeyVisualization(container, data, options);
      }
    });
  }

  /**
   * Create heatmap visualization
   * @private
   */
  _createHeatmapVisualization(container, data, options = {}) {
    const {
      width = container.clientWidth,
      height = container.clientHeight,
      cellSize = 'auto',
      colorScale = ['#ffffff', '#ff0000'],
      showLabels = true,
      showTooltip = true
    } = options;
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.display = 'block';
    
    container.appendChild(svg);
    
    // Calculate dimensions
    const rows = Math.max(...data.map(d => d.row)) + 1;
    const cols = Math.max(...data.map(d => d.col)) + 1;
    
    const actualCellSize = cellSize === 'auto' ? 
      Math.min((width - 40) / cols, (height - 40) / rows) : cellSize;
    
    // Create color scale function
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    
    const getColor = (value) => {
      const ratio = (value - minValue) / (maxValue - minValue);
      return this._interpolateColor(colorScale[0], colorScale[1], ratio);
    };
    
    // Create cells
    const cells = [];
    
    for (const point of data) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      rect.setAttribute('x', 20 + point.col * actualCellSize);
      rect.setAttribute('y', 20 + point.row * actualCellSize);
      rect.setAttribute('width', actualCellSize - 1);
      rect.setAttribute('height', actualCellSize - 1);
      rect.setAttribute('fill', getColor(point.value));
      rect.setAttribute('stroke', '#ccc');
      rect.setAttribute('stroke-width', '0.5');
      
      if (showTooltip) {
        rect.setAttribute('title', `Row: ${point.row}, Col: ${point.col}, Value: ${point.value}`);
      }
      
      svg.appendChild(rect);
      cells.push(rect);
    }
    
    // Add labels if requested
    if (showLabels) {
      this._addHeatmapLabels(svg, rows, cols, actualCellSize, options.rowLabels, options.colLabels);
    }
    
    return {
      element: svg,
      cells,
      update: (newData) => {
        // Update implementation would go here
      },
      destroy: () => {
        container.removeChild(svg);
      }
    };
  }

  /**
   * Create treemap visualization
   * @private
   */
  _createTreemapVisualization(container, data, options = {}) {
    const {
      width = container.clientWidth,
      height = container.clientHeight,
      padding = 2,
      colorScale = ['#e8f4fd', '#1f77b4'],
      showLabels = true
    } = options;
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    
    container.appendChild(svg);
    
    // Calculate treemap layout
    const layout = this._calculateTreemapLayout(data, width, height, padding);
    
    // Create rectangles
    const rects = [];
    
    for (const item of layout) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      rect.setAttribute('x', item.x);
      rect.setAttribute('y', item.y);
      rect.setAttribute('width', item.width);
      rect.setAttribute('height', item.height);
      rect.setAttribute('fill', this._getTreemapColor(item, colorScale));
      rect.setAttribute('stroke', '#fff');
      rect.setAttribute('stroke-width', '1');
      
      svg.appendChild(rect);
      rects.push(rect);
      
      // Add label
      if (showLabels && item.width > 30 && item.height > 20) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', item.x + item.width / 2);
        text.setAttribute('y', item.y + item.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', Math.min(item.width / item.name.length * 1.2, 12));
        text.setAttribute('fill', '#333');
        text.textContent = item.name;
        
        svg.appendChild(text);
      }
    }
    
    return {
      element: svg,
      rects,
      layout,
      destroy: () => {
        container.removeChild(svg);
      }
    };
  }

  /**
   * Create network visualization
   * @private
   */
  _createNetworkVisualization(container, data, options = {}) {
    const {
      width = container.clientWidth,
      height = container.clientHeight,
      nodeRadius = 5,
      linkDistance = 30,
      charge = -100,
      showLabels = true
    } = options;
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    
    container.appendChild(svg);
    
    // Apply force-directed layout
    const layout = this._calculateNetworkLayout(data, {
      width,
      height,
      linkDistance,
      charge
    });
    
    // Create links
    const links = [];
    for (const link of data.links || []) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      
      const source = layout.nodes.find(n => n.id === link.source);
      const target = layout.nodes.find(n => n.id === link.target);
      
      if (source && target) {
        line.setAttribute('x1', source.x);
        line.setAttribute('y1', source.y);
        line.setAttribute('x2', target.x);
        line.setAttribute('y2', target.y);
        line.setAttribute('stroke', '#999');
        line.setAttribute('stroke-width', link.weight || 1);
        
        svg.appendChild(line);
        links.push(line);
      }
    }
    
    // Create nodes
    const nodes = [];
    for (const node of layout.nodes) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', node.size || nodeRadius);
      circle.setAttribute('fill', node.color || '#1f77b4');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      
      svg.appendChild(circle);
      nodes.push(circle);
      
      // Add label
      if (showLabels && node.name) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + (node.size || nodeRadius) + 15);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#333');
        text.textContent = node.name;
        
        svg.appendChild(text);
      }
    }
    
    return {
      element: svg,
      nodes,
      links,
      layout,
      destroy: () => {
        container.removeChild(svg);
      }
    };
  }

  /**
   * Convert data to CSV format
   * @private
   */
  _convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape values that contain commas, quotes, or newlines
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Convert data to XML format
   * @private
   */
  _convertToXML(data) {
    const xmlDoc = document.implementation.createDocument('', '', null);
    const root = xmlDoc.createElement('data');
    xmlDoc.appendChild(root);
    
    const convertValue = (value, parent, key) => {
      const element = xmlDoc.createElement(key || 'item');
      
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          convertValue(item, element, `item_${index}`);
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([k, v]) => {
          convertValue(v, element, k);
        });
      } else {
        element.textContent = String(value);
      }
      
      parent.appendChild(element);
    };
    
    convertValue(data, root, 'root');
    
    return new XMLSerializer().serializeToString(xmlDoc);
  }

  /**
   * Generate PDF content (basic implementation)
   * @private
   */
  _generatePDF(data, options = {}) {
    // This is a very basic PDF implementation
    // In a production environment, you'd use a proper PDF library
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    const pdfHeader = '%PDF-1.4\n';
    const pdfBody = `1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n\n4 0 obj\n<<\n/Length ${content.length + 50}\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(${content}) Tj\nET\nendstream\nendobj\n\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n${300 + content.length}\n%%EOF`;
    
    return pdfHeader + pdfBody;
  }

  /**
   * Calculate treemap layout
   * @private
   */
  _calculateTreemapLayout(data, width, height, padding) {
    // Simple squarified treemap algorithm
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const items = data.map(item => ({
      ...item,
      area: (item.value / total) * width * height
    }));
    
    // Sort by area (descending)
    items.sort((a, b) => b.area - a.area);
    
    const layout = [];
    let x = 0, y = 0;
    let remainingWidth = width;
    let remainingHeight = height;
    
    for (const item of items) {
      const itemWidth = Math.sqrt(item.area * (remainingWidth / remainingHeight));
      const itemHeight = item.area / itemWidth;
      
      layout.push({
        ...item,
        x: x + padding,
        y: y + padding,
        width: Math.max(0, itemWidth - 2 * padding),
        height: Math.max(0, itemHeight - 2 * padding)
      });
      
      // Update position for next item
      x += itemWidth;
      if (x + itemWidth > width) {
        x = 0;
        y += itemHeight;
      }
    }
    
    return layout;
  }

  /**
   * Calculate network layout using force-directed algorithm
   * @private
   */
  _calculateNetworkLayout(data, options) {
    const { width, height, linkDistance, charge } = options;
    const nodes = data.nodes.map(node => ({
      ...node,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0
    }));
    
    // Run simulation for a fixed number of iterations
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      // Apply forces
      nodes.forEach((node, index) => {
        // Repulsive forces between nodes
        nodes.forEach((other, otherIndex) => {
          if (index !== otherIndex) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const force = charge / distance;
              node.vx += (dx / distance) * force;
              node.vy += (dy / distance) * force;
            }
          }
        });
        
        // Attractive forces from links
        data.links?.forEach(link => {
          if (link.source === node.id) {
            const target = nodes.find(n => n.id === link.target);
            if (target) {
              const dx = target.x - node.x;
              const dy = target.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const force = (distance - linkDistance) * 0.1;
              
              node.vx += (dx / distance) * force;
              node.vy += (dy / distance) * force;
            }
          }
        });
      });
      
      // Update positions
      nodes.forEach(node => {
        node.x += node.vx * 0.1;
        node.y += node.vy * 0.1;
        node.vx *= 0.9; // Damping
        node.vy *= 0.9;
        
        // Keep nodes within bounds
        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      });
    }
    
    return { nodes };
  }

  /**
   * Interpolate between two colors
   * @private
   */
  _interpolateColor(color1, color2, ratio) {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Apply filters to data
   * @private
   */
  _applyFilters(data, filters) {
    let filteredData = data;
    
    for (const filter of filters) {
      if (filter.type === 'range') {
        filteredData = filteredData.filter(item => 
          item[filter.field] >= filter.min && item[filter.field] <= filter.max
        );
      } else if (filter.type === 'equals') {
        filteredData = filteredData.filter(item => 
          item[filter.field] === filter.value
        );
      } else if (filter.type === 'contains') {
        filteredData = filteredData.filter(item => 
          String(item[filter.field]).toLowerCase().includes(filter.value.toLowerCase())
        );
      }
    }
    
    return filteredData;
  }

  /**
   * Apply transformations to data
   * @private
   */
  _applyTransformations(data, transformations) {
    let transformedData = data;
    
    for (const transform of transformations) {
      if (transform.type === 'sort') {
        transformedData = [...transformedData].sort((a, b) => {
          const aVal = a[transform.field];
          const bVal = b[transform.field];
          
          if (transform.order === 'desc') {
            return bVal - aVal;
          }
          return aVal - bVal;
        });
      } else if (transform.type === 'group') {
        const grouped = {};
        transformedData.forEach(item => {
          const key = item[transform.field];
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(item);
        });
        transformedData = Object.entries(grouped).map(([key, items]) => ({
          [transform.field]: key,
          items,
          count: items.length
        }));
      }
    }
    
    return transformedData;
  }

  /**
   * Add watermark to exported data
   * @private
   */
  async _addWatermark(blob, format) {
    // Simple watermark implementation
    // In production, you'd use proper image/document processing libraries
    return blob; // Return unchanged for now
  }

  /**
   * Detect file system API support
   * @private
   */
  _detectFileSystemSupport() {
    this.fileSystemSupport = {
      fileSystemAccess: 'showSaveFilePicker' in window,
      webkitFileSystem: 'webkitRequestFileSystem' in window,
      mozFileSystem: 'mozRequestFileSystem' in window
    };
    
    this.logger.debug('File system support detected', this.fileSystemSupport);
  }

  /**
   * Load export templates
   * @private
   */
  _loadExportTemplates() {
    // Basic report template
    this.templates.set('report', {
      title: 'Data Report',
      sections: ['summary', 'data', 'charts'],
      styles: {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        margin: '20px'
      }
    });
    
    // Dashboard template
    this.templates.set('dashboard', {
      title: 'Dashboard Export',
      sections: ['header', 'widgets', 'footer'],
      layout: 'grid',
      styles: {
        gridColumns: '2',
        gap: '20px'
      }
    });
  }

  /**
   * Setup compression support
   * @private
   */
  _setupCompressionSupport() {
    // Check for compression API support
    this.compressionSupport = {
      gzip: 'CompressionStream' in window,
      deflate: 'DeflateStream' in window
    };
    
    this.logger.debug('Compression support detected', this.compressionSupport);
  }

  /**
   * Delay function for batching
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.defaultFormat = configManager.get('export.defaultFormat', 'json');
    this.config.enableCompression = configManager.get('export.compression', false);
    this.config.maxFileSize = configManager.get('export.maxFileSize', 10 * 1024 * 1024);
    this.config.enableBatching = configManager.get('export.batching', true);
    this.config.batchSize = configManager.get('export.batchSize', 1000);
    this.config.watermarkEnabled = configManager.get('export.watermark', false);
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const dataExportTools = new DataExportTools();

// Auto-initialize
setTimeout(() => {
  dataExportTools.initialize();
}, 100);

export default dataExportTools;