import React, { useState, useEffect, useCallback } from 'react';
import { NZDate, NZCurrency } from '../utils/validation';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../../main/preload';

// Extract types from Project interface
type ProjectStatus = Project['status'];
type FinancialTreatment = Project['financial_treatment'];
import {
  TextInput,
  DateInput,
  CurrencyInput,
  SelectInput,
  TextAreaInput,
  type SelectOption
} from './inputs';

export interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialProject?: Project;
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => Promise<{ success: boolean; errors?: string[]; project?: Project }>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface FormData {
  title: string;
  description: string;
  lane: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  pm_name: string;
  budget_nzd: string;
  financial_treatment: FinancialTreatment;
}

interface FormErrors {
  [key: string]: string[];
}

const INITIAL_FORM_DATA: FormData = {
  title: '',
  description: '',
  lane: '',
  start_date: '',
  end_date: '',
  status: 'active',
  pm_name: '',
  budget_nzd: '',
  financial_treatment: 'CAPEX'
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' }
];

const FINANCIAL_TREATMENT_OPTIONS: SelectOption[] = [
  { value: 'CAPEX', label: 'CAPEX - Capital Expenditure' },
  { value: 'OPEX', label: 'OPEX - Operational Expenditure' }
];

export const ProjectForm: React.FC<ProjectFormProps> = ({
  mode,
  initialProject,
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Initialize form data when component mounts or initialProject changes
  useEffect(() => {
    if (mode === 'edit' && initialProject) {
      const budgetDisplay = initialProject.budget_cents 
        ? NZCurrency.formatFromCents(initialProject.budget_cents).replace('$', '')
        : '';

      setFormData({
        title: initialProject.title || '',
        description: initialProject.description || '',
        lane: initialProject.lane || '',
        start_date: initialProject.start_date || '',
        end_date: initialProject.end_date || '',
        status: initialProject.status || 'active',
        pm_name: initialProject.pm_name || '',
        budget_nzd: budgetDisplay,
        financial_treatment: initialProject.financial_treatment || 'CAPEX'
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setErrors({});
    setTouched(new Set());
  }, [mode, initialProject]);

  // Field validation
  const validateField = useCallback((name: keyof FormData, value: string): string[] => {
    const fieldErrors: string[] = [];

    switch (name) {
      case 'title':
        if (!value.trim()) {
          fieldErrors.push('Project title is required');
        }
        if (value.length > 200) {
          fieldErrors.push('Project title must be 200 characters or less');
        }
        break;

      case 'start_date':
        if (!value.trim()) {
          fieldErrors.push('Start date is required');
        } else if (!NZDate.validate(value)) {
          fieldErrors.push('Start date must be in DD-MM-YYYY format');
        }
        break;

      case 'end_date':
        if (!value.trim()) {
          fieldErrors.push('End date is required');
        } else if (!NZDate.validate(value)) {
          fieldErrors.push('End date must be in DD-MM-YYYY format');
        } else if (formData.start_date && NZDate.validate(formData.start_date)) {
          // Validate date range
          try {
            const startDate = NZDate.parse(formData.start_date);
            const endDate = NZDate.parse(value);
            if (endDate <= startDate) {
              fieldErrors.push('End date must be after start date');
            }
          } catch (error) {
            // Error already handled by date format validation
          }
        }
        break;

      case 'budget_nzd':
        if (value.trim() && !NZCurrency.validate(value)) {
          fieldErrors.push('Budget must be a valid NZD amount (e.g., "1,234.56")');
        }
        break;

      case 'description':
        if (value.length > 1000) {
          fieldErrors.push('Description must be 1000 characters or less');
        }
        break;

      case 'lane':
        if (value.length > 100) {
          fieldErrors.push('Lane must be 100 characters or less');
        }
        break;

      case 'pm_name':
        if (value.length > 200) {
          fieldErrors.push('PM name must be 200 characters or less');
        }
        break;
    }

    return fieldErrors;
  }, [formData.start_date]);

  // Validate entire form
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key as keyof FormData, formData[key as keyof FormData]);
      if (fieldErrors.length > 0) {
        newErrors[key] = fieldErrors;
      }
    });

    return newErrors;
  }, [formData, validateField]);

  // Handle field changes
  const handleFieldChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate field if it's been touched
    if (touched.has(name)) {
      const fieldErrors = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors
      }));
    }
  };

  // Handle field blur (touch)
  const handleFieldBlur = (name: keyof FormData) => {
    const newTouched = new Set(touched);
    newTouched.add(name);
    setTouched(newTouched);

    // Validate field on blur
    const fieldErrors = validateField(name, formData[name]);
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = new Set(Object.keys(formData));
    setTouched(allFields);

    // Validate all fields
    const formErrors = validateForm();
    setErrors(formErrors);

    // Check if form has errors
    const hasErrors = Object.keys(formErrors).some(key => formErrors[key].length > 0);
    if (hasErrors) {
      return;
    }

    // Prepare data for submission
    let submitData: CreateProjectRequest | UpdateProjectRequest;

    if (mode === 'create') {
      submitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        lane: formData.lane.trim() || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        pm_name: formData.pm_name.trim() || undefined,
        budget_nzd: formData.budget_nzd.trim() || undefined,
        financial_treatment: formData.financial_treatment
      };
    } else {
      submitData = {
        id: initialProject!.id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        lane: formData.lane.trim() || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        pm_name: formData.pm_name.trim() || undefined,
        budget_nzd: formData.budget_nzd.trim() || undefined,
        financial_treatment: formData.financial_treatment
      };
    }

    try {
      const result = await onSubmit(submitData);
      
      if (!result.success && result.errors) {
        // Handle server-side validation errors
        const serverErrors: FormErrors = {};
        result.errors.forEach(error => {
          // Try to map errors to specific fields, otherwise put in general errors
          if (error.toLowerCase().includes('title')) {
            serverErrors.title = serverErrors.title || [];
            serverErrors.title.push(error);
          } else if (error.toLowerCase().includes('date')) {
            if (error.toLowerCase().includes('start')) {
              serverErrors.start_date = serverErrors.start_date || [];
              serverErrors.start_date.push(error);
            } else if (error.toLowerCase().includes('end')) {
              serverErrors.end_date = serverErrors.end_date || [];
              serverErrors.end_date.push(error);
            }
          } else if (error.toLowerCase().includes('budget')) {
            serverErrors.budget_nzd = serverErrors.budget_nzd || [];
            serverErrors.budget_nzd.push(error);
          } else {
            serverErrors.general = serverErrors.general || [];
            serverErrors.general.push(error);
          }
        });
        setErrors(prev => ({ ...prev, ...serverErrors }));
      }
    } catch (error) {
      // Handle unexpected errors
      setErrors({ general: ['An unexpected error occurred. Please try again.'] });
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`space-y-6 ${className}`}
      data-testid="project-form"
      noValidate
    >
      {/* Form Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="form-title">
          {mode === 'create' ? 'Create New Project' : 'Edit Project'}
        </h2>
      </div>

      {/* General Errors */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4" data-testid="general-errors">
          <div className="text-sm text-red-600">
            {errors.general.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      <TextInput
        label="Project Title"
        name="title"
        value={formData.title}
        onChange={(value) => handleFieldChange('title', value)}
        onBlur={() => handleFieldBlur('title')}
        error={errors.title?.[0] || null}
        touched={touched.has('title')}
        required={true}
        disabled={isLoading}
        placeholder="Enter project title"
        maxLength={200}
        data-testid="title-input"
      />

      {/* Description */}
      <TextAreaInput
        label="Description"
        name="description"
        value={formData.description}
        onChange={(value) => handleFieldChange('description', value)}
        onBlur={() => handleFieldBlur('description')}
        error={errors.description?.[0] || null}
        touched={touched.has('description')}
        disabled={isLoading}
        placeholder="Enter project description"
        rows={3}
        maxLength={1000}
        data-testid="description-input"
      />

      {/* Lane */}
      <TextInput
        label="Lane"
        name="lane"
        value={formData.lane}
        onChange={(value) => handleFieldChange('lane', value)}
        onBlur={() => handleFieldBlur('lane')}
        error={errors.lane?.[0] || null}
        touched={touched.has('lane')}
        disabled={isLoading}
        placeholder="e.g., Development, Testing, Infrastructure"
        maxLength={100}
        data-testid="lane-input"
      />

      {/* Date Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Date */}
        <DateInput
          label="Start Date"
          name="start_date"
          value={formData.start_date}
          onChange={(value) => handleFieldChange('start_date', value)}
          onBlur={() => handleFieldBlur('start_date')}
          error={errors.start_date?.[0] || null}
          touched={touched.has('start_date')}
          required={true}
          disabled={isLoading}
          data-testid="start-date-input"
        />

        {/* End Date */}
        <DateInput
          label="End Date"
          name="end_date"
          value={formData.end_date}
          onChange={(value) => handleFieldChange('end_date', value)}
          onBlur={() => handleFieldBlur('end_date')}
          error={errors.end_date?.[0] || null}
          touched={touched.has('end_date')}
          required={true}
          disabled={isLoading}
          data-testid="end-date-input"
        />
      </div>

      {/* Status and Financial Treatment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status */}
        <SelectInput
          label="Status"
          name="status"
          value={formData.status}
          onChange={(value) => handleFieldChange('status', value)}
          onBlur={() => handleFieldBlur('status')}
          options={STATUS_OPTIONS}
          error={errors.status?.[0] || null}
          touched={touched.has('status')}
          required={true}
          disabled={isLoading}
          data-testid="status-input"
        />

        {/* Financial Treatment */}
        <SelectInput
          label="Financial Treatment"
          name="financial_treatment"
          value={formData.financial_treatment}
          onChange={(value) => handleFieldChange('financial_treatment', value)}
          onBlur={() => handleFieldBlur('financial_treatment')}
          options={FINANCIAL_TREATMENT_OPTIONS}
          error={errors.financial_treatment?.[0] || null}
          touched={touched.has('financial_treatment')}
          disabled={isLoading}
          data-testid="financial-treatment-input"
        />
      </div>

      {/* PM Name */}
      <TextInput
        label="Project Manager"
        name="pm_name"
        value={formData.pm_name}
        onChange={(value) => handleFieldChange('pm_name', value)}
        onBlur={() => handleFieldBlur('pm_name')}
        error={errors.pm_name?.[0] || null}
        touched={touched.has('pm_name')}
        disabled={isLoading}
        placeholder="Enter project manager name"
        maxLength={200}
        data-testid="pm-name-input"
      />

      {/* Budget */}
      <CurrencyInput
        label="Budget (NZD)"
        name="budget_nzd"
        value={formData.budget_nzd}
        onChange={(value) => handleFieldChange('budget_nzd', value)}
        onBlur={() => handleFieldBlur('budget_nzd')}
        error={errors.budget_nzd?.[0] || null}
        touched={touched.has('budget_nzd')}
        disabled={isLoading}
        data-testid="budget-input"
      />

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
          data-testid="submit-button"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            mode === 'create' ? 'Create Project' : 'Save Changes'
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            data-testid="cancel-button"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ProjectForm;