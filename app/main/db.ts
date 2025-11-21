import Database from 'better-sqlite3';

export type DB = Database.Database;

export function openDB(dbPath: string): DB {
  try {
    const db = new Database(dbPath, { 
      fileMustExist: false, 
      verbose: (message?: unknown) => {
        if (process.env.NODE_ENV === 'development' && typeof message === 'string') {
          console.log('SQLite:', message);
        }
      }
    });

    // Test connection
    db.prepare('SELECT 1').get();
    
    // Set PRAGMAs with error handling
    try {
      db.pragma('journal_mode = WAL');
    } catch (error) {
      console.warn('Failed to set WAL mode:', error);
      // Continue with default journal mode
    }
    
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 3000');
    db.pragma('synchronous = NORMAL');
    
    ensureSchema(db);
    return db;
  } catch (error: any) {
    console.error('Failed to open database:', error);
    throw new Error(`Database initialization failed: ${error.message}`);
  }
}

function ensureSchema(db: DB) {
  // Use user_version for simple migration gating
  const row = db.prepare('PRAGMA user_version').get() as any;
  const current = row.user_version as number;

  db.transaction(() => {
    // Create tables (idempotent)
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        lane TEXT DEFAULT '',
        start_date_nz TEXT NOT NULL,
        end_date_nz   TEXT NOT NULL,
        start_date_iso TEXT NOT NULL,
        end_date_iso   TEXT NOT NULL,
        status TEXT NOT NULL,
        pm_name TEXT DEFAULT '',
        budget_cents INTEGER DEFAULT 0,
        financial_treatment TEXT DEFAULT 'CAPEX',
        row INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS epics (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        state TEXT DEFAULT 'New',
        effort INTEGER DEFAULT 0,
        business_value INTEGER DEFAULT 0,
        time_criticality INTEGER DEFAULT 0,
        start_date_nz TEXT DEFAULT '',
        end_date_nz TEXT DEFAULT '',
        start_date_iso TEXT DEFAULT '',
        end_date_iso TEXT DEFAULT '',
        assigned_to TEXT DEFAULT '',
        area_path TEXT DEFAULT '',
        iteration_path TEXT DEFAULT '',
        risk TEXT DEFAULT '',
        value_area TEXT DEFAULT '',
        parent_feature TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS features (
        id TEXT PRIMARY KEY,
        epic_id TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        state TEXT DEFAULT 'New',
        effort INTEGER DEFAULT 0,
        business_value INTEGER DEFAULT 0,
        time_criticality INTEGER DEFAULT 0,
        start_date_nz TEXT DEFAULT '',
        end_date_nz TEXT DEFAULT '',
        start_date_iso TEXT DEFAULT '',
        end_date_iso TEXT DEFAULT '',
        assigned_to TEXT DEFAULT '',
        area_path TEXT DEFAULT '',
        iteration_path TEXT DEFAULT '',
        risk TEXT DEFAULT '',
        value_area TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        start_date_nz TEXT NOT NULL,
        end_date_nz   TEXT NOT NULL,
        start_date_iso TEXT NOT NULL,
        end_date_iso   TEXT NOT NULL,
        effort_hours INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        assigned_resources TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS dependencies (
        id TEXT PRIMARY KEY,
        from_type TEXT NOT NULL,
        from_id TEXT NOT NULL,
        to_type TEXT NOT NULL,
        to_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        lag_days INTEGER DEFAULT 0,
        note TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS initiatives (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        ts TEXT NOT NULL,
        user TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        module TEXT,
        component TEXT,
        action TEXT,
        entity_type TEXT,
        entity_id TEXT,
        route TEXT,
        source TEXT,
        session_id TEXT
      );

      -- ADO Integration Tables
      CREATE TABLE IF NOT EXISTS ado_config (
        id INTEGER PRIMARY KEY,
        org_url TEXT NOT NULL,
        project_name TEXT NOT NULL,
        auth_mode TEXT DEFAULT 'PAT',
        pat_token TEXT,
        pat_token_expiry_date TEXT,
        client_id TEXT,
        tenant_id TEXT,
        webhook_url TEXT,
        webhook_secret TEXT,
        max_retry_attempts INTEGER DEFAULT 3,
        base_delay_ms INTEGER DEFAULT 500,
        is_enabled BOOLEAN DEFAULT FALSE,
        connection_status TEXT DEFAULT 'disconnected',
        last_sync_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ado_tags (
        id INTEGER PRIMARY KEY,
        category TEXT NOT NULL,
        tag_name TEXT NOT NULL,
        tag_value TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS dependencies_ado (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        dependency_type TEXT NOT NULL,
        reason TEXT,
        needed_by TEXT,
        risk_level TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Active',
        ado_relation_id TEXT,
        validation_result TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        resolved_at TEXT,
        UNIQUE(source_id, target_id, dependency_type)
      );

      CREATE TABLE IF NOT EXISTS ado_webhook_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        work_item_id TEXT NOT NULL,
        payload TEXT,
        processed BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        processed_at TEXT,
        created_at TEXT NOT NULL
      );

      -- Calendar Module Tables
      CREATE TABLE IF NOT EXISTS calendar_years (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL UNIQUE,
        total_days INTEGER DEFAULT 365,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS calendar_months (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        days INTEGER NOT NULL,
        working_days INTEGER DEFAULT 0,
        weekend_days INTEGER DEFAULT 0,
        public_holidays INTEGER DEFAULT 0,
        work_hours INTEGER DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(year, month),
        FOREIGN KEY(year) REFERENCES calendar_years(year) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS public_holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        end_year INTEGER,
        end_month INTEGER,
        end_day INTEGER,
        description TEXT DEFAULT '',
        is_recurring BOOLEAN DEFAULT FALSE,
        source TEXT DEFAULT 'manual',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_epics_project ON epics(project_id);
      CREATE INDEX IF NOT EXISTS idx_epics_sort ON epics(project_id, sort_order);
      CREATE INDEX IF NOT EXISTS idx_features_epic ON features(epic_id);
      CREATE INDEX IF NOT EXISTS idx_features_project ON features(project_id);
      CREATE INDEX IF NOT EXISTS idx_features_sort ON features(epic_id, sort_order);
      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_dates_iso ON projects(start_date_iso, end_date_iso);
      CREATE INDEX IF NOT EXISTS idx_tasks_dates_iso ON tasks(start_date_iso, end_date_iso);
      CREATE INDEX IF NOT EXISTS idx_deps_from ON dependencies(from_id);
      CREATE INDEX IF NOT EXISTS idx_deps_to ON dependencies(to_id);
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_dep ON dependencies(from_type, from_id, to_type, to_id, kind);
      CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
      CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_events(module);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
      
      -- ADO Integration Indexes
      CREATE INDEX IF NOT EXISTS idx_ado_tags_category ON ado_tags(category, is_active);
      CREATE INDEX IF NOT EXISTS idx_ado_tags_sort ON ado_tags(category, sort_order);
      CREATE INDEX IF NOT EXISTS idx_dependencies_ado_source ON dependencies_ado(source_id, status);
      CREATE INDEX IF NOT EXISTS idx_dependencies_ado_target ON dependencies_ado(target_id, status);
      CREATE INDEX IF NOT EXISTS idx_dependencies_ado_type ON dependencies_ado(dependency_type, status);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON ado_webhook_events(processed, created_at);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_work_item ON ado_webhook_events(work_item_id, event_type);
      
      -- Calendar Module Indexes
      CREATE INDEX IF NOT EXISTS idx_calendar_months_year ON calendar_months(year, month);
      CREATE INDEX IF NOT EXISTS idx_public_holidays_start_date ON public_holidays(start_date);
      CREATE INDEX IF NOT EXISTS idx_public_holidays_year_month ON public_holidays(year, month);
      CREATE INDEX IF NOT EXISTS idx_public_holidays_name ON public_holidays(name);
      
      -- ===== FINANCIAL COORDINATOR TABLES =====
      
      -- Raw data imports
      CREATE TABLE IF NOT EXISTS raw_timesheets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stream TEXT NOT NULL,
        month TEXT NOT NULL,
        sender_cost_center TEXT,
        name_of_employee TEXT NOT NULL,
        personnel_number TEXT NOT NULL,
        status_and_processing TEXT,
        date TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        general_receiver TEXT NOT NULL,
        acct_assgnt_text TEXT,
        number_unit REAL NOT NULL,
        internal_uom TEXT,
        att_absence_type TEXT,
        created_on TEXT,
        time_of_entry TEXT,
        created_by TEXT,
        last_change TEXT,
        changed_at TEXT,
        changed_by TEXT,
        approved_by TEXT,
        approval_date TEXT,
        object_description TEXT,
        
        imported_at TEXT NOT NULL,
        processed BOOLEAN DEFAULT 0,
        
        resource_id INTEGER,
        project_id TEXT,
        epic_id TEXT,
        feature_id TEXT,
        
        FOREIGN KEY (resource_id) REFERENCES financial_resources(id)
      );
      
      CREATE TABLE IF NOT EXISTS raw_actuals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        posting_date TEXT NOT NULL,
        document_date TEXT NOT NULL,
        cost_element TEXT NOT NULL,
        cost_element_descr TEXT,
        wbs_element TEXT NOT NULL,
        value_in_obj_crcy REAL NOT NULL,
        period INTEGER,
        fiscal_year INTEGER,
        transaction_currency TEXT,
        personnel_number TEXT,
        document_number TEXT,
        created_on TEXT,
        object_key TEXT,
        value_tran_curr REAL,
        vbl_value_obj_curr REAL,
        name TEXT,
        
        imported_at TEXT NOT NULL,
        processed BOOLEAN DEFAULT 0,
        
        actual_type TEXT,
        resource_id INTEGER,
        project_id TEXT,
        
        FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
      
      CREATE TABLE IF NOT EXISTS raw_labour_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        band TEXT NOT NULL,
        local_band TEXT,
        activity_type TEXT NOT NULL UNIQUE,
        fiscal_year TEXT NOT NULL,
        hourly_rate REAL NOT NULL,
        daily_rate REAL NOT NULL,
        uplift_amount REAL,
        uplift_percent REAL,
        
        imported_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS financial_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roadmap_resource_id INTEGER UNIQUE,
        resource_name TEXT NOT NULL,
        email TEXT,
        work_area TEXT,
        activity_type_cap TEXT,
        activity_type_opx TEXT,
        contract_type TEXT,
        employee_id TEXT UNIQUE,
        
        ado_identity_id TEXT,
        
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        FOREIGN KEY (activity_type_cap) REFERENCES raw_labour_rates(activity_type),
        FOREIGN KEY (activity_type_opx) REFERENCES raw_labour_rates(activity_type)
      );
      
      CREATE TABLE IF NOT EXISTS resource_commitments (
        id TEXT PRIMARY KEY,
        resource_id INTEGER NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        commitment_type TEXT NOT NULL,
        committed_hours REAL NOT NULL,
        
        total_available_hours REAL NOT NULL,
        allocated_hours REAL DEFAULT 0,
        remaining_capacity REAL DEFAULT 0,
        
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
        CHECK (commitment_type IN ('per-day', 'per-week', 'per-fortnight'))
      );
      
      CREATE TABLE IF NOT EXISTS feature_allocations (
        id TEXT PRIMARY KEY,
        resource_id INTEGER NOT NULL,
        feature_id TEXT NOT NULL,
        epic_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        
        allocated_hours REAL NOT NULL,
        forecast_start_date TEXT,
        forecast_end_date TEXT,
        
        actual_hours_to_date REAL DEFAULT 0,
        actual_cost_to_date REAL DEFAULT 0,
        variance_hours REAL DEFAULT 0,
        variance_cost REAL DEFAULT 0,
        status TEXT DEFAULT 'on-track',
        
        source TEXT DEFAULT 'manual',
        ado_feature_id TEXT,
        
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
        FOREIGN KEY (epic_id) REFERENCES epics(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS financial_workstreams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        workstream_name TEXT NOT NULL,
        wbse TEXT NOT NULL,
        wbse_desc TEXT,
        sme_resource_id INTEGER,
        
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (sme_resource_id) REFERENCES financial_resources(id)
      );
      
      CREATE TABLE IF NOT EXISTS project_financial_detail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL UNIQUE,
        
        sentinel_number TEXT,
        delivery_goal TEXT,
        wbse TEXT NOT NULL,
        wbse_desc TEXT,
        auc_number TEXT,
        final_asset TEXT,
        sap_code TEXT,
        io_code TEXT,
        
        original_budget_nzd REAL DEFAULT 0,
        forecast_budget_nzd REAL DEFAULT 0,
        actual_cost_nzd REAL DEFAULT 0,
        variance_nzd REAL DEFAULT 0,
        
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS ado_feature_mapping (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT NOT NULL,
        ado_work_item_id INTEGER NOT NULL,
        ado_work_item_type TEXT,
        
        ado_state TEXT,
        ado_assigned_to TEXT,
        ado_effort REAL,
        ado_iteration_path TEXT,
        ado_area_path TEXT,
        
        backlog_submission_date TEXT,
        design_workshop_date TEXT,
        development_start_date TEXT,
        uat_target_date TEXT,
        prod_deployment_date TEXT,
        
        last_synced_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        sync_error TEXT,
        
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
        UNIQUE(feature_id, ado_work_item_id)
      );
      
      CREATE TABLE IF NOT EXISTS variance_thresholds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        
        hours_variance_percent REAL DEFAULT 20.0,
        cost_variance_percent REAL DEFAULT 20.0,
        schedule_variance_days INTEGER DEFAULT 7,
        
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        UNIQUE(entity_type, entity_id)
      );
      
      CREATE TABLE IF NOT EXISTS variance_alerts (
        id TEXT PRIMARY KEY,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        
        message TEXT NOT NULL,
        details TEXT,
        variance_amount REAL,
        variance_percent REAL,
        
        acknowledged BOOLEAN DEFAULT 0,
        acknowledged_by TEXT,
        acknowledged_at TEXT,
        
        created_at TEXT NOT NULL,
        
        CHECK (alert_type IN ('commitment', 'effort', 'cost', 'schedule', 'unauthorized')),
        CHECK (severity IN ('low', 'medium', 'high', 'critical'))
      );
      
      CREATE TABLE IF NOT EXISTS finance_ledger_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        workstream_id INTEGER,
        wbse TEXT NOT NULL,
        
        period_month TEXT NOT NULL,
        period_year INTEGER NOT NULL,
        fiscal_year TEXT,
        
        budget_type TEXT NOT NULL,
        expenditure_type TEXT NOT NULL,
        
        forecast_amount REAL DEFAULT 0,
        actual_amount REAL DEFAULT 0,
        variance_amount REAL DEFAULT 0,
        
        source_type TEXT,
        source_ids TEXT,
        
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (workstream_id) REFERENCES financial_workstreams(id)
      );
      
      -- ===== COORDINATOR INDEXES =====
      
      CREATE INDEX IF NOT EXISTS idx_timesheets_personnel ON raw_timesheets(personnel_number);
      CREATE INDEX IF NOT EXISTS idx_timesheets_date ON raw_timesheets(date);
      CREATE INDEX IF NOT EXISTS idx_timesheets_wbse ON raw_timesheets(general_receiver);
      CREATE INDEX IF NOT EXISTS idx_timesheets_month ON raw_timesheets(month);
      CREATE INDEX IF NOT EXISTS idx_timesheets_resource ON raw_timesheets(resource_id);
      CREATE INDEX IF NOT EXISTS idx_timesheets_feature ON raw_timesheets(feature_id);
      
      CREATE INDEX IF NOT EXISTS idx_actuals_wbse ON raw_actuals(wbs_element);
      CREATE INDEX IF NOT EXISTS idx_actuals_cost_element ON raw_actuals(cost_element);
      CREATE INDEX IF NOT EXISTS idx_actuals_month ON raw_actuals(month);
      CREATE INDEX IF NOT EXISTS idx_actuals_personnel ON raw_actuals(personnel_number);
      CREATE INDEX IF NOT EXISTS idx_actuals_resource ON raw_actuals(resource_id);
      
      CREATE INDEX IF NOT EXISTS idx_labour_rates_activity ON raw_labour_rates(activity_type);
      
      CREATE INDEX IF NOT EXISTS idx_fin_resources_employee ON financial_resources(employee_id);
      CREATE INDEX IF NOT EXISTS idx_fin_resources_ado ON financial_resources(ado_identity_id);
      
      CREATE INDEX IF NOT EXISTS idx_commitments_resource ON resource_commitments(resource_id);
      CREATE INDEX IF NOT EXISTS idx_commitments_period ON resource_commitments(period_start, period_end);
      
      CREATE INDEX IF NOT EXISTS idx_feature_alloc_resource ON feature_allocations(resource_id);
      CREATE INDEX IF NOT EXISTS idx_feature_alloc_feature ON feature_allocations(feature_id);
      CREATE INDEX IF NOT EXISTS idx_feature_alloc_epic ON feature_allocations(epic_id);
      CREATE INDEX IF NOT EXISTS idx_feature_alloc_project ON feature_allocations(project_id);
      CREATE INDEX IF NOT EXISTS idx_feature_alloc_ado ON feature_allocations(ado_feature_id);
      
      CREATE INDEX IF NOT EXISTS idx_workstreams_project ON financial_workstreams(project_id);
      CREATE INDEX IF NOT EXISTS idx_workstreams_wbse ON financial_workstreams(wbse);
      
      CREATE INDEX IF NOT EXISTS idx_proj_fin_detail_project ON project_financial_detail(project_id);
      CREATE INDEX IF NOT EXISTS idx_proj_fin_detail_wbse ON project_financial_detail(wbse);
      
      CREATE INDEX IF NOT EXISTS idx_ado_feature_map_feature ON ado_feature_mapping(feature_id);
      CREATE INDEX IF NOT EXISTS idx_ado_feature_map_ado_id ON ado_feature_mapping(ado_work_item_id);
      CREATE INDEX IF NOT EXISTS idx_ado_feature_map_sync ON ado_feature_mapping(sync_status, last_synced_at);
      
      CREATE INDEX IF NOT EXISTS idx_variance_thresholds_entity ON variance_thresholds(entity_type, entity_id);
      
      CREATE INDEX IF NOT EXISTS idx_alerts_type ON variance_alerts(alert_type);
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON variance_alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_alerts_entity ON variance_alerts(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON variance_alerts(acknowledged);
      
      CREATE INDEX IF NOT EXISTS idx_ledger_project ON finance_ledger_entries(project_id);
      CREATE INDEX IF NOT EXISTS idx_ledger_workstream ON finance_ledger_entries(workstream_id);
      CREATE INDEX IF NOT EXISTS idx_ledger_period ON finance_ledger_entries(period_year, period_month);
      CREATE INDEX IF NOT EXISTS idx_ledger_wbse ON finance_ledger_entries(wbse);
    `);

    // Schema migrations based on user_version
    if (current < 4) {
      db.exec('PRAGMA user_version = 4');
    }
    
    // Migration for PAT token expiry date (version 5)
    if (current < 5) {
      try {
        // Add pat_token_expiry_date column if it doesn't exist
        const columns = db.prepare(`PRAGMA table_info(ado_config)`).all();
        const hasExpiryColumn = columns.some((col: any) => col.name === 'pat_token_expiry_date');
        
        if (!hasExpiryColumn) {
          db.exec('ALTER TABLE ado_config ADD COLUMN pat_token_expiry_date TEXT');
          console.log('Added pat_token_expiry_date column to ado_config table');
        }
        
        db.exec('PRAGMA user_version = 5');
        console.log('Database schema updated to version 5 (PAT expiry tracking)');
      } catch (error) {
        console.error('Failed to add PAT expiry date column:', error);
        // Continue without failing - the column might already exist
      }
    }
    
    // Migration for Project Coordinator tables (version 6)
    if (current < 6) {
      try {
        // Tables already created above via CREATE TABLE IF NOT EXISTS
        db.exec('PRAGMA user_version = 6');
        console.log('Database schema updated to version 6 (Project Coordinator tables)');
      } catch (error) {
        console.error('Failed to migrate to schema version 6:', error);
      }
    }
    
    // TEMPORARILY DISABLED - Migration for Project Governance module (version 7)
    // Skip this migration until Governance module type issues are resolved
    if (current < 7) {
      try {
        console.log('Skipping migration to version 7 (Governance module temporarily disabled)');
        
        // DISABLED: All governance migration code until type issues resolved
        // Skip to version 7 to prevent repeated attempts
        db.exec('PRAGMA user_version = 7');
        console.log('Skipped version 7 migration - Governance module temporarily disabled');
      } catch (error) {
        console.error('Failed to migrate to schema version 7:', error);
        throw error;
      }
    }
  })();

  console.log('Database schema initialized successfully');
}
