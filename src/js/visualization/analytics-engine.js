/**
 * Analytics Engine
 * 
 * Advanced analytics system for tracking user interactions, performance metrics,
 * data insights, and generating reports with real-time monitoring capabilities.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';
import { chartEngine } from './chart-engine.js';

export class AnalyticsEngine {
  constructor() {
    this.events = [];
    this.metrics = new Map();
    this.sessions = new Map();
    this.reports = new Map();
    this.collectors = new Map();
    this.processors = new Map();
    this.filters = new Map();
    
    this.config = {
      enabled: configManager.get('analytics.enabled', true),
      batchSize: configManager.get('analytics.batchSize', 100),
      flushInterval: configManager.get('analytics.flushInterval', 30000),
      retentionDays: configManager.get('analytics.retentionDays', 30),
      enablePerformance: configManager.get('analytics.performance', true),
      enableErrors: configManager.get('analytics.errors', true),
      enableUserFlow: configManager.get('analytics.userFlow', true),
      anonymizeData: configManager.get('analytics.anonymize', true)
    };
    
    this.logger = logger.group ? logger.group('Analytics') : logger;
    
    // Current session data
    this.currentSession = null;
    this.sessionStartTime = Date.now();
    this.batchQueue = [];
    this.flushTimer = null;
    
    // Performance metrics
    this.performanceMetrics = {
      pageLoadTime: 0,
      renderTime: 0,
      interactionLatency: [],
      memoryUsage: [],
      errorCount: 0,
      crashCount: 0
    };
    
    // Event categories
    this.eventCategories = {
      INTERACTION: 'interaction',
      NAVIGATION: 'navigation',
      PERFORMANCE: 'performance',
      ERROR: 'error',
      CUSTOM: 'custom',
      SYSTEM: 'system'
    };
    
    this._setupEventListeners();
    this._initializeCollectors();
    this._initializeProcessors();
  }

  /**
   * Initialize the analytics engine
   */
  initialize() {
    try {
      this.logger.info('Initializing analytics engine');
      
      if (!this.config.enabled) {
        this.logger.info('Analytics disabled by configuration');
        return;
      }
      
      // Start new session
      this._startSession();
      
      // Setup automatic data collection
      this._setupAutoCollection();
      
      // Setup periodic flushing
      this._setupPeriodicFlush();
      
      // Setup performance monitoring
      if (this.config.enablePerformance) {
        this._setupPerformanceMonitoring();
      }
      
      // Setup error tracking
      if (this.config.enableErrors) {
        this._setupErrorTracking();
      }
      
      // Load saved data
      this._loadSavedData();
      
      this.logger.info('Analytics engine initialized successfully');
      
      eventBus.emit('analytics:initialized', {
        sessionId: this.currentSession?.id,
        collectorsCount: this.collectors.size,
        processorsCount: this.processors.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize analytics engine', { error: error.message });
      errorHandler.handleError(error, 'AnalyticsEngine.initialize');
    }
  }

  /**
   * Track an event
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {Object} data - Event data
   * @param {Object} options - Tracking options
   */
  track(category, action, data = {}, options = {}) {
    try {
      if (!this.config.enabled) return;
      
      const event = {
        id: this._generateEventId(),
        timestamp: Date.now(),
        sessionId: this.currentSession?.id,
        category: category || this.eventCategories.CUSTOM,
        action,
        data: this._sanitizeData(data),
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          screen: {
            width: window.screen.width,
            height: window.screen.height
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timestamp: new Date().toISOString()
        },
        metadata: {
          processed: false,
          retry: 0,
          ...options
        }
      };
      
      // Add to events array
      this.events.push(event);
      
      // Add to batch queue
      this.batchQueue.push(event);
      
      // Process event through collectors
      this._processEvent(event);
      
      // Check if batch should be flushed
      if (this.batchQueue.length >= this.config.batchSize) {
        this._flushBatch();
      }
      
      this.logger.debug('Event tracked', { 
        category, 
        action, 
        eventId: event.id 
      });
      
      eventBus.emit('analytics:event:tracked', { event });
      
    } catch (error) {
      this.logger.error('Failed to track event', { 
        error: error.message, 
        category, 
        action 
      });
    }
  }

  /**
   * Track page view
   * @param {string} page - Page identifier
   * @param {Object} data - Additional data
   */
  trackPageView(page, data = {}) {
    this.track(this.eventCategories.NAVIGATION, 'page_view', {
      page,
      referrer: document.referrer,
      loadTime: performance.now(),
      ...data
    });
  }

  /**
   * Track user interaction
   * @param {string} element - Element identifier
   * @param {string} action - Interaction type
   * @param {Object} data - Additional data
   */
  trackInteraction(element, action, data = {}) {
    const startTime = performance.now();
    
    this.track(this.eventCategories.INTERACTION, action, {
      element,
      timestamp: startTime,
      ...data
    });
    
    // Track interaction latency
    requestAnimationFrame(() => {
      const latency = performance.now() - startTime;
      this.performanceMetrics.interactionLatency.push(latency);
      
      // Keep only recent measurements
      if (this.performanceMetrics.interactionLatency.length > 100) {
        this.performanceMetrics.interactionLatency.shift();
      }
    });
  }

  /**
   * Track performance metric
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {Object} data - Additional data
   */
  trackPerformance(metric, value, data = {}) {
    this.track(this.eventCategories.PERFORMANCE, 'metric', {
      metric,
      value,
      timestamp: performance.now(),
      ...data
    });
    
    // Update performance metrics
    if (this.performanceMetrics.hasOwnProperty(metric)) {
      if (Array.isArray(this.performanceMetrics[metric])) {
        this.performanceMetrics[metric].push(value);
      } else {
        this.performanceMetrics[metric] = value;
      }
    }
  }

  /**
   * Track error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  trackError(error, context = {}) {
    this.track(this.eventCategories.ERROR, 'error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: Date.now()
    });
    
    this.performanceMetrics.errorCount++;
  }

  /**
   * Set user properties
   * @param {Object} properties - User properties
   */
  setUserProperties(properties) {
    if (!this.currentSession) return;
    
    this.currentSession.user = {
      ...this.currentSession.user,
      ...this._sanitizeData(properties)
    };
    
    this.track(this.eventCategories.SYSTEM, 'user_properties_updated', {
      properties: Object.keys(properties)
    });
  }

  /**
   * Generate analytics report
   * @param {Object} options - Report options
   * @returns {Object} Generated report
   */
  generateReport(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        categories = null,
        groupBy = 'day',
        metrics = ['events', 'users', 'sessions']
      } = options;
      
      const reportId = this._generateReportId();
      const events = this._filterEventsByDateRange(startDate, endDate, categories);
      
      const report = {
        id: reportId,
        title: options.title || 'Analytics Report',
        dateRange: { startDate, endDate },
        generatedAt: new Date(),
        summary: this._generateSummary(events),
        timeline: this._generateTimeline(events, groupBy),
        topEvents: this._getTopEvents(events),
        topPages: this._getTopPages(events),
        userFlow: this._generateUserFlow(events),
        performance: this._getPerformanceReport(),
        errors: this._getErrorReport(events),
        metadata: {
          totalEvents: events.length,
          uniqueSessions: new Set(events.map(e => e.sessionId)).size,
          categories: [...new Set(events.map(e => e.category))],
          actions: [...new Set(events.map(e => e.action))]
        }
      };
      
      // Store report
      this.reports.set(reportId, report);
      
      this.logger.debug('Report generated', { 
        reportId, 
        eventsCount: events.length 
      });
      
      eventBus.emit('analytics:report:generated', { report });
      
      return report;
      
    } catch (error) {
      this.logger.error('Failed to generate report', { error: error.message });
      return null;
    }
  }

  /**
   * Get real-time metrics
   * @returns {Object} Real-time metrics
   */
  getRealTimeMetrics() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp > last24Hours);
    
    return {
      totalEvents: this.events.length,
      eventsLast24h: recentEvents.length,
      currentSession: this.currentSession,
      activeSessions: this.sessions.size,
      performance: {
        ...this.performanceMetrics,
        averageInteractionLatency: this._calculateAverage(this.performanceMetrics.interactionLatency),
        memoryUsage: this._getCurrentMemoryUsage()
      },
      topCategories: this._getTopCategories(recentEvents),
      topActions: this._getTopActions(recentEvents),
      errorRate: this._calculateErrorRate(recentEvents)
    };
  }

  /**
   * Export analytics data
   * @param {Object} options - Export options
   * @returns {Object} Export data
   */
  exportData(options = {}) {
    try {
      const {
        format = 'json',
        startDate = null,
        endDate = null,
        categories = null,
        includeRawEvents = false
      } = options;
      
      let events = this.events;
      
      // Apply filters
      if (startDate || endDate) {
        events = this._filterEventsByDateRange(
          startDate || new Date(0),
          endDate || new Date(),
          categories
        );
      } else if (categories) {
        events = events.filter(e => categories.includes(e.category));
      }
      
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalEvents: events.length,
          dateRange: { startDate, endDate },
          categories: [...new Set(events.map(e => e.category))],
          version: '1.0.0'
        },
        summary: this._generateSummary(events),
        metrics: this.getRealTimeMetrics(),
        rawEvents: includeRawEvents ? events : []
      };
      
      if (format === 'csv') {
        return this._convertToCSV(exportData);
      }
      
      return exportData;
      
    } catch (error) {
      this.logger.error('Failed to export data', { error: error.message });
      return null;
    }
  }

  /**
   * Clear analytics data
   * @param {Object} options - Clear options
   */
  clearData(options = {}) {
    try {
      const { olderThan = null, categories = null } = options;
      
      if (olderThan) {
        const cutoffDate = new Date(Date.now() - olderThan);
        this.events = this.events.filter(e => e.timestamp > cutoffDate.getTime());
      } else if (categories) {
        this.events = this.events.filter(e => !categories.includes(e.category));
      } else {
        // Clear all data
        this.events = [];
        this.sessions.clear();
        this.reports.clear();
      }
      
      // Save updated data
      this._saveData();
      
      this.logger.info('Analytics data cleared', options);
      
      eventBus.emit('analytics:data:cleared', options);
      
    } catch (error) {
      this.logger.error('Failed to clear data', { error: error.message });
    }
  }

  /**
   * Register custom collector
   * @param {string} name - Collector name
   * @param {Function} collector - Collector function
   */
  registerCollector(name, collector) {
    try {
      this.collectors.set(name, collector);
      
      this.logger.debug('Collector registered', { name });
      
      eventBus.emit('analytics:collector:registered', { name });
      
    } catch (error) {
      this.logger.error('Failed to register collector', { error: error.message, name });
    }
  }

  /**
   * Register custom processor
   * @param {string} name - Processor name
   * @param {Function} processor - Processor function
   */
  registerProcessor(name, processor) {
    try {
      this.processors.set(name, processor);
      
      this.logger.debug('Processor registered', { name });
      
      eventBus.emit('analytics:processor:registered', { name });
      
    } catch (error) {
      this.logger.error('Failed to register processor', { error: error.message, name });
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
      if (event.key.startsWith('analytics.')) {
        this._updateConfig();
      }
    });
    
    // Track application events
    eventBus.on('app:*', (eventName, data) => {
      this.track(this.eventCategories.SYSTEM, eventName.replace('app:', ''), data);
    });
    
    // Track UI events
    eventBus.on('ui:*', (eventName, data) => {
      this.track(this.eventCategories.INTERACTION, eventName.replace('ui:', ''), data);
    });
    
    // Track chart events
    eventBus.on('charts:*', (eventName, data) => {
      this.track(this.eventCategories.INTERACTION, eventName.replace('charts:', ''), data);
    });
    
    // Track dashboard events
    eventBus.on('dashboard:*', (eventName, data) => {
      this.track(this.eventCategories.INTERACTION, eventName.replace('dashboard:', ''), data);
    });
    
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track(this.eventCategories.NAVIGATION, 'page_hidden');
      } else {
        this.track(this.eventCategories.NAVIGATION, 'page_visible');
      }
    });
    
    // Before page unload
    window.addEventListener('beforeunload', () => {
      this._endSession();
      this._flushBatch();
    });
  }

  /**
   * Initialize collectors
   * @private
   */
  _initializeCollectors() {
    // Click collector
    this.registerCollector('clicks', (event) => {
      if (event.category === this.eventCategories.INTERACTION && event.action === 'click') {
        return {
          coordinates: event.data.coordinates,
          element: event.data.element,
          ctrlKey: event.data.ctrlKey,
          shiftKey: event.data.shiftKey
        };
      }
      return null;
    });
    
    // Navigation collector
    this.registerCollector('navigation', (event) => {
      if (event.category === this.eventCategories.NAVIGATION) {
        return {
          from: event.data.from,
          to: event.data.to,
          method: event.data.method
        };
      }
      return null;
    });
    
    // Performance collector
    this.registerCollector('performance', (event) => {
      if (event.category === this.eventCategories.PERFORMANCE) {
        return {
          metric: event.data.metric,
          value: event.data.value,
          context: event.data.context
        };
      }
      return null;
    });
  }

  /**
   * Initialize processors
   * @private
   */
  _initializeProcessors() {
    // Aggregation processor
    this.registerProcessor('aggregation', (events) => {
      const aggregated = {};
      
      for (const event of events) {
        const key = `${event.category}:${event.action}`;
        if (!aggregated[key]) {
          aggregated[key] = { count: 0, totalValue: 0 };
        }
        aggregated[key].count++;
        
        if (event.data.value) {
          aggregated[key].totalValue += event.data.value;
        }
      }
      
      return aggregated;
    });
    
    // Funnel processor
    this.registerProcessor('funnel', (events) => {
      const funnelSteps = {};
      const sessions = {};
      
      for (const event of events) {
        if (!sessions[event.sessionId]) {
          sessions[event.sessionId] = [];
        }
        sessions[event.sessionId].push(event);
      }
      
      // Analyze funnel for each session
      for (const sessionEvents of Object.values(sessions)) {
        const sortedEvents = sessionEvents.sort((a, b) => a.timestamp - b.timestamp);
        // Funnel analysis logic would go here
      }
      
      return funnelSteps;
    });
  }

  /**
   * Start new session
   * @private
   */
  _startSession() {
    const sessionId = this._generateSessionId();
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      endTime: null,
      user: {
        id: this._generateUserId(),
        properties: {}
      },
      device: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: {
          width: window.screen.width,
          height: window.screen.height
        }
      },
      events: [],
      metadata: {
        active: true
      }
    };
    
    this.sessions.set(sessionId, this.currentSession);
    
    this.track(this.eventCategories.SYSTEM, 'session_start', {
      sessionId,
      userAgent: navigator.userAgent
    });
  }

  /**
   * End current session
   * @private
   */
  _endSession() {
    if (!this.currentSession) return;
    
    this.currentSession.endTime = Date.now();
    this.currentSession.metadata.active = false;
    
    const duration = this.currentSession.endTime - this.currentSession.startTime;
    
    this.track(this.eventCategories.SYSTEM, 'session_end', {
      sessionId: this.currentSession.id,
      duration
    });
    
    this.logger.debug('Session ended', { 
      sessionId: this.currentSession.id, 
      duration 
    });
  }

  /**
   * Setup automatic data collection
   * @private
   */
  _setupAutoCollection() {
    // Auto-track clicks
    document.addEventListener('click', (event) => {
      const element = this._getElementIdentifier(event.target);
      this.trackInteraction(element, 'click', {
        coordinates: { x: event.clientX, y: event.clientY },
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        element: event.target.tagName.toLowerCase()
      });
    });
    
    // Auto-track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      const formId = form.id || form.name || 'anonymous';
      
      this.track(this.eventCategories.INTERACTION, 'form_submit', {
        formId,
        elements: form.elements.length,
        method: form.method,
        action: form.action
      });
    });
    
    // Auto-track scroll events (throttled)
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        
        this.track(this.eventCategories.INTERACTION, 'scroll', {
          scrollPercent,
          scrollY: window.scrollY
        });
        
        scrollTimeout = null;
      }, 1000);
    });
  }

  /**
   * Setup periodic flushing
   * @private
   */
  _setupPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this._flushBatch();
      }
      this._cleanupOldData();
    }, this.config.flushInterval);
  }

  /**
   * Setup performance monitoring
   * @private
   */
  _setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          this.trackPerformance('page_load_time', perfData.loadEventEnd - perfData.loadEventStart);
          this.trackPerformance('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
          this.trackPerformance('first_paint', perfData.responseEnd - perfData.requestStart);
        }
      }, 0);
    });
    
    // Monitor memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        this.performanceMetrics.memoryUsage.push({
          used: memInfo.usedJSHeapSize,
          total: memInfo.totalJSHeapSize,
          timestamp: Date.now()
        });
        
        // Keep only recent measurements
        if (this.performanceMetrics.memoryUsage.length > 100) {
          this.performanceMetrics.memoryUsage.shift();
        }
      }, 60000); // Every minute
    }
    
    // Monitor frame rate (if available)
    if ('requestIdleCallback' in window) {
      const monitorFPS = () => {
        const start = performance.now();
        requestAnimationFrame(() => {
          const end = performance.now();
          const frameTime = end - start;
          
          if (frameTime > 16.67) { // More than 60fps threshold
            this.trackPerformance('slow_frame', frameTime);
          }
          
          monitorFPS();
        });
      };
      monitorFPS();
    }
  }

  /**
   * Setup error tracking
   * @private
   */
  _setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript'
      });
    });
    
    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  /**
   * Process event through collectors
   * @private
   */
  _processEvent(event) {
    for (const [name, collector] of this.collectors) {
      try {
        const result = collector(event);
        if (result) {
          event.collected = event.collected || {};
          event.collected[name] = result;
        }
      } catch (error) {
        this.logger.warn('Collector failed', { collector: name, error: error.message });
      }
    }
    
    // Add to current session
    if (this.currentSession) {
      this.currentSession.events.push(event);
    }
  }

  /**
   * Flush batch of events
   * @private
   */
  _flushBatch() {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    // Process batch through processors
    for (const [name, processor] of this.processors) {
      try {
        const result = processor(batch);
        if (result) {
          this.metrics.set(`processed_${name}`, {
            result,
            timestamp: Date.now(),
            batchSize: batch.length
          });
        }
      } catch (error) {
        this.logger.warn('Processor failed', { processor: name, error: error.message });
      }
    }
    
    // Save data
    this._saveData();
    
    this.logger.debug('Batch flushed', { size: batch.length });
    
    eventBus.emit('analytics:batch:flushed', { batch, size: batch.length });
  }

  /**
   * Filter events by date range
   * @private
   */
  _filterEventsByDateRange(startDate, endDate, categories = null) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.events.filter(event => {
      const inDateRange = event.timestamp >= start && event.timestamp <= end;
      const inCategories = !categories || categories.includes(event.category);
      return inDateRange && inCategories;
    });
  }

  /**
   * Generate summary statistics
   * @private
   */
  _generateSummary(events) {
    const sessions = new Set(events.map(e => e.sessionId));
    const categories = {};
    const actions = {};
    
    for (const event of events) {
      categories[event.category] = (categories[event.category] || 0) + 1;
      actions[event.action] = (actions[event.action] || 0) + 1;
    }
    
    return {
      totalEvents: events.length,
      uniqueSessions: sessions.size,
      categoriesBreakdown: categories,
      actionsBreakdown: actions,
      timeRange: {
        start: Math.min(...events.map(e => e.timestamp)),
        end: Math.max(...events.map(e => e.timestamp))
      }
    };
  }

  /**
   * Generate timeline data
   * @private
   */
  _generateTimeline(events, groupBy) {
    const timeline = {};
    const groupingFactor = this._getGroupingFactor(groupBy);
    
    for (const event of events) {
      const bucket = Math.floor(event.timestamp / groupingFactor) * groupingFactor;
      const key = new Date(bucket).toISOString().split('T')[0];
      
      if (!timeline[key]) {
        timeline[key] = { events: 0, categories: {} };
      }
      
      timeline[key].events++;
      timeline[key].categories[event.category] = 
        (timeline[key].categories[event.category] || 0) + 1;
    }
    
    return Object.entries(timeline).map(([date, data]) => ({
      date,
      ...data
    }));
  }

  /**
   * Get top events
   * @private
   */
  _getTopEvents(events, limit = 10) {
    const eventCounts = {};
    
    for (const event of events) {
      const key = `${event.category}:${event.action}`;
      eventCounts[key] = (eventCounts[key] || 0) + 1;
    }
    
    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key, count]) => {
        const [category, action] = key.split(':');
        return { category, action, count };
      });
  }

  /**
   * Sanitize data for privacy
   * @private
   */
  _sanitizeData(data) {
    if (!this.config.anonymizeData) return data;
    
    const sanitized = { ...data };
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['email', 'name', 'phone', 'address', 'ssn'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = this._hashString(sanitized[field]);
      }
    }
    
    // Remove IP address
    delete sanitized.ip;
    delete sanitized.ipAddress;
    
    return sanitized;
  }

  /**
   * Generate unique event ID
   * @private
   */
  _generateEventId() {
    return 'event_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Generate unique session ID
   * @private
   */
  _generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Generate unique user ID
   * @private
   */
  _generateUserId() {
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('analytics_user_id', userId);
    }
    return userId;
  }

  /**
   * Generate unique report ID
   * @private
   */
  _generateReportId() {
    return 'report_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Get element identifier
   * @private
   */
  _getElementIdentifier(element) {
    if (element.id) return '#' + element.id;
    if (element.className) return '.' + element.className.split(' ')[0];
    return element.tagName.toLowerCase();
  }

  /**
   * Calculate average of array
   * @private
   */
  _calculateAverage(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Get grouping factor for timeline
   * @private
   */
  _getGroupingFactor(groupBy) {
    switch (groupBy) {
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // day
    }
  }

  /**
   * Hash string for anonymization
   * @private
   */
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Load saved data
   * @private
   */
  _loadSavedData() {
    try {
      const savedEvents = localStorage.getItem('analytics_events');
      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
      }
      
      const savedMetrics = localStorage.getItem('analytics_metrics');
      if (savedMetrics) {
        const metrics = JSON.parse(savedMetrics);
        for (const [key, value] of Object.entries(metrics)) {
          this.metrics.set(key, value);
        }
      }
      
      this.logger.debug('Saved data loaded', { 
        eventsCount: this.events.length,
        metricsCount: this.metrics.size
      });
      
    } catch (error) {
      this.logger.error('Failed to load saved data', { error: error.message });
    }
  }

  /**
   * Save data to localStorage
   * @private
   */
  _saveData() {
    try {
      // Save events (limit to recent events to avoid storage issues)
      const recentEvents = this.events.slice(-1000);
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
      
      // Save metrics
      const metricsData = Object.fromEntries(this.metrics);
      localStorage.setItem('analytics_metrics', JSON.stringify(metricsData));
      
    } catch (error) {
      this.logger.error('Failed to save data', { error: error.message });
    }
  }

  /**
   * Cleanup old data
   * @private
   */
  _cleanupOldData() {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    const initialCount = this.events.length;
    
    this.events = this.events.filter(event => event.timestamp > cutoffTime);
    
    const removedCount = initialCount - this.events.length;
    if (removedCount > 0) {
      this.logger.debug('Old data cleaned up', { removedCount });
    }
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.enabled = configManager.get('analytics.enabled', true);
    this.config.batchSize = configManager.get('analytics.batchSize', 100);
    this.config.flushInterval = configManager.get('analytics.flushInterval', 30000);
    this.config.retentionDays = configManager.get('analytics.retentionDays', 30);
    this.config.enablePerformance = configManager.get('analytics.performance', true);
    this.config.enableErrors = configManager.get('analytics.errors', true);
    this.config.enableUserFlow = configManager.get('analytics.userFlow', true);
    this.config.anonymizeData = configManager.get('analytics.anonymize', true);
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const analyticsEngine = new AnalyticsEngine();

// Auto-initialize
setTimeout(() => {
  analyticsEngine.initialize();
}, 100);

export default analyticsEngine;