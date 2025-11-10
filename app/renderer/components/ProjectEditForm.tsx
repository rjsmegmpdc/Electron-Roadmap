import React, { useState, useEffect } from 'react';
import { Project } from '../state/store';

// Helper function to get next Monday
const getNextMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
};

// Format date as DD-MM-YYYY
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Parse DD-MM-YYYY to Date
const parseDate = (dateStr: string): Date | null => {
  const match = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

interface ProjectEditFormProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id'> & { customId?: string }) => Promise<void>;
  isLoading?: boolean;
  existingProjects?: Project[]; // For duplicate validation
}

export function ProjectEditForm({ project, isOpen, onClose, onSave, isLoading = false, existingProjects = [] }: ProjectEditFormProps) {
  const [formData, setFormData] = useState<{
    customId: string;
    title: string;
    description: string;
    lane: string;
    start_date: string;
    end_date: string;
    status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
    pm_name: string;
    budget_nzd: number;
    financial_treatment: 'CAPEX' | 'OPEX';
  }>({
    customId: '',
    title: '',
    description: '',
    lane: '',
    start_date: '',
    end_date: '',
    status: 'planned',
    pm_name: '',
    budget_nzd: 0,
    financial_treatment: 'CAPEX'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [laneSuggestions, setLaneSuggestions] = useState<string[]>([]);
  const [showLaneSuggestions, setShowLaneSuggestions] = useState(false);

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        customId: project.id,
        title: project.title,
        description: project.description || '',
        lane: project.lane || '',
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        pm_name: project.pm_name || '',
        budget_nzd: project.budget_nzd,
        financial_treatment: project.financial_treatment
      });
      setErrors({});
    } else {
      // Reset for new project - with smart defaults
      const today = new Date();
      const startMonday = getNextMonday(today);
      const endDate = new Date(startMonday);
      endDate.setDate(endDate.getDate() + 27); // Add 27 days to get to next Monday (~4 weeks)
      const endMonday = getNextMonday(endDate);
      
      setFormData({
        customId: '',
        title: '',
        description: '',
        lane: '',
        start_date: formatDate(startMonday),
        end_date: formatDate(endMonday),
        status: 'planned',
        pm_name: '',
        budget_nzd: 0,
        financial_treatment: 'CAPEX'
      });
      setErrors({});
    }
  }, [project]);
  
  // Extract unique lanes from existing projects
  useEffect(() => {
    const lanes = Array.from(new Set(
      existingProjects
        .map(p => p.lane)
        .filter(Boolean) as string[]
    ));
    setLaneSuggestions(lanes);
  }, [existingProjects]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-fill description with title if title changes and description is empty
      if (field === 'title' && !prev.description) {
        updated.description = value as string;
      }
      return updated;
    });
    // Clear error when user starts typing
    if (errors && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleDateSelect = (field: 'start_date' | 'end_date', date: Date) => {
    handleInputChange(field, formatDate(date));
    setTimeout(() => {
      if (field === 'start_date') {
        setShowStartDatePicker(false);
      } else {
        setShowEndDatePicker(false);
      }
    }, 0);
  };
  
  const handleLaneSelect = (lane: string) => {
    handleInputChange('lane', lane);
    setShowLaneSuggestions(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
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

    if (formData.budget_nzd < 0 || formData.budget_nzd > 100000000) {
      newErrors.budget_nzd = 'Budget must be between 0 and 100,000,000';
    }

    // Custom ID validation
    if (!formData.customId.trim()) {
      newErrors.customId = 'Project ID is required';
    } else if (!/^[A-Za-z0-9-_]+$/.test(formData.customId)) {
      newErrors.customId = 'Project ID can only contain letters, numbers, hyphens, and underscores';
    } else {
      // Check for duplicates (exclude current project if editing)
      const isDuplicate = existingProjects.some(p => 
        p.id === formData.customId && (!project || p.id !== project.id)
      );
      if (isDuplicate) {
        newErrors.customId = 'A project with this ID already exists';
      }
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
      await onSave({
        ...formData,
        customId: formData.customId || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      // Error will be handled by the store and shown in ErrorDisplay
    }
  };

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'done', label: 'Done' },
    { value: 'archived', label: 'Archived' }
  ];

  const treatmentOptions = [
    { value: 'CAPEX', label: 'CAPEX' },
    { value: 'OPEX', label: 'OPEX' }
  ];

  // Calendar picker component
  const CalendarPicker = ({ date, onChange, onClose }: { date: Date; onChange: (date: Date) => void; onClose: () => void }) => {
    const [currentMonth, setCurrentMonth] = useState(date);
    
    const getDaysInMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
    const days = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return (
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '12px',
        zIndex: 2000,
        minWidth: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            style={{ padding: '4px 8px', cursor: 'pointer' }}
          >
            ←
          </button>
          <span style={{ fontWeight: 'bold' }}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            style={{ padding: '4px 8px', cursor: 'pointer' }}
          >
            →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>{d}</div>
          ))}
          {days.map((day, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => day && onChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
              style={{
                padding: '6px',
                backgroundColor: day ? (day === date.getDate() ? '#00A45F' : 'white') : 'transparent',
                color: day === date.getDate() ? 'white' : 'black',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: day ? 'pointer' : 'default',
                fontSize: '12px'
              }}
              disabled={!day}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        maxHeight: '90vh',
        width: 'fit-content',
        minWidth: '850px',
        maxWidth: '900px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        {/* Top Menu Bar */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '8px 8px 0 0'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
              disabled={isLoading}
              style={{ minWidth: '80px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={isLoading}
              onClick={handleSubmit}
              style={{ minWidth: '120px' }}
            >
              {isLoading ? '...' : (project ? 'Update' : 'Create')}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Form Container */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          backgroundColor: 'white'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Section 1: Project ID & Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Project ID *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.customId}
                  onChange={(e) => handleInputChange('customId', e.target.value)}
                  placeholder="e.g., PRJ-WEB-2024"
                  style={{ ...(errors.customId ? { borderColor: '#dc3545' } : {}) }}
                />
                {errors.customId && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.customId}</div>}
              </div>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Project Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter project title"
                  style={{ ...(errors.title ? { borderColor: '#dc3545' } : {}) }}
                />
                {errors.title && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.title}</div>}
              </div>
            </div>

            {/* Section 2: Lane & Status & PM */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px', marginBottom: '20px' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Lane</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.lane}
                  onChange={(e) => {
                    handleInputChange('lane', e.target.value);
                    setShowLaneSuggestions(true);
                  }}
                  onFocus={() => setShowLaneSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowLaneSuggestions(false), 200)}
                  placeholder="Type or select from existing lanes"
                />
                {showLaneSuggestions && laneSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    maxHeight: '150px',
                    overflow: 'auto',
                    zIndex: 1001
                  }}>
                    {laneSuggestions.map(lane => (
                      <button
                        key={lane}
                        type="button"
                        onClick={() => handleLaneSelect(lane)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          backgroundColor: 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {lane}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Status *</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Project Manager</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.pm_name}
                  onChange={(e) => handleInputChange('pm_name', e.target.value)}
                  placeholder="Enter PM name"
                />
              </div>
            </div>

            {/* Section 3: Calendar Pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: '20px' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Start Date *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  onFocus={() => setShowStartDatePicker(true)}
                  placeholder="DD-MM-YYYY"
                  readOnly
                  style={{ cursor: 'pointer', ...(errors.start_date ? { borderColor: '#dc3545' } : {}) }}
                />
                {errors.start_date && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.start_date}</div>}
                {showStartDatePicker && formData.start_date && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }} onClick={() => setShowStartDatePicker(false)} />
                    <CalendarPicker
                      date={parseDate(formData.start_date) || new Date()}
                      onChange={(date) => handleDateSelect('start_date', date)}
                      onClose={() => setShowStartDatePicker(false)}
                    />
                  </>
                )}
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>End Date *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  onFocus={() => setShowEndDatePicker(true)}
                  placeholder="DD-MM-YYYY"
                  readOnly
                  style={{ cursor: 'pointer', ...(errors.end_date ? { borderColor: '#dc3545' } : {}) }}
                />
                {errors.end_date && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.end_date}</div>}
                {showEndDatePicker && formData.end_date && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }} onClick={() => setShowEndDatePicker(false)} />
                    <CalendarPicker
                      date={parseDate(formData.end_date) || new Date()}
                      onChange={(date) => handleDateSelect('end_date', date)}
                      onClose={() => setShowEndDatePicker(false)}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Section 4: Budget & Financial Treatment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Budget (NZD)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.budget_nzd}
                  onChange={(e) => handleInputChange('budget_nzd', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  max="100000000"
                  step="1000"
                  style={{ ...(errors.budget_nzd ? { borderColor: '#dc3545' } : {}) }}
                />
                {errors.budget_nzd && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.budget_nzd}</div>}
              </div>
              <div className="form-group">
                <label className="form-label" style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Financial Treatment</label>
                <select
                  className="form-select"
                  value={formData.financial_treatment}
                  onChange={(e) => handleInputChange('financial_treatment', e.target.value)}
                >
                  {treatmentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label" style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '600',
                fontSize: '13px'
              }}>Description</label>
              <textarea
                className="form-input form-textarea"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter project description..."
                rows={4}
                style={{
                  resize: 'vertical',
                  minHeight: '100px'
                }}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
