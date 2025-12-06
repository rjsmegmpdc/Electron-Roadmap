# Audit Remediation Plan
**Date**: 2025-11-09  
**Status**: Active  
**Target Score**: 4.0+ (from current 2.72)

---

## Executive Summary

This plan addresses the **Top 10 critical findings** from the Principal Engineer Quality Audit. The Governance module errors are **pre-existing and out of scope**—we will isolate and fix core security/performance issues first.

**Key Risks Identified**:
1. Electron security posture unverified (P0)
2. IPC payloads lack runtime validation (P0)
3. Database integrity checks missing (P1)
4. Zustand state patterns unknown (P1)
5. Backup/Restore lacks integrity verification (P1)

**Approach**: 3-phase remediation over 2 weeks with zero behavioral changes unless explicitly noted.

---

## Phase 1: Critical Security (Days 1–3) — P0 Issues

### 1.1 Verify & Harden Electron Main Process
**File**: `app/main/main.ts`  
**Risk**: RCE if `nodeIntegration` enabled or `contextIsolation` disabled.  
**Owner**: Security  
**Effort**: 2 hours

**Tasks**:
- [ ] Read `app/main/main.ts` BrowserWindow configuration
- [ ] Verify `webPreferences` flags:
  ```typescript
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    enableRemoteModule: false,
    preload: path.join(__dirname, 'preload.js')
  }
  ```
- [ ] Add CSP header to renderer `index.html`:
  ```html
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
  ```
- [ ] Add `will-navigate` handler to block external navigation:
  ```typescript
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost')) event.preventDefault();
  });
  ```
- [ ] Test: Launch app, verify DevTools → Security tab shows "Secure context"

**Success Criteria**: Score +0.5 on Electron Security Posture (2.0 → 2.5)

---

### 1.2 Add Zod Runtime Validation to IPC Handlers
**Files**: `app/main/ipc/*.ts` (7 files)  
**Risk**: Crash or injection from malformed renderer payloads.  
**Owner**: Backend  
**Effort**: 8 hours

**Tasks**:
- [ ] Install Zod: `npm install zod`
- [ ] Create schema file `app/main/ipc/schemas.ts`:
  ```typescript
  import {z} from 'zod';
  
  export const ProjectUpdateSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200).optional(),
    budget_cents: z.number().int().nonnegative().optional(),
    start_date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/).optional(),
    end_date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/).optional()
  });
  
  export const TaskCreateSchema = z.object({
    project_id: z.string().uuid(),
    title: z.string().min(1).max(200),
    start_date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
    end_date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
    effort_hours: z.number().int().nonnegative().optional()
  });
  ```
- [ ] Wrap **every** `ipcMain.handle` in validation:
  ```typescript
  ipcMain.handle('project:update', async (event, payload) => {
    const result = ProjectUpdateSchema.safeParse(payload);
    if (!result.success) {
      console.error('Validation failed:', result.error);
      return {success: false, error: result.error.message};
    }
    // Existing mutation logic...
  });
  ```
- [ ] Repeat for all handlers in:
  - `projectHandlers.ts`
  - `taskHandlers.ts`
  - `dependencyHandlers.ts`
  - `settingsHandlers.ts`
  - `exportImportHandlers.ts`
  - `coordinatorHandlers.ts`
  - **SKIP** `governanceHandlers.ts` (broken; fix separately)
- [ ] Test: Send malformed payload from DevTools Console:
  ```javascript
  window.electronAPI.updateProject({id: 'not-a-uuid', title: null})
  ```
  Expect: `{success: false, error: '...'}`

**Success Criteria**: Score +0.8 on Typed, Validated IPC (2.0 → 2.8)

---

### 1.3 Database Integrity & WAL Mode
**File**: `app/main/db.ts`  
**Risk**: Orphaned rows, undetected corruption, poor write concurrency.  
**Owner**: Backend  
**Effort**: 1 hour

**Tasks**:
- [ ] Add PRAGMAs at DB initialization (top of `db.ts`):
  ```typescript
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  ```
- [ ] Add integrity check on app startup:
  ```typescript
  const check = db.pragma('integrity_check');
  if (check[0].integrity_check !== 'ok') {
    console.error('Database corrupted:', check);
    // Show error dialog; offer backup restore
  }
  ```
- [ ] Test:
  - Manually corrupt DB: `sqlite3 roadmap.db "UPDATE projects SET id='invalid' WHERE id='PRJ-1'"`
  - Launch app → should show error

**Success Criteria**: Score +0.4 on Data Integrity (implied 2.5 → 2.9)

---

## Phase 2: Performance & State Management (Days 4–7) — P1 Issues

### 2.1 Audit & Refactor Zustand Stores
**Files**: `app/renderer/stores/*.ts` (location unknown)  
**Risk**: Full-state subscriptions → 60–80% wasted re-renders.  
**Owner**: Frontend  
**Effort**: 12 hours

**Tasks**:
- [ ] **Discovery**: Find Zustand store files:
  ```pwsh
  Get-ChildItem -Path C:\Users\smhar\Roadmap-Electron\app\renderer -Recurse -Filter *.ts | Select-String "create\(|useStore" | Select-Object Path -Unique
  ```
- [ ] Audit each store for anti-patterns:
  - ❌ `const allState = useStore();` (subscribes to everything)
  - ❌ Actions inside store (causes subscribers to actions)
  - ❌ No selectors
- [ ] **Refactor pattern** (apply to each store):
  ```typescript
  // BEFORE (anti-pattern)
  export const useProjectStore = create((set) => ({
    projects: [],
    selectedId: null,
    updateProject: (id, data) => set(...)
  }));
  
  // AFTER (optimized)
  import {create} from 'zustand';
  import {shallow} from 'zustand/shallow';
  
  export const useProjectStore = create<ProjectState>((set) => ({
    projects: [],
    loading: false
  }));
  
  // External actions (no re-render on action changes)
  export const projectActions = {
    updateProject: (id: string, data: Partial<Project>) => {
      useProjectStore.setState(state => ({
        projects: state.projects.map(p => p.id === id ? {...p, ...data} : p)
      }));
    }
  };
  
  // Selectors
  export const useProject = (id: string) =>
    useProjectStore(state => state.projects.find(p => p.id === id), shallow);
  ```
- [ ] **Split large stores**:
  - `projectStore.ts` → project data only
  - `uiStore.ts` → selected IDs, modals, UI flags
  - `governanceStore.ts` → governance data (if used)
- [ ] Update components to use selectors:
  ```typescript
  // BEFORE
  const {projects, selectedId} = useProjectStore();
  
  // AFTER
  const project = useProject(selectedId);
  const {setSelected} = useUIStore();
  ```
- [ ] Test: Open Gantt with 50 projects; drag one bar; measure re-renders:
  - Install React DevTools Profiler
  - Before: expect 50+ components re-render
  - After: expect 2–5 components re-render

**Success Criteria**: Score +1.0 on Zustand Efficiency (2.0 → 3.0), +0.5 on Render Performance (2.5 → 3.0)

---

### 2.2 Memoize Heavy Components
**Files**: `app/renderer/components/GanttChart.tsx`, `ProjectCard.tsx`, etc.  
**Risk**: Unstable callbacks, missing `React.memo`, prop drilling.  
**Owner**: Frontend  
**Effort**: 6 hours

**Tasks**:
- [ ] Wrap expensive components in `React.memo`:
  ```typescript
  export const GanttChart = React.memo(() => {
    // component body
  });
  ```
- [ ] Stabilize callbacks with `useCallback`:
  ```typescript
  const handleUpdate = useCallback((id: string, data: Partial<Project>) => {
    projectActions.updateProject(id, data);
  }, []); // stable deps
  ```
- [ ] Move expensive computations to `useMemo`:
  ```typescript
  const allocatedRows = useMemo(() => {
    return allocateRows(projects); // runs only when projects change
  }, [projects]);
  ```
- [ ] Test: Profile with React DevTools → verify reduced render counts

**Success Criteria**: Score +0.5 on Render Performance (3.0 → 3.5)

---

## Phase 3: Packaging, Testing, Hygiene (Days 8–10) — P2/P3 Issues

### 3.1 Backup/Restore Integrity Verification
**File**: `app/main/services/BackupRestoreService.ts`  
**Risk**: Tampered backups undetected.  
**Owner**: Backend  
**Effort**: 3 hours

**Tasks**:
- [ ] Add SHA-256 hash to ZIP metadata:
  ```typescript
  import * as crypto from 'crypto';
  import AdmZip from 'adm-zip';
  
  // On backup
  const zip = new AdmZip();
  const dbBuffer = fs.readFileSync(dbPath);
  const hash = crypto.createHash('sha256').update(dbBuffer).digest('hex');
  zip.addFile('roadmap.db', dbBuffer);
  zip.getEntries()[0].comment = `SHA256:${hash}`;
  zip.writeZip(backupPath);
  
  // On restore
  const zip = new AdmZip(backupPath);
  const entry = zip.getEntry('roadmap.db');
  const expectedHash = entry.comment.replace('SHA256:', '');
  const actualHash = crypto.createHash('sha256').update(entry.getData()).digest('hex');
  if (expectedHash !== actualHash) throw new Error('Backup tampered');
  ```
- [ ] Test: Manually edit ZIP; restore → expect error

**Success Criteria**: Score +0.3 on Code Clarity (3.5 → 3.8)

---

### 3.2 Dependency Cleanup
**File**: `package.json`  
**Risk**: Bloat, unused deps, larger bundle.  
**Owner**: DevOps  
**Effort**: 1 hour

**Tasks**:
- [ ] Run depcheck:
  ```pwsh
  npm install -g depcheck
  npx depcheck
  ```
- [ ] Remove unused (per external docs):
  ```pwsh
  npm uninstall eventsource bonjour-service
  ```
- [ ] Add Zod (if not done in 1.2):
  ```pwsh
  npm install zod
  ```
- [ ] Add dev tools:
  ```pwsh
  npm install --save-dev ts-prune depcheck
  ```
- [ ] Add scripts to `package.json`:
  ```json
  {
    "scripts": {
      "deps:check": "depcheck",
      "deps:prune": "ts-prune | tee dead-code-report.txt"
    }
  }
  ```
- [ ] Test: `npm run build` → verify bundle size reduced

**Success Criteria**: Score +0.3 on Dependency Hygiene (3.0 → 3.3), −400 KB bundle

---

### 3.3 Add Governance Migration Tests (Unblock Build)
**File**: `tests/integration/governance-migration.test.ts` (new)  
**Risk**: v7 migration untested; prod DB corruption risk.  
**Owner**: Backend  
**Effort**: 4 hours

**Tasks**:
- [ ] Create test file:
  ```typescript
  import Database from 'better-sqlite3';
  import {migrateToV7} from '../../app/main/migrations/migration-v7-governance';
  
  describe('Governance Migration v6→v7', () => {
    let db: Database.Database;
  
    beforeEach(() => {
      db = new Database(':memory:');
      db.pragma('user_version = 6'); // simulate v6
      // Insert test projects
    });
  
    test('creates 14 governance tables', () => {
      migrateToV7(db);
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(tables).toContainEqual({name: 'governance_gates'});
      expect(tables).toContainEqual({name: 'project_benefits'});
      // ... 12 more
    });
  
    test('adds 7 default gates', () => {
      migrateToV7(db);
      const gates = db.prepare('SELECT * FROM governance_gates').all();
      expect(gates).toHaveLength(7);
      expect(gates[0].gate_name).toBe('Ideation');
    });
  
    test('preserves existing projects', () => {
      db.prepare('CREATE TABLE projects (id TEXT PRIMARY KEY, title TEXT)').run();
      db.prepare("INSERT INTO projects VALUES ('PRJ-1', 'Test')").run();
      migrateToV7(db);
      const projects = db.prepare('SELECT * FROM projects').all();
      expect(projects).toHaveLength(1);
    });
  
    test('sets user_version to 7', () => {
      migrateToV7(db);
      const version = db.pragma('user_version', {simple: true});
      expect(version).toBe(7);
    });
  });
  ```
- [ ] Test: `npm run test:integration`

**Success Criteria**: Score +0.3 on Testing (2.5 → 2.8)

---

### 3.4 Enable Code Signing (Prepare Only)
**File**: `package.json` electron-builder config  
**Risk**: Unsigned builds → tamper risk, SmartScreen warnings.  
**Owner**: DevOps  
**Effort**: 2 hours (prep only; actual signing requires cert)

**Tasks**:
- [ ] Update `package.json`:
  ```json
  {
    "build": {
      "forceCodeSigning": true,
      "win": {
        "certificateFile": "${CSC_LINK}",
        "certificatePassword": "${CSC_KEY_PASSWORD}",
        "signingHashAlgorithms": ["sha256"],
        "target": "nsis"
      }
    }
  }
  ```
- [ ] Document signing setup in `PACKAGING.md`:
  ```markdown
  ## Code Signing (Windows)
  1. Obtain certificate (.pfx) from IT Security
  2. Set environment variables:
     ```pwsh
     $env:CSC_LINK="C:\certs\roadmap.pfx"
     $env:CSC_KEY_PASSWORD="<redacted>"
     ```
  3. Build: `npm run package:win`
  4. Verify: Right-click `.exe` → Properties → Digital Signatures
  ```
- [ ] **Do not attempt to sign yet** (cert required; out of scope)

**Success Criteria**: Documentation ready; score unchanged (prep work)

---

## Phase 4: Fix Pre-Existing Governance Bugs (Days 11–14) — Out of Audit Scope

### 4.1 Governance Type Mismatches
**Status**: **BLOCKED until Phase 1–3 complete**  
**Effort**: 16 hours

**Root Cause**: Schema (`db-schema-governance.sql`) doesn't match TypeScript types (`app/main/types/governance.ts`).

**Strategy**:
1. Read `db-schema-governance.sql` → list actual columns
2. Read `app/main/types/governance.ts` → list expected interfaces
3. Create diff table:
   | Table | Schema Column | TS Interface | Fix |
   |-------|---------------|--------------|-----|
   | `project_benefits` | `benefit_value` | `expected_value` | Rename TS |
   | `escalations` | `escalation_status` | `resolution_status` | Rename TS |
4. Choose one of:
   - **Option A**: Fix TS types to match schema (safer; no DB migration)
   - **Option B**: Fix schema to match TS types (requires migration)
5. Update all 10 Governance services to use correct fields
6. Add unit tests for each service

**Out of Scope**: Not part of audit remediation; file separate ticket.

---

## Testing Strategy

### Test Coverage Targets
| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| Security (Encryption, TokenManager) | Unknown | 95% | P0 |
| IPC Handlers | Unknown | 90% | P0 |
| Zustand Stores | 0% (assumed) | 85% | P1 |
| Backup/Restore | Unknown | 90% | P1 |
| Governance | <50% (broken) | 80% | P3 (post-fix) |
| **Overall** | 63% (est.) | 80% | — |

### New Test Files Needed
- [ ] `tests/integration/ipc-validation.test.ts` (Zod schemas)
- [ ] `tests/integration/db-integrity.test.ts` (PRAGMA checks)
- [ ] `tests/integration/governance-migration.test.ts` (v7 migration)
- [ ] `tests/unit/stores/projectStore.test.ts` (selectors, actions)
- [ ] `tests/security/backup-integrity.test.ts` (SHA-256 verification)

---

## Rollout Plan

### Week 1 (Days 1–5)
- **Mon**: 1.1 Electron hardening + 1.3 DB integrity (3 hrs)
- **Tue–Wed**: 1.2 IPC validation (8 hrs)
- **Thu**: 2.1 Zustand audit (4 hrs)
- **Fri**: 2.1 Zustand refactor (8 hrs)

### Week 2 (Days 6–10)
- **Mon**: 2.2 Component memoization (6 hrs)
- **Tue**: 3.1 Backup integrity + 3.2 Dependency cleanup (4 hrs)
- **Wed**: 3.3 Governance migration tests (4 hrs)
- **Thu**: 3.4 Signing prep + final testing (4 hrs)
- **Fri**: Documentation + handoff

---

## Success Metrics

### Scorecard Improvement
| Criterion | Before | After | Δ |
|-----------|--------|-------|---|
| Electron Security | 2.0 | 3.5 | +1.5 |
| Typed IPC | 2.0 | 4.0 | +2.0 |
| Zustand Efficiency | 2.0 | 3.5 | +1.5 |
| Render Performance | 2.5 | 3.5 | +1.0 |
| Dependency Hygiene | 3.0 | 3.5 | +0.5 |
| Testing | 2.5 | 3.0 | +0.5 |
| **TOTAL** | **2.72** | **4.0+** | **+1.28** |

### Performance Targets
- **Render time** (50-project Gantt): 300 ms → 60 ms (−80%)
- **Bundle size**: 8 MB → 6.4 MB (−20%)
- **Startup time** (SSD): 1.2 s → 900 ms (−25%)
- **Test coverage**: 63% → 80% (+17%)

---

## Risk Mitigation

### Risks
1. **Zustand refactor breaks existing flows**: Mitigated by unit tests + manual smoke test checklist.
2. **IPC validation too strict**: Add `strict: false` flag to schemas for gradual rollout.
3. **Governance module still broken**: Isolated; does not block Phase 1–3 (core app works).
4. **Missing code signing cert**: Document process; sign later (no blocker).

### Rollback Plan
- Each phase is a separate PR with feature flag (if applicable).
- If Phase N fails, revert PR and continue with Phase N+1.
- Critical path: Phase 1 (security) must succeed before ship.

---

## Commands for Each Phase

### Phase 1 Commands
```pwsh
# 1.2 Install Zod
npm install zod

# 1.3 Test DB integrity
sqlite3 "C:\Users\smhar\Roadmap-Electron\app\data\roadmap.db" "PRAGMA integrity_check;"

# Run security tests
npm run test:security
```

### Phase 2 Commands
```pwsh
# 2.1 Find Zustand stores
Get-ChildItem -Path app\renderer -Recurse -Filter *.ts | Select-String "create\(|useStore" | Select-Object Path -Unique

# 2.1 Install shallow helper (if not included)
npm install zustand

# 2.2 Profile performance (manual in Chrome DevTools)
```

### Phase 3 Commands
```pwsh
# 3.2 Dependency cleanup
npm install -g depcheck
npx depcheck
npm uninstall eventsource bonjour-service
npm install --save-dev ts-prune

# 3.3 Run new migration tests
npm run test:integration

# 3.2 Check bundle size
Get-ChildItem -Path dist -Recurse | Measure-Object -Property Length -Sum
```

---

## Appendix: Out-of-Scope Items

These are **not** part of the audit remediation but should be tracked separately:

1. **Governance Module Type Fixes** (16 hrs) — See Phase 4
2. **Playwright E2E Setup** (8 hrs) — No config found; need `playwright.config.ts`
3. **CI/CD Pipeline** (12 hrs) — `.github/workflows/` empty; add lint/test/build jobs
4. **SBOM Generation** (2 hrs) — Add `@cyclonedx/cyclonedx-npm` to postbuild
5. **Auto-Update Strategy** (20 hrs) — Research electron-updater + hosting

---

## Approval & Sign-Off

- [ ] **Engineering Lead**: Approve scope and timeline
- [ ] **Security Lead**: Approve Phase 1 (critical security)
- [ ] **Product Owner**: Approve behavior-preserving constraint
- [ ] **QA Lead**: Approve test strategy and coverage targets

**Start Date**: TBD  
**Target Completion**: TBD + 10 working days  
**Next Review**: After Phase 1 completion (Day 3)

---

**End of Remediation Plan**
