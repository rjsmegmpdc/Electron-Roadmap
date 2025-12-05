/**
 * Financial Coordinator - Resource Management Page
 * Full CRUD operations for managing resources (create, read, update, delete)
 * Displays all resources with search/filter and edit capabilities
 */

import React, { useState, useEffect } from 'react';
import '../styles/coordinator.css';

interface Resource {
  id: number;
  resource_name: string;
  email?: string;
  work_area?: string;
  activity_type_cap?: string;
  activity_type_opx?: string;
  contract_type: 'FTE' | 'SOW' | 'External Squad';
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'list' | 'create' | 'edit';

const EMPTY_FORM = {
  resource_name: '',
  contract_type: 'FTE' as const,
  email: '',
  work_area: '',
  activity_type_cap: '',
  activity_type_opx: '',
  employee_id: ''
};

export const ResourceManagementPage: React.FC = () => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data state
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Feedback state
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Load resources on mount
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const data = await window.electronAPI.request('coordinator:resources:list');
      setResources(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showMessage('error', `Failed to load resources: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setViewMode('list');
  };

  const handleCreateClick = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setViewMode('create');
  };

  const handleEditClick = (resource: Resource) => {
    setFormData({
      resource_name: resource.resource_name,
      contract_type: resource.contract_type,
      email: resource.email || '',
      work_area: resource.work_area || '',
      activity_type_cap: resource.activity_type_cap || '',
      activity_type_opx: resource.activity_type_opx || '',
      employee_id: resource.employee_id || ''
    });
    setEditingId(resource.id);
    setViewMode('edit');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.resource_name.trim()) {
      showMessage('error', 'Resource name is required');
      return;
    }
    
    if (!formData.contract_type) {
      showMessage('error', 'Contract type is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingId) {
        // Update existing resource
        await window.electronAPI.request('coordinator:resource:update', {
          id: editingId,
          ...formData
        });
        showMessage('success', `Resource '${formData.resource_name}' updated successfully`);
      } else {
        // Create new resource
        const result = await window.electronAPI.request('coordinator:resource:create', formData);
        showMessage('success', result.message || `Resource '${formData.resource_name}' created successfully`);
      }
      
      // Reload resources and reset form
      await loadResources();
      resetForm();
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to save resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!deleteConfirm) {
      setDeleteConfirm(id);
      return;
    }
    
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }

    try {
      setIsSubmitting(true);
      const resource = resources.find(r => r.id === id);
      
      await window.electronAPI.request('coordinator:resource:delete', { id });
      showMessage('success', `Resource '${resource?.resource_name}' deleted successfully`);
      
      await loadResources();
      setDeleteConfirm(null);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to delete resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter resources based on search term
  const filteredResources = resources.filter(resource =>
    resource.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.work_area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getContractTypeColor = (type: string) => {
    switch (type) {
      case 'FTE': return '#3182ce';
      case 'SOW': return '#f6ad55';
      case 'External Squad': return '#9f7aea';
      default: return '#718096';
    }
  };

  return (
    <div className="resource-management-page">
      <div className="resource-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>👥 Manage Resources</h1>
            <p className="subtitle">Create, view, and manage all financial resources</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="button button-primary"
            disabled={viewMode !== 'list'}
          >
            ➕ Add Resource
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert alert-${message.type}`}>
            <p>{message.text}</p>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div>
            {/* Search Bar */}
            <div className="search-section">
              <input
                type="text"
                placeholder="Search by name, email, work area, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <p className="search-hint">
                Found {filteredResources.length} of {resources.length} resources
              </p>
            </div>

            {/* Resources Table */}
            {isLoading ? (
              <div className="loading-state">
                <p>Loading resources...</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="empty-state">
                <p>🔍 {searchTerm ? 'No resources match your search' : 'No resources created yet'}</p>
                <button onClick={handleCreateClick} className="button button-primary" style={{ marginTop: '16px' }}>
                  ➕ Create First Resource
                </button>
              </div>
            ) : (
              <div className="resources-table-wrapper">
                <table className="resources-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contract Type</th>
                      <th>Email</th>
                      <th>Work Area</th>
                      <th>Activity Type (CAP)</th>
                      <th>Activity Type (OPX)</th>
                      <th>Employee ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map((resource, index) => (
                      <tr key={resource.id} className={index % 2 === 0 ? '' : 'alt-row'}>
                        <td className="cell-bold">{resource.resource_name}</td>
                        <td>
                          <span 
                            className="contract-type-badge"
                            style={{ backgroundColor: getContractTypeColor(resource.contract_type) }}
                          >
                            {resource.contract_type}
                          </span>
                        </td>
                        <td>{resource.email || '—'}</td>
                        <td>{resource.work_area || '—'}</td>
                        <td className="monospace">{resource.activity_type_cap || '—'}</td>
                        <td className="monospace">{resource.activity_type_opx || '—'}</td>
                        <td className="monospace">{resource.employee_id || '—'}</td>
                        <td className="actions-cell">
                          <button
                            onClick={() => handleEditClick(resource)}
                            className="btn-small btn-edit"
                            title="Edit"
                            disabled={isSubmitting}
                          >
                            ✏️ Edit
                          </button>
                          {deleteConfirm === resource.id ? (
                            <button
                              onClick={() => handleDeleteClick(resource.id)}
                              className="btn-small btn-delete"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? '⏳' : '⚠️ Confirm'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(resource.id)}
                              className="btn-small btn-delete"
                              title="Delete"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Form */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div className="form-overlay">
            <div className="form-card">
              <h2>{editingId ? '✏️ Edit Resource' : '➕ Create New Resource'}</h2>
              
              <form onSubmit={handleSubmitForm}>
                {/* Resource Name */}
                <div className="form-section">
                  <label htmlFor="form-name" className="label">Resource Name *</label>
                  <input
                    id="form-name"
                    type="text"
                    value={formData.resource_name}
                    onChange={(e) => setFormData({ ...formData, resource_name: e.target.value })}
                    placeholder="e.g., John Smith, Sarah Wilson"
                    className="text-input"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Contract Type */}
                <div className="form-section">
                  <label htmlFor="form-contract" className="label">Contract Type *</label>
                  <select
                    id="form-contract"
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
                    className="select-input"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="FTE">FTE (Full-Time Employee)</option>
                    <option value="SOW">SOW (Statement of Work / Contractor)</option>
                    <option value="External Squad">External Squad</option>
                  </select>
                </div>

                {/* Two Column Layout */}
                <div className="form-row">
                  {/* Email */}
                  <div className="form-section">
                    <label htmlFor="form-email" className="label">Email</label>
                    <input
                      id="form-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.smith@company.com"
                      className="text-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Employee ID */}
                  <div className="form-section">
                    <label htmlFor="form-emp-id" className="label">Employee ID</label>
                    <input
                      id="form-emp-id"
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      placeholder="SAP Personnel Number"
                      className="text-input"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Work Area */}
                <div className="form-section">
                  <label htmlFor="form-area" className="label">Work Area</label>
                  <input
                    id="form-area"
                    type="text"
                    value={formData.work_area}
                    onChange={(e) => setFormData({ ...formData, work_area: e.target.value })}
                    placeholder="e.g., Development, QA, Architecture"
                    className="text-input"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Activity Types */}
                <div className="form-row">
                  {/* Activity Type CAPEX */}
                  <div className="form-section">
                    <label htmlFor="form-cap" className="label">Activity Type - CAPEX</label>
                    <input
                      id="form-cap"
                      type="text"
                      value={formData.activity_type_cap}
                      onChange={(e) => setFormData({ ...formData, activity_type_cap: e.target.value })}
                      placeholder="e.g., N4_CAP, N5_CAP"
                      className="text-input"
                      disabled={isSubmitting}
                    />
                    <p className="hint-text">For CAPEX project labour rates</p>
                  </div>

                  {/* Activity Type OPEX */}
                  <div className="form-section">
                    <label htmlFor="form-opx" className="label">Activity Type - OPEX</label>
                    <input
                      id="form-opx"
                      type="text"
                      value={formData.activity_type_opx}
                      onChange={(e) => setFormData({ ...formData, activity_type_opx: e.target.value })}
                      placeholder="e.g., N4_OPX, N5_OPX"
                      className="text-input"
                      disabled={isSubmitting}
                    />
                    <p className="hint-text">For OPEX project labour rates</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="button-group" style={{ marginTop: '24px' }}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button button-primary"
                  >
                    {isSubmitting ? '⏳ Saving...' : editingId ? '💾 Update Resource' : '✅ Create Resource'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="button button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
