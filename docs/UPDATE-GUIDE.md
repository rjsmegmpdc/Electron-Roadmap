# PRD Update Guide - Quick Reference

**Date**: 2025-11-21  
**Purpose**: Quick reference for updating COMPLETE-PRD.md and UNIFIED-PRD-JUNIOR-DEVELOPER.md

---

## Critical Corrections Needed

### 1. DataPersistenceManager Storage Format

**Current PRD Says**:
```javascript
localStorage.setItem('projectsData', JSON.stringify(projects))
```

**Actually Implements**:
```javascript
const dataToSave = {
  version: 3,
  timestamp: new Date().toISOString(),
  data: projects
};
localStorage.setItem('projectsData', JSON.stringify(dataToSave));
localStorage.setItem('projectsData_schema_version', '3');
```

**Update Required**: 
- COMPLETE-PRD.md Section 1.3 (Data Persistence)
- UNIFIED-PRD-JUNIOR-DEVELOPER.md Section on DataPersistenceManager
- Add migration system documentation (v1 → v2 → v3)

---

### 2. CSV Manager API

**Current PRD Says**:
```javascript
csvManager.exportProjectsCSV('simple')
csvManager.exportTasksCSV('simple')
csvManager.exportResourcesCSV('simple')
```

**Actually Implements**:
```javascript
csvManager.parseCSV(csvText)  // Returns {projects, errors, warnings}
csvManager.exportToCSV(projects, format)
csvManager.generateTemplate(format)
csvManager.downloadCSV(content, filename)
csvManager.detectFormat(csvText)
```

**Update Required**:
- UNIFIED-PRD-JUNIOR-DEVELOPER.md CSV Manager section
- Update all code examples
- Document actual return types

---

### 3. Strategic Layer (Missing from PRDs)

**Add New Section to COMPLETE-PRD.md**:

```markdown
## Strategic Planning Layer ✅ IMPLEMENTED

### Vision Management
- Create, read, update, delete visions
- Link goals to visions
- Track vision progress and success metrics

### Goal Management  
- CRUD operations for goals
- KPI tracking
- Link to parent vision
- Link initiatives to goals

### Initiative Management
- CRUD operations for initiatives
- Budget tracking (cents-based)
- Link to parent goal
- Link projects to initiatives
- Status tracking (planning, active, completed, cancelled)
- GitHub label support for work integration
```

**File**: `src/js/strategic/`
- strategic-layer-manager.js (200+ lines)
- vision.js
- goal.js  
- initiative.js
- strategic-dashboard.js

---

### 4. Infrastructure Modules (Undocumented)

**Add New Section to Both PRDs**:

```markdown
## Core Infrastructure ✅ IMPLEMENTED

### Config Manager (`config-manager.js`)
- Hierarchical configuration with dot notation
- Environment-based config
- Runtime configuration updates
- Default value support

### Logger (`logger.js`)
- Level-based logging (debug, info, warn, error)
- Log grouping support
- Context attachment
- Performance monitoring integration

### Error Handler (`error-handler.js`)
- Error categories (Storage, Validation, Network, etc.)
- Severity levels (Critical, High, Medium, Low)
- Structured error reporting
- Integration with logger

### Event Bus (`event-bus.js`)
- Pub/sub event system
- App-wide events (DATA_SAVED, DATA_LOADED, etc.)
- Event filtering and transformation
- Error handling for listeners
```

---

### 5. Work Integration Platform

**Current PRD Focus**: GitHub Issues with webhooks

**Actual Implementation**: Azure DevOps as primary, GitHub as secondary

**Files**:
- azure-devops-client.js (PRIMARY)
- github-client.js (secondary)
- work-integration.js
- work-template-engine.js
- work-sync-engine.js

**Update Required**: 
- UNIFIED-PRD-JUNIOR-DEVELOPER.md Work Integration section
- Document Azure DevOps as primary platform
- Update architecture diagrams

---

## New Sections to Add

### To COMPLETE-PRD.md

1. **Strategic Planning Layer** (after Section 2)
   - Vision/Goal/Initiative management
   - Hierarchy visualization
   - Progress tracking

2. **Core Infrastructure** (after Section 2)
   - Config Manager
   - Logger
   - Error Handler  
   - Event Bus

3. **UI Component System** (after Section 7)
   - Drag-Drop Enhanced
   - Keyboard Shortcuts Manager
   - Search/Filter System
   - Theme Manager
   - UI Components Manager

4. **Data Schema Versioning** (in Section 1.3)
   - Current version: v3
   - Migration system
   - Backward compatibility

---

### To UNIFIED-PRD-JUNIOR-DEVELOPER.md

1. **Strategic Layer Implementation** (new section)
   - Data models for Vision/Goal/Initiative
   - CRUD implementation examples
   - Hierarchy management
   - Persistence integration

2. **Infrastructure Setup** (new section)
   - How to use Config Manager
   - How to use Logger
   - How to use Error Handler
   - How to use Event Bus

3. **Update Project Structure** (Section on Directory Structure)
   ```
   src/js/
   ├── strategic/          # NEW - Strategic planning
   ├── integrations/       # UPDATE - Azure DevOps primary
   ├── ui/                 # NEW - UI components
   ├── validators/         # NEW - Validation system
   └── visualization/      # EXISTS
   ```

---

## Status Markers to Add

Use these markers throughout the PRDs:

- ✅ **IMPLEMENTED & TESTED** - Feature complete with passing tests
- ⚠️ **IMPLEMENTED WITH ISSUES** - Feature exists but tests failing or incomplete
- 🔮 **PLANNED** - Documented but not implemented
- ❌ **NOT IMPLEMENTED** - Documented but code missing
- 📝 **UNDOCUMENTED** - Code exists but not in PRD

---

## API Documentation Template

For each module, ensure documentation includes:

```markdown
### ModuleName (`path/to/file.js`)

**Status**: [✅|⚠️|❌] + Description

**Constructor**:
\```javascript
new ModuleName(dependencies)
\```

**Public API**:
\```javascript
// List all public methods with signatures
methodName(param1, param2)  // Description
\```

**Example Usage**:
\```javascript
// Real working example
const manager = new ModuleName(deps);
const result = manager.methodName(arg1, arg2);
\```

**Test Coverage**: XX%

**Known Issues**: [List any failing tests or bugs]

**Dependencies**: [List module dependencies]
```

---

## Test Status Documentation

Add test status to each feature:

```markdown
**Test Status**: 
- Unit Tests: XX passing / YY failing (ZZ% coverage)
- Integration Tests: XX passing / YY failing
- Known Failures: [Brief description]
```

---

## Data Model Updates

### ProjectManager

**Add to data model**:
```javascript
{
  // ... existing fields ...
  initiative_id: string | null,  // NEW: Link to strategic initiative
  created_at: string,            // NEW: ISO timestamp (added by persistence)
  updated_at: string,            // NEW: ISO timestamp (added by persistence)
  version: number                // NEW: Entity version (added by persistence)
}
```

---

## Common Patterns to Document

### 1. Dependency Injection Pattern
All managers use constructor injection:
```javascript
constructor(dataPersistenceManager, otherDeps) {
  this.dataPM = dataPersistenceManager;
}
```

### 2. Error Handling Pattern
```javascript
try {
  // operation
  eventBus.emit('operation:success', data);
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  errorHandler.handle(error, 'Context.method');
  throw error;
}
```

### 3. Event Emission Pattern
```javascript
// Before operation
eventBus.emit('entity:creating', { entity });

// After operation  
eventBus.emit('entity:created', { entity });
```

---

## Files Needing Updates

### Priority 1 (Critical)
- [ ] docs/COMPLETE-PRD.md
- [ ] docs/UNIFIED-PRD-JUNIOR-DEVELOPER.md
- [ ] README.md (update feature list)

### Priority 2 (Important)
- [ ] tests/unit/data-persistence-manager.test.js
- [ ] tests/unit/csv-manager.test.js
- [ ] tests/unit/form-validation.test.js
- [ ] tests/unit/integrations/work/work-integration.test.js

### Priority 3 (Nice to Have)
- [ ] Add JSDoc to all modules
- [ ] Create ARCHITECTURE.md
- [ ] Create TESTING.md
- [ ] Create CONTRIBUTING.md

---

## Quick Commands for Verification

```powershell
# Run tests
npm test

# Check specific test file
npm test -- tests/unit/data-persistence-manager.test.js

# Get test summary
npm test 2>&1 | Select-String -Pattern "Test Suites:"

# Count lines in a file
(Get-Content "src/js/visualization/dashboard-system.js").Count

# List all JS files
Get-ChildItem -Path "src/js" -Recurse -Filter "*.js" | Select-Object FullName
```

---

## Next Steps

1. ✅ **DONE** - Created PROJECT-ASSESSMENT.md
2. ✅ **DONE** - Created UPDATE-GUIDE.md
3. **TODO** - Update COMPLETE-PRD.md with corrections
4. **TODO** - Update UNIFIED-PRD-JUNIOR-DEVELOPER.md with corrections  
5. **TODO** - Fix failing tests
6. **TODO** - Verify visualization features

---

**Last Updated**: 2025-11-21  
**By**: Project Assessment Analysis
