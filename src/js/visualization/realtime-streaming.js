/**
 * Real-time Data Streaming System
 * 
 * Advanced real-time data updates system with WebSocket support,
 * live chart updates, performance optimization, and data synchronization.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';
import { chartEngine } from './chart-engine.js';
import { dashboardSystem } from './dashboard-system.js';
import { analyticsEngine } from './analytics-engine.js';

export class RealtimeStreaming {
  constructor() {
    this.connections = new Map();
    this.subscriptions = new Map();
    this.channels = new Map();
    this.dataBuffers = new Map();
    this.updateQueues = new Map();
    this.processors = new Map();
    this.filters = new Map();
    
    this.config = {
      enabled: configManager.get('streaming.enabled', true),
      wsUrl: configManager.get('streaming.wsUrl', 'ws://localhost:8080'),
      reconnectInterval: configManager.get('streaming.reconnectInterval', 5000),
      maxReconnectAttempts: configManager.get('streaming.maxReconnectAttempts', 10),
      bufferSize: configManager.get('streaming.bufferSize', 1000),
      updateInterval: configManager.get('streaming.updateInterval', 100),
      batchSize: configManager.get('streaming.batchSize', 50),
      enableCompression: configManager.get('streaming.compression', false),
      heartbeatInterval: configManager.get('streaming.heartbeatInterval', 30000)
    };
    
    this.logger = logger.group ? logger.group('Streaming') : logger;
    
    // Connection states
    this.connectionStates = {
      DISCONNECTED: 'disconnected',
      CONNECTING: 'connecting',
      CONNECTED: 'connected',
      RECONNECTING: 'reconnecting',
      ERROR: 'error'
    };
    
    // Data types
    this.dataTypes = {
      CHART_UPDATE: 'chart_update',
      WIDGET_DATA: 'widget_data',
      ANALYTICS: 'analytics',
      METRICS: 'metrics',
      EVENTS: 'events',
      ALERTS: 'alerts'
    };
    
    // Current state
    this.state = {
      isConnected: false,
      connectionAttempts: 0,
      lastHeartbeat: null,
      totalMessagesReceived: 0,
      totalDataPoints: 0,
      averageLatency: 0
    };
    
    // Performance monitoring
    this.performance = {
      messageRates: [],
      latencyHistory: [],
      errorCounts: {},
      throughputHistory: []
    };
    
    this._setupEventListeners();
    this._initializeProcessors();
  }

  /**
   * Initialize the real-time streaming system
   */
  initialize() {
    try {
      this.logger.info('Initializing real-time streaming system');
      
      if (!this.config.enabled) {
        this.logger.info('Real-time streaming disabled by configuration');
        return;
      }
      
      // Setup update processing
      this._setupUpdateProcessing();
      
      // Setup heartbeat monitoring
      this._setupHeartbeat();
      
      // Setup performance monitoring
      this._setupPerformanceMonitoring();
      
      // Auto-connect if URL is configured
      if (this.config.wsUrl) {
        this.connect(this.config.wsUrl);
      }
      
      this.logger.info('Real-time streaming system initialized successfully');
      
      eventBus.emit('streaming:initialized', {
        enabled: this.config.enabled,
        wsUrl: this.config.wsUrl,
        processorsCount: this.processors.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize real-time streaming system', { error: error.message });
      errorHandler.handleError(error, 'RealtimeStreaming.initialize');
    }
  }

  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket URL
   * @returns {Promise<boolean>} Connection success
   */
  async connect(url = null) {
    try {
      const wsUrl = url || this.config.wsUrl;
      
      if (!wsUrl) {
        throw new Error('WebSocket URL not configured');
      }
      
      // Close existing connection
      if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
        this.disconnect();
      }
      
      this.logger.info('Connecting to WebSocket server', { url: wsUrl });
      
      this.state.connectionAttempts++;
      this._setState('connecting');
      
      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl);
      
      // Setup event handlers
      this._setupWebSocketHandlers();
      
      // Wait for connection or timeout
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        this.ws.addEventListener('open', () => {
          clearTimeout(timeout);
          resolve(true);
        });
        
        this.ws.addEventListener('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
    } catch (error) {
      this.logger.error('Failed to connect to WebSocket server', { error: error.message });
      this._setState('error');
      return false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    try {
      if (this.ws) {
        this.logger.info('Disconnecting from WebSocket server');
        
        this.ws.close(1000, 'Manual disconnect');
        this.ws = null;
      }
      
      // Clear reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Clear heartbeat timer
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      
      this._setState('disconnected');
      
    } catch (error) {
      this.logger.error('Failed to disconnect', { error: error.message });
    }
  }

  /**
   * Subscribe to data channel
   * @param {string} channel - Channel name
   * @param {Function} callback - Data callback
   * @param {Object} options - Subscription options
   * @returns {string} Subscription ID
   */
  subscribe(channel, callback, options = {}) {
    try {
      const subscriptionId = this._generateSubscriptionId();
      
      const subscription = {
        id: subscriptionId,
        channel,
        callback,
        options: {
          filter: options.filter || null,
          transform: options.transform || null,
          throttle: options.throttle || 0,
          buffer: options.buffer || false,
          ...options
        },
        state: {
          active: true,
          messageCount: 0,
          lastUpdate: null,
          errors: 0
        }
      };
      
      // Store subscription
      this.subscriptions.set(subscriptionId, subscription);
      
      // Add to channel
      if (!this.channels.has(channel)) {
        this.channels.set(channel, new Set());
      }
      this.channels.get(channel).add(subscriptionId);
      
      // Send subscription message if connected
      if (this.state.isConnected) {
        this._sendMessage({
          type: 'subscribe',
          channel,
          subscriptionId,
          options: subscription.options
        });
      }
      
      this.logger.debug('Subscribed to channel', { channel, subscriptionId });
      
      eventBus.emit('streaming:subscribed', { channel, subscriptionId });
      
      return subscriptionId;
      
    } catch (error) {
      this.logger.error('Failed to subscribe to channel', { error: error.message, channel });
      return null;
    }
  }

  /**
   * Unsubscribe from channel
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean} Unsubscribe success
   */
  unsubscribe(subscriptionId) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription '${subscriptionId}' not found`);
      }
      
      // Remove from channel
      const channelSubs = this.channels.get(subscription.channel);
      if (channelSubs) {
        channelSubs.delete(subscriptionId);
        
        // Remove channel if no more subscriptions
        if (channelSubs.size === 0) {
          this.channels.delete(subscription.channel);
        }
      }
      
      // Remove subscription
      this.subscriptions.delete(subscriptionId);
      
      // Send unsubscribe message if connected
      if (this.state.isConnected) {
        this._sendMessage({
          type: 'unsubscribe',
          subscriptionId
        });
      }
      
      this.logger.debug('Unsubscribed from channel', { 
        channel: subscription.channel, 
        subscriptionId 
      });
      
      eventBus.emit('streaming:unsubscribed', { 
        channel: subscription.channel, 
        subscriptionId 
      });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to unsubscribe', { error: error.message, subscriptionId });
      return false;
    }
  }

  /**
   * Subscribe to chart updates
   * @param {Object} chart - Chart instance
   * @param {string} dataSource - Data source identifier
   * @param {Object} options - Subscription options
   * @returns {string} Subscription ID
   */
  subscribeToChart(chart, dataSource, options = {}) {
    return this.subscribe(`chart:${dataSource}`, (data) => {
      this._updateChart(chart, data, options);
    }, {
      ...options,
      type: this.dataTypes.CHART_UPDATE
    });
  }

  /**
   * Subscribe to dashboard widget updates
   * @param {Object} widget - Widget instance
   * @param {string} dataSource - Data source identifier
   * @param {Object} options - Subscription options
   * @returns {string} Subscription ID
   */
  subscribeToWidget(widget, dataSource, options = {}) {
    return this.subscribe(`widget:${dataSource}`, (data) => {
      this._updateWidget(widget, data, options);
    }, {
      ...options,
      type: this.dataTypes.WIDGET_DATA
    });
  }

  /**
   * Subscribe to analytics data
   * @param {Function} callback - Data callback
   * @param {Object} options - Subscription options
   * @returns {string} Subscription ID
   */
  subscribeToAnalytics(callback, options = {}) {
    return this.subscribe('analytics', (data) => {
      // Process analytics data
      if (data.events) {
        for (const event of data.events) {
          analyticsEngine.track(event.category, event.action, event.data);
        }
      }
      
      callback(data);
    }, {
      ...options,
      type: this.dataTypes.ANALYTICS
    });
  }

  /**
   * Send data to server
   * @param {string} channel - Channel name
   * @param {*} data - Data to send
   * @returns {boolean} Send success
   */
  send(channel, data) {
    try {
      if (!this.state.isConnected) {
        throw new Error('Not connected to WebSocket server');
      }
      
      this._sendMessage({
        type: 'data',
        channel,
        data,
        timestamp: Date.now()
      });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to send data', { error: error.message, channel });
      return false;
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status
   */
  getStatus() {
    return {
      ...this.state,
      subscriptionsCount: this.subscriptions.size,
      channelsCount: this.channels.size,
      performance: this._getPerformanceMetrics(),
      config: this.config
    };
  }

  /**
   * Get subscription details
   * @param {string} subscriptionId - Subscription ID (optional)
   * @returns {Object|Array} Subscription details
   */
  getSubscriptions(subscriptionId = null) {
    if (subscriptionId) {
      return this.subscriptions.get(subscriptionId) || null;
    }
    
    return Array.from(this.subscriptions.values());
  }

  /**
   * Register data processor
   * @param {string} type - Data type
   * @param {Function} processor - Processor function
   */
  registerProcessor(type, processor) {
    try {
      this.processors.set(type, processor);
      
      this.logger.debug('Processor registered', { type });
      
      eventBus.emit('streaming:processor:registered', { type });
      
    } catch (error) {
      this.logger.error('Failed to register processor', { error: error.message, type });
    }
  }

  /**
   * Clear all data buffers
   */
  clearBuffers() {
    this.dataBuffers.clear();
    this.updateQueues.clear();
    
    this.logger.debug('Data buffers cleared');
    
    eventBus.emit('streaming:buffers:cleared');
  }

  // Private Methods

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Configuration changes
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('streaming.')) {
        this._updateConfig();
      }
    });
    
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._pauseUpdates();
      } else {
        this._resumeUpdates();
      }
    });
    
    // Window focus/blur
    window.addEventListener('focus', () => {
      this._resumeUpdates();
    });
    
    window.addEventListener('blur', () => {
      this._pauseUpdates();
    });
    
    // Before page unload
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  /**
   * Initialize data processors
   * @private
   */
  _initializeProcessors() {
    // Chart data processor
    this.registerProcessor(this.dataTypes.CHART_UPDATE, (data, subscription) => {
      return {
        ...data,
        timestamp: Date.now(),
        processed: true
      };
    });
    
    // Widget data processor
    this.registerProcessor(this.dataTypes.WIDGET_DATA, (data, subscription) => {
      return {
        ...data,
        timestamp: Date.now(),
        processed: true
      };
    });
    
    // Analytics processor
    this.registerProcessor(this.dataTypes.ANALYTICS, (data, subscription) => {
      return {
        ...data,
        sessionId: analyticsEngine.currentSession?.id,
        processed: true
      };
    });
    
    // Metrics processor
    this.registerProcessor(this.dataTypes.METRICS, (data, subscription) => {
      // Calculate derived metrics
      const processedData = {
        ...data,
        timestamp: Date.now()
      };
      
      // Add moving averages if data is numeric
      if (Array.isArray(data.values) && data.values.length > 0) {
        processedData.average = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
        processedData.trend = this._calculateTrend(data.values);
      }
      
      return processedData;
    });
  }

  /**
   * Setup WebSocket event handlers
   * @private
   */
  _setupWebSocketHandlers() {
    this.ws.addEventListener('open', () => {
      this.logger.info('WebSocket connection established');
      
      this.state.connectionAttempts = 0;
      this._setState('connected');
      
      // Resubscribe to all channels
      this._resubscribeAll();
      
      // Start heartbeat
      this._startHeartbeat();
      
      eventBus.emit('streaming:connected');
    });
    
    this.ws.addEventListener('message', (event) => {
      this._handleMessage(event);
    });
    
    this.ws.addEventListener('close', (event) => {
      this.logger.info('WebSocket connection closed', { 
        code: event.code, 
        reason: event.reason 
      });
      
      this._setState('disconnected');
      
      // Stop heartbeat
      this._stopHeartbeat();
      
      // Attempt reconnection if not manual
      if (event.code !== 1000 && this.config.enabled) {
        this._scheduleReconnect();
      }
      
      eventBus.emit('streaming:disconnected', { 
        code: event.code, 
        reason: event.reason 
      });
    });
    
    this.ws.addEventListener('error', (error) => {
      this.logger.error('WebSocket error', { error: error.message });
      
      this._setState('error');
      
      eventBus.emit('streaming:error', { error });
    });
  }

  /**
   * Handle incoming WebSocket message
   * @private
   */
  _handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      this.state.totalMessagesReceived++;
      
      // Update performance metrics
      this._updatePerformanceMetrics(message);
      
      // Process message based on type
      switch (message.type) {
        case 'data':
          this._processDataMessage(message);
          break;
        case 'heartbeat':
          this._handleHeartbeat(message);
          break;
        case 'error':
          this._handleErrorMessage(message);
          break;
        case 'subscription_ack':
          this._handleSubscriptionAck(message);
          break;
        default:
          this.logger.warn('Unknown message type', { type: message.type });
      }
      
    } catch (error) {
      this.logger.error('Failed to handle message', { error: error.message });
      this.performance.errorCounts.messageHandling = 
        (this.performance.errorCounts.messageHandling || 0) + 1;
    }
  }

  /**
   * Process data message
   * @private
   */
  _processDataMessage(message) {
    const { channel, data, timestamp } = message;
    
    // Calculate latency
    if (timestamp) {
      const latency = Date.now() - timestamp;
      this.performance.latencyHistory.push(latency);
      
      // Keep only recent measurements
      if (this.performance.latencyHistory.length > 100) {
        this.performance.latencyHistory.shift();
      }
      
      // Update average latency
      this.state.averageLatency = this.performance.latencyHistory.reduce((sum, l) => sum + l, 0) / 
        this.performance.latencyHistory.length;
    }
    
    // Find subscriptions for this channel
    const channelSubs = this.channels.get(channel);
    if (!channelSubs) {
      return;
    }
    
    // Process data for each subscription
    for (const subscriptionId of channelSubs) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription || !subscription.state.active) {
        continue;
      }
      
      try {
        let processedData = data;
        
        // Apply processor if available
        const processor = this.processors.get(subscription.options.type);
        if (processor) {
          processedData = processor(data, subscription);
        }
        
        // Apply filter if specified
        if (subscription.options.filter) {
          if (!this._applyFilter(processedData, subscription.options.filter)) {
            continue;
          }
        }
        
        // Apply transformation if specified
        if (subscription.options.transform) {
          processedData = subscription.options.transform(processedData);
        }
        
        // Handle buffering
        if (subscription.options.buffer) {
          this._bufferData(subscriptionId, processedData);
        } else {
          // Handle throttling
          if (subscription.options.throttle > 0) {
            this._throttleCallback(subscription, processedData);
          } else {
            // Call callback immediately
            subscription.callback(processedData, subscription);
          }
        }
        
        // Update subscription state
        subscription.state.messageCount++;
        subscription.state.lastUpdate = Date.now();
        
      } catch (error) {
        this.logger.error('Failed to process subscription data', { 
          error: error.message, 
          subscriptionId,
          channel 
        });
        
        subscription.state.errors++;
      }
    }
    
    this.state.totalDataPoints++;
  }

  /**
   * Update chart with new data
   * @private
   */
  async _updateChart(chart, data, options) {
    try {
      if (!chart || chart.state?.destroyed) {
        return;
      }
      
      let newData = data;
      
      // Handle incremental updates
      if (options.incremental && chart.data) {
        newData = [...chart.data, ...data];
        
        // Limit data points if specified
        if (options.maxDataPoints && newData.length > options.maxDataPoints) {
          newData = newData.slice(-options.maxDataPoints);
        }
      }
      
      // Update chart
      await chartEngine.updateChart(chart, newData, { 
        immediate: options.immediate || false 
      });
      
    } catch (error) {
      this.logger.error('Failed to update chart', { error: error.message });
    }
  }

  /**
   * Update widget with new data
   * @private
   */
  async _updateWidget(widget, data, options) {
    try {
      if (!widget || widget.state?.destroyed) {
        return;
      }
      
      // Update widget data
      await dashboardSystem.updateWidgetData(widget.id, data);
      
    } catch (error) {
      this.logger.error('Failed to update widget', { error: error.message });
    }
  }

  /**
   * Setup update processing
   * @private
   */
  _setupUpdateProcessing() {
    // Process update queues periodically
    setInterval(() => {
      this._processUpdateQueues();
    }, this.config.updateInterval);
    
    // Process data buffers
    setInterval(() => {
      this._processDataBuffers();
    }, this.config.updateInterval * 2);
  }

  /**
   * Process update queues
   * @private
   */
  _processUpdateQueues() {
    for (const [subscriptionId, queue] of this.updateQueues.entries()) {
      if (queue.length === 0) continue;
      
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription || !subscription.state.active) {
        continue;
      }
      
      try {
        // Process batch of updates
        const batch = queue.splice(0, this.config.batchSize);
        
        for (const update of batch) {
          subscription.callback(update.data, subscription);
        }
        
      } catch (error) {
        this.logger.error('Failed to process update queue', { 
          error: error.message, 
          subscriptionId 
        });
      }
    }
  }

  /**
   * Process data buffers
   * @private
   */
  _processDataBuffers() {
    for (const [subscriptionId, buffer] of this.dataBuffers.entries()) {
      if (buffer.length === 0) continue;
      
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription || !subscription.state.active) {
        continue;
      }
      
      try {
        // Send buffered data
        const bufferedData = buffer.splice(0);
        subscription.callback(bufferedData, subscription);
        
      } catch (error) {
        this.logger.error('Failed to process data buffer', { 
          error: error.message, 
          subscriptionId 
        });
      }
    }
  }

  /**
   * Setup heartbeat monitoring
   * @private
   */
  _setupHeartbeat() {
    // Heartbeat will be started when connection is established
  }

  /**
   * Start heartbeat
   * @private
   */
  _startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.state.isConnected) {
        this._sendMessage({
          type: 'heartbeat',
          timestamp: Date.now()
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   * @private
   */
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Handle heartbeat response
   * @private
   */
  _handleHeartbeat(message) {
    this.state.lastHeartbeat = Date.now();
    
    // Calculate latency if timestamp is provided
    if (message.timestamp) {
      const latency = Date.now() - message.timestamp;
      this.performance.latencyHistory.push(latency);
      
      if (this.performance.latencyHistory.length > 100) {
        this.performance.latencyHistory.shift();
      }
    }
  }

  /**
   * Setup performance monitoring
   * @private
   */
  _setupPerformanceMonitoring() {
    // Monitor message rates
    setInterval(() => {
      const rate = this.state.totalMessagesReceived;
      this.performance.messageRates.push(rate);
      
      // Reset counter
      this.state.totalMessagesReceived = 0;
      
      // Keep only recent measurements
      if (this.performance.messageRates.length > 60) {
        this.performance.messageRates.shift();
      }
    }, 1000);
    
    // Monitor throughput
    setInterval(() => {
      const throughput = this.state.totalDataPoints;
      this.performance.throughputHistory.push(throughput);
      
      // Reset counter
      this.state.totalDataPoints = 0;
      
      // Keep only recent measurements
      if (this.performance.throughputHistory.length > 60) {
        this.performance.throughputHistory.shift();
      }
    }, 1000);
  }

  /**
   * Send message to WebSocket server
   * @private
   */
  _sendMessage(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Set connection state
   * @private
   */
  _setState(state) {
    const oldState = this.state.isConnected;
    
    this.state.isConnected = state === 'connected';
    
    if (oldState !== this.state.isConnected) {
      eventBus.emit('streaming:state:changed', { 
        state, 
        isConnected: this.state.isConnected 
      });
    }
  }

  /**
   * Schedule reconnection attempt
   * @private
   */
  _scheduleReconnect() {
    if (this.state.connectionAttempts >= this.config.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      eventBus.emit('streaming:reconnect:failed');
      return;
    }
    
    this.logger.info('Scheduling reconnection attempt', { 
      attempt: this.state.connectionAttempts + 1,
      delay: this.config.reconnectInterval
    });
    
    this.reconnectTimer = setTimeout(() => {
      this._setState('reconnecting');
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * Resubscribe to all channels after reconnection
   * @private
   */
  _resubscribeAll() {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.state.active) {
        this._sendMessage({
          type: 'subscribe',
          channel: subscription.channel,
          subscriptionId: subscription.id,
          options: subscription.options
        });
      }
    }
  }

  /**
   * Apply filter to data
   * @private
   */
  _applyFilter(data, filter) {
    try {
      if (typeof filter === 'function') {
        return filter(data);
      }
      
      // Simple property-based filtering
      for (const [key, value] of Object.entries(filter)) {
        if (data[key] !== value) {
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      this.logger.error('Filter application failed', { error: error.message });
      return true; // Default to accepting data
    }
  }

  /**
   * Buffer data for subscription
   * @private
   */
  _bufferData(subscriptionId, data) {
    if (!this.dataBuffers.has(subscriptionId)) {
      this.dataBuffers.set(subscriptionId, []);
    }
    
    const buffer = this.dataBuffers.get(subscriptionId);
    buffer.push(data);
    
    // Limit buffer size
    if (buffer.length > this.config.bufferSize) {
      buffer.shift();
    }
  }

  /**
   * Throttle callback execution
   * @private
   */
  _throttleCallback(subscription, data) {
    const now = Date.now();
    const lastCall = subscription.state.lastThrottleCall || 0;
    
    if (now - lastCall >= subscription.options.throttle) {
      subscription.callback(data, subscription);
      subscription.state.lastThrottleCall = now;
    } else {
      // Queue for later execution
      if (!this.updateQueues.has(subscription.id)) {
        this.updateQueues.set(subscription.id, []);
      }
      
      this.updateQueues.get(subscription.id).push({
        data,
        timestamp: now
      });
    }
  }

  /**
   * Calculate trend from values
   * @private
   */
  _calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const recent = values.slice(-10); // Last 10 values
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  /**
   * Update performance metrics
   * @private
   */
  _updatePerformanceMetrics(message) {
    // Update message rate
    this.performance.currentMessageRate = 
      (this.performance.currentMessageRate || 0) + 1;
    
    // Update error counts based on message type
    if (message.type === 'error') {
      this.performance.errorCounts[message.error] = 
        (this.performance.errorCounts[message.error] || 0) + 1;
    }
  }

  /**
   * Get performance metrics
   * @private
   */
  _getPerformanceMetrics() {
    const messageRates = this.performance.messageRates;
    const latencyHistory = this.performance.latencyHistory;
    const throughputHistory = this.performance.throughputHistory;
    
    return {
      averageMessageRate: messageRates.length > 0 ? 
        messageRates.reduce((sum, rate) => sum + rate, 0) / messageRates.length : 0,
      averageLatency: this.state.averageLatency,
      currentThroughput: throughputHistory[throughputHistory.length - 1] || 0,
      totalErrors: Object.values(this.performance.errorCounts).reduce((sum, count) => sum + count, 0),
      connectionUptime: this.state.isConnected ? Date.now() - (this.state.lastHeartbeat || Date.now()) : 0
    };
  }

  /**
   * Pause updates during page visibility changes
   * @private
   */
  _pauseUpdates() {
    this.updatesPaused = true;
    this.logger.debug('Updates paused');
  }

  /**
   * Resume updates
   * @private
   */
  _resumeUpdates() {
    this.updatesPaused = false;
    this.logger.debug('Updates resumed');
  }

  /**
   * Generate unique subscription ID
   * @private
   */
  _generateSubscriptionId() {
    return 'sub_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Handle error message
   * @private
   */
  _handleErrorMessage(message) {
    this.logger.error('Server error', { 
      error: message.error, 
      details: message.details 
    });
    
    eventBus.emit('streaming:server:error', { 
      error: message.error, 
      details: message.details 
    });
  }

  /**
   * Handle subscription acknowledgment
   * @private
   */
  _handleSubscriptionAck(message) {
    const subscription = this.subscriptions.get(message.subscriptionId);
    if (subscription) {
      subscription.state.acknowledged = true;
      
      this.logger.debug('Subscription acknowledged', { 
        subscriptionId: message.subscriptionId,
        channel: subscription.channel 
      });
    }
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.enabled = configManager.get('streaming.enabled', true);
    this.config.wsUrl = configManager.get('streaming.wsUrl', 'ws://localhost:8080');
    this.config.reconnectInterval = configManager.get('streaming.reconnectInterval', 5000);
    this.config.maxReconnectAttempts = configManager.get('streaming.maxReconnectAttempts', 10);
    this.config.bufferSize = configManager.get('streaming.bufferSize', 1000);
    this.config.updateInterval = configManager.get('streaming.updateInterval', 100);
    this.config.batchSize = configManager.get('streaming.batchSize', 50);
    this.config.enableCompression = configManager.get('streaming.compression', false);
    this.config.heartbeatInterval = configManager.get('streaming.heartbeatInterval', 30000);
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const realtimeStreaming = new RealtimeStreaming();

// Auto-initialize
setTimeout(() => {
  realtimeStreaming.initialize();
}, 100);

export default realtimeStreaming;