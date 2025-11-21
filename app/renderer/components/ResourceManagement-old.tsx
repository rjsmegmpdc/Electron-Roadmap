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

interface Commitment {
  id: string;
  resource_id: number;
  period_start: string;
  period_end: string;
  commitment_type: 'per-day' | 'per-week' | 'per-fortnight';
  committed_hours: number;
  total_available_hours: number;
  allocated_hours: number;
  remaining_capacity: number;
  created_at: string;
  updated_at: string;
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

interface Feature {
  id: string;
  title: string;
  epic_id: string;
  project_id: string;
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

export const ResourceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'resources' | 'commitments' | 'allocations' | 'capacity'>('resources');
  const [resources, setResources] = useState<Resource[]>([]);
  const [capacities, setCapacities] = useState<CapacityCalculation[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Commitment form state
  const [commitmentForm, setCommitmentForm] = useState({
    resource_id: 0,
    period_start: '',
    period_end: '',
    commitment_type: 'per-day' as const,
    committed_hours: 8,
  });

  // Allocation form state with project/epic/feature hierarchy
  const [allocationForm, setAllocationForm] = useState({
    resource_id: 0,
    project_id: '',
    epic_id: '',
    feature_id: '',
    allocated_hours: 0,
    forecast_start_date: '',
    forecast_end_date: '',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    setError(null);
    try {
      const result = await window.electronAPI.coordinator?.getAllResources();
      setResources(result || []);
    } catch (err: any) {
      setError(`Failed to load resources: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const result = await window.electronAPI.getProjects();
      setProjects(result || []);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadEpicsForProject = async (projectId: string) => {
    try {
      const result = await window.electronAPI.getEpicsForProject(projectId);
      setEpics(result || []);
    } catch (err: any) {
      console.error('Failed to load epics:', err);
    }
  };

  const loadFeaturesForEpic = async (epicId: string) => {
    try {
      const result = await window.electronAPI.getFeaturesForEpic(epicId);
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
      setError(`Failed to load capacities: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllocationsForResource = async (resourceId: number) => {
    try {
      const result = await window.electronAPI.coordinator?.getAllocationsForResource({ resourceId });
      setAllocations(result || []);
    } catch (err: any) {
      setError(`Failed to load allocations: ${err.message}`);
    }
  };

  const handleCreateCommitment = async () => {
    if (!commitmentForm.resource_id || !commitmentForm.period_start || !commitmentForm.period_end) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await window.electronAPI.coordinator?.createCommitment(commitmentForm);
      alert('Commitment created successfully');
      setCommitmentForm({
        resource_id: 0,
        period_start: '',
        period_end: '',
        commitment_type: 'per-day',
        committed_hours: 8,
      });
    } catch (err: any) {
      setError(`Failed to create commitment: ${err.message}`);
    }
  };

  const handleCreateAllocation = async () => {
    if (!allocationForm.resource_id || !allocationForm.feature_id || !allocationForm.allocated_hours) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await window.electronAPI.coordinator?.createAllocation(allocationForm);
      alert('Allocation created successfully');
      setAllocationForm({
        resource_id: 0,
        feature_id: '',
        allocated_hours: 0,
        forecast_start_date: '',
        forecast_end_date: '',
      });
      if (selectedResource) {
        loadAllocationsForResource(selectedResource.id);
      }
    } catch (err: any) {
      setError(`Failed to create allocation: ${err.message}`);
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    if (!confirm('Are you sure you want to delete this allocation?')) return;

    try {
      await window.electronAPI.coordinator?.deleteAllocation({ allocationId });
      alert('Allocation deleted successfully');
      if (selectedResource) {
        loadAllocationsForResource(selectedResource.id);
      }
    } catch (err: any) {
      setError(`Failed to delete allocation: ${err.message}`);
    }
  };

  const filteredResources = resources.filter((r) =>
    r.resource_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.contract_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    // Dates are in DD-MM-YYYY format
    return dateStr;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal':
      case 'on-track':
        return 'text-green-600';
      case 'under-utilized':
      case 'at-risk':
        return 'text-yellow-600';
      case 'over-committed':
      case 'over-budget':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Resource Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['resources', 'commitments', 'allocations', 'capacity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Resources</h2>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg w-64"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Loading resources...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Area
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {resource.resource_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.contract_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.work_area || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.employee_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            setSelectedResource(resource);
                            setActiveTab('allocations');
                            loadAllocationsForResource(resource.id);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Allocations
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Commitments Tab */}
      {activeTab === 'commitments' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Create Resource Commitment</h2>
          <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource
                </label>
                <select
                  value={commitmentForm.resource_id}
                  onChange={(e) =>
                    setCommitmentForm({ ...commitmentForm, resource_id: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={0}>Select a resource</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.resource_name} ({r.contract_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Start (DD-MM-YYYY)
                  </label>
                  <input
                    type="text"
                    placeholder="01-01-2024"
                    value={commitmentForm.period_start}
                    onChange={(e) =>
                      setCommitmentForm({ ...commitmentForm, period_start: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period End (DD-MM-YYYY)
                  </label>
                  <input
                    type="text"
                    placeholder="31-12-2024"
                    value={commitmentForm.period_end}
                    onChange={(e) =>
                      setCommitmentForm({ ...commitmentForm, period_end: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="per-day">Per Day</option>
                  <option value="per-week">Per Week</option>
                  <option value="per-fortnight">Per Fortnight</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Committed Hours
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                onClick={handleCreateCommitment}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Create Commitment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allocations Tab */}
      {activeTab === 'allocations' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Resource Allocations</h2>

          {selectedResource && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold text-blue-900">
                📋 Selected Resource: {selectedResource.resource_name}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {selectedResource.contract_type} • {selectedResource.work_area || 'No work area'} • {selectedResource.email || 'No email'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Create Allocation Form */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">➕</span> Create New Allocation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resource Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Resource *
                  </label>
                  <select
                    value={allocationForm.resource_id}
                    onChange={(e) => {
                      const resourceId = Number(e.target.value);
                      setAllocationForm({ ...allocationForm, resource_id: resourceId });
                      const resource = resources.find(r => r.id === resourceId);
                      if (resource) setSelectedResource(resource);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Select a resource...</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.resource_name} ({r.contract_type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📁 Project *
                  </label>
                  <select
                    value={allocationForm.project_id}
                    onChange={(e) =>
                      setAllocationForm({ 
                        ...allocationForm, 
                        project_id: e.target.value,
                        epic_id: '',
                        feature_id: ''
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Epic Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Epic *
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select an epic...</option>
                    {epics.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                  {!allocationForm.project_id && (
                    <p className="text-xs text-gray-500 mt-1">Select a project first</p>
                  )}
                </div>

                {/* Feature Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⭐ Feature *
                  </label>
                  <select
                    value={allocationForm.feature_id}
                    onChange={(e) =>
                      setAllocationForm({ ...allocationForm, feature_id: e.target.value })
                    }
                    disabled={!allocationForm.epic_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a feature...</option>
                    {features.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                  {!allocationForm.epic_id && (
                    <p className="text-xs text-gray-500 mt-1">Select an epic first</p>
                  )}
                </div>

                {/* Allocated Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏱️ Allocated Hours *
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Forecast Dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Forecast Start
                  </label>
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    value={allocationForm.forecast_start_date}
                    onChange={(e) =>
                      setAllocationForm({ ...allocationForm, forecast_start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Forecast End
                  </label>
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    value={allocationForm.forecast_end_date}
                    onChange={(e) =>
                      setAllocationForm({ ...allocationForm, forecast_end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    onClick={handleCreateAllocation}
                    disabled={!allocationForm.resource_id || !allocationForm.feature_id || !allocationForm.allocated_hours}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    ✅ Create Allocation
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Total Resources</p>
                  <p className="text-2xl font-bold text-blue-600">{resources.length}</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-green-600">{projects.length}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Active Allocations</p>
                  <p className="text-2xl font-bold text-purple-600">{allocations.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Allocations */}
          {allocations.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Feature ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Allocated Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actual Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Variance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allocations.map((alloc) => (
                    <tr key={alloc.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alloc.feature_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alloc.allocated_hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alloc.actual_hours_to_date}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alloc.variance_hours}h
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusColor(alloc.status)}`}>
                        {alloc.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDeleteAllocation(alloc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Capacity Tab */}
      {activeTab === 'capacity' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Capacity Overview</h2>
            <button
              onClick={loadCapacities}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading capacities...</div>
          ) : capacities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No capacity data available. Create commitments first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capacities.map((cap) => (
                <div key={cap.resource_id} className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">{cap.resource_name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {formatDate(cap.period_start)} - {formatDate(cap.period_end)}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Capacity:</span>
                      <span className="text-sm font-medium">{cap.total_capacity_hours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Allocated:</span>
                      <span className="text-sm font-medium">{cap.allocated_hours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Actual:</span>
                      <span className="text-sm font-medium">{cap.actual_hours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining:</span>
                      <span className="text-sm font-medium">{cap.remaining_capacity}h</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm text-gray-600">Utilization:</span>
                      <span className="text-sm font-bold">{cap.utilization_percent.toFixed(1)}%</span>
                    </div>
                    <div className={`text-center py-2 rounded ${getStatusColor(cap.status)} font-semibold`}>
                      {cap.status.toUpperCase()}
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          cap.utilization_percent < 70
                            ? 'bg-yellow-500'
                            : cap.utilization_percent > 100
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(cap.utilization_percent, 100)}%` }}
                      />
                    </div>
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
