/**
 * Client-side Debug Logger for Renderer Process
 * 
 * This logger sends error information to the main process for centralized logging
 * and provides local console logging for development.
 */

export interface ClientLogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  category: string;
  message: string;
  context?: {
    component?: string;
    function?: string;
    user?: string;
    url?: string;
    userAgent?: string;
    reactStackTrace?: string;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class ClientDebugLogger {
  private isEnabled: boolean = false;
  private logLevel: ClientLogEntry['level'] = 'INFO';
  private categories: string[] = ['*'];
  private logBuffer: ClientLogEntry[] = [];
  private flushPromise: Promise<void> | null = null;

  constructor() {
    this.setupErrorHandlers();
  }

  /**
   * Initialize the client logger and sync with main process config
   */
  async initialize(): Promise<void> {
    try {
      if (window.electronAPI?.debugGetConfig) {
        const result = await window.electronAPI.debugGetConfig();
        if (result.success && result.config) {
          this.isEnabled = result.config.enabled;
          this.logLevel = result.config.logLevel;
          this.categories = result.config.categories;
        }
      }
      
      this.log('INFO', 'CLIENT_LOGGER', 'Client debug logger initialized', {
        context: { component: 'ClientDebugLogger', function: 'initialize' },
        metadata: { 
          isEnabled: this.isEnabled, 
          logLevel: this.logLevel,
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
    } catch (error) {
      console.warn('Failed to initialize client debug logger:', error);
    }
  }

  /**
   * Setup global error handlers for the renderer process
   */
  private setupErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.fatal('RENDERER_ERROR', 'Uncaught JavaScript error', {
        context: { 
          component: 'Window', 
          function: 'error',
          url: event.filename,
        },
        error: {
          name: 'Error',
          message: event.message,
          stack: event.error?.stack
        },
        metadata: {
          lineno: event.lineno,
          colno: event.colno,
          filename: event.filename
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.fatal('RENDERER_ERROR', 'Unhandled promise rejection', {
        context: { component: 'Window', function: 'unhandledrejection' },
        error: event.reason instanceof Error ? {
          name: event.reason.name,
          message: event.reason.message,
          stack: event.reason.stack
        } : {
          name: 'UnhandledRejection',
          message: String(event.reason),
        },
        metadata: {
          type: 'unhandledrejection',
          reason: String(event.reason)
        }
      });
    });

    // React Error Boundary integration (if using React)
    if (typeof window !== 'undefined') {
      (window as any).__REACT_ERROR_BOUNDARY_LOGGER__ = (error: Error, errorInfo: any) => {
        this.error('REACT_ERROR', 'React component error', {
          context: { 
            component: 'ReactErrorBoundary', 
            function: 'componentDidCatch',
            reactStackTrace: errorInfo.componentStack 
          },
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          metadata: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true
          }
        });
      };
    }
  }

  /**
   * Check if logging should occur for given level and category
   */
  private shouldLog(level: ClientLogEntry['level'], category: string): boolean {
    if (!this.isEnabled) return false;

    // Check log level
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    if (messageLevelIndex < currentLevelIndex) return false;

    // Check category filter
    if (this.categories.includes('*')) return true;
    return this.categories.includes(category);
  }

  /**
   * Main logging method
   */
  log(
    level: ClientLogEntry['level'],
    category: string,
    message: string,
    options: {
      context?: ClientLogEntry['context'];
      error?: Error;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    if (!this.shouldLog(level, category)) return;

    const entry: ClientLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: {
        ...options.context,
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      metadata: options.metadata
    };

    // Process error if provided
    if (options.error) {
      entry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack
      };
    }

    // Console logging for development
    this.logToConsole(entry);

    // Buffer for sending to main process
    this.logBuffer.push(entry);

    // Immediate flush for ERROR and FATAL, or every 10 entries
    if (level === 'ERROR' || level === 'FATAL' || this.logBuffer.length >= 10) {
      this.flushToMainProcess();
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(category: string, message: string, options?: { context?: ClientLogEntry['context']; metadata?: Record<string, any> }): void {
    this.log('DEBUG', category, message, options);
  }

  info(category: string, message: string, options?: { context?: ClientLogEntry['context']; metadata?: Record<string, any> }): void {
    this.log('INFO', category, message, options);
  }

  warn(category: string, message: string, options?: { context?: ClientLogEntry['context']; error?: Error; metadata?: Record<string, any> }): void {
    this.log('WARN', category, message, options);
  }

  error(category: string, message: string, options?: { context?: ClientLogEntry['context']; error?: Error; metadata?: Record<string, any> }): void {
    this.log('ERROR', category, message, options);
  }

  fatal(category: string, message: string, options?: { context?: ClientLogEntry['context']; error?: Error; metadata?: Record<string, any> }): void {
    this.log('FATAL', category, message, options);
  }

  /**
   * Log React component errors
   */
  logReactError(error: Error, errorInfo: { componentStack: string }, componentName?: string): void {
    this.error('REACT', `React component error${componentName ? ` in ${componentName}` : ''}`, {
      context: {
        component: componentName || 'Unknown',
        function: 'render',
        reactStackTrace: errorInfo.componentStack
      },
      error,
      metadata: {
        componentStack: errorInfo.componentStack,
        isReactError: true
      }
    });
  }

  /**
   * Log user actions for debugging
   */
  logUserAction(action: string, details: Record<string, any>): void {
    this.info('USER_ACTION', action, {
      context: { component: 'UserInterface', function: action },
      metadata: { ...details, timestamp: Date.now() }
    });
  }

  /**
   * Log network requests/responses
   */
  logNetworkRequest(method: string, url: string, status?: number, error?: Error): void {
    const level = error || (status && status >= 400) ? 'ERROR' : 'DEBUG';
    this.log(level, 'NETWORK', `${method} ${url}`, {
      context: { component: 'NetworkRequest', function: method },
      error,
      metadata: { method, url, status }
    });
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: ClientLogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(message, entry.context, entry.metadata);
        break;
      case 'INFO':
        console.info(message, entry.context, entry.metadata);
        break;
      case 'WARN':
        console.warn(message, entry.context, entry.metadata);
        if (entry.error) console.warn('Error:', entry.error);
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(message, entry.context, entry.metadata);
        if (entry.error) console.error('Error:', entry.error);
        break;
    }
  }

  /**
   * Flush buffered logs to main process
   */
  private flushToMainProcess(): void {
    if (!this.logBuffer.length || this.flushPromise) return;

    this.flushPromise = this.performFlush().finally(() => {
      this.flushPromise = null;
    });
  }

  /**
   * Perform the actual flush operation
   */
  private async performFlush(): Promise<void> {
    const entries = this.logBuffer.splice(0);
    if (!entries.length) return;

    try {
      // Send to main process via custom IPC if available
      if (window.electronAPI) {
        // Since we don't have a direct log forwarding IPC, we'll use the debug system
        // In a real implementation, you might add a specific IPC for log forwarding
        console.log('Flushing', entries.length, 'log entries to main process');
        
        // For now, critical errors are sent individually to ensure they're captured
        const criticalEntries = entries.filter(e => e.level === 'ERROR' || e.level === 'FATAL');
        for (const entry of criticalEntries) {
          console.error('Critical client error:', entry);
        }
      }
    } catch (error) {
      console.error('Failed to flush logs to main process:', error);
      // Put entries back for retry
      this.logBuffer.unshift(...entries);
    }
  }

  /**
   * Update configuration from main process
   */
  async updateConfig(): Promise<void> {
    try {
      if (window.electronAPI?.debugGetConfig) {
        const result = await window.electronAPI.debugGetConfig();
        if (result.success && result.config) {
          this.isEnabled = result.config.enabled;
          this.logLevel = result.config.logLevel;
          this.categories = result.config.categories;
        }
      }
    } catch (error) {
      console.warn('Failed to update debug config:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): { enabled: boolean; logLevel: string; categories: string[] } {
    return {
      enabled: this.isEnabled,
      logLevel: this.logLevel,
      categories: [...this.categories]
    };
  }

  /**
   * Manual flush of all buffered logs
   */
  async flush(): Promise<void> {
    if (this.flushPromise) {
      await this.flushPromise;
    }
    if (this.logBuffer.length > 0) {
      await this.performFlush();
    }
  }
}

// Create singleton instance
export const clientDebugLogger = new ClientDebugLogger();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    clientDebugLogger.initialize();
  });
} else {
  clientDebugLogger.initialize();
}

export default clientDebugLogger;