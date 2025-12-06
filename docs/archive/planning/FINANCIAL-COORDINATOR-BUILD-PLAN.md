# Financial Coordinator UI Build Plan
## Step-by-step guide for junior developers

**Total Effort**: 3-4 weeks  
**Complexity**: Beginner-friendly (copy patterns, follow templates)  
**Prerequisites**: Know React basics, can read TypeScript, comfortable with forms

---

## 🎯 Phase Overview

| Phase | Focus | Duration | Difficulty |
|-------|-------|----------|------------|
| **Phase 0** | Foundation (copy patterns, understand flow) | 2-3 days | Easy |
| **Phase 1** | Import Manager UI (CSV upload) | 3-4 days | Easy |
| **Phase 2** | Resource Commitment Tracker | 5-6 days | Medium |
| **Phase 3** | Variance Alert Dashboard | 4-5 days | Medium |
| **Phase 4** | Project Finance Tab | 5-6 days | Medium |
| **Phase 5** | Polish & Testing | 3-4 days | Easy |

---

## Phase 0: Foundation (Days 1-2)
**Goal**: Understand the patterns, setup, and how to copy things correctly

### 0.1 Understand the Project Structure

**Read these files in order** (30 min):
1. `README.md` - Quick overview
2. `app/renderer/components/` - Browse existing components
3. `app/main/services/coordinator/` - See service patterns

**Key insight**: You'll be copying these patterns all week.

### 0.2 Examine an Existing Page Component

**Open**: `app/renderer/pages/` (pick any page like Dashboard or Projects)

**Note**:
- Every page imports from `../components/`
- Every page uses IPC to talk to backend via `window.electronAPI`
- Every page uses Zustand for state management
- Pages export TSX components

**Copy-paste this pattern** for all new pages.

### 0.3 Study the IPC Communication Pattern

**Read**: `app/main/ipc/coordinatorHandlers.ts` (2 min scan)

**Pattern you'll use**:
```typescript
// Frontend (React)
const result = await window.electronAPI.request('coordinator:import:timesheets', csvData);

// Backend (Electron)
ipcMain.handle('coordinator:import:timesheets', async (event, csvData) => {
  return await timesheetService.importTimesheets(csvData);
});
```

**Key point**: For each form, there's already a handler. You just call it.

### 0.4 Create Your Working File

Create `COORDINATOR-BUILD-CHECKLIST.md` in root with:
```markdown
# Build Progress

## Phase 0: Foundation
- [ ] Read README.md
- [ ] Browse existing components
- [ ] Examine Dashboard page
- [ ] Read coordinatorHandlers.ts
- [ ] Run `npm run dev` and verify app loads

## Phase 1: Import Manager
- [ ] Create ResourceImportPage.tsx
- [ ] Add form inputs
- [ ] Wire IPC calls
- [ ] Test with sample CSV

... etc
```

**Update this file as you go** - helps track progress.

---

## Phase 1: Import Manager UI (Days 3-6)
**Goal**: Build a simple form to import CSV files

### Why Start Here?
- ✅ Backend is 100% ready
- ✅ Simplest UI (just forms)
- ✅ Users need this immediately
- ✅ Great pattern practice

### 1.1 Create the Page Component

**File**: `app/renderer/pages/CoordinatorImport.tsx`

**Copy this template** and fill in:

```typescript
import React, { useState } from 'react';
import '../styles/coordinator.css'; // We'll create this

export const CoordinatorImport: React.FC = () => {
  // State for UI
  const [importType, setImportType] = useState<'timesheets' | 'actuals' | 'labour-rates'>('timesheets');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fiscalYear, setFiscalYear] = useState('FY26');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setSelectedFile(file || null);
  };

  // Handle import (call backend)
  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Read file as text
      const csvData = await selectedFile.text();

      // Call backend based on type
      let response;
      if (importType === 'timesheets') {
        response = await window.electronAPI.request('coordinator:import:timesheets', csvData);
      } else if (importType === 'actuals') {
        response = await window.electronAPI.request('coordinator:import:actuals', csvData);
      } else {
        response = await window.electronAPI.request('coordinator:import:labour-rates', { csvData, fiscalYear });
      }

      setResult(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="coordinator-import">
      <h1>Import Financial Data</h1>
      
      {/* Import Type Selector */}
      <div className="form-group">
        <label>Import Type</label>
        <select value={importType} onChange={(e) => setImportType(e.target.value as any)}>
          <option value="timesheets">SAP Timesheets</option>
          <option value="actuals">SAP Actuals</option>
          <option value="labour-rates">Labour Rates</option>
        </select>
      </div>

      {/* File Input */}
      <div className="form-group">
        <label>Select CSV File</label>
        <input type="file" accept=".csv" onChange={handleFileSelect} />
        {selectedFile && <p>Selected: {selectedFile.name}</p>}
      </div>

      {/* Fiscal Year (only for labour rates) */}
      {importType === 'labour-rates' && (
        <div className="form-group">
          <label>Fiscal Year</label>
          <input type="text" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="e.g., FY26" />
        </div>
      )}

      {/* Import Button */}
      <button onClick={handleImport} disabled={isLoading || !selectedFile}>
        {isLoading ? 'Importing...' : 'Import'}
      </button>

      {/* Error Display */}
      {error && <div className="error">{error}</div>}

      {/* Result Display */}
      {result && (
        <div className="result">
          <h2>Import Result</h2>
          <p>Processed: {result.processed}</p>
          <p>Imported: {result.imported}</p>
          <p>Failed: {result.failed}</p>
          {result.errors?.length > 0 && (
            <div className="errors">
              <h3>Errors:</h3>
              <ul>
                {result.errors.slice(0, 10).map((err: any, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

**Save this file, we'll refine it next.**

### 1.2 Add Basic Styling

**File**: `app/renderer/styles/coordinator.css`

```css
.coordinator-import {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.coordinator-import h1 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="file"],
.form-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  margin-top: 15px;
  padding: 10px 12px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 4px;
}

.result h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.result p {
  margin: 5px 0;
}

.errors {
  margin-top: 10px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.errors ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.errors li {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-size: 12px;
  color: #666;
}
```

### 1.3 Add Route

**File**: `app/renderer/components/App.tsx` or your router file

Look for where routes are defined and add:
```typescript
import { CoordinatorImport } from '../pages/CoordinatorImport';

// In your route list:
{ path: '/coordinator/import', component: CoordinatorImport }
// or similar based on your routing setup
```

### 1.4 Test It

1. Start app: `npm run dev`
2. Navigate to new page
3. Upload a small CSV file (create test-timesheets.csv with a few rows)
4. Click Import
5. See results

**✅ If import works, you've mastered the pattern**

---

## Phase 2: Resource Commitment Tracker (Days 7-12)
**Goal**: Form to create "I can commit X hours/day"

### Why This Next?
- ✅ Foundation for allocations
- ✅ Uses same pattern as Import Manager
- ✅ Teaches date handling (important skill)
- ✅ Only 4-5 form fields

### 2.1 Create the Component

**File**: `app/renderer/pages/ResourceCommitment.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import '../styles/coordinator.css';

interface Resource {
  id: number;
  resource_name: string;
}

export const ResourceCommitment: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [periodStart, setPeriodStart] = useState('01-04-2025'); // DD-MM-YYYY
  const [periodEnd, setPeriodEnd] = useState('30-06-2025');
  const [commitmentType, setCommitmentType] = useState<'per-day' | 'per-week' | 'per-fortnight'>('per-day');
  const [committedHours, setCommittedHours] = useState('6');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load resources on mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        const data = await window.electronAPI.request('coordinator:resources:list');
        setResources(data);
      } catch (err: any) {
        setError('Failed to load resources: ' + err.message);
      }
    };
    loadResources();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedResource || !periodStart || !periodEnd || !committedHours) {
      setError('Please fill all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.request('coordinator:commitment:create', {
        resource_id: parseInt(selectedResource),
        period_start: periodStart,
        period_end: periodEnd,
        commitment_type: commitmentType,
        committed_hours: parseFloat(committedHours),
      });

      setResult(response);
      // Reset form
      setSelectedResource('');
      setPeriodStart('01-04-2025');
      setPeriodEnd('30-06-2025');
      setCommittedHours('6');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="coordinator-commitment">
      <h1>Resource Commitment</h1>
      <p>Tell us: "I can commit X hours per [day/week/fortnight]"</p>

      <form onSubmit={handleSubmit}>
        {/* Resource Selection */}
        <div className="form-group">
          <label>Resource</label>
          <select 
            value={selectedResource} 
            onChange={(e) => setSelectedResource(e.target.value)}
            required
          >
            <option value="">-- Select Resource --</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.resource_name}
              </option>
            ))}
          </select>
        </div>

        {/* Period Start */}
        <div className="form-group">
          <label>Period Start (DD-MM-YYYY)</label>
          <input 
            type="text" 
            value={periodStart} 
            onChange={(e) => setPeriodStart(e.target.value)}
            placeholder="01-04-2025"
            required
          />
        </div>

        {/* Period End */}
        <div className="form-group">
          <label>Period End (DD-MM-YYYY)</label>
          <input 
            type="text" 
            value={periodEnd} 
            onChange={(e) => setPeriodEnd(e.target.value)}
            placeholder="30-06-2025"
            required
          />
        </div>

        {/* Commitment Type */}
        <div className="form-group">
          <label>Per</label>
          <select 
            value={commitmentType} 
            onChange={(e) => setCommitmentType(e.target.value as any)}
          >
            <option value="per-day">Day</option>
            <option value="per-week">Week</option>
            <option value="per-fortnight">Fortnight</option>
          </select>
        </div>

        {/* Committed Hours */}
        <div className="form-group">
          <label>Committed Hours</label>
          <input 
            type="number" 
            value={committedHours} 
            onChange={(e) => setCommittedHours(e.target.value)}
            min="0"
            step="0.5"
            required
          />
        </div>

        {/* Submit */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Commitment'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <h2>Commitment Created</h2>
          <p><strong>Resource:</strong> {result.resource_id}</p>
          <p><strong>Total Available Hours:</strong> {result.total_available_hours}</p>
          <p><strong>Remaining Capacity:</strong> {result.remaining_capacity}</p>
        </div>
      )}
    </div>
  );
};
```

### 2.2 Add IPC Handler (Backend)

**File**: `app/main/ipc/coordinatorHandlers.ts` (add if not present)

```typescript
ipcMain.handle('coordinator:resources:list', async (event) => {
  try {
    const resources = database
      .prepare('SELECT id, resource_name FROM financial_resources ORDER BY resource_name')
      .all();
    return resources;
  } catch (error: any) {
    console.error('Failed to list resources:', error);
    throw error;
  }
});

ipcMain.handle('coordinator:commitment:create', async (event, data) => {
  try {
    const result = await resourceCommitmentService.createCommitment(data);
    return result;
  } catch (error: any) {
    console.error('Failed to create commitment:', error);
    throw error;
  }
});
```

### 2.3 Add Route & Test

Same as Import Manager - add route, test it works.

---

## Phase 3: Variance Alert Dashboard (Days 13-17)
**Goal**: Display alerts from `variance_alerts` table with filtering

### Why This Next?
- ✅ Uses data already being generated
- ✅ Simple table display pattern
- ✅ Teaches filtering (useful skill)
- ✅ High value for users

### 3.1 Create the Page

**File**: `app/renderer/pages/VarianceAlerts.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import '../styles/coordinator.css';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_type: string;
  entity_id: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export const VarianceAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load alerts on mount
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setIsLoading(true);
        const data = await window.electronAPI.request('coordinator:alerts:list');
        setAlerts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadAlerts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...alerts];

    // Filter by severity
    if (severityFilter) {
      filtered = filtered.filter(a => a.severity === severityFilter);
    }

    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(a => a.alert_type === typeFilter);
    }

    // Filter by acknowledged status
    if (!showAcknowledged) {
      filtered = filtered.filter(a => !a.acknowledged);
    }

    setFilteredAlerts(filtered);
  }, [alerts, severityFilter, typeFilter, showAcknowledged]);

  // Handle acknowledge
  const handleAcknowledge = async (alertId: string) => {
    try {
      await window.electronAPI.request('coordinator:alerts:acknowledge', alertId);
      // Reload alerts
      const data = await window.electronAPI.request('coordinator:alerts:list');
      setAlerts(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (isLoading) return <div>Loading alerts...</div>;

  return (
    <div className="variance-alerts">
      <h1>Variance Alerts</h1>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Severity</label>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">-- All --</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">-- All --</option>
            <option value="timesheet_no_allocation">Timesheet No Allocation</option>
            <option value="allocation_variance">Allocation Variance</option>
            <option value="capacity_exceeded">Capacity Exceeded</option>
            <option value="schedule_variance">Schedule Variance</option>
            <option value="cost_variance">Cost Variance</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input 
              type="checkbox" 
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
            />
            Show Acknowledged
          </label>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Alerts Table */}
      <table className="alerts-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Type</th>
            <th>Message</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredAlerts.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                No alerts
              </td>
            </tr>
          ) : (
            filteredAlerts.map((alert) => (
              <tr 
                key={alert.id}
                style={{
                  backgroundColor: alert.acknowledged ? '#f9f9f9' : 'white',
                  borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                }}
              >
                <td>
                  <span style={{ color: getSeverityColor(alert.severity), fontWeight: 600 }}>
                    {alert.severity.toUpperCase()}
                  </span>
                </td>
                <td>{alert.alert_type.replace(/_/g, ' ')}</td>
                <td>{alert.message}</td>
                <td>{new Date(alert.created_at).toLocaleDateString()}</td>
                <td>
                  {!alert.acknowledged && (
                    <button 
                      onClick={() => handleAcknowledge(alert.id)}
                      className="btn-small"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.acknowledged && <span style={{ color: '#999' }}>✓ Acknowledged</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Total: {filteredAlerts.length} alerts
      </p>
    </div>
  );
};
```

### 3.2 Add CSS

Add to `app/renderer/styles/coordinator.css`:

```css
.variance-alerts {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.filter-group label {
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 14px;
}

.filter-group select,
.filter-group input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.alerts-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.alerts-table thead {
  background: #f8f9fa;
  font-weight: 600;
}

.alerts-table th,
.alerts-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.alerts-table th {
  font-size: 14px;
  color: #333;
}

.alerts-table tbody tr:hover {
  background: #f9f9f9;
}

.btn-small {
  padding: 5px 10px;
  font-size: 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.btn-small:hover {
  background: #218838;
}
```

### 3.3 Add IPC Handlers

```typescript
ipcMain.handle('coordinator:alerts:list', async (event) => {
  try {
    const alerts = database
      .prepare('SELECT * FROM variance_alerts ORDER BY created_at DESC')
      .all();
    return alerts;
  } catch (error: any) {
    throw error;
  }
});

ipcMain.handle('coordinator:alerts:acknowledge', async (event, alertId: string) => {
  try {
    const now = new Date().toISOString();
    database
      .prepare('UPDATE variance_alerts SET acknowledged = 1, acknowledged_at = ? WHERE id = ?')
      .run(now, alertId);
    return { success: true };
  } catch (error: any) {
    throw error;
  }
});
```

---

## Phase 4: Project Finance Tab (Days 18-23)
**Goal**: Display P&L by WBSE (budget vs forecast vs actual)

### Why This Last?
- ✅ Most complex (requires calculations)
- ✅ Builds on earlier patterns
- ✅ Can defer if running out of time
- ✅ Highest value but can work without initially

### 4.1 Create Finance Ledger Service

**File**: `app/main/services/coordinator/FinanceLedgerService.ts`

```typescript
import type { DB } from '../../db';

export interface FinanceLedgerRow {
  workstream: string;
  wbse: string;
  budget: number;
  forecast: number;
  actual: number;
  variance: number;
  variance_percent: number;
}

export class FinanceLedgerService {
  constructor(private db: DB) {}

  async getFinanceLedger(month?: string): Promise<FinanceLedgerRow[]> {
    // For each WBSE, calculate:
    // Budget: from project_detail if available
    // Forecast: sum of allocations × labour rates
    // Actual: sum of actuals from raw_actuals + timesheets

    const rows = this.db
      .prepare(`
        SELECT 
          ws.workstream,
          ws.wbse,
          COALESCE(SUM(fa.allocated_hours * lr.hourly_rate / 8), 0) as forecast,
          COALESCE(SUM(ra.value_in_obj_crcy), 0) as actual
        FROM workstreams ws
        LEFT JOIN project_detail pd ON pd.wbse = ws.wbse
        LEFT JOIN feature_allocations fa ON fa.project_id = (
          SELECT id FROM projects WHERE id = ? LIMIT 1
        )
        LEFT JOIN raw_labour_rates lr ON lr.activity_type IN (
          SELECT activity_type_cap FROM financial_resources WHERE id = fa.resource_id
        )
        LEFT JOIN raw_actuals ra ON ra.wbs_element = ws.wbse
        GROUP BY ws.wbse
      `)
      .all() as any[];

    return rows.map(r => ({
      workstream: r.workstream,
      wbse: r.wbse,
      budget: 0, // Can be extended later
      forecast: r.forecast || 0,
      actual: r.actual || 0,
      variance: r.actual - r.forecast,
      variance_percent: r.forecast > 0 ? ((r.actual - r.forecast) / r.forecast * 100) : 0,
    }));
  }
}
```

**Note**: This is complex. A junior dev can copy this but shouldn't need to modify it much.

### 4.2 Create Finance Page

**File**: `app/renderer/pages/ProjectFinance.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import '../styles/coordinator.css';

interface LedgerRow {
  workstream: string;
  wbse: string;
  budget: number;
  forecast: number;
  actual: number;
  variance: number;
  variance_percent: number;
}

export const ProjectFinance: React.FC = () => {
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLedger = async () => {
      try {
        setIsLoading(true);
        const data = await window.electronAPI.request('coordinator:finance:getLedger');
        setLedger(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadLedger();
  }, []);

  const formatNZD = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  const getVarianceColor = (variance: number): string => {
    if (variance < 0) return '#28a745'; // Under budget (good)
    if (variance > 0) return '#dc3545'; // Over budget (bad)
    return '#666';
  };

  if (isLoading) return <div>Loading finance data...</div>;

  const totals = {
    budget: ledger.reduce((sum, r) => sum + r.budget, 0),
    forecast: ledger.reduce((sum, r) => sum + r.forecast, 0),
    actual: ledger.reduce((sum, r) => sum + r.actual, 0),
  };
  totals.variance = totals.actual - totals.forecast;

  return (
    <div className="project-finance">
      <h1>Project Finance Overview</h1>

      {error && <div className="error">{error}</div>}

      {/* Summary Cards */}
      <div className="finance-summary">
        <div className="card">
          <h3>Forecast</h3>
          <p className="amount">{formatNZD(totals.forecast)}</p>
        </div>
        <div className="card">
          <h3>Actual YTD</h3>
          <p className="amount">{formatNZD(totals.actual)}</p>
        </div>
        <div className="card">
          <h3>Variance</h3>
          <p className="amount" style={{ color: getVarianceColor(totals.variance) }}>
            {formatNZD(totals.variance)}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <table className="finance-table">
        <thead>
          <tr>
            <th>Workstream</th>
            <th>WBSE</th>
            <th>Forecast</th>
            <th>Actual</th>
            <th>Variance</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((row, i) => (
            <tr key={i}>
              <td>{row.workstream}</td>
              <td>{row.wbse}</td>
              <td>{formatNZD(row.forecast)}</td>
              <td>{formatNZD(row.actual)}</td>
              <td style={{ color: getVarianceColor(row.variance) }}>
                {formatNZD(row.variance)}
              </td>
              <td style={{ color: getVarianceColor(row.variance) }}>
                {row.variance_percent.toFixed(1)}%
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: 600, backgroundColor: '#f0f0f0' }}>
            <td colSpan={2}>TOTAL</td>
            <td>{formatNZD(totals.forecast)}</td>
            <td>{formatNZD(totals.actual)}</td>
            <td style={{ color: getVarianceColor(totals.variance) }}>
              {formatNZD(totals.variance)}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
```

### 4.3 Add CSS & IPC

Add CSS:
```css
.project-finance {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.finance-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.finance-summary .card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.finance-summary h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
}

.finance-summary .amount {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.finance-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.finance-table th,
.finance-table td {
  padding: 12px;
  text-align: right;
  border-bottom: 1px solid #eee;
}

.finance-table th:first-child,
.finance-table td:first-child {
  text-align: left;
}

.finance-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 14px;
}
```

Add IPC handler:
```typescript
ipcMain.handle('coordinator:finance:getLedger', async (event) => {
  try {
    const ledger = await financeLedgerService.getFinanceLedger();
    return ledger;
  } catch (error: any) {
    throw error;
  }
});
```

---

## Phase 5: Polish & Testing (Days 24-27)
**Goal**: Fix bugs, improve UX, ensure everything works together

### 5.1 Checklist

- [ ] All pages load without errors
- [ ] Forms validate inputs correctly
- [ ] Errors display clearly
- [ ] Loading states work
- [ ] Data persists across sessions
- [ ] IPC calls timeout gracefully
- [ ] Responsive on smaller screens
- [ ] No console errors

### 5.2 Add Navigation

Update `app/renderer/components/NavigationSidebar.tsx` to include:
```typescript
<NavItem to="/coordinator/import" label="📥 Import Data" />
<NavItem to="/coordinator/commitment" label="📅 Commitments" />
<NavItem to="/coordinator/alerts" label="⚠️ Variance Alerts" />
<NavItem to="/coordinator/finance" label="💰 Finance" />
```

### 5.3 Update README

Add section:
```markdown
## Financial Coordinator Module

### User Guide

1. **Import Data** - Upload SAP timesheets, actuals, labour rates
2. **Create Commitments** - Define resource capacity ("I can commit 6 hrs/day")
3. **Monitor Variances** - View and acknowledge variance alerts
4. **Review Finance** - See budget vs forecast vs actual by workstream

### Data Flow

CSV → Import Manager → Database → Variance Detection → Alerts → Finance Ledger
```

---

## Testing Checklist Before Handoff

### Unit Test (Do These Manually)

| Test | Steps | Expected |
|------|-------|----------|
| Import Timesheet | Upload test CSV with 3 rows | 3 rows imported, 0 errors |
| Create Commitment | Create 6 hrs/day for Abbie, 01-Apr to 30-Jun | Total available: 390 hours |
| Generate Alerts | Import timesheets for resource without allocation | Alert shows: "timesheet_no_allocation" |
| View Finance | Load finance page | Table shows WBSE rows with forecast/actual |

### Integration Test

1. Create a commitment for Resource A (6 hrs/day, Q1)
2. Allocate Resource A to Feature B (200 hours)
3. Import timesheets showing Resource A worked 150 hours on Feature B
4. Check alert: Should show allocation variance (50 hours under)
5. View finance: Should show forecast 200 hrs, actual ~100 hrs (from timesheets)

**If all pass**: Ready for production

---

## Code Quality Guidelines for Junior Devs

### Follow These Patterns

**Always**:
- ✅ Use TypeScript types (don't use `any` unless necessary)
- ✅ Import styles at top of component
- ✅ Add error boundaries
- ✅ Test forms with empty inputs
- ✅ Use consistent naming (camelCase for JS, kebab-case for CSS classes)

**Never**:
- ❌ Put logic in JSX (use functions or effects)
- ❌ Forget to handle loading states
- ❌ Use `console.log` for debugging (use breakpoints or proper logging)
- ❌ Make components >300 lines (split into smaller pieces)

### Example: Good Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import '../styles/foo.css';

// 2. Types
interface MyData {
  id: string;
  name: string;
}

// 3. Component
export const MyPage: React.FC = () => {
  // State
  const [data, setData] = useState<MyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const loadData = async () => {
    try {
      const result = await window.electronAPI.request('myHandler');
      setData(result);
    } finally {
      setIsLoading(false);
    }
  };

  // Render
  return (
    <div>
      {isLoading ? <p>Loading...</p> : <ul>...</ul>}
    </div>
  );
};
```

---

## Common Mistakes & Fixes

| Mistake | Why It's Bad | Fix |
|---------|------------|-----|
| `const result = await ipc.call()` without try/catch | App crashes on error | Always wrap in try/catch |
| Forgetting to update TypeScript types | TS compilation fails | Add types to `types/coordinator.ts` first |
| Hardcoding IDs instead of using form values | Data doesn't match user intent | Always get values from state |
| Not handling empty result sets | Shows "undefined" in UI | Check `if (data.length === 0)` |
| Using CSS class names inconsistently | Styling breaks | Use SCSS/CSS classes exactly as defined |

---

## Debugging Tips

### If Import Fails
1. Check CSV format (headers, commas, quotes)
2. Check browser console for error message
3. Check database in SQLite viewer
4. Add `console.log(csvData)` in form before sending

### If Page Doesn't Load
1. Check route is registered
2. Check component exports correctly
3. Check imports are correct paths
4. Check for TypeScript errors: `npm run typecheck`

### If IPC Doesn't Work
1. Check handler name matches exactly
2. Check handler is registered in `coordinatorHandlers.ts`
3. Check handler is called in `main.ts`
4. Add logging: `console.log('Calling handler:', handlerName)`

---

## Timeline Summary

| Phase | Days | Status |
|-------|------|--------|
| Phase 0: Foundation | 2-3 | Must complete first |
| Phase 1: Import Manager | 3-4 | Easiest, do second |
| Phase 2: Commitments | 5-6 | Medium difficulty |
| Phase 3: Variance Alerts | 4-5 | Medium difficulty |
| Phase 4: Finance | 5-6 | Hardest, can defer |
| Phase 5: Polish | 3-4 | Always save time for this |
| **Total** | **22-28 days** | **~1 month** |

---

## Success Criteria

A junior dev has succeeded when:

✅ All 4 pages load without errors  
✅ Can import CSV data end-to-end  
✅ Can create commitments and see capacity calculations  
✅ Variance alerts appear correctly  
✅ Finance page shows P&L summary  
✅ Code follows project patterns  
✅ No console errors  
✅ README updated with usage guide  

---

## Next Actions

1. **Read this plan** - Understand the phases
2. **Start Phase 0** - Read existing code
3. **Complete Phase 1 by end of Week 1** - Import Manager must work
4. **Track progress in COORDINATOR-BUILD-CHECKLIST.md**
5. **Ask questions early** - Don't get stuck

**Good luck! You've got this. 🎉**
