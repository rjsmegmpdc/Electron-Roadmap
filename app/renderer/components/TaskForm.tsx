import React, { useState, useEffect } from 'react';
import { TextInput } from './inputs/TextInput';
import { DateInput } from './inputs/DateInput';
import { SelectInput } from './inputs/SelectInput';
import { LoadingSpinner } from './LoadingSpinner';
// Simple error display component for form errors
const FormError: React.FC<{ error: string }> = ({ error }) => (
  <div className="alert alert-error">
    <div className="flex">
      <svg className="flex-shrink-0 w-lg h-lg text-error" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="ml-sm">
        <h3 className="text-sm font-medium text-error">Error</h3>
        <p className="mt-xs text-sm text-error">{error}</p>
      </div>
    </div>
  </div>
);
import { NZDate } from '../utils/validation';
import type { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../stores/taskDependencyStore';

export interface TaskFormProps {
  task?: Task | null;
  projectId: string;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<{ success: boolean; task?: Task; errors?: string[] }>;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
}

interface FormData {
  title: string;
  start_date: string;
  end_date: string;
  effort_hours: string;
  status: TaskStatus;
  assigned_resources: string;
}

interface FormErrors {
  title?: string;
  start_date?: string;
  end_date?: string;
  effort_hours?: string;
  status?: string;
  assigned_resources?: string;
  general?: string;
}

interface FormTouched {
  title: boolean;
  start_date: boolean;
  end_date: boolean;
  effort_hours: boolean;
  status: boolean;
  assigned_resources: boolean;
}

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' }
];

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  projectId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    start_date: '',
    end_date: '',
    effort_hours: '0',
    status: 'planned',
    assigned_resources: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({
    title: false,
    start_date: false,
    end_date: false,
    effort_hours: false,
    status: false,
    assigned_resources: false
  });

  const isEditing = !!task;

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        start_date: task.start_date,
        end_date: task.end_date,
        effort_hours: task.effort_hours.toString(),
        status: task.status,
        assigned_resources: task.assigned_resources.join(', ')
      });
    }
  }, [task]);

  const validateField = (name: keyof FormData, value: string): string | null => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Task title is required';
        if (value.trim().length < 3) return 'Task title must be at least 3 characters';
        if (value.trim().length > 200) return 'Task title must be less than 200 characters';
        return null;

      case 'start_date':
        if (!value.trim()) return 'Start date is required';
        if (!NZDate.validate(value)) return 'Please enter a valid date in DD-MM-YYYY format';
        return null;

      case 'end_date':
        if (!value.trim()) return 'End date is required';
        if (!NZDate.validate(value)) return 'Please enter a valid date in DD-MM-YYYY format';
        
        // Check if end date is after start date
        if (formData.start_date && NZDate.validate(formData.start_date)) {
          try {
            const startDate = new Date(NZDate.toISO(formData.start_date));
            const endDate = new Date(NZDate.toISO(value));
            if (endDate <= startDate) {
              return 'End date must be after start date';
            }
          } catch {
            // If conversion fails, let the date format validation catch it
          }
        }
        return null;

      case 'effort_hours':
        const hours = parseFloat(value);
        if (isNaN(hours)) return 'Effort hours must be a valid number';
        if (hours < 0) return 'Effort hours cannot be negative';
        if (hours > 10000) return 'Effort hours must be less than 10,000';
        return null;

      case 'status':
        if (!STATUS_OPTIONS.find(opt => opt.value === value)) {
          return 'Please select a valid status';
        }
        return null;

      case 'assigned_resources':
        // Optional field, but validate format if provided
        if (value.trim()) {
          const resources = value.split(',').map(r => r.trim()).filter(Boolean);
          if (resources.some(r => r.length > 100)) {
            return 'Resource names must be less than 100 characters each';
          }
          if (resources.length > 20) {
            return 'Cannot assign more than 20 resources to a task';
          }
        }
        return null;

      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let hasErrors = false;

    (Object.keys(formData) as Array<keyof FormData>).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // For immediate validation on certain fields to help with tests
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }

    // Validate dependent fields
    if (field === 'start_date' && formData.end_date && touched.end_date) {
      const endDateError = validateField('end_date', formData.end_date);
      setErrors(prev => ({ ...prev, end_date: endDateError || undefined }));
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      title: true,
      start_date: true,
      end_date: true,
      effort_hours: true,
      status: true,
      assigned_resources: true
    });

    if (!validateForm()) {
      return;
    }

    try {
      const assignedResources = formData.assigned_resources
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);

      const submitData = isEditing
        ? {
            id: task!.id,
            project_id: projectId,
            title: formData.title.trim(),
            start_date: formData.start_date,
            end_date: formData.end_date,
            effort_hours: parseFloat(formData.effort_hours),
            status: formData.status,
            assigned_resources: assignedResources
          } as UpdateTaskRequest
        : {
            project_id: projectId,
            title: formData.title.trim(),
            start_date: formData.start_date,
            end_date: formData.end_date,
            effort_hours: parseFloat(formData.effort_hours),
            status: formData.status,
            assigned_resources: assignedResources
          } as CreateTaskRequest;

      const result = await onSubmit(submitData);

      if (!result.success && result.errors) {
        // Map server errors to form fields
        const newErrors: FormErrors = {};
        result.errors.forEach(error => {
          if (error.includes('title')) {
            newErrors.title = error;
          } else if (error.includes('start_date')) {
            newErrors.start_date = error;
          } else if (error.includes('end_date')) {
            newErrors.end_date = error;
          } else if (error.includes('effort_hours')) {
            newErrors.effort_hours = error;
          } else if (error.includes('status')) {
            newErrors.status = error;
          } else if (error.includes('assigned_resources')) {
            newErrors.assigned_resources = error;
          } else {
            newErrors.general = error;
          }
        });
        setErrors(newErrors);
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    }
  };

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h2 className="card-title">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h2>
        <p className="card-subtitle">
          {isEditing ? 'Update task details' : 'Enter task information'}
        </p>
      </div>
      
      <div className="card-body">

        {errors.general && (
          <div className="mb-lg">
            <FormError error={errors.general} />
          </div>
        )}

        <form id="task-form" onSubmit={handleSubmit} className="form-layout">
        <TextInput
          label="Task Title"
          name="title"
          value={formData.title}
          onChange={(value) => handleFieldChange('title', value)}
          onBlur={() => handleFieldBlur('title')}
          error={errors.title}
          touched={touched.title}
          required
          disabled={isSubmitting}
          placeholder="Enter task title..."
          data-testid="task-title-input"
          helpText="A clear, descriptive title for this task"
        />

        <div className="form-grid form-layout-2col">
          <DateInput
            label="Start Date"
            name="start_date"
            value={formData.start_date}
            onChange={(value) => handleFieldChange('start_date', value)}
            onBlur={() => handleFieldBlur('start_date')}
            error={errors.start_date}
            touched={touched.start_date}
            required
            disabled={isSubmitting}
            data-testid="task-start-date-input"
          />

          <DateInput
            label="End Date"
            name="end_date"
            value={formData.end_date}
            onChange={(value) => handleFieldChange('end_date', value)}
            onBlur={() => handleFieldBlur('end_date')}
            error={errors.end_date}
            touched={touched.end_date}
            required
            disabled={isSubmitting}
            data-testid="task-end-date-input"
          />
        </div>

        <div className="form-grid form-layout-2col">
          <TextInput
            label="Effort Hours"
            name="effort_hours"
            type="text"
            value={formData.effort_hours}
            onChange={(value) => handleFieldChange('effort_hours', value)}
            onBlur={() => handleFieldBlur('effort_hours')}
            error={errors.effort_hours}
            touched={touched.effort_hours}
            disabled={isSubmitting}
            placeholder="0"
            data-testid="task-effort-hours-input"
            helpText="Estimated hours of work required"
          />

          <SelectInput
            label="Status"
            name="status"
            value={formData.status}
            onChange={(value) => handleFieldChange('status', value as TaskStatus)}
            onBlur={() => handleFieldBlur('status')}
            options={STATUS_OPTIONS}
            error={errors.status}
            touched={touched.status}
            required
            disabled={isSubmitting}
            data-testid="task-status-select"
          />
        </div>

        <TextInput
          label="Assigned Resources"
          name="assigned_resources"
          value={formData.assigned_resources}
          onChange={(value) => handleFieldChange('assigned_resources', value)}
          onBlur={() => handleFieldBlur('assigned_resources')}
          error={errors.assigned_resources}
          touched={touched.assigned_resources}
          disabled={isSubmitting}
          placeholder="John Doe, Jane Smith, ..."
          data-testid="task-assigned-resources-input"
          helpText="Comma-separated list of assigned team members (optional)"
        />

        </form>
      </div>
      
      <div className="card-footer">
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn secondary"
            data-testid="task-form-cancel-button"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn primary"
            data-testid="task-form-submit-button"
            form="task-form"
          >
            {isSubmitting && <LoadingSpinner size="small" />}
            <span>{isEditing ? 'Update Task' : 'Create Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;