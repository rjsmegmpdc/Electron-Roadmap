import React, { useState, useEffect } from 'react';
import { useAppStore, type Project } from '../state/store';

interface QuickTaskFormProps {
  onClose?: () => void;
  onTaskCreated?: (taskId: string) => void;
}

export const QuickTaskForm: React.FC<QuickTaskFormProps> = ({
  onClose,
  onTaskCreated
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [taskData, setTaskData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    effort_hours: 8,
    status: 'planned',
    assigned_resources: [] as string[]
  });
  const [resourceInput, setResourceInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    getProjectsAsArray,
    createTask,
    loading
  } = useAppStore();

  const projects = getProjectsAsArray().filter(p => p.status !== 'archived');

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setTaskData(prev => ({
      ...prev,
      start_date: formatDateNZ(today),
      end_date: formatDateNZ(tomorrow)
    }));
  }, []);

  const formatDateNZ = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedProjectId) {
      newErrors.project = 'Please select a project';
    }

    if (!taskData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!taskData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!taskData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (taskData.start_date && taskData.end_date) {
      const startDate = new Date(taskData.start_date.split('-').reverse().join('-'));
      const endDate = new Date(taskData.end_date.split('-').reverse().join('-'));
      
      if (endDate < startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (taskData.effort_hours < 0.25 || taskData.effort_hours > 40) {
      newErrors.effort_hours = 'Effort must be between 0.25 and 40 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskPayload = {
        project_id: selectedProjectId,
        title: taskData.title.trim(),
        start_date: taskData.start_date,
        end_date: taskData.end_date,
        effort_hours: taskData.effort_hours,
        status: taskData.status,
        assigned_resources: taskData.assigned_resources
      };

      await createTask(taskPayload);
      
      // Since createTask doesn't return the task, we'll generate the ID here
      const taskId = `TSK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      if (onTaskCreated) {
        onTaskCreated(taskId);
      }

      // Reset form
      setTaskData({
        title: '',
        start_date: formatDateNZ(new Date()),
        end_date: formatDateNZ(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        effort_hours: 8,
        status: 'planned',
        assigned_resources: []
      });
      setSelectedProjectId('');
      setResourceInput('');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      setErrors({ submit: 'Failed to create task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResourceAdd = () => {
    if (resourceInput.trim() && !taskData.assigned_resources.includes(resourceInput.trim())) {
      setTaskData(prev => ({
        ...prev,
        assigned_resources: [...prev.assigned_resources, resourceInput.trim()]
      }));
      setResourceInput('');
    }
  };

  const handleResourceRemove = (resource: string) => {
    setTaskData(prev => ({
      ...prev,
      assigned_resources: prev.assigned_resources.filter(r => r !== resource)
    }));
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Task Creation</h2>
          <p className="card-subtitle">Create a new task and assign it to a project</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Project Selection */}
          <div className="form-group">
            <label className="form-label">
              Target Project *
            </label>
            <select
              className={`form-input ${errors.project ? 'error' : ''}`}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} ({project.id})
                </option>
              ))}
            </select>
            {errors.project && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                {errors.project}
              </div>
            )}
          </div>

          {/* Selected Project Info */}
          {selectedProject && (
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              <strong>Project:</strong> {selectedProject.title}<br />
              <strong>PM:</strong> {selectedProject.pm_name || 'Not assigned'}<br />
              <strong>Lane:</strong> {selectedProject.lane || 'Not specified'}<br />
              <strong>Status:</strong> <span className={`status-${selectedProject.status}`} style={{
                padding: '2px 6px',
                borderRadius: '3px',
                textTransform: 'uppercase',
                fontSize: '11px'
              }}>
                {selectedProject.status}
              </span>
            </div>
          )}

          {/* Task Details */}
          <div className="form-group">
            <label className="form-label">
              Task Title *
            </label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={taskData.title}
              onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task description..."
              maxLength={200}
            />
            {errors.title && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                {errors.title}
              </div>
            )}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Start Date (DD-MM-YYYY) *
              </label>
              <input
                type="text"
                className={`form-input ${errors.start_date ? 'error' : ''}`}
                value={taskData.start_date}
                onChange={(e) => setTaskData(prev => ({ ...prev, start_date: e.target.value }))}
                placeholder="01-01-2025"
                pattern="[0-3][0-9]-[0-1][0-9]-[0-9]{4}"
              />
              {errors.start_date && (
                <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                  {errors.start_date}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                End Date (DD-MM-YYYY) *
              </label>
              <input
                type="text"
                className={`form-input ${errors.end_date ? 'error' : ''}`}
                value={taskData.end_date}
                onChange={(e) => setTaskData(prev => ({ ...prev, end_date: e.target.value }))}
                placeholder="02-01-2025"
                pattern="[0-3][0-9]-[0-1][0-9]-[0-9]{4}"
              />
              {errors.end_date && (
                <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                  {errors.end_date}
                </div>
              )}
            </div>
          </div>

          {/* Effort and Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Effort (Hours)
              </label>
              <input
                type="number"
                className={`form-input ${errors.effort_hours ? 'error' : ''}`}
                value={taskData.effort_hours}
                onChange={(e) => setTaskData(prev => ({ ...prev, effort_hours: parseFloat(e.target.value) || 0 }))}
                min="0.25"
                max="40"
                step="0.25"
              />
              {errors.effort_hours && (
                <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                  {errors.effort_hours}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Status
              </label>
              <select
                className="form-input"
                value={taskData.status}
                onChange={(e) => setTaskData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Resources */}
          <div className="form-group">
            <label className="form-label">
              Assigned Resources
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={resourceInput}
                onChange={(e) => setResourceInput(e.target.value)}
                placeholder="Enter team member name..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleResourceAdd())}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={handleResourceAdd}
                disabled={!resourceInput.trim()}
              >
                Add
              </button>
            </div>
            
            {taskData.assigned_resources.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {taskData.assigned_resources.map((resource, index) => (
                  <span
                    key={index}
                    style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {resource}
                    <button
                      type="button"
                      onClick={() => handleResourceRemove(resource)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1976d2',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '14px'
                      }}
                      title="Remove resource"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {onClose && (
              <button
                type="button"
                className="btn secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn primary"
              disabled={isSubmitting || loading.mutations}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};