// app/main/services/coordinator/ActualsImportService.ts
import { DB } from '../../db';
import { parseCsv, CsvError } from '../../utils/csvParser';
import type { RawActual, ImportResult } from '../../types/coordinator';

export class ActualsImportService {
  constructor(private db: DB) {}

  /**
   * Import actuals from SAP FI CSV export
   */
  async importActuals(csvData: string): Promise<ImportResult> {
    const requiredFields = [
      'Month',
      'Posting Date',
      'Cost Element',
      'WBS element',
      'Value in Obj. Crcy'
    ];

    const parseResult = parseCsv<any>(csvData, {
      requiredFields,
      validator: (row, rowNumber) => this.validateActualRow(row, rowNumber)
    });

    const insertStmt = this.db.prepare(`
      INSERT INTO raw_actuals (
        month, posting_date, document_date, cost_element, cost_element_descr,
        wbs_element, value_in_obj_crcy, period, fiscal_year, transaction_currency,
        personnel_number, document_number, created_on, object_key,
        value_tran_curr, vbl_value_obj_curr, name, imported_at, processed
      ) VALUES (
        @month, @posting_date, @document_date, @cost_element, @cost_element_descr,
        @wbs_element, @value_in_obj_crcy, @period, @fiscal_year, @transaction_currency,
        @personnel_number, @document_number, @created_on, @object_key,
        @value_tran_curr, @vbl_value_obj_curr, @name, @imported_at, 0
      )
    `);

    const insertMany = this.db.transaction((rows: any[]) => {
      let imported = 0;
      const errors: CsvError[] = [];

      rows.forEach((row, index) => {
        try {
          const actual = this.mapCsvRowToActual(row);
          insertStmt.run(actual);
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

  private validateActualRow(row: any, rowNumber: number): CsvError[] {
    const errors: CsvError[] = [];

    // Validate amount is numeric
    const amount = parseFloat(row['Value in Obj. Crcy']);
    if (isNaN(amount)) {
      errors.push({
        row: rowNumber,
        field: 'Value in Obj. Crcy',
        value: row['Value in Obj. Crcy'],
        message: `Invalid amount. Must be numeric.`,
        severity: 'error'
      });
    }

    // Validate cost element
    const costElement = row['Cost Element'];
    if (costElement && !/^\d+$/.test(costElement)) {
      errors.push({
        row: rowNumber,
        field: 'Cost Element',
        value: costElement,
        message: `Cost Element should be numeric`,
        severity: 'warning'
      });
    }

    return errors;
  }

  private mapCsvRowToActual(row: any): Omit<RawActual, 'id'> {
    const now = new Date().toISOString();
    
    return {
      month: row['Month'] || '',
      posting_date: row['Posting Date'] || '',
      document_date: row['Document Date'] || '',
      cost_element: row['Cost Element'] || '',
      cost_element_descr: row['Cost element descr.'],
      wbs_element: row['WBS element'] || '',
      value_in_obj_crcy: parseFloat(row['Value in Obj. Crcy']) || 0,
      period: row['Period'] ? parseInt(row['Period'], 10) : undefined,
      fiscal_year: row['Fiscal Year'] ? parseInt(row['Fiscal Year'], 10) : undefined,
      transaction_currency: row['Transaction Currency'],
      personnel_number: row['Personnel Number'],
      document_number: row['Document Number'],
      created_on: row['Created on'],
      object_key: row['Object key'],
      value_tran_curr: row['Value TranCurr'] ? parseFloat(row['Value TranCurr']) : undefined,
      vbl_value_obj_curr: row['Vbl. value/Obj. curr'] ? parseFloat(row['Vbl. value/Obj. curr']) : undefined,
      name: row['Name'],
      imported_at: now,
      processed: false
    };
  }

  /**
   * Categorize actuals by type (software, hardware, contractor)
   */
  async categorizeActuals(): Promise<void> {
    // Software: Cost Element starts with 115
    this.db.prepare(`
      UPDATE raw_actuals 
      SET actual_type = 'software'
      WHERE cost_element LIKE '115%' AND actual_type IS NULL
    `).run();

    // Contractor: Personnel Number != '0'
    this.db.prepare(`
      UPDATE raw_actuals 
      SET actual_type = 'contractor'
      WHERE personnel_number IS NOT NULL 
        AND personnel_number != '0' 
        AND actual_type IS NULL
    `).run();

    // Hardware: Cost Element starts with 116
    this.db.prepare(`
      UPDATE raw_actuals 
      SET actual_type = 'hardware'
      WHERE cost_element LIKE '116%' AND actual_type IS NULL
    `).run();
  }
}
