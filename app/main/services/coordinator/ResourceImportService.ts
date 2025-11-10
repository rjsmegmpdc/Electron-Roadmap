// app/main/services/coordinator/ResourceImportService.ts
import type { DB } from '../../db';
import { parseCsv } from '../../utils/csvParser';

interface ImportResult {
  success: boolean;
  recordsProcessed: number;
  recordsImported: number;
  recordsFailed: number;
  errors: Array<{
    row: number;
    field?: string;
    value?: any;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{ row: number; message: string }>;
}

interface ResourceRow {
  Roadmap_ResourceID: string;
  ResourceName: string;
  Email: string;
  WorkArea: string;
  ActivityType_CAP: string;
  ActivityType_OPX: string;
  'Contract Type': string;
  EmployeeID: string;
}

export class ResourceImportService {
  constructor(private db: DB) {}

  async importResources(csvData: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      recordsProcessed: 0,
      recordsImported: 0,
      recordsFailed: 0,
      errors: [],
      warnings: [],
    };

    try {
      const { data: rows, errors: parseErrors } = parseCsv<ResourceRow>(csvData, {
        requiredFields: ['ResourceName', 'Contract Type'],
        validator: (row: ResourceRow, rowNum: number) => {
          const errors: Array<{
            row: number;
            field?: string;
            value?: any;
            message: string;
            severity: 'error' | 'warning';
          }> = [];

          // Validate contract type
          const contractType = row['Contract Type']?.trim();
          if (contractType && !['FTE', 'SOW', 'External Squad'].includes(contractType)) {
            errors.push({
              row: rowNum,
              field: 'Contract Type',
              value: contractType,
              message: `Invalid Contract Type: "${contractType}". Must be FTE, SOW, or External Squad`,
              severity: 'error',
            });
          }

          // Validate activity types if provided
          const activityRegex = /^N[1-6]_(CAP|OPX)$/;
          if (row.ActivityType_CAP && row.ActivityType_CAP !== 'Nil' && row.ActivityType_CAP.trim() !== '') {
            if (!activityRegex.test(row.ActivityType_CAP.trim())) {
              errors.push({
                row: rowNum,
                field: 'ActivityType_CAP',
                value: row.ActivityType_CAP,
                message: `Invalid ActivityType_CAP: "${row.ActivityType_CAP}". Must match N[1-6]_CAP format`,
                severity: 'error',
              });
            }
          }

          if (row.ActivityType_OPX && row.ActivityType_OPX !== 'Nil' && row.ActivityType_OPX.trim() !== '') {
            if (!activityRegex.test(row.ActivityType_OPX.trim())) {
              errors.push({
                row: rowNum,
                field: 'ActivityType_OPX',
                value: row.ActivityType_OPX,
                message: `Invalid ActivityType_OPX: "${row.ActivityType_OPX}". Must match N[1-6]_OPX format`,
                severity: 'error',
              });
            }
          }

          return errors;
        },
      });
      
      if (parseErrors.length > 0) {
        parseErrors.forEach(err => {
          result.errors.push({
            row: err.row,
            field: err.field,
            value: err.value,
            message: err.message,
            severity: err.severity,
          });
        });
        result.recordsFailed += parseErrors.filter(e => e.severity === 'error').length;
      }
      result.recordsProcessed = rows.length + parseErrors.filter(e => e.severity === 'error').length;

      const validRecords: Array<{
        roadmap_resource_id?: number;
        resource_name: string;
        email?: string;
        work_area?: string;
        activity_type_cap?: string;
        activity_type_opx?: string;
        contract_type: 'FTE' | 'SOW' | 'External Squad';
        employee_id?: string;
        created_at: string;
        updated_at: string;
      }> = [];

      // Transform valid rows into database records
      const now = new Date().toISOString();
      for (const row of rows) {
        const contractType = row['Contract Type']?.trim();
        const activityCap = row.ActivityType_CAP === 'Nil' ? null : row.ActivityType_CAP?.trim() || null;
        const activityOpx = row.ActivityType_OPX === 'Nil' ? null : row.ActivityType_OPX?.trim() || null;

        validRecords.push({
          roadmap_resource_id: row.Roadmap_ResourceID ? parseInt(row.Roadmap_ResourceID, 10) : undefined,
          resource_name: row.ResourceName.trim(),
          email: row.Email?.trim() || undefined,
          work_area: row.WorkArea?.trim() || undefined,
          activity_type_cap: activityCap || undefined,
          activity_type_opx: activityOpx || undefined,
          contract_type: contractType as 'FTE' | 'SOW' | 'External Squad',
          employee_id: row.EmployeeID?.trim() || undefined,
          created_at: now,
          updated_at: now,
        });
      }

      // Insert valid records
      if (validRecords.length > 0) {
        const insertStmt = this.db.prepare(`
          INSERT INTO financial_resources (
            roadmap_resource_id, resource_name, email, work_area,
            activity_type_cap, activity_type_opx, contract_type, employee_id,
            created_at, updated_at
          ) VALUES (
            @roadmap_resource_id, @resource_name, @email, @work_area,
            @activity_type_cap, @activity_type_opx, @contract_type, @employee_id,
            @created_at, @updated_at
          )
          ON CONFLICT(employee_id) DO UPDATE SET
            roadmap_resource_id = excluded.roadmap_resource_id,
            resource_name = excluded.resource_name,
            email = excluded.email,
            work_area = excluded.work_area,
            activity_type_cap = excluded.activity_type_cap,
            activity_type_opx = excluded.activity_type_opx,
            contract_type = excluded.contract_type,
            updated_at = excluded.updated_at
        `);

        const transaction = this.db.transaction((records: typeof validRecords) => {
          for (const record of records) {
            insertStmt.run(record);
          }
        });

        try {
          transaction(validRecords);
          result.recordsImported = validRecords.length;
        } catch (err: any) {
          result.errors.push({
            row: 0,
            message: `Database error: ${err.message}`,
            severity: 'error',
          });
          return result;
        }
      }

      result.success = result.recordsImported > 0 || result.recordsFailed === 0;
    } catch (err: any) {
      result.errors.push({
        row: 0,
        message: `Import error: ${err.message}`,
        severity: 'error',
      });
    }

    return result;
  }
}
