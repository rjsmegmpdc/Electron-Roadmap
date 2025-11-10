// app/main/services/coordinator/TimesheetImportService.ts
import { DB } from '../../db';
import { parseCsv, CsvError } from '../../utils/csvParser';
import { parseNZDate, getMonthName } from '../../utils/dateParser';
import type { RawTimesheet, ImportResult } from '../../types/coordinator';

export class TimesheetImportService {
  constructor(private db: DB) {}

  /**
   * Import timesheets from CSV
   */
  async importTimesheets(csvData: string): Promise<ImportResult> {
    const requiredFields = [
      'Stream',
      'Month',
      'Name of employee or applicant',
      'Personnel Number',
      'Date',
      'Activity Type',
      'General receiver', // WBSE
      'Number (unit)' // Hours
    ];

    // Parse CSV with validation
    const parseResult = parseCsv<any>(csvData, {
      requiredFields,
      validator: (row, rowNumber) => this.validateTimesheetRow(row, rowNumber)
    });

    // Begin transaction
    const insertStmt = this.db.prepare(`
      INSERT INTO raw_timesheets (
        stream, month, sender_cost_center, name_of_employee,
        personnel_number, status_and_processing, date,
        activity_type, general_receiver, acct_assgnt_text,
        number_unit, internal_uom, att_absence_type,
        created_on, time_of_entry, created_by,
        last_change, changed_at, changed_by,
        approved_by, approval_date, object_description,
        imported_at, processed
      ) VALUES (
        @stream, @month, @sender_cost_center, @name_of_employee,
        @personnel_number, @status_and_processing, @date,
        @activity_type, @general_receiver, @acct_assgnt_text,
        @number_unit, @internal_uom, @att_absence_type,
        @created_on, @time_of_entry, @created_by,
        @last_change, @changed_at, @changed_by,
        @approved_by, @approval_date, @object_description,
        @imported_at, 0
      )
    `);

    const insertMany = this.db.transaction((rows: any[]) => {
      let imported = 0;
      const errors: CsvError[] = [];

      rows.forEach((row, index) => {
        try {
          const timesheet = this.mapCsvRowToTimesheet(row);
          insertStmt.run(timesheet);
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

  /**
   * Validate a single timesheet row
   */
  private validateTimesheetRow(row: any, rowNumber: number): CsvError[] {
    const errors: CsvError[] = [];

    // Validate date format (DD-MM-YYYY)
    const dateValue = row['Date'];
    if (dateValue && !parseNZDate(dateValue)) {
      errors.push({
        row: rowNumber,
        field: 'Date',
        value: dateValue,
        message: `Invalid date format. Expected DD-MM-YYYY, got: ${dateValue}`,
        severity: 'error'
      });
    }

    // Validate hours (must be positive number)
    const hours = parseFloat(row['Number (unit)']);
    if (isNaN(hours) || hours < 0) {
      errors.push({
        row: rowNumber,
        field: 'Number (unit)',
        value: row['Number (unit)'],
        message: `Invalid hours value. Must be positive number, got: ${row['Number (unit)']}`,
        severity: 'error'
      });
    }

    // Validate hours not exceeding 24 per day
    if (hours > 24) {
      errors.push({
        row: rowNumber,
        field: 'Number (unit)',
        value: hours,
        message: `Hours exceed 24 for single day: ${hours}`,
        severity: 'warning'
      });
    }

    // Validate personnel number is numeric
    const personnelNumber = row['Personnel Number'];
    if (personnelNumber && !/^\d+$/.test(personnelNumber)) {
      errors.push({
        row: rowNumber,
        field: 'Personnel Number',
        value: personnelNumber,
        message: `Personnel Number should be numeric, got: ${personnelNumber}`,
        severity: 'warning'
      });
    }

    return errors;
  }

  /**
   * Map CSV row to database structure
   */
  private mapCsvRowToTimesheet(row: any): Omit<RawTimesheet, 'id'> {
    const now = new Date().toISOString();
    
    return {
      stream: row['Stream'] || '',
      month: row['Month'] || '',
      sender_cost_center: row['Sender Cost Center'],
      name_of_employee: row['Name of employee or applicant'],
      personnel_number: row['Personnel Number'],
      status_and_processing: row['Status and Processing Indicator'],
      date: row['Date'],
      activity_type: row['Activity Type'],
      general_receiver: row['General receiver'], // WBSE
      acct_assgnt_text: row['Acct assgnt text'],
      number_unit: parseFloat(row['Number (unit)']),
      internal_uom: row['Internal UoM'],
      att_absence_type: row['Att./Absence type'],
      created_on: row['Created on'],
      time_of_entry: row['Time of entry'],
      created_by: row['Created by'],
      last_change: row['Last Change'],
      changed_at: row['Changed At'],
      changed_by: row['Changed by'],
      approved_by: row['Approved by'],
      approval_date: row['Approval date'],
      object_description: row['Object Description'],
      imported_at: now,
      processed: false
    };
  }

  /**
   * Get unprocessed timesheets
   */
  async getUnprocessedTimesheets(): Promise<RawTimesheet[]> {
    return this.db.prepare(`
      SELECT * FROM raw_timesheets 
      WHERE processed = 0
      ORDER BY date ASC
    `).all() as RawTimesheet[];
  }

  /**
   * Mark timesheets as processed
   */
  async markAsProcessed(ids: number[]): Promise<void> {
    const updateStmt = this.db.prepare(`
      UPDATE raw_timesheets SET processed = 1 WHERE id = ?
    `);
    
    const updateMany = this.db.transaction((idList: number[]) => {
      idList.forEach(id => updateStmt.run(id));
    });
    
    updateMany(ids);
  }
}
