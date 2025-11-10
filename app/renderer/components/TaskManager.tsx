import React, { useState, useEffect } from 'react';
import { useAppStore, type Task } from '../state/store';

interface TaskManagerProps {
  projectId: string;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function TaskManager({ projectId, onTaskCreated, onTaskUpdated, onTaskDeleted }: TaskManagerProps) {
  const { 
    getTasksForProject, 
    loading, 
    createTask, 
    updateTask, 
    deleteTask, 
    loadTasksForProject,
    user 
  } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const tasks = getTasksForProject(projectId);

  // Load tasks for this project when component mounts
  useEffect(() => {
    loadTasksForProject(projectId);
  }, [projectId, loadTasksForProject]);

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

  const handleCreateTask = () => {
    setIsCreating(true);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreating(false);
  };

  const handleDeleteTask = async (task: Task) => {
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      try {
        await deleteTask(task.id);
        onTaskDeleted?.(task.id);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingTask(null);
  };

  if (tasks.length === 0 && !isCreating) {
    return (
      <div className="text-center p-4" style={{ 
        border: '2px dashed #e0e0e0', 
        borderRadius: '8px', 
        backgroundColor: '#fafafa' 
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
          📋
        </div>
        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#666' }}>
          No tasks yet
        </h3>
        <p style={{ fontSize: '14px', color: '#888', marginBottom: '16px' }}>
          Break down this project into manageable tasks to track progress effectively.
        </p>
        <button 
          className="btn primary" 
          onClick={handleCreateTask}
          disabled={loading.mutations}
        >
          + Create First Task
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Create Task button */}
      <div className="d-flex justify-between align-center mb-3">
        <h3 style={{ fontSize: '16px', margin: 0, color: '#333' }}>
          Tasks ({tasks.length})
        </h3>
        {!isCreating && (
          <button 
            className="btn primary" 
            onClick={handleCreateTask}
            disabled={loading.mutations}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            + Add Task
          </button>
        )}
      </div>

      {/* Create Task Form */}
      {isCreating && (
        <TaskForm
          projectId={projectId}
          onSave={async (taskData) => {
            try {
              await createTask(taskData);
              setIsCreating(false);
              onTaskCreated?.(taskData as Task);
            } catch (error) {
              console.error('Failed to create task:', error);
              throw error;
            }
          }}
          onCancel={handleCancelEdit}
          isLoading={loading.mutations}
        />
      )}

      {/* Edit Task Form */}
      {editingTask && (
        <TaskForm
          projectId={projectId}
          task={editingTask}
          onSave={async (taskData) => {
            try {
              await updateTask(editingTask.id, taskData);
              setEditingTask(null);
              onTaskUpdated?.({...editingTask, ...taskData});
            } catch (error) {
              console.error('Failed to update task:', error);
              throw error;
            }
          }}
          onCancel={handleCancelEdit}
          isLoading={loading.mutations}
        />
      )}

      {/* Task List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={() => handleEditTask(task)}
            onDelete={() => handleDeleteTask(task)}
            getStatusClass={getStatusClass}
            isEditing={editingTask?.id === task.id}
            disabled={loading.mutations}
          />
        ))}
      </div>
    </div>
  );
}

interface TaskFormProps {
  projectId: string;
  task?: Task | null;
  onSave: (taskData: Omit<Task, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function TaskForm({ projectId, task, onSave, onCancel, isLoading }: TaskFormProps) {
  const [formData, setFormData] = useState({
    project_id: projectId,
    title: task?.title || '',
    start_date: task?.start_date || '',
    end_date: task?.end_date || '',
    effort_hours: task?.effort_hours || 0,
    status: task?.status || 'planned',
    assigned_resources: task?.assigned_resources || []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resourceInput, setResourceInput] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date.split('-').reverse().join('-'));
      const endDate = new Date(formData.end_date.split('-').reverse().join('-'));
      
      if (startDate >= endDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (formData.effort_hours < 0) {
      newErrors.effort_hours = 'Effort hours cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addResource = () => {
    if (resourceInput.trim() && !formData.assigned_resources.includes(resourceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        assigned_resources: [...prev.assigned_resources, resourceInput.trim()]
      }));
      setResourceInput('');
    }
  };

  const removeResource = (resource: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_resources: prev.assigned_resources.filter(r => r !== resource)
    }));
  };

  return (
    <div className="card" style={{ 
      border: '2px solid #2196f3', 
      marginBottom: '16px',
      backgroundColor: '#f8f9ff'
    }}>
      <div className="card-header" style={{ paddingBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          {task ? 'Edit Task' : 'Create New Task'}
        </h4>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Task Title */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              style={errors.title ? { borderColor: '#dc3545' } : {}}
              disabled={isLoading}
            />
            {errors.title && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.title}</div>}
          </div>

          {/* Date Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="text"
                className="form-input"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                placeholder="DD-MM-YYYY"
                pattern="\d{2}-\d{2}-\d{4}"
                style={errors.start_date ? { borderColor: '#dc3545' } : {}}
                disabled={isLoading}
              />
              {errors.start_date && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.start_date}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="text"
                className="form-input"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                placeholder="DD-MM-YYYY"
                pattern="\d{2}-\d{2}-\d{4}"
                style={errors.end_date ? { borderColor: '#dc3545' } : {}}
                disabled={isLoading}
              />
              {errors.end_date && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.end_date}</div>}
            </div>
          </div>

          {/* Status and Effort */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={isLoading}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Effort Hours</label>
              <input
                type="number"
                className="form-input"
                value={formData.effort_hours}
                onChange={(e) => handleInputChange('effort_hours', parseInt(e.target.value) || 0)}
                min="0"
                step="1"
                placeholder="0"
                style={errors.effort_hours ? { borderColor: '#dc3545' } : {}}
                disabled={isLoading}
              />
              {errors.effort_hours && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.effort_hours}</div>}
            </div>
          </div>

          {/* Assigned Resources */}
          <div className="form-group">
            <label className="form-label">Assigned Resources</label>
            <div className="d-flex" style={{ gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={resourceInput}
                onChange={(e) => setResourceInput(e.target.value)}
                placeholder="Enter resource name"
                style={{ flex: 1 }}
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={addResource}
                disabled={isLoading || !resourceInput.trim()}
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                Add
              </button>
            </div>
            {formData.assigned_resources.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {formData.assigned_resources.map((resource, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {resource}
                    <button
                      type="button"
                      onClick={() => removeResource(resource)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1976d2',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0',
                        marginLeft: '4px'
                      }}
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-between align-center" style={{ 
          marginTop: '20px', 
          paddingTop: '16px', 
          borderTop: '1px solid #e0e0e0' 
        }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            * Required fields
          </div>
          <div className="d-flex" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={isLoading}
            >
              {isLoading && <div className="loading-spinner" style={{ width: '16px', height: '16px', margin: '0 8px 0 0' }} />}
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  getStatusClass: (status: string) => string;
  isEditing: boolean;
  disabled: boolean;
}

function TaskCard({ task, onEdit, onDelete, getStatusClass, isEditing, disabled }: TaskCardProps) {
  const calculateDays = () => {
    const startDate = new Date(task.start_date.split('-').reverse().join('-'));
    const endDate = new Date(task.end_date.split('-').reverse().join('-'));
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="card" style={{ 
      border: isEditing ? '2px solid #2196f3' : '1px solid #e0e0e0',
      backgroundColor: isEditing ? '#f8f9ff' : 'white',
      transition: 'all 0.2s ease'
    }}>
      {/* Task Header */}
      <div className="d-flex justify-between align-center mb-2">
        <h4 style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: '600',
          color: '#333'
        }}>
          {task.title}
        </h4>
        <div className="d-flex align-center" style={{ gap: '6px' }}>
          <span className={`p-1 ${getStatusClass(task.status)}`} style={{ 
            borderRadius: '4px', 
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '2px 6px'
          }}>
            {task.status.replace('-', ' ')}
          </span>
          <button
            className="btn secondary"
            onClick={onEdit}
            disabled={disabled}
            style={{ padding: '2px 6px', fontSize: '11px' }}
            title="Edit task"
          >
            Edit
          </button>
          <button
            className="btn danger"
            onClick={onDelete}
            disabled={disabled}
            style={{ padding: '2px 6px', fontSize: '11px' }}
            title="Delete task"
          >
            Del
          </button>
        </div>
      </div>

      {/* Task Details */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '12px', 
        fontSize: '12px',
        color: '#666'
      }}>
        <div>
          <strong>Duration:</strong><br />
          <span>{calculateDays()} days</span>
        </div>
        <div>
          <strong>Period:</strong><br />
          <span>{task.start_date} — {task.end_date}</span>
        </div>
        {task.effort_hours > 0 && (
          <div>
            <strong>Effort:</strong><br />
            <span>{task.effort_hours}h</span>
          </div>
        )}
        {task.assigned_resources && task.assigned_resources.length > 0 && (
          <div>
            <strong>Resources:</strong><br />
            <span>{task.assigned_resources.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}