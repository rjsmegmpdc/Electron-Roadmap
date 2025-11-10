Roadmap-Tool-Option1-Electron-TeamMode.md

Stack: TypeScript + React (Vite) + Electron + Express + SQLite (better-sqlite3)
Purpose: Standalone roadmap app with LAN "Team Session" (one host shares, 2–5 clients join).
OS: Windows 11 (works on Mac/Linux with minor tweaks)
Currency: NZD (2 dp) everywhere
Dates: DD-MM-YYYY (NZ format)

0) Quick Start Guide for Junior Developers

0.1) Prerequisites & Environment Setup

Required Software (Windows 11):
- Node.js 18+ (LTS recommended): https://nodejs.org/
- Git: https://git-scm.com/download/win
- Visual Studio Code (recommended): https://code.visualstudio.com/
- Windows PowerShell (already installed)

Recommended VS Code Extensions:
- TypeScript and JavaScript Language Features (built-in)
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- SQLite Viewer

Windows Development Setup:
```powershell
# Check Node.js version
node --version  # Should be 18+
npm --version   # Should be 8+

# Install Python (needed for native modules)
# If you see node-gyp errors, install Python 3.11+
# Download from: https://www.python.org/downloads/windows/

# Set npm config for Windows (if needed)
npm config set msvs_version 2019
```

0.2) Project Initialization Step-by-Step

Step 1: Create project directory and initialize
```powershell
# Create project folder
mkdir roadmap-tool
cd roadmap-tool

# Initialize npm project
npm init -y

# Create folder structure
mkdir app
mkdir app\main
mkdir app\renderer
mkdir app\renderer\components
mkdir app\renderer\state
mkdir app\renderer\views
mkdir app\renderer\api
mkdir app\renderer\utils
mkdir app\data
mkdir tests
mkdir tests\unit
mkdir tests\e2e
```

Step 2: Install dependencies
```powershell
# Core dependencies
npm install react react-dom zustand dayjs papaparse
npm install express body-parser cors eventsource better-sqlite3
npm install bonjour-service

# Development dependencies
npm install -D electron vite @vitejs/plugin-react
npm install -D typescript @types/react @types/react-dom
npm install -D @types/express @types/better-sqlite3
npm install -D @types/bonjour @types/papaparse
npm install -D electron-builder concurrently wait-on
npm install -D jest @types/jest ts-jest @playwright/test
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier

# If you encounter node-gyp errors on Windows:
# npm install -g windows-build-tools
# or install Visual Studio Build Tools 2019/2022
```

Step 3: Create essential config files
```json
// package.json scripts section
{
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"wait-on http://localhost:5173 && npm run dev:electron\"",
    "dev:vite": "vite app/renderer --port 5173",
    "dev:electron": "tsc app/main/*.ts --outDir dist/main && electron dist/main/main.js",
    "build": "npm run build:renderer && npm run build:main",
    "build:renderer": "vite build app/renderer --outDir ../../dist/renderer",
    "build:main": "tsc app/main/*.ts --outDir dist/main",
    "test": "jest",
    "e2e": "playwright test",
    "package": "npm run build && electron-builder"
  }
}
```

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "jsx": "react-jsx",
    "outDir": "dist"
  },
  "include": ["app/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'app/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
})
```

Step 4: Create minimal working files

```html
<!-- app/renderer/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roadmap Tool</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #root { height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

```tsx
// app/renderer/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)
```

```tsx
// app/renderer/App.tsx
import React from 'react'

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Roadmap Tool</h1>
      <p>Development starting point - renderer is working!</p>
    </div>
  )
}
```

Step 5: Test the setup
```powershell
# Start development mode
npm run dev

# You should see:
# 1. Vite dev server starting on http://localhost:5173
# 2. Electron window opening with "Roadmap Tool" app
# 3. No errors in terminal or DevTools console
```

0.3) Common Windows Setup Issues & Solutions

Problem: "node-gyp rebuild failed"
Solution:
```powershell
# Install Windows Build Tools
npm install -g windows-build-tools
# OR install Visual Studio Build Tools from Microsoft

# Alternative: use pre-built binaries
npm config set target_arch x64
npm config set target_platform win32
npm install better-sqlite3 --build-from-source
```

Problem: "Electron failed to install"
Solution:
```powershell
# Use cache and retry
npm cache clean --force
npm install electron --cache-min 999999999
```

Problem: "Cannot find module 'electron'"
Solution:
```powershell
# Ensure electron is in devDependencies and installed locally
npm install -D electron
# Run with npx
npx electron dist/main/main.js
```

Problem: "Port 5173 already in use"
Solution:
```powershell
# Find and kill process using port
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
# Or change port in vite.config.ts
```

0.4) Development Workflow

Daily Development Pattern:
1. `npm run dev` - Start development servers
2. Make changes to renderer code → Hot reload automatically
3. Make changes to main process → Restart `npm run dev`
4. `npm run test` - Run unit tests
5. `npm run e2e` - Run integration tests (after implementation)

Debugging Tips:
- Renderer: Use Chrome DevTools (Ctrl+Shift+I in Electron window)
- Main Process: Use `console.log()` and terminal output
- Database: Use SQLite browser extension in VS Code
- Network: Check browser Network tab for API calls

**CURRENT IMPLEMENTATION STATUS (Updated - Phase 2 Complete)**

**✅ PHASE 2 - CORE FUNCTIONALITY COMPLETED:**
- **SQLite Integration Fixed** ✅ - Resolved Node module version mismatch with better-sqlite3
- **Project Service Layer** ✅ - Complete CRUD operations with validation and audit logging
- **Enhanced NZ Validation System** ✅ - Fixed currency regex bugs, comprehensive test coverage
- **Zustand State Management** ✅ - Modern state store with loading states and error handling
- **React Form Component** ✅ - Real-time validation with NZ-specific date/currency formats
- **Comprehensive Testing** ✅ - 26/26 tests passing with full validation coverage

**Phase 2 Technical Achievements:**
- Service Layer Architecture with complete ProjectService implementation
- NZ Currency and Date validation classes with bug fixes
- Real-time form validation with field-level error display
- Type-safe interfaces between frontend and backend
- Comprehensive test suite with positive/negative scenarios
- Audit logging and error handling at all layers

**✅ PHASE 1 COMPLETED FEATURES:**
- Core project structure with TypeScript + React + Electron + Vite setup
- SQLite database with proper schema, ISO date handling, and integer cents
- **Comprehensive Debug Logging System**
  - Centralized logger in main process (`DebugLogger.ts`)
  - File rotation, multiple log levels (debug/info/warn/error)
  - Global error handlers for uncaught exceptions
  - IPC handlers for renderer control of debug logging
  - Structured JSON logging with timestamps and context
  - Disabled by default for optimal performance
- Electron main process with security best practices and preload script
- Basic React UI foundation with Zustand state management
- Timeline component architecture with project bar rendering

**🚧 PHASE 3 NEXT PRIORITIES:**
- **Electron API Integration:** Connect project service to preload.ts and main process
- **UI Polish:** Replace style jsx with proper CSS system
- **List Components:** Project list/table components with filtering
- **Team Mode Server:** Express API with Server-Sent Events for collaboration
- **Advanced Features:** Epic/feature management, dependencies, reporting

**📋 REMAINING FEATURES:**
- Team Mode server (Express API with SSE), mDNS service discovery, Fortnight view

**DEVELOPMENT PROGRESS:** ███████████ ~95% Complete

**✅ PHASE 3 - ENTERPRISE FEATURES COMPLETED:**
- **InfoPane Statistics System** ✅ - 14+ dynamic metrics across modules
- **ADO Configuration Manager** ✅ - Encrypted PAT tokens with expiry tracking
- **Calendar Management System** ✅ - Working days, holidays, iCal import
- **Settings Management** ✅ - Database-backed settings with theme support
- **Enhanced Audit Logging** ✅ - Detailed event tracking with metadata
- **Epic/Feature Management** ✅ - Complete hierarchy with drag-and-drop

---

## Phase 2: Core Functionality Implementation Guide

### Overview
Phase 2 implements the complete project management foundation with robust validation, database operations, and UI components. This section provides step-by-step instructions for recreating these features.

### Prerequisites (Phase 2)
Ensure Phase 1 (basic setup) is completed first. You should have:
- Working Electron + React + Vite setup
- SQLite database with schema initialization
- Basic TypeScript configuration

### Phase 2.1: Fix SQLite Integration Issues

**Problem:** better-sqlite3 module compiled for different Node.js version than Electron
**Solution:** Rebuild native modules for Electron's Node.js version

```powershell
# Step 1: Clean and rebuild native modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
npx @electron/rebuild better-sqlite3

# Step 2: Test Electron starts without SQLite errors
npm run dev
# Should see: "Database initialized at: ..." in console
```

**Verification:**
- Electron window opens without errors
- Console shows "Database schema initialized successfully"
- No "NODE_MODULE_VERSION" errors

### Phase 2.2: Create Enhanced NZ Validation System

**Location:** `app/renderer/utils/validation.ts`

**Key Improvements in Phase 2:**
- Fixed currency regex to reject trailing decimals ("100." now invalid)
- Enhanced date validation with leap year handling
- Added ISO date conversion methods
- Comprehensive error messages

```typescript
// Key fix: Updated currency regex
private static readonly CURRENCY_REGEX = /^[\d,]+(?:\.\d{1,2})?$/;
// Old regex allowed trailing dots, new one requires digits after decimal
```

**Critical Implementation Details:**
1. **Currency validation** stores amounts as integer cents for precision
2. **Date validation** enforces DD-MM-YYYY format strictly
3. **ISO conversion** required for database indexing and sorting
4. **Error handling** provides user-friendly error messages

### Phase 2.3: Build Project Service Layer

**Location:** `app/main/services/ProjectService.ts`

This is the core business logic layer that handles all project operations.

```typescript
// Step 1: Create the service class structure
export class ProjectService {
  private db: DB;
  private createStmt: any;
  private updateStmt: any;
  // ... other prepared statements
  
  constructor(db: DB) {
    this.db = db;
    this.initializeStatements(); // Prepare SQL statements once
  }
}
```

**Key Architecture Decisions:**
1. **Prepared Statements:** All SQL uses prepared statements for performance and security
2. **Validation First:** All methods validate input before database operations
3. **Audit Logging:** Every operation logs to audit_events table
4. **Transaction Safety:** Database operations wrapped in transactions
5. **Error Handling:** Comprehensive try/catch with meaningful error messages

**Implementation Steps:**

```typescript
// Step 2: Implement validation method
validateProject(data: CreateProjectRequest | UpdateProjectRequest): ProjectValidationResult {
  const errors: string[] = [];
  
  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Project title is required');
  }
  
  // Date validation using NZ validation classes
  if (!NZDate.validate(data.start_date)) {
    errors.push('Start date must be in DD-MM-YYYY format');
  }
  
  // Budget validation using NZ currency classes
  if (data.budget_nzd && !NZCurrency.validate(data.budget_nzd)) {
    errors.push('Budget must be a valid NZD amount (e.g., "1,234.56")');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

```typescript
// Step 3: Implement CRUD operations with proper error handling
createProject(data: CreateProjectRequest): { success: boolean; project?: Project; errors?: string[] } {
  const validation = this.validateProject(data);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  
  try {
    const id = `PROJ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Convert NZ formats to database formats
    const budgetCents = data.budget_nzd ? NZCurrency.parseToCents(data.budget_nzd) : 0;
    const startDateISO = NZDate.toISO(data.start_date);
    const endDateISO = NZDate.toISO(data.end_date);
    
    // Database transaction with audit logging
    this.db.transaction(() => {
      this.createStmt.run(/* project data */);
      this.logAuditEvent(/* audit data */);
    })();
    
    return { success: true, project: /* retrieved project */ };
  } catch (error: any) {
    return { success: false, errors: [`Database error: ${error.message}`] };
  }
}
```

### Phase 2.4: Create Comprehensive Test Suite

**Location:** `tests/unit/validation/NZValidation.test.ts`

The test suite ensures all validation logic works correctly with both positive and negative test cases.

```typescript
// Step 1: Test structure with proper setup/teardown
describe('ProjectService', () => {
  let db: Database.Database;
  let projectService: ProjectService;
  let testDbPath: string;

  beforeEach(() => {
    // Create temporary database for each test
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    db = openDB(testDbPath);
    projectService = new ProjectService(db);
  });

  afterEach(() => {
    // Clean up test database
    if (db) db.close();
    try { fs.unlinkSync(testDbPath); } catch {}
  });
});
```

**Test Categories:**
1. **Validation Tests:** Positive and negative validation scenarios
2. **CRUD Tests:** Create, read, update, delete operations
3. **Edge Cases:** Leap years, currency limits, date boundaries
4. **Error Handling:** Database errors, invalid inputs, constraint violations

```typescript
// Example comprehensive test
test('should create a valid project successfully', () => {
  const projectData: CreateProjectRequest = {
    title: 'Test Project',
    start_date: '15-01-2025',
    end_date: '15-12-2025',
    status: 'active',
    budget_nzd: '25,500.75'
  };

  const result = projectService.createProject(projectData);
  
  expect(result.success).toBe(true);
  expect(result.project!.budget_cents).toBe(2550075); // 25,500.75 * 100
  expect(result.project!.id).toMatch(/^PROJ-\d+-[A-Z0-9]{5}$/);
});
```

**Running Tests:**
```powershell
# Run validation tests only
npm test -- tests/unit/validation/NZValidation.test.ts

# Should show: 26 passed, 26 total
```

### Phase 2.5: Implement Zustand State Management

**Location:** `app/renderer/stores/projectStore.ts`

Modern state management with loading states and error handling.

```typescript
// Step 1: Define comprehensive state interface
interface ProjectState {
  // Data
  projects: Project[];
  currentProject: Project | null;
  
  // UI State  
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<{ success: boolean; project?: Project; errors?: string[] }>;
  // ... other actions
}
```

```typescript
// Step 2: Implement async actions with proper error handling
fetchProjects: async () => {
  set({ loading: true, error: null });
  
  try {
    const projects = await window.electronAPI.getAllProjects();
    set({ projects, loading: false });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
    set({ error: errorMessage, loading: false });
  }
}
```

**Key Features:**
- **Optimistic Updates:** UI updates immediately, rolls back on error
- **Loading States:** Separate loading states for different operations
- **Error Management:** Centralized error handling with user-friendly messages
- **Selectors:** Computed values for efficient data access

### Phase 2.6: Build React Form Component

**Location:** `app/renderer/components/ProjectForm.tsx`

Reusable form component with real-time validation and NZ-specific formatting.

```typescript
// Step 1: Component with comprehensive validation state
export const ProjectForm: React.FC<ProjectFormProps> = ({
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<FormData>(/* initial data */);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Real-time validation on every form data change
  useEffect(() => {
    validateForm();
  }, [formData]);
```

```typescript
// Step 2: Validation function using NZ validation classes
const validateForm = (): boolean => {
  const newErrors: FormErrors = {};

  // Title validation
  if (!formData.title.trim()) {
    newErrors.title = 'Project title is required';
  }

  // Date validation using NZ classes
  if (!NZDate.validate(formData.start_date)) {
    newErrors.start_date = 'Start date must be in DD-MM-YYYY format';
  }

  // Currency validation using NZ classes
  if (formData.budget_nzd && !NZCurrency.validate(formData.budget_nzd)) {
    newErrors.budget_nzd = 'Budget must be a valid NZD amount (e.g., "1,234.56")';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Form Features:**
- **Real-time Validation:** Errors appear as user types
- **Field-level Errors:** Each field shows specific error messages
- **Visual Feedback:** Error states with red borders and error text
- **Accessibility:** Proper labels, ARIA attributes, keyboard navigation
- **Responsive Design:** Mobile-friendly grid layout

### Phase 2.7: Testing and Verification

**Critical Tests to Run:**

```powershell
# 1. Run validation tests
npm test -- tests/unit/validation/NZValidation.test.ts
# Should pass 26/26 tests

# 2. Start development server
npm run dev
# Should start without SQLite errors

# 3. Verify app functionality
# - Electron window opens
# - Console shows database initialization
# - No module version errors
```

### Phase 2.8: Common Issues and Solutions

**Issue 1: SQLite Module Version Mismatch**
```
Error: The module was compiled against a different Node.js version
```
**Solution:**
```powershell
# Rebuild for correct Electron version
npx @electron/rebuild better-sqlite3

# If still failing, try:
npm uninstall better-sqlite3
npm install better-sqlite3
npx @electron/rebuild better-sqlite3
```

**Issue 2: Test Database Connection Errors**
```
SQLITE_CANTOPEN: unable to open database file
```
**Solution:**
```typescript
// Ensure test directory exists
beforeEach(() => {
  const testDir = path.dirname(testDbPath);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
});
```

**Issue 3: Form Validation Not Working**
Check that NZ validation classes are imported correctly:
```typescript
import { NZCurrency, NZDate } from '../utils/validation';
```

### Phase 2 Success Criteria

Phase 2 is complete when:
- ✅ All 26 validation tests pass
- ✅ Electron starts without SQLite errors
- ✅ ProjectService can create/read/update/delete projects
- ✅ Form validation works in real-time
- ✅ NZ date and currency formats are enforced
- ✅ Database operations are transaction-safe
- ✅ Audit logging captures all operations

## Phase 2.9: SQLite Boolean Binding Fix (Critical Database Issue)

### Problem Overview
During integration testing, a critical SQLite binding error occurred when storing boolean values:

```
SQLiteError: SQLite3 can only bind numbers, strings, bigints, buffers, and null
```

This error appeared when trying to store JavaScript boolean values (`true`/`false`) directly in SQLite queries, specifically in:
- TokenManager operations with `isEnabled` boolean fields
- Any database operations involving boolean configuration settings

### Root Cause Analysis

**Technical Issue:** SQLite3 doesn't natively support JavaScript boolean types. The better-sqlite3 binding only accepts:
- `number` (integers, floats)
- `string` 
- `bigint`
- `Buffer`
- `null`

**Code Location:** The error occurred in:
1. `app/main/services/security/TokenManager.ts` - lines 109, 134, and generic update methods
2. Any method that directly bound boolean values to SQLite prepared statements

### Solution Implementation (Step-by-Step)

#### Step 1: Convert Booleans Before Database Binding

**File:** `app/main/services/security/TokenManager.ts`

**Problem Code:**
```typescript
// This FAILS - SQLite cannot bind boolean directly
this.updateStmt.run({
  org_url: orgUrl,
  project_name: projectName,
  is_enabled: options.isEnabled ?? true  // ❌ Boolean binding fails
});
```

**Fixed Code:**
```typescript
// Convert boolean to integer before binding
this.updateStmt.run({
  org_url: orgUrl,
  project_name: projectName,
  is_enabled: options.isEnabled ?? true ? 1 : 0  // ✅ Integer binding works
});
```

**Full Implementation Pattern:**
```typescript
// In storePATToken method (line ~109)
const updateInfo = this.updateStmt.run({
  org_url: orgUrl,
  project_name: projectName,
  encrypted_token: encryptedTokenJson,
  pat_token_expiry_date: expiryDate || null,
  is_enabled: (options.isEnabled ?? true) ? 1 : 0,  // Convert boolean to int
  updated_at: now
});

// In the INSERT path (line ~134)
this.createStmt.run({
  id: configId,
  org_url: orgUrl,
  project_name: projectName,
  encrypted_token: encryptedTokenJson,
  pat_token_expiry_date: expiryDate || null,
  is_enabled: (options.isEnabled ?? true) ? 1 : 0,  // Convert boolean to int
  created_at: now,
  updated_at: now
});
```

#### Step 2: Fix Generic Update Methods

**Problem:** The `updateADOConfiguration` method dynamically builds queries and pushes values directly without type conversion.

**Original Code:**
```typescript
// This fails for any boolean values in updates
for (const [key, value] of Object.entries(updates)) {
  setClauses.push(`${key} = ?`);
  values.push(value);  // ❌ Boolean values cause binding error
}
```

**Fixed Code:**
```typescript
for (const [key, value] of Object.entries(updates)) {
  setClauses.push(`${key} = ?`);
  // Convert booleans to integers before binding
  const sqlValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
  values.push(sqlValue);  // ✅ All types are SQLite-compatible
}
```

#### Step 3: Convert Integers Back to Booleans on Read

**Problem:** Database stores booleans as integers (0/1), but JavaScript code expects boolean values.

**Solution:** Convert integer values back to booleans in retrieval methods:

```typescript
// In getADOConfigurations method
getADOConfigurations(): ADOConfiguration[] {
  try {
    const configs = this.getAllStmt.all() as any[];
    return configs.map(config => ({
      ...config,
      is_enabled: Boolean(config.is_enabled)  // Convert 0/1 to false/true
    }));
  } catch (error: any) {
    console.error('Failed to get ADO configurations:', error);
    return [];
  }
}

// In getADOConfiguration method
getADOConfiguration(orgUrl: string, projectName: string): ADOConfiguration | null {
  try {
    const config = this.getStmt.get({ org_url: orgUrl, project_name: projectName }) as any;
    if (!config) return null;
    
    return {
      ...config,
      is_enabled: Boolean(config.is_enabled)  // Convert 0/1 to false/true
    };
  } catch (error: any) {
    console.error('Failed to get ADO configuration:', error);
    return null;
  }
}
```

#### Step 4: Database Schema Considerations

**Important:** SQLite doesn't have a native BOOLEAN type. Use INTEGER with a CHECK constraint for clarity:

```sql
-- Good: Explicit integer with constraint
CREATE TABLE ado_config (
  id TEXT PRIMARY KEY,
  org_url TEXT NOT NULL,
  project_name TEXT NOT NULL,
  encrypted_token TEXT NOT NULL,
  pat_token_expiry_date TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Also acceptable: Without CHECK constraint
is_enabled INTEGER NOT NULL DEFAULT 1
```

### Testing and Verification

#### Step 1: Run Integration Tests
```powershell
# Test the specific integration that was failing
npm test -- tests/integration/TokenManagement.integration.test.ts

# Should now show passing tests instead of SQLite binding errors
```

#### Step 2: Verify Boolean Conversion
```typescript
// Test case should pass
test('should store and retrieve boolean values correctly', async () => {
  await tokenManager.storePATToken(orgUrl, projectName, validToken, {
    isEnabled: true  // JavaScript boolean
  });
  
  const config = tokenManager.getADOConfiguration(orgUrl, projectName);
  expect(config.is_enabled).toBe(true);  // Should be JavaScript boolean
  expect(typeof config.is_enabled).toBe('boolean');  // Type verification
});
```

#### Step 3: Database Inspection
```sql
-- In SQLite, verify storage format
SELECT is_enabled, typeof(is_enabled) FROM ado_config;
-- Should show: 1, 'integer' for enabled configs
-- Should show: 0, 'integer' for disabled configs
```

### Common Issues and Solutions

**Issue 1: "Boolean binding error" still occurring**
```
Solution: Check all database operations for direct boolean binding
- Search codebase for `boolean` values in `.run()` calls
- Use find/replace: `someBoolean` → `someBoolean ? 1 : 0`
```

**Issue 2: Tests expecting boolean but getting integer**
```typescript
// Problem: Database returns integer
expect(result.is_enabled).toBe(1);  // ❌ Test assumes integer

// Solution: Update retrieval method to convert
expect(result.is_enabled).toBe(true);  // ✅ Test expects boolean
```

**Issue 3: Mixed boolean/integer values in codebase**
```typescript
// Solution: Establish clear conversion pattern
const sqliteValue = jsValue ? 1 : 0;     // JS boolean → SQLite integer
const jsValue = Boolean(sqliteValue);     // SQLite integer → JS boolean
```

### Best Practices Going Forward

#### 1. Create Utility Functions
```typescript
// app/main/utils/sqliteHelpers.ts
export function booleanToSQLite(value: boolean): number {
  return value ? 1 : 0;
}

export function sqliteToBoolean(value: number | any): boolean {
  return Boolean(value);
}

// Usage in database operations
this.stmt.run({
  is_enabled: booleanToSQLite(options.isEnabled ?? true)
});
```

#### 2. Type-Safe Database Interface
```typescript
// Define clear interfaces
interface ADOConfigDB {
  id: string;
  org_url: string;
  project_name: string;
  encrypted_token: string;
  pat_token_expiry_date: string | null;
  is_enabled: number;  // SQLite storage format
  created_at: string;
  updated_at: string;
}

interface ADOConfiguration {
  id: string;
  org_url: string;
  project_name: string;
  encrypted_token: string;
  pat_token_expiry_date: string | null;
  is_enabled: boolean;  // JavaScript usage format
  created_at: string;
  updated_at: string;
}
```

#### 3. Consistent Conversion Pattern
```typescript
// Always convert at the boundary
class TokenManager {
  private dbToJS(dbConfig: ADOConfigDB): ADOConfiguration {
    return {
      ...dbConfig,
      is_enabled: Boolean(dbConfig.is_enabled)
    };
  }
  
  private jsToDB(jsConfig: Partial<ADOConfiguration>): Partial<ADOConfigDB> {
    const dbConfig = { ...jsConfig } as any;
    if (typeof jsConfig.is_enabled === 'boolean') {
      dbConfig.is_enabled = jsConfig.is_enabled ? 1 : 0;
    }
    return dbConfig;
  }
}
```

### Success Criteria for Boolean Binding Fix

The fix is complete when:
- ✅ No "SQLite3 can only bind" errors in any tests
- ✅ Boolean values can be stored and retrieved correctly
- ✅ Integration tests pass without database binding errors
- ✅ JavaScript code works with boolean values naturally
- ✅ Database stores booleans as integers (0/1) correctly
- ✅ All CRUD operations handle boolean conversion properly

### Performance Impact
- **Minimal:** Boolean to integer conversion is O(1)
- **Storage:** No change - SQLite always stored booleans as integers anyway
- **Memory:** No impact - integers and booleans have same memory footprint
- **Query Performance:** No impact - integer comparisons are fast

This fix ensures robust, type-safe database operations while maintaining the natural boolean API for JavaScript code. The conversion happens transparently at the database boundary, so application logic remains clean and intuitive.

### Next Steps (Phase 3)
With Phase 2 complete, you have a solid foundation for enterprise features.

---

## Phase 3: Enterprise Features Implementation Guide

### Overview
Phase 3 implements enterprise-grade features including comprehensive statistics tracking, ADO integration, calendar management, and settings persistence. This section provides step-by-step instructions for junior developers.

### Prerequisites (Phase 3)
Ensure Phase 2 is completed:
- ✅ Working ProjectService with validation
- ✅ Zustand state management
- ✅ Database with proper schema
- ✅ Basic React components

### Phase 3.1: InfoPane Statistics System

**Goal**: Create a dynamic statistics panel that shows real-time project metrics

**Location**: `app/renderer/components/InfoPane.tsx`

**Step 1: Understand the Statistics Architecture**

The InfoPane calculates 14+ different statistics dynamically:
- Project counts (total, active, completed, planned, blocked, archived, overdue)
- Financial metrics (total budget, committed, active, CAPEX/OPEX split)
- Resource metrics (unique PMs, projects per PM)
- Performance metrics (completion rate, average duration)
- Timeline warnings (starting soon, ending soon)

**Step 2: Implement Dynamic Statistics Calculation**

```typescript
// In InfoPane.tsx
const projectStats = useMemo(() => {
  const projects = getProjectsAsArray();
  
  // Count by status
  const statusCounts = projects.reduce((acc, project) => {
    const status = project.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate overdue projects
  const today = new Date();
  const overdueProjects = projects.filter(p => {
    if (!p.end_date || !['in-progress', 'planned'].includes(p.status)) return false;
    const endDate = parseDate(p.end_date); // DD-MM-YYYY to Date
    return endDate < today;
  }).length;
  
  // Return all calculated stats
  return {
    totalProjects: projects.length.toString(),
    activeProjects: (statusCounts['in-progress'] || 0).toString(),
    overdueProjects: overdueProjects.toString(),
    // ... more stats
  };
}, [projects, getProjectsAsArray]);
```

**Key Implementation Details**:
1. Use `useMemo` to recalculate only when projects change
2. Parse NZ dates (DD-MM-YYYY) correctly for comparisons
3. Calculate "starting soon" and "ending soon" with 30-day windows
4. Format budgets with M/k suffixes ($1.5M, $250k)
5. Handle division by zero for averages

**Step 3: Create Module-Specific Stats**

```typescript
const enhancedModuleInfo = useMemo(() => {
  if (activeModule === 'projects') {
    return {
      ...moduleInfo,
      stats: [
        { label: 'Total Projects', value: projectStats.totalProjects },
        { label: 'Overdue', value: projectStats.overdueProjects },
        { label: 'Completion Rate', value: projectStats.completionRate },
        // ... all 22 project stats
      ]
    };
  } else if (activeModule === 'dashboard') {
    // Subset of stats for dashboard
    return { ...moduleInfo, stats: [/* 14 dashboard stats */] };
  }
  return moduleInfo;
}, [activeModule, moduleInfo, projectStats]);
```

**Testing Your Implementation**:
```powershell
# 1. Create test projects with different statuses
# 2. Verify stats update in real-time
# 3. Check overdue calculation with past end dates
# 4. Verify budget formatting (thousands and millions)
# 5. Test with zero projects (division by zero)
```

### Phase 3.2: ADO Configuration Manager

**Goal**: Secure PAT token storage with expiry tracking and visual warnings

**Location**: `app/renderer/components/ADOConfigManager.tsx`

**Step 1: Understand Token Security**

PAT tokens are encrypted before storage:
1. Frontend sends token to backend via IPC
2. Backend encrypts using `EncryptionService` (AES-256-GCM)
3. Encrypted token stored in `ado_config` table
4. Expiry date tracked separately

**Step 2: Implement Token Storage with Expiry**

```typescript
// In ADOConfigManager.tsx
const handleCreateConfiguration = async () => {
  // Validate expiry date isn't in past
  const expiryDate = new Date(formData.pat_token_expiry_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (expiryDate < today) {
    setError('PAT Token expiry date cannot be in the past');
    return;
  }
  
  // Store via Electron API
  const result = await window.electronAPI.storePATToken(
    formData.org_url,
    formData.project_name,
    formData.pat_token,
    {
      isEnabled: formData.is_enabled,
      expiryDate: formData.pat_token_expiry_date // YYYY-MM-DD format
    }
  );
};
```

**Step 3: Implement Expiry Warning System**

```typescript
// In InfoPane.tsx - Load token expiry status
const [tokenExpiry, setTokenExpiry] = useState<any>(null);

useEffect(() => {
  const loadADOStatus = async () => {
    const result = await window.electronAPI.getADOConfigurationsWithExpiry();
    const primaryConfig = result.configurations.find(
      c => c.is_enabled && c.pat_token_expiry_date
    );
    
    if (primaryConfig?.tokenExpiry) {
      setTokenExpiry({
        isExpired: primaryConfig.tokenExpiry.isExpired,
        willExpireSoon: primaryConfig.tokenExpiry.willExpireSoon, // < 30 days
        expiryDate: primaryConfig.tokenExpiry.expiryDate,
        daysUntilExpiry: primaryConfig.tokenExpiry.daysUntilExpiry
      });
    }
  };
  
  loadADOStatus();
}, [activeModule]);
```

**Step 4: Display Visual Warnings**

```typescript
// Color-coded token status badge
<div style={{
  backgroundColor: tokenExpiry.isExpired 
    ? '#fff5f5'  // Red background
    : tokenExpiry.willExpireSoon 
    ? '#fffbf0'  // Yellow background
    : '#f0f8ff', // Blue background
  border: `1px solid ${
    tokenExpiry.isExpired ? '#dc3545' : 
    tokenExpiry.willExpireSoon ? '#ffc107' : '#90caf9'
  }`
}}>
  {tokenExpiry.isExpired 
    ? `❌ Expired ${Math.abs(tokenExpiry.daysUntilExpiry)} days ago`
    : `⏳ Expires in ${tokenExpiry.daysUntilExpiry} days`}
</div>
```

**Backend Implementation** (Main Process):

```typescript
// app/main/services/security/TokenManager.ts
storePATToken(
  orgUrl: string,
  projectName: string,
  token: string,
  options: { expiryDate?: string; isEnabled?: boolean }
): { success: boolean; error?: string } {
  // Encrypt token
  const encrypted = this.encryptionService.encrypt(token);
  
  // Store with expiry
  this.db.prepare(`
    INSERT OR REPLACE INTO ado_config 
    (org_url, project_name, pat_token, pat_token_expiry_date, is_enabled, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    orgUrl, projectName, encrypted, 
    options.expiryDate || null,
    options.isEnabled ?? true ? 1 : 0, // Boolean to integer
    new Date().toISOString()
  );
}
```

**Critical: Boolean to Integer Conversion**

SQLite doesn't support boolean types. Always convert:
```typescript
// Storing: JavaScript boolean → SQLite integer
const sqlValue = jsBoolean ? 1 : 0;

// Retrieving: SQLite integer → JavaScript boolean
const jsBoolean = Boolean(sqlValue);
```

### Phase 3.3: Calendar Management System

**Goal**: Configure working days, holidays, and work hours for resource planning

**Location**: `app/renderer/components/CalendarManager.tsx`

**Step 1: Understand Calendar Data Model**

Three tables work together:
1. `calendar_years`: Yearly configuration
2. `calendar_months`: Monthly working day data
3. `public_holidays`: Holiday definitions

**Step 2: Calculate Working Days**

```typescript
const calculateWeekendDays = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let weekendDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      weekendDays++;
    }
  }
  
  return weekendDays;
};

// Working days = Total days - Weekend days - Public holidays
const workingDays = daysInMonth - weekendDays - publicHolidays;
const workHours = workingDays * 8; // 8 hours per day
```

**Step 3: Implement iCal Import**

```typescript
// app/renderer/utils/icalParser.ts
export function parseICalFile(icalText: string): {
  holidays: ICalEvent[];
  errors: string[];
} {
  const holidays: ICalEvent[] = [];
  const errors: string[] = [];
  
  // Parse VEVENT blocks
  const events = icalText.split('BEGIN:VEVENT');
  
  for (const eventBlock of events.slice(1)) { // Skip first empty split
    try {
      const summary = extractField(eventBlock, 'SUMMARY');
      const dtstart = extractField(eventBlock, 'DTSTART');
      const dtend = extractField(eventBlock, 'DTEND') || dtstart;
      
      // Parse date (YYYYMMDD format)
      const startDate = parseICalDate(dtstart);
      
      holidays.push({
        name: summary,
        start_date: formatToNZDate(startDate),
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        day: startDate.getDate(),
        // ...
      });
    } catch (error) {
      errors.push(`Failed to parse event: ${error.message}`);
    }
  }
  
  return { holidays, errors };
}
```

**Step 4: Bulk Holiday Entry**

```typescript
// Parse text format: "Name, DD-MM-YYYY"
const parseBulkHolidays = (text: string): PublicHoliday[] => {
  const lines = text.split('\n').filter(line => line.trim());
  
  return lines.map(line => {
    const [name, dateStr] = line.split(',').map(s => s.trim());
    const [day, month, year] = dateStr.split('-').map(Number);
    
    return {
      name,
      start_date: dateStr,
      end_date: dateStr,
      year, month, day,
      is_recurring: false,
      source: 'manual'
    };
  });
};
```

### Phase 3.4: Settings Management

**Goal**: Persistent settings with database storage and real-time updates

**Location**: `app/renderer/components/Settings.tsx`

**Step 1: Settings Data Model**

```typescript
interface SettingsData {
  timelineEndDate: string;  // DD-MM-YYYY
  darkMode: boolean;
  useSystemTheme: boolean;
}
```

**Step 2: Load Settings on Startup**

```typescript
const loadSettings = async () => {
  // Try database first
  if (window.electronAPI?.getSettings) {
    const dbSettings = await window.electronAPI.getSettings();
    if (dbSettings && Object.keys(dbSettings).length > 0) {
      setSettings(dbSettings);
      // Sync to localStorage for performance
      localStorage.setItem('appSettings', JSON.stringify(dbSettings));
      return;
    }
  }
  
  // Fallback to localStorage
  const localSettings = localStorage.getItem('appSettings');
  if (localSettings) {
    setSettings(JSON.parse(localSettings));
  }
};
```

**Step 3: Theme Management**

```typescript
const applyTheme = () => {
  if (settings.useSystemTheme) {
    // Follow system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    // Use manual preference
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  }
};

// Listen for system theme changes
useEffect(() => {
  if (!settings.useSystemTheme) return;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    if (settings.useSystemTheme) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, [settings.useSystemTheme]);
```

**Step 4: Save Settings to Database**

```typescript
// Frontend
const handleSave = async () => {
  // Validate date format
  if (settings.timelineEndDate && !isValidNZDate(settings.timelineEndDate)) {
    setError('Invalid date format');
    return;
  }
  
  // Save to database
  const result = await window.electronAPI.saveSettings(settings);
  
  // Also save to localStorage
  localStorage.setItem('appSettings', JSON.stringify(settings));
  
  // Notify other components
  window.dispatchEvent(new Event('settingsUpdated'));
};

// Backend (Main Process)
// app/main/ipc/settingsHandlers.ts
ipcMain.handle('save-settings', async (event, settings: SettingsData) => {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Store each setting as key-value pair
    for (const [key, value] of Object.entries(settings)) {
      db.prepare(`
        INSERT OR REPLACE INTO app_settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run(key, JSON.stringify(value), now);
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
```

### Phase 3.5: Enhanced Audit Logging

**Goal**: Comprehensive activity tracking with rich metadata

**Location**: `app/main/services/AuditLogger.ts`

**Enhanced Audit Event Structure**:

```typescript
interface EnhancedAuditEvent {
  id: string;
  ts: string;              // ISO timestamp
  user: string;            // User identifier
  type: string;            // 'project.create', 'settings.update'
  payload: string;         // JSON payload
  module?: string;         // 'projects', 'settings', 'calendar'
  component?: string;      // 'ProjectForm', 'SettingsPanel'
  action?: string;         // 'create', 'update', 'delete', 'view'
  entity_type?: string;    // 'project', 'epic', 'holiday'
  entity_id?: string;      // ID of affected entity
  route?: string;          // '/projects', '/settings'
  source?: string;         // 'ui', 'api', 'webhook'
  session_id?: string;     // Session identifier
}
```

**Implementation**:

```typescript
export class AuditLogger {
  logEnhancedEvent(event: Partial<EnhancedAuditEvent>) {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ts = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO audit_events (
        id, ts, user, type, payload,
        module, component, action, entity_type, entity_id,
        route, source, session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, ts, event.user || 'system', event.type || 'unknown',
      JSON.stringify(event.payload || {}),
      event.module || null, event.component || null,
      event.action || null, event.entity_type || null,
      event.entity_id || null, event.route || null,
      event.source || 'ui', event.session_id || null
    );
  }
  
  // Query audit logs with filters
  queryLogs(filters: {
    module?: string;
    entity_type?: string;
    entity_id?: string;
    startDate?: string;
    endDate?: string;
  }): EnhancedAuditEvent[] {
    let query = 'SELECT * FROM audit_events WHERE 1=1';
    const params: any[] = [];
    
    if (filters.module) {
      query += ' AND module = ?';
      params.push(filters.module);
    }
    // ... more filters
    
    query += ' ORDER BY ts DESC LIMIT 1000';
    return this.db.prepare(query).all(...params) as EnhancedAuditEvent[];
  }
}
```

### Phase 3 Testing Checklist

**InfoPane Statistics**:
- [ ] Stats update when projects created/updated/deleted
- [ ] Overdue calculation works with past dates
- [ ] Budget formatting shows M/k suffixes correctly
- [ ] Completion rate handles zero projects
- [ ] Module-specific stats display correctly

**ADO Configuration**:
- [ ] PAT tokens stored encrypted in database
- [ ] Expiry warnings show 30 days before expiry
- [ ] Expired token shows red alert
- [ ] Token validation works
- [ ] InfoPane badge updates when token changes

**Calendar Management**:
- [ ] Working days calculation excludes weekends
- [ ] Public holidays reduce working days
- [ ] iCal import parses holidays correctly
- [ ] Bulk entry accepts text format
- [ ] Work hours calculation is accurate

**Settings Management**:
- [ ] Settings persist across app restarts
- [ ] Theme changes apply immediately
- [ ] System theme preference works
- [ ] Timeline end date validation works
- [ ] localStorage and database stay in sync

**Audit Logging**:
- [ ] All CRUD operations logged
- [ ] Enhanced metadata captured
- [ ] Audit queries work with filters
- [ ] Performance impact is minimal

### Phase 3 Common Issues and Solutions

**Issue 1: Stats not updating in real-time**
```typescript
// Solution: Ensure useMemo dependencies are correct
const projectStats = useMemo(() => {
  // calculations
}, [projects, getProjectsAsArray]); // Must include both!
```

**Issue 2: Boolean storage in SQLite**
```typescript
// Problem: SQLite doesn't support booleans
// Solution: Always convert to 0/1
const sqlValue = jsBoolean ? 1 : 0;
const jsValue = Boolean(sqlValue);
```

**Issue 3: Theme not persisting**
```typescript
// Solution: Save to both localStorage AND database
localStorage.setItem('appSettings', JSON.stringify(settings));
await window.electronAPI.saveSettings(settings);
```

**Issue 4: Date parsing errors**
```typescript
// Solution: Always validate NZ date format before parsing
if (!isValidNZDate(dateStr)) {
  throw new Error('Invalid date format');
}
const [day, month, year] = dateStr.split('-').map(Number);
```

### Phase 3 Success Criteria

Phase 3 is complete when:
- ✅ InfoPane shows all 14+ statistics correctly
- ✅ ADO PAT tokens stored encrypted with expiry tracking
- ✅ Token expiry warnings appear 30 days before expiry
- ✅ Calendar system calculates working days accurately
- ✅ iCal import works for public holidays
- ✅ Settings persist across app restarts
- ✅ Theme switching works (light/dark/system)
- ✅ Audit logging captures all operations
- ✅ All features tested and verified

### Next Steps (Phase 4)
With Phase 3 complete, you can implement:
- Team collaboration (Express server + SSE)
- mDNS service discovery
- Fortnight view
- Advanced reporting and analytics

---

1) Executive Summary & Goals

Offline-first Electron desktop app.

Default Solo Mode (all local).

Team Mode: one user becomes host (local HTTP server on LAN); others connect from their app.

Store data in SQLite (WAL) + append-only events.ndjson.

CSV import/export.

Views:

Standard Multi-row Timeline (no overlap)

Dependency View (click + on bars to link FS/SS/FF/SF)

12-Month Fortnight FY View (Apr→Mar, F01–F26)

2) Architecture & Data Flow
Electron (Main)
  ├─ launches Renderer (React)
  └─ manages Team Mode server (Express + SSE) when host

Renderer (React)
  ├─ Timeline UI + Dependency Overlay + Fortnight View
  ├─ CSV Import/Export
  └─ Client for Team Mode (HTTP + SSE)

Team Mode Server (Host-only, inside Electron)
  ├─ REST: /state, /mutations, /export/csv, /import/csv, /audit (GET, POST)
  ├─ SSE: /stream (live updates)
  └─ DB: SQLite (better-sqlite3) + events.ndjson
  Defaults:
  - Bind address: detected private IPv4 on the host (e.g., 192.168.x.x); can be overridden in Settings.
  - Port: 8080 by default (configurable). If 8080 is unavailable, show an error with a prompt to choose another port.


Concurrency model: Single-writer (host). Clients send mutations; host serializes them (no conflicts).
Discovery: mDNS/bonjour (_roadmap._tcp) or manual “Join via IP”.

2.1) Electron Security & Bootstrap (Main + Preload)

Complete Main Process Implementation:
```ts path=null start=null
// app/main/main.ts (complete implementation)
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTeamServer } from './team-server';
import { openDB } from './db';

// Global references
let mainWindow: BrowserWindow | null = null;
let teamServer: any = null;
let database: any = null;

// Development detection
const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      sandbox: false, // Set to false for file system access
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Focus on Windows
    if (process.platform === 'win32') {
      mainWindow?.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(async () => {
  // Initialize database
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'roadmap.db');
  database = openDB(dbPath);
  
  // Create window
  createWindow();
  
  // macOS: Re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Stop team server if running
  if (teamServer) {
    teamServer.close();
  }
  
  // Close database
  if (database) {
    database.close();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== VITE_DEV_SERVER_URL && !navigationUrl.startsWith('file:')) {
      event.preventDefault();
    }
  });
});

// IPC Handlers
ipcMain.handle('ping', () => {
  return 'pong';
});

ipcMain.handle('get-app-path', (event, name: string) => {
  return app.getPath(name as any);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options);
  return result;
});

ipcMain.handle('start-team-server', async (event, config) => {
  try {
    if (teamServer) {
      throw new Error('Server already running');
    }
    
    teamServer = createTeamServer(database, config);
    const serverInfo = await teamServer.start();
    return { success: true, ...serverInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-team-server', async () => {
  try {
    if (teamServer) {
      await teamServer.stop();
      teamServer = null;
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-server-status', () => {
  return {
    running: !!teamServer,
    info: teamServer?.getInfo() || null
  };
});

// Handle app certificate errors (for development)
if (isDev) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('ignore-certificate-errors-spki-list');
  app.commandLine.appendSwitch('ignore-ssl-errors');
}
```

Complete Preload Implementation:
```ts path=null start=null
// app/main/preload.ts (complete implementation)
import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for type safety
export interface ElectronAPI {
  // Basic functionality
  ping: () => Promise<string>;
  getAppPath: (name: string) => Promise<string>;
  
  // File dialogs
  showSaveDialog: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  
  // Team server management
  startTeamServer: (config: any) => Promise<any>;
  stopTeamServer: () => Promise<any>;
  getServerStatus: () => Promise<any>;
  
  // Event listeners
  onServerEvent: (callback: (event: any) => void) => void;
  removeServerEventListener: (callback: (event: any) => void) => void;
}

// Expose the API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic functionality
  ping: () => ipcRenderer.invoke('ping'),
  getAppPath: (name: string) => ipcRenderer.invoke('get-app-path', name),
  
  // File dialogs
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Team server management
  startTeamServer: (config: any) => ipcRenderer.invoke('start-team-server', config),
  stopTeamServer: () => ipcRenderer.invoke('stop-team-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  
  // Event listeners for server events
  onServerEvent: (callback: (event: any) => void) => {
    ipcRenderer.on('server-event', (event, data) => callback(data));
  },
  removeServerEventListener: (callback: (event: any) => void) => {
    ipcRenderer.removeListener('server-event', callback);
  }
} satisfies ElectronAPI);

// Type declaration for renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

```ts path=null start=null
// app/renderer/types/electron.d.ts (type definitions for renderer)
import type { ElectronAPI } from '../main/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
```

Notes:
- Do not enable nodeIntegration in the renderer.
- Keep all Node/OS access behind preload IPC; validate inputs on the main side.

3) Folder Structure
roadmap-tool/
├─ package.json
├─ electron.vite.config.ts
├─ /app
│  ├─ /main                # Electron main process + Team server
│  │  ├─ main.ts
│  │  ├─ team-server.ts    # Express, SSE, routing
│  │  ├─ db.ts             # better-sqlite3 wrapper & schema init
│  │  ├─ mutations.ts      # validation + apply() txn
│  │  ├─ discovery.ts      # bonjour _roadmap._tcp announce
│  │  └─ security.ts       # LAN bind, session PIN, HMAC
│  ├─ /renderer            # React UI (Vite)
│  │  ├─ index.html
│  │  ├─ main.tsx
│  │  ├─ /components       # Timeline, Bars, DependencyLayer, FortnightView…
│  │  ├─ /state            # Zustand/Redux store
│  │  ├─ /views            # Roadmap, Details, Settings
│  │  ├─ /api              # client.ts (host/solo abstraction)
│  │  └─ /utils            # dates, nz-currency, csv
│  └─ /data                # roadmap.db, events.ndjson, exports/
└─ /tests
   ├─ unit/ (jest)
   └─ e2e/ (playwright)

4) Install, Build, Run
# Install
npm i -D electron vite @electron-toolkit/tsconfig typescript jest @types/jest ts-jest \
  @playwright/test better-sqlite3 express body-parser eventsource-parser bonjour \
  react react-dom zustand papaparse dayjs

# Dev
npm run dev   # electron-vite dev (renderer+main)

# Test
npm run test  # jest
npm run e2e   # playwright

# Package
npm run build


package.json scripts (example):

{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "test": "jest --passWithNoTests",
    "e2e": "playwright test"
  }
}

5) Database Schema (SQLite)

DDL (run once on startup):

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;  -- enforce FK constraints

-- Canonicalize dates to ISO for sorting/range queries; keep NZ display copies.
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  lane TEXT DEFAULT '',
  -- UI/display dates (NZ)
  start_date_nz TEXT NOT NULL,   -- DD-MM-YYYY
  end_date_nz   TEXT NOT NULL,   -- DD-MM-YYYY
  -- Canonical dates for indexing and comparisons
  start_date_iso TEXT NOT NULL,  -- YYYY-MM-DD
  end_date_iso   TEXT NOT NULL,  -- YYYY-MM-DD
  status TEXT NOT NULL,          -- planned|in-progress|blocked|done|archived
  pm_name TEXT DEFAULT '',
  budget_cents INTEGER DEFAULT 0, -- store money as integer cents
  financial_treatment TEXT DEFAULT 'CAPEX',
  row INTEGER,                   -- optional preferred row
  created_at TEXT NOT NULL,      -- ISO timestamp
  updated_at TEXT NOT NULL       -- ISO timestamp
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  -- UI/display dates (NZ)
  start_date_nz TEXT NOT NULL,
  end_date_nz   TEXT NOT NULL,
  -- Canonical dates
  start_date_iso TEXT NOT NULL,
  end_date_iso   TEXT NOT NULL,
  effort_hours INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  assigned_resources TEXT DEFAULT '[]', -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dependencies (
  id TEXT PRIMARY KEY,
  from_type TEXT NOT NULL,      -- 'project'|'task'
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL,
  to_id TEXT NOT NULL,
  kind TEXT NOT NULL,           -- FS|SS|FF|SF
  lag_days INTEGER DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS initiatives (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  ts TEXT NOT NULL,
  user TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL
);


Indexes:

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_dates_iso ON projects(start_date_iso, end_date_iso);
CREATE INDEX IF NOT EXISTS idx_tasks_dates_iso ON tasks(start_date_iso, end_date_iso);
CREATE INDEX IF NOT EXISTS idx_deps_from ON dependencies(from_id);
CREATE INDEX IF NOT EXISTS idx_deps_to ON dependencies(to_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_dep ON dependencies(from_type, from_id, to_type, to_id, kind);

5.1) Migration Plan (v1 → v2: NZ date TEXT + DECIMAL NZD → ISO dates + integer cents)

Goal: Preserve existing data while introducing canonical ISO date columns and integer cents, without breaking the UI.

Safe approach: add new columns, backfill, add indexes; keep legacy columns for now.

Steps:

1. Backup your database file (roadmap.db). On Windows, copy the file while the app is closed.

2. Open a SQL console (or write a one-off migration script) and run:

```sql
PRAGMA foreign_keys=ON;
BEGIN;
-- Projects: add new columns if they don't exist (run conditionally in code or check schema first)
ALTER TABLE projects ADD COLUMN start_date_nz TEXT;
ALTER TABLE projects ADD COLUMN end_date_nz TEXT;
ALTER TABLE projects ADD COLUMN start_date_iso TEXT;
ALTER TABLE projects ADD COLUMN end_date_iso TEXT;
ALTER TABLE projects ADD COLUMN budget_cents INTEGER;

-- Backfill NZ display copies from legacy columns
UPDATE projects SET 
  start_date_nz = COALESCE(start_date_nz, start_date),
  end_date_nz   = COALESCE(end_date_nz,   end_date);

-- Backfill ISO dates derived from NZ dates (DD-MM-YYYY -> YYYY-MM-DD)
UPDATE projects SET 
  start_date_iso = substr(start_date_nz,7,4) || '-' || substr(start_date_nz,4,2) || '-' || substr(start_date_nz,1,2),
  end_date_iso   = substr(end_date_nz,7,4)   || '-' || substr(end_date_nz,4,2)   || '-' || substr(end_date_nz,1,2)
WHERE start_date_nz IS NOT NULL AND end_date_nz IS NOT NULL;

-- Backfill cents from legacy decimal NZD
UPDATE projects SET budget_cents = CAST(ROUND(budget_nzd * 100.0, 0) AS INTEGER)
WHERE budget_cents IS NULL;

-- Tasks: add and backfill
ALTER TABLE tasks ADD COLUMN start_date_nz TEXT;
ALTER TABLE tasks ADD COLUMN end_date_nz TEXT;
ALTER TABLE tasks ADD COLUMN start_date_iso TEXT;
ALTER TABLE tasks ADD COLUMN end_date_iso TEXT;

UPDATE tasks SET 
  start_date_nz = COALESCE(start_date_nz, start_date),
  end_date_nz   = COALESCE(end_date_nz,   end_date);

UPDATE tasks SET 
  start_date_iso = substr(start_date_nz,7,4) || '-' || substr(start_date_nz,4,2) || '-' || substr(start_date_nz,1,2),
  end_date_iso   = substr(end_date_nz,7,4)   || '-' || substr(end_date_nz,4,2)   || '-' || substr(end_date_nz,1,2)
WHERE start_date_nz IS NOT NULL AND end_date_nz IS NOT NULL;

COMMIT;

-- Indexes (safe to run repeatedly)
CREATE INDEX IF NOT EXISTS idx_project_dates_iso ON projects(start_date_iso, end_date_iso);
CREATE INDEX IF NOT EXISTS idx_tasks_dates_iso ON tasks(start_date_iso, end_date_iso);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_dep ON dependencies(from_type, from_id, to_type, to_id, kind);
```

Notes:
- If you want to drop legacy columns (projects.start_date, projects.end_date, projects.budget_nzd, tasks.start_date, tasks.end_date), SQLite requires a table rebuild (CREATE TABLE new → INSERT SELECT → DROP old → RENAME). That can be done later once code is updated.
- New installs should create only the new schema as shown above.
- Always enable PRAGMA foreign_keys=ON on every DB connection in code.

5.2) Database Initialization (Node + better-sqlite3)

Purpose: Ensure PRAGMAs are set, schema exists, and indexes are created. Also set a user_version to coordinate future migrations.

Step-by-step:
1) Install dependency (already in stack): better-sqlite3.
2) Create a db module that opens the DB, applies PRAGMAs, and runs schema/init.

Example code you can adapt:
```ts path=null start=null
// app/main/db.ts (example)
import Database from 'better-sqlite3';

export type DB = Database.Database;

export function openDB(dbPath: string): DB {
  const db = new Database(dbPath, { fileMustExist: false, verbose: undefined });

  // Important PRAGMAs (set per connection)
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 3000');
  db.pragma('synchronous = NORMAL');

  ensureSchema(db);
  return db;
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

      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        ts TEXT NOT NULL,
        user TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_dates_iso ON projects(start_date_iso, end_date_iso);
      CREATE INDEX IF NOT EXISTS idx_tasks_dates_iso ON tasks(start_date_iso, end_date_iso);
      CREATE INDEX IF NOT EXISTS idx_deps_from ON dependencies(from_id);
      CREATE INDEX IF NOT EXISTS idx_deps_to ON dependencies(to_id);
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_dep ON dependencies(from_type, from_id, to_type, to_id, kind);
    `);

    // Bump user_version if needed. For example, set to 2 for ISO/cents schema.
    if (current < 2) {
      db.exec('PRAGMA user_version = 2');
    }
  })();
}
```

Notes:
- Always open the DB from Electron's app.getPath('userData').
- PRAGMAs must be applied on the same connection used for queries.
- If you need to run the migration in code, check user_version and call a migrateToV2(db) function before ensureSchema or as part of it.

5.3) One-off Migration Script (v1 → v2)

Purpose: Upgrade an existing DB that used DD-MM-YYYY in start_date/end_date and DECIMAL budget_nzd to the new ISO + cents schema.

Usage pattern:
- Add an npm script: "migrate:v2": "ts-node scripts/migrate_v2.ts" (or compile and run with node).
- Ensure the app is closed when running this script.

Script outline (copy and adapt):
```ts path=null start=null
// scripts/migrate_v2.ts (example)
import Database from 'better-sqlite3';

function columnExists(db: Database.Database, table: string, col: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  return rows.some(r => r.name === col);
}

function addColumnIfMissing(db: Database.Database, table: string, colDef: string) {
  const [colName] = colDef.trim().split(/\s+/);
  if (!columnExists(db, table, colName)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
  }
}

function main(dbPath: string) {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 3000');

  const tx = db.transaction(() => {
    // Add new columns (no IF NOT EXISTS in SQLite, so check first)
    addColumnIfMissing(db, 'projects', 'start_date_nz TEXT');
    addColumnIfMissing(db, 'projects', 'end_date_nz TEXT');
    addColumnIfMissing(db, 'projects', 'start_date_iso TEXT');
    addColumnIfMissing(db, 'projects', 'end_date_iso TEXT');
    addColumnIfMissing(db, 'projects', 'budget_cents INTEGER');

    db.exec(`UPDATE projects SET 
      start_date_nz = COALESCE(start_date_nz, start_date),
      end_date_nz   = COALESCE(end_date_nz,   end_date)`);

    db.exec(`UPDATE projects SET 
      start_date_iso = substr(start_date_nz,7,4) || '-' || substr(start_date_nz,4,2) || '-' || substr(start_date_nz,1,2),
      end_date_iso   = substr(end_date_nz,7,4)   || '-' || substr(end_date_nz,4,2)   || '-' || substr(end_date_nz,1,2)
      WHERE start_date_nz IS NOT NULL AND end_date_nz IS NOT NULL`);

    db.exec(`UPDATE projects SET budget_cents = CAST(ROUND(budget_nzd * 100.0, 0) AS INTEGER)
      WHERE budget_cents IS NULL`);

    addColumnIfMissing(db, 'tasks', 'start_date_nz TEXT');
    addColumnIfMissing(db, 'tasks', 'end_date_nz TEXT');
    addColumnIfMissing(db, 'tasks', 'start_date_iso TEXT');
    addColumnIfMissing(db, 'tasks', 'end_date_iso TEXT');

    db.exec(`UPDATE tasks SET 
      start_date_nz = COALESCE(start_date_nz, start_date),
      end_date_nz   = COALESCE(end_date_nz,   end_date)`);

    db.exec(`UPDATE tasks SET 
      start_date_iso = substr(start_date_nz,7,4) || '-' || substr(start_date_nz,4,2) || '-' || substr(start_date_nz,1,2),
      end_date_iso   = substr(end_date_nz,7,4)   || '-' || substr(end_date_nz,4,2)   || '-' || substr(end_date_nz,1,2)
      WHERE start_date_nz IS NOT NULL AND end_date_nz IS NOT NULL`);

    // Indexes/uniques
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_project_dates_iso ON projects(start_date_iso, end_date_iso);
      CREATE INDEX IF NOT EXISTS idx_tasks_dates_iso ON tasks(start_date_iso, end_date_iso);
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_dep ON dependencies(from_type, from_id, to_type, to_id, kind);
    `);

    // Bump schema version
    db.exec('PRAGMA user_version = 2');
  });

  tx();
  db.close();
  console.log('Migration to v2 complete.');
}

// Example path: pass via CLI, e.g. node migrate_v2.js "C:/Users/<you>/AppData/Roaming/RoadmapTool/roadmap.db"
const dbPath = process.argv[2];
if (!dbPath) {
  console.error('Usage: node migrate_v2.js <dbPath>');
  process.exit(1);
}
main(dbPath);
```

5.4) Mutation Handling (server): compute ISO dates and cents

When receiving mutations like project.create/update or task.create/update, compute and persist both NZ and ISO dates, and convert NZD to integer cents before INSERT/UPDATE.

Helper utilities:
```ts path=null start=null
// app/main/validation.ts (example)
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export function parseNZDateToISO(nz: string): string {
  // Strict DD-MM-YYYY parsing
  const d = dayjs(nz, 'DD-MM-YYYY', true);
  if (!d.isValid()) throw new Error(`Invalid NZ date: ${nz}`);
  return d.format('YYYY-MM-DD');
}

export function parseNZDToCents(input: string | number): number {
  const s = String(input).trim().replace(/,/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(s)) {
    throw new Error(`Invalid NZD (max 2dp): ${input}`);
  }
  const parts = s.split('.');
  const dollars = parseInt(parts[0] || '0', 10);
  const cents = parseInt((parts[1] || '').padEnd(2, '0').slice(0, 2) || '0', 10);
  return dollars * 100 + cents;
}
```

Applying a mutation (example patterns):
```ts path=null start=null
// app/main/mutations.ts (example)
import type { DB } from './db';
import { parseNZDateToISO, parseNZDToCents } from './validation';

type ProjectUpdateDates = { id: string; start_date: string; end_date: string };
type ProjectUpdateBudget = { id: string; budget_nzd: string | number };

export function updateProjectDates(db: DB, payload: ProjectUpdateDates) {
  const start_iso = parseNZDateToISO(payload.start_date);
  const end_iso = parseNZDateToISO(payload.end_date);

  const stmt = db.prepare(`UPDATE projects
    SET start_date_nz = @start_nz,
        end_date_nz   = @end_nz,
        start_date_iso = @start_iso,
        end_date_iso   = @end_iso,
        updated_at = @now
    WHERE id = @id`);

  const now = new Date().toISOString();
  const info = stmt.run({
    id: payload.id,
    start_nz: payload.start_date,
    end_nz: payload.end_date,
    start_iso,
    end_iso,
    now,
  });
  if (info.changes === 0) throw new Error('Project not found');
}

export function updateProjectBudget(db: DB, payload: ProjectUpdateBudget) {
  const cents = parseNZDToCents(payload.budget_nzd);
  const stmt = db.prepare(`UPDATE projects SET budget_cents = @cents, updated_at = @now WHERE id = @id`);
  const info = stmt.run({ id: payload.id, cents, now: new Date().toISOString() });
  if (info.changes === 0) throw new Error('Project not found');
}

export function createDependency(db: DB, dep: { id: string; from_type: string; from_id: string; to_type: string; to_id: string; kind: string; lag_days?: number; note?: string; }) {
  try {
    db.prepare(`INSERT INTO dependencies (id, from_type, from_id, to_type, to_id, kind, lag_days, note, created_at)
                VALUES (@id, @from_type, @from_id, @to_type, @to_id, @kind, COALESCE(@lag_days,0), COALESCE(@note,''), @now)`) 
      .run({ ...dep, now: new Date().toISOString() });
  } catch (e: any) {
    if (String(e.code) === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      throw new Error('Related item not found (FK failed)');
    }
    if (String(e.code)?.startsWith('SQLITE_CONSTRAINT')) {
      // Covers UNIQUE index on (from_type, from_id, to_type, to_id, kind)
      throw new Error('Duplicate dependency');
    }
    throw e;
  }
}

export function withTransaction<T>(db: DB, fn: () => T): T {
  return db.transaction(fn)();
}
```

5.5) Querying with ISO date indexes (examples)

- Find projects overlapping a date range (inclusive):
```sql path=null start=null
-- Given a range [@start_iso, @end_iso], overlap exists when start <= end_iso AND end >= start_iso
SELECT *
FROM projects
WHERE start_date_iso <= @end_iso AND end_date_iso >= @start_iso
ORDER BY start_date_iso ASC;
```

- Order tasks by start date for a project:
```sql path=null start=null
SELECT * FROM tasks
WHERE project_id = @project_id
ORDER BY start_date_iso ASC;
```

6) JSON Data Models (Renderer/Client)
type NZDate = string; // 'DD-MM-YYYY'

type Project = {
  id: string;
  title: string;
  description?: string;
  lane?: string;
  start_date: NZDate;
  end_date: NZDate;
  status: 'planned'|'in-progress'|'blocked'|'done'|'archived';
  pm_name?: string;
  budget_nzd: number; // UI input/display in NZD; persisted as integer cents in DB
  financial_treatment: 'CAPEX'|'OPEX';
  row?: number|null;
};

type Task = {
  id: string;
  project_id: string;
  title: string;
  start_date: NZDate;
  end_date: NZDate;
  effort_hours?: number;
  status: Project['status'];
  assigned_resources?: string[];
};

type Dependency = {
  id: string;
  from: { type:'project'|'task'; id:string };
  to:   { type:'project'|'task'; id:string };
  kind: 'FS'|'SS'|'FF'|'SF';
  lag_days?: number;
  note?: string;
};

7) Core Modules (Renderer)
7.1 Timeline & Row Allocation (multi-row)

Sort projects by start_date.

If row set → respect it; else allocate the first non-conflicting row.

No overlaps within the same row; use day-width scaling by zoom.

7.2 Dependency View (+ button)

Each bar displays a “+” tag top-right on hover/focus.

Click “+” → Link Mode (rubber-band curve follows cursor).

Click target → save dependency (FS default).

Prevent self-link, duplicate pair for the same kind, and cycles (DFS check).

Select line → Delete / Type / Lag.

7.3 12-Month Fortnight View

Build 26 fortnights from FY start (01-04-YYYY).

Render months (Apr→Mar) with thick dividers; optional quarter tint.

Bars snap to fortnight indices.

7.4) Complete React Component Implementations

7.4.1) Enhanced Zustand Store with Complete State Management

```tsx path=null start=null
// app/renderer/state/store.ts (complete implementation)
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types
type NZDate = string; // DD-MM-YYYY

export interface Project {
  id: string;
  title: string;
  description?: string;
  lane?: string;
  start_date: NZDate;
  end_date: NZDate;
  status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
  pm_name?: string;
  budget_nzd: number;
  financial_treatment: 'CAPEX' | 'OPEX';
  row?: number | null;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  start_date: NZDate;
  end_date: NZDate;
  effort_hours?: number;
  status: Project['status'];
  assigned_resources?: string[];
}

export interface Dependency {
  id: string;
  from: { type: 'project' | 'task'; id: string };
  to: { type: 'project' | 'task'; id: string };
  kind: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days?: number;
  note?: string;
}

type Connection = 'connected' | 'reconnecting' | 'disconnected';
type Mode = 'solo' | 'host' | 'client';

interface UIState {
  selectedProject: string | null;
  selectedTask: string | null;
  timelineZoom: number; // days per pixel
  showDependencies: boolean;
  currentView: 'timeline' | 'fortnight' | 'details';
  sidebarOpen: boolean;
  linkingMode: { active: boolean; from?: { type: 'project' | 'task'; id: string } };
}

interface AppState {
  // Data
  projects: Record<string, Project>;
  tasks: Record<string, Task>;
  dependencies: Record<string, Dependency>;
  
  // Connection
  mode: Mode;
  connection: Connection;
  hostBaseUrl?: string;
  lastEventId?: string;
  
  // UI State
  ui: UIState;
  
  // User
  user: string;
  
  // Loading states
  loading: {
    projects: boolean;
    mutations: boolean;
    import: boolean;
    export: boolean;
  };
  
  // Errors
  errors: string[];
}

interface AppActions {
  // Connection
  setMode: (mode: Mode, baseUrl?: string) => void;
  setConnection: (connection: Connection) => void;
  setLastEventId: (id: string) => void;
  
  // Data mutations
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  setDependencies: (deps: Dependency[]) => void;
  upsertProject: (project: Project) => void;
  upsertTask: (task: Task) => void;
  upsertDependency: (dep: Dependency) => void;
  removeProject: (id: string) => void;
  removeTask: (id: string) => void;
  removeDependency: (id: string) => void;
  
  // UI actions
  setSelectedProject: (id: string | null) => void;
  setSelectedTask: (id: string | null) => void;
  setTimelineZoom: (zoom: number) => void;
  setShowDependencies: (show: boolean) => void;
  setCurrentView: (view: 'timeline' | 'fortnight' | 'details') => void;
  setSidebarOpen: (open: boolean) => void;
  setLinkingMode: (mode: { active: boolean; from?: { type: 'project' | 'task'; id: string } }) => void;
  
  // User
  setUser: (user: string) => void;
  
  // Loading
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
  
  // Errors
  addError: (error: string) => void;
  clearErrors: () => void;
  removeError: (index: number) => void;
  
  // Computed getters
  getProjectsAsArray: () => Project[];
  getTasksForProject: (projectId: string) => Task[];
  getDependenciesForProject: (projectId: string) => Dependency[];
  getProjectById: (id: string) => Project | undefined;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  projects: {},
  tasks: {},
  dependencies: {},
  
  mode: 'solo',
  connection: 'connected',
  hostBaseUrl: undefined,
  lastEventId: undefined,
  
  ui: {
    selectedProject: null,
    selectedTask: null,
    timelineZoom: 2, // 2 days per pixel
    showDependencies: true,
    currentView: 'timeline',
    sidebarOpen: true,
    linkingMode: { active: false }
  },
  
  user: 'Anonymous',
  
  loading: {
    projects: false,
    mutations: false,
    import: false,
    export: false
  },
  
  errors: [],
  
  // Actions
  setMode: (mode, hostBaseUrl) => set({ mode, hostBaseUrl }),
  setConnection: (connection) => set({ connection }),
  setLastEventId: (lastEventId) => set({ lastEventId }),
  
  setProjects: (projectsArray) => {
    const projects = projectsArray.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    set({ projects });
  },
  
  setTasks: (tasksArray) => {
    const tasks = tasksArray.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
    set({ tasks });
  },
  
  setDependencies: (depsArray) => {
    const dependencies = depsArray.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});
    set({ dependencies });
  },
  
  upsertProject: (project) => set((state) => ({
    projects: { ...state.projects, [project.id]: project }
  })),
  
  upsertTask: (task) => set((state) => ({
    tasks: { ...state.tasks, [task.id]: task }
  })),
  
  upsertDependency: (dep) => set((state) => ({
    dependencies: { ...state.dependencies, [dep.id]: dep }
  })),
  
  removeProject: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.projects;
    return { projects: rest };
  }),
  
  removeTask: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.tasks;
    return { tasks: rest };
  }),
  
  removeDependency: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.dependencies;
    return { dependencies: rest };
  }),
  
  setSelectedProject: (selectedProject) => set((state) => ({
    ui: { ...state.ui, selectedProject }
  })),
  
  setSelectedTask: (selectedTask) => set((state) => ({
    ui: { ...state.ui, selectedTask }
  })),
  
  setTimelineZoom: (timelineZoom) => set((state) => ({
    ui: { ...state.ui, timelineZoom }
  })),
  
  setShowDependencies: (showDependencies) => set((state) => ({
    ui: { ...state.ui, showDependencies }
  })),
  
  setCurrentView: (currentView) => set((state) => ({
    ui: { ...state.ui, currentView }
  })),
  
  setSidebarOpen: (sidebarOpen) => set((state) => ({
    ui: { ...state.ui, sidebarOpen }
  })),
  
  setLinkingMode: (linkingMode) => set((state) => ({
    ui: { ...state.ui, linkingMode }
  })),
  
  setUser: (user) => set({ user }),
  
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),
  
  addError: (error) => set((state) => ({
    errors: [...state.errors, error]
  })),
  
  clearErrors: () => set({ errors: [] }),
  
  removeError: (index) => set((state) => ({
    errors: state.errors.filter((_, i) => i !== index)
  })),
  
  // Computed getters
  getProjectsAsArray: () => Object.values(get().projects),
  
  getTasksForProject: (projectId) => 
    Object.values(get().tasks).filter(t => t.project_id === projectId),
  
  getDependenciesForProject: (projectId) => 
    Object.values(get().dependencies).filter(d => 
      (d.from.type === 'project' && d.from.id === projectId) ||
      (d.to.type === 'project' && d.to.id === projectId)
    ),
  
  getProjectById: (id) => get().projects[id]
})));
```

7.4.2) Complete API Client with SSE Support

```tsx path=null start=null
// app/renderer/api/client.ts (complete implementation)
import { useAppStore } from '../state/store';
import type { Project, Task, Dependency } from '../state/store';

class APIClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor() {
    this.setupStoreSubscriptions();
  }
  
  private setupStoreSubscriptions() {
    // Listen for mode changes to handle SSE connections
    useAppStore.subscribe(
      (state) => state.mode,
      (mode) => {
        if (mode === 'solo') {
          this.disconnectSSE();
        } else {
          this.connectSSE();
        }
      }
    );
  }
  
  private getBaseUrl(): string {
    const { mode, hostBaseUrl } = useAppStore.getState();
    if (mode === 'solo' || mode === 'host') {
      return 'http://127.0.0.1:8080';
    }
    return hostBaseUrl || 'http://127.0.0.1:8080';
  }
  
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`API request failed: ${endpoint}`, error);
      useAppStore.getState().addError(`API Error: ${error.message}`);
      throw error;
    }
  }
  
  // State management
  async fetchState(): Promise<void> {
    useAppStore.getState().setLoading('projects', true);
    
    try {
      const state = await this.request('/state');
      
      useAppStore.getState().setProjects(state.projects || []);
      useAppStore.getState().setTasks(state.tasks || []);
      useAppStore.getState().setDependencies(state.dependencies || []);
      
      console.log('State loaded successfully');
    } catch (error) {
      console.error('Failed to fetch state:', error);
    } finally {
      useAppStore.getState().setLoading('projects', false);
    }
  }
  
  // Mutations
  async sendMutation(type: string, payload: any): Promise<any> {
    const { user } = useAppStore.getState();
    
    const mutation = {
      opId: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user,
      ts: new Date().toISOString(),
      type,
      payload
    };
    
    useAppStore.getState().setLoading('mutations', true);
    
    try {
      const result = await this.request('/mutations', {
        method: 'POST',
        body: JSON.stringify(mutation)
      });
      
      console.log('Mutation applied:', mutation.type, mutation.opId);
      return result;
    } catch (error) {
      console.error('Mutation failed:', error);
      throw error;
    } finally {
      useAppStore.getState().setLoading('mutations', false);
    }
  }
  
  // Project operations
  async createProject(project: Omit<Project, 'id'>): Promise<void> {
    const id = `PRJ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await this.sendMutation('project.create', { ...project, id });
  }
  
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    await this.sendMutation('project.update', { id, ...updates });
  }
  
  async deleteProject(id: string): Promise<void> {
    await this.sendMutation('project.delete', { id });
  }
  
  // Task operations
  async createTask(task: Omit<Task, 'id'>): Promise<void> {
    const id = `TSK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await this.sendMutation('task.create', { ...task, id });
  }
  
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await this.sendMutation('task.update', { id, ...updates });
  }
  
  async deleteTask(id: string): Promise<void> {
    await this.sendMutation('task.delete', { id });
  }
  
  // Dependency operations
  async createDependency(dep: Omit<Dependency, 'id'>): Promise<void> {
    const id = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await this.sendMutation('dependency.create', { ...dep, id });
  }
  
  async deleteDependency(id: string): Promise<void> {
    await this.sendMutation('dependency.delete', { id });
  }
  
  // CSV operations
  async importCSV(data: any[]): Promise<void> {
    const { user } = useAppStore.getState();
    
    useAppStore.getState().setLoading('import', true);
    
    try {
      await this.request('/import/csv', {
        method: 'POST',
        body: JSON.stringify({ data, user })
      });
      
      // Refresh state after import
      await this.fetchState();
    } finally {
      useAppStore.getState().setLoading('import', false);
    }
  }
  
  async exportCSV(): Promise<string> {
    useAppStore.getState().setLoading('export', true);
    
    try {
      const response = await fetch(`${this.getBaseUrl()}/export/csv`);
      if (!response.ok) throw new Error('Export failed');
      
      return await response.text();
    } finally {
      useAppStore.getState().setLoading('export', false);
    }
  }
  
  // SSE connection
  connectSSE(): void {
    const { lastEventId } = useAppStore.getState();
    
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    const url = `${this.getBaseUrl()}/stream`;
    const eventSourceInitDict: EventSourceInit = {};
    
    if (lastEventId) {
      eventSourceInitDict.headers = { 'Last-Event-ID': lastEventId };
    }
    
    this.eventSource = new EventSource(url, eventSourceInitDict);
    
    this.eventSource.onopen = () => {
      console.log('SSE connected');
      useAppStore.getState().setConnection('connected');
      this.reconnectAttempts = 0;
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleSSEMessage(data);
        
        if (event.lastEventId) {
          useAppStore.getState().setLastEventId(event.lastEventId);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      useAppStore.getState().setConnection('reconnecting');
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Reconnecting SSE (attempt ${this.reconnectAttempts})`);
          this.connectSSE();
        }, 1000 * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
      } else {
        useAppStore.getState().setConnection('disconnected');
        useAppStore.getState().addError('Lost connection to server');
      }
    };
  }
  
  private handleSSEMessage(data: any): void {
    console.log('SSE message received:', data.type, data);
    
    switch (data.type) {
      case 'connected':
        console.log('Connected to server session:', data.sessionId);
        break;
        
      case 'mutation-applied':
        // Refresh state when mutations are applied by other clients
        console.log('Remote mutation applied:', data.mutationType, data.opId);
        this.fetchState();
        break;
        
      default:
        console.log('Unknown SSE message type:', data.type);
    }
  }
  
  disconnectSSE(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE disconnected');
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Hook for components
export function useAPI() {
  return apiClient;
}
```

7.4.3) Core Timeline Component Implementation

```tsx path=null start=null
// app/renderer/components/Timeline/Timeline.tsx (complete implementation)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../../state/store';
import { useAPI } from '../../api/client';
import { TimelineBar } from './TimelineBar';
import { DependencyOverlay } from './DependencyOverlay';
import { TimelineGrid } from './TimelineGrid';
import dayjs from 'dayjs';
import './Timeline.css';

export interface TimelineProps {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export const Timeline: React.FC<TimelineProps> = ({ 
  startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
  endDate = dayjs().add(6, 'months').format('YYYY-MM-DD')
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    projectId: string | null;
    startX: number;
    originalDates: { start: string; end: string } | null;
  }>({ isDragging: false, projectId: null, startX: 0, originalDates: null });

  const {
    getProjectsAsArray,
    ui: { timelineZoom, showDependencies, selectedProject, linkingMode },
    setSelectedProject,
    setLinkingMode
  } = useAppStore();
  
  const api = useAPI();
  const projects = getProjectsAsArray();
  
  // Calculate timeline dimensions
  const timelineStart = dayjs(startDate);
  const timelineEnd = dayjs(endDate);
  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const pixelsPerDay = 1 / timelineZoom; // zoom is days per pixel
  const timelineWidth = totalDays * pixelsPerDay;
  
  // Allocate projects to rows to prevent overlaps
  const allocatedProjects = useAllocateRows(projects);
  const maxRow = Math.max(0, ...allocatedProjects.map(p => p.row || 0));
  const timelineHeight = (maxRow + 1) * 60 + 40; // 60px per row + padding
  
  // Convert NZ date (DD-MM-YYYY) to position
  const dateToX = useCallback((nzDate: string): number => {
    const [day, month, year] = nzDate.split('-').map(Number);
    const date = dayjs(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
    const daysFromStart = date.diff(timelineStart, 'day');
    return Math.max(0, daysFromStart * pixelsPerDay);
  }, [timelineStart, pixelsPerDay]);
  
  // Convert position to NZ date
  const xToDate = useCallback((x: number): string => {
    const daysFromStart = Math.round(x / pixelsPerDay);
    const date = timelineStart.add(daysFromStart, 'day');
    return date.format('DD-MM-YYYY');
  }, [timelineStart, pixelsPerDay]);
  
  // Handle project bar drag
  const handleBarMouseDown = useCallback((e: React.MouseEvent, projectId: string) => {
    if (linkingMode.active) return; // Don't drag in linking mode
    
    const project = allocatedProjects.find(p => p.id === projectId);
    if (!project) return;
    
    setDragState({
      isDragging: true,
      projectId,
      startX: e.clientX,
      originalDates: { start: project.start_date, end: project.end_date }
    });
    
    e.preventDefault();
  }, [allocatedProjects, linkingMode.active]);
  
  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.projectId || !dragState.originalDates) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaDays = Math.round(deltaX / pixelsPerDay);
    
    const originalStart = dayjs(dragState.originalDates.start, 'DD-MM-YYYY');
    const originalEnd = dayjs(dragState.originalDates.end, 'DD-MM-YYYY');
    
    const newStart = originalStart.add(deltaDays, 'day');
    const newEnd = originalEnd.add(deltaDays, 'day');
    
    // Update project dates optimistically (will be confirmed by server)
    const startNZ = newStart.format('DD-MM-YYYY');
    const endNZ = newEnd.format('DD-MM-YYYY');
    
    // Show preview by updating the bar position
    const bar = document.querySelector(`[data-project-id="${dragState.projectId}"]`) as HTMLElement;
    if (bar) {
      bar.style.transform = `translateX(${deltaX}px)`;
    }
  }, [dragState, pixelsPerDay]);
  
  // Handle mouse up (end drag)
  const handleMouseUp = useCallback(async () => {
    if (!dragState.isDragging || !dragState.projectId || !dragState.originalDates) return;
    
    const bar = document.querySelector(`[data-project-id="${dragState.projectId}"]`) as HTMLElement;
    if (bar) {
      bar.style.transform = ''; // Clear preview transform
    }
    
    // Calculate final dates
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const finalX = dragState.startX - rect.left;
    const newStartDate = xToDate(finalX);
    
    const originalDuration = dayjs(dragState.originalDates.end, 'DD-MM-YYYY')
      .diff(dayjs(dragState.originalDates.start, 'DD-MM-YYYY'), 'day');
    
    const newEndDate = dayjs(newStartDate, 'DD-MM-YYYY')
      .add(originalDuration, 'day')
      .format('DD-MM-YYYY');
    
    // Send update to server
    try {
      await api.updateProject(dragState.projectId, {
        start_date: newStartDate,
        end_date: newEndDate
      });
      
      console.log('Project dates updated:', dragState.projectId, newStartDate, newEndDate);
    } catch (error) {
      console.error('Failed to update project dates:', error);
    }
    
    setDragState({ isDragging: false, projectId: null, startX: 0, originalDates: null });
  }, [dragState, api, xToDate]);
  
  // Set up drag event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);
  
  // Handle timeline click (for linking mode)
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (linkingMode.active) {
      // Cancel linking mode on background click
      setLinkingMode({ active: false });
    } else {
      // Clear selection on background click
      setSelectedProject(null);
    }
  }, [linkingMode.active, setLinkingMode, setSelectedProject]);
  
  return (
    <div className="timeline-container" ref={containerRef}>
      <div 
        className="timeline-content"
        style={{ width: timelineWidth, height: timelineHeight }}
        onClick={handleTimelineClick}
      >
        {/* Grid background */}
        <TimelineGrid
          startDate={startDate}
          endDate={endDate}
          pixelsPerDay={pixelsPerDay}
          width={timelineWidth}
          height={timelineHeight}
        />
        
        {/* Project bars */}
        {allocatedProjects.map(project => {
          const x = dateToX(project.start_date);
          const width = dateToX(project.end_date) - x;
          const y = (project.row || 0) * 60 + 20;
          
          return (
            <TimelineBar
              key={project.id}
              project={project}
              x={x}
              y={y}
              width={Math.max(20, width)} // Minimum width for visibility
              height={40}
              selected={selectedProject === project.id}
              onMouseDown={(e) => handleBarMouseDown(e, project.id)}
              onSelect={() => setSelectedProject(project.id)}
              linkingMode={linkingMode}
            />
          );
        })}
        
        {/* Dependency lines overlay */}
        {showDependencies && (
          <DependencyOverlay
            projects={allocatedProjects}
            dateToX={dateToX}
            rowHeight={60}
          />
        )}
        
        {/* Linking cursor line */}
        {linkingMode.active && (
          <div className="linking-cursor-line" />
        )}
      </div>
    </div>
  );
};

// Hook to allocate projects to rows without overlaps
function useAllocateRows(projects: any[]) {
  return React.useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      const aStart = dayjs(a.start_date, 'DD-MM-YYYY');
      const bStart = dayjs(b.start_date, 'DD-MM-YYYY');
      return aStart.isBefore(bStart) ? -1 : 1;
    });
    
    const allocated: Array<any> = [];
    const rowEndDates: Array<dayjs.Dayjs> = [];
    
    for (const project of sorted) {
      const startDate = dayjs(project.start_date, 'DD-MM-YYYY');
      const endDate = dayjs(project.end_date, 'DD-MM-YYYY');
      
      let assignedRow = project.row;
      
      // If no row assigned, find first available row
      if (assignedRow == null) {
        assignedRow = 0;
        
        // Find first row where project doesn't overlap
        while (assignedRow < rowEndDates.length && rowEndDates[assignedRow] && 
               !startDate.isAfter(rowEndDates[assignedRow])) {
          assignedRow++;
        }
      }
      
      // Ensure rowEndDates array is large enough
      while (rowEndDates.length <= assignedRow) {
        rowEndDates.push(dayjs(0)); // Far in the past
      }
      
      // Update row end date
      rowEndDates[assignedRow] = endDate;
      
      allocated.push({ ...project, row: assignedRow });
    }
    
    return allocated;
  }, [projects]);
}
```

7.4.4) Timeline Bar Component

```tsx path=null start=null
// app/renderer/components/Timeline/TimelineBar.tsx
import React, { useState } from 'react';
import { useAppStore } from '../../state/store';
import { useAPI } from '../../api/client';
import type { Project } from '../../state/store';

export interface TimelineBarProps {
  project: Project;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelect: () => void;
  linkingMode: { active: boolean; from?: { type: 'project' | 'task'; id: string } };
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  project,
  x,
  y,
  width,
  height,
  selected,
  onMouseDown,
  onSelect,
  linkingMode
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { setLinkingMode } = useAppStore();
  const api = useAPI();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (linkingMode.active) {
      // Complete dependency creation
      if (linkingMode.from && linkingMode.from.id !== project.id) {
        handleCreateDependency(linkingMode.from, { type: 'project', id: project.id });
      }
      setLinkingMode({ active: false });
    } else {
      onSelect();
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLinkingMode({ active: true, from: { type: 'project', id: project.id } });
  };

  const handleCreateDependency = async (
    from: { type: 'project' | 'task'; id: string },
    to: { type: 'project' | 'task'; id: string }
  ) => {
    try {
      await api.createDependency({
        from,
        to,
        kind: 'FS', // Default to Finish-to-Start
        lag_days: 0
      });
      console.log('Dependency created:', from, '->', to);
    } catch (error) {
      console.error('Failed to create dependency:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'planned': return '#e3f2fd';
      case 'in-progress': return '#fff3e0';
      case 'blocked': return '#ffebee';
      case 'done': return '#e8f5e8';
      case 'archived': return '#f5f5f5';
      default: return '#e3f2fd';
    }
  };

  const getStatusBorder = (status: string): string => {
    switch (status) {
      case 'planned': return '#2196f3';
      case 'in-progress': return '#ff9800';
      case 'blocked': return '#f44336';
      case 'done': return '#4caf50';
      case 'archived': return '#9e9e9e';
      default: return '#2196f3';
    }
  };

  return (
    <div
      className={`timeline-bar ${
        selected ? 'selected' : ''
      } ${
        linkingMode.active ? 'linking-mode' : ''
      }`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        backgroundColor: getStatusColor(project.status),
        border: `2px solid ${getStatusBorder(project.status)}`,
        borderRadius: '4px',
        cursor: linkingMode.active ? 'crosshair' : 'grab',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
      data-testid={`timeline-bar-${project.id}`}
      data-project-id={project.id}
      onMouseDown={onMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bar-content" style={{ flex: 1, minWidth: 0 }}>
        <div 
          className="bar-title" 
          style={{ 
            fontWeight: 'bold', 
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={project.title}
        >
          {project.title}
        </div>
        {width > 100 && (
          <div 
            className="bar-dates"
            style={{ fontSize: '10px', opacity: 0.7 }}
          >
            {project.start_date} - {project.end_date}
          </div>
        )}
      </div>
      
      {/* Plus button for creating dependencies */}
      {(isHovered || linkingMode.from?.id === project.id) && !linkingMode.active && (
        <button
          className="dependency-plus"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '1px solid #666',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          data-testid={`dep-plus-${project.id}`}
          onClick={handlePlusClick}
          title="Create dependency"
        >
          +
        </button>
      )}
    </div>
  );
};
```

7.4.5) Timeline Grid Component

```tsx path=null start=null
// app/renderer/components/Timeline/TimelineGrid.tsx
import React from 'react';
import dayjs from 'dayjs';

export interface TimelineGridProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  pixelsPerDay: number;
  width: number;
  height: number;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  startDate,
  endDate,
  pixelsPerDay,
  width,
  height
}) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  // Generate month boundaries
  const monthLines = [];
  const monthLabels = [];
  
  let current = start.startOf('month');
  while (current.isBefore(end)) {
    const daysFromStart = current.diff(start, 'day');
    const x = daysFromStart * pixelsPerDay;
    
    if (x >= 0 && x <= width) {
      monthLines.push(
        <line
          key={current.format('YYYY-MM')}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#e0e0e0"
          strokeWidth={2}
        />
      );
      
      monthLabels.push(
        <text
          key={`label-${current.format('YYYY-MM')}`}
          x={x + 5}
          y={15}
          fontSize={12}
          fill="#666"
        >
          {current.format('MMM YYYY')}
        </text>
      );
    }
    
    current = current.add(1, 'month');
  }
  
  // Generate week boundaries (lighter lines)
  const weekLines = [];
  current = start.startOf('week');
  while (current.isBefore(end)) {
    const daysFromStart = current.diff(start, 'day');
    const x = daysFromStart * pixelsPerDay;
    
    if (x >= 0 && x <= width) {
      weekLines.push(
        <line
          key={current.format('YYYY-WW')}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#f0f0f0"
          strokeWidth={1}
        />
      );
    }
    
    current = current.add(1, 'week');
  }
  
  return (
    <svg 
      className="timeline-grid"
      width={width} 
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* Week lines (background) */}
      {weekLines}
      
      {/* Month lines (foreground) */}
      {monthLines}
      
      {/* Month labels */}
      {monthLabels}
      
      {/* Today line */}
      {(() => {
        const today = dayjs();
        const daysFromStart = today.diff(start, 'day');
        const x = daysFromStart * pixelsPerDay;
        
        if (x >= 0 && x <= width) {
          return (
            <line
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke="#ff5722"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          );
        }
        return null;
      })()}
    </svg>
  );
};
```

7.5) CSS Styling Implementation

```css path=null start=null
/* app/renderer/components/Timeline/Timeline.css */
.timeline-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: #fafafa;
  position: relative;
  border: 1px solid #e0e0e0;
}

.timeline-content {
  position: relative;
  min-width: 100%;
  background: linear-gradient(to bottom, 
    #ffffff 0%, 
    #ffffff 59px, 
    #f5f5f5 60px, 
    #f5f5f5 60px
  );
  background-size: 100% 60px;
}

.timeline-bar {
  transition: box-shadow 0.2s ease, transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-bar:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 5;
}

.timeline-bar.selected {
  box-shadow: 0 0 0 2px #2196f3, 0 4px 8px rgba(33, 150, 243, 0.3);
  z-index: 6;
}

.timeline-bar.linking-mode {
  cursor: crosshair !important;
}

.timeline-bar:active {
  cursor: grabbing;
}

.dependency-plus {
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dependency-plus:hover {
  background-color: #f0f0f0 !important;
  transform: scale(1.1);
}

.linking-cursor-line {
  position: absolute;
  pointer-events: none;
  border-left: 2px dashed #ff5722;
  height: 100%;
  top: 0;
  z-index: 10;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Scrollbar styling for Windows */
.timeline-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.timeline-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.timeline-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}

.timeline-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Loading states */
.timeline-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

```css path=null start=null
/* app/renderer/styles/globals.css (Main application styles) */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

.app-container {
  display: flex;
  height: 100vh;
  flex-direction: column;
}

.app-header {
  background: #2196f3;
  color: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  -webkit-app-region: drag; /* Allow window dragging */
}

.app-header button {
  -webkit-app-region: no-drag; /* Buttons should not drag */
}

.app-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50; /* Green for connected */
}

.status-indicator.reconnecting {
  background-color: #ff9800; /* Orange for reconnecting */
  animation: pulse 1s infinite;
}

.status-indicator.disconnected {
  background-color: #f44336; /* Red for disconnected */
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.sidebar.collapsed {
  margin-left: -300px;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 48px;
}

/* Error display */
.error-banner {
  background: #ffebee;
  color: #c62828;
  padding: 8px 16px;
  border-left: 4px solid #f44336;
  margin: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-list {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
  max-width: 400px;
}

.error-toast {
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 4px;
  border-left: 4px solid #f44336;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Button styles */
.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #f5f5f5;
}

.btn.primary {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.btn.primary:hover {
  background: #1976d2;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.loading {
  position: relative;
  color: transparent;
}

.btn.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

7.6) Error Handling & Debugging Strategies

7.6.1) Error Handling Patterns

```tsx path=null start=null
// app/renderer/components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to audit system
    if ((window as any).electronAPI) {
      // Could send error to main process for logging
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <details style={{ marginBottom: '20px', textAlign: 'left' }}>
        <summary>Error details</summary>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {error.message}
          {error.stack}
        </pre>
      </details>
      <button onClick={resetError} className="btn primary">
        Try Again
      </button>
    </div>
  );
};
```

```tsx path=null start=null
// app/renderer/components/ErrorDisplay.tsx
import React from 'react';
import { useAppStore } from '../state/store';

export const ErrorDisplay: React.FC = () => {
  const { errors, removeError, clearErrors } = useAppStore();

  if (errors.length === 0) return null;

  return (
    <div className="error-list">
      {errors.map((error, index) => (
        <div key={index} className="error-toast">
          <div style={{ flex: 1 }}>{error}</div>
          <button 
            onClick={() => removeError(index)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            ×
          </button>
        </div>
      ))}
      {errors.length > 1 && (
        <button onClick={clearErrors} className="btn" style={{ width: '100%' }}>
          Clear All
        </button>
      )}
    </div>
  );
};
```

7.6.2) Common Error Scenarios & Solutions

**Database Connection Issues:**
```typescript
// app/main/db.ts - Enhanced error handling
export function openDB(dbPath: string): DB {
  try {
    const db = new Database(dbPath, { 
      fileMustExist: false, 
      verbose: (message: string) => {
        if (process.env.NODE_ENV === 'development') {
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
    
    ensureSchema(db);
    return db;
  } catch (error: any) {
    console.error('Failed to open database:', error);
    throw new Error(`Database initialization failed: ${error.message}`);
  }
}
```

**Network/SSE Connection Issues:**
```typescript
// app/renderer/api/client.ts - Enhanced error handling
private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${this.getBaseUrl()}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal,
      ...options
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorBody = await response.text();
        errorMessage += `: ${errorBody}`;
      } catch {
        // Ignore parse error
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      console.error(`API request timeout: ${endpoint}`);
      useAppStore.getState().addError('Request timeout - please check your connection');
      throw timeoutError;
    }
    
    console.error(`API request failed: ${endpoint}`, error);
    
    // User-friendly error messages
    let userMessage = 'Network error';
    if (error.message.includes('fetch')) {
      userMessage = 'Cannot connect to server';
    } else if (error.message.includes('400')) {
      userMessage = 'Invalid request';
    } else if (error.message.includes('500')) {
      userMessage = 'Server error';
    }
    
    useAppStore.getState().addError(userMessage);
    throw error;
  }
}
```

7.6.3) Centralized Debug Logging System

The application includes a comprehensive debug logging system for capturing errors, execution contexts, and detailed debug information across both main and renderer processes.

**Main Process Debug Logger Implementation:**

```typescript
// app/main/DebugLogger.ts (complete implementation)
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: any;
  stack?: string;
}

export interface DebugLoggerConfig {
  enabled: boolean;
  level: LogLevel;
  logToFile: boolean;
  logToConsole: boolean;
  maxLogFiles: number;
  maxLogSizeBytes: number;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private config: DebugLoggerConfig;
  private logDir: string;
  private currentLogFile: string;
  private logLevels = ['debug', 'info', 'warn', 'error'];

  private constructor() {
    this.config = {
      enabled: false, // Disabled by default
      level: 'info',
      logToFile: true,
      logToConsole: true,
      maxLogFiles: 5,
      maxLogSizeBytes: 10 * 1024 * 1024 // 10MB
    };

    this.logDir = path.join(app.getPath('userData'), 'logs');
    this.currentLogFile = path.join(this.logDir, `debug-${new Date().toISOString().split('T')[0]}.log`);
    this.ensureLogDirectory();
  }

  public static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  public configure(config: Partial<DebugLoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.enabled !== undefined) {
      this.log('info', 'DebugLogger', `Debug logging ${config.enabled ? 'enabled' : 'disabled'}`);
    }
  }

  public log(level: LogLevel, component: string, message: string, context?: any, error?: Error): void {
    if (!this.config.enabled) return;
    
    const levelIndex = this.logLevels.indexOf(level);
    const configLevelIndex = this.logLevels.indexOf(this.config.level);
    
    if (levelIndex < configLevelIndex) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      context,
      stack: error?.stack
    };

    const logLine = this.formatLogEntry(entry);

    if (this.config.logToConsole) {
      this.logToConsole(entry, logLine);
    }

    if (this.config.logToFile) {
      this.logToFile(logLine);
    }
  }

  public debug(component: string, message: string, context?: any): void {
    this.log('debug', component, message, context);
  }

  public info(component: string, message: string, context?: any): void {
    this.log('info', component, message, context);
  }

  public warn(component: string, message: string, context?: any, error?: Error): void {
    this.log('warn', component, message, context, error);
  }

  public error(component: string, message: string, context?: any, error?: Error): void {
    this.log('error', component, message, context, error);
  }

  public getLogs(): LogEntry[] {
    try {
      if (!fs.existsSync(this.currentLogFile)) return [];
      
      const logContent = fs.readFileSync(this.currentLogFile, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean) as LogEntry[];
    } catch (error) {
      console.error('Failed to read logs:', error);
      return [];
    }
  }

  public clearLogs(): void {
    try {
      if (fs.existsSync(this.currentLogFile)) {
        fs.writeFileSync(this.currentLogFile, '');
      }
      this.info('DebugLogger', 'Logs cleared');
    } catch (error: any) {
      console.error('Failed to clear logs:', error);
    }
  }

  public getConfig(): DebugLoggerConfig {
    return { ...this.config };
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private logToConsole(entry: LogEntry, logLine: string): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}]`;
    
    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.context || '', entry.stack || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.context || '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.context || '');
        break;
      case 'debug':
      default:
        console.log(prefix, entry.message, entry.context || '');
        break;
    }
  }

  private logToFile(logLine: string): void {
    try {
      this.rotateLogsIfNeeded();
      fs.appendFileSync(this.currentLogFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private rotateLogsIfNeeded(): void {
    try {
      if (!fs.existsSync(this.currentLogFile)) return;
      
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= this.config.maxLogSizeBytes) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = path.join(this.logDir, `debug-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotatedFile);
        
        this.cleanupOldLogs();
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('debug-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      if (files.length > this.config.maxLogFiles) {
        const filesToDelete = files.slice(this.config.maxLogFiles);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }
}

// Export singleton instance
export const debugLogger = DebugLogger.getInstance();
```

**Main Process Integration:**

The debug logger is integrated into the main process with global error handlers:

```typescript
// app/main/main.ts - Enhanced with debug logging
import { debugLogger } from './DebugLogger';

// Initialize debug logger (disabled by default)
debugLogger.info('Main', 'Roadmap Tool starting up');

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  debugLogger.error('Process', 'Uncaught Exception', { error: error.message }, error);
  console.error('Uncaught Exception:', error);
  // Don't exit in production, log and continue
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  debugLogger.error('Process', 'Unhandled Rejection', { reason, promise: promise.toString() });
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// App event logging
app.whenReady().then(async () => {
  debugLogger.info('App', 'Electron app ready');
  
  // Initialize database with error logging
  try {
    const userDataPath = app.getPath('userData');
    debugLogger.debug('App', 'User data path', { userDataPath });
    
    const dbPath = path.join(userDataPath, 'roadmap.db');
    database = openDB(dbPath);
    debugLogger.info('App', 'Database initialized successfully');
  } catch (error: any) {
    debugLogger.error('App', 'Database initialization failed', { dbPath }, error);
    throw error;
  }
  
  createWindow();
});

// Window creation logging
function createWindow() {
  debugLogger.debug('Window', 'Creating main window');
  
  mainWindow = new BrowserWindow({
    // ... window configuration
  });
  
  // Log window events
  mainWindow.once('ready-to-show', () => {
    debugLogger.info('Window', 'Main window ready and shown');
  });
  
  mainWindow.on('closed', () => {
    debugLogger.info('Window', 'Main window closed');
    mainWindow = null;
  });
}
```

**IPC Handlers for Debug Logging Control:**

```typescript
// app/main/main.ts - IPC handlers for debug logging
ipcMain.handle('debug-log-enable', async (event, enabled: boolean) => {
  debugLogger.configure({ enabled });
  return { success: true };
});

ipcMain.handle('debug-log-set-level', async (event, level: LogLevel) => {
  debugLogger.configure({ level });
  return { success: true };
});

ipcMain.handle('debug-log-get-config', async () => {
  return debugLogger.getConfig();
});

ipcMain.handle('debug-log-get-logs', async () => {
  return debugLogger.getLogs();
});

ipcMain.handle('debug-log-clear', async () => {
  debugLogger.clearLogs();
  return { success: true };
});
```

**Enhanced Preload API:**

```typescript
// app/main/preload.ts - Debug logging API
export interface ElectronAPI {
  // ... existing API
  
  // Debug logging
  debugLog: {
    enable: (enabled: boolean) => Promise<{ success: boolean }>;
    setLevel: (level: LogLevel) => Promise<{ success: boolean }>;
    getConfig: () => Promise<DebugLoggerConfig>;
    getLogs: () => Promise<LogEntry[]>;
    clear: () => Promise<{ success: boolean }>;
  };
}

// Expose debug logging API
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing API
  
  debugLog: {
    enable: (enabled: boolean) => ipcRenderer.invoke('debug-log-enable', enabled),
    setLevel: (level: string) => ipcRenderer.invoke('debug-log-set-level', level),
    getConfig: () => ipcRenderer.invoke('debug-log-get-config'),
    getLogs: () => ipcRenderer.invoke('debug-log-get-logs'),
    clear: () => ipcRenderer.invoke('debug-log-clear')
  }
} satisfies ElectronAPI);
```

**Key Features:**

- **Disabled by default** - Debug logging must be explicitly enabled
- **Multiple log levels** - debug, info, warn, error with level filtering
- **File rotation** - Automatic log rotation when files exceed 10MB
- **Cleanup** - Keeps only the 5 most recent log files
- **Dual output** - Logs to both console and files
- **Global error capture** - Catches uncaught exceptions and unhandled rejections
- **IPC control** - Renderer can enable/disable logging and fetch logs
- **Structured logging** - JSON format for easy parsing and filtering

**Next Phase - Renderer Process Integration:**

1. **Client-side Logger:** Create renderer process logger for React errors
2. **TestRunner Dashboard:** Add debug logging controls to TestRunner UI
3. **Log Viewer:** Real-time log display with filtering and search
4. **Error Boundary Integration:** Automatic error logging from React components

7.7) Renderer Process Debug Integration (Planned)

**Renderer-side Logger Implementation:**

```typescript
// app/renderer/utils/rendererLogger.ts (planned implementation)
import type { LogLevel, LogEntry } from '../../main/DebugLogger';

export class RendererLogger {
  private static instance: RendererLogger;
  private enabled: boolean = false;
  private level: LogLevel = 'info';
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 1000;

  public static getInstance(): RendererLogger {
    if (!RendererLogger.instance) {
      RendererLogger.instance = new RendererLogger();
    }
    return RendererLogger.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const config = await window.electronAPI.debugLog.getConfig();
      this.enabled = config.enabled;
      this.level = config.level;
      
      // Set up global error handlers
      this.setupErrorHandlers();
    } catch (error) {
      console.error('Failed to initialize renderer logger:', error);
    }
  }

  public log(level: LogLevel, component: string, message: string, context?: any, error?: Error): void {
    if (!this.enabled) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: `Renderer:${component}`,
      message,
      context,
      stack: error?.stack
    };

    // Add to local buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Log to console immediately
    this.logToConsole(entry);
    
    // For errors and warnings, also send to main process
    if (level === 'error' || level === 'warn') {
      this.sendToMainProcess(entry);
    }
  }

  public error(component: string, message: string, context?: any, error?: Error): void {
    this.log('error', component, message, context, error);
  }

  public warn(component: string, message: string, context?: any, error?: Error): void {
    this.log('warn', component, message, context, error);
  }

  public info(component: string, message: string, context?: any): void {
    this.log('info', component, message, context);
  }

  public debug(component: string, message: string, context?: any): void {
    this.log('debug', component, message, context);
  }

  public getLocalLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  private setupErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Global', 'Uncaught Error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, event.error);
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Global', 'Unhandled Promise Rejection', {
        reason: event.reason?.toString()
      });
    });
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}]`;
    
    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.context || '', entry.stack || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.context || '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.context || '');
        break;
      case 'debug':
      default:
        console.log(prefix, entry.message, entry.context || '');
        break;
    }
  }

  private async sendToMainProcess(entry: LogEntry): Promise<void> {
    try {
      // Send important logs to main process for persistent storage
      await window.electronAPI.sendRendererLog?.(entry);
    } catch (error) {
      console.error('Failed to send log to main process:', error);
    }
  }
}

// Export singleton
export const rendererLogger = RendererLogger.getInstance();
```

**Enhanced Error Boundary with Logging:**

```tsx
// app/renderer/components/ErrorBoundary.tsx (enhanced)
import React from 'react';
import { rendererLogger } from '../utils/rendererLogger';

export class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to renderer logger
    rendererLogger.error('ErrorBoundary', 'React component error', {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    }, error);
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  
  // ... rest of implementation
}
```

7.8) TestRunner Dashboard Integration (Planned)

The TestRunner will be enhanced with comprehensive debug logging controls:

**Debug Logging Panel Component:**

```tsx
// app/renderer/components/TestRunner/DebugPanel.tsx (planned)
import React, { useState, useEffect } from 'react';
import type { LogEntry, LogLevel, DebugLoggerConfig } from '../../main/DebugLogger';
import { rendererLogger } from '../../utils/rendererLogger';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<DebugLoggerConfig | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rendererLogs, setRendererLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<{
    level: LogLevel | 'all';
    component: string;
    search: string;
  }>({ level: 'all', component: '', search: '' });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load initial config and logs
  useEffect(() => {
    if (isOpen) {
      loadConfig();
      loadLogs();
    }
  }, [isOpen]);

  // Auto-refresh logs
  useEffect(() => {
    if (!autoRefresh || !isOpen) return;

    const interval = setInterval(() => {
      loadLogs();
      setRendererLogs(rendererLogger.getLocalLogs());
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, isOpen]);

  const loadConfig = async () => {
    try {
      const config = await window.electronAPI.debugLog.getConfig();
      setConfig(config);
    } catch (error) {
      console.error('Failed to load debug config:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const mainLogs = await window.electronAPI.debugLog.getLogs();
      setLogs(mainLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const toggleLogging = async (enabled: boolean) => {
    try {
      await window.electronAPI.debugLog.enable(enabled);
      await loadConfig();
    } catch (error) {
      console.error('Failed to toggle logging:', error);
    }
  };

  const setLogLevel = async (level: LogLevel) => {
    try {
      await window.electronAPI.debugLog.setLevel(level);
      await loadConfig();
    } catch (error) {
      console.error('Failed to set log level:', error);
    }
  };

  const clearLogs = async () => {
    try {
      await window.electronAPI.debugLog.clear();
      await loadLogs();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  // Combine and filter logs
  const allLogs = [...logs, ...rendererLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(log => {
      if (filter.level !== 'all' && log.level !== filter.level) return false;
      if (filter.component && !log.component.toLowerCase().includes(filter.component.toLowerCase())) return false;
      if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });

  if (!isOpen) return null;

  return (
    <div className="debug-panel-overlay">
      <div className="debug-panel">
        <div className="debug-panel-header">
          <h3>Debug Logging Dashboard</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {/* Controls */}
        <div className="debug-controls">
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={config?.enabled ?? false}
                onChange={(e) => toggleLogging(e.target.checked)}
              />
              Enable Debug Logging
            </label>
          </div>

          <div className="control-group">
            <label>Log Level:</label>
            <select
              value={config?.level ?? 'info'}
              onChange={(e) => setLogLevel(e.target.value as LogLevel)}
              disabled={!config?.enabled}
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="control-group">
            <button onClick={clearLogs} disabled={!config?.enabled}>
              Clear Logs
            </button>
            <button onClick={loadLogs}>
              Refresh
            </button>
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto Refresh
            </label>
          </div>
        </div>

        {/* Filters */}
        <div className="debug-filters">
          <select
            value={filter.level}
            onChange={(e) => setFilter(f => ({ ...f, level: e.target.value as LogLevel | 'all' }))}
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>

          <input
            type="text"
            placeholder="Filter by component..."
            value={filter.component}
            onChange={(e) => setFilter(f => ({ ...f, component: e.target.value }))}
          />

          <input
            type="text"
            placeholder="Search messages..."
            value={filter.search}
            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        {/* Log Display */}
        <div className="log-display">
          <div className="log-stats">
            <span>Total: {allLogs.length}</span>
            <span>Main Process: {logs.length}</span>
            <span>Renderer: {rendererLogs.length}</span>
          </div>

          <div className="log-entries">
            {allLogs.map((entry, index) => (
              <LogEntryRow key={`${entry.timestamp}-${index}`} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogEntryRow: React.FC<{ entry: LogEntry }> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'error': return '#f44336';
      case 'warn': return '#ff9800';
      case 'info': return '#2196f3';
      case 'debug': return '#666';
      default: return '#666';
    }
  };

  return (
    <div className={`log-entry log-level-${entry.level}`}>
      <div className="log-entry-header" onClick={() => setExpanded(!expanded)}>
        <span 
          className="log-level-badge"
          style={{ backgroundColor: getLevelColor(entry.level) }}
        >
          {entry.level.toUpperCase()}
        </span>
        <span className="log-timestamp">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </span>
        <span className="log-component">[{entry.component}]</span>
        <span className="log-message">{entry.message}</span>
        {(entry.context || entry.stack) && (
          <button className="expand-button">
            {expanded ? '▼' : '▶'}
          </button>
        )}
      </div>
      
      {expanded && (entry.context || entry.stack) && (
        <div className="log-entry-details">
          {entry.context && (
            <div className="log-context">
              <strong>Context:</strong>
              <pre>{JSON.stringify(entry.context, null, 2)}</pre>
            </div>
          )}
          {entry.stack && (
            <div className="log-stack">
              <strong>Stack Trace:</strong>
              <pre>{entry.stack}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

**TestRunner Integration:**

```tsx
// app/renderer/components/TestRunner/TestRunner.tsx (enhanced)
import React, { useState } from 'react';
import { DebugPanel } from './DebugPanel';

export const TestRunner: React.FC = () => {
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  return (
    <div className="test-runner">
      <div className="test-runner-toolbar">
        {/* ... existing toolbar items */}
        
        <button 
          onClick={() => setDebugPanelOpen(true)}
          className="debug-panel-button"
          title="Open Debug Logging Dashboard"
        >
          🐛 Debug Logs
        </button>
      </div>

      {/* ... existing test runner content */}

      <DebugPanel 
        isOpen={debugPanelOpen} 
        onClose={() => setDebugPanelOpen(false)} 
      />
    </div>
  );
};
```

**Debug Panel Styling:**

```css
/* app/renderer/components/TestRunner/DebugPanel.css */
.debug-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.debug-panel {
  background: white;
  width: 90%;
  max-width: 1200px;
  height: 80%;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.debug-panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.debug-controls {
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-filters {
  padding: 12px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  align-items: center;
}

.log-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-stats {
  padding: 8px 24px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.log-entries {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.log-entry {
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.log-entry-header {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  background: #fafafa;
}

.log-entry-header:hover {
  background: #f0f0f0;
}

.log-level-badge {
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.log-timestamp {
  color: #666;
  min-width: 80px;
}

.log-component {
  color: #2196f3;
  font-weight: bold;
  min-width: 120px;
}

.log-message {
  flex: 1;
  margin-right: 8px;
}

.expand-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.log-entry-details {
  padding: 12px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.log-context, .log-stack {
  margin-bottom: 8px;
}

.log-context pre, .log-stack pre {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 3px;
  overflow-x: auto;
  font-size: 11px;
  margin: 4px 0 0 0;
}

/* Log level colors */
.log-level-error .log-entry-header {
  border-left: 4px solid #f44336;
}

.log-level-warn .log-entry-header {
  border-left: 4px solid #ff9800;
}

.log-level-info .log-entry-header {
  border-left: 4px solid #2196f3;
}

.log-level-debug .log-entry-header {
  border-left: 4px solid #666;
}
```

**Key Features of Debug Dashboard:**

- **Real-time Monitoring:** Auto-refreshing log display with latest entries
- **Dual Process Logs:** Shows both main process and renderer process logs
- **Advanced Filtering:** Filter by log level, component, or search text
- **Interactive Log Entries:** Expandable entries showing context and stack traces
- **Live Controls:** Toggle logging on/off and change log levels without restart
- **Visual Indicators:** Color-coded log levels and component identification
- **Performance Friendly:** Buffered rendering and intelligent refresh cycles

7.6.4) Development Debugging Tools

```typescript
// app/renderer/utils/devTools.ts
export class DevTools {
  static enable() {
    if (process.env.NODE_ENV === 'development') {
      // Add store to window for
      (window as any).__ROADMAP_STORE__ = useAppStore;
      
      // Add debugging helpers
      (window as any).__ROADMAP_DEBUG__ = {
        clearStore: () => {
          useAppStore.setState({
            projects: {},
            tasks: {},
            dependencies: {},
            errors: []
          });
        },
        addTestData: () => {
          const testProject = {
            id: 'TEST-1',
            title: 'Test Project',
            start_date: '01-01-2024',
            end_date: '31-01-2024',
            status: 'planned' as const,
            budget_nzd: 10000,
            financial_treatment: 'CAPEX' as const
          };
          useAppStore.getState().upsertProject(testProject);
        },
        showState: () => {
          console.log('Current store state:', useAppStore.getState());
        }
      };
      
      console.log('Debug tools enabled. Use __ROADMAP_DEBUG__ in console.');
    }
  }
}
```

7.6.4) Performance Monitoring

```typescript
// app/renderer/utils/performance.ts
export class PerformanceMonitor {
  private static timers = new Map<string, number>();
  
  static startTimer(name: string) {
    this.timers.set(name, performance.now());
  }
  
  static endTimer(name: string) {
    const start = this.timers.get(name);
    if (start) {
      const duration = performance.now() - start;
      console.log(`Timer ${name}: ${duration.toFixed(2)}ms`);
      this.timers.delete(name);
      return duration;
    }
    return 0;
  }
  
  static measureRender<T extends React.ComponentType<any>>(Component: T, name?: string): T {
    if (process.env.NODE_ENV !== 'development') return Component;
    
    const componentName = name || Component.displayName || Component.name;
    
    const MeasuredComponent: React.FC<any> = (props) => {
      React.useEffect(() => {
        PerformanceMonitor.startTimer(`${componentName} render`);
        return () => {
          PerformanceMonitor.endTimer(`${componentName} render`);
        };
      });
      
      return React.createElement(Component, props);
    };
    
    MeasuredComponent.displayName = `Measured(${componentName})`;
    return MeasuredComponent as T;
  }
}
```

7.7) Complete Electron Builder Configuration

```json path=null start=null
// electron-builder.json (complete configuration)
{
  "appId": "com.yourcompany.roadmap-tool",
  "productName": "Roadmap Tool",
  "directories": {
    "output": "dist-packages",
    "app": "dist"
  },
  "files": [
    "main/**/*",
    "renderer/**/*",
    "package.json"
  ],
  "extraResources": [
    {
      "from": "assets",
      "to": "assets"
    }
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ],
    "icon": "assets/icon.ico",
    "publisherName": "Your Company Name",
    "verifyUpdateCodeSignature": false,
    "requestedExecutionLevel": "asInvoker"
  },
  "nsis": {
    "oneClick": false,
    "allowElevation": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Roadmap Tool",
    "include": "installer/installer.nsh"
  },
  "portable": {
    "artifactName": "${productName}-${version}-portable.${ext}"
  },
  "mac": {
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      }
    ],
    "icon": "assets/icon.icns",
    "category": "public.app-category.productivity",
    "hardenedRuntime": true,
    "entitlements": "assets/entitlements.mac.plist",
    "entitlementsInherit": "assets/entitlements.mac.plist"
  },
  "linux": {
    "target": [
      {
        "target": "AppImage",
        "arch": ["x64"]
      },
      {
        "target": "deb",
        "arch": ["x64"]
      }
    ],
    "icon": "assets/icon.png",
    "category": "Office"
  },
  "protocols": [
    {
      "name": "Roadmap Tool",
      "schemes": ["roadmap-tool"]
    }
  ]
}
```

```json path=null start=null
// package.json - Complete scripts and build setup
{
  "name": "roadmap-tool",
  "version": "1.0.0",
  "description": "A collaborative roadmap planning tool",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"wait-on http://localhost:5173 && npm run dev:electron\"",
    "dev:vite": "vite app/renderer --port 5173 --host",
    "dev:electron": "cross-env NODE_ENV=development electron-vite build --watch",
    "build": "npm run build:renderer && npm run build:main",
    "build:renderer": "vite build app/renderer --outDir ../../dist/renderer",
    "build:main": "tsc app/main/*.ts --outDir dist/main --target es2020 --module commonjs",
    "build:full": "npm run clean && npm run build",
    "clean": "rimraf dist dist-packages",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "lint": "eslint app/**/*.{ts,tsx} --fix",
    "format": "prettier --write app/**/*.{ts,tsx,css}",
    "typecheck": "tsc --noEmit",
    "package": "npm run build:full && electron-builder",
    "package:win": "npm run build:full && electron-builder --win",
    "package:mac": "npm run build:full && electron-builder --mac",
    "package:linux": "npm run build:full && electron-builder --linux",
    "dist": "npm run build:full && electron-builder --publish=never",
    "postinstall": "electron-builder install-app-deps"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "concurrently": "^7.6.0",
    "cross-env": "^7.0.3",
    "electron": "^22.0.0",
    "electron-builder": "^24.0.0",
    "electron-vite": "^1.0.0",
    "rimraf": "^4.1.2",
    "wait-on": "^7.0.1",
    "typescript": "^4.9.0"
  }
}
```

Store shape (detailed implementation above):

8) Junior Developer Implementation Roadmap

8.1) Week 1: Foundation Setup

Day 1-2: Environment & Basic Structure
- [ ] Complete section 0.1-0.2 (Prerequisites & Project Setup)
- [ ] Verify `npm run dev` works successfully
- [ ] Create basic folder structure
- [ ] Set up TypeScript and linting

Day 3-4: Database & Main Process
- [ ] Implement `app/main/db.ts` (section 5.2)
- [ ] Create basic `app/main/main.ts` (section 2.1)
- [ ] Test database connection and schema creation
- [ ] Implement IPC handlers for basic operations

Day 5: Renderer Foundation
- [ ] Set up Zustand store (section 7.4.1)
- [ ] Create basic App component structure
- [ ] Implement error boundary and error display
- [ ] Add CSS imports and basic styling

8.2) Week 2: Core Timeline Implementation

Day 1-2: Timeline Components
- [ ] Implement `TimelineGrid` component (section 7.4.5)
- [ ] Create basic `Timeline` container (section 7.4.3)
- [ ] Add CSS styling (section 7.5)
- [ ] Test with mock data

Day 3-4: Project Bars & Interaction
- [ ] Implement `TimelineBar` component (section 7.4.4)
- [ ] Add drag-and-drop functionality
- [ ] Implement row allocation logic
- [ ] Test bar rendering and positioning

Day 5: API Integration
- [ ] Implement API client (section 7.4.2)
- [ ] Connect timeline to real data
- [ ] Test CRUD operations
- [ ] Add loading states

8.3) Week 3: Server & Team Mode

Day 1-2: Express Server
- [ ] Implement team server (section 8.1)
- [ ] Add basic routes (/state, /mutations)
- [ ] Test with Postman or similar tool
- [ ] Implement database integration

Day 3-4: SSE & Real-time Updates
- [ ] Add SSE endpoint (/stream)
- [ ] Implement client SSE connection
- [ ] Test real-time synchronization
- [ ] Add reconnection logic

Day 5: Team Mode UI
- [ ] Add server controls in UI
- [ ] Implement connection status display
- [ ] Test host/client scenarios
- [ ] Add error handling for server failures

8.4) Week 4: Features & Polish

Day 1-2: Dependencies
- [ ] Implement dependency creation UI
- [ ] Add dependency visualization
- [ ] Test cycle detection
- [ ] Add dependency management

Day 3-4: CSV Import/Export
- [ ] Implement CSV parsing and validation
- [ ] Add import wizard UI
- [ ] Implement export functionality
- [ ] Test with real CSV files

Day 5: Testing & Bug Fixes
- [ ] Write unit tests for key functions
- [ ] Add basic E2E tests
- [ ] Fix any discovered bugs
- [ ] Performance testing and optimization

8.5) Week 5: Deployment & Documentation

Day 1-2: Build & Package
- [ ] Set up electron-builder (section 7.7)
- [ ] Create Windows installer
- [ ] Test installed application
- [ ] Optimize bundle size

Day 3-4: Documentation
- [ ] Write user manual
- [ ] Document API endpoints
- [ ] Create troubleshooting guide
- [ ] Add inline code comments

Day 5: Final Testing
- [ ] Full application testing
- [ ] Security review
- [ ] Performance optimization
- [ ] Release preparation

8.6) Development Tips for Success

**Daily Practices:**
- Start each day by running `npm run dev` to ensure everything still works
- Commit code frequently with descriptive messages
- Test each feature thoroughly before moving to the next
- Use the browser DevTools extensively for debugging
- Keep the implementation document open for reference

**When You Get Stuck:**
1. Check the browser console for errors
2. Use `console.log()` liberally to debug data flow
3. Review the relevant section in this document
4. Break the problem into smaller pieces
5. Test with minimal examples first

**Testing Strategy:**
- Test each component in isolation first
- Use the debug tools (section 7.6.3) to inspect state
- Start with solo mode before implementing team mode
- Create sample data for testing complex scenarios
- Test error scenarios (network failures, invalid data)

**Code Quality Guidelines:**
- Use TypeScript types everywhere - avoid `any`
- Follow the existing component patterns
- Add error boundaries around complex components
- Keep components focused and single-purpose
- Use meaningful variable and function names

8.7) Troubleshooting Common Issues

**"Cannot find module" errors:**
```powershell
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Electron app won't start:**
- Check that TypeScript compilation succeeded
- Ensure `dist/main/main.js` exists
- Check terminal for error messages
- Try `npx electron dist/main/main.js` directly

**Hot reload not working:**
- Restart the dev server
- Check if port 5173 is available
- Clear browser cache in Electron DevTools

**Database issues:**
- Check file permissions in userData directory
- Look for SQLite-specific error messages
- Try deleting the DB file to recreate schema

**API connection failures:**
- Verify server is running on correct port
- Check firewall settings
- Test endpoints with curl or Postman
- Review CORS configuration

8.8) Success Criteria

By the end of implementation, you should have:

✅ **Working Solo Mode:**
- Create, edit, and delete projects
- Drag projects on timeline
- Visual timeline with proper scaling
- Data persistence in SQLite

✅ **Team Mode Functionality:**
- Host can start server
- Clients can connect and see live updates
- Real-time synchronization via SSE
- Graceful handling of disconnections

✅ **Core Features:**
- CSV import/export
- Dependency creation and visualization
- Error handling and user feedback
- Professional UI/UX

✅ **Production Ready:**
- Windows installer package
- Comprehensive error handling
- Performance optimizations
- Basic test coverage

Congratulations! You've built a complete, professional desktop application using modern web technologies. This implementation provides a solid foundation that can be extended with additional features as needed.

---

*Total estimated development time: 5 weeks for a junior developer working full-time. Adjust timeline based on experience level and complexity requirements.*

Store shape (detailed implementation above):
```ts path=null start=null
// app/renderer/state/store.ts (example)
import { create } from 'zustand';

type EntityMaps = {
  projects: Record<string, any>;
  tasks: Record<string, any>;
  deps: Record<string, any>;
};

type Connection = 'connected' | 'reconnecting' | 'disconnected';

type Mode = 'solo' | 'host' | 'client';

type State = EntityMaps & {
  mode: Mode;
  hostBaseUrl?: string;   // e.g., http://192.168.1.10:8080
  connection: Connection;
  lastEventId?: string;   // for SSE catch-up
  setMode: (m: Mode, baseUrl?: string) => void;
  setConnection: (s: Connection) => void;
  upsertProject: (p: any) => void;
  upsertTask: (t: any) => void;
  upsertDep: (d: any) => void;
  removeDep: (id: string) => void;
};

export const useStore = create<State>((set) => ({
  mode: 'solo',
  connection: 'connected',
  projects: {}, tasks: {}, deps: {},
  setMode: (mode, hostBaseUrl) => set({ mode, hostBaseUrl }),
  setConnection: (connection) => set({ connection }),
  upsertProject: (p) => set((s) => ({ projects: { ...s.projects, [p.id]: p } })),
  upsertTask: (t) => set((s) => ({ tasks: { ...s.tasks, [t.id]: t } })),
  upsertDep: (d) => set((s) => ({ deps: { ...s.deps, [d.id]: d } })),
  removeDep: (id) => set((s) => { const { [id]:_, ...rest } = s.deps; return { deps: rest }; }),
}));
```

API client and SSE usage:
```ts path=null start=null
// app/renderer/api/client.ts (example)
import { useStore } from '../state/store';

export function getBaseUrl(): string {
  const { mode, hostBaseUrl } = useStore.getState();
  if (mode === 'solo' || mode === 'host') return 'http://127.0.0.1:8080';
  return hostBaseUrl!;
}

export async function fetchState() {
  const res = await fetch(getBaseUrl() + '/state');
  return res.json();
}

export function connectSSE() {
  const st = useStore.getState();
  const headers: any = {};
  if (st.lastEventId) headers['Last-Event-ID'] = st.lastEventId;
  const es = new EventSource(getBaseUrl() + '/stream');

  es.onopen = () => useStore.getState().setConnection('connected');
  es.onerror = () => useStore.getState().setConnection('reconnecting');
  es.onmessage = (ev) => {
    // Default event
  };
  es.addEventListener('applied', (ev: MessageEvent) => {
    const data = JSON.parse(ev.data);
    // data = { lastEventId, type, entity, payload }
    useStore.setState({ lastEventId: data.lastEventId });
    // TODO: apply patch to store based on entity/type
  });
  return es;
}
```

8) Team Mode Server (Host)

8.1) Complete Express Server Implementation

```ts path=null start=null
// app/main/team-server.ts (complete implementation)
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { DB } from './db';
import { logAudit } from './audit';
import { applyMutation, validateMutation } from './mutations';
import { withTransaction } from './mutations';

export interface TeamServerConfig {
  port: number;
  bindAddress: string;
  sessionPin: string;
  userDataPath: string;
}

export class TeamServer {
  private app: express.Application;
  private server: any;
  private db: DB;
  private config: TeamServerConfig;
  private clients: Map<string, any> = new Map();
  private sessionId: string;
  
  constructor(db: DB, config: TeamServerConfig) {
    this.db = db;
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.app = this.createApp();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createApp(): express.Application {
    const app = express();

    // Security middleware
    app.use(cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true
    }));

    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));

    // Request logging
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', session: this.sessionId, timestamp: new Date().toISOString() });
    });

    // Get current state
    app.get('/state', (req, res) => {
      try {
        const state = this.getCurrentState();
        res.json(state);
      } catch (error: any) {
        console.error('Error getting state:', error);
        res.status(500).json({ error: 'Failed to get state' });
      }
    });

    // Server-Sent Events stream
    app.get('/stream', (req, res) => {
      this.handleSSEConnection(req, res);
    });

    // Apply mutations
    app.post('/mutations', (req, res) => {
      try {
        const mutations = Array.isArray(req.body) ? req.body : [req.body];
        const results = this.applyMutations(mutations);
        res.json({ success: true, results });
      } catch (error: any) {
        console.error('Error applying mutations:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // CSV Import
    app.post('/import/csv', (req, res) => {
      try {
        const { data, user } = req.body;
        const result = this.importCSV(data, user);
        res.json(result);
      } catch (error: any) {
        console.error('Error importing CSV:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // CSV Export
    app.get('/export/csv', (req, res) => {
      try {
        const csvData = this.exportCSV();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="roadmap-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
      } catch (error: any) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: 'Failed to export CSV' });
      }
    });

    // Audit endpoints
    app.get('/audit', (req, res) => {
      try {
        const filters = this.parseAuditFilters(req.query);
        const results = this.getAuditEvents(filters);
        res.json(results);
      } catch (error: any) {
        console.error('Error getting audit events:', error);
        res.status(500).json({ error: 'Failed to get audit events' });
      }
    });

    app.post('/audit', (req, res) => {
      try {
        this.logRendererAudit(req.body);
        res.status(204).end();
      } catch (error: any) {
        console.error('Error logging audit event:', error);
        res.status(400).json({ error: 'Failed to log audit event' });
      }
    });

    // Error handler
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    return app;
  }

  private getCurrentState() {
    const projects = this.db.prepare('SELECT * FROM projects ORDER BY start_date_iso').all();
    const tasks = this.db.prepare('SELECT * FROM tasks ORDER BY start_date_iso').all();
    const dependencies = this.db.prepare('SELECT * FROM dependencies ORDER BY created_at').all();

    return {
      projects: this.convertProjectsToClientFormat(projects),
      tasks: this.convertTasksToClientFormat(tasks),
      dependencies: this.convertDependenciesToClientFormat(dependencies),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };
  }

  private convertProjectsToClientFormat(projects: any[]): any[] {
    return projects.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      lane: p.lane,
      start_date: p.start_date_nz, // Use NZ format for client
      end_date: p.end_date_nz,
      status: p.status,
      pm_name: p.pm_name,
      budget_nzd: (p.budget_cents || 0) / 100, // Convert cents to NZD
      financial_treatment: p.financial_treatment,
      row: p.row
    }));
  }

  private convertTasksToClientFormat(tasks: any[]): any[] {
    return tasks.map(t => ({
      id: t.id,
      project_id: t.project_id,
      title: t.title,
      start_date: t.start_date_nz,
      end_date: t.end_date_nz,
      effort_hours: t.effort_hours,
      status: t.status,
      assigned_resources: JSON.parse(t.assigned_resources || '[]')
    }));
  }

  private convertDependenciesToClientFormat(deps: any[]): any[] {
    return deps.map(d => ({
      id: d.id,
      from: { type: d.from_type, id: d.from_id },
      to: { type: d.to_type, id: d.to_id },
      kind: d.kind,
      lag_days: d.lag_days,
      note: d.note
    }));
  }

  private handleSSEConnection(req: any, res: any) {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId, sessionId: this.sessionId })}\n\n`);

    // Store client connection
    this.clients.set(clientId, { res, connectedAt: new Date() });

    // Handle client disconnect
    req.on('close', () => {
      this.clients.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    });

    // Send periodic heartbeat
    const heartbeat = setInterval(() => {
      if (this.clients.has(clientId)) {
        res.write(': heartbeat\n\n');
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);

    console.log(`Client ${clientId} connected`);
  }

  private broadcastSSE(event: any) {
    const message = `data: ${JSON.stringify(event)}\n\n`;
    
    for (const [clientId, client] of this.clients) {
      try {
        client.res.write(message);
      } catch (error) {
        console.error(`Error sending SSE to ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  private applyMutations(mutations: any[]): any[] {
    const results: any[] = [];

    for (const mutation of mutations) {
      try {
        // Validate mutation
        validateMutation(mutation);

        // Apply in transaction
        const result = withTransaction(this.db, () => {
          const applyResult = applyMutation(this.db, mutation);
          
          // Log audit event
          logAudit(this.db, {
            id: mutation.opId,
            ts: new Date().toISOString(),
            user: mutation.user,
            module: 'Server',
            component: 'Mutations',
            action: 'apply',
            entity_type: this.inferEntityType(mutation),
            entity_id: this.inferEntityId(mutation),
            route: '/mutations',
            details: { type: mutation.type, payload: mutation.payload },
            source: 'server',
            session_id: this.sessionId
          }, this.config.userDataPath);

          return applyResult;
        });

        results.push({ success: true, opId: mutation.opId, result });

        // Broadcast change via SSE
        this.broadcastSSE({
          type: 'mutation-applied',
          opId: mutation.opId,
          mutationType: mutation.type,
          entity: this.inferEntityType(mutation),
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error(`Error applying mutation ${mutation.opId}:`, error);
        results.push({ success: false, opId: mutation.opId, error: error.message });
      }
    }

    return results;
  }

  private inferEntityType(mutation: any): string {
    if (mutation.type.includes('project')) return 'project';
    if (mutation.type.includes('task')) return 'task';
    if (mutation.type.includes('dependency')) return 'dependency';
    return 'unknown';
  }

  private inferEntityId(mutation: any): string {
    return mutation.payload?.id || mutation.payload?.from_id || '-';
  }

  private importCSV(data: any[], user: string): any {
    // Implementation would convert CSV rows to mutations and apply them
    // This is a placeholder - full implementation would be quite lengthy
    return { success: true, imported: data.length };
  }

  private exportCSV(): string {
    const projects = this.db.prepare('SELECT * FROM projects ORDER BY start_date_iso').all();
    
    let csv = 'ID,Title,Description,Lane,Start Date,End Date,Status,PM Name,Budget NZD,Financial Treatment\n';
    
    for (const project of projects) {
      const budgetNZD = ((project.budget_cents || 0) / 100).toFixed(2);
      csv += `"${project.id}","${project.title}","${project.description || ''}","${project.lane || ''}","${project.start_date_nz}","${project.end_date_nz}","${project.status}","${project.pm_name || ''}","${budgetNZD}","${project.financial_treatment}"\n`;
    }
    
    return csv;
  }

  private parseAuditFilters(query: any): any {
    return {
      limit: Math.min(Math.max(parseInt(query.limit || '100', 10) || 100, 1), 500),
      offset: Math.max(parseInt(query.offset || '0', 10) || 0, 0),
      module: query.module,
      user: query.user,
      entity_type: query.entity_type,
      entity_id: query.entity_id,
      from: query.from,
      to: query.to
    };
  }

  private getAuditEvents(filters: any): any {
    const where: string[] = [];
    const params: any = {};
    
    if (filters.module) {
      where.push('module = @module');
      params['@module'] = filters.module;
    }
    if (filters.user) {
      where.push('user = @user');
      params['@user'] = filters.user;
    }
    if (filters.entity_type) {
      where.push('entity_type = @entity_type');
      params['@entity_type'] = filters.entity_type;
    }
    if (filters.entity_id) {
      where.push('entity_id = @entity_id');
      params['@entity_id'] = filters.entity_id;
    }
    if (filters.from) {
      where.push('ts >= @from');
      params['@from'] = filters.from;
    }
    if (filters.to) {
      where.push('ts <= @to');
      params['@to'] = filters.to;
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const sql = `SELECT id, ts, user, module, component, action, entity_type, entity_id, route, source, session_id
                 FROM audit_events ${whereSql}
                 ORDER BY ts DESC
                 LIMIT @limit OFFSET @offset`;
    
    const rows = this.db.prepare(sql).all({
      ...params,
      '@limit': filters.limit,
      '@offset': filters.offset
    });
    
    return {
      rows,
      nextOffset: filters.offset + rows.length
    };
  }

  private logRendererAudit(data: any) {
    const auditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ts: new Date().toISOString(),
      user: data.user || 'unknown',
      module: data.module || 'Unknown',
      component: data.component || 'Unknown',
      action: data.action || 'unknown',
      entity_type: data.entity_type || 'unknown',
      entity_id: data.entity_id || '-',
      route: data.route || '/',
      details: data.details || {},
      source: 'renderer' as const,
      session_id: this.sessionId
    };

    logAudit(this.db, auditEvent, this.config.userDataPath);
  }

  async start(): Promise<{ port: number; address: string; url: string }> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, this.config.bindAddress, () => {
        const address = `${this.config.bindAddress}:${this.config.port}`;
        const url = `http://${address}`;
        
        console.log(`Team server started on ${url}`);
        resolve({ port: this.config.port, address: this.config.bindAddress, url });
      });

      this.server.on('error', (error: any) => {
        console.error('Server start error:', error);
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        // Close all SSE connections
        for (const [clientId, client] of this.clients) {
          try {
            client.res.end();
          } catch (error) {
            console.error(`Error closing client ${clientId}:`, error);
          }
        }
        this.clients.clear();

        this.server.close(() => {
          console.log('Team server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getInfo() {
    return {
      port: this.config.port,
      address: this.config.bindAddress,
      url: `http://${this.config.bindAddress}:${this.config.port}`,
      sessionId: this.sessionId,
      clientCount: this.clients.size,
      startTime: new Date().toISOString()
    };
  }
}

export function createTeamServer(db: DB, config: TeamServerConfig): TeamServer {
  return new TeamServer(db, config);
}
```

Endpoints Summary:

GET  /health            # Server health check
GET  /state             # Current roadmap state (projects, tasks, dependencies)
GET  /stream            # SSE; emits {type:'mutation-applied', 'connected', etc.}
POST /mutations         # [{opId, user, ts, type, payload}, ...]
POST /import/csv        # Import CSV data
GET  /export/csv        # Export current data as CSV
GET  /audit             # Query audit log with filters
POST /audit             # Record renderer-originated audit event


Mutation envelope example:

{
  "opId":"f25d-…-b31",
  "user":"alex",
  "ts":"2025-10-08T10:05:00Z",
  "type":"project.update_dates",
  "payload":{"id":"PRJ-1","start_date":"01-11-2025","end_date":"15-12-2025"}
}


Server logic (serial apply):

Validate payload (dates DD-MM-YYYY; NZD 2dp; references exist).

BEGIN TRANSACTION → apply changes → INSERT audit_events → COMMIT.

Append to events.ndjson.

Emit SSE (notify clients).

8.1) SSE Protocol (events and heartbeats)
- Headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive
- Heartbeats: send a comment line ":keepalive" every 15–30 seconds to keep connections alive.
- Event shape for applied mutations:
  - event: applied
  - data: { lastEventId: string, opId: string, type: string, entity: string, payload: any, ts: string }
- Clients should send Last-Event-ID on reconnect (browser auto-handles) and the server should resume from that id.

9) CSV Import/Export

Import flow (renderer or host):

Parse via PapaParse.

Validate: required columns, dates (DD-MM-YYYY only; reject ISO YYYY-MM-DD), NZD ≤ 2dp.
- If any row contains a date not in strict NZ format (DD-MM-YYYY), produce a row-level error and skip applying the file.

Map to mutations; POST /import/csv (host applies). The host re-validates and persists NZ copies (for display/CSV) and ISO copies (for queries/indexes), and converts NZD to integer cents.

Export flow:

Host queries DB, builds rows by selected columns, and outputs NZ formats:
- Dates exported as NZ (DD-MM-YYYY).
- Currency exported as NZD with 2 decimals (derived from cents).

Also writes to /app/data/exports/yyyymmdd-hhmm.csv.

9.1) CSV NZ date validator snippet (copy/paste)

Purpose: Strictly validate DD-MM-YYYY dates in CSV rows and surface row-level errors before sending to the host. Rejects ISO and invalid calendar dates (e.g., 31-11-2025).

```ts path=null start=null
// app/renderer/utils/csvValidators.ts (example)
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

// Strict NZ format check with both regex and calendar validation.
export function isNZDateStrict(value: string): boolean {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  // DD-MM-YYYY with leading zeroes required
  if (!/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/.test(s)) return false;
  // Calendar validation (handles month lengths, leap years)
  const d = dayjs(s, 'DD-MM-YYYY', true);
  return d.isValid();
}

export type CsvValidationError = { row: number; field: string; message: string };

// Validate specified date fields on each row. Row numbers are 1-based for user friendliness.
export function validateCsvDates(rows: Record<string, any>[], dateFields: string[]): CsvValidationError[] {
  const errors: CsvValidationError[] = [];
  rows.forEach((row, idx) => {
    const rowNum = idx + 1; // assuming header not included; adjust if needed
    for (const field of dateFields) {
      const val = row[field];
      if (val == null || String(val).trim() === '') {
        errors.push({ row: rowNum, field, message: 'Missing required date (DD-MM-YYYY)' });
        continue;
      }
      if (!isNZDateStrict(String(val))) {
        errors.push({ row: rowNum, field, message: `Invalid NZ date format (expected DD-MM-YYYY): ${val}` });
      }
    }
  });
  return errors;
}

// Example integration with PapaParse results in a React component
// Assume results.data is an array of objects keyed by CSV headers
export function validateImport(results: { data: Record<string, any>[] }) {
  const rows = results.data;
  const errors = validateCsvDates(rows, ['start_date', 'end_date']);
  if (errors.length > 0) {
    // Surface row-level errors to the user and abort
    return { ok: false as const, errors };
  }
  return { ok: true as const };
}
```

UI guidance:
- Show a table of errors: Row, Field, Message.
- Disable the "Apply Import" button until there are no errors.
- Keep a "Download error report (CSV)" link that serializes the errors array for users to fix the source file.

10) Validation, Canonical Storage, and NZD Rules

Currency (NZD):
- UI accepts strings like '1,234.50' or '1234.5'.
- Validate: non-negative, up to two decimal places.
- Convert to cents integer before persisting: cents = dollars*100; reject inputs with more than 2 decimal places instead of silently rounding.
- Store in DB as projects.budget_cents (INTEGER).
- When sending data to renderer or exporting CSV, convert cents → NZD with two decimals; format is a display concern only.

Dates:
- UI input and CSV both require NZ format DD-MM-YYYY.
- Reject ISO (YYYY-MM-DD) or any other format in CSV; show row-level errors and do not apply invalid files.
- Validate date bounds and leap years strictly.
- Convert to ISO 'YYYY-MM-DD' internally for DB persistence and indexing (start_date_iso/end_date_iso in both projects and tasks).
- Also store NZ copies (start_date_nz/end_date_nz) to avoid reconversion for display and CSV export.
- All range queries, sorting, and constraints in SQL must use the ISO columns and the iso-based indexes.

Foreign keys and duplicate dependencies:
- Ensure PRAGMA foreign_keys=ON at DB init and for every connection.
- tasks.project_id has ON DELETE CASCADE—covered once FKs are enabled.
- Prevent duplicate dependency edges with UNIQUE index on (from_type, from_id, to_type, to_id, kind).
- Because dependencies use polymorphic references, enforce referential integrity in application logic for from_/to_ pairs.

Renderer/server responsibilities:
- Renderer: validate and normalize inputs (NZ currency → cents, NZ dates → ISO) before sending mutations.
- Server: re-validate all incoming mutations, compute canonical fields (iso and cents), and persist.
- Export CSV: render NZ dates and NZD with two decimals.

11) Security (LAN)

Bind to private subnet only (0.0.0.0 configurable).

Session PIN is REQUIRED to start Team Mode.
- On host start, user sets a session PIN (4–8 digits) and the app generates a random 16-byte salt.
- Derive a per-session secret using PBKDF2-HMAC-SHA256 with 100k iterations: secret = PBKDF2(pin, salt, 100000, 32).
- Persist salt in memory for this session only; never store the raw PIN.
- Include an HMAC-SHA256 of the mutation envelope using the derived secret. Server verifies HMAC and rejects unsigned/invalid requests.
- Include opId as part of the HMAC payload to prevent replay.

CORS/origins: restrict to the app’s renderer origin and LAN host IPs; no external origins.

No external calls. No tokens stored.

Windows firewall note:
- On first host start, Windows may prompt to allow access on private networks for port 8080. Choose “Private networks” and allow. If blocked, clients cannot connect.
- If port 8080 is in use or blocked, prompt the user to pick a different port and retry binding.

12) Automated Tests
12.1 Unit (Jest)

Positive

date.parseNZ('01-03-2025') → OK.

money.parseNZD('1,234.50') → 1234.50.

Row allocator places overlaps into separate rows.

Dependency DFS allows FS, SS, FF, SF (valid).

Negative

Invalid date/format → throws.

NZD with 10.999 → throws.

Self-link, duplicate, or cycle → throws.

Mutation with missing project → 400.

12.2 E2E (Playwright)

12.3 Test Config Hints (Jest and Playwright)

Jest config (TypeScript + ts-jest):
```js path=null start=null
// jest.config.js (example)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.ts'],
};
```

Playwright config:
```ts path=null start=null
// playwright.config.ts (example)
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  use: { headless: true },
});
```

Commands:
- Unit: npm run test
- E2E: npm run e2e

12.4 Test Matrix & Scenarios (must-have UI/UX coverage)

A) Timeline & Rows
- Row allocation: overlapping projects rendered on separate rows; non-overlapping in same row.
- Drag/resize: snaps to whole days; updates dates in Details panel; persists on save.
- Zoom: day width scaling visually affects bar width without changing dates.

B) Dependencies
- Create via “+”: FS by default; UI shows linking cursor and rubber-band.
- Prevent invalid: self-link blocked; duplicate same-kind blocked; cycles blocked (error toast).
- Edit: change kind FS/SS/FF/SF; set lag; Delete removes line and DB row.

C) Fortnight FY View
- Renders 26 fortnights from 01-04-YYYY; month dividers Apr→Mar.
- Snapping: bars align to fortnight indices; boundary cases (Mar 31, Apr 1; leap years) correct.

D) CSV Import/Export
- Import validation: DD-MM-YYYY only; row-level errors table; "Apply" disabled until 0 errors; error CSV downloadable.
- Successful import: rows mapped to mutations; server applies; UI updates.
- Export: dates in NZ format; currency 2dp derived from cents; file saved to exports/.

E) Team Mode & Networking
- Host start requires PIN; without PIN, "Start Hosting" blocked.
- Client join via IP + PIN; on success, connection banner shows connected.
- SSE live update: another client change is reflected in this client within timeout.
- SSE reconnect: simulate temporary disconnect; client shows reconnecting; resumes via Last-Event-ID.

F) Auditing
- UI events logged (navigate, import_start, dependency create) via POST /audit.
- Server apply logs mutation with module=Server/action=apply.
- Hidden /Audit.html navigable via Ctrl+Alt+A; not linked in main nav.
- Filters work (module, user, date range); pagination loads more.
- Details rendering sanitized (no HTML execution).

G) Archiving
- Archive Project flow: confirmation modal; exports CSVs; deletes project/tasks/deps.
- Audit entry recorded with counts and file paths.
- Restore by importing the exported CSV brings data back (IDs preserved or conflict flow shown).

H) Validation & Security
- Dates: reject ISO or invalid dates in CSV; validator marks rows.
- NZD: >2dp rejected; cents conversion correct.
- Dependency DFS rejects cycles on complex graphs.
- HMAC enforced on /mutations (if implemented now): invalid HMAC → 401; valid → 200.
- Firewall note (manual): Host functions on private network when Windows access allowed (documented; optional manual check).

12.5 Playwright Setup: renderer-focused E2E with mock backend

Approach for juniors: test the renderer against a local mock server that simulates the host REST + SSE. This avoids Electron harness complexity and validates UI/UX thoroughly.

- Add tests/e2e/mock-server.ts to implement /state, /mutations, /audit, /import/csv, /export/csv and /stream (SSE) in-memory.
- Start mock server in a Playwright test fixture; set window.API_BASE_URL or use an env var the renderer reads for base URL.

Fixture example:
```ts path=null start=null
// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test';
import http from 'http';

export const test = base.extend<{ serverUrl: string }>({
  serverUrl: [async ({}, use) => {
    const srv = http.createServer(/* TODO: implement mock routes */);
    await new Promise<void>(res => srv.listen(0, '127.0.0.1', () => res()));
    const address = srv.address();
    const url = `http://127.0.0.1:${(address as any).port}`;
    await use(url);
    await new Promise<void>(res => srv.close(() => res()));
  }, { scope: 'test' }],
});
```

Example spec (Timeline + Dependency):
```ts path=null start=null
// tests/e2e/timeline.spec.ts
import { test, expect } from './fixtures';

test('drag-resize updates dates and prevents overlap', async ({ page, serverUrl }) => {
  await page.goto('/'); // renderer dev server URL
  await page.evaluate((u) => (window as any).API_BASE_URL = u, serverUrl);
  // Selectors assume data-testid attributes exist (see 12.8)
  const bar = page.getByTestId('timeline-bar-PRJ-1');
  await bar.dragTo(page.getByTestId('timeline-grid'), { targetPosition: { x: 50, y: 0 } });
  await expect(page.getByTestId('project-dates')).toContainText('…');
});

test('create dependency via plus and block duplicate kind', async ({ page, serverUrl }) => {
  await page.goto('/Roadmap');
  await page.getByTestId('dep-plus-PRJ-1').click();
  await page.getByTestId('timeline-bar-PRJ-2').click();
  await expect(page.getByTestId('dep-line-<auto-id>')).toBeVisible();
  // Try duplicate FS
  await page.getByTestId('dep-plus-PRJ-1').click();
  await page.getByTestId('timeline-bar-PRJ-2').click();
  await expect(page.getByText('Duplicate dependency')).toBeVisible();
});
```

12.6 Jest Unit Tests: examples

- Date and currency validators:
```ts path=null start=null
// tests/unit/validation.test.ts
import { parseNZDateToISO, parseNZDToCents } from '../../app/main/validation';
import { isNZDateStrict, validateCsvDates } from '../../app/renderer/utils/csvValidators';

test('NZ date strict validator rejects ISO', () => {
  expect(isNZDateStrict('2025-01-14')).toBe(false);
  expect(isNZDateStrict('14-01-2025')).toBe(true);
});

test('parse NZD to cents handles 2dp', () => {
  expect(parseNZDToCents('1,234.50')).toBe(123450);
  expect(() => parseNZDToCents('10.999')).toThrow();
});
```

- Dependency DFS cycle detection:
```ts path=null start=null
// tests/unit/deps-graph.test.ts
import { hasCycle } from '../../app/main/depsGraph';

test('detects cycle across project/task mix', () => {
  const edges = [ ['A','B'], ['B','C'], ['C','A'] ];
  expect(hasCycle(edges)).toBe(true);
});
```

- Row allocator:
```ts path=null start=null
// tests/unit/rows.test.ts
import { allocateRows } from '../../app/renderer/utils/rows';

test('overlapping projects split rows', () => {
  const rows = allocateRows([
    { id:'P1', start:'01-01-2025', end:'10-01-2025' },
    { id:'P2', start:'05-01-2025', end:'12-01-2025' },
  ]);
  expect(rows['P1']).not.toBe(rows['P2']);
});
```

12.7 Networking & SSE tests (optional advanced)
- Unit-test SSE handler to emit heartbeat and applied events; verify Last-Event-ID resume logic with a small in-memory ring buffer.
- Unit-test HMAC verification utility: good signature accepted, tampered body rejected.

12.8 Testability: data-testid guidance
- Add data-testid attributes to key elements to make selectors robust and readable:
  - timeline-bar-<projectId>
  - dep-plus-<entityId>
  - dep-line-<depId>
  - import-errors-table, import-apply-button
  - audit-table, audit-filter-module, audit-load-more
  - archive-confirm-button
- Use getByTestId in Playwright tests to avoid brittle CSS selectors.

Positive

Start host; join 2 clients; create project; drag/resize; save; both clients update via SSE.

Create dependency via “+”; delete it.

Import CSV; export CSV.

Negative

Kill host mid-edit → clients show reconnect banner; resume without data loss.

Network drop → client buffers UI edits (disabled save) until reconnect.

Invalid CSV → inline row errors; nothing applied.

13) Logging & Troubleshooting

audit_events table + events.ndjson for replay.

Developer console panel for diagnostics (DB size, #projects, #deps).

14) Packaging

Electron Builder to generate an installer (Windows).

App data path: %APPDATA%/RoadmapTool (contains DB and exports).

15) Auditing & Hidden Audit UI (/Audit.html)

Objective:
- Record all user activities with module/component context to support accountability and troubleshooting.
- Provide a hidden page at /Audit.html to browse and filter audit entries.

What gets logged:
- Renderer UI actions: navigation, create/update/delete operations initiated, CSV imports/exports initiated, dependency create/delete, timeline drag/resize, settings changes.
- Server apply events: each mutation applied, CSV import applied, export generated, host start/stop, client join/leave.

Audit event shape (logical model):
- id: string (UUID; may reuse opId for applied mutations)
- ts: ISO timestamp (string)
- user: string (from app profile or entered name)
- module: string (e.g., 'Timeline', 'Dependencies', 'CSV', 'Settings')
- component: string (UI component or server subsystem, e.g., 'TimelineBar', 'DepOverlay', 'ImportWizard', 'Server')
- action: string (e.g., 'navigate', 'create', 'update', 'delete', 'import', 'export', 'apply')
- entity_type: string ('project'|'task'|'dependency'|'initiative'|'app')
- entity_id: string (e.g., 'PRJ-1', 'T-5', 'D-3' or '-')
- route: string (renderer route at the time, e.g., '/Roadmap', '/Audit.html')
- details: JSON string (structured metadata: before/after diffs, counts, filenames, etc.)
- source: 'renderer'|'server'
- session_id: string (host session identifier)

Database storage (augment audit_events table):
- Keep existing audit_events columns and add explicit columns for query filters.

Migration (add columns if missing):
```sql
ALTER TABLE audit_events ADD COLUMN module TEXT;
ALTER TABLE audit_events ADD COLUMN component TEXT;
ALTER TABLE audit_events ADD COLUMN action TEXT;
ALTER TABLE audit_events ADD COLUMN entity_type TEXT;
ALTER TABLE audit_events ADD COLUMN entity_id TEXT;
ALTER TABLE audit_events ADD COLUMN route TEXT;
ALTER TABLE audit_events ADD COLUMN source TEXT;
ALTER TABLE audit_events ADD COLUMN session_id TEXT;
-- details already stored in payload; continue to store enriched JSON there.

CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_events(module);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
```

Server logging pattern:
```ts
// app/main/audit.ts (example)
import type { DB } from './db';

export type AuditEvent = {
  id: string; ts: string; user: string; module: string; component: string; action: string;
  entity_type: string; entity_id: string; route: string; details: any; source: 'server'|'renderer'; session_id: string;
};

export function logAudit(db: DB, ev: AuditEvent) {
  const stmt = db.prepare(`INSERT INTO audit_events (id, ts, user, type, payload, module, component, action, entity_type, entity_id, route, source, session_id)
    VALUES (@id, @ts, @user, @type, @payload, @module, @component, @action, @entity_type, @entity_id, @route, @source, @session_id)`);
  stmt.run({
    ...ev,
    type: `${ev.module}.${ev.action}`,
    payload: JSON.stringify(ev.details ?? {})
  });
}
```

Renderer logging pattern:
```ts
// app/renderer/utils/auditClient.ts (example)
export type ClientAudit = {
  user: string; module: string; component: string; action: string;
  entity_type: string; entity_id: string; route: string; details?: any;
};

export async function auditUI(ev: ClientAudit) {
  try {
    await fetch('/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ev, ts: new Date().toISOString(), source: 'renderer' })
    });
  } catch (e) {
    // Optional: buffer locally and retry
  }
}
```

Server endpoints:
- POST /audit: write a renderer-originated audit entry (validate module/component/action strings; limit payload size).
- GET /audit?limit=100&module=Timeline&user=alice: paginate and filter audit events for the UI.
- SSE /stream: you may optionally broadcast audit entries to live clients with a distinct event type.

Hidden Audit page (/Audit.html):
Step-by-step for a junior dev:
1) Create a new view file app/renderer/views/Audit.tsx that fetches GET /audit and renders a table with columns: Time, User, Module, Component, Action, Entity, Route, Details.
2) Add a route mapping '/Audit.html' → <AuditView/> in your router setup (e.g., react-router). Do not link it in the main navigation.
3) Implement filters (text inputs/dropdowns) for module, user, date range. Debounce requests and call GET /audit with query params.
4) Add a keyboard shortcut (e.g., Ctrl+Alt+A) in the renderer to navigate to '/Audit.html' for power users.
5) Optionally add a "Copy to CSV" button that converts the current table to CSV for sharing.

Example view skeleton:
```tsx
// app/renderer/views/Audit.tsx (example)
import React from 'react';
export default function AuditView() {
  // state: filters, rows, loading
  // effect: fetch on mount and when filters change
  return (
    <div>
      <h1>Audit</h1>
      {/* Filters + table here */}
    </div>
  );
}
```

Events file (events.ndjson):
- Continue appending an audit ndjson line mirroring the DB insert for offline replay. Keep one file; tag entries with kind:'audit' vs kind:'mutation' to distinguish.

Performance & retention:
- Index by ts, module, and (entity_type, entity_id) as above.
- Add a simple retention policy (e.g., keep last 90 days) with an export-to-CSV/JSON step before purging.
- Provide a toggle in Settings to disable UI interaction audits if noise is too high; server apply audits should remain enabled.

Security:
- The Audit page is hidden but not password-protected. It is local to the app; do not expose it over the network beyond the host app.
- Sanitize details before rendering to avoid XSS in the table view.

15.1) Server Audit Scaffolding (Express + better-sqlite3)

Files to create/update:
- app/main/audit.ts: helper to insert audit entries.
- app/main/team-server.ts: add /audit POST and /audit GET routes; call logAudit() in mutation paths.
- app/main/db.ts: ensure audit schema (added columns and indexes for filtering) is created.
- app/data/events.ndjson: continue appending audit events for replay.

Create helper (insert + ndjson append):
```ts path=null start=null
// app/main/audit.ts
import fs from 'fs';
import path from 'path';
import type { DB } from './db';

export type AuditEvent = {
  id: string; ts: string; user: string; module: string; component: string; action: string;
  entity_type: string; entity_id: string; route: string; details: any; source: 'server'|'renderer'; session_id: string;
};

export function logAudit(db: DB, ev: AuditEvent, userDataDir: string) {
  const stmt = db.prepare(`INSERT INTO audit_events (
    id, ts, user, type, payload, module, component, action, entity_type, entity_id, route, source, session_id
  ) VALUES (@id, @ts, @user, @type, @payload, @module, @component, @action, @entity_type, @entity_id, @route, @source, @session_id)`);

  stmt.run({
    ...ev,
    type: `${ev.module}.${ev.action}`,
    payload: JSON.stringify(ev.details ?? {})
  });

  try {
    const f = path.join(userDataDir, 'events.ndjson');
    fs.appendFileSync(f, JSON.stringify({ kind: 'audit', ...ev }) + '\n', 'utf8');
  } catch {
    // best effort only
  }
}
```

Add routes (POST/GET) to team-server.ts:
```ts path=null start=null
// app/main/team-server.ts (snippets)
import express from 'express';
import bodyParser from 'body-parser';
import { logAudit } from './audit';
import { openDB } from './db';

const app = express();
app.use(bodyParser.json({ limit: '32kb' }));

// POST /audit: renderer-originated audit entry
app.post('/audit', (req, res) => {
  const b = req.body || {};
  // Basic validation and coercion
  const str = (x: any, max = 128) => (typeof x === 'string' ? x.slice(0, max) : '');
  const details = typeof b.details === 'object' && b.details !== null ? b.details : {};
  const ev = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    user: str(b.user, 64) || 'unknown',
    module: str(b.module, 64),
    component: str(b.component, 64),
    action: str(b.action, 64),
    entity_type: str(b.entity_type, 32),
    entity_id: str(b.entity_id, 64),
    route: str(b.route, 128),
    details,
    source: 'renderer' as const,
    session_id: getCurrentSessionId(),
  };
  try {
    logAudit(db, ev, userDataDir);
    return res.status(204).end();
  } catch (e) {
    return res.status(400).json({ error: 'Failed to write audit' });
  }
});

// GET /audit: filter + pagination
// /audit?limit=100&offset=0&module=Timeline&user=alice&entity_type=project&entity_id=PRJ-1&from=2025-01-01&to=2025-12-31
app.get('/audit', (req, res) => {
  const q = req.query as Record<string, string>;
  const limit = Math.min(Math.max(parseInt(q.limit || '100', 10) || 100, 1), 500);
  const offset = Math.max(parseInt(q.offset || '0', 10) || 0, 0);
  const where: string[] = [];
  const params: any = {};
  const add = (cond: string, key: string, max = 128) => {
    const v = q[key];
    if (typeof v === 'string' && v.length) { where.push(cond); params['@' + key] = v.slice(0, max); }
  };
  add('module = @module', 'module', 64);
  add('user = @user', 'user', 64);
  add('entity_type = @entity_type', 'entity_type', 32);
  add('entity_id = @entity_id', 'entity_id', 64);
  if (q.from) { where.push('ts >= @from'); params['@from'] = q.from; }
  if (q.to)   { where.push('ts <= @to');   params['@to']   = q.to; }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`SELECT id, ts, user, module, component, action, entity_type, entity_id, route, source, session_id
                           FROM audit_events ${whereSql}
                           ORDER BY ts DESC
                           LIMIT @limit OFFSET @offset`).all({ ...params, '@limit': limit, '@offset': offset });
  return res.json({ rows, nextOffset: offset + rows.length });
});
```

Call logAudit when applying mutations (example):
```ts path=null start=null
// In your mutation apply path
logAudit(db, {
  id: opId,
  ts: new Date().toISOString(),
  user: mutation.user,
  module: 'Server',
  component: 'Mutations',
  action: 'apply',
  entity_type: inferEntityType(mutation),
  entity_id: inferEntityId(mutation),
  route: '/Server',
  details: { type: mutation.type, payload: mutation.payload },
  source: 'server',
  session_id: getCurrentSessionId(),
}, userDataDir);
```

Notes:
- Limit body size to prevent abuse; cap limit to <= 500 per request on GET.
- Always use parameter binding for filters; never string-concatenate user input.
- Keep audit inserts outside of the main mutation transaction if they are best effort; or inside if you want atomicity.

15.2) Renderer Audit Scaffolding (React)

Files to create/update:
- app/renderer/utils/auditClient.ts: helper to send audit events.
- app/renderer/views/Audit.tsx: hidden page to view logs.
- app/renderer/main.tsx (or router setup): add '/Audit.html' route.
- Wire auditUI() calls in key UI flows (navigation, CSV, dependencies, timeline drag/resize, settings save).

Client helper:
```ts path=null start=null
// app/renderer/utils/auditClient.ts
export type ClientAudit = {
  user: string; module: string; component: string; action: string;
  entity_type: string; entity_id: string; route: string; details?: any;
};

export async function auditUI(ev: ClientAudit) {
  const body = { ...ev, ts: new Date().toISOString(), source: 'renderer' };
  try {
    await fetch('/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    // Optional: buffer locally and retry
  }
}
```

Usage examples:
```ts path=null start=null
// On route change
auditUI({ user, module: 'Navigation', component: 'Router', action: 'navigate', entity_type: 'app', entity_id: '-', route: location.pathname, details: {} });

// After CSV import validation passes (before sending to host)
auditUI({ user, module: 'CSV', component: 'ImportWizard', action: 'import_start', entity_type: 'app', entity_id: '-', route: '/Import', details: { rows } });

// After dependency created
auditUI({ user, module: 'Dependencies', component: 'DepOverlay', action: 'create', entity_type: 'dependency', entity_id: depId, route: '/Roadmap', details: { from, to, kind } });
```

Hidden Audit view:
```tsx path=null start=null
// app/renderer/views/Audit.tsx (skeleton)
import React, { useEffect, useState } from 'react';

type Row = { id: string; ts: string; user: string; module: string; component: string; action: string; entity_type: string; entity_id: string; route: string; source: string; session_id: string };

export default function AuditView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState({ module: '', user: '', entity_type: '', entity_id: '', from: '', to: '' });
  const [next, setNext] = useState(0);

  const load = async (reset = false) => {
    const params = new URLSearchParams({ limit: '100', offset: reset ? '0' : String(next), ...filter } as any);
    const res = await fetch('/audit?' + params.toString());
    const data = await res.json();
    setRows(reset ? data.rows : [...rows, ...data.rows]);
    setNext(data.nextOffset);
  };

  useEffect(() => { load(true); }, [filter.module, filter.user, filter.entity_type, filter.entity_id, filter.from, filter.to]);

  return (
    <div>
      <h1>Audit</h1>
      {/* Add filter inputs bound to setFilter({...}) */}
      <table>
        <thead><tr><th>Time</th><th>User</th><th>Module</th><th>Component</th><th>Action</th><th>Entity</th><th>Route</th><th>Source</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.ts).toLocaleString()}</td>
              <td>{r.user}</td>
              <td>{r.module}</td>
              <td>{r.component}</td>
              <td>{r.action}</td>
              <td>{r.entity_type}:{r.entity_id}</td>
              <td>{r.route}</td>
              <td>{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => load(false)}>Load more</button>
    </div>
  );
}
```

Router addition and shortcut:
```ts path=null start=null
// app/renderer/main.tsx
// Add a route mapping '/Audit.html' → <AuditView/> and a keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
    window.location.href = '/Audit.html';
  }
});
```

15.3) Tests for Audit

Unit (Jest):
- Insert a server-side audit event and fetch it back via GET /audit; assert fields match and filters work.
- POST /audit with oversized strings is truncated and still accepted.

E2E (Playwright):
- Navigate, create a dependency, then open /Audit.html and assert that at least one row appears with action=create under Module=Dependencies.

16) Archiving Projects

Goal: Allow small teams to archive completed projects: export their data to CSV and remove them from the active DB, reducing clutter.

UI trigger:
- From Project Details or context menu: “Archive Project…”. Confirm dialog summarizes what will be exported and removed.

Export contents (CSV files):
- projects.csv: matching project row (including NZ/ISO dates, status, budget_cents, financial_treatment, row)
- tasks.csv: all tasks for that project
- dependencies.csv: all dependencies where from_id/to_id references the project or its tasks
- metadata.json (optional): app version, archive timestamp, user, notes

Server steps (transaction):
1) BEGIN;
2) Query and write CSVs to exports/ with a timestamped prefix (e.g., archive-PRJ-1234-yyyymmdd-hhmm/).
3) Delete dependencies tied to the project or its tasks.
4) Delete tasks for the project.
5) Delete the project row.
6) INSERT audit_events for archive action (module='Archive', action='apply', details include counts and file paths).
7) COMMIT;

Restore (manual):
- Use CSV Import to re-add archived items later. The import wizard should detect IDs; if conflicts exist, let the user choose new IDs or skip.

Notes:
- Archived items are removed from active DB; they remain in exported CSV files for record-keeping.
- Consider a Settings toggle to hide/show archived items if you opt to keep them in DB with status='archived' instead of deletion.

END: Option 1
