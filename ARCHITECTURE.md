# Roadmap Electron - Architecture Documentation

**Version:** 1.0  
**Last Updated:** 6 December 2025  
**Application Type:** Desktop (Electron)  
**Status:** Production

---

## Executive Summary

Roadmap Electron is a **desktop application** built with Electron, TypeScript, React, and SQLite. It provides comprehensive project management, financial tracking, and governance capabilities through a native desktop interface with local data persistence.

### Key Architectural Decisions

1. **Desktop-First**: Native Electron application for cross-platform desktop deployment
2. **Local Data**: SQLite database for offline-first data persistence
3. **Type Safety**: Full TypeScript implementation across main and renderer processes
4. **IPC Communication**: Structured request/response patterns between processes
5. **Modern Frontend**: React 19 with functional components and hooks

---

## Technology Stack

### Frontend (Renderer Process)
```
Framework:     React 19.2.0
Language:      TypeScript 5.9.3
Build Tool:    Vite 7.1.9
State Mgmt:    Zustand 5.0.8 + Direct IPC calls
UI Pattern:    Functional components with hooks
Styling:       CSS modules + inline styles
```

### Backend (Main Process)
```
Runtime:       Node.js (via Electron 38.2.2)
Language:      TypeScript 5.9.3
Database:      SQLite (better-sqlite3 12.4.1)
Build Tool:    TypeScript Compiler (tsc)
Architecture:  Service layer + Repository pattern
```

### Development & Build
```
Package Mgr:   npm
Testing:       Jest 30.2.0 + ts-jest 29.4.5
E2E Testing:   Playwright 1.56.0
Linting:       ESLint 9.37.0
Formatting:    Prettier 3.6.2
Bundling:      electron-builder 26.0.12
```

### Key Dependencies
```typescript
// Core
"electron": "^38.2.2"
"react": "^19.2.0"
"react-dom": "^19.2.0"
"typescript": "^5.9.3"

// Data
"better-sqlite3": "^12.4.1"
"zustand": "^5.0.8"

// Utilities
"dayjs": "^1.11.18"
"papaparse": "^5.5.3"
"adm-zip": "^0.5.16"
"uuid": "^13.0.0"
```

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                      (Browser Window)                           │
└─────────────────────────────────────────────────────────────────┘
                              ↕ IPC
┌─────────────────────────────────────────────────────────────────┐
│                    RENDERER PROCESS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐       │
│  │ React Pages  │  │  Components  │  │  State (Zustand)│       │
│  │   (.tsx)     │  │    (.tsx)    │  │    Stores       │       │
│  └──────────────┘  └──────────────┘  └────────────────┘       │
│         │                  │                    │               │
│         └──────────────────┴────────────────────┘               │
│                           │                                     │
│                  ┌────────▼─────────┐                          │
│                  │  electronAPI      │                          │
│                  │  (window.api)     │                          │
│                  └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                              ↕ IPC (contextBridge)
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN PROCESS                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐       │
│  │ IPC Handlers │  │   Services   │  │  Repositories  │       │
│  │   (ipcMain)  │  │  (Business)  │  │   (Data)       │       │
│  └──────────────┘  └──────────────┘  └────────────────┘       │
│         │                  │                    │               │
│         └──────────────────┴────────────────────┘               │
│                           │                                     │
│                  ┌────────▼─────────┐                          │
│                  │   SQLite DB      │                          │
│                  │  (roadmap.db)    │                          │
│                  └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   File System       │
                    │  (User Data Dir)    │
                    └────────────────────┘
```

---

## Project Structure

```
Roadmap-Electron/
│
├── app/                          # Application source code
│   ├── main/                     # Main process (Electron backend)
│   │   ├── main.ts              # Entry point, window creation
│   │   ├── preload.ts           # Context bridge, IPC exposure
│   │   ├── db.ts                # Database schema & migrations
│   │   │
│   │   ├── ipc/                 # IPC handlers
│   │   │   ├── projectHandlers.ts
│   │   │   ├── coordinatorHandlers.ts
│   │   │   ├── governanceHandlers.ts
│   │   │   └── ...
│   │   │
│   │   ├── services/            # Business logic
│   │   │   ├── ProjectService.ts
│   │   │   ├── TaskService.ts
│   │   │   ├── DependencyService.ts
│   │   │   ├── coordinator/    # Financial coordinator services
│   │   │   │   ├── FinanceLedgerService.ts
│   │   │   │   ├── TimesheetImportService.ts
│   │   │   │   └── ...
│   │   │   ├── governance/     # Governance services
│   │   │   │   ├── GovernanceService.ts
│   │   │   │   └── ...
│   │   │   ├── security/       # Security services
│   │   │   │   ├── EncryptionService.ts
│   │   │   │   └── TokenManager.ts
│   │   │   └── ado/            # Azure DevOps integration
│   │   │       └── AdoApiService.ts
│   │   │
│   │   ├── repositories/        # Data access layer (Governance)
│   │   │   └── governance-repositories.ts
│   │   │
│   │   ├── types/               # TypeScript types
│   │   │   ├── coordinator.ts
│   │   │   └── governance.ts
│   │   │
│   │   ├── utils/               # Utilities
│   │   │   ├── csvParser.ts
│   │   │   └── dateParser.ts
│   │   │
│   │   └── validation/          # Validation logic
│   │       └── governance-validation.ts
│   │
│   └── renderer/                # Renderer process (React frontend)
│       ├── main.tsx             # React entry point
│       ├── App.tsx              # Root component
│       │
│       ├── components/          # Reusable components
│       │   ├── DashboardLayout.tsx
│       │   ├── NavigationSidebar.tsx
│       │   ├── GanttChart.tsx
│       │   ├── TaskManager.tsx
│       │   └── ...
│       │
│       ├── pages/               # Full page components
│       │   ├── CoordinatorImport.tsx
│       │   ├── ResourceManagementPage.tsx
│       │   ├── ResourceCommitment.tsx
│       │   ├── VarianceAlerts.tsx
│       │   ├── ProjectFinance.tsx
│       │   ├── GovernanceDashboard.tsx
│       │   └── ...
│       │
│       ├── stores/              # Zustand state stores
│       │   └── *.ts
│       │
│       ├── state/               # State management
│       │   └── store.ts
│       │
│       ├── styles/              # CSS files
│       │   ├── coordinator.css
│       │   └── ...
│       │
│       ├── types/               # Frontend types
│       │   └── electron.d.ts
│       │
│       └── utils/               # Frontend utilities
│           └── validation.ts
│
├── tests/                       # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── security/               # Security tests
│   └── helpers/                # Test utilities
│
├── docs/                        # Documentation
│   ├── testing/                # Testing documentation
│   ├── sample-data/            # Sample data examples
│   └── archive/                # Archived documents
│
├── dist/                        # Compiled output
│   ├── main/                   # Compiled main process
│   └── renderer/               # Built renderer bundle
│
├── dist-packages/              # Electron build outputs
│
├── package.json                # Dependencies & scripts
├── tsconfig.json              # TypeScript config (shared)
├── tsconfig.build.json        # Build-specific TS config
├── jest.config.js             # Jest test configuration
├── vite.config.ts             # Vite bundler config
└── README.md                  # User documentation
```

---

## Data Architecture

### Database Schema (SQLite)

**Current Schema Version:** 7

#### Core Project Management Tables
```sql
-- Projects table
projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT,
  start_date TEXT,
  end_date TEXT,
  budget_cents INTEGER,
  description TEXT,
  pm TEXT,
  created_at TEXT,
  updated_at TEXT
)

-- Tasks table
tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  name TEXT NOT NULL,
  status TEXT,
  assigned_to TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id)
)

-- Dependencies table
dependencies (
  id TEXT PRIMARY KEY,
  from_task_id TEXT,
  to_task_id TEXT,
  type TEXT,
  lag_days INTEGER,
  FOREIGN KEY(from_task_id) REFERENCES tasks(id),
  FOREIGN KEY(to_task_id) REFERENCES tasks(id)
)
```

#### Financial Coordinator Tables (12 tables)
```sql
-- Raw import tables
raw_timesheets, raw_actuals, raw_labour_rates

-- Master data
financial_resources, financial_workstreams, project_financial_detail

-- Capacity & allocation
resource_commitments, feature_allocations

-- Variance & finance
variance_thresholds, variance_alerts, finance_ledger_entries

-- Integration
ado_feature_mapping
```

#### Governance Tables (14 tables)
```sql
governance_gates, gate_criteria, project_gate_status, gate_reviews
governance_policies, policy_compliance, compliance_evidence, compliance_waivers
decisions, decision_actions, action_dependencies
escalations, strategic_initiatives, project_benefits
```

#### Calendar & Configuration Tables
```sql
calendar_months, public_holidays
app_settings, ado_config, ado_tags
epics, features
```

### Data Storage Locations

**Windows:**
```
Database:     C:\Users\<username>\AppData\Roaming\RoadmapTool\roadmap.db
Backups:      C:\Users\<username>\AppData\Roaming\RoadmapTool\backups\
Config:       C:\Users\<username>\AppData\Roaming\RoadmapTool\config\
```

**macOS:**
```
Database:     ~/Library/Application Support/RoadmapTool/roadmap.db
Backups:      ~/Library/Application Support/RoadmapTool/backups/
Config:       ~/Library/Application Support/RoadmapTool/config/
```

**Linux:**
```
Database:     ~/.config/RoadmapTool/roadmap.db
Backups:      ~/.config/RoadmapTool/backups/
Config:       ~/.config/RoadmapTool/config/
```

---

## Communication Architecture

### IPC (Inter-Process Communication)

**Pattern:** Request/Response via Electron IPC

#### Preload Script (app/main/preload.ts)
```typescript
// Exposes secure API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Generic request handler
  request: (channel: string, data?: any) => 
    ipcRenderer.invoke(channel, data),
  
  // Event listeners
  on: (channel: string, callback: Function) =>
    ipcRenderer.on(channel, (_, ...args) => callback(...args))
});
```

#### Renderer Usage
```typescript
// Frontend calls
const projects = await window.electronAPI.request('project:getAll');
const result = await window.electronAPI.request('coordinator:import:timesheets', {
  csvData: fileContent,
  fiscalYear: 'FY26'
});
```

#### Main Process Handlers (app/main/ipc/*.ts)
```typescript
// Backend handlers
ipcMain.handle('project:getAll', async () => {
  return await ProjectService.getAllProjects(db);
});

ipcMain.handle('coordinator:import:timesheets', async (_, { csvData }) => {
  return await TimesheetImportService.import(db, csvData);
});
```

### IPC Channel Naming Convention
```
<module>:<entity>:<action>
  │       │       └─── Action: get, create, update, delete, import, etc.
  │       └────────── Entity: project, task, resource, etc.
  └────────────────── Module: project, coordinator, governance, etc.

Examples:
- project:getAll
- project:create
- coordinator:import:timesheets
- coordinator:resource:create
- governance:gate:getAll
```

---

## Service Layer Architecture

### Service Pattern

```typescript
// Service structure
export class ServiceName {
  // Single responsibility per service
  static async operation(db: Database, params: Type): Promise<Result> {
    // 1. Validate inputs
    // 2. Business logic
    // 3. Database operations
    // 4. Return structured result
  }
}
```

### Key Services

#### Project Management
- `ProjectService` - Project CRUD
- `TaskService` - Task management
- `DependencyService` - Dependency tracking
- `ExportImportService` - CSV/ZIP export

#### Financial Coordinator
- `TimesheetImportService` - Import SAP timesheets
- `ActualsImportService` - Import SAP actuals
- `LabourRatesImportService` - Import labour rates
- `FinanceLedgerService` - P&L calculations
- `ResourceCommitmentService` - Capacity tracking
- `VarianceDetectionService` - Variance alerts

#### Governance
- `GovernanceService` - Core governance operations
- `ComplianceService` - Policy compliance
- `DecisionLogService` - Decision tracking
- `EscalationService` - Issue escalation
- `StageGateService` - Gate management

#### Security & Integration
- `EncryptionService` - AES-256-GCM encryption
- `TokenManager` - Secure token storage
- `AdoApiService` - Azure DevOps API
- `AuditLogger` - Audit trail
- `BackupRestoreService` - Backup/restore

---

## Frontend Architecture

### React Component Patterns

```typescript
// Functional component with hooks
export const ComponentName: React.FC = () => {
  // 1. State
  const [data, setData] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Effects
  useEffect(() => {
    loadData();
  }, []);
  
  // 3. Handlers
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.request('module:action');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 4. Render
  return (
    <div className="component-name">
      {/* UI */}
    </div>
  );
};
```

### State Management Strategy

**Approach:** Hybrid - Local state + IPC + Zustand for complex state

1. **Local State (useState)**: Component-specific UI state
2. **IPC Calls**: Data fetching and persistence
3. **Zustand Stores**: Shared application state (used selectively)

```typescript
// Example: Zustand store
import { create } from 'zustand';

interface ProjectStore {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ 
    projects: [...state.projects, project] 
  })),
}));
```

---

## Build & Deployment

### Development Workflow

```bash
# Install dependencies
npm install

# Run in development (hot reload)
npm run dev
  ├─ Starts Vite dev server (renderer) on port 5173
  └─ Compiles & runs Electron (main process)

# Build for testing
npm run build:main      # Compile main process (TypeScript)
npm run build:renderer  # Bundle renderer (Vite)

# Run tests
npm test               # Run all tests
npm run test:coverage  # With coverage report
npm run test:security  # Security-specific tests
```

### Production Build

```bash
# Full build
npm run build:full
  ├─ Cleans dist/
  ├─ Builds renderer (Vite)
  └─ Compiles main (tsc)

# Package for distribution
npm run package         # Current platform
npm run package:win    # Windows (NSIS installer)
npm run package:mac    # macOS (DMG)
npm run package:linux  # Linux (AppImage)
```

### Build Output

```
dist/
├── main/              # Compiled TypeScript (CommonJS)
│   └── main/
│       ├── main.js
│       ├── preload.js
│       ├── db.js
│       └── ...
└── renderer/          # Bundled React app
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── ...

dist-packages/         # Electron packaged apps
└── roadmap-tool-1.0.0-win.exe
```

---

## Security Architecture

### Electron Security Features

1. **Context Isolation**: Enabled
2. **Node Integration**: Disabled in renderer
3. **Context Bridge**: Secure IPC exposure
4. **Content Security Policy**: Configured
5. **Encrypted Storage**: AES-256-GCM for sensitive data

### Data Encryption

```typescript
// Master key derivation (PBKDF2)
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  password,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);

// Encryption
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);
```

### Token Storage

- PAT tokens encrypted before storage
- Tokens stored in encrypted `ado_config` table
- Token expiry tracked
- Automatic token refresh prompts

---

## Performance Considerations

### Database Optimization

- **36 indexes** for Financial Coordinator tables
- **Prepared statements** for repeated queries
- **Transactions** for bulk operations
- **Foreign keys** with cascade deletes

### Frontend Optimization

- **Code splitting** via Vite
- **React.memo** for expensive components
- **Lazy loading** for large datasets
- **Virtualization** for long lists (planned)

---

## Testing Strategy

### Test Pyramid

```
        ┌───────────────┐
        │  E2E Tests    │  Playwright (critical paths)
        └───────────────┘
       ┌─────────────────┐
       │ Integration Tests│  Jest (service + DB)
       └─────────────────┘
      ┌───────────────────┐
      │   Unit Tests       │  Jest (pure functions)
      └───────────────────┘
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical workflows
- **E2E Tests**: User journeys
- **Security Tests**: Encryption, validation

---

## Migration Strategy

### Database Migrations

```typescript
// Version-based migrations in db.ts
const currentVersion = db.pragma('user_version', { simple: true });

if (currentVersion < 6) {
  // Add Financial Coordinator tables
  db.exec(MIGRATION_V6);
  db.pragma('user_version = 6');
}

if (currentVersion < 7) {
  // Add Governance tables
  db.exec(MIGRATION_V7);
  db.pragma('user_version = 7');
}
```

### Backup & Restore

- **Automatic backups** before migrations
- **Manual backup** via UI
- **Export/Import** for data portability
- **Compressed backups** (gzip)

---

## Future Architecture Considerations

### Planned Enhancements

1. **Real-time Sync** - WebSocket for multi-device sync
2. **Cloud Storage** - Optional cloud backup
3. **Plugin System** - Extensible architecture
4. **Mobile Companion** - Read-only mobile app
5. **Advanced Analytics** - Embedded analytics engine

### Scalability

- Current: SQLite (suitable for 10,000+ projects)
- Future: PostgreSQL option for enterprise
- Caching layer for large datasets
- Background workers for heavy processing

---

## References

### Official Documentation

- [Electron Docs](https://www.electronjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Vite Guide](https://vitejs.dev/guide)

### Project Documentation

- `README.md` - User guide
- `FINANCIAL-COORDINATOR-COMPLETE.md` - Financial module
- `DOCUMENTATION-AUDIT-REPORT.md` - Documentation status
- `docs/testing/` - Testing guides
- `docs/sample-data/` - Data examples

---

**Document Version:** 1.0  
**Last Reviewed:** 6 December 2025  
**Next Review:** Quarterly or on major architecture changes
