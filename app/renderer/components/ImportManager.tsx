import React, { useState } from 'react';

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

interface ImportManagerProps {
  onImportComplete?: () => void;
}

export function ImportManager({ onImportComplete }: ImportManagerProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'timesheets' | 'actuals' | 'labour-rates' | 'resources'>('timesheets');
  const [fiscalYear, setFiscalYear] = useState('FY26');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setResult(null);

    try {
      // Read file content
      const text = await selectedFile.text();

      // Call appropriate IPC handler
      let importResult: ImportResult;
      
      switch (importType) {
        case 'timesheets':
          importResult = await window.electronAPI.coordinator?.importTimesheets(text) || {
            success: false,
            recordsProcessed: 0,
            recordsImported: 0,
            recordsFailed: 0,
            errors: [{ row: 0, message: 'Coordinator API not available', severity: 'error' as const }],
            warnings: []
          };
          break;
        
        case 'actuals':
          importResult = await window.electronAPI.coordinator?.importActuals(text) || {
            success: false,
            recordsProcessed: 0,
            recordsImported: 0,
            recordsFailed: 0,
            errors: [{ row: 0, message: 'Coordinator API not available', severity: 'error' as const }],
            warnings: []
          };
          break;
        
        case 'labour-rates':
          importResult = await window.electronAPI.coordinator?.importLabourRates(text, fiscalYear) || {
            success: false,
            recordsProcessed: 0,
            recordsImported: 0,
            recordsFailed: 0,
            errors: [{ row: 0, message: 'Coordinator API not available', severity: 'error' as const }],
            warnings: []
          };
          break;
        
        case 'resources':
          importResult = await window.electronAPI.coordinator?.importResources(text) || {
            success: false,
            recordsProcessed: 0,
            recordsImported: 0,
            recordsFailed: 0,
            errors: [{ row: 0, message: 'Coordinator API not available', severity: 'error' as const }],
            warnings: []
          };
          break;
      }

      setResult(importResult);
      
      // Call the callback if import was successful
      if (importResult.success && onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      setResult({
        success: false,
        recordsProcessed: 0,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [{ row: 0, message: error.message, severity: 'error' }],
        warnings: []
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '24px' }}>Import Financial Data</h2>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Import Type
        </label>
        <select
          value={importType}
          onChange={(e) => setImportType(e.target.value as any)}
          style={{ 
            width: '100%', 
            padding: '8px', 
            borderRadius: '4px', 
            border: '1px solid #ccc' 
          }}
        >
          <option value="timesheets">Timesheets (SAP CATS)</option>
          <option value="actuals">Actuals (SAP FI)</option>
          <option value="labour-rates">Labour Rates</option>
          <option value="resources">Resources</option>
        </select>
      </div>

      {importType === 'labour-rates' && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Fiscal Year
          </label>
          <input
            type="text"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            placeholder="FY26"
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ccc' 
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'block', marginBottom: '8px' }}
        />
        {selectedFile && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </div>
        )}
      </div>

      <button
        onClick={handleImport}
        disabled={!selectedFile || importing}
        style={{
          padding: '10px 24px',
          backgroundColor: !selectedFile || importing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedFile || importing ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        {importing ? 'Importing...' : 'Import'}
      </button>

      {result && (
        <div 
          style={{ 
            marginTop: '24px', 
            padding: '16px', 
            borderRadius: '8px',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Import Result</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Processed</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{result.recordsProcessed}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Imported</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {result.recordsImported}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Failed</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                {result.recordsFailed}
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ marginBottom: '8px' }}>Errors ({result.errors.length})</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {result.errors.slice(0, 10).map((error, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '8px', 
                      marginBottom: '4px', 
                      backgroundColor: error.severity === 'error' ? '#f8d7da' : '#fff3cd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>Row {error.row}</span>
                    {error.field && <span style={{ color: '#666' }}> - {error.field}</span>}
                    : {error.message}
                  </div>
                ))}
                {result.errors.length > 10 && (
                  <div style={{ padding: '8px', color: '#666', fontSize: '14px' }}>
                    ... and {result.errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
