import Database from 'better-sqlite3';
import { openDB } from '../../app/main/db';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Test Database Helper
 * 
 * Provides utilities for test database lifecycle management:
 * - Isolated test databases (one per test or test suite)
 * - Automatic cleanup and teardown
 * - Data seeding for common scenarios
 * - Transaction-based test isolation
 */
export class TestDatabase {
  private db: Database.Database | null = null;
  private dbPath: string | null = null;
  private inTransaction: boolean = false;

  /**
   * Set up a new test database
   * @param inMemory - Use in-memory database (faster) or temp file (more realistic)
   * @returns Database instance
   */
  async setup(inMemory: boolean = true): Promise<Database.Database> {
    if (this.db) {
      throw new Error('Database already initialized. Call teardown() first.');
    }

    if (inMemory) {
      // In-memory database for speed
      this.dbPath = ':memory:';
    } else {
      // Temp file for more realistic testing
      const tempDir = os.tmpdir();
      this.dbPath = path.join(tempDir, `test-db-${Date.now()}-${Math.random().toString(36).substring(7)}.db`);
    }

    this.db = openDB(this.dbPath);
    return this.db;
  }

  /**
   * Get the current database instance
   */
  getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call setup() first.');
    }
    return this.db;
  }

  /**
   * Begin a transaction for test isolation
   * Call rollback() after each test to reset state
   */
  beginTransaction(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    if (this.inTransaction) {
      throw new Error('Already in transaction');
    }
    this.db.exec('BEGIN TRANSACTION');
    this.inTransaction = true;
  }

  /**
   * Rollback transaction to reset database state
   * Useful for test isolation without recreating the database
   */
  rollback(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    if (this.inTransaction) {
      this.db.exec('ROLLBACK');
      this.inTransaction = false;
    }
  }

  /**
   * Commit transaction (rarely needed in tests)
   */
  commit(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    if (this.inTransaction) {
      this.db.exec('COMMIT');
      this.inTransaction = false;
    }
  }

  /**
   * Clear all data from tables
   * Useful for resetting between tests without recreating database
   */
  async reset(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Disable foreign key constraints temporarily
    this.db.exec('PRAGMA foreign_keys = OFF');

    // Get all table names
    const tables = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>;

    // Delete all data from each table
    for (const table of tables) {
      this.db.exec(`DELETE FROM ${table.name}`);
    }

    // Re-enable foreign key constraints
    this.db.exec('PRAGMA foreign_keys = ON');
  }

  /**
   * Tear down and clean up database
   */
  async teardown(): Promise<void> {
    if (this.db) {
      // Rollback any pending transaction
      if (this.inTransaction) {
        this.rollback();
      }
      
      this.db.close();
      this.db = null;
    }

    // Clean up temp file if not in-memory
    if (this.dbPath && this.dbPath !== ':memory:') {
      try {
        if (fs.existsSync(this.dbPath)) {
          fs.unlinkSync(this.dbPath);
        }
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Failed to clean up test database: ${error}`);
      }
    }

    this.dbPath = null;
  }

  /**
   * Seed database with standard test data
   */
  async seedStandardData(): Promise<TestDataFixtures> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const fixtures: TestDataFixtures = {
      projects: [],
      tasks: [],
      dependencies: [],
      gates: [],
      policies: []
    };

    // Seed projects
    fixtures.projects = this.seedProjects([
      {
        title: 'Alpha Project',
        description: 'First test project',
        lane: 'Development',
        start_date: '01-01-2025',
        end_date: '31-03-2025',
        status: 'in-progress',
        pm_name: 'Alice Manager',
        budget_nzd: '100,000.00',
        financial_treatment: 'CAPEX'
      },
      {
        title: 'Beta Project',
        description: 'Second test project',
        lane: 'Testing',
        start_date: '01-04-2025',
        end_date: '30-06-2025',
        status: 'in-progress',
        pm_name: 'Bob Manager',
        budget_nzd: '50,000.00',
        financial_treatment: 'OPEX'
      },
      {
        title: 'Gamma Project',
        description: 'Completed project',
        lane: 'Deployment',
        start_date: '01-01-2024',
        end_date: '31-12-2024',
        status: 'done',
        pm_name: 'Carol Manager',
        budget_nzd: '75,000.00',
        financial_treatment: 'CAPEX'
      }
    ]);

    // Seed tasks for first project
    fixtures.tasks = this.seedTasks([
      {
        project_id: fixtures.projects[0].id,
        title: 'Design Phase',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'done',
        effort_hours: 120,
        assigned_resources: ['Alice', 'Bob']
      },
      {
        project_id: fixtures.projects[0].id,
        title: 'Implementation Phase',
        start_date: '01-02-2025',
        end_date: '28-02-2025',
        status: 'in-progress',
        effort_hours: 200,
        assigned_resources: ['Charlie', 'Diana']
      },
      {
        project_id: fixtures.projects[1].id,
        title: 'Testing Phase',
        start_date: '01-04-2025',
        end_date: '30-04-2025',
        status: 'planned',
        effort_hours: 80,
        assigned_resources: ['Eve']
      }
    ]);

    return fixtures;
  }

  /**
   * Seed projects into database
   */
  private seedProjects(projectsData: Array<any>): Array<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const projects: Array<any> = [];
    const insertStmt = this.db.prepare(`
      INSERT INTO projects (
        id, title, description, lane, start_date, end_date, start_date_iso, end_date_iso,
        status, pm_name, budget_cents, financial_treatment, row, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    projectsData.forEach((data, index) => {
      const id = `PROJ-${Date.now()}-${index.toString().padStart(3, '0')}`;
      const now = new Date().toISOString();
      
      // Convert date from DD-MM-YYYY to YYYY-MM-DD for ISO
      const [startDay, startMonth, startYear] = data.start_date.split('-');
      const [endDay, endMonth, endYear] = data.end_date.split('-');
      const startDateISO = `${startYear}-${startMonth}-${startDay}`;
      const endDateISO = `${endYear}-${endMonth}-${endDay}`;
      
      // Convert budget from NZD string to cents
      const budgetCents = Math.round(parseFloat(data.budget_nzd.replace(/,/g, '')) * 100);

      insertStmt.run(
        id,
        data.title,
        data.description || '',
        data.lane || '',
        data.start_date,
        data.end_date,
        startDateISO,
        endDateISO,
        data.status,
        data.pm_name || '',
        budgetCents,
        data.financial_treatment || 'CAPEX',
        data.row || 0,
        now,
        now
      );

      projects.push({
        id,
        ...data,
        budget_cents: budgetCents,
        created_at: now,
        updated_at: now
      });
    });

    return projects;
  }

  /**
   * Seed tasks into database
   */
  private seedTasks(tasksData: Array<any>): Array<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tasks: Array<any> = [];
    const insertStmt = this.db.prepare(`
      INSERT INTO tasks (
        id, project_id, title, start_date, end_date, start_date_iso, end_date_iso,
        status, effort_hours, assigned_resources, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    tasksData.forEach((data, index) => {
      const id = `TASK-${Date.now()}-${index.toString().padStart(3, '0')}`;
      const now = new Date().toISOString();
      
      // Convert date from DD-MM-YYYY to YYYY-MM-DD for ISO
      const [startDay, startMonth, startYear] = data.start_date.split('-');
      const [endDay, endMonth, endYear] = data.end_date.split('-');
      const startDateISO = `${startYear}-${startMonth}-${startDay}`;
      const endDateISO = `${endYear}-${endMonth}-${endDay}`;

      insertStmt.run(
        id,
        data.project_id,
        data.title,
        data.start_date,
        data.end_date,
        startDateISO,
        endDateISO,
        data.status,
        data.effort_hours || 0,
        JSON.stringify(data.assigned_resources || []),
        now,
        now
      );

      tasks.push({
        id,
        ...data,
        created_at: now,
        updated_at: now
      });
    });

    return tasks;
  }

  /**
   * Create a chain of dependent projects for testing
   * Useful for cycle detection and dependency graph tests
   */
  async createProjectChain(length: number): Promise<Array<any>> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const projects: Array<any> = [];
    
    // Create projects
    for (let i = 0; i < length; i++) {
      const projectData = {
        title: `Chain Project ${i + 1}`,
        description: `Project ${i + 1} in chain`,
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        budget_nzd: '10,000.00'
      };
      
      const seededProjects = this.seedProjects([projectData]);
      projects.push(seededProjects[0]);
    }

    // Create dependencies: P1->P2->P3->...->Pn
    const insertDep = this.db.prepare(`
      INSERT INTO dependencies (
        id, from_type, from_id, to_type, to_id, kind, lag_days, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < length - 1; i++) {
      const depId = `DEP-${Date.now()}-${i.toString().padStart(3, '0')}`;
      insertDep.run(
        depId,
        'project',
        projects[i].id,
        'project',
        projects[i + 1].id,
        'FS',
        0,
        '',
        new Date().toISOString()
      );
    }

    return projects;
  }

  /**
   * Get count of queries executed (for performance testing)
   * Wraps db.prepare to count invocations
   */
  enableQueryCounting(): { getCount: () => number; reset: () => void } {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    let queryCount = 0;
    const originalPrepare = this.db.prepare.bind(this.db);

    // Override prepare to count queries
    this.db.prepare = (sql: string) => {
      queryCount++;
      return originalPrepare(sql);
    };

    return {
      getCount: () => queryCount,
      reset: () => { queryCount = 0; }
    };
  }
}

/**
 * Test data fixtures returned by seedStandardData
 */
export interface TestDataFixtures {
  projects: Array<any>;
  tasks: Array<any>;
  dependencies: Array<any>;
  gates: Array<any>;
  policies: Array<any>;
}

/**
 * Helper to create a test database for a single test
 * Automatically sets up and tears down
 * 
 * @example
 * test('my test', async () => {
 *   await withTestDatabase(async (testDb) => {
 *     const db = testDb.getDb();
 *     // Use db in test
 *   });
 * });
 */
export async function withTestDatabase(
  testFn: (testDb: TestDatabase) => Promise<void>,
  inMemory: boolean = true
): Promise<void> {
  const testDb = new TestDatabase();
  try {
    await testDb.setup(inMemory);
    await testFn(testDb);
  } finally {
    await testDb.teardown();
  }
}

/**
 * Helper to create test database with standard data
 */
export async function withSeededDatabase(
  testFn: (testDb: TestDatabase, fixtures: TestDataFixtures) => Promise<void>,
  inMemory: boolean = true
): Promise<void> {
  await withTestDatabase(async (testDb) => {
    const fixtures = await testDb.seedStandardData();
    await testFn(testDb, fixtures);
  }, inMemory);
}
