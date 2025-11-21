import React, { useState, useEffect } from 'react';
import { useAppStore } from '../state/store';
import { getEpicFeatureDefaults, type EpicFeatureDefaults } from './EpicFeatureConfig';

interface Epic {
  id: string;
  project_id: string;
  title: string;
  description: string;
  state: string;
  effort: number;
  business_value: number;
  time_criticality: number;
  start_date: string;
  end_date: string;
  assigned_to: string;
  area_path: string;
  iteration_path: string;
  risk: string;
  value_area: string;
  parent_feature?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Feature {
  id: string;
  epic_id: string;
  project_id: string;
  title: string;
  description: string;
  state: string;
  effort: number;
  business_value: number;
  time_criticality: number;
  start_date: string;
  end_date: string;
  assigned_to: string;
  area_path: string;
  iteration_path: string;
  risk: string;
  value_area: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Dependency {
  id: string;
  source_id: string;
  target_id: string;
  dependency_type: 'Hard' | 'Soft';
  reason: string;
  needed_by: string;
  risk_level: 'High' | 'Medium' | 'Low';
  status: string;
  created_by: string;
}

interface Allocation {
  id: string;
  resource_id: number;
  resource_name?: string;
  feature_id: string;
  epic_id: string;
  project_id: string;
  allocated_hours: number;
  forecast_start_date: string | null;
  forecast_end_date: string | null;
  actual_hours_to_date: number;
  variance_hours: number;
  status: 'on-track' | 'at-risk' | 'over-budget';
}

export const EnhancedEpicFeatureManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'epics' | 'features' | 'dependencies' | 'allocations'>('epics');
  const [selectedEpic, setSelectedEpic] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<'epic' | 'feature' | 'dependency' | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Inline editing state
  const [editingItem, setEditingItem] = useState<{ type: 'epic' | 'feature'; id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { getProjectsAsArray } = useAppStore();
  const projects = getProjectsAsArray().filter(p => p.status !== 'archived');

  // ADO Field Options
  const stateOptions = ['New', 'Active', 'Resolved', 'Closed', 'Removed'];
  const priorityOptions = [1, 2, 3, 4];
  const valueAreaOptions = ['Business', 'Architectural'];
  const epicSizingOptions = ['XS', 'S', 'M', 'L', 'XL'];
  const riskOptions = ['Low', 'Medium', 'High'];
  const dependencyTypes = ['Hard', 'Soft'];
  
  // Team member options (based on overlay examples)
  const teamMembers = [
    'Yash Yash (Yash.Yash@one.nz)',
    'Farhan Sarfraz (Farhan.Sarfraz@one.nz)',
    'Ashish Shivhare (Ashish.Shivhare@one.nz)',
    'Adrian Albuquerque (Adrian.Albuquerque@one.nz)',
    'Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)'
  ];

  // Initialize form with defaults from configuration
  const getInitialEpicForm = () => {
    const defaults = getEpicFeatureDefaults();
    return {
      // System Fields
      title: '',
      description: '',
      project_id: '',
      state: 'New',
      priority: defaults?.priority || 2,
      value_area: defaults?.valueArea || 'Business',
      area_path: defaults?.areaPath || 'IT\\BTE Tribe',
      iteration_path: defaults?.iterationPath || 'IT\\Sprint\\FY26\\Q1',
      tags: defaults?.epic.tags || '',
      
      // Timeline Fields
      planned_start_date: '',
      planned_delivery_date: '',
      target_date: '',
      start_date: '',
      
      // Epic Specific Fields
      epic_sizing: defaults?.epic.epicSizing || 'M',
      outcomes: '',
      leading_indicators: '',
      epic_acceptance_criteria: '',
      out_of_scope: '',
      nonfunctional_requirements: '',
      
      // Ownership Fields
      assigned_to: defaults?.epic.epicOwner || '',
      epic_owner: defaults?.epic.epicOwner || '',
      delivery_lead: defaults?.epic.deliveryLead || '',
      tech_lead: defaults?.epic.techLead || '',
      business_owner: defaults?.epic.businessOwner || '',
      process_owner: defaults?.epic.processOwner || '',
      platform_owner: defaults?.epic.platformOwner || ''
    };
  };

  const [epicForm, setEpicForm] = useState(getInitialEpicForm());

  // Initialize feature form with defaults from configuration
  const getInitialFeatureForm = () => {
    const defaults = getEpicFeatureDefaults();
    const featureAreaPath = defaults?.customAreaPaths.find(path => 
      path.includes('Integration and DevOps Tooling')
    ) || defaults?.areaPath || 'IT\\BTE Tribe\\Integration and DevOps Tooling';
    
    const featureIterationPath = defaults?.activeIterations.find(iter => 
      iter.includes('Sprint 1')
    ) || defaults?.iterationPath || 'IT\\Sprint\\FY26\\Q1\\Sprint 1';
    
    return {
      // System Fields
      title: '',
      description: '',
      epic_id: '',
      project_id: '',
      state: 'New',
      priority: defaults?.priority || 2,
      value_area: defaults?.valueArea || 'Business',
      area_path: featureAreaPath,
      iteration_path: featureIterationPath,
      tags: defaults?.feature.tags || '',
      
      // Feature Specific Fields
      acceptance_criteria: '',
      outcomes: '',
      out_of_scope: '',
      definition_of_ready: '',
      definition_of_done: '',
      
      // Ownership Fields
      assigned_to: defaults?.feature.productOwner || '',
      product_owner: defaults?.feature.productOwner || '',
      delivery_lead: defaults?.feature.deliveryLead || '',
      tech_lead: defaults?.feature.techLead || '',
      business_owner: defaults?.feature.businessOwner || '',
      process_owner: defaults?.feature.processOwner || '',
      platform_owner: defaults?.feature.platformOwner || ''
    };
  };

  const [featureForm, setFeatureForm] = useState(getInitialFeatureForm());

  const [dependencyForm, setDependencyForm] = useState({
    source_id: '',
    target_id: '',
    dependency_type: 'Hard' as 'Hard' | 'Soft',
    reason: '',
    needed_by: '',
    risk_level: 'Medium' as 'High' | 'Medium' | 'Low'
  });

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateNZ = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Function to reset Epic form with current configuration defaults
  const resetEpicFormWithDefaults = () => {
    const initialForm = getInitialEpicForm();
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setEpicForm({
      ...initialForm,
      title: '',
      description: '',
      project_id: '',
      start_date: formatDateForInput(today),
      end_date: formatDateForInput(nextMonth)
    });
  };

  // Function to reset Feature form with current configuration defaults
  const resetFeatureFormWithDefaults = () => {
    setFeatureForm(getInitialFeatureForm());
  };

  // Load allocations from database
  const loadAllocations = async () => {
    try {
      setLoading(true);
      // Get all allocations from all resources
      const allAllocations: Allocation[] = [];
      const resources = await window.electronAPI.coordinator?.getAllResources();
      
      if (resources) {
        for (const resource of resources) {
          const resourceAllocations = await window.electronAPI.coordinator?.getAllocationsForResource({ resourceId: resource.id });
          if (resourceAllocations) {
            allAllocations.push(...resourceAllocations.map((alloc: any) => ({
              ...alloc,
              resource_name: resource.resource_name
            })));
          }
        }
      }
      
      setAllocations(allAllocations);
    } catch (error) {
      console.error('Failed to load allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load allocations when switching to allocations tab
  useEffect(() => {
    if (activeTab === 'allocations') {
      loadAllocations();
    }
  }, [activeTab]);

  // Load sample data for testing (remove this in production)
  useEffect(() => {
    // Sample Epics
    const sampleEpics: Epic[] = [
      {
        id: 'epic-1',
        project_id: projects[0]?.id || 'project-1',
        title: '[Platform] | Security as Code Implementation',
        description: 'Implement comprehensive security scanning and compliance tools',
        state: 'Active',
        effort: 25,
        business_value: 85,
        time_criticality: 2,
        start_date: '2025-01-15',
        end_date: '2025-06-30',
        assigned_to: 'Yash Yash (Yash.Yash@one.nz)',
        area_path: 'IT\\BTE Tribe',
        iteration_path: 'IT\\Sprint\\FY26\\Q1',
        risk: 'Medium',
        value_area: 'Architectural',
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'epic-2',
        project_id: projects[0]?.id || 'project-1',
        title: '[Integration] | API Gateway Modernization',
        description: 'Modernize API gateway infrastructure for better performance',
        state: 'New',
        effort: 15,
        business_value: 70,
        time_criticality: 3,
        start_date: '2025-02-01',
        end_date: '2025-05-15',
        assigned_to: 'Farhan Sarfraz (Farhan.Sarfraz@one.nz)',
        area_path: 'IT\\BTE Tribe',
        iteration_path: 'IT\\Sprint\\FY26\\Q1',
        risk: 'Low',
        value_area: 'Business',
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Sample Features
    const sampleFeatures: Feature[] = [
      {
        id: 'feature-1',
        epic_id: 'epic-1',
        project_id: projects[0]?.id || 'project-1',
        title: 'Static Code Analysis Integration',
        description: 'Integrate SonarQube for static code analysis',
        state: 'Active',
        effort: 8,
        business_value: 75,
        time_criticality: 2,
        start_date: '2025-01-15',
        end_date: '2025-02-28',
        assigned_to: 'Ashish Shivhare (Ashish.Shivhare@one.nz)',
        area_path: 'IT\\BTE Tribe\\Integration and DevOps Tooling',
        iteration_path: 'IT\\Sprint\\FY26\\Q1\\Sprint 1',
        risk: 'Low',
        value_area: 'Architectural',
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'feature-2',
        epic_id: 'epic-1',
        project_id: projects[0]?.id || 'project-1',
        title: 'Container Security Scanning',
        description: 'Implement Twistlock for container security scanning',
        state: 'New',
        effort: 5,
        business_value: 80,
        time_criticality: 1,
        start_date: '2025-03-01',
        end_date: '2025-03-31',
        assigned_to: 'Adrian Albuquerque (Adrian.Albuquerque@one.nz)',
        area_path: 'IT\\BTE Tribe\\Integration and DevOps Tooling',
        iteration_path: 'IT\\Sprint\\FY26\\Q1\\Sprint 2',
        risk: 'Medium',
        value_area: 'Architectural',
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'feature-3',
        epic_id: 'epic-2',
        project_id: projects[0]?.id || 'project-1',
        title: 'API Rate Limiting',
        description: 'Implement rate limiting for API endpoints',
        state: 'New',
        effort: 3,
        business_value: 60,
        time_criticality: 3,
        start_date: '2025-02-15',
        end_date: '2025-03-15',
        assigned_to: 'Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)',
        area_path: 'IT\\BTE Tribe\\Integration and DevOps Tooling',
        iteration_path: 'IT\\Sprint\\FY26\\Q1\\Sprint 2',
        risk: 'Low',
        value_area: 'Business',
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Sample Dependencies
    const sampleDependencies: Dependency[] = [
      {
        id: 'dep-1',
        source_id: 'feature-1',
        target_id: 'feature-2',
        dependency_type: 'Hard',
        reason: 'Container scanning requires static analysis baseline',
        needed_by: '2025-03-01',
        risk_level: 'Medium',
        status: 'Active',
        created_by: 'System'
      },
      {
        id: 'dep-2',
        source_id: 'epic-1',
        target_id: 'feature-3',
        dependency_type: 'Soft',
        reason: 'API gateway security depends on security tooling',
        needed_by: '2025-03-15',
        risk_level: 'Low',
        status: 'Active',
        created_by: 'System'
      }
    ];

    setEpics(sampleEpics);
    setFeatures(sampleFeatures);
    setDependencies(sampleDependencies);
    
    // Expand first project and epic by default
    const defaultExpanded = new Set([
      `project-${projects[0]?.id || 'project-1'}`,
      'epic-1',
      'epic-epic-1'
    ]);
    setExpandedItems(defaultExpanded);
  }, [projects]);

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setEpicForm(prev => ({
      ...prev,
      start_date: formatDateForInput(today),
      end_date: formatDateForInput(nextMonth)
    }));
    
    setFeatureForm(prev => ({
      ...prev,
      start_date: formatDateForInput(today),
      end_date: formatDateForInput(nextMonth)
    }));
  }, []);

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert dates to NZ format
      const payload = {
        ...epicForm,
        start_date_nz: formatDateNZ(epicForm.start_date),
        end_date_nz: formatDateNZ(epicForm.end_date),
        start_date_iso: epicForm.start_date,
        end_date_iso: epicForm.end_date
      };

      // Here you would call your Epic creation API
      console.log('Creating Epic:', payload);
      
      // Reset form with current defaults
      resetEpicFormWithDefaults();
      
      setShowCreateForm(null);
    } catch (error) {
      console.error('Failed to create Epic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...featureForm,
        start_date_nz: formatDateNZ(featureForm.start_date),
        end_date_nz: formatDateNZ(featureForm.end_date),
        start_date_iso: featureForm.start_date,
        end_date_iso: featureForm.end_date
      };

      console.log('Creating Feature:', payload);
      
      // Reset form with current defaults
      resetFeatureFormWithDefaults();
      
      setShowCreateForm(null);
    } catch (error) {
      console.error('Failed to create Feature:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating Dependency:', dependencyForm);
      
      // Reset form
      setDependencyForm({
        source_id: '',
        target_id: '',
        dependency_type: 'Hard',
        reason: '',
        needed_by: '',
        risk_level: 'Medium'
      });
      
      setShowCreateForm(null);
    } catch (error) {
      console.error('Failed to create Dependency:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdoSync = async () => {
    setSyncing(true);
    try {
      // Simulate ADO sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('ADO sync completed');
    } catch (error) {
      console.error('ADO sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const renderCreateEpicForm = () => (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-header">
        <h3>Create New Epic (ADO Compliant)</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
          All fields mapped to Azure DevOps Epic work item type
        </p>
      </div>
      
      <form onSubmit={handleCreateEpic} style={{ padding: '20px' }}>
        {/* Basic Information Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>Basic Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">System.Title * (Format: [Domain] | [Description])</label>
              <input
                type="text"
                className="form-input"
                value={epicForm.title}
                onChange={(e) => setEpicForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., [IDS] | Enabling Security as Code"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Project *</label>
              <select
                className="form-input"
                value={epicForm.project_id}
                onChange={(e) => setEpicForm(prev => ({ ...prev, project_id: e.target.value }))}
                required
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Microsoft.VSTS.Common.Priority</label>
              <select
                className="form-input"
                value={epicForm.priority}
                onChange={(e) => setEpicForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              >
                {priorityOptions.map(priority => (
                  <option key={priority} value={priority}>
                    {priority} - {priority === 1 ? 'Critical/Urgent' : priority === 2 ? 'High Priority' : priority === 3 ? 'Medium Priority' : 'Low Priority'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Microsoft.VSTS.Common.ValueArea</label>
              <select
                className="form-input"
                value={epicForm.value_area}
                onChange={(e) => setEpicForm(prev => ({ ...prev, value_area: e.target.value }))}
              >
                {valueAreaOptions.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Custom.EpicSizing</label>
              <select
                className="form-input"
                value={epicForm.epic_sizing}
                onChange={(e) => setEpicForm(prev => ({ ...prev, epic_sizing: e.target.value }))}
              >
                {epicSizingOptions.map(size => (
                  <option key={size} value={size}>
                    {size} - {size === 'XS' ? 'Very small (1-2 weeks)' : 
                           size === 'S' ? 'Small (3-4 weeks)' : 
                           size === 'M' ? 'Medium (1-2 months)' : 
                           size === 'L' ? 'Large (2-3 months)' : 
                           'Extra large (3+ months)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">System.State</label>
              <select
                className="form-input"
                value={epicForm.state}
                onChange={(e) => setEpicForm(prev => ({ ...prev, state: e.target.value }))}
              >
                {stateOptions.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ownership & Accountability Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>Ownership & Accountability</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">System.AssignedTo</label>
              <select
                className="form-input"
                value={epicForm.assigned_to}
                onChange={(e) => setEpicForm(prev => ({ ...prev, assigned_to: e.target.value }))}
              >
                <option value="">Select Team Member</option>
                {teamMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Custom.EpicOwner</label>
              <select
                className="form-input"
                value={epicForm.epic_owner}
                onChange={(e) => setEpicForm(prev => ({ ...prev, epic_owner: e.target.value }))}
              >
                <option value="">Select Epic Owner</option>
                {teamMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Custom.DeliveryLead</label>
              <select
                className="form-input"
                value={epicForm.delivery_lead}
                onChange={(e) => setEpicForm(prev => ({ ...prev, delivery_lead: e.target.value }))}
              >
                <option value="">Select Delivery Lead</option>
                {teamMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Custom.TechLead</label>
              <select
                className="form-input"
                value={epicForm.tech_lead}
                onChange={(e) => setEpicForm(prev => ({ ...prev, tech_lead: e.target.value }))}
              >
                <option value="">Select Tech Lead</option>
                {teamMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Custom.BusinessOwner</label>
              <select
                className="form-input"
                value={epicForm.business_owner}
                onChange={(e) => setEpicForm(prev => ({ ...prev, business_owner: e.target.value }))}
              >
                <option value="">Select Business Owner</option>
                {teamMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Custom.PlatformOwner</label>
              <select
                className="form-input"
                value={epicForm.platform_owner}
                onChange={(e) => setEpicForm(prev => ({ ...prev, platform_owner: e.target.value }))}
              >
                <option value="">Select Platform Owner</option>
                {teamMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timeline & Planning Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>Timeline & Planning</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Custom.PlannedStartDate (ISO 8601)</label>
              <input
                type="datetime-local"
                className="form-input"
                value={epicForm.planned_start_date}
                onChange={(e) => setEpicForm(prev => ({ ...prev, planned_start_date: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Custom.PlannedDeliveryDate (ISO 8601)</label>
              <input
                type="datetime-local"
                className="form-input"
                value={epicForm.planned_delivery_date}
                onChange={(e) => setEpicForm(prev => ({ ...prev, planned_delivery_date: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Microsoft.VSTS.Scheduling.TargetDate</label>
              <input
                type="datetime-local"
                className="form-input"
                value={epicForm.target_date}
                onChange={(e) => setEpicForm(prev => ({ ...prev, target_date: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Microsoft.VSTS.Scheduling.StartDate</label>
              <input
                type="datetime-local"
                className="form-input"
                value={epicForm.start_date}
                onChange={(e) => setEpicForm(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Categorization Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>Categorization</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">System.AreaPath</label>
              <input
                type="text"
                className="form-input"
                value={epicForm.area_path}
                onChange={(e) => setEpicForm(prev => ({ ...prev, area_path: e.target.value }))}
                placeholder="IT\\BTE Tribe"
              />
            </div>

            <div className="form-group">
              <label className="form-label">System.IterationPath</label>
              <input
                type="text"
                className="form-input"
                value={epicForm.iteration_path}
                onChange={(e) => setEpicForm(prev => ({ ...prev, iteration_path: e.target.value }))}
                placeholder="IT\\Sprint\\FY26\\Q1"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">System.Tags (semicolon-separated)</label>
              <input
                type="text"
                className="form-input"
                value={epicForm.tags}
                onChange={(e) => setEpicForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Devsecops;Security;Platform"
              />
            </div>
          </div>
        </div>

        {/* Epic Definition Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>Epic Definition</h4>
          
          <div className="form-group">
            <label className="form-label">System.Description (HTML formatted)</label>
            <textarea
              className="form-input form-textarea"
              value={epicForm.description}
              onChange={(e) => setEpicForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="At [Organization], in order to [business objective], we need to [solution approach]..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custom.OutofScope (HTML formatted)</label>
            <textarea
              className="form-input form-textarea"
              value={epicForm.out_of_scope}
              onChange={(e) => setEpicForm(prev => ({ ...prev, out_of_scope: e.target.value }))}
              rows={3}
              placeholder="Items explicitly excluded from this epic..."
            />
          </div>
        </div>

        {/* Success Criteria Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>Success Criteria</h4>
          
          <div className="form-group">
            <label className="form-label">Custom.Outcomes (HTML list format)</label>
            <textarea
              className="form-input form-textarea"
              value={epicForm.outcomes}
              onChange={(e) => setEpicForm(prev => ({ ...prev, outcomes: e.target.value }))}
              rows={3}
              placeholder="<ul><li>Outcome 1</li><li>Outcome 2</li></ul>"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custom.LeadingIndicators (HTML list format)</label>
            <textarea
              className="form-input form-textarea"
              value={epicForm.leading_indicators}
              onChange={(e) => setEpicForm(prev => ({ ...prev, leading_indicators: e.target.value }))}
              rows={3}
              placeholder="<ul><li>Milestone 1 with specific deliverable</li></ul>"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custom.EpicAcceptanceCriteria (HTML list format)</label>
            <textarea
              className="form-input form-textarea"
              value={epicForm.epic_acceptance_criteria}
              onChange={(e) => setEpicForm(prev => ({ ...prev, epic_acceptance_criteria: e.target.value }))}
              rows={3}
              placeholder="<div><ul><li>Acceptance Criteria 1 - [Specific deliverable with clear success measure]</li></ul></div>"
            />
          </div>
        </div>

        {/* Technical Considerations */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>Technical Considerations</h4>
          
          <div className="form-group">
            <label className="form-label">Custom.NonfunctionalRequirements</label>
            <textarea
              className="form-input form-textarea"
              value={epicForm.nonfunctional_requirements}
              onChange={(e) => setEpicForm(prev => ({ ...prev, nonfunctional_requirements: e.target.value }))}
              rows={4}
              placeholder="[Non-functional requirements (NFRs) associated with the epic.] - NFR 1: [Specific requirement with measurable criteria]"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            type="button"
            className="btn outline"
            onClick={resetEpicFormWithDefaults}
            title="Load configured default values for Epic creation"
          >
            🔄 Load Defaults
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowCreateForm(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
            >
              {loading ? 'Creating ADO Epic...' : 'Create ADO Epic'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  // Inline editing functions
  const startEditing = (type: 'epic' | 'feature', id: string, field: string, currentValue: string) => {
    setEditingItem({ type, id, field });
    setEditingValue(currentValue);
  };

  const saveInlineEdit = async () => {
    if (!editingItem) return;
    
    try {
      setLoading(true);
      
      if (editingItem.type === 'epic') {
        const updatedEpics = epics.map(epic => 
          epic.id === editingItem.id 
            ? { ...epic, [editingItem.field]: editingValue, updated_at: new Date().toISOString() }
            : epic
        );
        setEpics(updatedEpics);
      } else {
        const updatedFeatures = features.map(feature => 
          feature.id === editingItem.id 
            ? { ...feature, [editingItem.field]: editingValue, updated_at: new Date().toISOString() }
            : feature
        );
        setFeatures(updatedFeatures);
      }
      
      console.log(`Updated ${editingItem.type} ${editingItem.id} field ${editingItem.field} to:`, editingValue);
    } catch (error) {
      console.error('Failed to save inline edit:', error);
    } finally {
      setEditingItem(null);
      setEditingValue('');
      setLoading(false);
    }
  };

  const cancelInlineEdit = () => {
    setEditingItem(null);
    setEditingValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const openDetailsModal = (type: 'epic' | 'feature', id: string) => {
    // This would open a detailed modal for editing all fields
    console.log(`Opening details modal for ${type} ${id}`);
    // TODO: Implement detailed editing modal
  };

  // Render Epic hierarchy with tree structure
  const renderEpicHierarchy = () => {
    const epicsByProject = epics.reduce((acc, epic) => {
      if (!acc[epic.project_id]) {
        acc[epic.project_id] = [];
      }
      acc[epic.project_id].push(epic);
      return acc;
    }, {} as Record<string, Epic[]>);

    return (
      <div className="hierarchy-container">
        {Object.entries(epicsByProject).map(([projectId, projectEpics]) => {
          const project = projects.find(p => p.id === projectId);
          const isProjectExpanded = expandedItems.has(`project-${projectId}`);
          
          return (
            <div key={projectId} className="hierarchy-project">
              <div 
                className="hierarchy-project-header"
                onClick={() => toggleExpanded(`project-${projectId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span style={{ marginRight: '8px', fontSize: '14px' }}>
                  {isProjectExpanded ? '📂' : '📁'}
                </span>
                <span style={{ fontWeight: '600', color: '#495057' }}>
                  {project?.title || 'Unknown Project'} ({projectEpics.length} epics)
                </span>
              </div>
              
              {isProjectExpanded && (
                <div style={{ marginLeft: '24px', marginBottom: '16px' }}>
                  {projectEpics.map(epic => renderEpicItem(epic))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderEpicItem = (epic: Epic) => {
    const isExpanded = expandedItems.has(epic.id);
    const epicFeatures = features.filter(f => f.epic_id === epic.id);
    const isEditing = editingItem?.type === 'epic' && editingItem.id === epic.id;
    
    return (
      <div key={epic.id} className="hierarchy-item epic-item">
        <div 
          className="hierarchy-item-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            marginBottom: '4px'
          }}
        >
          <button
            onClick={() => toggleExpanded(epic.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              marginRight: '8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          
          <span style={{ marginRight: '8px', fontSize: '16px' }}>📋</span>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {isEditing && editingItem?.field === 'title' ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={saveInlineEdit}
                autoFocus
                style={{
                  border: '1px solid #007bff',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  width: '100%',
                  maxWidth: '400px'
                }}
              />
            ) : (
              <span
                onClick={() => startEditing('epic', epic.id, 'title', epic.title)}
                onDoubleClick={() => openDetailsModal('epic', epic.id)}
                style={{
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#212529',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  ':hover': { backgroundColor: '#f8f9fa' }
                }}
                title="Click to edit title, double-click for details"
              >
                {epic.title}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6c757d' }}>
            <span className={`status-badge status-${epic.state.toLowerCase()}`}>
              {epic.state}
            </span>
            <span>Risk: {epic.risk}</span>
            <span>{epicFeatures.length} features</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFeatureForm(prev => ({ ...prev, epic_id: epic.id, project_id: epic.project_id }));
                setShowCreateForm('feature');
              }}
              style={{
                background: 'none',
                border: '1px solid #28a745',
                borderRadius: '12px',
                padding: '2px 6px',
                fontSize: '10px',
                color: '#28a745',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
              title="Add sub-feature to this epic"
            >
              + Feature
            </button>
          </div>
        </div>
        
        {isExpanded && epicFeatures.length > 0 && (
          <div style={{ marginLeft: '32px', marginBottom: '8px' }}>
            {epicFeatures.map(feature => renderFeatureItem(feature))}
          </div>
        )}
      </div>
    );
  };

  const renderFeatureItem = (feature: Feature) => {
    const isEditing = editingItem?.type === 'feature' && editingItem.id === feature.id;
    
    return (
      <div key={feature.id} className="hierarchy-item feature-item" style={{ marginBottom: '4px' }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 12px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '4px'
          }}
        >
          <span style={{ marginRight: '8px', fontSize: '14px' }}>⚡</span>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {isEditing && editingItem?.field === 'title' ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={saveInlineEdit}
                autoFocus
                style={{
                  border: '1px solid #007bff',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '13px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              />
            ) : (
              <span
                onClick={() => startEditing('feature', feature.id, 'title', feature.title)}
                onDoubleClick={() => openDetailsModal('feature', feature.id)}
                style={{
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#495057',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}
                title="Click to edit title, double-click for details"
              >
                {feature.title}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6c757d' }}>
            <span className={`status-badge status-${feature.state.toLowerCase()}`}>
              {feature.state}
            </span>
            <span>SP: {feature.effort}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render Feature hierarchy grouped by Epic
  const renderFeatureHierarchy = () => {
    const featuresByEpic = features.reduce((acc, feature) => {
      if (!acc[feature.epic_id]) {
        acc[feature.epic_id] = [];
      }
      acc[feature.epic_id].push(feature);
      return acc;
    }, {} as Record<string, Feature[]>);

    return (
      <div className="hierarchy-container">
        {Object.entries(featuresByEpic).map(([epicId, epicFeatures]) => {
          const epic = epics.find(e => e.id === epicId);
          const isEpicExpanded = expandedItems.has(`epic-${epicId}`);
          
          return (
            <div key={epicId} className="hierarchy-epic">
              <div 
                className="hierarchy-epic-header"
                onClick={() => toggleExpanded(`epic-${epicId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #bbdefb',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span style={{ marginRight: '8px', fontSize: '14px' }}>
                  {isEpicExpanded ? '📂' : '📁'}
                </span>
                <span style={{ marginRight: '8px', fontSize: '16px' }}>📋</span>
                <span style={{ fontWeight: '600', color: '#1976d2' }}>
                  {epic?.title || 'Unknown Epic'} ({epicFeatures.length} features)
                </span>
              </div>
              
              {isEpicExpanded && (
                <div style={{ marginLeft: '24px', marginBottom: '16px' }}>
                  {epicFeatures.map(feature => renderFeatureItem(feature))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render dependency hierarchy showing parent-child relationships
  const renderDependencyHierarchy = () => {
    const dependencyTree = dependencies.reduce((acc, dep) => {
      // Group by source (parent) items
      if (!acc[dep.source_id]) {
        acc[dep.source_id] = { item: null, children: [] };
      }
      acc[dep.source_id].children.push(dep);
      
      // Ensure target items exist in the tree
      if (!acc[dep.target_id]) {
        acc[dep.target_id] = { item: null, children: [] };
      }
      
      return acc;
    }, {} as Record<string, { item: Epic | Feature | null; children: Dependency[] }>);

    return (
      <div className="dependency-hierarchy">
        {Object.entries(dependencyTree).map(([itemId, treeNode]) => {
          if (treeNode.children.length === 0) return null; // Only show items with dependencies
          
          const sourceItem = epics.find(e => e.id === itemId) || features.find(f => f.id === itemId);
          const isExpanded = expandedItems.has(`dep-${itemId}`);
          
          return (
            <div key={itemId} className="dependency-group">
              <div 
                className="dependency-parent"
                onClick={() => toggleExpanded(`dep-${itemId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#fff3e0',
                  border: '1px solid #ffcc02',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span style={{ marginRight: '8px' }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span style={{ marginRight: '8px', fontSize: '16px' }}>🔗</span>
                <span style={{ fontWeight: '600', color: '#e65100' }}>
                  {sourceItem?.title || `Unknown Item (${itemId})`}
                </span>
                <span style={{ marginLeft: '12px', fontSize: '12px', color: '#bf360c' }}>
                  ({treeNode.children.length} dependencies)
                </span>
              </div>
              
              {isExpanded && (
                <div style={{ marginLeft: '32px', marginBottom: '16px' }}>
                  {treeNode.children.map(dep => {
                    const targetItem = epics.find(e => e.id === dep.target_id) || features.find(f => f.id === dep.target_id);
                    return (
                      <div key={dep.id} className="dependency-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        backgroundColor: '#fafafa',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ marginRight: '8px' }}>→</span>
                        <span style={{ marginRight: '8px', fontSize: '14px' }}>
                          {targetItem ? (epics.some(e => e.id === dep.target_id) ? '📋' : '⚡') : '❓'}
                        </span>
                        <span style={{ flex: 1, fontSize: '13px' }}>
                          {targetItem?.title || `Unknown Item (${dep.target_id})`}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
                          <span className={`dependency-type ${dep.dependency_type.toLowerCase()}`}>
                            {dep.dependency_type}
                          </span>
                          <span className={`risk-level risk-${dep.risk_level.toLowerCase()}`}>
                            {dep.risk_level} Risk
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCreateFeatureForm = () => (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-header">
        <h3>Create New Feature</h3>
      </div>
      
      <form onSubmit={handleCreateFeature} style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Feature Title *</label>
            <input
              type="text"
              className="form-input"
              value={featureForm.title}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Epic *</label>
            <select
              className="form-input"
              value={featureForm.epic_id}
              onChange={(e) => {
                setFeatureForm(prev => ({ ...prev, epic_id: e.target.value }));
                const epic = epics.find(ep => ep.id === e.target.value);
                if (epic) {
                  setFeatureForm(prev => ({ ...prev, project_id: epic.project_id }));
                }
              }}
              required
            >
              <option value="">Select Epic</option>
              {epics.map(epic => (
                <option key={epic.id} value={epic.id}>{epic.title}</option>
              ))}
            </select>
          </div>

          {/* Similar form fields as Epic but with Feature-specific context */}
          <div className="form-group">
            <label className="form-label">State</label>
            <select
              className="form-input"
              value={featureForm.state}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, state: e.target.value }))}
            >
              {stateOptions.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Risk Level</label>
            <select
              className="form-input"
              value={featureForm.risk}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, risk: e.target.value }))}
            >
              {riskOptions.map(risk => (
                <option key={risk} value={risk}>{risk}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Effort (Story Points)</label>
            <input
              type="number"
              className="form-input"
              value={featureForm.effort}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, effort: parseInt(e.target.value) || 0 }))}
              min="0"
              max="50"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Business Value (1-100)</label>
            <input
              type="number"
              className="form-input"
              value={featureForm.business_value}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, business_value: parseInt(e.target.value) || 0 }))}
              min="1"
              max="100"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Time Criticality (1-4)</label>
            <input
              type="number"
              className="form-input"
              value={featureForm.time_criticality}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, time_criticality: parseInt(e.target.value) || 0 }))}
              min="1"
              max="4"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned To</label>
            <input
              type="text"
              className="form-input"
              value={featureForm.assigned_to}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, assigned_to: e.target.value }))}
              placeholder="Team member name"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            value={featureForm.description}
            onChange={(e) => setFeatureForm(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            placeholder="Feature description and acceptance criteria"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            type="button"
            className="btn outline"
            onClick={resetFeatureFormWithDefaults}
            title="Load configured default values for Feature creation"
          >
            🔄 Load Defaults
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowCreateForm(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Feature'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  // Main component render
  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0' }}>Epics & Features Management</h2>
          <p style={{ margin: 0, color: '#666' }}>
            Advanced Epic and Feature management with full Azure DevOps integration
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn secondary"
            onClick={handleAdoSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Syncing...
              </>
            ) : (
              <>🔄 Sync ADO</>
            )}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        borderBottom: '1px solid #e0e0e0', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {(['epics', 'features', 'dependencies', 'allocations'] as const).map((tab) => (
            <button
              key={tab}
              className={`btn ${activeTab === tab ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab(tab)}
              style={{
                borderRadius: '4px 4px 0 0',
                borderBottom: 'none',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'epics' ? '📋 Epics' : 
               tab === 'features' ? '⚡ Features' : 
               tab === 'dependencies' ? '🔗 Dependencies' :
               '👥 Allocations'}
            </button>
          ))}
        </div>
      </div>

      {/* Create Forms */}
      {showCreateForm === 'epic' && renderCreateEpicForm()}
      {showCreateForm === 'feature' && renderCreateFeatureForm()}

      {/* Content based on active tab */}
      {activeTab === 'epics' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              className="btn success"
              onClick={() => setShowCreateForm('epic')}
            >
              + New Epic
            </button>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3>Epic Management</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {epics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>No Epics found. Create your first Epic to get started.</p>
                </div>
              ) : (
                <div className="hierarchy-tree">
                  {renderEpicHierarchy()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              className="btn success"
              onClick={() => setShowCreateForm('feature')}
              disabled={epics.length === 0}
              title={epics.length === 0 ? 'Create an Epic first' : 'Create new Feature'}
            >
              + New Feature
            </button>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3>Feature Management</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {features.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>No Features found. Features must be linked to an Epic.</p>
                  {epics.length === 0 && (
                    <p style={{ fontSize: '14px' }}>Create an Epic first, then add Features to it.</p>
                  )}
                </div>
              ) : (
                <div className="hierarchy-tree">
                  {renderFeatureHierarchy()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dependencies' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              className="btn success"
              onClick={() => setShowCreateForm('dependency')}
              disabled={epics.length === 0 && features.length === 0}
            >
              + New Dependency
            </button>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3>Dependency Management</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                Manage hard and soft dependencies between Epics and Features
              </p>
            </div>
            <div style={{ padding: '20px' }}>
              {dependencies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>No Dependencies configured.</p>
                  <p style={{ fontSize: '14px' }}>
                    Create dependencies between work items to track blocking relationships.
                  </p>
                </div>
              ) : (
                <div className="dependency-tree">
                  {renderDependencyHierarchy()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'allocations' && (
        <div>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>Resource Allocations</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                View all resource allocations across epics and features
              </p>
            </div>
            <button
              className="btn primary"
              onClick={loadAllocations}
              disabled={loading}
            >
              {loading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>
          
          <div className="card">
            <div style={{ padding: '20px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>Loading allocations...</p>
                </div>
              ) : allocations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>No allocations found.</p>
                  <p style={{ fontSize: '14px' }}>
                    Go to Resource Management to create allocations for features.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Summary Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #90caf9' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#1976d2', fontWeight: '600' }}>Total Allocations</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0d47a1' }}>{allocations.length}</p>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#155724', fontWeight: '600' }}>Total Hours Allocated</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#155724' }}>
                        {allocations.reduce((sum, a) => sum + a.allocated_hours, 0).toFixed(1)}h
                      </p>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#856404', fontWeight: '600' }}>Actual Hours</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#856404' }}>
                        {allocations.reduce((sum, a) => sum + a.actual_hours_to_date, 0).toFixed(1)}h
                      </p>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#721c24', fontWeight: '600' }}>Variance</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#721c24' }}>
                        {allocations.reduce((sum, a) => sum + a.variance_hours, 0).toFixed(1)}h
                      </p>
                    </div>
                  </div>

                  {/* Allocations by Epic */}
                  {epics.map(epic => {
                    const epicAllocations = allocations.filter(a => a.epic_id === epic.id);
                    if (epicAllocations.length === 0) return null;

                    const epicFeatures = features.filter(f => f.epic_id === epic.id);
                    const isExpanded = expandedItems.has(`alloc-epic-${epic.id}`);

                    return (
                      <div key={epic.id} style={{ marginBottom: '20px' }}>
                        <div 
                          onClick={() => {
                            const newExpanded = new Set(expandedItems);
                            if (isExpanded) {
                              newExpanded.delete(`alloc-epic-${epic.id}`);
                            } else {
                              newExpanded.add(`alloc-epic-${epic.id}`);
                            }
                            setExpandedItems(newExpanded);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            backgroundColor: '#e3f2fd',
                            border: '1px solid #90caf9',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <span style={{ marginRight: '12px', fontSize: '16px' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <span style={{ marginRight: '8px', fontSize: '18px' }}>📋</span>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '16px', color: '#0d47a1' }}>{epic.title}</strong>
                            <span style={{ marginLeft: '12px', fontSize: '14px', color: '#1976d2' }}>
                              ({epicAllocations.length} allocations, {epicAllocations.reduce((s, a) => s + a.allocated_hours, 0).toFixed(1)}h)
                            </span>
                          </div>
                          <span className={`status-badge status-${epic.state.toLowerCase()}`}>
                            {epic.state}
                          </span>
                        </div>

                        {isExpanded && (
                          <div style={{ marginTop: '12px', marginLeft: '24px' }}>
                            {epicFeatures.map(feature => {
                              const featureAllocations = epicAllocations.filter(a => a.feature_id === feature.id);
                              if (featureAllocations.length === 0) return null;

                              return (
                                <div key={feature.id} style={{ marginBottom: '12px' }}>
                                  <div style={{
                                    padding: '10px 12px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px',
                                    marginBottom: '8px'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <span style={{ marginRight: '8px' }}>⚡</span>
                                      <strong style={{ fontSize: '14px', color: '#495057' }}>{feature.title}</strong>
                                      <span style={{ marginLeft: '12px', fontSize: '12px', color: '#6c757d' }}>
                                        ({featureAllocations.length} allocations)
                                      </span>
                                    </div>
                                  </div>

                                  <table style={{ width: '100%', borderCollapse: 'collapse', marginLeft: '24px' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#495057' }}>Resource</th>
                                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#495057' }}>Allocated Hours</th>
                                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#495057' }}>Forecast Start</th>
                                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#495057' }}>Forecast End</th>
                                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#495057' }}>Actual Hours</th>
                                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#495057' }}>Variance</th>
                                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#495057' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {featureAllocations.map((alloc, index) => (
                                        <tr key={alloc.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                                          <td style={{ padding: '8px', fontSize: '13px', color: '#2c3e50' }}>{alloc.resource_name || `Resource #${alloc.resource_id}`}</td>
                                          <td style={{ padding: '8px', fontSize: '13px', color: '#495057' }}>{alloc.allocated_hours}h</td>
                                          <td style={{ padding: '8px', fontSize: '13px', color: '#495057' }}>{alloc.forecast_start_date || '-'}</td>
                                          <td style={{ padding: '8px', fontSize: '13px', color: '#495057' }}>{alloc.forecast_end_date || '-'}</td>
                                          <td style={{ padding: '8px', fontSize: '13px', color: '#495057' }}>{alloc.actual_hours_to_date}h</td>
                                          <td style={{ padding: '8px', fontSize: '13px', color: alloc.variance_hours < 0 ? '#28a745' : '#dc3545' }}>
                                            {alloc.variance_hours > 0 ? '+' : ''}{alloc.variance_hours}h
                                          </td>
                                          <td style={{ padding: '8px' }}>
                                            <span style={{
                                              padding: '3px 8px',
                                              borderRadius: '12px',
                                              fontSize: '11px',
                                              fontWeight: '600',
                                              backgroundColor: alloc.status === 'on-track' ? '#d4edda' : alloc.status === 'at-risk' ? '#fff3cd' : '#f8d7da',
                                              color: alloc.status === 'on-track' ? '#155724' : alloc.status === 'at-risk' ? '#856404' : '#721c24'
                                            }}>
                                              {alloc.status.toUpperCase()}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedEpicFeatureManager;
