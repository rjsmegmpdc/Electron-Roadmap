# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Building and Running
```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build main process and renderer
npm run build:main
npm run build:renderer

# Full build
npm run build:full

# Package for distribution
npm run package:win     # Windows (NSIS installer)
npm run package:mac     # macOS (DMG)
npm run package:linux   # Linux (AppImage)
```

### Testing
```bash
# Run all tests
npm test

# Test with coverage
npm run test:coverage

# Security tests
npm run test:security

# Integration tests
npm run test:integration

# Performance tests (60s timeout)
npm run test:performance

# E2E tests with Playwright
npm run e2e
npm run e2e:headed  # With browser UI

# Full test suite with reports
npm run test:full
```

### Code Quality
```bash
# Lint and fix
npm run lint

# Format code
npm run format

# Type checking
npm run typecheck
```

## Architecture Overview

### Process Architecture
The application uses Electron's multi-process architecture:

1. **Main Process** (`app/main/`)
   - Manages application lifecycle and windows
   - Handles database operations via SQLite (better-sqlite3)
   - Exposes secure IPC APIs through preload script
   - Services implement business logic

2. **Renderer Process** (`app/renderer/`)
   - React 19 application built with Vite
   - Communicates with main process via `window.electronAPI`
   - State management: Local state + IPC calls + Zustand stores

### IPC Communication Pattern
All communication follows the channel naming convention:
```
<module>:<entity>:<action>
```
Examples:
- `project:getAll`
- `coordinator:import:timesheets`
- `governance:gate:create`

### Database Architecture
- SQLite with WAL mode for concurrent reads
- 40+ tables across multiple modules
- Automatic migrations on startup
- Schema version tracking

## Critical Implementation Rules

### 1. Status Values (EXACT)
```typescript
type ProjectStatus = 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
```
Never use different status values - the UI depends on these exact strings.

### 2. API Usage Pattern
```typescript
// ✅ CORRECT - Use the new API methods
const response = await window.electronAPI.getAllProjects();

// ❌ WRONG - Old API, will fail
const projects = await window.electronAPI.getProjects();
```

### 3. Budget Handling
Database stores budget in cents, UI displays in NZD:
```typescript
// Loading: cents → NZD
budget_nzd: (project.budget_cents || 0) / 100

// Saving: NZD → string for transport
budget_nzd: nzdAmount.toString()

// Display: Always safe with null checks
${(project.budget_nzd || 0).toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
```

### 4. Date Format
Always use DD-MM-YYYY format (New Zealand standard):
```typescript
// Parsing
const [day, month, year] = dateString.split('-');
const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

// Formatting
const formatted = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
```

## Module Structure

### Core Modules (Complete)
- **Project Management**: Projects, Tasks, Dependencies, Timeline, Gantt
- **Financial Coordinator**: Import SAP data, Resources, Commitments, Alerts, P&L
- **ADO Integration**: Config, sync, tags (95% - real-time sync pending)
- **Calendar**: Working days, holidays, periods
- **Export/Import**: CSV/ZIP with validation
- **Security**: AES-256-GCM encryption, token management

### Services Organization
```
app/main/services/
├── ProjectService.ts         # Core project CRUD
├── TaskService.ts            # Task management
├── DependencyService.ts      # Dependency tracking
├── coordinator/              # Financial module services
│   ├── TimesheetImportService.ts
│   ├── FinanceLedgerService.ts
│   └── VarianceDetectionService.ts
├── governance/               # Governance services (parked)
├── security/                 # Encryption and tokens
│   ├── EncryptionService.ts
│   └── TokenManager.ts
└── ado/                      # Azure DevOps
    └── AdoApiService.ts
```

## Financial Coordinator Module

### Import Workflow
1. Navigate to "Import Financial Data" in sidebar
2. Select type: SAP Timesheets, SAP Actuals, or Labour Rates
3. For Labour Rates, specify fiscal year (e.g., FY26)
4. CSV must be UTF-8 encoded with correct headers

### Resource Management
- Create resources with name, contract type, email
- Define commitments (hours per day/week/fortnight)
- System tracks allocated vs remaining capacity

### Variance Detection
Automatic alerts for:
- Timesheet without allocation
- Capacity exceeded
- Allocation/schedule/cost variance

## Testing Strategy

### Pre-commit Checklist
```bash
# Essential tests before committing
npm run build:main && npm run build:renderer

# Verify these work:
# 1. Projects load and display
# 2. Project details open without crashes
# 3. Budget shows proper NZD formatting
# 4. All status types work in UI
# 5. Financial Coordinator pages load
```

### Test Organization
- **Unit Tests**: Pure functions, services
- **Integration Tests**: Service + DB interactions
- **Security Tests**: Encryption, validation
- **E2E Tests**: Full user workflows

## Security Considerations

### Electron Security
- Context Isolation: Enabled
- Node Integration: Disabled in renderer
- Content Security Policy: Configured
- All IPC exposed through secure contextBridge

### Data Security
- PAT tokens encrypted with AES-256-GCM
- Master key derivation using PBKDF2
- Tokens stored in encrypted `ado_config` table
- Automatic token expiry tracking

## Data Storage Locations

### Windows
```
Database: %APPDATA%\RoadmapTool\roadmap.db
Backups:  %APPDATA%\RoadmapTool\backups\
Config:   %APPDATA%\RoadmapTool\config\
```

### macOS
```
Database: ~/Library/Application Support/RoadmapTool/roadmap.db
Backups:  ~/Library/Application Support/RoadmapTool/backups/
Config:   ~/Library/Application Support/RoadmapTool/config/
```

### Linux
```
Database: ~/.config/RoadmapTool/roadmap.db
Backups:  ~/.config/RoadmapTool/backups/
Config:   ~/.config/RoadmapTool/config/
```

## Performance Considerations

### Database
- 36+ indexes on Financial Coordinator tables
- Prepared statements for repeated queries
- Transactions for bulk operations
- Foreign keys with cascade deletes

### Frontend
- Code splitting via Vite
- React.memo for expensive components
- Lazy loading for large datasets

## Common Troubleshooting

### Build Issues
```bash
# If better-sqlite3 fails
npm run rebuild:better-sqlite3

# Clean build
npm run clean
npm run build:full
```

### Database Issues
- Database migrations run automatically on startup
- Backups created before migrations
- Check schema version: `db.pragma('user_version')`

### IPC Issues
- Ensure channel names follow convention
- Check preload script exposes the method
- Verify main process handler is registered

## Development Tips

1. **Always test with real data** - Import sample CSVs to verify financial calculations
2. **Check console for errors** - Both main and renderer process logs
3. **Use TypeScript strictly** - Don't bypass type checking
4. **Follow existing patterns** - Consistency is critical for maintainability
5. **Test on target OS** - Windows 11 is primary target

## External Documentation References

Key documents to review:
- `README.md` - User guide and feature documentation
- `ARCHITECTURE.md` - Detailed technical architecture
- `docs/QUICK-REFERENCE.md` - Critical bug fixes and patterns
- `FINANCIAL-COORDINATOR-COMPLETE.md` - Financial module details
- `MODULE-IMPLEMENTATION-STATUS.md` - Feature completion status