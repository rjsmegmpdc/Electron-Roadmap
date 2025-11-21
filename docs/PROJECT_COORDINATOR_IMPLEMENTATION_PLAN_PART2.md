# Project Coordinator Implementation Plan - Part 2

This is a continuation of the main implementation plan. This contains Phases 6-8.

---

## Phase 6: Finance & Reporting (Week 6)

**Estimated Time:** 20 hours  
**Goal:** Build finance ledger and P&L calculation

### Step 6.1: Finance Ledger Service (10 hours)

**File:** `app/main/services/coordinator/FinanceLedgerService.ts`

```typescript
// app/main/services/coordinator/FinanceLedgerService.ts
import { DB } from '../../db';
import type { FinanceLedgerEntry } from '../../types/coordinator';

export class FinanceLedgerService {
  constructor(private db: DB) {}

  /**
   * Calculate P&L for a project in a given period
   */
  async calculateProjectPnL(
    projectId: string,
    startDate: string, // DD-MM-YYYY
    endDate: string
  ): Promise<{
    forecast: number;
    actual: number;
    variance: number;
    by_type: Record<string, { forecast: number; actual: number; variance: number }>;
  }> {
    // Parse dates
    const [startDay, startMonth, startYear] = startDate.split('-').map(Number);
    const [endDay, endMonth, endYear] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    // Get all ledger entries in this period
    const entries = this.db.prepare(`
      SELECT 
        expenditure_type,
        SUM(forecast_amount) as total_forecast,
        SUM(actual_amount) as total_actual,
        SUM(variance_amount) as total_variance
      FROM finance_ledger_entries
      WHERE project_id = ?
        AND period_year * 100 + CAST(
          CASE period_month
            WHEN 'January' THEN 1
            WHEN 'February' THEN 2
            WHEN 'March' THEN 3
            WHEN 'April' THEN 4
            WHEN 'May' THEN 5
            WHEN 'June' THEN 6
            WHEN 'July' THEN 7
            WHEN 'August' THEN 8
            WHEN 'September' THEN 9
            WHEN 'October' THEN 10
            WHEN 'November' THEN 11
            WHEN 'December' THEN 12
          END AS INTEGER
        ) >= ?
        AND period_year * 100 + CAST(
          CASE period_month
            WHEN 'January' THEN 1
            WHEN 'February' THEN 2
            WHEN 'March' THEN 3
            WHEN 'April' THEN 4
            WHEN 'May' THEN 5
            WHEN 'June' THEN 6
            WHEN 'July' THEN 7
            WHEN 'August' THEN 8
            WHEN 'September' THEN 9
            WHEN 'October' THEN 10
            WHEN 'November' THEN 11
            WHEN 'December' THEN 12
          END AS INTEGER
        ) <= ?
      GROUP BY expenditure_type
    `).all(
      projectId,
      startYear * 100 + startMonth,
      endYear * 100 + endMonth
    ) as any[];

    const by_type: Record<string, any> = {};
    let totalForecast = 0;
    let totalActual = 0;
    let totalVariance = 0;

    entries.forEach(entry => {
      by_type[entry.expenditure_type] = {
        forecast: entry.total_forecast || 0,
        actual: entry.total_actual || 0,
        variance: entry.total_variance || 0
      };
      totalForecast += entry.total_forecast || 0;
      totalActual += entry.total_actual || 0;
      totalVariance += entry.total_variance || 0;
    });

    return {
      forecast: totalForecast,
      actual: totalActual,
      variance: totalVariance,
      by_type
    };
  }

  /**
   * Generate ledger entries from allocations and timesheets
   */
  async generateLedgerEntries(projectId: string, periodMonth: string, periodYear: number): Promise<void> {
    const now = new Date().toISOString();
    const fiscalYear = this.getFiscalYear(periodMonth, periodYear);

    // Get project WBSE
    const projectFinDetail = this.db.prepare(`
      SELECT wbse FROM project_financial_detail WHERE project_id = ?
    `).get(projectId) as any;

    if (!projectFinDetail) {
      throw new Error(`No financial detail found for project ${projectId}`);
    }

    const wbse = projectFinDetail.wbse;

    // Generate entries from feature allocations (forecast)
    const allocations = this.db.prepare(`
      SELECT 
        fa.allocated_hours,
        fa.actual_hours_to_date,
        fr.activity_type_cap,
        lr.hourly_rate
      FROM feature_allocations fa
      JOIN financial_resources fr ON fr.id = fa.resource_id
      JOIN raw_labour_rates lr ON lr.activity_type = fr.activity_type_cap
      WHERE fa.project_id = ?
    `).all(projectId);

    let totalForecast = 0;
    let totalActual = 0;

    for (const alloc of allocations as any[]) {
      const forecastAmount = alloc.allocated_hours * alloc.hourly_rate;
      const actualAmount = alloc.actual_hours_to_date * alloc.hourly_rate;
      totalForecast += forecastAmount;
      totalActual += actualAmount;
    }

    // Check if entry already exists
    const existing = this.db.prepare(`
      SELECT id FROM finance_ledger_entries
      WHERE project_id = ? 
        AND period_month = ? 
        AND period_year = ?
        AND expenditure_type = 'Capped Labour'
    `).get(projectId, periodMonth, periodYear) as any;

    if (existing) {
      // Update
      this.db.prepare(`
        UPDATE finance_ledger_entries
        SET forecast_amount = ?,
            actual_amount = ?,
            variance_amount = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        totalForecast,
        totalActual,
        totalActual - totalForecast,
        now,
        existing.id
      );
    } else {
      // Insert
      this.db.prepare(`
        INSERT INTO finance_ledger_entries (
          project_id, wbse, period_month, period_year, fiscal_year,
          budget_type, expenditure_type, forecast_amount, actual_amount,
          variance_amount, source_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectId,
        wbse,
        periodMonth,
        periodYear,
        fiscalYear,
        'CAPEX',
        'Capped Labour',
        totalForecast,
        totalActual,
        totalActual - totalForecast,
        'allocation',
        now,
        now
      );
    }

    // Generate entries from raw_actuals (software/hardware)
    await this.generateActualsEntries(projectId, wbse, periodMonth, periodYear, fiscalYear);
  }

  /**
   * Generate ledger entries from actuals
   */
  private async generateActualsEntries(
    projectId: string,
    wbse: string,
    periodMonth: string,
    periodYear: number,
    fiscalYear: string
  ): Promise<void> {
    const now = new Date().toISOString();

    // Software
    const software = this.db.prepare(`
      SELECT SUM(value_in_obj_crcy) as total
      FROM raw_actuals
      WHERE project_id = ?
        AND cost_element LIKE '115%'
        AND month = ?
        AND fiscal_year = ?
    `).get(projectId, periodMonth, periodYear) as any;

    if (software && software.total) {
      const existing = this.db.prepare(`
        SELECT id FROM finance_ledger_entries
        WHERE project_id = ? 
          AND period_month = ? 
          AND period_year = ?
          AND expenditure_type = 'Software'
      `).get(projectId, periodMonth, periodYear) as any;

      if (existing) {
        this.db.prepare(`
          UPDATE finance_ledger_entries
          SET actual_amount = ?,
              variance_amount = actual_amount - forecast_amount,
              updated_at = ?
          WHERE id = ?
        `).run(software.total, now, existing.id);
      } else {
        this.db.prepare(`
          INSERT INTO finance_ledger_entries (
            project_id, wbse, period_month, period_year, fiscal_year,
            budget_type, expenditure_type, forecast_amount, actual_amount,
            variance_amount, source_type, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId, wbse, periodMonth, periodYear, fiscalYear,
          'CAPEX', 'Software', 0, software.total, software.total,
          'actuals', now, now
        );
      }
    }

    // Hardware
    const hardware = this.db.prepare(`
      SELECT SUM(value_in_obj_crcy) as total
      FROM raw_actuals
      WHERE project_id = ?
        AND cost_element LIKE '116%'
        AND month = ?
        AND fiscal_year = ?
    `).get(projectId, periodMonth, periodYear) as any;

    if (hardware && hardware.total) {
      const existing = this.db.prepare(`
        SELECT id FROM finance_ledger_entries
        WHERE project_id = ? 
          AND period_month = ? 
          AND period_year = ?
          AND expenditure_type = 'Hardware'
      `).get(projectId, periodMonth, periodYear) as any;

      if (existing) {
        this.db.prepare(`
          UPDATE finance_ledger_entries
          SET actual_amount = ?,
              variance_amount = actual_amount - forecast_amount,
              updated_at = ?
          WHERE id = ?
        `).run(hardware.total, now, existing.id);
      } else {
        this.db.prepare(`
          INSERT INTO finance_ledger_entries (
            project_id, wbse, period_month, period_year, fiscal_year,
            budget_type, expenditure_type, forecast_amount, actual_amount,
            variance_amount, source_type, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId, wbse, periodMonth, periodYear, fiscalYear,
          'CAPEX', 'Hardware', 0, hardware.total, hardware.total,
          'actuals', now, now
        );
      }
    }
  }

  /**
   * Get fiscal year from calendar month
   */
  private getFiscalYear(month: string, year: number): string {
    const monthNum = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(month) + 1;

    // Assuming FY starts in April (adjust as needed)
    if (monthNum >= 4) {
      return `FY${String(year + 1).slice(-2)}`;
    } else {
      return `FY${String(year).slice(-2)}`;
    }
  }

  /**
   * Get ledger entries for a project
   */
  async getLedgerEntries(projectId: string): Promise<FinanceLedgerEntry[]> {
    return this.db.prepare(`
      SELECT * FROM finance_ledger_entries
      WHERE project_id = ?
      ORDER BY period_year DESC, 
        CASE period_month
          WHEN 'January' THEN 1
          WHEN 'February' THEN 2
          WHEN 'March' THEN 3
          WHEN 'April' THEN 4
          WHEN 'May' THEN 5
          WHEN 'June' THEN 6
          WHEN 'July' THEN 7
          WHEN 'August' THEN 8
          WHEN 'September' THEN 9
          WHEN 'October' THEN 10
          WHEN 'November' THEN 11
          WHEN 'December' THEN 12
        END DESC
    `).all(projectId) as FinanceLedgerEntry[];
  }
}
```

### Step 6.2: Project Finance Tab UI (10 hours)

**File:** `app/renderer/components/coordinator/ProjectFinanceTab.tsx`

```tsx
// app/renderer/components/coordinator/ProjectFinanceTab.tsx
import React, { useEffect, useState } from 'react';
import type { ProjectFinancialDetail, FinanceLedgerEntry } from '../../../main/types/coordinator';

interface ProjectFinanceTabProps {
  projectId: string;
}

export function ProjectFinanceTab({ projectId }: ProjectFinanceTabProps) {
  const [detail, setDetail] = useState<ProjectFinancialDetail | null>(null);
  const [ledger, setLedger] = useState<FinanceLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceData();
  }, [projectId]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const detailData = await window.electron.ipcRenderer.invoke(
        'coordinator:getProjectFinancialDetail',
        projectId
      );
      const ledgerData = await window.electron.ipcRenderer.invoke(
        'coordinator:getLedgerEntries',
        projectId
      );

      setDetail(detailData);
      setLedger(ledgerData);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading finance data...</div>;
  }

  if (!detail) {
    return <div className="error">No financial data found for this project</div>;
  }

  const variancePercent = detail.original_budget_nzd > 0
    ? (detail.variance_nzd / detail.original_budget_nzd) * 100
    : 0;

  return (
    <div className="project-finance-tab">
      <h2>Financial Details</h2>

      {/* Summary Section */}
      <div className="finance-summary">
        <div className="summary-card">
          <label>Sentinel Number</label>
          <div className="value">{detail.sentinel_number || 'N/A'}</div>
        </div>

        <div className="summary-card">
          <label>WBSE</label>
          <div className="value">{detail.wbse}</div>
          {detail.wbse_desc && <div className="description">{detail.wbse_desc}</div>}
        </div>

        <div className="summary-card">
          <label>SAP Code</label>
          <div className="value">{detail.sap_code || 'N/A'}</div>
        </div>

        <div className="summary-card">
          <label>IO Code</label>
          <div className="value">{detail.io_code || 'N/A'}</div>
        </div>
      </div>

      {/* Budget Section */}
      <div className="budget-section">
        <h3>Budget Overview</h3>
        
        <div className="budget-cards">
          <div className="budget-card">
            <label>Original Budget</label>
            <div className="amount">${detail.original_budget_nzd.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="budget-card">
            <label>Forecast Budget</label>
            <div className="amount">${detail.forecast_budget_nzd.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="budget-card">
            <label>Actual Cost</label>
            <div className="amount">${detail.actual_cost_nzd.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className={`budget-card ${detail.variance_nzd < 0 ? 'negative' : 'positive'}`}>
            <label>Variance</label>
            <div className="amount">
              ${Math.abs(detail.variance_nzd).toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
              <span className="percent">({variancePercent.toFixed(1)}%)</span>
            </div>
            {detail.variance_nzd < 0 ? (
              <div className="status over">Over Budget</div>
            ) : detail.variance_nzd > 0 ? (
              <div className="status under">Under Budget</div>
            ) : (
              <div className="status on-track">On Track</div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Section */}
      <div className="ledger-section">
        <h3>Finance Ledger</h3>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Type</th>
              <th>Budget Type</th>
              <th>Forecast</th>
              <th>Actual</th>
              <th>Variance</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.period_month} {entry.period_year}</td>
                <td>{entry.expenditure_type}</td>
                <td>
                  <span className={`badge ${entry.budget_type.toLowerCase()}`}>
                    {entry.budget_type}
                  </span>
                </td>
                <td className="amount">${entry.forecast_amount.toLocaleString('en-NZ')}</td>
                <td className="amount">${entry.actual_amount.toLocaleString('en-NZ')}</td>
                <td className={`amount ${entry.variance_amount < 0 ? 'negative' : 'positive'}`}>
                  ${Math.abs(entry.variance_amount).toLocaleString('en-NZ')}
                </td>
                <td>
                  <span className="source">{entry.source_type || 'manual'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {ledger.length === 0 && (
          <div className="empty-state">
            No ledger entries found. Generate entries by importing timesheets and actuals.
          </div>
        )}
      </div>
    </div>
  );
}
```

**✅ Phase 6 Checklist:**
- [ ] FinanceLedgerService generates entries from allocations
- [ ] FinanceLedgerService generates entries from actuals
- [ ] P&L calculation works for projects
- [ ] Project Finance Tab displays all financial data
- [ ] Budget variance calculations correct
- [ ] Ledger entries display correctly

---

## Phase 7-8: UI & Testing (Weeks 7-8)

**Estimated Time:** 40 hours  
**Goal:** Build remaining UI components and complete testing

### Step 7.1: Import Manager UI (8 hours)

**File:** `app/renderer/components/coordinator/ImportManager.tsx`

```tsx
// app/renderer/components/coordinator/ImportManager.tsx
import React, { useState } from 'react';
import type { ImportResult } from '../../../main/types/coordinator';

export function ImportManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'timesheets' | 'actuals' | 'labour-rates'>('timesheets');
  const [fiscalYear, setFiscalYear] = useState('FY26');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setResult(null);

    try {
      // Read file content
      const text = await selectedFile.text();

      // Call appropriate IPC handler
      let importResult: ImportResult;
      
      switch (importType) {
        case 'timesheets':
          importResult = await window.electron.ipcRenderer.invoke(
            'coordinator:importTimesheets',
            text
          );
          break;
        
        case 'actuals':
          importResult = await window.electron.ipcRenderer.invoke(
            'coordinator:importActuals',
            text
          );
          break;
        
        case 'labour-rates':
          importResult = await window.electron.ipcRenderer.invoke(
            'coordinator:importLabourRates',
            text,
            fiscalYear
          );
          break;
      }

      setResult(importResult);
    } catch (error: any) {
      setResult({
        success: false,
        recordsProcessed: 0,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [{ row: 0, message: error.message, severity: 'error' }],
        warnings: []
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="import-manager">
      <h2>Import Financial Data</h2>

      <div className="import-form">
        <div className="form-group">
          <label htmlFor="import-type">Import Type</label>
          <select
            id="import-type"
            value={importType}
            onChange={(e) => setImportType(e.target.value as any)}
          >
            <option value="timesheets">Timesheets (SAP CATS)</option>
            <option value="actuals">Actuals (SAP FI)</option>
            <option value="labour-rates">Labour Rates</option>
          </select>
        </div>

        {importType === 'labour-rates' && (
          <div className="form-group">
            <label htmlFor="fiscal-year">Fiscal Year</label>
            <input
              id="fiscal-year"
              type="text"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="FY26"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="file-input">CSV File</label>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
          />
          {selectedFile && (
            <div className="file-info">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={!selectedFile || importing}
          className="btn btn-primary"
        >
          {importing ? 'Importing...' : 'Import'}
        </button>
      </div>

      {result && (
        <div className={`import-result ${result.success ? 'success' : 'error'}`}>
          <h3>Import Result</h3>

          <div className="result-summary">
            <div className="stat">
              <label>Processed</label>
              <div className="value">{result.recordsProcessed}</div>
            </div>
            <div className="stat">
              <label>Imported</label>
              <div className="value success">{result.recordsImported}</div>
            </div>
            <div className="stat">
              <label>Failed</label>
              <div className="value error">{result.recordsFailed}</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="errors">
              <h4>Errors ({result.errors.length})</h4>
              <div className="error-list">
                {result.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className={`error-item ${error.severity}`}>
                    <span className="row">Row {error.row}</span>
                    {error.field && <span className="field">{error.field}</span>}
                    <span className="message">{error.message}</span>
                  </div>
                ))}
                {result.errors.length > 10 && (
                  <div className="more">... and {result.errors.length - 10} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 7.2: Capacity Dashboard (8 hours)

**File:** `app/renderer/components/coordinator/CapacityDashboard.tsx`

```tsx
// app/renderer/components/coordinator/CapacityDashboard.tsx
import React, { useEffect, useState } from 'react';
import type { CapacityCalculation } from '../../../main/types/coordinator';

export function CapacityDashboard() {
  const [capacities, setCapacities] = useState<CapacityCalculation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCapacityData();
  }, []);

  const loadCapacityData = async () => {
    setLoading(true);
    try {
      const data = await window.electron.ipcRenderer.invoke(
        'coordinator:getAllCapacities'
      );
      setCapacities(data);
    } catch (error) {
      console.error('Failed to load capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading capacity data...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under-utilized': return '#FFA500';
      case 'optimal': return '#28A745';
      case 'over-committed': return '#DC3545';
      default: return '#6C757D';
    }
  };

  return (
    <div className="capacity-dashboard">
      <h2>Resource Capacity Overview</h2>

      <div className="capacity-grid">
        {capacities.map((capacity) => (
          <div key={capacity.resource_id} className="capacity-card">
            <div className="card-header">
              <h3>{capacity.resource_name}</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(capacity.status) }}
              >
                {capacity.status.replace('-', ' ')}
              </span>
            </div>

            <div className="capacity-bar">
              <div 
                className="capacity-fill"
                style={{ 
                  width: `${Math.min(capacity.utilization_percent, 100)}%`,
                  backgroundColor: getStatusColor(capacity.status)
                }}
              />
            </div>

            <div className="capacity-stats">
              <div className="stat">
                <label>Total Capacity</label>
                <div className="value">{capacity.total_capacity_hours.toFixed(1)}h</div>
              </div>
              <div className="stat">
                <label>Allocated</label>
                <div className="value">{capacity.allocated_hours.toFixed(1)}h</div>
              </div>
              <div className="stat">
                <label>Actual</label>
                <div className="value">{capacity.actual_hours.toFixed(1)}h</div>
              </div>
              <div className="stat">
                <label>Remaining</label>
                <div className="value">{capacity.remaining_capacity.toFixed(1)}h</div>
              </div>
            </div>

            <div className="utilization">
              <label>Utilization</label>
              <div className="percent">{capacity.utilization_percent.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>

      {capacities.length === 0 && (
        <div className="empty-state">
          No capacity data found. Create resource commitments to see capacity calculations.
        </div>
      )}
    </div>
  );
}
```

### Step 7.3: Variance Alert Dashboard (8 hours)

**File:** `app/renderer/components/coordinator/VarianceAlertDashboard.tsx`

```tsx
// app/renderer/components/coordinator/VarianceAlertDashboard.tsx
import React, { useEffect, useState } from 'react';
import type { VarianceAlert } from '../../../main/types/coordinator';

export function VarianceAlertDashboard() {
  const [alerts, setAlerts] = useState<VarianceAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await window.electron.ipcRenderer.invoke(
        'coordinator:getUnacknowledgedAlerts'
      );
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await window.electron.ipcRenderer.invoke(
        'coordinator:acknowledgeAlert',
        alertId,
        'current-user' // Replace with actual user
      );
      // Remove from list
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '🔵';
    }
  };

  if (loading) {
    return <div className="loading">Loading alerts...</div>;
  }

  return (
    <div className="variance-alert-dashboard">
      <div className="dashboard-header">
        <h2>Variance Alerts</h2>
        
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({alerts.length})
          </button>
          <button 
            className={filter === 'critical' ? 'active' : ''}
            onClick={() => setFilter('critical')}
          >
            Critical ({alerts.filter(a => a.severity === 'critical').length})
          </button>
          <button 
            className={filter === 'high' ? 'active' : ''}
            onClick={() => setFilter('high')}
          >
            High ({alerts.filter(a => a.severity === 'high').length})
          </button>
          <button 
            className={filter === 'medium' ? 'active' : ''}
            onClick={() => setFilter('medium')}
          >
            Medium ({alerts.filter(a => a.severity === 'medium').length})
          </button>
        </div>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className={`alert-card ${alert.severity}`}>
            <div className="alert-header">
              <span className="severity-icon">{getSeverityIcon(alert.severity)}</span>
              <span className="alert-type">{alert.alert_type}</span>
              <span className="entity-type">{alert.entity_type}</span>
            </div>

            <div className="alert-message">{alert.message}</div>

            {alert.variance_amount !== undefined && (
              <div className="variance-info">
                <span className="variance-amount">
                  {alert.variance_amount.toFixed(1)}
                </span>
                {alert.variance_percent !== undefined && (
                  <span className="variance-percent">
                    ({alert.variance_percent.toFixed(1)}%)
                  </span>
                )}
              </div>
            )}

            {alert.details && (
              <div className="alert-details">
                <pre>{JSON.stringify(alert.details, null, 2)}</pre>
              </div>
            )}

            <div className="alert-actions">
              <span className="created-at">
                {new Date(alert.created_at).toLocaleString()}
              </span>
              <button 
                className="btn btn-sm"
                onClick={() => handleAcknowledge(alert.id)}
              >
                Acknowledge
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="empty-state">
          No {filter !== 'all' ? filter : ''} alerts found.
        </div>
      )}
    </div>
  );
}
```

### Step 7.4: IPC Handlers (8 hours)

**File:** `app/main/ipc/coordinatorHandlers.ts`

```typescript
// app/main/ipc/coordinatorHandlers.ts
import { ipcMain } from 'electron';
import { db } from '../db';
import { TimesheetImportService } from '../services/coordinator/TimesheetImportService';
import { ActualsImportService } from '../services/coordinator/ActualsImportService';
import { LabourRatesImportService } from '../services/coordinator/LabourRatesImportService';
import { ResourceCommitmentService } from '../services/coordinator/ResourceCommitmentService';
import { AllocationService } from '../services/coordinator/AllocationService';
import { AdoSyncService } from '../services/coordinator/AdoSyncService';
import { VarianceDetectionService } from '../services/coordinator/VarianceDetectionService';
import { FinanceLedgerService } from '../services/coordinator/FinanceLedgerService';

export function registerCoordinatorHandlers() {
  const timesheetService = new TimesheetImportService(db);
  const actualsService = new ActualsImportService(db);
  const labourRatesService = new LabourRatesImportService(db);
  const commitmentService = new ResourceCommitmentService(db);
  const allocationService = new AllocationService(db);
  const varianceService = new VarianceDetectionService(db);
  const ledgerService = new FinanceLedgerService(db);

  // Import handlers
  ipcMain.handle('coordinator:importTimesheets', async (_, csvData: string) => {
    return await timesheetService.importTimesheets(csvData);
  });

  ipcMain.handle('coordinator:importActuals', async (_, csvData: string) => {
    return await actualsService.importActuals(csvData);
  });

  ipcMain.handle('coordinator:importLabourRates', async (_, csvData: string, fiscalYear: string) => {
    return await labourRatesService.importLabourRates(csvData, fiscalYear);
  });

  // Commitment handlers
  ipcMain.handle('coordinator:createCommitment', async (_, data) => {
    return await commitmentService.createCommitment(data);
  });

  ipcMain.handle('coordinator:getCapacityCalculation', async (_, resourceId: number, start: string, end: string) => {
    return await commitmentService.getCapacityCalculation(resourceId, start, end);
  });

  ipcMain.handle('coordinator:getAllCapacities', async () => {
    // Get all resources with commitments
    const commitments = db.prepare(`
      SELECT DISTINCT rc.resource_id, rc.period_start, rc.period_end
      FROM resource_commitments rc
    `).all() as any[];

    const capacities = [];
    for (const commitment of commitments) {
      try {
        const capacity = await commitmentService.getCapacityCalculation(
          commitment.resource_id,
          commitment.period_start,
          commitment.period_end
        );
        capacities.push(capacity);
      } catch (error) {
        console.error(`Failed to calculate capacity for resource ${commitment.resource_id}:`, error);
      }
    }

    return capacities;
  });

  // Allocation handlers
  ipcMain.handle('coordinator:createAllocation', async (_, data) => {
    return await allocationService.createAllocation(data);
  });

  ipcMain.handle('coordinator:getAllocationsForFeature', async (_, featureId: string) => {
    return await allocationService.getAllocationsForFeature(featureId);
  });

  // Variance handlers
  ipcMain.handle('coordinator:detectAllVariances', async () => {
    return await varianceService.detectAllVariances();
  });

  ipcMain.handle('coordinator:getUnacknowledgedAlerts', async () => {
    return await varianceService.getUnacknowledgedAlerts();
  });

  ipcMain.handle('coordinator:acknowledgeAlert', async (_, alertId: string, userId: string) => {
    return await varianceService.acknowledgeAlert(alertId, userId);
  });

  // Ledger handlers
  ipcMain.handle('coordinator:generateLedgerEntries', async (_, projectId: string, month: string, year: number) => {
    return await ledgerService.generateLedgerEntries(projectId, month, year);
  });

  ipcMain.handle('coordinator:getLedgerEntries', async (_, projectId: string) => {
    return await ledgerService.getLedgerEntries(projectId);
  });

  ipcMain.handle('coordinator:calculateProjectPnL', async (_, projectId: string, start: string, end: string) => {
    return await ledgerService.calculateProjectPnL(projectId, start, end);
  });

  ipcMain.handle('coordinator:getProjectFinancialDetail', async (_, projectId: string) => {
    return db.prepare(`
      SELECT * FROM project_financial_detail WHERE project_id = ?
    `).get(projectId);
  });
}
```

Register in `app/main/index.ts`:

```typescript
import { registerCoordinatorHandlers } from './ipc/coordinatorHandlers';

// After app ready
registerCoordinatorHandlers();
```

### Step 7.5: E2E Tests (8 hours)

**File:** `tests/e2e/coordinator.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Project Coordinator E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to coordinator section
    await page.click('[data-testid="coordinator-menu"]');
  });

  test('should import timesheets', async ({ page }) => {
    await page.click('[data-testid="import-manager"]');
    
    // Select import type
    await page.selectOption('[data-testid="import-type"]', 'timesheets');
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/sample-timesheets.csv');
    
    // Click import
    await page.click('[data-testid="import-button"]');
    
    // Wait for result
    await page.waitForSelector('.import-result.success', { timeout: 10000 });
    
    // Check result
    const imported = await page.textContent('[data-testid="records-imported"]');
    expect(Number(imported)).toBeGreaterThan(0);
  });

  test('should create resource commitment', async ({ page }) => {
    await page.click('[data-testid="commitments-tab"]');
    
    // Fill form
    await page.selectOption('[data-testid="resource-select"]', '1');
    await page.fill('[data-testid="period-start"]', '01-04-2025');
    await page.fill('[data-testid="period-end"]', '30-06-2025');
    await page.fill('[data-testid="committed-hours"]', '8');
    await page.selectOption('[data-testid="commitment-type"]', 'per-day');
    
    // Submit
    await page.click('[data-testid="create-commitment-button"]');
    
    // Check success
    await page.waitForSelector('.commitment-card', { timeout: 5000 });
    const commitments = await page.locator('.commitment-card').count();
    expect(commitments).toBeGreaterThan(0);
  });

  test('should display capacity dashboard', async ({ page }) => {
    await page.click('[data-testid="capacity-dashboard"]');
    
    // Wait for data to load
    await page.waitForSelector('.capacity-card', { timeout: 5000 });
    
    // Check capacity cards exist
    const cards = await page.locator('.capacity-card').count();
    expect(cards).toBeGreaterThan(0);
    
    // Check first card has required elements
    const firstCard = page.locator('.capacity-card').first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('.capacity-bar')).toBeVisible();
    await expect(firstCard.locator('.utilization')).toBeVisible();
  });

  test('should display variance alerts', async ({ page }) => {
    await page.click('[data-testid="alerts-dashboard"]');
    
    // Wait for alerts to load
    await page.waitForSelector('.alert-card, .empty-state', { timeout: 5000 });
    
    // If alerts exist, check structure
    const alertCount = await page.locator('.alert-card').count();
    if (alertCount > 0) {
      const firstAlert = page.locator('.alert-card').first();
      await expect(firstAlert.locator('.alert-message')).toBeVisible();
      await expect(firstAlert.locator('.alert-actions')).toBeVisible();
      
      // Test acknowledge
      await firstAlert.locator('[data-testid="acknowledge-button"]').click();
      await page.waitForTimeout(1000);
      
      // Alert should be removed
      const newCount = await page.locator('.alert-card').count();
      expect(newCount).toBe(alertCount - 1);
    }
  });

  test('should display project finance tab', async ({ page }) => {
    // Navigate to project detail
    await page.click('[data-testid="projects-menu"]');
    await page.click('.project-card').first();
    
    // Click finance tab
    await page.click('[data-testid="finance-tab"]');
    
    // Wait for finance data
    await page.waitForSelector('.finance-summary, .empty-state', { timeout: 5000 });
    
    // Check summary cards
    const summaryCards = await page.locator('.summary-card').count();
    expect(summaryCards).toBeGreaterThanOrEqual(3);
    
    // Check budget section
    await expect(page.locator('.budget-section')).toBeVisible();
  });
});
```

**✅ Phase 7-8 Checklist:**
- [ ] Import Manager UI functional
- [ ] Capacity Dashboard displays all resources
- [ ] Variance Alert Dashboard shows alerts
- [ ] Project Finance Tab displays correctly
- [ ] All IPC handlers registered
- [ ] E2E tests pass
- [ ] Manual testing completed

---

## Testing Checklist

### Unit Tests
- [ ] Database schema tests pass
- [ ] CSV parser tests pass
- [ ] All import service tests pass
- [ ] Resource commitment service tests pass
- [ ] Allocation service tests pass
- [ ] ADO sync service tests pass
- [ ] Variance detection service tests pass
- [ ] Finance ledger service tests pass

### Integration Tests
- [ ] Can import real CSV files
- [ ] Timesheet → Allocation linkage works
- [ ] Actual → Ledger entries work
- [ ] ADO sync creates allocations
- [ ] Variance detection generates alerts
- [ ] P&L calculation accurate

### E2E Tests
- [ ] Import workflow end-to-end
- [ ] Commitment creation flow
- [ ] Capacity dashboard loads
- [ ] Alert acknowledgement works
- [ ] Finance tab displays correctly

### Manual Testing
- [ ] Import sample timesheets
- [ ] Import sample actuals
- [ ] Import labour rates
- [ ] Create resource commitments
- [ ] Create feature allocations
- [ ] Trigger variance detection
- [ ] Generate ledger entries
- [ ] View all dashboards

---

## Common Pitfalls & Solutions

### 1. CSV Import Issues

**Problem:** Import fails with "Missing required field"
**Solution:** Check CSV headers match exactly (case-sensitive). Use the CSV parser's error output to identify mismatches.

**Problem:** Date parsing fails
**Solution:** Ensure dates are in DD-MM-YYYY format. Use `parseNZDate()` utility.

### 2. Foreign Key Violations

**Problem:** Insert fails with foreign key constraint
**Solution:** Ensure parent records exist before inserting child records. Use transactions to maintain consistency.

### 3. Working Days Calculation

**Problem:** Working days calculation incorrect
**Solution:** Verify public holidays table is populated. Check weekend detection logic (day 0 = Sunday, 6 = Saturday).

### 4. ADO Sync Issues

**Problem:** ADO work items not syncing
**Solution:** Check ADO API credentials in settings. Verify work item ID exists. Check network connectivity.

### 5. Variance Detection False Positives

**Problem:** Too many variance alerts
**Solution:** Adjust variance thresholds. Create entity-specific thresholds for sensitive projects/resources.

### 6. Performance Issues

**Problem:** Database queries slow with large data
**Solution:** Ensure indexes are created. Use EXPLAIN QUERY PLAN to optimize slow queries. Consider pagination for large result sets.

### 7. TypeScript Errors

**Problem:** Type mismatches in services
**Solution:** Ensure all types in `coordinator.ts` match database schema. Use strict null checks.

---

## Completion Criteria

The Project Coordinator module is complete when:

1. ✅ All 12 database tables created
2. ✅ All import services (timesheets, actuals, labour rates) functional
3. ✅ Resource commitment and allocation system working
4. ✅ ADO integration syncing work items
5. ✅ Variance detection generating alerts
6. ✅ Finance ledger and P&L calculation accurate
7. ✅ All UI components functional
8. ✅ All unit tests passing
9. ✅ All E2E tests passing
10. ✅ Manual testing completed with real data

---

## Next Steps After Completion

1. **Performance Optimization**
   - Add database indexes for slow queries
   - Implement pagination for large lists
   - Add caching for frequently accessed data

2. **Enhanced Features**
   - Export reports to Excel
   - Email notifications for critical alerts
   - Batch operations for imports
   - Historical trend analysis

3. **Documentation**
   - User guide for finance team
   - API documentation for services
   - Troubleshooting guide

4. **Monitoring**
   - Add logging for critical operations
   - Implement error tracking
   - Add performance metrics

---

**End of Implementation Plan Part 2**
