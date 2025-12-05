# Test Patterns & Best Practices

**Purpose:** Consolidated guide for writing high-quality tests across all test types  
**Last Updated:** December 5, 2025

---

## Table of Contents

- [Core Principles](#core-principles)
- [Database Testing Patterns](#database-testing-patterns)
- [Performance Testing Patterns](#performance-testing-patterns)
- [Security Testing Patterns](#security-testing-patterns)
- [Parameterized Testing](#parameterized-testing)
- [Common Pitfalls](#common-pitfalls)
- [Quick Reference](#quick-reference)

---

## Core Principles

### 1. Test Behavior, Not Structure

**❌ Bad - Tests Structure:**
```typescript
test('should have projects array', () => {
  expect(store.projects).toBeDefined();
  expect(Array.isArray(store.projects)).toBe(true);
});
```

**✅ Good - Tests Behavior:**
```typescript
test('should filter active projects correctly', () => {
  const projects = [
    { id: '1', status: 'active' },
    { id: '2', status: 'completed' },
    { id: '3', status: 'active' }
  ];
  store.setProjects(projects);
  
  const active = store.getActiveProjects();
  
  expect(active).toHaveLength(2);
  expect(active.every(p => p.status === 'active')).toBe(true);
});
```

### 2. Use Real Dependencies

**❌ Bad - Mocking Everything:**
```typescript
test('should calculate health score', () => {
  mockDb.all = jest.fn().mockReturnValue(mockData);
  mockRepo.findAll = jest.fn().mockReturnValue(mockProjects);
  
  const score = service.calculateHealth();
  
  expect(score).toBe(0.75); // Testing mock returns
});
```

**✅ Good - Real Database:**
```typescript
test('should calculate health score from real data', async () => {
  const testDb = new TestDatabase();
  const db = await testDb.setup(true);
  const service = new HealthService(db);
  
  // Create real data via service
  service.createProject({ status: 'active', progress: 0.8, /* ... */ });
  service.createProject({ status: 'active', progress: 0.6, /* ... */ });
  service.createProject({ status: 'on-hold', progress: 0.3, /* ... */ });
  
  const score = await service.calculateHealth();
  
  // Verify actual calculation
  expect(score).toBeCloseTo(0.70, 2);
  
  await testDb.teardown();
});
```

### 3. Test at Production Scale

**❌ Bad - Toy Dataset:**
```typescript
test('should handle projects', () => {
  store.setProjects([project1, project2]);
  expect(store.projects.length).toBe(2);
});
```

**✅ Good - Production Scale:**
```typescript
test('should handle 1000 projects efficiently', () => {
  const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
  
  const startTime = performance.now();
  store.setProjects(projects);
  const result = store.getProjectsByStatus('active');
  const duration = performance.now() - startTime;
  
  expect(result.length).toBeGreaterThan(0);
  expect(duration).toBeLessThan(50); // Performance assertion
});
```

---

## Database Testing Patterns

### Using TestDatabase Helper

```typescript
import { TestDatabase } from '../../helpers/testDatabase';

describe('MyService', () => {
  let testDb: TestDatabase;
  let db: Database.Database;
  let service: MyService;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup(true); // true = in-memory for speed
    service = new MyService(db);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  test('should perform business logic', async () => {
    // Use seedStandardData for quick setup
    const fixtures = testDb.seedStandardData();
    // fixtures.projects contains 3 pre-seeded projects
    
    // Test real logic
    const result = await service.getActiveProjects();
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('title');
  });
  
  test('should work with custom data', async () => {
    // Create data via service methods
    service.createProject({ 
      title: 'Project 1', 
      status: 'active',
      /* other required fields */
    });
    service.createProject({ 
      title: 'Project 2', 
      status: 'completed',
      /* other required fields */
    });
    
    // Test real logic
    const result = await service.getActiveProjects();
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Project 1');
  });
});
```

### Transaction-Based Isolation

```typescript
test('should rollback on error', async () => {
  const testDb = new TestDatabase();
  await testDb.setup();
  
  // Start transaction
  testDb['db'].prepare('BEGIN').run();
  
  try {
    await service.createInvalidProject();
  } catch (error) {
    testDb['db'].prepare('ROLLBACK').run();
  }
  
  // Verify nothing was persisted
  const count = testDb['db'].prepare('SELECT COUNT(*) as count FROM projects').get();
  expect(count.count).toBe(0);
});
```

---

## Performance Testing Patterns

### Measuring Execution Time

```typescript
test('should execute query efficiently', () => {
  const largeDataset = Array.from({ length: 1000 }, generateData);
  store.setData(largeDataset);
  
  // Measure performance
  const startTime = performance.now();
  const result = selector.filterData();
  const duration = performance.now() - startTime;
  
  // Assert correctness AND performance
  expect(result.length).toBeGreaterThan(0);
  expect(duration).toBeLessThan(50); // Target: <50ms
});
```

### Memory Leak Detection

```typescript
test('should not leak memory with repeated operations', () => {
  const initialMemory = (performance as any).memory?.usedJSHeapSize;
  
  // Perform many operations
  for (let i = 0; i < 100; i++) {
    const data = generateLargeDataset(1000);
    store.setData(data);
    selector.processAll();
    store.reset();
  }
  
  const finalMemory = (performance as any).memory?.usedJSHeapSize;
  
  if (initialMemory && finalMemory) {
    const increase = finalMemory - initialMemory;
    expect(increase).toBeLessThan(50 * 1024 * 1024); // <50MB
  }
  
  // At minimum, verify cleanup
  expect(store.getData().length).toBe(0);
});
```

### Memoization Verification

```typescript
test('selector should memoize results', () => {
  store.setProjects(projects);
  
  const result1 = selector.getProjects();
  const result2 = selector.getProjects();
  
  // Should be exact same reference (memoized)
  expect(result1).toBe(result2);
});

test('selector should recompute on state change', () => {
  store.setProjects(projects);
  const result1 = selector.getActiveProjects();
  
  // Change state
  store.addProject(newProject);
  const result2 = selector.getActiveProjects();
  
  // Should be different (recomputed)
  expect(result2).not.toBe(result1);
  expect(result2.length).toBe(result1.length + 1);
});
```

### Concurrent Operations

```typescript
test('should handle concurrent operations safely', async () => {
  const data = Array.from({ length: 1000 }, generateData);
  store.setData(data);
  
  // Simulate 50 concurrent operations
  const operations = Array(50).fill(0).map((_, i) =>
    Promise.resolve(selector.getById(i % 1000))
  );
  
  const results = await Promise.all(operations);
  
  // All should complete successfully
  results.forEach(result => {
    expect(result).toBeDefined();
  });
});
```

---

## Security Testing Patterns

### Testing Actual Encryption

```typescript
test('should actually encrypt tokens', async () => {
  const plainToken = 'SECRET-TOKEN-VALUE';
  
  await tokenManager.store(plainToken);
  
  // Read raw database value
  const rawValue = db.prepare('SELECT token FROM config').get();
  
  // Verify it's actually encrypted
  expect(rawValue.token).not.toBe(plainToken);
  expect(rawValue.token).not.toContain(plainToken);
  
  // Verify it's JSON with encryption fields
  const encrypted = JSON.parse(rawValue.token);
  expect(encrypted).toHaveProperty('data');
  expect(encrypted).toHaveProperty('iv');
  expect(encrypted).toHaveProperty('tag');
});
```

### Token Exposure Prevention

```typescript
test('should never expose plain tokens', async () => {
  const secretToken = 'SUPER-SECRET-TOKEN';
  
  await tokenManager.store(secretToken);
  
  // Get config (should be masked)
  const config = await tokenManager.getConfig();
  const serialized = JSON.stringify(config);
  
  // Plain token should NEVER appear anywhere
  expect(serialized).not.toContain(secretToken);
  expect(config.token).toBe('[ENCRYPTED]');
});
```

### Cryptographic Strength

```typescript
test('generated secrets should have sufficient entropy', () => {
  const secrets = Array(100).fill(0).map(() =>
    cryptoService.generateSecret()
  );
  
  // All unique
  const uniqueSecrets = new Set(secrets);
  expect(uniqueSecrets.size).toBe(100);
  
  // Calculate Shannon entropy
  const sampleSecret = secrets[0];
  const entropy = calculateShannonEntropy(sampleSecret);
  
  // High entropy (>4.5 bits per character)
  expect(entropy).toBeGreaterThan(4.5);
});
```

### Race Condition Testing

```typescript
test('concurrent writes to same config should maintain consistency', async () => {
  const config = { id: '1', value: 'initial' };
  await store.create(config);
  
  // Attempt 20 concurrent updates
  const updates = Array(20).fill(0).map((_, i) =>
    store.update('1', { value: `update-${i}` })
  );
  
  await Promise.all(updates);
  
  // Config should still exist and be valid
  const final = await store.get('1');
  expect(final).toBeDefined();
  expect(final.value).toMatch(/^update-\d+$/);
});
```

---

## Parameterized Testing

### Using test.each()

```typescript
describe('Validation', () => {
  test.each([
    { input: '', expected: 'Title is required' },
    { input: 'a'.repeat(201), expected: 'Title too long' },
    { input: '  whitespace  ', expected: null }, // Valid after trim
  ])('should validate title: "$input"', ({ input, expected }) => {
    const result = validator.validateTitle(input);
    
    if (expected) {
      expect(result.error).toBe(expected);
    } else {
      expect(result.error).toBeNull();
    }
  });
});
```

### Complex Parameterized Tests

```typescript
describe('Date Validation', () => {
  test.each([
    { date: '2024-02-29', valid: true, desc: 'leap year' },
    { date: '2023-02-29', valid: false, desc: 'non-leap year' },
    { date: '2024-13-01', valid: false, desc: 'invalid month' },
    { date: '2024-01-32', valid: false, desc: 'invalid day' },
    { date: '2024-01-01', valid: true, desc: 'valid date' },
  ])('should validate $desc: $date', ({ date, valid }) => {
    const result = validator.validateDate(date);
    expect(result.isValid).toBe(valid);
  });
});
```

---

## Common Pitfalls

### ❌ Pitfall 1: Testing Mock Returns

```typescript
// BAD: Just verifies mock was called
test('should get projects', () => {
  mockDb.all = jest.fn().mockReturnValue([mockProject]);
  service.getAll();
  expect(mockDb.all).toHaveBeenCalled(); // Meaningless
});
```

**Fix:** Test actual behavior with real data.

### ❌ Pitfall 2: Ignoring Performance

```typescript
// BAD: No performance consideration
test('should filter projects', () => {
  const result = service.filter(criteria);
  expect(result.length).toBe(5);
});
```

**Fix:** Add performance assertions for critical paths.

### ❌ Pitfall 3: Not Testing Edge Cases

```typescript
// BAD: Only happy path
test('should calculate total', () => {
  const total = service.calculate([10, 20, 30]);
  expect(total).toBe(60);
});
```

**Fix:** Test boundary values (0, negative, MAX_VALUE, empty array).

### ❌ Pitfall 4: Brittle Assertions

```typescript
// BAD: Depends on exact error message
test('should throw error', () => {
  expect(() => service.doSomething()).toThrow('Error: Something went wrong at line 42');
});
```

**Fix:** Test error type or use `.toThrow()` without exact message.

### ❌ Pitfall 5: Not Cleaning Up

```typescript
// BAD: Leaves test data
test('should create project', async () => {
  await service.create(project);
  expect(service.getAll()).toHaveLength(1);
});
// Next test will have leftover data!
```

**Fix:** Always use `afterEach()` to clean up.

---

## Quick Reference

### Test Database Setup

```typescript
beforeEach(async () => {
  testDb = new TestDatabase();
  db = await testDb.setup(true); // in-memory
});

afterEach(async () => {
  await testDb.teardown();
});
```

### Performance Test Template

```typescript
test('should be fast with large dataset', () => {
  const data = Array.from({ length: 1000 }, generateData);
  
  const startTime = performance.now();
  const result = operation(data);
  const duration = performance.now() - startTime;
  
  expect(result).toBeDefined();
  expect(duration).toBeLessThan(TARGET_MS);
});
```

### Security Test Template

```typescript
test('should not expose sensitive data', async () => {
  const secret = 'SENSITIVE';
  await store(secret);
  
  const retrieved = await getConfig();
  const serialized = JSON.stringify(retrieved);
  
  expect(serialized).not.toContain(secret);
});
```

### Parameterized Test Template

```typescript
test.each([
  { input: value1, expected: result1 },
  { input: value2, expected: result2 },
])('should handle $input', ({ input, expected }) => {
  const result = process(input);
  expect(result).toBe(expected);
});
```

---

## Summary

**Key Takeaways:**

1. ✅ Test behavior, not structure
2. ✅ Use real dependencies, minimize mocks
3. ✅ Test at production scale (1000+ items)
4. ✅ Always verify security, never mock encryption
5. ✅ Add performance assertions for critical paths
6. ✅ Test edge cases and boundary values
7. ✅ Use parameterized tests to reduce duplication
8. ✅ Always clean up after tests

**For More Details:**

- Database patterns: [PHASE1.md](PHASE1.md)
- Security patterns: [PHASE2_AND_PHASE3.md](PHASE2_AND_PHASE3.md)
- Performance patterns: [PHASE2_AND_PHASE3.md](PHASE2_AND_PHASE3.md)
- Test examples: Check actual test files in `tests/` directory
