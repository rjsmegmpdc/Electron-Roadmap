// app/main/services/coordinator/VarianceDetectionService.ts
import type { DB } from '../../db';
import type { VarianceAlert, VarianceThreshold } from '../../types/coordinator';
import { v4 as uuidv4 } from 'uuid';

export interface VarianceCheck {
  type: 'timesheet_no_allocation' | 'allocation_variance' | 'capacity_exceeded' | 'schedule_variance' | 'cost_variance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_type: 'resource' | 'feature' | 'project';
  entity_id: string;
  message: string;
  details: any;
}

export class VarianceDetectionService {
  constructor(private db: DB) {}

  // ===== THRESHOLDS =====

  async setThreshold(data: {
    entity_type: 'resource' | 'project' | 'global';
    entity_id?: string;
    hours_variance_percent: number;
    cost_variance_percent: number;
    schedule_variance_days: number;
  }): Promise<VarianceThreshold> {
    const now = new Date().toISOString();

    // Check if threshold exists
    const existing = data.entity_id
      ? this.db
          .prepare(
            'SELECT id FROM variance_thresholds WHERE entity_type = ? AND entity_id = ?'
          )
          .get(data.entity_type, data.entity_id)
      : this.db
          .prepare("SELECT id FROM variance_thresholds WHERE entity_type = 'global' AND entity_id IS NULL")
          .get();

    const threshold: VarianceThreshold = {
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      hours_variance_percent: data.hours_variance_percent,
      cost_variance_percent: data.cost_variance_percent,
      schedule_variance_days: data.schedule_variance_days,
      created_at: now,
      updated_at: now,
    };

    if (existing) {
      // Update
      this.db
        .prepare(
          `UPDATE variance_thresholds 
           SET hours_variance_percent = ?, cost_variance_percent = ?, schedule_variance_days = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(
          threshold.hours_variance_percent,
          threshold.cost_variance_percent,
          threshold.schedule_variance_days,
          now,
          (existing as any).id
        );
      threshold.id = (existing as any).id;
    } else {
      // Insert
      const result = this.db
        .prepare(
          `INSERT INTO variance_thresholds (
            entity_type, entity_id, hours_variance_percent, cost_variance_percent,
            schedule_variance_days, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          threshold.entity_type,
          threshold.entity_id,
          threshold.hours_variance_percent,
          threshold.cost_variance_percent,
          threshold.schedule_variance_days,
          threshold.created_at,
          threshold.updated_at
        );
      threshold.id = result.lastInsertRowid as number;
    }

    return threshold;
  }

  async getThreshold(entityType: 'resource' | 'project' | 'global', entityId?: string): Promise<VarianceThreshold> {
    // Try entity-specific threshold first
    if (entityId) {
      const specific = this.db
        .prepare('SELECT * FROM variance_thresholds WHERE entity_type = ? AND entity_id = ?')
        .get(entityType, entityId) as VarianceThreshold | undefined;
      if (specific) return specific;
    }

    // Fall back to global
    const global = this.db
      .prepare("SELECT * FROM variance_thresholds WHERE entity_type = 'global' AND entity_id IS NULL")
      .get() as VarianceThreshold | undefined;

    if (global) return global;

    // Default thresholds
    return {
      entity_type: 'global',
      hours_variance_percent: 15,
      cost_variance_percent: 10,
      schedule_variance_days: 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // ===== VARIANCE DETECTION =====

  async detectAllVariances(): Promise<VarianceCheck[]> {
    const checks: VarianceCheck[] = [];

    checks.push(...(await this.detectTimesheetNoAllocation()));
    checks.push(...(await this.detectAllocationVariances()));
    checks.push(...(await this.detectCapacityExceeded()));
    checks.push(...(await this.detectScheduleVariances()));
    checks.push(...(await this.detectCostVariances()));

    return checks;
  }

  private async detectTimesheetNoAllocation(): Promise<VarianceCheck[]> {
    // Find timesheets with resource_id but no matching allocation
    const rows = this.db
      .prepare(
        `SELECT DISTINCT rt.resource_id, rt.feature_id, fr.resource_name, f.name as feature_name
         FROM raw_timesheets rt
         INNER JOIN financial_resources fr ON fr.id = rt.resource_id
         LEFT JOIN features f ON f.id = rt.feature_id
         LEFT JOIN feature_allocations fa ON fa.resource_id = rt.resource_id AND fa.feature_id = rt.feature_id
         WHERE rt.resource_id IS NOT NULL 
           AND rt.feature_id IS NOT NULL 
           AND fa.id IS NULL`
      )
      .all() as any[];

    return rows.map((row) => ({
      type: 'timesheet_no_allocation' as const,
      severity: 'medium' as const,
      entity_type: 'resource' as const,
      entity_id: String(row.resource_id),
      message: `Resource ${row.resource_name} submitted timesheets for ${row.feature_name} without allocation`,
      details: {
        resource_id: row.resource_id,
        resource_name: row.resource_name,
        feature_id: row.feature_id,
        feature_name: row.feature_name,
      },
    }));
  }

  private async detectAllocationVariances(): Promise<VarianceCheck[]> {
    const checks: VarianceCheck[] = [];

    const allocations = this.db
      .prepare('SELECT id, resource_id, feature_id FROM feature_allocations')
      .all() as any[];

    for (const alloc of allocations) {
      const threshold = await this.getThreshold('resource', String(alloc.resource_id));

      // Get allocation data
      const data = this.db
        .prepare(
          `SELECT fa.*, fr.resource_name, f.name as feature_name
           FROM feature_allocations fa
           INNER JOIN financial_resources fr ON fr.id = fa.resource_id
           INNER JOIN features f ON f.id = fa.feature_id
           WHERE fa.id = ?`
        )
        .get(alloc.id) as any;

      if (!data) continue;

      const variancePercent = data.allocated_hours
        ? Math.abs(data.variance_hours / data.allocated_hours) * 100
        : 0;

      if (variancePercent > threshold.hours_variance_percent) {
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (variancePercent > threshold.hours_variance_percent * 3) severity = 'critical';
        else if (variancePercent > threshold.hours_variance_percent * 2) severity = 'high';
        else if (variancePercent > threshold.hours_variance_percent * 1.5) severity = 'medium';

        checks.push({
          type: 'allocation_variance',
          severity,
          entity_type: 'resource',
          entity_id: String(data.resource_id),
          message: `${data.resource_name} has ${variancePercent.toFixed(1)}% hours variance on ${data.feature_name}`,
          details: {
            resource_id: data.resource_id,
            resource_name: data.resource_name,
            feature_id: data.feature_id,
            feature_name: data.feature_name,
            allocated_hours: data.allocated_hours,
            actual_hours: data.actual_hours_to_date,
            variance_hours: data.variance_hours,
            variance_percent: variancePercent,
            threshold: threshold.hours_variance_percent,
          },
        });
      }
    }

    return checks;
  }

  private async detectCapacityExceeded(): Promise<VarianceCheck[]> {
    const rows = this.db
      .prepare(
        `SELECT rc.*, fr.resource_name
         FROM resource_commitments rc
         INNER JOIN financial_resources fr ON fr.id = rc.resource_id
         WHERE rc.allocated_hours > rc.total_available_hours`
      )
      .all() as any[];

    return rows.map((row) => {
      const overPercent =
        ((row.allocated_hours - row.total_available_hours) / row.total_available_hours) * 100;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (overPercent > 50) severity = 'critical';
      else if (overPercent > 25) severity = 'high';

      return {
        type: 'capacity_exceeded' as const,
        severity,
        entity_type: 'resource' as const,
        entity_id: String(row.resource_id),
        message: `${row.resource_name} is over-committed by ${overPercent.toFixed(1)}%`,
        details: {
          resource_id: row.resource_id,
          resource_name: row.resource_name,
          total_capacity: row.total_available_hours,
          allocated: row.allocated_hours,
          over_by: row.allocated_hours - row.total_available_hours,
          over_percent: overPercent,
        },
      };
    });
  }

  private async detectScheduleVariances(): Promise<VarianceCheck[]> {
    // Check ADO milestone delays
    const rows = this.db
      .prepare(
        `SELECT afm.*, f.name as feature_name
         FROM ado_feature_mapping afm
         INNER JOIN features f ON f.id = afm.feature_id
         WHERE afm.uat_target_date IS NOT NULL`
      )
      .all() as any[];

    const checks: VarianceCheck[] = [];
    const today = new Date();

    for (const row of rows) {
      const threshold = await this.getThreshold('project', row.feature_id);

      if (row.uat_target_date) {
        const targetDate = this.nzToDate(row.uat_target_date);
        const daysLate = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLate > threshold.schedule_variance_days && row.ado_state !== 'Closed') {
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (daysLate > threshold.schedule_variance_days * 4) severity = 'critical';
          else if (daysLate > threshold.schedule_variance_days * 2) severity = 'high';
          else if (daysLate > threshold.schedule_variance_days * 1.5) severity = 'medium';

          checks.push({
            type: 'schedule_variance',
            severity,
            entity_type: 'feature',
            entity_id: row.feature_id,
            message: `${row.feature_name} is ${daysLate} days past UAT target`,
            details: {
              feature_id: row.feature_id,
              feature_name: row.feature_name,
              uat_target_date: row.uat_target_date,
              days_late: daysLate,
              ado_state: row.ado_state,
              threshold: threshold.schedule_variance_days,
            },
          });
        }
      }
    }

    return checks;
  }

  private async detectCostVariances(): Promise<VarianceCheck[]> {
    const checks: VarianceCheck[] = [];

    // Check project-level cost variance
    const projects = this.db
      .prepare(
        `SELECT pfd.*, p.name as project_name
         FROM project_financial_detail pfd
         INNER JOIN projects p ON p.id = pfd.project_id
         WHERE pfd.actual_cost_nzd > 0`
      )
      .all() as any[];

    for (const proj of projects) {
      const threshold = await this.getThreshold('project', proj.project_id);

      const costVariancePercent = proj.forecast_budget_nzd
        ? Math.abs(proj.variance_nzd / proj.forecast_budget_nzd) * 100
        : 0;

      if (costVariancePercent > threshold.cost_variance_percent) {
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (costVariancePercent > threshold.cost_variance_percent * 3) severity = 'critical';
        else if (costVariancePercent > threshold.cost_variance_percent * 2) severity = 'high';
        else if (costVariancePercent > threshold.cost_variance_percent * 1.5) severity = 'medium';

        checks.push({
          type: 'cost_variance',
          severity,
          entity_type: 'project',
          entity_id: proj.project_id,
          message: `${proj.project_name} has ${costVariancePercent.toFixed(1)}% cost variance`,
          details: {
            project_id: proj.project_id,
            project_name: proj.project_name,
            forecast_budget: proj.forecast_budget_nzd,
            actual_cost: proj.actual_cost_nzd,
            variance: proj.variance_nzd,
            variance_percent: costVariancePercent,
            threshold: threshold.cost_variance_percent,
          },
        });
      }
    }

    return checks;
  }

  private nzToDate(nz: string): Date {
    // DD-MM-YYYY -> Date
    const day = parseInt(nz.slice(0, 2));
    const month = parseInt(nz.slice(3, 5)) - 1;
    const year = parseInt(nz.slice(6, 10));
    return new Date(year, month, day);
  }

  // ===== ALERTS =====

  async createAlert(check: VarianceCheck): Promise<VarianceAlert> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Map check type to alert_type
    const alertTypeMap: Record<string, VarianceAlert['alert_type']> = {
      timesheet_no_allocation: 'unauthorized',
      allocation_variance: 'effort',
      capacity_exceeded: 'commitment',
      schedule_variance: 'schedule',
      cost_variance: 'cost',
    };

    const alert: VarianceAlert = {
      id,
      alert_type: alertTypeMap[check.type] || 'effort',
      entity_type: check.entity_type,
      entity_id: check.entity_id,
      severity: check.severity,
      message: check.message,
      details: check.details,
      acknowledged: false,
      created_at: now,
    };

    this.db
      .prepare(
        `INSERT INTO variance_alerts (
          id, alert_type, entity_type, entity_id, severity, message,
          details, acknowledged, created_at
        ) VALUES (
          @id, @alert_type, @entity_type, @entity_id, @severity, @message,
          @details, @acknowledged, @created_at
        )`
      )
      .run({
        ...alert,
        details: JSON.stringify(alert.details),
      });

    return alert;
  }

  async resolveAlert(alertId: string, resolvedBy?: string, notes?: string): Promise<void> {
    // Note: The current schema doesn't have status/resolved_at fields
    // This acknowledges and marks the alert
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE variance_alerts 
         SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?
         WHERE id = ?`
      )
      .run(resolvedBy || 'system', now, alertId);
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE variance_alerts SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ? WHERE id = ?`)
      .run(acknowledgedBy || 'user', now, alertId);
  }

  async getOpenAlerts(): Promise<VarianceAlert[]> {
    return this.db
      .prepare('SELECT * FROM variance_alerts WHERE acknowledged = 0 ORDER BY severity DESC, created_at DESC')
      .all() as VarianceAlert[];
  }

  async getAlertsByEntity(entityType: string, entityId: string): Promise<VarianceAlert[]> {
    return this.db
      .prepare(
        'SELECT * FROM variance_alerts WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC'
      )
      .all(entityType, entityId) as VarianceAlert[];
  }
}
