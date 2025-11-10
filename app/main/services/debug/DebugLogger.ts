import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  category: string;
  message: string;
  context?: {
    component?: string;
    function?: string;
    user?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  metadata?: Record<string, any>;
}

export interface DebugLoggerConfig {
  enabled: boolean;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  maxFileSize: number; // in bytes
  maxFiles: number;
  logDirectory: string;
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  categories: string[]; // Which categories to log
}

class DebugLogger {
  private config: DebugLoggerConfig;
  private logFilePath: string;
  private currentLogSize: number = 0;
  private initialized: boolean = false;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    const userDataPath = app?.getPath('userData') || process.cwd();
    
    this.config = {
      enabled: false, // Disabled by default
      logLevel: 'DEBUG',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      logDirectory: path.join(userDataPath, 'debug-logs'),
      enableConsoleLogging: true,
      enableFileLogging: true,
      categories: ['*'] // Log all categories by default
    };

    this.logFilePath = this.generateLogFilePath();
  }

  /**
   * Initialize the debug logger
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure log directory exists
      await this.ensureLogDirectory();
      
      // Initialize current log file
      await this.initializeLogFile();
      
      // Start flush interval for buffered logging
      this.startFlushInterval();
      
      this.initialized = true;
      
      this.log('INFO', 'DEBUG_LOGGER', 'Debug logger initialized successfully', {
        context: { component: 'DebugLogger', function: 'initialize' },
        metadata: { 
          logDirectory: this.config.logDirectory,
          logFile: this.logFilePath,
          config: this.config 
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize debug logger:', error);
      throw error;
    }
  }

  /**
   * Configure the logger
   */
  configure(newConfig: Partial<DebugLoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.log('INFO', 'DEBUG_LOGGER', 'Logger configuration updated', {
      context: { component: 'DebugLogger', function: 'configure' },
      metadata: { newConfig }
    });
  }

  /**
   * Enable/disable debug logging
   */
  setEnabled(enabled: boolean): void {
    const wasEnabled = this.config.enabled;
    this.config.enabled = enabled;
    
    if (!wasEnabled && enabled) {
      this.log('INFO', 'DEBUG_LOGGER', 'Debug logging enabled', {
        context: { component: 'DebugLogger', function: 'setEnabled' }
      });
    } else if (wasEnabled && !enabled) {
      this.log('INFO', 'DEBUG_LOGGER', 'Debug logging disabled', {
        context: { component: 'DebugLogger', function: 'setEnabled' }
      });
    }
  }

  /**
   * Check if logging is enabled for a specific level and category
   */
  private shouldLog(level: LogEntry['level'], category: string): boolean {
    if (!this.config.enabled || !this.initialized) return false;
    
    // Check log level
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    if (messageLevelIndex < currentLevelIndex) return false;
    
    // Check category filter
    if (this.config.categories.includes('*')) return true;
    return this.config.categories.includes(category);
  }

  /**
   * Main logging method
   */
  log(
    level: LogEntry['level'], 
    category: string, 
    message: string, 
    options: {
      context?: LogEntry['context'];
      error?: Error;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    if (!this.shouldLog(level, category)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: options.context,
      metadata: options.metadata
    };

    // Process error if provided
    if (options.error) {
      entry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack,
        code: (options.error as any).code
      };
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(entry);
    }

    // File logging (buffered)
    if (this.config.enableFileLogging) {
      this.logBuffer.push(entry);
      
      // Immediate flush for ERROR and FATAL
      if (level === 'ERROR' || level === 'FATAL') {
        this.flushBuffer();
      }
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(category: string, message: string, options?: { context?: LogEntry['context']; metadata?: Record<string, any> }): void {
    this.log('DEBUG', category, message, options);
  }

  info(category: string, message: string, options?: { context?: LogEntry['context']; metadata?: Record<string, any> }): void {
    this.log('INFO', category, message, options);
  }

  warn(category: string, message: string, options?: { context?: LogEntry['context']; error?: Error; metadata?: Record<string, any> }): void {
    this.log('WARN', category, message, options);
  }

  error(category: string, message: string, options?: { context?: LogEntry['context']; error?: Error; metadata?: Record<string, any> }): void {
    this.log('ERROR', category, message, options);
  }

  fatal(category: string, message: string, options?: { context?: LogEntry['context']; error?: Error; metadata?: Record<string, any> }): void {
    this.log('FATAL', category, message, options);
  }

  /**
   * Log to console with proper formatting
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(message, entry.context || '', entry.metadata || '');
        break;
      case 'INFO':
        console.info(message, entry.context || '', entry.metadata || '');
        break;
      case 'WARN':
        console.warn(message, entry.context || '', entry.metadata || '');
        if (entry.error) console.warn('Error:', entry.error);
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(message, entry.context || '', entry.metadata || '');
        if (entry.error) console.error('Error:', entry.error);
        break;
    }
  }

  /**
   * Flush log buffer to file
   */
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const entries = this.logBuffer.splice(0);
    
    try {
      const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      
      await fs.promises.appendFile(this.logFilePath, logLines, 'utf8');
      this.currentLogSize += Buffer.byteLength(logLines, 'utf8');
      
      // Check if rotation is needed
      if (this.currentLogSize > this.config.maxFileSize) {
        await this.rotateLogFile();
      }
      
    } catch (error) {
      console.error('Failed to flush log buffer:', error);
      // Put entries back in buffer for retry
      this.logBuffer.unshift(...entries);
    }
  }

  /**
   * Start the flush interval
   */
  private startFlushInterval(): void {
    if (this.flushInterval) return;
    
    this.flushInterval = setInterval(() => {
      this.flushBuffer().catch(err => 
        console.error('Error in periodic log flush:', err)
      );
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Generate log file path with timestamp
   */
  private generateLogFilePath(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    return path.join(this.config.logDirectory, `debug-${timestamp}.log`);
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.promises.mkdir(this.config.logDirectory, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
      throw error;
    }
  }

  /**
   * Initialize the current log file
   */
  private async initializeLogFile(): Promise<void> {
    try {
      const stats = await fs.promises.stat(this.logFilePath).catch(() => null);
      this.currentLogSize = stats?.size || 0;
      
      // Write initialization entry
      const initEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        category: 'DEBUG_LOGGER',
        message: 'Log file initialized',
        context: { component: 'DebugLogger', function: 'initializeLogFile' },
        metadata: { 
          logFile: this.logFilePath,
          existingSize: this.currentLogSize,
          pid: process.pid,
          version: app?.getVersion() || 'unknown'
        }
      };
      
      const initLine = JSON.stringify(initEntry) + '\n';
      await fs.promises.appendFile(this.logFilePath, initLine, 'utf8');
      this.currentLogSize += Buffer.byteLength(initLine, 'utf8');
      
    } catch (error) {
      console.error('Failed to initialize log file:', error);
      throw error;
    }
  }

  /**
   * Rotate log file when it gets too large
   */
  private async rotateLogFile(): Promise<void> {
    try {
      // Move current file to archived name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
      const archivedPath = path.join(
        this.config.logDirectory, 
        `debug-${timestamp}-archived.log`
      );
      
      await fs.promises.rename(this.logFilePath, archivedPath);
      
      // Clean up old files
      await this.cleanupOldLogFiles();
      
      // Reset current log
      this.logFilePath = this.generateLogFilePath();
      this.currentLogSize = 0;
      await this.initializeLogFile();
      
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Clean up old log files
   */
  private async cleanupOldLogFiles(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.config.logDirectory);
      const logFiles = files
        .filter(file => file.startsWith('debug-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDirectory, file),
          stats: null as fs.Stats | null
        }));

      // Get file stats
      for (const file of logFiles) {
        try {
          file.stats = await fs.promises.stat(file.path);
        } catch (error) {
          console.error(`Failed to get stats for ${file.name}:`, error);
        }
      }

      // Sort by creation time and remove excess files
      const sortedFiles = logFiles
        .filter(file => file.stats !== null)
        .sort((a, b) => b.stats!.birthtime.getTime() - a.stats!.birthtime.getTime());

      const filesToDelete = sortedFiles.slice(this.config.maxFiles);
      
      for (const file of filesToDelete) {
        try {
          await fs.promises.unlink(file.path);
          console.log(`Deleted old log file: ${file.name}`);
        } catch (error) {
          console.error(`Failed to delete log file ${file.name}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Failed to cleanup old log files:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DebugLoggerConfig {
    return { ...this.config };
  }

  /**
   * Get current log file path
   */
  getCurrentLogFile(): string {
    return this.logFilePath;
  }

  /**
   * Get all log files
   */
  async getLogFiles(): Promise<Array<{ name: string; path: string; size: number; created: Date }>> {
    try {
      const files = await fs.promises.readdir(this.config.logDirectory);
      const logFiles = [];
      
      for (const file of files) {
        if (file.startsWith('debug-') && file.endsWith('.log')) {
          const filePath = path.join(this.config.logDirectory, file);
          try {
            const stats = await fs.promises.stat(filePath);
            logFiles.push({
              name: file,
              path: filePath,
              size: stats.size,
              created: stats.birthtime
            });
          } catch (error) {
            console.error(`Failed to get stats for ${file}:`, error);
          }
        }
      }
      
      return logFiles.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Failed to get log files:', error);
      return [];
    }
  }

  /**
   * Read log file content
   */
  async readLogFile(filePath: string, maxLines: number = 1000): Promise<LogEntry[]> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n').slice(-maxLines);
      
      const entries: LogEntry[] = [];
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          entries.push(entry);
        } catch (error) {
          // Skip malformed lines
          continue;
        }
      }
      
      return entries;
    } catch (error) {
      console.error(`Failed to read log file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Clear all log files
   */
  async clearLogs(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.config.logDirectory);
      const logFiles = files.filter(file => file.startsWith('debug-') && file.endsWith('.log'));
      
      for (const file of logFiles) {
        const filePath = path.join(this.config.logDirectory, file);
        await fs.promises.unlink(filePath);
      }
      
      // Reinitialize current log file
      this.logFilePath = this.generateLogFilePath();
      this.currentLogSize = 0;
      this.logBuffer = [];
      await this.initializeLogFile();
      
      this.info('DEBUG_LOGGER', 'All log files cleared', {
        context: { component: 'DebugLogger', function: 'clearLogs' }
      });
      
    } catch (error) {
      this.error('DEBUG_LOGGER', 'Failed to clear log files', {
        context: { component: 'DebugLogger', function: 'clearLogs' },
        error: error as Error
      });
      throw error;
    }
  }

  /**
   * Shutdown the logger
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Final flush
    await this.flushBuffer();
    
    this.info('DEBUG_LOGGER', 'Debug logger shutdown completed', {
      context: { component: 'DebugLogger', function: 'shutdown' }
    });
    
    this.initialized = false;
  }
}

// Singleton instance
export const debugLogger = new DebugLogger();

// Global error handlers for uncaught exceptions
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    debugLogger.fatal('GLOBAL', 'Uncaught exception', {
      context: { component: 'Process', function: 'uncaughtException' },
      error,
      metadata: { pid: process.pid }
    });
    console.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    debugLogger.fatal('GLOBAL', 'Unhandled promise rejection', {
      context: { component: 'Process', function: 'unhandledRejection' },
      error: reason instanceof Error ? reason : new Error(String(reason)),
      metadata: { promise: promise.toString() }
    });
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

export default debugLogger;