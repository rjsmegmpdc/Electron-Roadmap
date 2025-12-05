/**
 * Financial Coordinator - Resource Commitment Tracker
 * Allows users to define: "I can commit X hours per [day/week/fortnight]"
 * Tracks available capacity for resource allocation
 */

import React, { useState, useEffect } from 'react';
import '../styles/coordinator.css';

type CommitmentType = 'per-day' | 'per-week' | 'per-fortnight';

interface Resource {
  id: number;
  resource_name: string;
  personnel_number?: string;
  activity_type_cap?: string;
  activity_type_opx?: string;
}

interface CommitmentResult {
  success: boolean;
  resource_id: number;
  resource_name: string;
  total_available_hours: number;
  remaining_capacity: number;
  message?: string;
}

export const ResourceCommitment: React.FC = () => {
  // State for resources dropdown
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [showCreateResource, setShowCreateResource] = useState(false);
  
  // State for form
  const [selectedResource, setSelectedResource] = useState('');
  const [periodStart, setPeriodStart] = useState('01-04-2025'); // DD-MM-YYYY format
  const [periodEnd, setPeriodEnd] = useState('30-06-2025');
  const [commitmentType, setCommitmentType] = useState<CommitmentType>('per-day');
  const [committedHours, setCommittedHours] = useState('6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for feedback
  const [result, setResult] = useState<CommitmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resourceCreationResult, setResourceCreationResult] = useState<any>(null);
  const [resourceCreationError, setResourceCreationError] = useState<string | null>(null);
  const [isCreatingResource, setIsCreatingResource] = useState(false);

  // State for resource creation form
  const [resourceForm, setResourceForm] = useState({
    resource_name: '',
    contract_type: 'FTE' as 'FTE' | 'SOW' | 'External Squad',
    email: '',
    work_area: '',
    activity_type_cap: '',
    activity_type_opx: '',
    employee_id: ''
  });

  // Load resources on mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoadingResources(true);
        setError(null);
        const data = await window.electronAPI.request('coordinator:resources:list');
        setResources(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(`Failed to load resources: ${err.message || 'Unknown error'}`);
        console.error('Load resources error:', err);
      } finally {
        setIsLoadingResources(false);
      }
    };
    
    loadResources();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedResource) {
      setError('Please select a resource');
      return;
    }
    
    if (!periodStart || !periodEnd) {
      setError('Please enter both period start and end dates');
      return;
    }
    
    if (!committedHours || parseFloat(committedHours) <= 0) {
      setError('Please enter a positive number of hours');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setResult(null);

      const response = await window.electronAPI.request('coordinator:commitment:create', {
        resource_id: parseInt(selectedResource),
        period_start: periodStart,
        period_end: periodEnd,
        commitment_type: commitmentType,
        committed_hours: parseFloat(committedHours),
      });

      setResult(response);
      
      // Reset form on success
      if (response.success) {
        setSelectedResource('');
        setPeriodStart('01-04-2025');
        setPeriodEnd('30-06-2025');
        setCommittedHours('6');
        setCommitmentType('per-day');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create commitment');
      console.error('Create commitment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resource creation
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!resourceForm.resource_name.trim()) {
      setResourceCreationError('Resource name is required');
      return;
    }
    
    if (!resourceForm.contract_type) {
      setResourceCreationError('Contract type is required');
      return;
    }

    try {
      setIsCreatingResource(true);
      setResourceCreationError(null);
      setResourceCreationResult(null);

      const response = await window.electronAPI.request('coordinator:resource:create', resourceForm);
      
      setResourceCreationResult(response);
      
      // Reset form
      setResourceForm({
        resource_name: '',
        contract_type: 'FTE',
        email: '',
        work_area: '',
        activity_type_cap: '',
        activity_type_opx: '',
        employee_id: ''
      });
      
      // Reload resources list
      const data = await window.electronAPI.request('coordinator:resources:list');
      setResources(Array.isArray(data) ? data : []);
      
      // Close form after success
      setTimeout(() => setShowCreateResource(false), 1500);
    } catch (err: any) {
      setResourceCreationError(err.message || 'Failed to create resource');
      console.error('Create resource error:', err);
    } finally {
      setIsCreatingResource(false);
    }
  };

  // Calculate total hours based on commitment type and period
  const calculateTotalHours = () => {
    const hoursValue = parseFloat(committedHours) || 0;
    if (!periodStart || !periodEnd) return 0;

    // Parse dates (DD-MM-YYYY format)
    const [startDay, startMonth, startYear] = periodStart.split('-').map(Number);
    const [endDay, endMonth, endYear] = periodEnd.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    switch (commitmentType) {
      case 'per-day':
        return hoursValue * daysDiff;
      case 'per-week':
        return hoursValue * Math.ceil(daysDiff / 7);
      case 'per-fortnight':
        return hoursValue * Math.ceil(daysDiff / 14);
      default:
        return 0;
    }
  };

  const estimatedTotal = calculateTotalHours();

  return (
    <div className="coordinator-commitment">
      <div className="commitment-container">
        <h1>📅 Resource Commitment Tracker</h1>
        <p className="subtitle">Define resource capacity: "I can commit X hours per [day/week/fortnight]"</p>

        {/* Create Resource Section */}
        <div className="resource-creation-section">
          <button
            type="button"
            onClick={() => setShowCreateResource(!showCreateResource)}
            className="button button-secondary"
            style={{ marginBottom: '16px', width: '100%', textAlign: 'left' }}
          >
            {showCreateResource ? '▼ Hide Resource Creation' : '▶ Create New Resource'}
          </button>

          {showCreateResource && (
            <form onSubmit={handleCreateResource} className="resource-form-container">
              <div style={{ marginBottom: '20px' }}>
                <h3>➕ Add New Resource</h3>
                <p style={{ color: '#666', fontSize: '13px', margin: '8px 0 0 0' }}
                  >Create a new resource before assigning commitments</p>
              </div>

              {/* Resource Name */}
              <div className="form-section">
                <label htmlFor="resource-name" className="label">Resource Name *</label>
                <input
                  id="resource-name"
                  type="text"
                  value={resourceForm.resource_name}
                  onChange={(e) => setResourceForm({ ...resourceForm, resource_name: e.target.value })}
                  placeholder="e.g., John Smith, Sarah Wilson"
                  disabled={isCreatingResource}
                  className="text-input"
                  required
                />
              </div>

              {/* Contract Type */}
              <div className="form-section">
                <label htmlFor="contract-type" className="label">Contract Type *</label>
                <select
                  id="contract-type"
                  value={resourceForm.contract_type}
                  onChange={(e) => setResourceForm({ ...resourceForm, contract_type: e.target.value as any })}
                  disabled={isCreatingResource}
                  className="select-input"
                  required
                >
                  <option value="FTE">FTE (Full-Time Employee)</option>
                  <option value="SOW">SOW (Statement of Work / Contractor)</option>
                  <option value="External Squad">External Squad</option>
                </select>
              </div>

              {/* Email */}
              <div className="form-section">
                <label htmlFor="resource-email" className="label">Email (Optional)</label>
                <input
                  id="resource-email"
                  type="email"
                  value={resourceForm.email}
                  onChange={(e) => setResourceForm({ ...resourceForm, email: e.target.value })}
                  placeholder="john.smith@company.com"
                  disabled={isCreatingResource}
                  className="text-input"
                />
              </div>

              {/* Work Area */}
              <div className="form-section">
                <label htmlFor="work-area" className="label">Work Area (Optional)</label>
                <input
                  id="work-area"
                  type="text"
                  value={resourceForm.work_area}
                  onChange={(e) => setResourceForm({ ...resourceForm, work_area: e.target.value })}
                  placeholder="e.g., Development, QA, Architecture"
                  disabled={isCreatingResource}
                  className="text-input"
                />
              </div>

              {/* Activity Type CAPEX */}
              <div className="form-section">
                <label htmlFor="activity-cap" className="label">Activity Type - CAPEX (Optional)</label>
                <input
                  id="activity-cap"
                  type="text"
                  value={resourceForm.activity_type_cap}
                  onChange={(e) => setResourceForm({ ...resourceForm, activity_type_cap: e.target.value })}
                  placeholder="e.g., N4_CAP, N5_CAP"
                  disabled={isCreatingResource}
                  className="text-input"
                />
                <p className="hint-text">Used for CAPEX project labour rates</p>
              </div>

              {/* Activity Type OPEX */}
              <div className="form-section">
                <label htmlFor="activity-opx" className="label">Activity Type - OPEX (Optional)</label>
                <input
                  id="activity-opx"
                  type="text"
                  value={resourceForm.activity_type_opx}
                  onChange={(e) => setResourceForm({ ...resourceForm, activity_type_opx: e.target.value })}
                  placeholder="e.g., N4_OPX, N5_OPX"
                  disabled={isCreatingResource}
                  className="text-input"
                />
                <p className="hint-text">Used for OPEX project labour rates</p>
              </div>

              {/* Employee ID */}
              <div className="form-section">
                <label htmlFor="employee-id" className="label">Employee ID (Optional)</label>
                <input
                  id="employee-id"
                  type="text"
                  value={resourceForm.employee_id}
                  onChange={(e) => setResourceForm({ ...resourceForm, employee_id: e.target.value })}
                  placeholder="e.g., SAP Personnel Number"
                  disabled={isCreatingResource}
                  className="text-input"
                />
              </div>

              {/* Resource Creation Error */}
              {resourceCreationError && (
                <div className="alert alert-error">
                  <p><strong>❌ Error:</strong> {resourceCreationError}</p>
                </div>
              )}

              {/* Resource Creation Result */}
              {resourceCreationResult && (
                <div className="alert alert-success">
                  <h3>✅ Resource Created</h3>
                  <p><strong>Name:</strong> {resourceCreationResult.resource_name}</p>
                  <p><strong>Type:</strong> {resourceCreationResult.contract_type}</p>
                  <p>{resourceCreationResult.message}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="button-group">
                <button
                  type="submit"
                  disabled={isCreatingResource}
                  className="button button-primary"
                >
                  {isCreatingResource ? '⏳ Creating...' : '✅ Create Resource'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateResource(false);
                    setResourceForm({
                      resource_name: '',
                      contract_type: 'FTE',
                      email: '',
                      work_area: '',
                      activity_type_cap: '',
                      activity_type_opx: '',
                      employee_id: ''
                    });
                    setResourceCreationError(null);
                    setResourceCreationResult(null);
                  }}
                  className="button button-secondary"
                  style={{ marginLeft: '8px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Commitment Form */}
        <form onSubmit={handleSubmit}>
          {/* Resource Selection */}
          <div className="form-section">
            <label htmlFor="resource-select" className="label">Resource *</label>
            
            {isLoadingResources ? (
              <p className="hint-text">Loading resources...</p>
            ) : (
              <>
                <select 
                  id="resource-select"
                  value={selectedResource} 
                  onChange={(e) => {
                    setSelectedResource(e.target.value);
                    setResult(null);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  className="select-input"
                  required
                >
                  <option value="">-- Select Resource --</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.resource_name} 
                      {resource.personnel_number ? ` (${resource.personnel_number})` : ''}
                    </option>
                  ))}
                </select>
                
                {resources.length === 0 && (
                  <p className="hint-text">❌ No resources found. Please import resources first.</p>
                )}
              </>
            )}
          </div>

          {/* Period Start */}
          <div className="form-section">
            <label htmlFor="period-start" className="label">Period Start (DD-MM-YYYY) *</label>
            <input 
              id="period-start"
              type="text" 
              value={periodStart} 
              onChange={(e) => setPeriodStart(e.target.value)}
              placeholder="01-04-2025"
              disabled={isSubmitting}
              className="text-input"
              required
            />
            <p className="hint-text">Example: 01-04-2025 for 1st April 2025</p>
          </div>

          {/* Period End */}
          <div className="form-section">
            <label htmlFor="period-end" className="label">Period End (DD-MM-YYYY) *</label>
            <input 
              id="period-end"
              type="text" 
              value={periodEnd} 
              onChange={(e) => setPeriodEnd(e.target.value)}
              placeholder="30-06-2025"
              disabled={isSubmitting}
              className="text-input"
              required
            />
            <p className="hint-text">Example: 30-06-2025 for 30th June 2025 (end of Q1)</p>
          </div>

          {/* Commitment Type & Hours - Two columns */}
          <div className="form-row">
            <div className="form-section">
              <label htmlFor="commitment-type" className="label">Per *</label>
              <select 
                id="commitment-type"
                value={commitmentType} 
                onChange={(e) => setCommitmentType(e.target.value as CommitmentType)}
                disabled={isSubmitting}
                className="select-input"
              >
                <option value="per-day">Day</option>
                <option value="per-week">Week</option>
                <option value="per-fortnight">Fortnight</option>
              </select>
            </div>

            <div className="form-section">
              <label htmlFor="committed-hours" className="label">Committed Hours *</label>
              <input 
                id="committed-hours"
                type="number" 
                value={committedHours} 
                onChange={(e) => setCommittedHours(e.target.value)}
                min="0"
                max="24"
                step="0.5"
                disabled={isSubmitting}
                className="text-input"
                required
              />
              <p className="hint-text">e.g., 6 for 6 hours per {commitmentType.replace('per-', '')}</p>
            </div>
          </div>

          {/* Estimated Total */}
          {estimatedTotal > 0 && (
            <div className="estimate-box">
              <p><strong>Estimated Total Available Hours:</strong> <span className="hours-value">{estimatedTotal.toFixed(1)}</span></p>
              <p className="estimate-subtext">
                Based on {estimatedTotal.toFixed(0)} hours per {commitmentType.replace('per-', '')} 
                from {periodStart} to {periodEnd}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="button-group">
            <button 
              type="submit" 
              disabled={isSubmitting || isLoadingResources}
              className="button button-primary"
            >
              {isSubmitting ? '⏳ Creating...' : '✅ Create Commitment'}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <p><strong>❌ Error:</strong> {error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className={`alert ${result.success ? 'alert-success' : 'alert-warning'}`}>
            <h3>{result.success ? '✅ Commitment Created' : '⚠️ Commitment Saved'}</h3>
            <div className="result-details">
              <p><strong>Resource:</strong> {result.resource_name}</p>
              <p><strong>Total Available Hours:</strong> <span className="highlight">{result.total_available_hours.toFixed(1)}</span></p>
              <p><strong>Remaining Capacity:</strong> <span className="highlight">{result.remaining_capacity.toFixed(1)}</span></p>
              {result.message && <p><strong>Message:</strong> {result.message}</p>}
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="info-box">
          <h4>📌 How It Works</h4>
          <ul>
            <li><strong>Resource:</strong> Select an employee or contractor</li>
            <li><strong>Period:</strong> Define the date range (e.g., Q1 FY26)</li>
            <li><strong>Commitment:</strong> Specify available capacity (e.g., "6 hours per day")</li>
            <li><strong>Total Hours:</strong> Automatically calculated based on period and frequency</li>
            <li><strong>Remaining Capacity:</strong> Tracks hours not yet allocated to features</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
