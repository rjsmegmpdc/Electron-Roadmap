// app/renderer/components/ResourceManagement.tsx
import React, { useState, useEffect } from 'react';

interface Resource {
  id: number;
  roadmap_resource_id: string | null;
  resource_name: string;
  email: string | null;
  work_area: string | null;
  activity_type_cap: string | null;
  activity_type_opx: string | null;
  contract_type: 'FTE' | 'SOW' | 'External Squad';
  employee_id: string | null;
  ado_identity_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  title: string;
}

interface Epic {
  id: string;
  title: string;
  project_id: string;
}

interface Feature {
  id: string;
  title: string;
  epic_id: string;
  project_id: string;
}

interface Allocation {
  id: string;
  resource_id: number;
  feature_id: string;
  epic_id: string;
  project_id: string;
  allocated_hours: number;
  forecast_start_date: string | null;
  forecast_end_date: string | null;
  actual_hours_to_date: number;
  actual_cost_to_date: number;
  variance_hours: number;
  variance_cost: number;
  status: 'on-track' | 'at-risk' | 'over-budget';
  source: 'manual' | 'ado-sync';
  created_at: string;
  updated_at: string;
}

interface CapacityCalculation {
  resource_id: number;
  resource_name: string;
  period_start: string;
  period_end: string;
  total_capacity_hours: number;
  allocated_hours: number;
  actual_hours: number;
  remaining_capacity: number;
  utilization_percent: number;
  status: 'optimal' | 'under-utilized' | 'over-committed';
}

export const ResourceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'resources' | 'commitments' | 'allocations' | 'capacity'>('resources');
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [capacities, setCapacities] = useState<CapacityCalculation[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAllocation, setEditingAllocation] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Allocation>>({});

  // Commitment form state
  const [commitmentForm, setCommitmentForm] = useState({
    resource_id: 0,
    period_start: '',
    period_end: '',
    commitment_type: 'per-day' as const,
    committed_hours: 8,
  });

  // Allocation form state
  const [allocationForm, setAllocationForm] = useState({
    resource_id: 0,
    project_id: '',
    epic_id: '',
    feature_id: '',
    allocated_hours: 0,
    forecast_start_date: '',
    forecast_end_date: '',
  });

  useEffect(() => {
    loadResources();
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeTab === 'capacity') {
      loadCapacities();
    }
  }, [activeTab]);

  // Load epics when project changes
  useEffect(() => {
    if (allocationForm.project_id) {
      loadEpicsForProject(allocationForm.project_id);
    } else {
      setEpics([]);
      setFeatures([]);
    }
  }, [allocationForm.project_id]);

  // Load features when epic changes
  useEffect(() => {
    if (allocationForm.epic_id) {
      loadFeaturesForEpic(allocationForm.epic_id);
    } else {
      setFeatures([]);
    }
  }, [allocationForm.epic_id]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.coordinator?.getAllResources();
      setResources(result || []);
    } catch (err: any) {
      showMessage('error', `Failed to load resources: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const result = await window.electronAPI.getProjects();
      console.log('ALL PROJECTS loaded:', result);
      const cloudMigration = result?.find((p: any) => p.title?.includes('Cloud Migration'));
      console.log('Cloud Migration project:', cloudMigration);
      setProjects(result || []);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    }
  };

  // Load project details when allocation form project changes
  useEffect(() => {
    if (allocationForm.project_id) {
      const project = projects.find(p => p.id === allocationForm.project_id);
      setSelectedProject(project || null);
    } else {
      setSelectedProject(null);
    }
  }, [allocationForm.project_id, projects]);

  const loadEpicsForProject = async (projectId: string) => {
    console.log('Loading epics for project:', projectId);
    try {
      // Debug: Check all epics in database
      const allEpics = await window.electronAPI.getEpics();
      console.log('ALL epics in database:', allEpics);
      console.log('Number of epics:', allEpics?.length);
      
      const result = await window.electronAPI.getEpicsForProject(projectId);
      console.log('Epics for this project:', result);
      setEpics(result || []);
    } catch (err: any) {
      console.error('Failed to load epics:', err);
    }
  };

  const loadFeaturesForEpic = async (epicId: string) => {
    console.log('Loading features for epic:', epicId);
    try {
      const result = await window.electronAPI.getFeaturesForEpic(epicId);
      console.log('Features loaded:', result);
      setFeatures(result || []);
    } catch (err: any) {
      console.error('Failed to load features:', err);
    }
  };

  const loadCapacities = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.coordinator?.getAllCapacities();
      setCapacities(result || []);
    } catch (err: any) {
      showMessage('error', `Failed to load capacities: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllocationsForResource = async (resourceId: number) => {
    try {
      const result = await window.electronAPI.coordinator?.getAllocationsForResource({ resourceId });
      setAllocations(result || []);
    } catch (err: any) {
      showMessage('error', `Failed to load allocations: ${err.message}`);
    }
  };

  const handleCreateCommitment = async () => {
    if (!commitmentForm.resource_id || !commitmentForm.period_start || !commitmentForm.period_end) {
      showMessage('warning', 'Please fill all required fields');
      return;
    }

    try {
      await window.electronAPI.coordinator?.createCommitment(commitmentForm);
      showMessage('success', 'Commitment created successfully');
      setCommitmentForm({
        resource_id: 0,
        period_start: '',
        period_end: '',
        commitment_type: 'per-day',
        committed_hours: 8,
      });
    } catch (err: any) {
      showMessage('error', `Failed to create commitment: ${err.message}`);
    }
  };

  const handleCreateAllocation = async () => {
    if (!allocationForm.resource_id || !allocationForm.feature_id || !allocationForm.allocated_hours) {
      showMessage('warning', 'Please fill all required fields');
      return;
    }

    try {
      await window.electronAPI.coordinator?.createAllocation(allocationForm);
      showMessage('success', 'Allocation created successfully');
      setAllocationForm({
        resource_id: 0,
        project_id: '',
        epic_id: '',
        feature_id: '',
        allocated_hours: 0,
        forecast_start_date: '',
        forecast_end_date: '',
      });
      if (selectedResource) {
        loadAllocationsForResource(selectedResource.id);
      }
    } catch (err: any) {
      showMessage('error', `Failed to create allocation: ${err.message}`);
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    if (!confirm('Are you sure you want to delete this allocation?')) return;

    try {
      await window.electronAPI.coordinator?.deleteAllocation({ allocationId });
      showMessage('success', 'Allocation deleted successfully');
      if (selectedResource) {
        loadAllocationsForResource(selectedResource.id);
      }
    } catch (err: any) {
      showMessage('error', `Failed to delete allocation: ${err.message}`);
    }
  };

  const handleEditAllocation = (allocation: Allocation) => {
    setEditingAllocation(allocation.id);
    setEditForm({
      allocated_hours: allocation.allocated_hours,
      forecast_start_date: allocation.forecast_start_date,
      forecast_end_date: allocation.forecast_end_date
    });
  };

  const handleSaveAllocation = async (allocationId: string) => {
    try {
      await window.electronAPI.coordinator?.updateAllocation({ 
        allocationId, 
        updates: editForm 
      });
      showMessage('success', 'Allocation updated successfully');
      setEditingAllocation(null);
      setEditForm({});
      if (selectedResource) {
        loadAllocationsForResource(selectedResource.id);
      }
    } catch (err: any) {
      showMessage('error', `Failed to update allocation: ${err.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingAllocation(null);
    setEditForm({});
  };

  // Helper to convert DD-MM-YYYY to YYYY-MM-DD for date input
  const convertToISO = (ddmmyyyy: string | null): string => {
    if (!ddmmyyyy) return '';
    const parts = ddmmyyyy.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  // Helper to convert YYYY-MM-DD to DD-MM-YYYY
  const convertToDDMMYYYY = (isoDate: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const filteredResources = resources.filter((r) =>
    r.resource_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.contract_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal':
      case 'on-track':
        return '#28a745';
      case 'under-utilized':
      case 'at-risk':
        return '#ffc107';
      case 'over-committed':
      case 'over-budget':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getMessageStyle = (type: 'success' | 'error' | 'warning') => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '20px',
      fontSize: '14px',
      fontWeight: '500' as const
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
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>👥 Resource Management</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Manage resources, commitments, allocations, and capacity
        </p>
      </div>

      {/* Message */}
      {message && (
        <div style={getMessageStyle(message.type)}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ borderBottom: '2px solid #e9ecef', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { key: 'resources', label: '📋 Resources' },
            { key: 'commitments', label: '📅 Commitments' },
            { key: 'allocations', label: '🎯 Allocations' },
            { key: 'capacity', label: '📊 Capacity' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #007bff' : '3px solid transparent',
                color: activeTab === tab.key ? '#007bff' : '#6c757d',
                fontWeight: activeTab === tab.key ? '600' : '500',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>Resource List</h3>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                width: '300px'
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>Loading resources...</div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Contract Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Work Area</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Employee ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((resource, index) => (
                    <tr key={resource.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#2c3e50', fontWeight: '500', borderBottom: '1px solid #dee2e6' }}>{resource.resource_name}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>{resource.email || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>{resource.contract_type}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>{resource.work_area || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>{resource.employee_id || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '14px', borderBottom: '1px solid #dee2e6' }}>
                        <button
                          onClick={() => {
                            setSelectedResource(resource);
                            setActiveTab('allocations');
                            loadAllocationsForResource(resource.id);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          View Allocations
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredResources.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '14px' }}>
                        No resources found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Commitments Tab */}
      {activeTab === 'commitments' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50' }}>Create Resource Commitment</h3>
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            maxWidth: '600px'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                Resource *
              </label>
              <select
                value={commitmentForm.resource_id}
                onChange={(e) =>
                  setCommitmentForm({ ...commitmentForm, resource_id: Number(e.target.value) })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              >
                <option value={0}>Select a resource...</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.resource_name} ({r.contract_type})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                  Period Start (DD-MM-YYYY) *
                </label>
                <input
                  type="text"
                  placeholder="01-01-2024"
                  value={commitmentForm.period_start}
                  onChange={(e) =>
                    setCommitmentForm({ ...commitmentForm, period_start: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                  Period End (DD-MM-YYYY) *
                </label>
                <input
                  type="text"
                  placeholder="31-12-2024"
                  value={commitmentForm.period_end}
                  onChange={(e) =>
                    setCommitmentForm({ ...commitmentForm, period_end: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                Commitment Type
              </label>
              <select
                value={commitmentForm.commitment_type}
                onChange={(e) =>
                  setCommitmentForm({
                    ...commitmentForm,
                    commitment_type: e.target.value as any,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              >
                <option value="per-day">Per Day</option>
                <option value="per-week">Per Week</option>
                <option value="per-fortnight">Per Fortnight</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                Committed Hours *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={commitmentForm.committed_hours}
                onChange={(e) =>
                  setCommitmentForm({
                    ...commitmentForm,
                    committed_hours: Number(e.target.value),
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              onClick={handleCreateCommitment}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Create Commitment
            </button>
          </div>
        </div>
      )}

      {/* Allocations Tab */}
      {activeTab === 'allocations' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50' }}>Resource Allocations</h3>

          {selectedResource && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#e7f3ff',
              borderLeft: '4px solid #007bff',
              borderRadius: '4px'
            }}>
              <strong style={{ color: '#004085' }}>Selected Resource:</strong> {selectedResource.resource_name} ({selectedResource.contract_type})
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Allocation Form */}
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50' }}>Create New Allocation</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                  Resource *
                </label>
                <select
                  value={allocationForm.resource_id}
                  onChange={(e) => {
                    const resourceId = Number(e.target.value);
                    setAllocationForm({ ...allocationForm, resource_id: resourceId });
                    const resource = resources.find(r => r.id === resourceId);
                    if (resource) setSelectedResource(resource);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px'
                  }}
                >
                  <option value={0}>Select a resource...</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.resource_name} ({r.contract_type})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                  Project *
                </label>
                <select
                  value={allocationForm.project_id}
                  onChange={(e) => {
                    console.log('Project selected:', e.target.value);
                    console.log('Project options:', projects.map(p => ({ id: p.id, title: p.title })));
                    setAllocationForm({ 
                      ...allocationForm, 
                      project_id: e.target.value,
                      epic_id: '',
                      feature_id: ''
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                  Epic *
                </label>
                <select
                  value={allocationForm.epic_id}
                  onChange={(e) =>
                    setAllocationForm({ 
                      ...allocationForm, 
                      epic_id: e.target.value,
                      feature_id: ''
                    })
                  }
                  disabled={!allocationForm.project_id}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px',
                    backgroundColor: !allocationForm.project_id ? '#e9ecef' : 'white',
                    cursor: !allocationForm.project_id ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Select an epic...</option>
                  {epics.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
                {!allocationForm.project_id && (
                  <p style={{ fontSize: '12px', color: '#6c757d', margin: '4px 0 0 0' }}>Select a project first</p>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                  Feature *
                </label>
                <select
                  value={allocationForm.feature_id}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, feature_id: e.target.value })
                  }
                  disabled={!allocationForm.epic_id}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px',
                    backgroundColor: !allocationForm.epic_id ? '#e9ecef' : 'white',
                    cursor: !allocationForm.epic_id ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Select a feature...</option>
                  {features.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
                {!allocationForm.epic_id && (
                  <p style={{ fontSize: '12px', color: '#6c757d', margin: '4px 0 0 0' }}>Select an epic first</p>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                  Allocated Hours *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={allocationForm.allocated_hours}
                  onChange={(e) =>
                    setAllocationForm({
                      ...allocationForm,
                      allocated_hours: Number(e.target.value),
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px'
                  }}
                  placeholder="0"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                    Forecast Start
                  </label>
                  <input
                    type="date"
                    value={convertToISO(allocationForm.forecast_start_date)}
                    onChange={(e) =>
                      setAllocationForm({ ...allocationForm, forecast_start_date: convertToDDMMYYYY(e.target.value) })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                    Forecast End
                  </label>
                  <input
                    type="date"
                    value={convertToISO(allocationForm.forecast_end_date)}
                    onChange={(e) =>
                      setAllocationForm({ ...allocationForm, forecast_end_date: convertToDDMMYYYY(e.target.value) })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleCreateAllocation}
                disabled={!allocationForm.resource_id || !allocationForm.feature_id || !allocationForm.allocated_hours}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: !allocationForm.resource_id || !allocationForm.feature_id || !allocationForm.allocated_hours ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !allocationForm.resource_id || !allocationForm.feature_id || !allocationForm.allocated_hours ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Create Allocation
              </button>
            </div>

            {/* Quick Stats */}
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50' }}>Quick Stats</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#e7f3ff', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6c757d' }}>Total Resources</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{resources.length}</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#d4edda', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6c757d' }}>Total Projects</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{projects.length}</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f3e5f5', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6c757d' }}>Active Allocations</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9c27b0' }}>{allocations.length}</p>
                </div>
                {selectedProject && (
                  <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', borderLeft: '4px solid #ffc107' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#856404' }}>Project Timeline</p>
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#495057' }}>
                      <strong>{selectedProject.title}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>
                      📅 {selectedProject.start_date} → {selectedProject.end_date}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Existing Allocations */}
          {allocations.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Feature ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Allocated Hours</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Forecast Start</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Forecast End</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Actual Hours</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Variance</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc, index) => {
                    const isEditing = editingAllocation === alloc.id;
                    return (
                      <tr key={alloc.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#2c3e50', borderBottom: '1px solid #dee2e6' }}>{alloc.feature_id}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={editForm.allocated_hours || 0}
                              onChange={(e) => setEditForm({ ...editForm, allocated_hours: Number(e.target.value) })}
                              style={{ width: '80px', padding: '4px 8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                            />
                          ) : (
                            `${alloc.allocated_hours}h`
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>
                          {isEditing ? (
                            <input
                              type="date"
                              value={convertToISO(editForm.forecast_start_date || null)}
                              onChange={(e) => setEditForm({ ...editForm, forecast_start_date: convertToDDMMYYYY(e.target.value) })}
                              style={{ width: '140px', padding: '4px 8px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }}
                            />
                          ) : (
                            alloc.forecast_start_date || '-'
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>
                          {isEditing ? (
                            <input
                              type="date"
                              value={convertToISO(editForm.forecast_end_date || null)}
                              onChange={(e) => setEditForm({ ...editForm, forecast_end_date: convertToDDMMYYYY(e.target.value) })}
                              style={{ width: '140px', padding: '4px 8px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }}
                            />
                          ) : (
                            alloc.forecast_end_date || '-'
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>{alloc.actual_hours_to_date}h</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' }}>{alloc.variance_hours}h</td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: getStatusColor(alloc.status), borderBottom: '1px solid #dee2e6' }}>{alloc.status}</td>
                        <td style={{ padding: '12px', fontSize: '14px', borderBottom: '1px solid #dee2e6' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleSaveAllocation(alloc.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleEditAllocation(alloc)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAllocation(alloc.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Capacity Tab */}
      {activeTab === 'capacity' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>Capacity Overview</h3>
            <button
              onClick={loadCapacities}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>Loading capacities...</div>
          ) : capacities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              No capacity data available. Create commitments first.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {capacities.map((cap) => (
                <div key={cap.resource_id} style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#2c3e50' }}>{cap.resource_name}</h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#6c757d' }}>
                    {cap.period_start} - {cap.period_end}
                  </p>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>Total Capacity:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{cap.total_capacity_hours}h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>Allocated:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{cap.allocated_hours}h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>Actual:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{cap.actual_hours}h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>Remaining:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{cap.remaining_capacity}h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e9ecef' }}>
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>Utilization:</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{cap.utilization_percent.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div style={{
                    padding: '8px',
                    backgroundColor: cap.utilization_percent < 70 ? '#fff3cd' : cap.utilization_percent > 100 ? '#f8d7da' : '#d4edda',
                    color: cap.utilization_percent < 70 ? '#856404' : cap.utilization_percent > 100 ? '#721c24' : '#155724',
                    textAlign: 'center',
                    borderRadius: '4px',
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '12px'
                  }}>
                    {cap.status.toUpperCase()}
                  </div>

                  {/* Utilization Bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(cap.utilization_percent, 100)}%`,
                        backgroundColor: cap.utilization_percent < 70 ? '#ffc107' : cap.utilization_percent > 100 ? '#dc3545' : '#28a745',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
