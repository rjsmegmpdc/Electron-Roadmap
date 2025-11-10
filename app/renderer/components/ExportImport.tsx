import React, { useState } from 'react';

interface DataArea {
  id: string;
  label: string;
  description: string;
  tableName: string;
}

const DATA_AREAS: DataArea[] = [
  {
    id: 'projects',
    label: 'Projects',
    description: 'Project roadmap data with dates, budgets, and status',
    tableName: 'projects'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Task definitions linked to projects',
    tableName: 'tasks'
  },
  {
    id: 'work_items',
    label: 'Work Items (Epics, Features, Dependencies)',
    description: 'Complete work item hierarchy: epics → features with dependencies',
    tableName: 'work_items'
  },
  {
    id: 'calendar_months',
    label: 'Calendar Configuration',
    description: 'Working days and hours per month',
    tableName: 'calendar_months'
  },
  {
    id: 'public_holidays',
    label: 'Public Holidays',
    description: 'Holiday definitions with recurrence',
    tableName: 'public_holidays'
  },
  {
    id: 'app_settings',
    label: 'Application Settings',
    description: 'User preferences and configuration',
    tableName: 'app_settings'
  },
  {
    id: 'ado_config',
    label: 'ADO Configuration',
    description: 'Azure DevOps integration settings (tokens encrypted)',
    tableName: 'ado_config'
  },
  {
    id: 'ado_tags',
    label: 'ADO Tags',
    description: 'Tag categories and values for ADO',
    tableName: 'ado_tags'
  },
  {
    id: 'epic_feature_config',
    label: 'Epic & Feature Configuration',
    description: 'Default values for Epic and Feature creation (Common, Epic, Feature defaults, Iterations & Paths)',
    tableName: 'epic_feature_config'
  },
  {
    id: 'financial_resources',
    label: 'Resources',
    description: 'Resource master data (FTE, SOW, External Squad)',
    tableName: 'financial_resources'
  }
];

interface Template {
  filename: string;
  displayName: string;
  path: string;
}

export const ExportImport: React.FC = () => {
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [operation, setOperation] = useState<'export' | 'import' | 'templates'>('export');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [importResults, setImportResults] = useState<Array<{ area: string; success: boolean; message: string; rowsProcessed?: number }>>([]);
  const [showWorkItemsDetail, setShowWorkItemsDetail] = useState(false);
  const [epicFeatureConfigOptions, setEpicFeatureConfigOptions] = useState({
    includeDefaults: true,
    includeTeamMembers: true,
    includePaths: true
  });
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load templates on component mount
  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await window.electronAPI.listTemplates();
      if (result.success) {
        setTemplates(result.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleOpenTemplate = async (templateName: string) => {
    try {
      const result = await window.electronAPI.openTemplate(templateName);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Template opened successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to open template' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to open template: ${error.message}` });
    }
  };

  const toggleArea = (areaId: string) => {
    const newSelected = new Set(selectedAreas);
    if (newSelected.has(areaId)) {
      newSelected.delete(areaId);
    } else {
      newSelected.add(areaId);
    }
    setSelectedAreas(newSelected);
  };

  const selectAll = () => {
    setSelectedAreas(new Set(DATA_AREAS.map(area => area.id)));
  };

  const deselectAll = () => {
    setSelectedAreas(new Set());
  };

  const handleExport = async () => {
    if (selectedAreas.size === 0) {
      setMessage({ type: 'warning', text: 'Please select at least one data area to export' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Export selected areas (file dialog is handled by IPC handler)
      const exportResult = await window.electronAPI.exportData({
        areas: Array.from(selectedAreas),
        epicFeatureConfigOptions: selectedAreas.has('epic_feature_config') ? epicFeatureConfigOptions : undefined
      });

      if (exportResult.success && exportResult.data) {
        const filesCreated = exportResult.data.filesCreated || 0;
        setMessage({ 
          type: 'success', 
          text: `Successfully exported ${filesCreated} file(s)` 
        });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errors = exportResult.errors || [];
        if (errors.includes('Export canceled by user')) {
          // User canceled, no error message needed
          setMessage(null);
        } else {
          setMessage({ 
            type: 'error', 
            text: `Export failed: ${errors.join(', ')}` 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `Export failed: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedAreas.size === 0) {
      setMessage({ type: 'warning', text: 'Please select at least one data area to import' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    setMessage(null);
    setImportResults([]);

    try {
      // Import selected areas (file dialog is handled by IPC handler)
      const importResult = await window.electronAPI.importData({
        areas: Array.from(selectedAreas)
      });

      if (importResult.success && importResult.data) {
        const results = importResult.data.results || [];
        setImportResults(results);
        
        const allSuccess = results.every(r => r.success);
        if (allSuccess) {
          setMessage({ 
            type: 'success', 
            text: `Successfully imported all selected data areas` 
          });
        } else {
          setMessage({ 
            type: 'warning', 
            text: `Import completed with some errors. See details below.` 
          });
        }
        
        // Dispatch event to notify components to reload their data
        window.dispatchEvent(new CustomEvent('data-imported', {
          detail: { areas: Array.from(selectedAreas), results }
        }));
      } else {
        const errors = importResult.errors || [];
        if (errors.includes('Import canceled by user')) {
          // User canceled, no error message needed
          setMessage(null);
        } else {
          setMessage({ 
            type: 'error', 
            text: `Import failed: ${errors.join(', ')}` 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `Import failed: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const getMessageStyle = (type: 'success' | 'error' | 'warning') => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '20px',
      fontSize: '14px',
      fontWeight: '500'
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#2c3e50' }}>
          Export & Import Data
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Export your data to CSV files or import data from previously exported files. 
          All formats are preserved and validated on import.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div style={getMessageStyle(message.type)}>
          {message.text}
        </div>
      )}

      {/* Operation Toggle */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '16px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px', display: 'block' }}>
          Select Operation
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setOperation('export')}
            className={operation === 'export' ? 'btn primary' : 'btn secondary'}
            style={{ flex: 1, padding: '10px 16px', fontSize: '14px' }}
          >
            📤 Export Data
          </button>
          <button
            onClick={() => setOperation('import')}
            className={operation === 'import' ? 'btn primary' : 'btn secondary'}
            style={{ flex: 1, padding: '10px 16px', fontSize: '14px' }}
          >
            📥 Import Data
          </button>
          <button
            onClick={() => setOperation('templates')}
            className={operation === 'templates' ? 'btn primary' : 'btn secondary'}
            style={{ flex: 1, padding: '10px 16px', fontSize: '14px' }}
          >
            📋 CSV Templates
          </button>
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
          {operation === 'export' 
            ? 'Export selected data areas to CSV files in a ZIP archive' 
            : operation === 'import'
            ? 'Import data from CSV files. Data will be validated before insertion.'
            : 'Download CSV templates with the correct format for importing data'}
        </p>
      </div>

      {/* Templates View */}
      {operation === 'templates' && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2c3e50' }}>
            CSV Import Templates
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
            Download CSV templates with the correct format and sample data. Edit the files with your own data and use the Import tab to upload them.
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '16px' 
          }}>
            {templates.map((template) => (
              <div
                key={template.filename}
                style={{
                  padding: '16px',
                  border: '2px solid #dee2e6',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    marginBottom: '4px'
                  }}>
                    📄 {template.displayName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {template.filename}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenTemplate(template.filename.replace('-template.csv', ''))}
                  className="btn primary"
                  style={{ width: '100%', padding: '8px 16px', fontSize: '14px' }}
                >
                  📂 Open Template
                </button>
              </div>
            ))}
          </div>
          
          {templates.length === 0 && (
            <div style={{ 
              padding: '32px', 
              textAlign: 'center', 
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              No templates available
            </div>
          )}
        </div>
      )}

      {/* Data Area Selection */}
      {operation !== 'templates' && <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>
            Select Data Areas
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={selectAll}
              className="btn secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="btn secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Deselect All
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '12px' 
        }}>
          {DATA_AREAS.map(area => (
            <div key={area.id}>
              <div
                onClick={() => toggleArea(area.id)}
                style={{
                  padding: '12px',
                  border: `2px solid ${selectedAreas.has(area.id) ? '#00A45F' : '#dee2e6'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: selectedAreas.has(area.id) ? '#f0f9f4' : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={selectedAreas.has(area.id)}
                    onChange={() => {}}
                    style={{ marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#2c3e50',
                      marginBottom: '4px'
                    }}>
                      {area.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d', lineHeight: '1.4' }}>
                      {area.description}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Work Items Detail */}
              {area.id === 'work_items' && selectedAreas.has(area.id) && (
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                    📋 Includes:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px', color: '#6c757d', lineHeight: '1.6' }}>
                    <li><strong>epics.csv</strong> - Epic work items with project links</li>
                    <li><strong>features.csv</strong> - Features linked to epics</li>
                    <li><strong>dependencies.csv</strong> - All dependencies (FS, SS, FF, SF)</li>
                  </ul>
                  <div style={{ fontSize: '11px', color: '#856404', marginTop: '8px', fontStyle: 'italic' }}>
                    💡 All three files maintain relational integrity on import
                  </div>
                </div>
              )}
              
              {/* Epic & Feature Config Options */}
              {area.id === 'epic_feature_config' && selectedAreas.has(area.id) && operation === 'export' && (
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                    ⚙️ Export Options:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={epicFeatureConfigOptions.includeDefaults}
                        onChange={(e) => setEpicFeatureConfigOptions(prev => ({ ...prev, includeDefaults: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Defaults (Priority, Value Area, Area/Iteration Paths)</span>
                    </label>
                    <label style={{ fontSize: '11px', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={epicFeatureConfigOptions.includeTeamMembers}
                        onChange={(e) => setEpicFeatureConfigOptions(prev => ({ ...prev, includeTeamMembers: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Team Members (Owners, Leads, Tags)</span>
                    </label>
                    <label style={{ fontSize: '11px', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={epicFeatureConfigOptions.includePaths}
                        onChange={(e) => setEpicFeatureConfigOptions(prev => ({ ...prev, includePaths: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Iterations & Custom Area Paths</span>
                    </label>
                  </div>
                  <div style={{ fontSize: '11px', color: '#856404', marginTop: '8px', fontStyle: 'italic' }}>
                    💡 Unchecked files will not be included in export
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <p style={{ 
          margin: '12px 0 0 0', 
          fontSize: '12px', 
          color: '#6c757d',
          fontStyle: 'italic'
        }}>
          Selected: {selectedAreas.size} of {DATA_AREAS.length} data areas
        </p>
      </div>}

      {/* Action Button */}
      {operation !== 'templates' && <div style={{ marginBottom: '24px' }}>
        <button
          onClick={operation === 'export' ? handleExport : handleImport}
          disabled={loading || selectedAreas.size === 0}
          className="btn primary"
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px',
            width: '100%',
            opacity: loading || selectedAreas.size === 0 ? 0.6 : 1
          }}
        >
          {loading 
            ? `${operation === 'export' ? 'Exporting' : 'Importing'}...` 
            : operation === 'export' 
            ? '📤 Export Selected Data' 
            : '📥 Import Selected Data'}
        </button>
      </div>}

      {/* Import Results */}
      {importResults.length > 0 && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2c3e50' }}>
            Import Results
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {importResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: `1px solid ${result.success ? '#28a745' : '#dc3545'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: '600',
                    color: result.success ? '#28a745' : '#dc3545'
                  }}>
                    {result.success ? '✓' : '✗'} {result.area}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                    {result.message}
                    {result.rowsProcessed && ` (${result.rowsProcessed} rows)`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format Information */}
      <div style={{ 
        marginTop: '24px',
        padding: '16px', 
        backgroundColor: '#e7f3ff',
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#004085' }}>
          ℹ️ Format Requirements
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#004085', lineHeight: '1.6' }}>
          <li><strong>Dates:</strong> Must be in DD-MM-YYYY format (e.g., 25-12-2024)</li>
          <li><strong>Currency:</strong> NZD amounts with max 2 decimal places (e.g., 1,234.56)</li>
          <li><strong>Status:</strong> planned, in-progress, blocked, done, or archived</li>
          <li><strong>Financial Treatment:</strong> CAPEX or OPEX</li>
          <li><strong>Dependencies:</strong> Valid relationship types (FS, SS, FF, SF)</li>
          <li><strong>Work Items:</strong> Exported as 3 separate CSV files (epics.csv, features.csv, dependencies.csv) in a single ZIP</li>
          <li><strong>Relationships:</strong> Features reference epics via epic_id; dependencies reference projects/tasks via from_id/to_id</li>
          <li><strong>Headers:</strong> All CSV files must include proper column headers</li>
          <li><strong>Encoding:</strong> UTF-8 encoding required</li>
        </ul>
      </div>
    </div>
  );
};
