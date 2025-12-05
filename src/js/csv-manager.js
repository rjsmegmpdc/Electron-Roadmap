/**
 * CSVManager - CSV Import/Export with Format Detection
 * 
 * Handles CSV import/export with support for:
 * - Simple format: Title,Description,Start Date,End Date,State,Technology Stack
 * - Full format: All project fields with tasks/resources/forecasts as JSON
 * - Format auto-detection
 * - NZ date format validation and conversion
 * - Round-trip data safety
 */

import DateUtils from './date-utils.js';

export default class CSVManager {
  constructor() {
    // No dependencies required
  }

  /**
   * Detect CSV format based on headers
   * @param {string} csvText - CSV content
   * @returns {string} Format type: 'simple' or 'full'
   */
  detectFormat(csvText) {
    if (!csvText || typeof csvText !== 'string') {
      return 'simple';
    }

    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
      return 'simple';
    }

    const headers = this._parseCSVLine(lines[0]).map(h => h.toLowerCase());
    
    // Check for full format indicators
    const fullFormatIndicators = ['project_number', 'financial_treatment', 'budget_cents', 'tasks', 'resources', 'forecasts'];
    const hasFullFormat = fullFormatIndicators.some(indicator => headers.includes(indicator));
    
    return hasFullFormat ? 'full' : 'simple';
  }

  /**
   * Parse CSV text into projects
   * @param {string} csvText - CSV content
   * @returns {Object} Parse result with projects, errors, and warnings
   */
  parseCSV(csvText) {
    const result = {
      projects: [],
      errors: [],
      warnings: []
    };

    if (!csvText || typeof csvText !== 'string') {
      result.errors.push({ row: 0, msg: 'No CSV content provided' });
      return result;
    }

    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      result.errors.push({ row: 0, msg: 'CSV must contain at least header and one data row' });
      return result;
    }

    const format = this.detectFormat(csvText);
    const headers = this._parseCSVLine(lines[0]);
    
    // Parse each data row
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const line = lines[i].trim();
      
      if (!line) continue; // Skip empty lines
      
      try {
        const values = this._parseCSVLine(line);
        const project = format === 'full' 
          ? this._parseFullFormatRow(headers, values, rowNumber, result)
          : this._parseSimpleFormatRow(headers, values, rowNumber, result);
          
        if (project) {
          result.projects.push(project);
        }
      } catch (error) {
        result.errors.push({ row: rowNumber, msg: error.message });
      }
    }

    return result;
  }

  /**
   * Export projects to CSV
   * @param {Array} projects - Array of project objects
   * @param {string} format - Export format: 'simple' or 'full'
   * @returns {string} CSV content
   */
  exportToCSV(projects, format = 'full') {
    if (!projects || !Array.isArray(projects)) {
      return '';
    }

    if (projects.length === 0) {
      return format === 'full' ? this._getFullFormatHeaders() : this._getSimpleFormatHeaders();
    }

    const lines = [];
    
    // Add header
    lines.push(format === 'full' ? this._getFullFormatHeaders() : this._getSimpleFormatHeaders());
    
    // Add data rows
    for (const project of projects) {
      try {
        const row = format === 'full' 
          ? this._exportFullFormatRow(project)
          : this._exportSimpleFormatRow(project);
        lines.push(row);
      } catch (error) {
        console.warn(`Error exporting project ${project.id || 'unknown'}:`, error.message);
        // Continue with other projects
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate CSV template
   * @param {string} format - Template format: 'simple' or 'full'
   * @returns {string} CSV template with headers only
   */
  generateTemplate(format = 'full') {
    return format === 'full' ? this._getFullFormatHeaders() : this._getSimpleFormatHeaders();
  }

  /**
   * Download CSV content as file
   * @param {string} csvContent - CSV content
   * @param {string} filename - Download filename
   */
  downloadCSV(csvContent, filename = 'projects.csv') {
    if (typeof window === 'undefined') {
      // Node.js environment - cannot download
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Parse a single CSV line handling quotes and escaping
   * @param {string} line - CSV line
   * @returns {Array<string>} Parsed values
   * @private
   */
  _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Start or end quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add final field
    result.push(current.trim());
    
    return result;
  }

  /**
   * Parse simple format row
   * @param {Array} headers - CSV headers
   * @param {Array} values - CSV values
   * @param {number} rowNumber - Row number for error reporting
   * @param {Object} result - Result object to add errors/warnings
   * @returns {Object|null} Project object or null if invalid
   * @private
   */
  _parseSimpleFormatRow(headers, values, rowNumber, result) {
    if (values.length !== headers.length) {
      result.errors.push({ row: rowNumber, msg: `Expected ${headers.length} fields, got ${values.length}` });
      return null;
    }

    const project = {
      id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tasks: [],
      resources: [],
      forecasts: []
    };

    // Map simple format fields
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().replace(/\s+/g, '_');
      const value = values[i];
      
      switch (header) {
        case 'title':
          project.title = value;
          break;
        case 'description':
          project.description = value;
          break;
        case 'start_date':
          project.start_date = this._validateAndConvertDate(value, rowNumber, 'start_date', result);
          break;
        case 'end_date':
          project.end_date = this._validateAndConvertDate(value, rowNumber, 'end_date', result);
          break;
        case 'state':
        case 'status':
          project.status = this._mapStatus(value) || 'concept-design';
          break;
        case 'technology_stack':
        case 'lane':
          project.lane = this._mapLane(value) || 'other';
          break;
      }
    }

    // Set defaults for required fields
    project.budget_cents = project.budget_cents || 0;
    project.financial_treatment = project.financial_treatment || 'MIXED';
    project.pm_name = project.pm_name || '';

    return project;
  }

  /**
   * Parse full format row
   * @param {Array} headers - CSV headers
   * @param {Array} values - CSV values
   * @param {number} rowNumber - Row number for error reporting
   * @param {Object} result - Result object to add errors/warnings
   * @returns {Object|null} Project object or null if invalid
   * @private
   */
  _parseFullFormatRow(headers, values, rowNumber, result) {
    if (values.length !== headers.length) {
      result.errors.push({ row: rowNumber, msg: `Expected ${headers.length} fields, got ${values.length}` });
      return null;
    }

    const project = {};

    // Map all fields
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      const value = values[i];
      
      if (!value) continue; // Skip empty values
      
      switch (header) {
        case 'start_date':
        case 'end_date':
          project[header] = this._validateAndConvertDate(value, rowNumber, header, result);
          break;
        case 'budget_cents':
          project[header] = this._parseInteger(value, rowNumber, header, result);
          break;
        case 'tasks':
        case 'resources':
        case 'forecasts':
          project[header] = this._parseJSON(value, rowNumber, header, result);
          break;
        default:
          project[header] = value;
      }
    }

    return project;
  }

  /**
   * Export simple format row
   * @param {Object} project - Project object
   * @returns {string} CSV row
   * @private
   */
  _exportSimpleFormatRow(project) {
    const values = [
      project.title || '',
      project.description || '',
      project.start_date || '',
      project.end_date || '',
      project.status || '',
      project.lane || ''
    ];
    
    return values.map(v => this._escapeCSVField(v)).join(',');
  }

  /**
   * Export full format row
   * @param {Object} project - Project object
   * @returns {string} CSV row
   * @private
   */
  _exportFullFormatRow(project) {
    const values = [
      project.project_number || '',
      project.id || '',
      project.title || '',
      project.description || '',
      project.lane || '',
      project.start_date || '',
      project.end_date || '',
      project.status || '',
      project.dependencies || '',
      project.pm_name || '',
      project.project_code || '',
      project.financial_treatment || '',
      (project.budget_cents || 0).toString(),
      JSON.stringify(project.tasks || []),
      JSON.stringify(project.resources || []),
      JSON.stringify(project.forecasts || [])
    ];
    
    return values.map(v => this._escapeCSVField(v)).join(',');
  }

  /**
   * Get simple format headers
   * @returns {string} CSV headers
   * @private
   */
  _getSimpleFormatHeaders() {
    return 'Title,Description,Start Date,End Date,State,Technology Stack';
  }

  /**
   * Get full format headers
   * @returns {string} CSV headers
   * @private
   */
  _getFullFormatHeaders() {
    return 'project_number,id,title,description,lane,start_date,end_date,status,dependencies,pm_name,project_code,financial_treatment,budget_cents,tasks,resources,forecasts';
  }

  /**
   * Validate and convert date to NZ format
   * @param {string} dateStr - Date string
   * @param {number} rowNumber - Row number for error reporting
   * @param {string} fieldName - Field name for error reporting
   * @param {Object} result - Result object to add errors/warnings
   * @returns {string} NZ formatted date
   * @private
   */
  _validateAndConvertDate(dateStr, rowNumber, fieldName, result) {
    if (!dateStr) return '';
    
    // Check if already in NZ format
    if (DateUtils.isValidNZ(dateStr)) {
      return dateStr;
    }
    
    // Try to convert ISO date (YYYY-MM-DD) to NZ format
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const nzDate = `${day}-${month}-${year}`;
      
      if (DateUtils.isValidNZ(nzDate)) {
        result.warnings.push(`Imported non-NZ date; converted to DD-MM-YYYY at row ${rowNumber}`);
        return nzDate;
      }
    }
    
    result.errors.push({ row: rowNumber, msg: `Invalid date ${fieldName}: ${dateStr}` });
    return '';
  }

  /**
   * Parse integer field
   * @param {string} value - Value to parse
   * @param {number} rowNumber - Row number for error reporting
   * @param {string} fieldName - Field name for error reporting
   * @param {Object} result - Result object to add errors/warnings
   * @returns {number} Parsed integer
   * @private
   */
  _parseInteger(value, rowNumber, fieldName, result) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      result.errors.push({ row: rowNumber, msg: `Invalid ${fieldName}: ${value}` });
      return 0;
    }
    return parsed;
  }

  /**
   * Parse JSON field
   * @param {string} value - JSON string to parse
   * @param {number} rowNumber - Row number for error reporting
   * @param {string} fieldName - Field name for error reporting
   * @param {Object} result - Result object to add errors/warnings
   * @returns {*} Parsed JSON or empty array
   * @private
   */
  _parseJSON(value, rowNumber, fieldName, result) {
    if (!value || value === '[]') {
      return [];
    }
    
    try {
      return JSON.parse(value);
    } catch (error) {
      result.errors.push({ row: rowNumber, msg: `Invalid JSON in ${fieldName}: ${error.message}` });
      return [];
    }
  }

  /**
   * Map status from simple format to valid status
   * @param {string} status - Status from CSV
   * @returns {string} Valid status
   * @private
   */
  _mapStatus(status) {
    const statusMap = {
      'concept design': 'concept-design',
      'concept-design': 'concept-design',
      'solution design': 'solution-design',
      'solution-design': 'solution-design',
      'engineering': 'engineering',
      'uat': 'uat',
      'release': 'release'
    };
    
    return statusMap[status.toLowerCase()] || 'concept-design';
  }

  /**
   * Map lane from simple format to valid lane
   * @param {string} lane - Lane from CSV
   * @returns {string} Valid lane
   * @private
   */
  _mapLane(lane) {
    const laneMap = {
      'office365': 'office365',
      'office 365': 'office365',
      'euc': 'euc',
      'compliance': 'compliance',
      'other': 'other'
    };
    
    return laneMap[lane.toLowerCase()] || 'other';
  }

  /**
   * Escape CSV field value
   * @param {string} value - Value to escape
   * @returns {string} Escaped value
   * @private
   */
  _escapeCSVField(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    // If value contains comma, newline, or quote, wrap in quotes
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      // Escape internal quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return value;
  }
}