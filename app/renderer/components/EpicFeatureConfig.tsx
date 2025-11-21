import React, { useState, useEffect } from 'react';

// Define the configuration interface
export interface EpicFeatureDefaults {
  // Common fields for both Epics and Features
  priority: string;
  valueArea: string;
  areaPath: string;
  iterationPath: string;
  
  // Epic specific defaults
  epic: {
    epicSizing: string;
    risk: string;
    epicOwner: string;
    deliveryLead: string;
    techLead: string;
    businessOwner: string;
    processOwner: string;
    platformOwner: string;
    tags: string;
  };
  
  // Feature specific defaults  
  feature: {
    productOwner: string;
    deliveryLead: string;
    techLead: string;
    businessOwner: string;
    processOwner: string;
    platformOwner: string;
    tags: string;
  };
  
  // Active iterations for quick selection
  activeIterations: string[];
  customAreaPaths: string[];
}

const EpicFeatureConfig: React.FC = () => {
  const [config, setConfig] = useState<EpicFeatureDefaults>({
    priority: '2',
    valueArea: 'Business',
    areaPath: 'IT\\BTE Tribe',
    iterationPath: 'IT\\Sprint\\FY26\\Q1',
    epic: {
      epicSizing: 'M',
      risk: 'Medium',
      epicOwner: '',
      deliveryLead: '',
      techLead: '',
      businessOwner: '',
      processOwner: '',
      platformOwner: '',
      tags: ''
    },
    feature: {
      productOwner: '',
      deliveryLead: '',
      techLead: '',
      businessOwner: '',
      processOwner: '',
      platformOwner: '',
      tags: ''
    },
    activeIterations: [
      'IT\\Sprint\\FY26\\Q1\\Sprint 1',
      'IT\\Sprint\\FY26\\Q1\\Sprint 2',
      'IT\\Sprint\\FY26\\Q1\\Sprint 3'
    ],
    customAreaPaths: [
      'IT\\BTE Tribe',
      'IT\\BTE Tribe\\Integration and DevOps Tooling',
      'IT\\BTE Tribe\\Platform Engineering'
    ]
  });

  const [newIteration, setNewIteration] = useState('');
  const [newAreaPath, setNewAreaPath] = useState('');
  const [activeTab, setActiveTab] = useState<'common' | 'epic' | 'feature' | 'paths'>('common');
  const [hasChanges, setHasChanges] = useState(false);

  // Team member options from the ADO overlay
  const teamMembers = [
    { value: '', label: 'Select team member...' },
    { value: 'Yash.Yash@one.nz', label: 'Yash Yash (Yash.Yash@one.nz)' },
    { value: 'Farhan.Sarfraz@one.nz', label: 'Farhan Sarfraz (Farhan.Sarfraz@one.nz)' },
    { value: 'Ashish.Shivhare@one.nz', label: 'Ashish Shivhare (Ashish.Shivhare@one.nz)' },
    { value: 'Adrian.Albuquerque@one.nz', label: 'Adrian Albuquerque (Adrian.Albuquerque@one.nz)' },
    { value: 'Sanjeev.Lokavarapu@one.nz', label: 'Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)' }
  ];

  // Priority options
  const priorityOptions = [
    { value: '1', label: '1 - Critical (Drop everything)' },
    { value: '2', label: '2 - High Priority (Plan immediately)' },
    { value: '3', label: '3 - Medium Priority (Plan for next iteration)' },
    { value: '4', label: '4 - Low Priority (Backlog)' }
  ];

  // Value area options
  const valueAreaOptions = [
    { value: 'Business', label: 'Business' },
    { value: 'Architectural', label: 'Architectural' }
  ];

  // Epic sizing options
  const epicSizingOptions = [
    { value: 'XS', label: 'XS (1-2 weeks)' },
    { value: 'S', label: 'S (3-4 weeks)' },
    { value: 'M', label: 'M (5-8 weeks)' },
    { value: 'L', label: 'L (9-12 weeks)' },
    { value: 'XL', label: 'XL (13+ weeks)' }
  ];

  // Risk options
  const riskOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  // Load configuration on component mount and listen for changes
  useEffect(() => {
    loadConfiguration();
    
    // Listen for storage events (when localStorage changes in another context)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'epicFeatureDefaults') {
        loadConfiguration();
      }
    };
    
    // Listen for custom reload event (dispatched after import)
    const handleReload = () => {
      loadConfiguration();
    };
    
    // Listen for general data import event
    const handleDataImported = (e: CustomEvent) => {
      const importedAreas = e.detail?.areas || [];
      if (importedAreas.includes('epic_feature_config')) {
        loadConfiguration();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('epic-feature-config-reload', handleReload);
    window.addEventListener('data-imported', handleDataImported as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('epic-feature-config-reload', handleReload);
      window.removeEventListener('data-imported', handleDataImported as EventListener);
    };
  }, []);

  const loadConfiguration = () => {
    try {
      const savedConfig = localStorage.getItem('epicFeatureDefaults');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...config, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load Epic/Feature configuration:', error);
    }
  };

  const saveConfiguration = () => {
    try {
      localStorage.setItem('epicFeatureDefaults', JSON.stringify(config));
      setHasChanges(false);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save Epic/Feature configuration:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  const resetConfiguration = () => {
    if (confirm('Are you sure you want to reset all configurations to defaults? This cannot be undone.')) {
      localStorage.removeItem('epicFeatureDefaults');
      // Reset to initial state
      setConfig({
        priority: '2',
        valueArea: 'Business',
        areaPath: 'IT\\BTE Tribe',
        iterationPath: 'IT\\Sprint\\FY26\\Q1',
        epic: {
          epicSizing: 'M',
          risk: 'Medium',
          epicOwner: '',
          deliveryLead: '',
          techLead: '',
          businessOwner: '',
          processOwner: '',
          platformOwner: '',
          tags: ''
        },
        feature: {
          productOwner: '',
          deliveryLead: '',
          techLead: '',
          businessOwner: '',
          processOwner: '',
          platformOwner: '',
          tags: ''
        },
        activeIterations: [
          'IT\\Sprint\\FY26\\Q1\\Sprint 1',
          'IT\\Sprint\\FY26\\Q1\\Sprint 2',
          'IT\\Sprint\\FY26\\Q1\\Sprint 3'
        ],
        customAreaPaths: [
          'IT\\BTE Tribe',
          'IT\\BTE Tribe\\Integration and DevOps Tooling',
          'IT\\BTE Tribe\\Platform Engineering'
        ]
      });
      setHasChanges(false);
      alert('Configuration reset to defaults.');
    }
  };

  const updateConfig = <K extends keyof EpicFeatureDefaults>(
    key: K,
    value: EpicFeatureDefaults[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateEpicConfig = <K extends keyof EpicFeatureDefaults['epic']>(
    key: K,
    value: EpicFeatureDefaults['epic'][K]
  ) => {
    setConfig(prev => ({
      ...prev,
      epic: { ...prev.epic, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateFeatureConfig = <K extends keyof EpicFeatureDefaults['feature']>(
    key: K,
    value: EpicFeatureDefaults['feature'][K]
  ) => {
    setConfig(prev => ({
      ...prev,
      feature: { ...prev.feature, [key]: value }
    }));
    setHasChanges(true);
  };

  const addIteration = () => {
    if (newIteration.trim() && !config.activeIterations.includes(newIteration.trim())) {
      updateConfig('activeIterations', [...config.activeIterations, newIteration.trim()]);
      setNewIteration('');
    }
  };

  const removeIteration = (iteration: string) => {
    updateConfig('activeIterations', config.activeIterations.filter(i => i !== iteration));
  };

  const addAreaPath = () => {
    if (newAreaPath.trim() && !config.customAreaPaths.includes(newAreaPath.trim())) {
      updateConfig('customAreaPaths', [...config.customAreaPaths, newAreaPath.trim()]);
      setNewAreaPath('');
    }
  };

  const removeAreaPath = (path: string) => {
    updateConfig('customAreaPaths', config.customAreaPaths.filter(p => p !== path));
  };

  return (
    <div className="epic-feature-config">
      <div className="config-header">
        <h2>Epic & Feature Configuration</h2>
        <p>Configure default values to speed up Epic and Feature creation</p>
        {hasChanges && <span className="changes-indicator">● Unsaved changes</span>}
      </div>

      <div className="config-actions">
        <button 
          onClick={saveConfiguration}
          className="btn btn-primary"
          disabled={!hasChanges}
        >
          Save Configuration
        </button>
        <button 
          onClick={loadConfiguration}
          className="btn btn-secondary"
        >
          Reload
        </button>
        <button 
          onClick={resetConfiguration}
          className="btn btn-outline"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="config-tabs">
        <button 
          className={`tab-button ${activeTab === 'common' ? 'active' : ''}`}
          onClick={() => setActiveTab('common')}
        >
          Common Defaults
        </button>
        <button 
          className={`tab-button ${activeTab === 'epic' ? 'active' : ''}`}
          onClick={() => setActiveTab('epic')}
        >
          Epic Defaults
        </button>
        <button 
          className={`tab-button ${activeTab === 'feature' ? 'active' : ''}`}
          onClick={() => setActiveTab('feature')}
        >
          Feature Defaults
        </button>
        <button 
          className={`tab-button ${activeTab === 'paths' ? 'active' : ''}`}
          onClick={() => setActiveTab('paths')}
        >
          Iterations & Paths
        </button>
      </div>

      <div className="config-content">
        {activeTab === 'common' && (
          <div className="config-section">
            <h3>Common Default Values</h3>
            <p>These defaults apply to both Epics and Features</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Default Priority</label>
                <select
                  value={config.priority}
                  onChange={(e) => updateConfig('priority', e.target.value)}
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Value Area</label>
                <select
                  value={config.valueArea}
                  onChange={(e) => updateConfig('valueArea', e.target.value)}
                >
                  {valueAreaOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Area Path</label>
                <select
                  value={config.areaPath}
                  onChange={(e) => updateConfig('areaPath', e.target.value)}
                >
                  {config.customAreaPaths.map(path => (
                    <option key={path} value={path}>{path}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Iteration Path</label>
                <select
                  value={config.iterationPath}
                  onChange={(e) => updateConfig('iterationPath', e.target.value)}
                >
                  {config.activeIterations.map(iteration => (
                    <option key={iteration} value={iteration}>{iteration}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'epic' && (
          <div className="config-section">
            <h3>Epic Default Values</h3>
            <p>Default values specific to Epic creation</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Default Epic Sizing</label>
                <select
                  value={config.epic.epicSizing}
                  onChange={(e) => updateEpicConfig('epicSizing', e.target.value)}
                >
                  {epicSizingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Risk Level</label>
                <select
                  value={config.epic.risk}
                  onChange={(e) => updateEpicConfig('risk', e.target.value)}
                >
                  {riskOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Epic Owner</label>
                <select
                  value={config.epic.epicOwner}
                  onChange={(e) => updateEpicConfig('epicOwner', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Delivery Lead</label>
                <select
                  value={config.epic.deliveryLead}
                  onChange={(e) => updateEpicConfig('deliveryLead', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Tech Lead</label>
                <select
                  value={config.epic.techLead}
                  onChange={(e) => updateEpicConfig('techLead', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Business Owner</label>
                <select
                  value={config.epic.businessOwner}
                  onChange={(e) => updateEpicConfig('businessOwner', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Process Owner</label>
                <select
                  value={config.epic.processOwner}
                  onChange={(e) => updateEpicConfig('processOwner', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Platform Owner</label>
                <select
                  value={config.epic.platformOwner}
                  onChange={(e) => updateEpicConfig('platformOwner', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Default Tags (semicolon-separated)</label>
                <input
                  type="text"
                  value={config.epic.tags}
                  onChange={(e) => updateEpicConfig('tags', e.target.value)}
                  placeholder="e.g., integration;devops;platform"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feature' && (
          <div className="config-section">
            <h3>Feature Default Values</h3>
            <p>Default values specific to Feature creation</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Default Product Owner</label>
                <select
                  value={config.feature.productOwner}
                  onChange={(e) => updateFeatureConfig('productOwner', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Delivery Lead</label>
                <select
                  value={config.feature.deliveryLead}
                  onChange={(e) => updateFeatureConfig('deliveryLead', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Tech Lead</label>
                <select
                  value={config.feature.techLead}
                  onChange={(e) => updateFeatureConfig('techLead', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Business Owner</label>
                <select
                  value={config.feature.businessOwner}
                  onChange={(e) => updateFeatureConfig('businessOwner', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Process Owner</label>
                <select
                  value={config.feature.processOwner}
                  onChange={(e) => updateFeatureConfig('processOwner', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Default Platform Owner</label>
                <select
                  value={config.feature.platformOwner}
                  onChange={(e) => updateFeatureConfig('platformOwner', e.target.value)}
                >
                  {teamMembers.map(member => (
                    <option key={member.value} value={member.value}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Default Tags (semicolon-separated)</label>
                <input
                  type="text"
                  value={config.feature.tags}
                  onChange={(e) => updateFeatureConfig('tags', e.target.value)}
                  placeholder="e.g., feature;user-story;frontend"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'paths' && (
          <div className="config-section">
            <h3>Active Iterations & Area Paths</h3>
            <p>Manage available iterations and area paths for quick selection</p>
            
            <div className="path-management">
              <div className="path-section">
                <h4>Active Iterations</h4>
                <div className="add-item">
                  <input
                    type="text"
                    value={newIteration}
                    onChange={(e) => setNewIteration(e.target.value)}
                    placeholder="e.g., IT\Sprint\FY26\Q1\Sprint 4"
                    onKeyPress={(e) => e.key === 'Enter' && addIteration()}
                  />
                  <button onClick={addIteration} className="btn btn-secondary">
                    Add Iteration
                  </button>
                </div>
                <div className="item-list">
                  {config.activeIterations.map(iteration => (
                    <div key={iteration} className="item-row">
                      <span>{iteration}</span>
                      <button 
                        onClick={() => removeIteration(iteration)}
                        className="btn btn-outline btn-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="path-section">
                <h4>Custom Area Paths</h4>
                <div className="add-item">
                  <input
                    type="text"
                    value={newAreaPath}
                    onChange={(e) => setNewAreaPath(e.target.value)}
                    placeholder="e.g., IT\BTE Tribe\New Team"
                    onKeyPress={(e) => e.key === 'Enter' && addAreaPath()}
                  />
                  <button onClick={addAreaPath} className="btn btn-secondary">
                    Add Area Path
                  </button>
                </div>
                <div className="item-list">
                  {config.customAreaPaths.map(path => (
                    <div key={path} className="item-row">
                      <span>{path}</span>
                      <button 
                        onClick={() => removeAreaPath(path)}
                        className="btn btn-outline btn-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export the configuration interface for use in other components
export const getEpicFeatureDefaults = (): EpicFeatureDefaults | null => {
  try {
    const saved = localStorage.getItem('epicFeatureDefaults');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load Epic/Feature defaults:', error);
    return null;
  }
};

export default EpicFeatureConfig;