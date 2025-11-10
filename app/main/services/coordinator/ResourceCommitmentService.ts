// app/main/services/coordinator/ResourceCommitmentService.ts
import type { DB } from '../../db';
import type { ResourceCommitment, CapacityCalculation } from '../../types/coordinator';
import { v4 as uuidv4 } from 'uuid';

export class ResourceCommitmentService {
  constructor(private db: DB) {}

  async createCommitment(data: {
    resource_id: number;
    period_start: string; // DD-MM-YYYY
    period_end: string;   // DD-MM-YYYY
    commitment_type: 'per-day' | 'per-week' | 'per-fortnight';
    committed_hours: number;
  }): Promise<ResourceCommitment> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const totalHours = await this.calculateTotalAvailableHours(
      data.period_start,
      data.period_end,
      data.commitment_type,
      data.committed_hours
    );

    const commitment: ResourceCommitment = {
      id,
      resource_id: data.resource_id,
      period_start: data.period_start,
      period_end: data.period_end,
      commitment_type: data.commitment_type,
      committed_hours: data.committed_hours,
      total_available_hours: totalHours,
      allocated_hours: 0,
      remaining_capacity: totalHours,
      created_at: now,
      updated_at: now,
    };

    this.db
      .prepare(
        `INSERT INTO resource_commitments (
          id, resource_id, period_start, period_end, commitment_type,
          committed_hours, total_available_hours, allocated_hours,
          remaining_capacity, created_at, updated_at
        ) VALUES (
          @id, @resource_id, @period_start, @period_end, @commitment_type,
          @committed_hours, @total_available_hours, @allocated_hours,
          @remaining_capacity, @created_at, @updated_at
        )`
      )
      .run(commitment);

    return commitment;
  }

  private async calculateTotalAvailableHours(
    startNz: string,
    endNz: string,
    type: 'per-day' | 'per-week' | 'per-fortnight',
    committed: number
  ): Promise<number> {
    const workingDays = await this.getWorkingDaysBetween(startNz, endNz);
    if (type === 'per-day') return committed * workingDays;
    if (type === 'per-week') return committed * (workingDays / 5);
    if (type === 'per-fortnight') return committed * (workingDays / 10);
    throw new Error(`Unknown commitment type: ${type}`);
  }

  private nzToIso(nz: string): string {
    // DD-MM-YYYY -> YYYY-MM-DD
    const day = nz.slice(0, 2);
    const month = nz.slice(3, 5);
    const year = nz.slice(6, 10);
    return `${year}-${month}-${day}`;
  }

  private async getWorkingDaysBetween(startNz: string, endNz: string): Promise<number> {
    const start = new Date(this.nzToIso(startNz));
    const end = new Date(this.nzToIso(endNz));

    // Build holiday set from DB (public_holidays.start_date is ISO)
    const holidays = this.db
      .prepare(
        `SELECT start_date FROM public_holidays WHERE start_date >= ? AND start_date <= ?`
      )
      .all(start.toISOString(), end.toISOString()) as Array<{ start_date: string }>;

    const holidayDays = new Set(holidays.map((h) => h.start_date.substring(0, 10)));

    let count = 0;
    const d = new Date(start);
    while (d <= end) {
      const wd = d.getDay();
      const key = d.toISOString().substring(0, 10);
      if (wd !== 0 && wd !== 6 && !holidayDays.has(key)) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }

  async updateAllocatedHoursForResource(resourceId: number): Promise<void> {
    const total = this.db
      .prepare(
        `SELECT COALESCE(SUM(allocated_hours), 0) as total FROM feature_allocations WHERE resource_id = ?`
      )
      .get(resourceId) as any;

    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE resource_commitments
         SET allocated_hours = ?, remaining_capacity = total_available_hours - ?, updated_at = ?
         WHERE resource_id = ?`
      )
      .run(total.total, total.total, now, resourceId);
  }

  async getCapacityCalculation(
    resourceId: number,
    periodStartNz: string,
    periodEndNz: string
  ): Promise<CapacityCalculation> {
    const commitment = this.db
      .prepare(
        `SELECT * FROM resource_commitments
         WHERE resource_id = ? AND period_start <= ? AND period_end >= ?
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(resourceId, periodEndNz, periodStartNz) as ResourceCommitment | undefined;

    if (!commitment) {
      throw new Error(
        `No commitment found for resource ${resourceId} in period ${periodStartNz}..${periodEndNz}`
      );
    }

    // Sum actual hours from raw_timesheets for the period using normalized date comparison
    const isoStart = this.nzToIso(periodStartNz);
    const isoEnd = this.nzToIso(periodEndNz);

    const actual = this.db
      .prepare(
        `SELECT COALESCE(SUM(number_unit), 0) as total
         FROM raw_timesheets
         WHERE resource_id = ? AND (
           substr(date,7,4)||'-'||substr(date,4,2)||'-'||substr(date,1,2) BETWEEN ? AND ?
         )`
      )
      .get(resourceId, isoStart, isoEnd) as any;

    const actualHours = actual.total as number;
    const utilization = commitment.total_available_hours
      ? (actualHours / commitment.total_available_hours) * 100
      : 0;

    let status: CapacityCalculation['status'] = 'optimal';
    if (utilization < 70) status = 'under-utilized';
    else if (utilization > 100) status = 'over-committed';

    const res = this.db
      .prepare(`SELECT resource_name FROM financial_resources WHERE id = ?`)
      .get(resourceId) as any;

    return {
      resource_id: resourceId,
      resource_name: res?.resource_name || String(resourceId),
      period_start: periodStartNz,
      period_end: periodEndNz,
      total_capacity_hours: commitment.total_available_hours,
      allocated_hours: commitment.allocated_hours,
      actual_hours: actualHours,
      remaining_capacity: commitment.remaining_capacity,
      utilization_percent: utilization,
      status,
    };
  }

  async getAllCapacities(): Promise<CapacityCalculation[]> {
    // For each latest commitment per resource
    const rows = this.db
      .prepare(
        `SELECT rc.resource_id, rc.period_start, rc.period_end
         FROM resource_commitments rc
         INNER JOIN (
           SELECT resource_id, MAX(created_at) as max_created
           FROM resource_commitments
           GROUP BY resource_id
         ) x ON x.resource_id = rc.resource_id AND x.max_created = rc.created_at`
      )
      .all() as Array<{ resource_id: number; period_start: string; period_end: string }>;

    const out: CapacityCalculation[] = [];
    for (const r of rows) {
      try {
        out.push(
          await this.getCapacityCalculation(r.resource_id, r.period_start, r.period_end)
        );
      } catch {
        // ignore
      }
    }
    return out;
  }
}
