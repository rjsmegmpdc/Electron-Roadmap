// app/main/services/coordinator/AllocationService.ts
import type { DB } from '../../db';
import type { FeatureAllocation } from '../../types/coordinator';
import { v4 as uuidv4 } from 'uuid';

export interface AllocationVariance {
  allocation_id: string;
  resource_id: number;
  resource_name: string;
  feature_id: string;
  feature_name: string;
  allocated_hours: number;
  actual_hours: number;
  variance_hours: number;
  variance_percent: number;
  allocated_cost: number;
  actual_cost: number;
  variance_cost: number;
  period_start: string;
  period_end: string;
}

export class AllocationService {
  constructor(private db: DB) {}

  async createAllocation(data: {
    resource_id: number;
    feature_id: string;
    allocated_hours: number;
    forecast_start_date?: string; // DD-MM-YYYY
    forecast_end_date?: string;   // DD-MM-YYYY
  }): Promise<FeatureAllocation> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get epic_id and project_id from feature
    const feature = this.db
      .prepare('SELECT epic_id, project_id FROM features WHERE id = ?')
      .get(data.feature_id) as any;

    if (!feature) {
      throw new Error(`Feature ${data.feature_id} not found`);
    }

    const allocation: FeatureAllocation = {
      id,
      resource_id: data.resource_id,
      feature_id: data.feature_id,
      epic_id: feature.epic_id,
      project_id: feature.project_id,
      allocated_hours: data.allocated_hours,
      forecast_start_date: data.forecast_start_date,
      forecast_end_date: data.forecast_end_date,
      actual_hours_to_date: 0,
      actual_cost_to_date: 0,
      variance_hours: 0,
      variance_cost: 0,
      status: 'on-track',
      source: 'manual',
      created_at: now,
      updated_at: now,
    };

    this.db
      .prepare(
        `INSERT INTO feature_allocations (
          id, resource_id, feature_id, epic_id, project_id,
          allocated_hours, forecast_start_date, forecast_end_date,
          actual_hours_to_date, actual_cost_to_date, variance_hours, variance_cost,
          status, source, created_at, updated_at
        ) VALUES (
          @id, @resource_id, @feature_id, @epic_id, @project_id,
          @allocated_hours, @forecast_start_date, @forecast_end_date,
          @actual_hours_to_date, @actual_cost_to_date, @variance_hours, @variance_cost,
          @status, @source, @created_at, @updated_at
        )`
      )
      .run(allocation);

    return allocation;
  }

  async updateAllocation(
    allocationId: string,
    updates: { allocated_hours?: number; forecast_start_date?: string; forecast_end_date?: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    const sets: string[] = [];
    const params: any = { id: allocationId, updated_at: now };

    if (updates.allocated_hours !== undefined) {
      sets.push('allocated_hours = @allocated_hours');
      params.allocated_hours = updates.allocated_hours;
    }
    if (updates.forecast_start_date !== undefined) {
      sets.push('forecast_start_date = @forecast_start_date');
      params.forecast_start_date = updates.forecast_start_date;
    }
    if (updates.forecast_end_date !== undefined) {
      sets.push('forecast_end_date = @forecast_end_date');
      params.forecast_end_date = updates.forecast_end_date;
    }

    if (sets.length === 0) return;

    this.db
      .prepare(`UPDATE feature_allocations SET ${sets.join(', ')}, updated_at = @updated_at WHERE id = @id`)
      .run(params);
  }

  async deleteAllocation(allocationId: string): Promise<void> {
    this.db.prepare(`DELETE FROM feature_allocations WHERE id = ?`).run(allocationId);
  }

  async getAllocationsForResource(resourceId: number): Promise<FeatureAllocation[]> {
    return this.db
      .prepare(`SELECT * FROM feature_allocations WHERE resource_id = ?`)
      .all(resourceId) as FeatureAllocation[];
  }

  async getAllocationsForFeature(featureId: number): Promise<FeatureAllocation[]> {
    return this.db
      .prepare(`SELECT * FROM feature_allocations WHERE feature_id = ?`)
      .all(featureId) as FeatureAllocation[];
  }

  private nzToIso(nz: string): string {
    // DD-MM-YYYY -> YYYY-MM-DD
    const day = nz.slice(0, 2);
    const month = nz.slice(3, 5);
    const year = nz.slice(6, 10);
    return `${year}-${month}-${day}`;
  }

  async reconcileAllocation(allocationId: string): Promise<AllocationVariance> {
    const alloc = this.db
      .prepare(`SELECT * FROM feature_allocations WHERE id = ?`)
      .get(allocationId) as FeatureAllocation | undefined;

    if (!alloc) {
      throw new Error(`Allocation ${allocationId} not found`);
    }

    // Get actual hours from raw_timesheets for this feature
    const periodStart = alloc.forecast_start_date || '01-01-2020';
    const periodEnd = alloc.forecast_end_date || '31-12-2099';
    const isoStart = this.nzToIso(periodStart);
    const isoEnd = this.nzToIso(periodEnd);

    const actual = this.db
      .prepare(
        `SELECT COALESCE(SUM(number_unit), 0) as total
         FROM raw_timesheets
         WHERE resource_id = ? AND feature_id = ? AND (
           substr(date,7,4)||'-'||substr(date,4,2)||'-'||substr(date,1,2) BETWEEN ? AND ?
         )`
      )
      .get(alloc.resource_id, alloc.feature_id, isoStart, isoEnd) as any;

    const actualHours = actual.total as number;
    const varianceHours = actualHours - alloc.allocated_hours;
    const variancePercent = alloc.allocated_hours
      ? (varianceHours / alloc.allocated_hours) * 100
      : 0;

    // Get labour rate for resource
    const rate = this.db
      .prepare(
        `SELECT daily_rate FROM raw_labour_rates WHERE resource_id = ? ORDER BY created_at DESC LIMIT 1`
      )
      .get(alloc.resource_id) as any;

    const hourlyRate = rate ? rate.daily_rate / 8 : 0;
    const allocatedCost = alloc.allocated_hours * hourlyRate;
    const actualCost = actualHours * hourlyRate;
    const varianceCost = actualCost - allocatedCost;

    const resource = this.db
      .prepare(`SELECT resource_name FROM financial_resources WHERE id = ?`)
      .get(alloc.resource_id) as any;

    const feature = this.db
      .prepare(`SELECT name FROM features WHERE id = ?`)
      .get(alloc.feature_id) as any;

    return {
      allocation_id: allocationId,
      resource_id: alloc.resource_id,
      resource_name: resource?.resource_name || String(alloc.resource_id),
      feature_id: alloc.feature_id,
      feature_name: feature?.name || alloc.feature_id,
      allocated_hours: alloc.allocated_hours,
      actual_hours: actualHours,
      variance_hours: varianceHours,
      variance_percent: variancePercent,
      allocated_cost: allocatedCost,
      actual_cost: actualCost,
      variance_cost: varianceCost,
      period_start: alloc.forecast_start_date || '',
      period_end: alloc.forecast_end_date || '',
    };
  }

  async reconcileAllAllocations(): Promise<AllocationVariance[]> {
    const allocs = this.db
      .prepare(`SELECT id FROM feature_allocations`)
      .all() as Array<{ id: string }>;

    const out: AllocationVariance[] = [];
    for (const a of allocs) {
      try {
        out.push(await this.reconcileAllocation(a.id));
      } catch {
        // ignore
      }
    }
    return out;
  }

  async getFeatureAllocationSummary(featureId: number): Promise<{
    total_allocated_hours: number;
    total_actual_hours: number;
    total_variance_hours: number;
    total_allocated_cost: number;
    total_actual_cost: number;
    total_variance_cost: number;
    resource_breakdown: Array<{
      resource_id: number;
      resource_name: string;
      allocated_hours: number;
      actual_hours: number;
      variance_hours: number;
    }>;
  }> {
    const allocations = await this.getAllocationsForFeature(featureId);
    const variances = await Promise.all(
      allocations.map((a) => this.reconcileAllocation(a.id))
    );

    const total = variances.reduce(
      (acc, v) => ({
        total_allocated_hours: acc.total_allocated_hours + v.allocated_hours,
        total_actual_hours: acc.total_actual_hours + v.actual_hours,
        total_variance_hours: acc.total_variance_hours + v.variance_hours,
        total_allocated_cost: acc.total_allocated_cost + v.allocated_cost,
        total_actual_cost: acc.total_actual_cost + v.actual_cost,
        total_variance_cost: acc.total_variance_cost + v.variance_cost,
      }),
      {
        total_allocated_hours: 0,
        total_actual_hours: 0,
        total_variance_hours: 0,
        total_allocated_cost: 0,
        total_actual_cost: 0,
        total_variance_cost: 0,
      }
    );

    const breakdown = variances.map((v) => ({
      resource_id: v.resource_id,
      resource_name: v.resource_name,
      allocated_hours: v.allocated_hours,
      actual_hours: v.actual_hours,
      variance_hours: v.variance_hours,
    }));

    return { ...total, resource_breakdown: breakdown };
  }
}
