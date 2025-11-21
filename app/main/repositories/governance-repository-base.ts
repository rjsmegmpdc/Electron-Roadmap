/**
 * Base Repository for Governance Module
 * Generic CRUD operations for all governance tables
 */

import { DB } from '../db';

export abstract class GovernanceRepositoryBase<T> {
  constructor(protected db: DB) {}

  abstract getTableName(): string;
  abstract getPrimaryKey(): string;
  abstract mapRowToEntity(row: any): T;

  /**
   * Get entity by ID
   */
  getById(id: number): T | null {
    const query = `SELECT * FROM ${this.getTableName()} WHERE ${this.getPrimaryKey()} = ?`;
    const row = this.db.prepare(query).get(id);
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Get all entities
   */
  getAll(): T[] {
    const query = `SELECT * FROM ${this.getTableName()}`;
    const rows = this.db.prepare(query).all();
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Create new entity
   */
  create(data: Omit<T, 'created_at' | 'updated_at'>): T {
    const now = new Date().toISOString();
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    
    const query = `
      INSERT INTO ${this.getTableName()} (${columns}, created_at, updated_at)
      VALUES (${placeholders}, ?, ?)
    `;
    
    const result = this.db.prepare(query).run(...values, now, now);
    return this.getById(result.lastInsertRowid as number)!;
  }

  /**
   * Update entity
   */
  update(id: number, data: Partial<T>): T {
    const now = new Date().toISOString();
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const query = `
      UPDATE ${this.getTableName()}
      SET ${setClause}, updated_at = ?
      WHERE ${this.getPrimaryKey()} = ?
    `;
    
    this.db.prepare(query).run(...values, now, id);
    return this.getById(id)!;
  }

  /**
   * Delete entity
   */
  delete(id: number): boolean {
    const query = `DELETE FROM ${this.getTableName()} WHERE ${this.getPrimaryKey()} = ?`;
    const result = this.db.prepare(query).run(id);
    return result.changes > 0;
  }

  /**
   * Execute query with filters
   */
  protected query(sql: string, params: any[] = []): T[] {
    const rows = this.db.prepare(sql).all(...params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Execute query and return single result
   */
  protected querySingle(sql: string, params: any[] = []): T | null {
    const row = this.db.prepare(sql).get(...params);
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Count entities
   */
  count(whereClause: string = '', params: any[] = []): number {
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const query = `SELECT COUNT(*) as count FROM ${this.getTableName()} ${where}`;
    const result = this.db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  /**
   * Transaction wrapper
   */
  transaction<R>(callback: () => R): R {
    return this.db.transaction(callback)();
  }
}
