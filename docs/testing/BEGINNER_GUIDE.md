# Beginner's Guide to Testing

**Purpose:** Step-by-step guide for junior developers new to the test suite  
**Last Updated:** December 5, 2025  
**Difficulty:** Beginner-friendly with detailed explanations

---

## Table of Contents

- [Getting Started](#getting-started)
- [Understanding the Test Structure](#understanding-the-test-structure)
- [Your First Test](#your-first-test)
- [Database Testing Step-by-Step](#database-testing-step-by-step)
- [Performance Testing Step-by-Step](#performance-testing-step-by-step)
- [Security Testing Step-by-Step](#security-testing-step-by-step)
- [Common Mistakes and Solutions](#common-mistakes-and-solutions)
- [Debugging Tests](#debugging-tests)

---

## Getting Started

### Quick Reference Documents

Before diving in, know that you have these resources:
- **BEGINNER_GUIDE.md** (this file) - Learn testing step-by-step
- **TEST_DATABASE_API.md** - Complete TestDatabase reference
- **VALIDATION_RULES.md** - All validation rules and error messages
- **PATTERNS.md** - Advanced testing patterns

### Prerequisites

Before writing tests, make sure you have:

```bash
# 1. Install dependencies
npm install

# 2. Verify tests run
npm test

# You should see: Tests: XXX passed, XXX total
```

### Available Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:security        # Security tests only
npm run test:integration     # Integration tests only
npm run test:performance     # Performance tests only

# Run comprehensive test suites
npm run test:all             # All tests with coverage
npm run test:ci              # CI pipeline tests
npm run test:full            # Complete test suite

# Run a specific test file
npm test -- MyService.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should create"
```

### What You Need to Know

**Required knowledge:**
- ✅ Basic TypeScript/JavaScript
- ✅ What a function does
- ✅ How to read error messages

**You DON'T need to know:**
- ❌ Advanced testing patterns (we'll teach you!)
- ❌ How Jest works internally
- ❌ Database internals

---

## Understanding the Test Structure

### Where Are Tests Located?

```
tests/
├── unit/                          # Tests for individual functions/classes
│   ├── governance/                # Governance-related services
│   ├── services/                  # Business logic services
│   └── ...
├── integration/                   # Tests for multiple components working together
│   └── stores/                    # State management tests
├── security/                      # Security-specific tests
│   └── TokenManager.enhanced.test.ts
└── helpers/                       # Utilities for writing tests
    └── testDatabase.ts            # Database helper (VERY IMPORTANT!)
```

### Test File Naming

- **Unit tests:** `ServiceName.test.ts` or `ServiceName.enhanced.test.ts`
- **Integration tests:** `ComponentName.test.ts` or `ComponentName.performance.test.ts`
- **Location matters:** Unit tests go in `tests/unit/`, integration in `tests/integration/`

---

## Your First Test

### Step 1: Create a Test File

Let's create a simple test for a calculator function.

**File:** `tests/unit/calculator.test.ts`

```typescript
// Import the testing library
import { describe, test, expect } from '@jest/globals';

// Import the thing you're testing
// (We'll create this calculator next)
import { add } from '../../app/utils/calculator';

// describe() groups related tests together
describe('Calculator', () => {
  
  // test() is a single test case
  test('should add two numbers correctly', () => {
    // Arrange: Set up your test data
    const num1 = 5;
    const num2 = 3;
    
    // Act: Call the function you're testing
    const result = add(num1, num2);
    
    // Assert: Check if the result is what you expect
    expect(result).toBe(8);
  });
});
```

### Step 2: Understand the Three Parts

Every test has three parts (AAA pattern):

1. **Arrange** - Set up test data
2. **Act** - Call the function
3. **Assert** - Verify the result

### Step 3: Run Your Test

```bash
# Run just this one test file
npm test -- calculator.test.ts

# You should see:
# ✓ Calculator › should add two numbers correctly
```

---

## Database Testing Step-by-Step

### Why Database Testing Is Different

Most tests use **mocks** (fake data). We use **real databases**. Why?

- ✅ Catches real bugs that mocks miss
- ✅ Tests actual SQL queries work
- ✅ Verifies data is saved correctly

### Step 1: Understanding TestDatabase

The `TestDatabase` helper creates a temporary database for your test.

**Think of it like this:**
- 🏗️ `setup()` - Build a new empty house
- 📦 `seedStandardData()` - Put furniture in the house
- 🗑️ `teardown()` - Demolish the house when done

### Understanding Service Responses

**IMPORTANT:** All service methods that create, update, or delete data return a response object with a `success` flag.

```typescript
// Service response pattern
interface ServiceResponse {
  success: boolean;     // true if operation succeeded
  project?: Project;    // Only present if success is true
  errors?: string[];    // Only present if success is false
}
```

**Always check success before accessing data:**

```typescript
const result = service.createProject({...});

if (!result.success) {
  // Handle validation errors
  console.error('Failed to create project:', result.errors);
  return;
}

// Safe to access result.project now
const project = result.project!;
expect(project.id).toBeDefined();
```

### Step 2: Basic Database Test Template

```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabase } from '../../helpers/testDatabase';
import Database from 'better-sqlite3';
import { ProjectService } from '../../../app/main/services/ProjectService';

describe('ProjectService - Database Tests', () => {
  // Declare variables
  let testDb: TestDatabase;
  let db: Database.Database;
  let service: ProjectService;

  // beforeEach runs BEFORE each test
  beforeEach(async () => {
    // Step 1: Create a new test database
    testDb = new TestDatabase();
    
    // Step 2: Set it up (true = in-memory for speed)
    db = await testDb.setup(true);
    
    // Step 3: Create your service with the test database
    service = new ProjectService(db);
  });

  // afterEach runs AFTER each test
  afterEach(async () => {
    // Step 4: Clean up (VERY IMPORTANT!)
    await testDb.teardown();
  });

  // Now write your actual test
  test('should create a project', () => {
    // Arrange: Prepare project data
    const projectData = {
      title: 'My First Project',
      description: 'Testing project creation',
      lane: 'Development',
      start_date: '01-01-2025',
      end_date: '31-12-2025',
      status: 'in-progress',  // Valid: planned, in-progress, blocked, done, archived
      pm_name: 'John Doe',
      budget_nzd: '100,000.00',
      financial_treatment: 'CAPEX'
    };
    
    // Act: Create the project
    const result = service.createProject(projectData);
    
    // Assert: Check it worked
    expect(result.success).toBe(true);  // Always check success first!
    expect(result.project).toBeDefined();
    expect(result.project!.title).toBe('My First Project');  // Use ! after checking success
    
    // Extra check: Verify it's actually in the database
    const projects = service.getAllProjects();
    expect(projects.length).toBe(1);
  });
});
```

### Step 3: Understanding setup(true) vs setup(false)

```typescript
// FAST - Use for most tests
db = await testDb.setup(true);  // In-memory database (RAM)

// SLOW - Use when you need real file behavior
db = await testDb.setup(false); // File database (disk)
```

**Rule of thumb:** Always use `setup(true)` unless testing file-specific behavior.

### Step 4: Seeding Test Data

Instead of creating data manually, use the seeding helper:

**Option 1: Use seedStandardData() - Quick and Easy**
```typescript
test('should work with pre-seeded data', () => {
  // Seeds 3 projects and 3 tasks automatically
  const fixtures = testDb.seedStandardData();
  
  // Access the seeded data
  console.log(fixtures.projects); // Array of 3 projects
  console.log(fixtures.tasks);    // Array of 3 tasks
  
  // Now test with real data
  const projects = service.getAllProjects();
  expect(projects.length).toBe(3);
});
```

**Option 2: Create Data via Service Methods**
```typescript
test('should calculate total budget', () => {
  // Create projects using the service
  service.createProject({
    title: 'Project A',
    budget_nzd: '50,000.00',
    status: 'active',
    lane: 'Development',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    pm_name: 'John',
    financial_treatment: 'CAPEX'
  });
  
  service.createProject({
    title: 'Project B',
    budget_nzd: '30,000.00',
    status: 'active',
    lane: 'Development',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    pm_name: 'Jane',
    financial_treatment: 'OPEX'
  });
  
  // Now test your calculation
  const projects = service.getAllProjects();
  expect(projects.length).toBe(2);
});
```

**Option 3: Helper Functions for Advanced Usage**
```typescript
import { withSeededDatabase } from '../../helpers/testDatabase';

// Automatically handles setup, seeding, and teardown!
test('should filter active projects', async () => {
  await withSeededDatabase(async (db, fixtures) => {
    const service = new ProjectService(db);
    const active = service.getProjectsByStatus('active');
    
    expect(active.length).toBeGreaterThan(0);
  }, true); // true = in-memory
});
```

### Step 5: TestDatabase Helper Functions Reference

The `TestDatabase` class has several useful methods:

**Basic Methods:**
```typescript
// Create and initialize database
const db = await testDb.setup(true);  // true = in-memory (fast)

// Get current database instance
const db = testDb.getDb();

// Clear all data but keep structure
await testDb.reset();

// Close and delete database
await testDb.teardown();
```

**Seeding Methods:**
```typescript
// Seed 3 projects and 3 tasks (most common)
const fixtures = testDb.seedStandardData();
// Returns: { projects: Project[], tasks: Task[] }

// Create a chain of projects with dependencies
// Useful for testing circular dependencies
const chain = testDb.createProjectChain(5);
// Creates: P1 -> P2 -> P3 -> P4 -> P5
```

**Transaction Methods:**
```typescript
// Start a transaction
testDb.beginTransaction();

// Roll back changes
testDb.rollback();

// Commit changes
testDb.commit();
```

**Performance Monitoring:**
```typescript
// Enable query counting
const { getCount, reset } = testDb.enableQueryCounting();

// Run some operations
service.getAllProjects();

// Check how many queries ran
const count = getCount();
expect(count).toBeLessThan(10); // Ensure efficiency

// Reset the counter
reset();
```

**Advanced Helper Functions:**
```typescript
import { 
  withTestDatabase, 
  withSeededDatabase 
} from '../../helpers/testDatabase';

// Automatically handles setup and teardown
test('using withTestDatabase', async () => {
  await withTestDatabase(async (db) => {
    const service = new ProjectService(db);
    // Test your code
  }, true); // Automatic cleanup!
});

// With automatic seeding
test('using withSeededDatabase', async () => {
  await withSeededDatabase(async (db, fixtures) => {
    const service = new ProjectService(db);
    // fixtures.projects has 3 projects ready!
    expect(fixtures.projects.length).toBe(3);
  }, true);
});
```

### Step 6: Common Database Test Patterns

**Pattern 1: Test Creation**
```typescript
test('should create new record', () => {
  const result = service.create(data);
  expect(result.success).toBe(true);
  
  // Verify it exists
  const all = service.getAll();
  expect(all.length).toBe(1);
});
```

**Pattern 2: Test Retrieval**
```typescript
test('should retrieve by ID', () => {
  const created = service.create(data);
  const retrieved = service.getById(created.id);
  
  expect(retrieved).toBeDefined();
  expect(retrieved.title).toBe(data.title);
});
```

**Pattern 3: Test Update**
```typescript
test('should update existing record', () => {
  const created = service.create(data);
  
  const updated = service.update(created.id, { 
    title: 'Updated Title' 
  });
  
  expect(updated.title).toBe('Updated Title');
});
```

**Pattern 4: Test Delete**
```typescript
test('should delete record', () => {
  const created = service.create(data);
  
  service.delete(created.id);
  
  const all = service.getAll();
  expect(all.length).toBe(0);
});
```

---

## Performance Testing Step-by-Step

### Why Performance Testing?

Imagine your app works fine with 10 projects, but a user has 1,000 projects and it becomes slow. Performance tests catch this BEFORE users complain!

### Step 1: Basic Performance Test

```typescript
test('should handle 1000 projects efficiently', () => {
  // Step 1: Generate lots of data
  const projects = [];
  for (let i = 0; i < 1000; i++) {
    projects.push(generateProject(i));
  }
  
  // Step 2: Start timing
  const startTime = performance.now();
  
  // Step 3: Do the operation you're testing
  store.setProjects(projects);
  const result = store.getActiveProjects();
  
  // Step 4: Stop timing
  const duration = performance.now() - startTime;
  
  // Step 5: Assert it's fast enough
  expect(result.length).toBeGreaterThan(0); // Works correctly
  expect(duration).toBeLessThan(100); // AND is fast (<100ms)
});
```

### Step 2: Understanding performance.now()

```typescript
// performance.now() returns milliseconds

const start = performance.now();  // e.g., 12345.678
// ... do something ...
const end = performance.now();    // e.g., 12395.234

const duration = end - start;     // 49.556 ms
```

**What's fast enough?**
- <1ms: Instant (perfect!)
- <50ms: Very fast (great!)
- <100ms: Fast (good)
- <500ms: Acceptable
- \>1000ms: Too slow (needs optimization)

### Step 3: Helper Function for Generating Test Data

```typescript
// Put this at the top of your test file
function generateProject(id: number): Project {
  return {
    id: `PROJ-${String(id).padStart(4, '0')}`, // PROJ-0001, PROJ-0002, etc.
    title: `Project ${id}`,
    description: `Test project number ${id}`,
    lane: 'Development',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    status: 'active',
    pm_name: 'Test Manager',
    budget_cents: 1000000, // $10,000
    financial_treatment: 'CAPEX',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Now you can easily create lots of test data:
const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
```

### Step 4: Testing Different Dataset Sizes

```typescript
describe('Performance at different scales', () => {
  test('should handle 100 projects', () => {
    const projects = Array.from({ length: 100 }, (_, i) => generateProject(i));
    const start = performance.now();
    
    store.setProjects(projects);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
  
  test('should handle 1000 projects', () => {
    const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
    const start = performance.now();
    
    store.setProjects(projects);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
  
  test('should handle 5000 projects', () => {
    const projects = Array.from({ length: 5000 }, (_, i) => generateProject(i));
    const start = performance.now();
    
    store.setProjects(projects);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(200);
  });
});
```

---

## Security Testing Step-by-Step

### Why Security Testing?

Security tests verify that:
- 🔒 Sensitive data (like passwords/tokens) is encrypted
- 👁️ Secrets are never displayed in logs/errors
- 🚫 Hackers can't access plain text data

### Step 1: Testing Encryption

```typescript
test('should encrypt tokens (not store in plain text)', async () => {
  // Step 1: Store a sensitive token
  const plainToken = 'MY-SUPER-SECRET-TOKEN-123';
  await tokenManager.store(plainToken);
  
  // Step 2: Read the RAW database value (what's actually saved)
  const rawValue = db.prepare('SELECT token FROM config').get();
  
  // Step 3: Verify it's NOT plain text
  expect(rawValue.token).not.toBe(plainToken);        // Not exactly the same
  expect(rawValue.token).not.toContain(plainToken);   // Not even part of it
  
  // Step 4: Verify it IS encrypted (should be JSON with crypto fields)
  const encrypted = JSON.parse(rawValue.token);
  expect(encrypted).toHaveProperty('data');  // Encrypted data
  expect(encrypted).toHaveProperty('iv');    // Initialization vector
  expect(encrypted).toHaveProperty('tag');   // Authentication tag
});
```

### Step 2: Testing Decryption

```typescript
test('should decrypt back to original value', async () => {
  // Step 1: Store the token
  const originalToken = 'MY-SECRET-TOKEN';
  await tokenManager.store(originalToken);
  
  // Step 2: Retrieve it
  const retrievedToken = await tokenManager.retrieve();
  
  // Step 3: Should match the original
  expect(retrievedToken).toBe(originalToken);
});
```

### Step 3: Testing Token Exposure Prevention

This is CRITICAL! Tokens should NEVER appear in:
- Error messages
- Logs
- JSON responses (should be masked)

```typescript
test('should never expose tokens in responses', async () => {
  const secretToken = 'SUPER-SECRET-TOKEN';
  await tokenManager.store(secretToken);
  
  // Get the configuration
  const config = await tokenManager.getConfig();
  
  // Convert to JSON (like sending over network)
  const json = JSON.stringify(config);
  
  // The secret should NEVER appear in the JSON
  expect(json).not.toContain(secretToken);
  
  // Instead, it should be masked
  expect(config.token).toBe('[ENCRYPTED]');
});
```

### Step 4: Testing Race Conditions

**What's a race condition?**  
When two operations happen at the same time and interfere with each other.

**Example:** Two people clicking "Save" at the exact same time.

```typescript
test('should handle concurrent updates safely', async () => {
  // Create initial config
  await tokenManager.create({ id: '1', value: 'initial' });
  
  // Simulate 10 people clicking "Save" at once
  const updates = [];
  for (let i = 0; i < 10; i++) {
    updates.push(
      tokenManager.update('1', { value: `update-${i}` })
    );
  }
  
  // Wait for all to complete
  await Promise.all(updates);
  
  // Verify the config still exists and is valid
  const final = await tokenManager.get('1');
  expect(final).toBeDefined();
  expect(final.value).toMatch(/^update-\d+$/); // Should be one of the updates
});
```

---

## Common Mistakes and Solutions

### Mistake 1: Forgetting teardown()

```typescript
// ❌ BAD: Database not cleaned up
afterEach(() => {
  // Forgot to call teardown!
});

// ✅ GOOD: Always clean up
afterEach(async () => {
  await testDb.teardown();
});
```

**What happens if you forget?**  
Tests will interfere with each other, causing random failures.

### Mistake 2: Not Using async/await

```typescript
// ❌ BAD: Not waiting for async operations
test('should create project', () => {
  testDb.setup(true); // Missing await!
  // ... rest of test
});

// ✅ GOOD: Always await
test('should create project', async () => {
  await testDb.setup(true);
  // ... rest of test
});
```

### Mistake 3: Testing Implementation Instead of Behavior

```typescript
// ❌ BAD: Testing structure (meaningless)
test('should have projects array', () => {
  expect(store.projects).toBeDefined();
  expect(Array.isArray(store.projects)).toBe(true);
});

// ✅ GOOD: Testing behavior (useful!)
test('should filter projects by status', () => {
  store.setProjects([
    { id: '1', status: 'active' },
    { id: '2', status: 'completed' }
  ]);
  
  const active = store.getActiveProjects();
  
  expect(active.length).toBe(1);
  expect(active[0].status).toBe('active');
});
```

### Mistake 4: Unclear Test Names

```typescript
// ❌ BAD: Vague test name
test('it works', () => { ... });

// ❌ BAD: Too technical
test('getProjectsByStatus returns filtered array', () => { ... });

// ✅ GOOD: Clear and descriptive
test('should return only active projects when filtering by active status', () => { ... });
```

---

## Debugging Tests

### When a Test Fails

**Step 1: Read the error message**

```
Expected: 5
Received: 3

  45 |   const result = service.getActiveProjects();
  46 | 
> 47 |   expect(result.length).toBe(5);
     |                         ^
  48 | })
```

This tells you:
- **Line 47** is where it failed
- **Expected 5** but got **3**
- The problem is with `result.length`

**Step 2: Add console.log() to investigate**

```typescript
test('should return active projects', () => {
  const fixtures = testDb.seedStandardData();
  const result = service.getActiveProjects();
  
  // Add this to see what you got
  console.log('Projects created:', fixtures.projects.length);
  console.log('Active projects found:', result.length);
  console.log('Active projects:', result);
  
  expect(result.length).toBe(3); // seedStandardData creates 3 projects
});
```

**Step 3: Run just that one test**

```bash
# Run specific test file
npm test -- ProjectService.test.ts

# Run specific test by name
npm test -- --testNamePattern="should return active projects"
```

### Common Error Messages

**Error: Database not initialized**
```
Solution: Make sure you called `await testDb.setup()` in beforeEach
```

**Error: Table doesn't exist**
```
Solution: The database schema wasn't created. Check that setup() completed.
```

**Error: Test timeout (Jest)**
```
Solution: You forgot to add `async` to your test function, or missing `await`
```

**Error: Cannot read property of undefined**
```
Solution: The data you expected doesn't exist. Add console.log() to check.
```

---

## Next Steps

Now that you understand the basics:

1. **Read actual test examples:**
   - `tests/unit/services/ValidationTests.consolidated.test.ts` - Simple validation tests
   - `tests/integration/stores/projectStore.performance.test.ts` - Performance tests
   - `tests/security/TokenManager.enhanced.test.ts` - Security tests

2. **Try modifying an existing test:**
   - Change the test data
   - Add an extra assertion
   - Run it and see if it still passes

3. **Write a new test:**
   - Pick a simple function
   - Follow the AAA pattern (Arrange, Act, Assert)
   - Run it!

4. **Read more documentation:**
   - [PATTERNS.md](PATTERNS.md) - More advanced patterns
   - [PHASE1.md](PHASE1.md) - Database testing details
   - [PHASE2_AND_PHASE3.md](PHASE2_AND_PHASE3.md) - Security and performance

---

## Quick Reference Card

### Test Structure
```typescript
describe('What you're testing', () => {
  beforeEach(async () => { /* Setup */ });
  afterEach(async () => { /* Cleanup */ });
  
  test('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Database Testing
```typescript
let testDb: TestDatabase;
let db: Database.Database;

beforeEach(async () => {
  testDb = new TestDatabase();
  db = await testDb.setup(true);
});

afterEach(async () => {
  await testDb.teardown();
});
```

### Performance Testing
```typescript
const start = performance.now();
// ... operation ...
const duration = performance.now() - start;
expect(duration).toBeLessThan(TARGET_MS);
```

### Common Assertions
```typescript
expect(value).toBe(5);                    // Exact match
expect(value).toEqual({ a: 1, b: 2 });    // Deep equality
expect(value).toBeDefined();              // Not undefined
expect(value).toBeNull();                 // Is null
expect(value).toBeGreaterThan(10);        // Number comparison
expect(array).toHaveLength(5);            // Array length
expect(string).toContain('text');         // Substring
expect(value).toMatch(/regex/);           // Regex match
expect(fn).toThrow();                     // Function throws error
```

---

**Remember:** Everyone starts as a beginner. Don't be afraid to ask questions or look at examples! 🚀
