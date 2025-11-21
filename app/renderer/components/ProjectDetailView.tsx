import React from 'react';
import { useAppStore, type Project } from '../state/store';
import { EpicFeatureManager } from './EpicFeatureManager';

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
  onEdit: (project: Project) => void;
}

export function ProjectDetailView({ projectId, onBack, onEdit }: ProjectDetailViewProps) {
  const { 
    getProjectById, 
    getTasksForProject, 
    getDependenciesForProject, 
    deleteProject, 
    loading 
  } = useAppStore();
  
  const project = getProjectById(projectId);
  const tasks = getTasksForProject(projectId);
  const dependencies = getDependenciesForProject(projectId);

  if (!project) {
    return (
      <div className="p-3">
        <div className="card">
          <div className="text-center p-4">
            <h2>Project Not Found</h2>
            <p>The requested project could not be found.</p>
            <button className="btn primary" onClick={onBack}>
              ← Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'planned': return 'status-planned';
      case 'in-progress': return 'status-in-progress';
      case 'blocked': return 'status-blocked';
      case 'done': return 'status-done';
      case 'archived': return 'status-archived';
      default: return '';
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      try {
        await deleteProject(project.id);
        onBack(); // Navigate back after deletion
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const calculateDuration = () => {
    const startDate = new Date(project.start_date.split('-').reverse().join('-'));
    const endDate = new Date(project.end_date.split('-').reverse().join('-'));
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.round(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.round(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(project.end_date.split('-').reverse().join('-'));
    const diffTime = endDate.getTime() - now.getTime();
    
    if (diffTime < 0) {
      return { text: 'Overdue', class: 'status-blocked' };
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return { text: `${diffDays} days remaining`, class: 'status-blocked' };
    } else if (diffDays < 30) {
      return { text: `${diffDays} days remaining`, class: 'status-in-progress' };
    } else {
      return { text: `${Math.round(diffDays / 30)} months remaining`, class: 'status-planned' };
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="p-3" style={{ flexShrink: 0 }}>
        <div className="card">
          <div className="d-flex align-center justify-between mb-3">
            <div className="d-flex align-center" style={{ gap: '12px' }}>
              <button className="btn secondary" onClick={onBack}>
                ← Back
              </button>
              <div>
                <h1 className="mb-0" style={{ fontSize: '24px' }}>{project.title}</h1>
                <p className="mb-0" style={{ color: '#666', fontSize: '14px' }}>Project ID: {project.id}</p>
              </div>
            </div>
            
            <div className="d-flex align-center" style={{ gap: '8px' }}>
              <span className={`p-1 ${getStatusClass(project.status)}`} style={{ 
                borderRadius: '4px', 
                fontSize: '14px',
                fontWeight: '600',
                padding: '6px 12px'
              }}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
              </span>
              <button 
                className="btn primary" 
                onClick={() => onEdit(project)}
                disabled={loading.mutations}
              >
                Edit Project
              </button>
              <button 
                className="btn danger" 
                onClick={handleDelete}
                disabled={loading.mutations}
              >
                Delete
              </button>
              <button 
                className="btn"
                onClick={onBack}
                style={{ 
                  padding: '6px 8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  minWidth: '32px',
                  borderRadius: '4px'
                }}
                title="Close and return to projects"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Content */}
      <div className="flex-1" style={{ overflow: 'hidden', padding: '0 16px 16px 16px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px', 
          height: '100%',
          overflow: 'hidden'
        }}>
          
          {/* Left Column - Project Details */}
          <div style={{ 
            overflow: 'auto', 
            paddingRight: '8px'
          }}>
            {/* Project Overview */}
            <div className="card mb-3">
              <div className="card-header">
                <h2 className="card-title">Project Overview</h2>
              </div>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#333' }}>Timeline</h3>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Start:</strong> {project.start_date}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>End:</strong> {project.end_date}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Duration:</strong> {calculateDuration()}
                    </div>
                    <div className="d-flex align-center" style={{ gap: '8px' }}>
                      <strong>Status:</strong>
                      <span className={`p-1 ${timeRemaining.class}`} style={{ 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {timeRemaining.text}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#333' }}>Financial</h3>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Budget:</strong> NZD ${(project.budget_nzd || 0).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Treatment:</strong> {project.financial_treatment}
                    </div>
                    {(project.budget_nzd || 0) > 0 && (
                      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                        ~NZD ${Math.round((project.budget_nzd || 0) / (new Date(project.end_date.split('-').reverse().join('-')).getTime() - new Date(project.start_date.split('-').reverse().join('-')).getTime()) * (1000 * 60 * 60 * 24 * 30)).toLocaleString('en-NZ')}/month
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#333' }}>Management</h3>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {project.pm_name ? (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Project Manager:</strong> {project.pm_name}
                      </div>
                    ) : (
                      <div style={{ marginBottom: '8px', color: '#999' }}>
                        No project manager assigned
                      </div>
                    )}
                    {project.lane ? (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Lane:</strong> {project.lane}
                      </div>
                    ) : (
                      <div style={{ marginBottom: '8px', color: '#999' }}>
                        No lane specified
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {project.description && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#333' }}>Description</h3>
                  <div style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    color: '#555',
                    backgroundColor: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                  }}>
                    {project.description}
                  </div>
                </div>
              )}
            </div>

            {/* Dependencies Section */}
            <div className="card mb-3">
              <div className="card-header">
                <div className="d-flex justify-between align-center">
                  <h2 className="card-title mb-0">Dependencies ({dependencies.length})</h2>
                  <button className="btn primary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                    + Add Dependency
                  </button>
                </div>
              </div>
              
              {dependencies.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {dependencies.map((dep) => (
                    <div key={dep.id} style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      padding: '16px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div className="d-flex justify-between align-center mb-2">
                        <div style={{ fontSize: '14px' }}>
                          <strong>{dep.from.type}:</strong> {dep.from.id} → <strong>{dep.to.type}:</strong> {dep.to.id}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#2196f3' }}>
                          {dep.kind}
                        </span>
                      </div>
                      {dep.lag_days && dep.lag_days > 0 && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Lag: {dep.lag_days} days
                        </div>
                      )}
                      {dep.note && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {dep.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4" style={{ color: '#666' }}>
                  <p>No dependencies defined for this project.</p>
                  <p style={{ fontSize: '12px' }}>Dependencies help track relationships with other projects or tasks.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Epic/Feature Management */}
          <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
            <EpicFeatureManager projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}