import type { DB } from '../../db';

export interface FinanceLedgerRow {
  workstream: string;
  wbse: string;
  budget: number;
  forecast: number;
  actual: number;
  variance: number;
  variance_percent: number;
}

export interface FinanceSummary {
  total_budget: number;
  total_forecast: number;
  total_actual: number;
  total_variance: number;
  total_variance_percent: number;
}

export class FinanceLedgerService {
  constructor(private db: DB) {}

  /**
   * Get financial ledger data for a project
   * Calculates budget, forecast, actual, and variance by workstream/WBSE
   * 
   * @param projectId - Optional project filter (if null, returns all)
   * @param month - Optional month filter (format: YYYY-MM)
   * @returns Array of ledger rows with financial data
   */
  async getFinanceLedger(projectId?: string, month?: string): Promise<FinanceLedgerRow[]> {
    try {
      // Get all workstreams with their budget data
      const workstreams = this.db.prepare(`
        SELECT 
          fw.workstream_name as workstream,
          fw.wbse,
          pfd.original_budget_nzd as budget,
          pfd.forecast_budget_nzd as forecast_from_budget
        FROM financial_workstreams fw
        LEFT JOIN project_financial_detail pfd ON pfd.project_id = fw.project_id
        ${projectId ? 'WHERE fw.project_id = ?' : ''}
        ORDER BY fw.workstream_name
      `).all(projectId ? [projectId] : []) as any[];

      // Calculate ledger rows
      const ledgerRows: FinanceLedgerRow[] = [];

      for (const ws of workstreams) {
        const wbse = ws.wbse;

        // Calculate forecast: sum of (allocated hours × labour rate)
        // This queries feature_allocations joined with resources and labour rates
        const forecastQuery = this.db.prepare(`
          SELECT 
            SUM(
              CASE 
                WHEN fa.allocated_hours IS NOT NULL AND lr.hourly_rate IS NOT NULL 
                THEN fa.allocated_hours * lr.hourly_rate
                ELSE 0 
              END
            ) as forecast
          FROM feature_allocations fa
          INNER JOIN financial_resources fr ON fr.id = fa.resource_id
          LEFT JOIN raw_labour_rates lr ON (
            lr.activity_type = fr.activity_type_cap 
            OR lr.activity_type = fr.activity_type_opx
          )
          WHERE fa.project_id IN (
            SELECT project_id FROM financial_workstreams WHERE wbse = ?
          )
        `).get(wbse) as any;

        const forecast = forecastQuery?.forecast || ws.forecast_from_budget || 0;

        // Calculate actual: sum of actuals from raw_actuals table
        const actualQuery = this.db.prepare(`
          SELECT SUM(value_in_obj_crcy) as actual
          FROM raw_actuals
          WHERE wbs_element = ?
          ${month ? 'AND month = ?' : ''}
        `).get(month ? [wbse, month] : [wbse]) as any;

        const actual = actualQuery?.actual || 0;

        // Calculate variance
        const variance = actual - forecast;
        const variance_percent = forecast > 0 ? (variance / forecast) * 100 : 0;

        ledgerRows.push({
          workstream: ws.workstream,
          wbse: wbse,
          budget: ws.budget || 0,
          forecast: forecast,
          actual: actual,
          variance: variance,
          variance_percent: variance_percent
        });
      }

      // If no workstreams exist, create a summary from project_financial_detail
      if (ledgerRows.length === 0 && projectId) {
        const projectFinance = this.db.prepare(`
          SELECT 
            wbse,
            wbse_desc,
            original_budget_nzd,
            forecast_budget_nzd,
            actual_cost_nzd
          FROM project_financial_detail
          WHERE project_id = ?
        `).get(projectId) as any;

        if (projectFinance) {
          const variance = projectFinance.actual_cost_nzd - projectFinance.forecast_budget_nzd;
          const variance_percent = projectFinance.forecast_budget_nzd > 0 
            ? (variance / projectFinance.forecast_budget_nzd) * 100 
            : 0;

          ledgerRows.push({
            workstream: projectFinance.wbse_desc || 'Project Total',
            wbse: projectFinance.wbse,
            budget: projectFinance.original_budget_nzd || 0,
            forecast: projectFinance.forecast_budget_nzd || 0,
            actual: projectFinance.actual_cost_nzd || 0,
            variance: variance,
            variance_percent: variance_percent
          });
        }
      }

      return ledgerRows;
    } catch (error: any) {
      console.error('Failed to get finance ledger:', error);
      throw new Error(`Failed to calculate finance ledger: ${error.message}`);
    }
  }

  /**
   * Get summary totals across all workstreams
   * 
   * @param projectId - Optional project filter
   * @param month - Optional month filter
   * @returns Summary totals
   */
  async getFinanceSummary(projectId?: string, month?: string): Promise<FinanceSummary> {
    try {
      const ledger = await this.getFinanceLedger(projectId, month);

      const summary: FinanceSummary = {
        total_budget: 0,
        total_forecast: 0,
        total_actual: 0,
        total_variance: 0,
        total_variance_percent: 0
      };

      for (const row of ledger) {
        summary.total_budget += row.budget;
        summary.total_forecast += row.forecast;
        summary.total_actual += row.actual;
        summary.total_variance += row.variance;
      }

      // Calculate total variance percent
      summary.total_variance_percent = summary.total_forecast > 0
        ? (summary.total_variance / summary.total_forecast) * 100
        : 0;

      return summary;
    } catch (error: any) {
      console.error('Failed to get finance summary:', error);
      throw new Error(`Failed to calculate finance summary: ${error.message}`);
    }
  }

  /**
   * Get financial data for a specific workstream
   * 
   * @param wbse - WBS Element identifier
   * @returns Single ledger row
   */
  async getWorkstreamFinance(wbse: string): Promise<FinanceLedgerRow | null> {
    try {
      const ledger = await this.getFinanceLedger();
      return ledger.find(row => row.wbse === wbse) || null;
    } catch (error: any) {
      console.error('Failed to get workstream finance:', error);
      throw new Error(`Failed to get workstream finance: ${error.message}`);
    }
  }

  /**
   * Get list of available months with financial data
   * 
   * @returns Array of month strings (YYYY-MM format)
   */
  async getAvailableMonths(): Promise<string[]> {
    try {
      const months = this.db.prepare(`
        SELECT DISTINCT month
        FROM raw_actuals
        ORDER BY month DESC
      `).all() as any[];

      return months.map(m => m.month);
    } catch (error: any) {
      console.error('Failed to get available months:', error);
      return [];
    }
  }
}
