# Roadmap Tool - Electron Implementation

A standalone desktop roadmap application built with TypeScript, React, and Electron.

## 🚨 IMPORTANT FOR DEVELOPERS

**Before making any changes, read these critical documents:**

- **[IMPLEMENTATION-NOTES.md](./IMPLEMENTATION-NOTES.md)** - Complete bug prevention guide
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Critical patterns cheat sheet

These documents contain fixes for critical bugs that prevented data display and caused crashes. Following these patterns is **mandatory** to avoid reintroducing bugs.

## Quick Start

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production  
npm run build

# Test before committing
npm run build:main && npm run build:renderer
```

## Architecture

- **Main Process**: Electron + SQLite + ProjectService API
- **Renderer Process**: React + Vite + Zustand state management
- **IPC Communication**: Structured request/response patterns

## Critical Implementation Rules

1. **Status Values**: Only use `'planned' | 'in-progress' | 'blocked' | 'done' | 'archived'`
2. **API Usage**: Always use `window.electronAPI.getAllProjects()` (not `getProjects()`)
3. **Budget Format**: Convert `budget_cents` ↔ `budget_nzd` in store layer
4. **Null Safety**: Always check for undefined values before calling methods

## Project Structure

```
app/
├── main/                 # Electron main process
│   ├── services/         # ProjectService (source of truth)
│   ├── ipc/             # IPC handlers
│   └── db.ts            # Database schema
├── renderer/            # React UI
│   ├── components/      # UI components
│   ├── state/          # Zustand stores
│   └── stores/         # New ProjectStore
```

## Financial Coordinator Module

The Financial Coordinator provides comprehensive financial tracking and resource management capabilities.

### Features

#### 1. 📥 Import Financial Data
Upload and process financial data from SAP exports.

**What you can import:**
- **SAP Timesheets** - Employee timesheet data with hours per WBS element
- **SAP Actuals** - Actual cost data from financial system
- **Labour Rates** - Hourly rates by activity type and fiscal year

**How to use:**
1. Navigate to "Import Financial Data" in sidebar
2. Select import type from dropdown
3. Choose CSV file from your system
4. For labour rates, specify fiscal year (e.g., FY26)
5. Click "Import" and review results

**CSV Format Requirements:**
- Must be comma-separated
- Headers must match SAP export format
- Encoding: UTF-8

#### 2. 👨‍💼 Manage Resources
Create and manage financial resources (team members).

**Resource Management:**
- Create new resources with name, contract type, email
- Edit existing resource details
- Delete resources (safeguards prevent deletion with active commitments)
- Search/filter across multiple fields

**How to use:**
1. Navigate to "Manage Resources" in sidebar
2. Click "Add Resource" to create new
3. Fill in required fields: Name, Contract Type
4. Optional: Email, Employee ID, Work Area, Activity Types
5. Click "Create Resource"

#### 3. 📅 Resource Commitments
Define resource capacity and availability.

**Commitment Creation:**
- Specify "I can commit X hours per day/week/fortnight"
- Set commitment period (start/end dates)
- System calculates total available hours
- Tracks allocated vs remaining capacity

**How to use:**
1. Navigate to "Resource Commitments" in sidebar
2. Select resource from dropdown
3. Enter period: DD-MM-YYYY format
4. Choose frequency: per day/week/fortnight
5. Enter committed hours (e.g., 6 hours/day)
6. Click "Create Commitment"
7. View total available hours and remaining capacity

#### 4. ⚠️ Variance Alerts
Monitor and acknowledge project variances.

**Alert Types:**
- Timesheet without allocation
- Capacity exceeded
- Allocation variance
- Schedule variance
- Cost variance

**Alert Management:**
- Filter by severity (critical, high, medium, low)
- Filter by alert type
- Show/hide acknowledged alerts
- Click "Acknowledge" to mark as reviewed

**How to use:**
1. Navigate to "Variance Alerts" in sidebar
2. Review unacknowledged alerts (displayed first)
3. Use filters to focus on specific issues
4. Click "Acknowledge" when reviewed
5. Check summary stats at bottom

#### 5. 💰 Project Finance
View comprehensive P&L (Profit & Loss) by workstream.

**Financial Metrics:**
- **Budget** - Original planned budget
- **Forecast** - Calculated from allocated hours × labour rates
- **Actual** - Real costs from SAP actuals
- **Variance** - Difference between actual and forecast

**How to use:**
1. Navigate to "Project Finance" in sidebar
2. View summary cards for high-level overview
3. Review detailed table by workstream/WBSE
4. Use month filter to view specific periods
5. Green = under budget, Red = over budget

### Workflow Example

**Complete Financial Tracking Setup:**

1. **Import Master Data** (one-time setup)
   - Import Labour Rates for fiscal year
   - Create Resources in system

2. **Define Capacity** (quarterly)
   - Create Resource Commitments for each team member
   - Specify availability per period

3. **Import Actuals** (monthly)
   - Import SAP Timesheets
   - Import SAP Actuals

4. **Monitor** (ongoing)
   - Check Variance Alerts daily
   - Review Project Finance weekly
   - Acknowledge alerts as they're addressed

### Data Flow

```
CSV Imports → Database → Variance Detection → Alerts
                ↓
         Resource Commitments + Allocations
                ↓
         Finance Calculations (Budget vs Forecast vs Actual)
                ↓
         Project Finance Dashboard
```

## Testing Checklist

Before any commit, verify:
- [ ] Projects load and display
- [ ] Project details open without crashes
- [ ] Budget shows proper NZD formatting
- [ ] All status types work in UI
- [ ] New projects save successfully
- [ ] Financial Coordinator pages load
- [ ] Import workflow completes
- [ ] Variance alerts display
- [ ] Finance calculations are correct

## License

Private project - Team access only

---
**⚠️ Remember**: Check [IMPLEMENTATION-NOTES.md](./IMPLEMENTATION-NOTES.md) before making changes!
