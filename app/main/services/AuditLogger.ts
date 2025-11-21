import { app } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface AuditEvent {
  id?: string;
  timestamp: string;
  session_id: string;
  user_id: string;
  event_type: 'user_interaction' | 'form_change' | 'navigation' | 'error' | 'system' | 'data_change';
  component?: string;
  action: string;
  target?: string;
  data?: Record<string, any>;
  error_details?: {
    message: string;
    stack?: string;
    component_stack?: string;
    props?: Record<string, any>;
    state?: Record<string, any>;
  };
  system_context?: {
    url?: string;
    user_agent?: string;
    viewport?: { width: number; height: number };
    memory_usage?: NodeJS.MemoryUsage;
    app_version?: string;
  };
  user_context?: {
    last_actions?: Array<{ action: string; timestamp: string; component?: string }>;
    form_state?: Record<string, any>;
    active_projects?: string[];
  };
}

export interface LogRotationConfig {
  maxFileSize: number; // in MB
  maxFiles: number;
  rotateOnStartup: boolean;
}

export class AuditLogger {
  private db: Database.Database;
  private ndjsonPath: string;
  private sessionId: string;
  private userId: string;
  private rotationConfig: LogRotationConfig;
  private recentActions: Array<{ action: string; timestamp: string; component?: string }> = [];
  private maxRecentActions = 20;

  constructor(
    database: Database.Database,
    baseDataPath: string,
    userId: string = 'default-user',
    rotationConfig: LogRotationConfig = {
      maxFileSize: 50, // 50MB
      maxFiles: 10,
      rotateOnStartup: true
    }
  ) {
    this.db = database;
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.rotationConfig = rotationConfig;
    
    // Set up NDJSON log path
    this.ndjsonPath = path.join(baseDataPath, 'audit-logs', 'events.ndjson');
    
  }

  async initialize(): Promise<void> {
    this.initializeTables();
    this.ensureLogDirectory();
    
    if (this.rotationConfig.rotateOnStartup) {
      this.rotateLogsIfNeeded();
    }
    
    // Log application startup
    this.logSystemEvent('application_start', {
      app_version: app.getVersion(),
      node_version: process.version,
      platform: process.platform,
      arch: process.arch
    });
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTables(): void {
    // The audit_events table is already created by db.ts schema
    // We just need to ensure the required columns exist for our use case
    
    try {
      // Check if we need to add additional columns for comprehensive audit logging
      const columns = this.db.prepare(`PRAGMA table_info(audit_events)`).all();
      const columnNames = columns.map((col: any) => col.name);
      
      // Add missing columns if needed (for backward compatibility)
      const requiredColumns = [
        { name: 'session_id', type: 'TEXT' },
        { name: 'user_id', type: 'TEXT' },
        { name: 'event_type', type: 'TEXT' },
        { name: 'data', type: 'TEXT' },
        { name: 'error_details', type: 'TEXT' },
        { name: 'system_context', type: 'TEXT' },
        { name: 'user_context', type: 'TEXT' }
      ];
      
      for (const column of requiredColumns) {
        if (!columnNames.includes(column.name)) {
          try {
            this.db.exec(`ALTER TABLE audit_events ADD COLUMN ${column.name} ${column.type}`);
            console.log(`Added missing column ${column.name} to audit_events table`);
          } catch (error) {
            // Column might already exist, ignore the error
          }
        }
      }
      
      // Create additional indexes for audit logging if they don't exist
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_events(session_id);
        CREATE INDEX IF NOT EXISTS idx_audit_type ON audit_events(event_type);
      `);
      
    } catch (error) {
      console.error('Error initializing audit logger tables:', error);
      // Continue anyway - basic functionality should work
    }
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.ndjsonPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private rotateLogsIfNeeded(): void {
    try {
      if (fs.existsSync(this.ndjsonPath)) {
        const stats = fs.statSync(this.ndjsonPath);
        const sizeMB = stats.size / (1024 * 1024);
        
        if (sizeMB > this.rotationConfig.maxFileSize) {
          this.rotateLogs();
        }
      }
    } catch (error) {
      console.error('Error checking log file size:', error);
    }
  }

  private rotateLogs(): void {
    try {
      const logDir = path.dirname(this.ndjsonPath);
      const baseName = path.basename(this.ndjsonPath, '.ndjson');
      
      // Move existing numbered files up
      for (let i = this.rotationConfig.maxFiles - 1; i >= 1; i--) {
        const oldPath = path.join(logDir, `${baseName}.${i}.ndjson`);
        const newPath = path.join(logDir, `${baseName}.${i + 1}.ndjson`);
        
        if (fs.existsSync(oldPath)) {
          if (i + 1 <= this.rotationConfig.maxFiles) {
            fs.renameSync(oldPath, newPath);
          } else {
            fs.unlinkSync(oldPath); // Delete oldest file
          }
        }
      }
      
      // Move current file to .1
      if (fs.existsSync(this.ndjsonPath)) {
        const rotatedPath = path.join(logDir, `${baseName}.1.ndjson`);
        fs.renameSync(this.ndjsonPath, rotatedPath);
      }
      
      console.log('Log rotation completed successfully');
    } catch (error) {
      console.error('Error rotating logs:', error);
    }
  }

  private updateRecentActions(action: string, component?: string): void {
    this.recentActions.push({
      action,
      timestamp: new Date().toISOString(),
      component
    });
    
    // Keep only recent actions
    if (this.recentActions.length > this.maxRecentActions) {
      this.recentActions.shift();
    }
  }

  private createAuditEvent(
    eventType: AuditEvent['event_type'],
    action: string,
    data: Partial<AuditEvent> = {}
  ): AuditEvent {
    const timestamp = new Date().toISOString();
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      timestamp,
      session_id: this.sessionId,
      user_id: this.userId,
      event_type: eventType,
      action,
      system_context: {
        app_version: app.getVersion(),
        memory_usage: process.memoryUsage(),
        ...data.system_context
      },
      user_context: {
        last_actions: [...this.recentActions],
        ...data.user_context
      },
      ...data
    };
  }

  /**
   * Log user interaction events (clicks, hovers, keyboard)
   */
  logUserInteraction(
    action: string,
    component?: string,
    target?: string,
    additionalData?: Record<string, any>
  ): void {
    this.updateRecentActions(action, component);

    const event = this.createAuditEvent('user_interaction', action, {
      component,
      target,
      data: additionalData
    });

    this.writeEvent(event);
  }

  /**
   * Log form changes and validation events
   */
  logFormChange(
    component: string,
    field: string,
    oldValue: any,
    newValue: any,
    validationResult?: { valid: boolean; errors?: string[] }
  ): void {
    const event = this.createAuditEvent('form_change', 'field_change', {
      component,
      target: field,
      data: {
        old_value: oldValue,
        new_value: newValue,
        validation: validationResult
      }
    });

    this.writeEvent(event);
  }

  /**
   * Log navigation events
   */
  logNavigation(from: string, to: string, trigger: 'user' | 'system' = 'user'): void {
    this.updateRecentActions(`navigate_to_${to}`);

    const event = this.createAuditEvent('navigation', 'navigate', {
      data: {
        from,
        to,
        trigger
      }
    });

    this.writeEvent(event);
  }

  /**
   * Log errors with comprehensive context
   */
  logError(
    error: Error,
    component?: string,
    additionalContext?: Record<string, any>
  ): void {
    const event = this.createAuditEvent('error', 'error_occurred', {
      component,
      error_details: {
        message: error.message,
        stack: error.stack,
        component_stack: additionalContext?.componentStack,
        props: additionalContext?.props,
        state: additionalContext?.state
      },
      data: additionalContext
    });

    this.writeEvent(event);
    this.updateRecentActions(`error_in_${component || 'unknown'}`);
  }

  /**
   * Log system events
   */
  logSystemEvent(action: string, data?: Record<string, any>): void {
    const event = this.createAuditEvent('system', action, {
      data
    });

    this.writeEvent(event);
    this.updateRecentActions(action);
  }

  /**
   * Log data changes (CRUD operations)
   */
  logDataChange(
    action: string,
    entityType: string,
    entityId: string,
    oldData?: any,
    newData?: any
  ): void {
    const event = this.createAuditEvent('data_change', action, {
      target: `${entityType}:${entityId}`,
      data: {
        entity_type: entityType,
        entity_id: entityId,
        old_data: oldData,
        new_data: newData
      }
    });

    this.writeEvent(event);
    this.updateRecentActions(`${action}_${entityType}`);
  }

  private writeEvent(event: AuditEvent): void {
    try {
      // Map to existing database schema columns
      // Existing schema: id, ts, user, type, payload, module, component, action, entity_type, entity_id, route, source, session_id
      const stmt = this.db.prepare(`
        INSERT INTO audit_events (
          id, ts, user, type, payload, module, component, 
          action, session_id, entity_type, entity_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Create comprehensive payload with all audit data
      const payload = {
        event_type: event.event_type,
        target: event.target,
        data: event.data,
        error_details: event.error_details,
        system_context: event.system_context,
        user_context: event.user_context
      };

      stmt.run(
        event.id,
        event.timestamp, // maps to 'ts' column
        event.user_id,   // maps to 'user' column
        event.event_type, // maps to 'type' column
        JSON.stringify(payload), // comprehensive payload
        'audit_logger', // module
        event.component || null,
        event.action,
        event.session_id,
        event.data?.entity_type || null,
        event.data?.entity_id || null
      );

      // Also write to NDJSON file for backup/export
      const ndjsonLine = JSON.stringify(event) + '\n';
      fs.appendFileSync(this.ndjsonPath, ndjsonLine, 'utf8');

      // Check if rotation is needed after writing
      this.rotateLogsIfNeeded();

    } catch (error) {
      console.error('Failed to write audit event:', error);
      // Don't throw - audit logging should be resilient
    }
  }

  /**
   * Query audit events with filtering
   */
  queryEvents(filter: {
    startTime?: string;
    endTime?: string;
    eventType?: AuditEvent['event_type'];
    component?: string;
    action?: string;
    sessionId?: string;
    limit?: number;
  } = {}): AuditEvent[] {
    let query = 'SELECT * FROM audit_events WHERE 1=1';
    const params: any[] = [];

    if (filter.startTime) {
      query += ' AND ts >= ?';
      params.push(filter.startTime);
    }

    if (filter.endTime) {
      query += ' AND ts <= ?';
      params.push(filter.endTime);
    }

    if (filter.eventType) {
      query += ' AND type = ?';
      params.push(filter.eventType);
    }

    if (filter.component) {
      query += ' AND component = ?';
      params.push(filter.component);
    }

    if (filter.action) {
      query += ' AND action = ?';
      params.push(filter.action);
    }

    if (filter.sessionId) {
      query += ' AND session_id = ?';
      params.push(filter.sessionId);
    }

    query += ' ORDER BY ts DESC';

    if (filter.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => {
      // Parse the comprehensive payload back to individual fields
      let parsedPayload: any = {};
      try {
        parsedPayload = row.payload ? JSON.parse(row.payload) : {};
      } catch (error) {
        console.warn('Failed to parse audit event payload:', error);
      }

      return {
        id: row.id,
        timestamp: row.ts, // map back from 'ts' to 'timestamp'
        session_id: row.session_id,
        user_id: row.user, // map back from 'user' to 'user_id'
        event_type: row.type, // map back from 'type' to 'event_type'
        component: row.component,
        action: row.action,
        target: parsedPayload.target,
        data: parsedPayload.data,
        error_details: parsedPayload.error_details,
        system_context: parsedPayload.system_context,
        user_context: parsedPayload.user_context
      };
    });
  }

  /**
   * Get recent events for debugging context
   */
  getRecentEvents(minutes: number = 30): AuditEvent[] {
    const startTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    return this.queryEvents({ startTime, limit: 100 });
  }

  /**
   * Get events leading up to an error for debugging
   */
  getErrorContext(errorTimestamp: string, contextMinutes: number = 5): {
    error: AuditEvent | null;
    leadingEvents: AuditEvent[];
  } {
    const contextStart = new Date(
      new Date(errorTimestamp).getTime() - contextMinutes * 60 * 1000
    ).toISOString();

    const allEvents = this.queryEvents({
      startTime: contextStart,
      endTime: errorTimestamp,
      limit: 50
    });

    const errorEvent = allEvents.find(e => 
      e.event_type === 'error' && e.timestamp === errorTimestamp
    ) || null;

    const leadingEvents = allEvents.filter(e => 
      e.event_type !== 'error' && e.timestamp !== errorTimestamp
    );

    return { error: errorEvent, leadingEvents };
  }

  /**
   * Export audit logs for sharing/debugging
   */
  exportLogs(outputPath: string, filter?: Parameters<typeof this.queryEvents>[0]): void {
    const events = this.queryEvents(filter);
    const exportData = {
      export_timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      app_version: app.getVersion(),
      total_events: events.length,
      events
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
  }

  /**
   * Clean up resources
   */
  async shutdown(): Promise<void> {
    try {
      this.logSystemEvent('application_shutdown');
      // Don't close the database as it's shared with other services
    } catch (error) {
      console.error('Error shutting down audit logger:', error);
    }
  }

  /**
   * Clean up resources (legacy method)
   */
  close(): void {
    try {
      this.logSystemEvent('application_shutdown');
      // Don't close the database as it's shared with other services
    } catch (error) {
      console.error('Error closing audit logger:', error);
    }
  }

  /**
   * Get logging statistics
   */
  getStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    sessionEvents: number;
    logFileSize: number;
    oldestEvent?: string;
    newestEvent?: string;
  } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM audit_events');
    const totalEvents = (totalStmt.get() as any).count;

    const typeStmt = this.db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM audit_events 
      GROUP BY type
    `);
    const typeRows = typeStmt.all() as any[];
    const eventsByType: Record<string, number> = {};
    typeRows.forEach(row => {
      eventsByType[row.type] = row.count;
    });

    const sessionStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM audit_events WHERE session_id = ?'
    );
    const sessionEvents = (sessionStmt.get(this.sessionId) as any).count;

    let logFileSize = 0;
    try {
      if (fs.existsSync(this.ndjsonPath)) {
        logFileSize = fs.statSync(this.ndjsonPath).size;
      }
    } catch (error) {
      // Ignore error
    }

    const dateRangeStmt = this.db.prepare(`
      SELECT MIN(ts) as oldest, MAX(ts) as newest 
      FROM audit_events
    `);
    const dateRange = dateRangeStmt.get() as any;

    return {
      totalEvents,
      eventsByType,
      sessionEvents,
      logFileSize,
      oldestEvent: dateRange.oldest,
      newestEvent: dateRange.newest
    };
  }
}