// app/main/utils/csvParser.ts
import Papa from 'papaparse';

export interface CsvParseResult<T> {
  data: T[];
  errors: CsvError[];
  meta: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
}

export interface CsvError {
  row: number;
  field?: string;
  value?: any;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Generic CSV parser with validation
 */
export function parseCsv<T>(
  csvData: string,
  options: {
    requiredFields: string[]; // Expected headers
    validator?: (row: any, rowIndex: number) => CsvError[];
  }
): CsvParseResult<T> {
  const errors: CsvError[] = [];
  const validData: T[] = [];
  
  // Parse CSV
  const parseResult = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: 'greedy', // Skip lines with all empty values
    transformHeader: (header) => header.trim()
  });

  // Check for parsing errors
  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach((err: any) => {
      errors.push({
        row: err.row || 0,
        message: `CSV Parse Error: ${err.message}`,
        severity: 'error'
      });
    });
  }

  // Validate headers
  if (parseResult.data.length > 0 && typeof parseResult.data[0] === 'object' && parseResult.data[0] !== null) {
    const actualHeaders = Object.keys(parseResult.data[0] as object);
    const missingHeaders = options.requiredFields.filter(h => !actualHeaders.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push({
        row: 0,
        message: `CSV header validation failed. Missing required columns: ${missingHeaders.join(', ')}. Found columns: ${actualHeaders.join(', ')}`,
        severity: 'error'
      });
      // Return early if headers are wrong
      return {
        data: [],
        errors,
        meta: {
          totalRows: 0,
          validRows: 0,
          errorRows: 0
        }
      };
    }
  }

  // Validate each row
  parseResult.data.forEach((row: any, index: number) => {
    const rowNumber = index + 2; // +2 because index 0 = row 2 (after header)

    // Skip completely empty rows (all values are empty/null/undefined)
    const hasAnyData = Object.values(row).some(val => val !== null && val !== undefined && val !== '');
    if (!hasAnyData) {
      return; // Skip this row silently
    }

    // Custom validation
    if (options.validator) {
      const validationErrors = options.validator(row, rowNumber);
      errors.push(...validationErrors);
      
      // If any errors are severe, skip this row
      if (validationErrors.some(e => e.severity === 'error')) {
        return;
      }
    }

    validData.push(row as T);
  });

  return {
    data: validData,
    errors,
    meta: {
      totalRows: parseResult.data.length,
      validRows: validData.length,
      errorRows: parseResult.data.length - validData.length
    }
  };
}
