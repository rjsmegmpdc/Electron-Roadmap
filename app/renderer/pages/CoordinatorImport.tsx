/**
 * Financial Coordinator - Import Manager
 * Handles CSV import for:
 * - SAP Timesheets
 * - SAP Actuals
 * - Labour Rates
 */

import React, { useState } from 'react';
import '../styles/coordinator.css';

type ImportType = 'timesheets' | 'actuals' | 'labour-rates';

interface ImportResult {
  success: boolean;
  processed?: number;
  imported?: number;
  failed?: number;
  errors?: string[];
  message?: string;
}

export const CoordinatorImport: React.FC = () => {
  // State for form
  const [importType, setImportType] = useState<ImportType>('timesheets');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fiscalYear, setFiscalYear] = useState('FY26');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setSelectedFile(file || null);
    setError(null);
    setResult(null);
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // Read file as text
      const csvData = await selectedFile.text();

      // Call backend based on type
      let response: ImportResult;
      
      if (importType === 'timesheets') {
        response = await window.electronAPI.request('coordinator:import:timesheets', csvData);
      } else if (importType === 'actuals') {
        response = await window.electronAPI.request('coordinator:import:actuals', csvData);
      } else {
        response = await window.electronAPI.request('coordinator:import:labour-rates', { 
          csvData, 
          fiscalYear 
        });
      }

      setResult(response);
      
      // Clear file input on success
      if (response.success) {
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get import type description
  const getImportDescription = () => {
    switch (importType) {
      case 'timesheets':
        return 'SAP CATS timesheet data (employees, hours, WBSE)';
      case 'actuals':
        return 'SAP FI actuals (software, hardware, contractor costs)';
      case 'labour-rates':
        return 'Labour rates by Band/Activity Type for forecasting';
      default:
        return '';
    }
  };

  // Get required columns hint
  const getRequiredColumns = () => {
    switch (importType) {
      case 'timesheets':
        return 'Stream, Month, Personnel Number, Date (DD-MM-YYYY), Activity Type, WBSE, Hours';
      case 'actuals':
        return 'Month, Posting Date, Cost Element, WBSE, Value in NZD';
      case 'labour-rates':
        return 'Band, Activity Type, Hourly Rate, Daily Rate';
      default:
        return '';
    }
  };

  return (
    <div className="coordinator-import">
      <div className="import-container">
        <h1>💼 Import Financial Data</h1>
        <p className="subtitle">Upload SAP exports to populate the financial database</p>

        {/* Import Type Selector */}
        <div className="form-section">
          <label htmlFor="import-type" className="label">Import Type *</label>
          <select 
            id="import-type"
            value={importType} 
            onChange={(e) => {
              setImportType(e.target.value as ImportType);
              setSelectedFile(null);
              setResult(null);
              setError(null);
            }}
            className="select-input"
          >
            <option value="timesheets">SAP Timesheets (CATS)</option>
            <option value="actuals">SAP Actuals (FI)</option>
            <option value="labour-rates">Labour Rates</option>
          </select>
          <p className="hint-text">{getImportDescription()}</p>
        </div>

        {/* File Input */}
        <div className="form-section">
          <label htmlFor="file-input" className="label">Select CSV File *</label>
          <input 
            id="file-input"
            type="file" 
            accept=".csv" 
            onChange={handleFileSelect}
            disabled={isLoading}
            className="file-input"
          />
          {selectedFile && (
            <p className="file-selected">
              ✓ Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
          <p className="hint-text">Required columns: {getRequiredColumns()}</p>
        </div>

        {/* Fiscal Year (only for labour rates) */}
        {importType === 'labour-rates' && (
          <div className="form-section">
            <label htmlFor="fiscal-year" className="label">Fiscal Year *</label>
            <input 
              id="fiscal-year"
              type="text" 
              value={fiscalYear} 
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="e.g., FY26"
              className="text-input"
              disabled={isLoading}
            />
            <p className="hint-text">Existing rates for this year will be replaced</p>
          </div>
        )}

        {/* Import Button */}
        <div className="button-group">
          <button 
            onClick={handleImport} 
            disabled={isLoading || !selectedFile}
            className="button button-primary"
          >
            {isLoading ? '⏳ Importing...' : '📤 Import'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <p><strong>❌ Error:</strong> {error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className={`alert ${result.success ? 'alert-success' : 'alert-warning'}`}>
            <h3>{result.success ? '✅ Import Successful' : '⚠️ Import Completed with Issues'}</h3>
            
            {result.processed !== undefined && (
              <div className="result-stats">
                <div className="stat-row">
                  <span className="stat-label">Total Rows:</span>
                  <span className="stat-value">{result.processed}</span>
                </div>
                {result.imported !== undefined && (
                  <div className="stat-row">
                    <span className="stat-label">Imported:</span>
                    <span className="stat-value success">{result.imported}</span>
                  </div>
                )}
                {result.failed !== undefined && result.failed > 0 && (
                  <div className="stat-row">
                    <span className="stat-label">Failed:</span>
                    <span className="stat-value error">{result.failed}</span>
                  </div>
                )}
              </div>
            )}

            {result.message && (
              <p className="result-message">{result.message}</p>
            )}

            {/* Error List */}
            {result.errors && result.errors.length > 0 && (
              <div className="error-list">
                <h4>Errors ({result.errors.length} total)</h4>
                <ul>
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      <code>{err}</code>
                    </li>
                  ))}
                </ul>
                {result.errors.length > 10 && (
                  <p className="more-errors">
                    ... and {result.errors.length - 10} more errors (see console for full list)
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="help-section">
          <h3>📋 Import Guide</h3>
          
          {importType === 'timesheets' && (
            <div className="help-content">
              <p><strong>Timesheets ("Time Tracking" sheet):</strong></p>
              <ul>
                <li>Export from SAP CATS system Time Tracking sheet</li>
                <li>Columns: Stream, Month, Name, Personnel Number, Date, Activity Type, General receiver, Number (unit)</li>
                <li>Date format: Use date values (will be auto-converted)</li>
                <li>Hours in "Number (unit)" column as positive numbers (decimal supported)</li>
                <li>Activity Types: N4_CAP, N4_OPX, N5_CAP, N5_OPX, etc.</li>
                <li>WBSE format: N.93003271.*** (from "General receiver" column)</li>
              </ul>
              <p className="example">Example: OneIntune | October | Abbie AllHouse | 19507812 | 2025-10-31 | N4_CAP | N.93003271.004 | 8.0</p>
            </div>
          )}
          
          {importType === 'actuals' && (
            <div className="help-content">
              <p><strong>Actuals ("Actuals" sheet):</strong></p>
              <ul>
                <li>Export from SAP FI system Actuals sheet</li>
                <li>Columns: Month, Posting Date, Document Date, Cost Element, WBS element, Value in Obj. Crcy</li>
                <li>Auto-categorized by Cost Element: Software (115*), Hardware (116*), Professional Services, etc.</li>
                <li>Currency: NZD (no conversion needed)</li>
                <li>WBS element format: N.93003271.*** (identifies project and cost type)</li>
                <li>Value format: Positive numbers, decimals supported (e.g., 555.78)</li>
              </ul>
              <p className="example">Example: October | 2025-10-17 | 2025-10-10 | 11513000 | N.93003271.005 | 1250.50</p>
            </div>
          )}
          
          {importType === 'labour-rates' && (
            <div className="help-content">
              <p><strong>Labour Rates ("Labour Rates" sheet):</strong></p>
              <ul>
                <li>Import from Labour Rates sheet</li>
                <li>Columns: Band, Local Band, Activity Type, Hourly Rate, Daily Rate</li>
                <li>Rates by Band and Activity Type (N4_CAP, N4_OPX, N5_CAP, N5_OPX, etc.)</li>
                <li>Hourly Rate format: $92.63 or 92.63 (currency symbol optional)</li>
                <li>Daily Rate format: $741.01 or 741.01 (should equal Hourly Rate × 8)</li>
                <li>Replaces ALL existing rates for the specified fiscal year (FY26, FY27, etc.)</li>
              </ul>
              <p className="example">Example: CAPEX BAND H (N4_CAP) | Local Band H | N4_CAP | $92.63 | $741.01</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
