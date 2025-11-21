// app/main/services/coordinator/LabourRatesImportService.ts
import { DB } from '../../db';
import { parseCsv, CsvError } from '../../utils/csvParser';
import type { LabourRate, ImportResult } from '../../types/coordinator';

export class LabourRatesImportService {
  constructor(private db: DB) {}

  async importLabourRates(csvData: string, fiscalYear: string): Promise<ImportResult> {
    // Labour Rates CSV has 2 title rows before the actual header
    // Skip first 2 rows and use row 3 as header
    const lines = csvData.split('\n');
    if (lines.length < 4) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [{ row: 0, message: 'CSV file has insufficient rows. Expected at least 4 rows (title rows + header + data)', severity: 'error' }],
        warnings: []
      };
    }
    
    // Reconstruct CSV with proper header (skip first 2 title rows)
    const processedCsv = lines.slice(2).join('\n');
    
    // The actual columns based on the file structure
    const requiredFields = ['Band', 'Activity Type', 'Hourly Rate', 'Daily Rate'];

    const parseResult = parseCsv<any>(processedCsv, {
      requiredFields,
      validator: (row, rowNumber) => this.validateRateRow(row, rowNumber, fiscalYear)
    });

    // Delete existing rates for this fiscal year
    this.db.prepare(`DELETE FROM raw_labour_rates WHERE fiscal_year = ?`).run(fiscalYear);

    const insertStmt = this.db.prepare(`
      INSERT INTO raw_labour_rates (
        band, local_band, activity_type, fiscal_year,
        hourly_rate, daily_rate, uplift_amount, uplift_percent, imported_at
      ) VALUES (
        @band, @local_band, @activity_type, @fiscal_year,
        @hourly_rate, @daily_rate, @uplift_amount, @uplift_percent, @imported_at
      )
    `);

    const insertMany = this.db.transaction((rows: any[]) => {
      let imported = 0;
      const errors: CsvError[] = [];

      rows.forEach((row, index) => {
        try {
          const rate = this.mapCsvRowToRate(row, fiscalYear);
          insertStmt.run(rate);
          imported++;
        } catch (error: any) {
          errors.push({
            row: index + 2,
            message: `Insert failed: ${error.message}`,
            severity: 'error'
          });
        }
      });

      return { imported, errors };
    });

    const result = insertMany(parseResult.data);

    return {
      success: result.imported > 0,
      recordsProcessed: parseResult.meta.totalRows,
      recordsImported: result.imported,
      recordsFailed: parseResult.meta.errorRows + result.errors.length,
      errors: [...parseResult.errors, ...result.errors],
      warnings: []
    };
  }

  private validateRateRow(row: any, rowNumber: number, fiscalYear: string): CsvError[] {
    const errors: CsvError[] = [];

    // Validate hourly rate
    const hourly = this.parseNZDAmount(row['Hourly Rate']);
    if (hourly === null || hourly < 0) {
      errors.push({
        row: rowNumber,
        field: 'Hourly Rate',
        value: row['Hourly Rate'],
        message: `Invalid hourly rate`,
        severity: 'error'
      });
    }

    // Validate daily rate
    const daily = this.parseNZDAmount(row['Daily Rate']);
    if (daily === null || daily < 0) {
      errors.push({
        row: rowNumber,
        field: 'Daily Rate',
        value: row['Daily Rate'],
        message: `Invalid daily rate`,
        severity: 'error'
      });
    }

    // Check daily rate is approximately 8x hourly (allow 10% variance)
    if (hourly && daily) {
      const expected = hourly * 8;
      const variance = Math.abs((daily - expected) / expected);
      if (variance > 0.1) {
        errors.push({
          row: rowNumber,
          message: `Daily rate (${daily}) should be ~8x hourly rate (${hourly})`,
          severity: 'warning'
        });
      }
    }

    return errors;
  }

  /**
   * Parse NZD amount (handles $, commas)
   */
  private parseNZDAmount(value: string): number | null {
    if (!value) return null;
    
    // Remove $, spaces, commas
    const cleaned = value.replace(/[$\s,]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? null : parsed;
  }

  private mapCsvRowToRate(row: any, fiscalYear: string): Omit<LabourRate, 'id'> {
    const now = new Date().toISOString();
    
    // Get the second column (index _1) which contains the local band description
    const localBand = row['_1'] || row[''] || '';
    
    return {
      band: row['Band'] || '',
      local_band: localBand,
      activity_type: row['Activity Type'] || '',
      fiscal_year: fiscalYear,
      hourly_rate: this.parseNZDAmount(row['Hourly Rate']) || 0,
      daily_rate: this.parseNZDAmount(row['Daily Rate']) || 0,
      uplift_amount: row['$ Uplift'] ? (this.parseNZDAmount(row['$ Uplift']) ?? undefined) : undefined,
      uplift_percent: row['% Uplift'] ? parseFloat(row['% Uplift'].replace('%', '')) : undefined,
      imported_at: now
    };
  }
}
