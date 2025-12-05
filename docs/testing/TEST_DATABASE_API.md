# TestDatabase API Reference

**Purpose:** Complete reference for the TestDatabase helper class  
**Last Updated:** December 5, 2025  
**Location:** `tests/helpers/testDatabase.ts`

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Methods](#core-methods)
- [Seeding Methods](#seeding-methods)
- [Transaction Methods](#transaction-methods)
- [Performance Monitoring](#performance-monitoring)
- [Helper Functions](#helper-functions)
- [Complete Examples](#complete-examples)

---

## Overview

The `TestDatabase` class provides utilities for managing test databases with automatic setup, teardown, and data seeding. It ensures test isolation and makes writing database tests simple and reliable.

**Key Features:**
- ✅ Automatic database setup and teardown
- ✅ In-memory mode for fast tests
- ✅ Standard data fixtures for quick testing
- ✅ Transaction support for test isolation
- ✅ Query counting for performance testing
- ✅ Helper methods for complex scenarios

---

## Quick Start

### Basic Usage

```typescript
import { TestDatabase } from '../../helpers/testDatabase';
import Database from 'better-sqlite3';

describe('My Service Tests', () => {
  let testDb: TestDatabase;
  let db: Database.Database;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup(true); // true = in-memory (fast!)
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  test('my test', () => {
    // Your test code here
  });
});
```

---

## Core Methods

### `setup(inMemory: boolean = true): Promise<Database.Database>`

**Purpose:** Initialize the test database with schema and migrations.

**Parameters:**
- `inMemory` - If `true`, creates an in-memory database (fast). If `false`, creates a temporary file database (realistic).

**Returns:** A `Database.Database` instance ready for use.

**When to use:**
- Always call in `beforeEach` or `beforeAll`
- Use `true` for 99% of tests (fast)
- Use `false` only when testing file-specific operations

**Example:**
```typescript
beforeEach(async () => {
  testDb = new TestDatabase();
  
  // Fast mode (recommended for most tests)
  db = await testDb.setup(true);
  
  // OR realistic mode (rarely needed)
  db = await testDb.setup(false);
});
```

---

### `teardown(): Promise<void>`

**Purpose:** Close database connections and delete temporary files.

**IMPORTANT:** Always call this in `afterEach` or `afterAll` to prevent:
- Resource leaks
- File system pollution
- "Database is locked" errors

**Example:**
```typescript
afterEach(async () => {
  await testDb.teardown();
});
```

---

### `getDb(): Database.Database`

**Purpose:** Get the current database instance.

**Returns:** The database instance, or throws error if not initialized.

**When to use:**
- When you need direct database access for custom queries
- Within helper functions that need the DB

**Example:**
```typescript
test('custom query', async () => {
  const db = testDb.getDb();
  const result = db.prepare('SELECT * FROM projects WHERE status = ?').all('active');
  expect(result.length).toBeGreaterThan(0);
});
```

---

### `reset(): Promise<void>`

**Purpose:** Clear all table data without recreating the database structure.

**Use cases:**
- When you want to reset data between test groups
- Faster than teardown + setup
- Maintains schema and structure

**Example:**
```typescript
test('first test', () => {
  // Create some data
  service.createProject({...});
});

// Reset data between tests without recreating DB
beforeEach(async () => {
  await testDb.reset();
});

test('second test', () => {
  // Start with empty database
  const projects = service.getAllProjects();
  expect(projects.length).toBe(0);
});
```

---

## Seeding Methods

### `seedStandardData(): TestDataFixtures`

**Purpose:** Quickly seed the database with 3 projects and 3 tasks for testing.

**Returns:**
```typescript
interface TestDataFixtures {
  projects: Project[];  // Array of 3 projects
  tasks: Task[];        // Array of 3 tasks
}
```

**What gets created:**
- 3 projects with different statuses, dates, and budgets
- 3 tasks associated with the projects
- Realistic data ready for immediate testing

**When to use:**
- Most tests - this is your go-to seeding method
- When you need data but don't care about specific values
- Quick setup for integration tests

**What Gets Seeded:**

**3 Projects:**
- **Alpha Project**: in-progress, Development, $100k CAPEX, Q1 2025, PM: Alice Manager
- **Beta Project**: in-progress, Testing, $50k OPEX, Q2 2025, PM: Bob Manager
- **Gamma Project**: done, Deployment, $75k CAPEX, 2024, PM: Carol Manager

**3 Tasks:**
- **Design Phase**: Alpha Project, done, 120 hours, resources: ['Alice', 'Bob']
- **Implementation Phase**: Alpha Project, in-progress, 200 hours, resources: ['Charlie', 'Diana']
- **Testing Phase**: Beta Project, planned, 80 hours, resources: ['Eve']

**Important Notes:**
- **Budget Storage**: Budgets stored as cents. $100,000 = 10,000,000 cents
- **Valid Status Values**: 'planned', 'in-progress', 'blocked', 'done', 'archived'
- **❌ Invalid**: 'active' and 'completed' are NOT valid ProjectStatus values

**Example:**
```typescript
test('should calculate total budget', async () => {
  const fixtures = await testDb.seedStandardData();
  
  // You now have 3 projects ready to use
  expect(fixtures.projects[0].title).toBe('Alpha Project');
  expect(fixtures.projects[0].status).toBe('in-progress');
  expect(fixtures.projects[2].status).toBe('done'); // Gamma is done
  expect(fixtures.projects.length).toBe(3);
  expect(fixtures.tasks.length).toBe(3);
  
  // Budget is stored as cents
  expect(fixtures.projects[0].budget_cents).toBe(10000000); // $100k
  
  const total = service.calculateTotalBudget();
  expect(total).toBeGreaterThan(0);
});
```

---

### `createProjectChain(length: number): Project[]`

**Purpose:** Create a chain of projects with dependencies (A → B → C → D).

**Parameters:**
- `length` - Number of projects to create in the chain

**Returns:** Array of projects, where each depends on the previous

**Use cases:**
- Testing circular dependency detection
- Testing dependency graph algorithms
- Testing cascade operations

**What it creates:**
- Projects named "Chain Project 1", "Chain Project 2", etc.
- All projects have status 'in-progress', budget $10,000
- Dates: 01-01-2025 to 31-12-2025
- Dependencies: FS (Finish-to-Start) with 0 lag days
- Chain structure: P1 → P2 → P3 → ... → Pn

**Example:**
```typescript
test('should detect circular dependencies', async () => {
  // Create chain: P1 → P2 → P3 → P4 → P5
  const chain = await testDb.createProjectChain(5);
  
  expect(chain.length).toBe(5);
  expect(chain[0].title).toBe('Chain Project 1');
  expect(chain[0].status).toBe('in-progress');
  
  // Try to create cycle: P5 → P1 (should fail!)
  const result = dependencyService.createDependency({
    from_type: 'project',
    from_id: chain[4].id,
    to_type: 'project',
    to_id: chain[0].id,
    kind: 'FS'
  });
  
  expect(result.success).toBe(false);
  expect(result.errors).toBeDefined();
  expect(result.errors![0]).toContain('cycle');
  
  // Note: DependencyService automatically detects cycles
  // The error message includes the cycle path for debugging
});
```

**Cycle Detection Details:**

DependencyService automatically performs cycle detection when creating dependencies:

```typescript
// Cycle detection happens automatically in createDependency
interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string[];  // Array of entity IDs forming the cycle
}

// Example: Testing cycle detection
test('should provide cycle path in error', () => {
  const chain = testDb.createProjectChain(3);  // P1 → P2 → P3
  
  const result = dependencyService.createDependency({
    from_type: 'project',
    from_id: chain[2].id,  // P3
    to_type: 'project',
    to_id: chain[0].id     // P1
  });
  
  expect(result.success).toBe(false);
  // Error includes the cycle path for debugging:
  // "Circular dependency detected: P1 → P2 → P3 → P1"
});
```

---

## Transaction Methods

### `beginTransaction(): void`

**Purpose:** Start a database transaction.

**Example:**
```typescript
test('should rollback on error', () => {
  testDb.beginTransaction();
  
  try {
    service.createInvalidProject({...});
  } catch (error) {
    testDb.rollback();
  }
  
  // Verify nothing was saved
  const projects = service.getAllProjects();
  expect(projects.length).toBe(0);
});
```

---

### `commit(): void`

**Purpose:** Commit the current transaction.

**Example:**
```typescript
test('should commit valid changes', () => {
  testDb.beginTransaction();
  
  service.createProject({...});
  
  testDb.commit();
  
  // Verify data was saved
  const projects = service.getAllProjects();
  expect(projects.length).toBe(1);
});
```

---

### `rollback(): void`

**Purpose:** Rollback the current transaction.

**Use cases:**
- Testing error handling
- Ensuring data integrity
- Fast test isolation (rollback after each test)

**Example:**
```typescript
beforeEach(() => {
  testDb.beginTransaction();
});

afterEach(() => {
  testDb.rollback(); // Fast cleanup!
});
```

---

## Performance Monitoring

### `enableQueryCounting(): { getCount: () => number; reset: () => void }`

**Purpose:** Track how many SQL queries are executed.

**Returns:**
- `getCount()` - Returns current query count
- `reset()` - Resets counter to zero

**Use cases:**
- Verify caching is working
- Ensure queries aren't duplicated
- Performance optimization validation

**Example:**
```typescript
test('should use caching efficiently', () => {
  const { getCount, reset } = testDb.enableQueryCounting();
  
  // First call - should query database
  reset();
  service.getAllProjects();
  const firstCallQueries = getCount();
  
  // Second call - should use cache
  reset();
  service.getAllProjects();
  const secondCallQueries = getCount();
  
  expect(secondCallQueries).toBeLessThan(firstCallQueries);
});
```

---

## Helper Functions

### `withTestDatabase(testFn, inMemory)`

**Purpose:** Automatically handles setup and teardown.

**Parameters:**
- `testFn` - Async function that receives the database
- `inMemory` - Boolean, use in-memory mode (default: true)

**Why use this:**
- Less boilerplate code
- Automatic cleanup even if test fails
- Cleaner test structure

**Example:**
```typescript
import { withTestDatabase } from '../../helpers/testDatabase';

test('simple test with auto cleanup', async () => {
  await withTestDatabase(async (db) => {
    const service = new ProjectService(db);
    
    service.createProject({...});
    
    const projects = service.getAllProjects();
    expect(projects.length).toBe(1);
  }, true); // Automatic teardown happens here!
});
```

---

### `withSeededDatabase(testFn, inMemory)`

**Purpose:** Automatically handles setup, seeding, and teardown.

**Parameters:**
- `testFn` - Async function that receives (db, fixtures)
- `inMemory` - Boolean, use in-memory mode (default: true)

**Why use this:**
- Even less boilerplate!
- Data ready immediately
- Perfect for quick integration tests

**Example:**
```typescript
import { withSeededDatabase } from '../../helpers/testDatabase';

test('test with pre-seeded data', async () => {
  await withSeededDatabase(async (db, fixtures) => {
    const service = new ProjectService(db);
    
    // fixtures.projects already has 3 projects!
    expect(fixtures.projects.length).toBe(3);
    
    const active = service.getProjectsByStatus('active');
    expect(active.length).toBeGreaterThan(0);
  }, true); // Automatic seeding + teardown!
});
```

---

## Database Schema Notes

### Date Storage Pattern

The database stores dates in **two formats** for different purposes:

**1. NZ Format (DD-MM-YYYY)** - For display and user input
- Stored in: `start_date_nz`, `end_date_nz` columns
- Format: '01-12-2025' (day-month-year)
- Used for New Zealand date formatting requirements

**2. ISO Format (YYYY-MM-DD)** - For sorting and indexing
- Stored in: `start_date_iso`, `end_date_iso` columns  
- Format: '2025-12-01' (year-month-day)
- Used for database sorting and date comparisons

**When Retrieved:** Query aliases return NZ format as `start_date` and `end_date`

```typescript
// Query example from ProjectService.ts
SELECT start_date_nz as start_date,  // Returns DD-MM-YYYY
       end_date_nz as end_date
FROM projects
```

**For Tests:**
```typescript
const project = fixtures.projects[0];
expect(project.start_date).toBe('01-01-2025');  // NZ format
// ISO dates not exposed in query results by default
```

### Budget Storage as Cents

**All monetary values are stored as INTEGER cents** to avoid floating-point precision issues.

**Conversion:**
- Input: `budget_nzd: '100,000.00'` (string with commas)
- Stored: `budget_cents: 10000000` (integer)
- Formula: dollars × 100 = cents

**Examples:**
- $1.00 = 100 cents
- $100,000.00 = 10,000,000 cents
- $50,000.00 = 5,000,000 cents

**In Tests:**
```typescript
const result = service.createProject({
  budget_nzd: '100,000.00'  // Input as formatted string
});

expect(result.success).toBe(true);
expect(result.project!.budget_cents).toBe(10000000);  // Stored as cents

// When seeding:
const fixtures = await testDb.seedStandardData();
expect(fixtures.projects[0].budget_cents).toBe(10000000); // $100k
expect(fixtures.projects[1].budget_cents).toBe(5000000);  // $50k
expect(fixtures.projects[2].budget_cents).toBe(7500000);  // $75k
```

**Why Cents?**
- Avoids floating-point rounding errors
- Ensures accurate financial calculations
- Standard practice for financial applications

### TaskService assigned_resources Field

**Important:** The `assigned_resources` field is automatically parsed by TaskService.

**Storage:** Arrays are stored as JSON strings in the database (SQLite doesn't support native arrays)

**Retrieval:** TaskService automatically parses the JSON string back to an array

```typescript
// When creating a task:
const result = taskService.createTask({
  project_id: 'PROJ-123',
  title: 'Implementation',
  start_date: '01-01-2025',
  end_date: '31-01-2025',
  status: 'in-progress',
  assigned_resources: ['Alice', 'Bob']  // Input as array
});

// When retrieving:
const task = taskService.getTaskById(taskId);
expect(task.assigned_resources).toEqual(['Alice', 'Bob']);  // Retrieved as array

// You can use array methods directly:
task.assigned_resources.forEach(name => console.log(name));
expect(task.assigned_resources.length).toBe(2);
```

**Note:** If you query tasks directly via raw SQL, you'll need to parse the JSON manually:
```typescript
// Raw query (not recommended):
const raw = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
const resources = JSON.parse(raw.assigned_resources);  // Manual parsing needed

// Recommended: Use TaskService methods instead
const task = taskService.getTaskById(taskId);  // Parsing automatic
```

---

## Service Response Pattern

**CRITICAL**: All service methods that modify data (create, update, delete) return a standard response format:

```typescript
interface ServiceResponse<T> {
  success: boolean;     // true if operation succeeded
  data?: T;            // Only present when success=true (varies by method)
  project?: Project;   // For ProjectService
  task?: Task;         // For TaskService
  errors?: string[];   // Only present when success=false
}
```

### Why This Matters

Services validate all data before database operations. **If validation fails, the response will have `success: false` and no data.**

**❌ DON'T DO THIS:**
```typescript
const result = service.createProject({...});
expect(result.project.id).toBeDefined(); // CRASH if validation failed!
```

**✅ DO THIS:**
```typescript
const result = service.createProject({...});

// Always check success first
if (!result.success) {
  console.error('Validation errors:', result.errors);
  expect(result.errors).toContain('Project title is required');
  return;
}

// Safe to access data now
expect(result.project).toBeDefined();
expect(result.project!.id).toBeDefined();
```

**For tests with valid data:**
```typescript
const result = service.createProject({
  title: 'Valid Project',
  start_date: '01-01-2025',
  end_date: '31-12-2025',
  status: 'planned',
  // ... all required fields
});

// Assert success first
expect(result.success).toBe(true);

// Then check data
expect(result.project).toBeDefined();
expect(result.project!.title).toBe('Valid Project');
```

---

## Audit Logging

### Automatic Audit Logging in Service Methods

**IMPORTANT:** When you use service layer methods (ProjectService, TaskService, DependencyService) to create, update, or delete entities, they automatically log audit events to the `audit_events` table.

#### What Gets Logged

Every service operation logs:
- **type**: 'CREATE', 'UPDATE', 'DELETE'
- **entity_type**: 'project', 'task', 'dependency'
- **entity_id**: The ID of the affected entity
- **action**: Specific action taken (e.g., 'create_project', 'update_task')
- **payload**: JSON with operation details
- **timestamp**: When the operation occurred

#### Example of Audit Event

```typescript
// When you create a project:
const result = projectService.createProject({
  title: 'New Project',
  start_date: '01-01-2025',
  end_date: '31-12-2025',
  status: 'in-progress'
});

// This automatically creates an audit event:
{
  type: 'CREATE',
  entity_type: 'project',
  entity_id: 'PROJ-1234567890-ABC12',
  action: 'create_project',
  payload: JSON.stringify({
    title: 'New Project',
    status: 'in-progress',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    budget_cents: 0
  }),
  timestamp: '2025-12-05T02:15:30.123Z'
}
```

#### Checking Audit Logs in Tests

```typescript
test('should log audit event on project creation', async () => {
  const db = testDb.getDb();
  
  // Create a project
  const result = projectService.createProject({
    title: 'Audited Project',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    status: 'in-progress'
  });
  
  // Check audit log
  const auditEvents = db.prepare(`
    SELECT * FROM audit_events 
    WHERE entity_type = 'project' 
    AND entity_id = ?
  `).all(result.project!.id);
  
  expect(auditEvents).toHaveLength(1);
  expect(auditEvents[0].action).toBe('create_project');
  expect(auditEvents[0].type).toBe('CREATE');
});
```

#### Impact on Tests

**Test Isolation:**
- Audit events are stored in the database
- Each test gets a fresh database (via `setup()`)
- No cross-test pollution of audit logs

**Performance:**
- Audit logging adds minimal overhead (~1-2ms per operation)
- Use in-memory mode (`setup(true)`) for fast tests

**Debugging:**
- Audit logs help debug test failures
- You can see exactly what operations occurred
- Useful for tracking down data issues

#### Querying Audit Logs

```typescript
// Get all audit events for a project
const events = db.prepare(`
  SELECT * FROM audit_events 
  WHERE entity_type = 'project' AND entity_id = ?
  ORDER BY timestamp DESC
`).all(projectId);

// Get all CREATE operations
const creates = db.prepare(`
  SELECT * FROM audit_events WHERE type = 'CREATE'
`).all();

// Get recent operations (last 5 minutes)
const recent = db.prepare(`
  SELECT * FROM audit_events 
  WHERE timestamp > datetime('now', '-5 minutes')
`).all();
```

---

## Complete Examples

### Example 1: Basic CRUD Testing

```typescript
import { TestDatabase } from '../../helpers/testDatabase';
import { ProjectService } from '../../../app/main/services/ProjectService';
import Database from 'better-sqlite3';

describe('ProjectService CRUD', () => {
  let testDb: TestDatabase;
  let db: Database.Database;
  let service: ProjectService;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup(true);
    service = new ProjectService(db);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  test('should create project', () => {
    const result = service.createProject({
      title: 'Test Project',
      description: 'Testing creation',
      lane: 'Development',
      start_date: '01-01-2025',
      end_date: '31-12-2025',
      status: 'planned',  // Valid status
      pm_name: 'John Doe',
      budget_nzd: '100,000.00',
      financial_treatment: 'CAPEX'
    });

    expect(result.success).toBe(true);
    expect(result.project).toBeDefined();
    expect(result.project!.id).toBeDefined();
  });

  test('should retrieve project by ID', () => {
    const created = service.createProject({
      title: 'Test Project',
      start_date: '01-01-2025',
      end_date: '31-12-2025',
      status: 'planned'
    });
    
    expect(created.success).toBe(true);  // Check success
    const retrieved = service.getProjectById(created.project!.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved!.title).toBe('Test Project');
  });

  test('should update project', () => {
    const created = service.createProject({
      title: 'Test Project',
      start_date: '01-01-2025',
      end_date: '31-12-2025',
      status: 'planned'
    });
    
    expect(created.success).toBe(true);
    
    const updated = service.updateProject({
      id: created.project!.id,
      title: 'Updated Title'
    });
    
    expect(updated.success).toBe(true);
    expect(updated.project!.title).toBe('Updated Title');
  });

  test('should delete project', () => {
    const created = service.createProject({
      title: 'Test Project',
      start_date: '01-01-2025',
      end_date: '31-12-2025',
      status: 'planned'
    });
    
    expect(created.success).toBe(true);
    
    const result = service.deleteProject(created.project!.id);
    expect(result.success).toBe(true);
    
    const retrieved = service.getProjectById(created.project!.id);
    expect(retrieved).toBeNull();
  });
});
```

---

### Example 2: Testing with Seeded Data

```typescript
import { TestDatabase } from '../../helpers/testDatabase';
import { ProjectService } from '../../../app/main/services/ProjectService';

describe('ProjectService with seeded data', () => {
  let testDb: TestDatabase;
  let db: Database.Database;
  let service: ProjectService;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup(true);
    service = new ProjectService(db);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

});
```

---

### Example 3: Performance Testing

```typescript
import { TestDatabase } from '../../helpers/testDatabase';
import { ProjectService } from '../../../app/main/services/ProjectService';

describe('ProjectService performance', () => {
  let testDb: TestDatabase;
  let db: Database.Database;
  let service: ProjectService;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup(true);
    service = new ProjectService(db);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  test('should handle 1000 projects efficiently', () => {
    // Create 1000 projects
    for (let i = 0; i < 1000; i++) {
      service.createProject({
        title: `Project ${i}`,
        // ... other fields
      });
    }

    const start = performance.now();
    const projects = service.getAllProjects();
    const duration = performance.now() - start;

    expect(projects.length).toBe(1000);
    expect(duration).toBeLessThan(100); // <100ms
  });
});
```

---

### Example 4: Using Helper Functions

```typescript
import { withSeededDatabase } from '../../helpers/testDatabase';
import { ProjectService } from '../../../app/main/services/ProjectService';

describe('ProjectService with helpers', () => {
  test('should work with seeded data', async () => {
    await withSeededDatabase(async (db, fixtures) => {
      const service = new ProjectService(db);
      
      // Start with 3 projects
      expect(fixtures.projects.length).toBe(3);
      
      const active = service.getProjectsByStatus('active');
      expect(active.length).toBeGreaterThan(0);
    }, true);
  });

  test('should handle custom scenarios', async () => {
    await withTestDatabase(async (db) => {
      const service = new ProjectService(db);
      
      // Create custom data
      service.createProject({...});
      service.createProject({...});
      
      const projects = service.getAllProjects();
      expect(projects.length).toBe(2);
    }, true);
  });
});
```

---

## Best Practices

### ✅ DO

1. **Always use in-memory mode** (unless testing file operations)
   ```typescript
   db = await testDb.setup(true); // Fast!
   ```

2. **Always teardown after tests**
   ```typescript
   afterEach(async () => {
     await testDb.teardown();
   });
   ```

3. **Use seedStandardData() for most tests**
   ```typescript
   const fixtures = testDb.seedStandardData();
   ```

4. **Use helper functions to reduce boilerplate**
   ```typescript
   await withSeededDatabase(async (db, fixtures) => {
     // Your test here
   }, true);
   ```

### ❌ DON'T

1. **Don't forget teardown** - Causes resource leaks
2. **Don't share database instances between tests** - Use beforeEach/afterEach
3. **Don't access private methods** - Use public API only
4. **Don't create thousands of records unnecessarily** - Slows tests down

---

## Troubleshooting

### Error: "Database not initialized"

**Cause:** Called `getDb()` before `setup()`

**Fix:**
```typescript
beforeEach(async () => {
  testDb = new TestDatabase();
  await testDb.setup(true); // ← Must call this first!
});
```

---

### Error: "Database is locked"

**Cause:** Previous test didn't call `teardown()`

**Fix:**
```typescript
afterEach(async () => {
  await testDb.teardown(); // ← Always clean up!
});
```

---

### Error: "Table does not exist"

**Cause:** Database schema wasn't created properly

**Fix:** Ensure `setup()` completed successfully. Check for errors in migrations.

---

### Tests are slow

**Cause:** Using file-based database instead of in-memory

**Fix:**
```typescript
// Change from:
await testDb.setup(false);

// To:
await testDb.setup(true); // Much faster!
```

---

## Summary

The `TestDatabase` class makes database testing:
- ✅ Fast (in-memory mode)
- ✅ Isolated (each test gets fresh database)
- ✅ Easy (helper functions reduce boilerplate)
- ✅ Reliable (automatic cleanup prevents leaks)

**Most common pattern:**
```typescript
describe('My Tests', () => {
  let testDb: TestDatabase;
  let db: Database.Database;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup(true);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  test('my test', () => {
    const fixtures = testDb.seedStandardData();
    // Test your code!
  });
});
```

For more examples, see:
- [BEGINNER_GUIDE.md](BEGINNER_GUIDE.md) - Step-by-step guide
- [PATTERNS.md](PATTERNS.md) - Test patterns
- Actual test files in `tests/` directory
