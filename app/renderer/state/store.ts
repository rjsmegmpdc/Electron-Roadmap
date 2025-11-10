import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types
type NZDate = string; // DD-MM-YYYY

export interface Project {
  id: string;
  title: string;
  description?: string;
  lane?: string;
  start_date: NZDate;
  end_date: NZDate;
  status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
  pm_name?: string;
  budget_nzd: number;
  financial_treatment: 'CAPEX' | 'OPEX';
  row?: number | null;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  start_date: NZDate;
  end_date: NZDate;
  effort_hours?: number;
  status: Project['status'];
  assigned_resources?: string[];
}

export interface Epic {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  state: 'New' | 'Active' | 'Resolved' | 'Closed' | 'Removed';
  effort?: number;
  business_value?: number;
  time_criticality?: number;
  start_date?: NZDate;
  end_date?: NZDate;
  assigned_to?: string;
  area_path?: string;
  iteration_path?: string;
  risk?: string;
  value_area?: string;
  parent_feature?: string;
  sort_order: number;
}

export interface Feature {
  id: string;
  epic_id: string;
  project_id: string;
  title: string;
  description?: string;
  state: 'New' | 'Active' | 'Resolved' | 'Closed' | 'Removed';
  effort?: number;
  business_value?: number;
  time_criticality?: number;
  start_date?: NZDate;
  end_date?: NZDate;
  assigned_to?: string;
  area_path?: string;
  iteration_path?: string;
  risk?: string;
  value_area?: string;
  sort_order: number;
}

export interface Dependency {
  id: string;
  from: { type: 'project' | 'task'; id: string };
  to: { type: 'project' | 'task'; id: string };
  kind: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days?: number;
  note?: string;
}

type Connection = 'connected' | 'reconnecting' | 'disconnected';
type Mode = 'solo' | 'host' | 'client';

interface UIState {
  selectedProject: string | null;
  selectedTask: string | null;
  timelineZoom: number; // days per pixel
  showDependencies: boolean;
  showArchived: boolean; // Whether to show archived projects
  currentView: 'timeline' | 'fortnight' | 'details' | 'project-list' | 'project-detail';
  viewingProjectId: string | null; // For project detail view
  sidebarOpen: boolean;
  linkingMode: { active: boolean; from?: { type: 'project' | 'task'; id: string } };
}

interface AppState {
  // Data
  projects: Record<string, Project>;
  tasks: Record<string, Task>;
  epics: Record<string, Epic>;
  features: Record<string, Feature>;
  dependencies: Record<string, Dependency>;
  
  // Connection
  mode: Mode;
  connection: Connection;
  hostBaseUrl?: string;
  lastEventId?: string;
  
  // UI State
  ui: UIState;
  
  // User
  user: string;
  
  // Loading states
  loading: {
    projects: boolean;
    mutations: boolean;
    import: boolean;
    export: boolean;
  };
  
  // Errors
  errors: string[];
}

interface AppActions {
  // Connection
  setMode: (mode: Mode, baseUrl?: string) => void;
  setConnection: (connection: Connection) => void;
  setLastEventId: (id: string) => void;
  
  // Data mutations
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  setEpics: (epics: Epic[]) => void;
  setFeatures: (features: Feature[]) => void;
  setDependencies: (deps: Dependency[]) => void;
  upsertProject: (project: Project) => void;
  upsertTask: (task: Task) => void;
  upsertEpic: (epic: Epic) => void;
  upsertFeature: (feature: Feature) => void;
  upsertDependency: (dep: Dependency) => void;
  removeProject: (id: string) => void;
  removeTask: (id: string) => void;
  removeEpic: (id: string) => void;
  removeFeature: (id: string) => void;
  removeDependency: (id: string) => void;
  
  // UI actions
  setSelectedProject: (id: string | null) => void;
  setSelectedTask: (id: string | null) => void;
  setTimelineZoom: (zoom: number) => void;
  setShowDependencies: (show: boolean) => void;
  setShowArchived: (show: boolean) => void;
  setCurrentView: (view: 'timeline' | 'fortnight' | 'details' | 'project-list' | 'project-detail') => void;
  setSidebarOpen: (open: boolean) => void;
  setLinkingMode: (mode: { active: boolean; from?: { type: 'project' | 'task'; id: string } }) => void;
  
  // Navigation actions
  showProjectDetail: (projectId: string) => void;
  showProjectList: () => void;
  
  // User
  setUser: (user: string) => void;
  
  // Loading
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
  
  // Errors
  addError: (error: string) => void;
  clearErrors: () => void;
  removeError: (index: number) => void;
  
  // Computed getters
  getProjectsAsArray: () => Project[];
  getTasksForProject: (projectId: string) => Task[];
  getEpicsForProject: (projectId: string) => Epic[];
  getFeaturesForEpic: (epicId: string) => Feature[];
  getDependenciesForProject: (projectId: string) => Dependency[];
  getProjectById: (id: string) => Project | undefined;
  getEpicById: (id: string) => Epic | undefined;
  getFeatureById: (id: string) => Feature | undefined;
  
  // Data operations
  loadProjects: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadTasksForProject: (projectId: string) => Promise<void>;
  loadEpics: () => Promise<void>;
  loadEpicsForProject: (projectId: string) => Promise<void>;
  loadFeatures: () => Promise<void>;
  loadFeaturesForEpic: (epicId: string) => Promise<void>;
  createProject: (project: (Omit<Project, 'id'> & { customId?: string })) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createEpic: (epic: Omit<Epic, 'id' | 'sort_order'>) => Promise<void>;
  updateEpic: (id: string, updates: Partial<Epic>) => Promise<void>;
  deleteEpic: (id: string) => Promise<void>;
  createFeature: (feature: Omit<Feature, 'id' | 'sort_order'>) => Promise<void>;
  updateFeature: (id: string, updates: Partial<Feature>) => Promise<void>;
  deleteFeature: (id: string) => Promise<void>;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  projects: {},
  tasks: {},
  epics: {},
  features: {},
  dependencies: {},
  
  mode: 'solo',
  connection: 'connected',
  hostBaseUrl: undefined,
  lastEventId: undefined,
  
  ui: {
    selectedProject: null,
    selectedTask: null,
    timelineZoom: 2, // 2 days per pixel
    showDependencies: true,
    showArchived: false, // Hide archived projects by default
    currentView: 'project-list',
    viewingProjectId: null,
    sidebarOpen: true,
    linkingMode: { active: false }
  },
  
  user: 'developer',
  
  loading: {
    projects: false,
    mutations: false,
    import: false,
    export: false
  },
  
  errors: [],
  
  // Actions
  setMode: (mode, hostBaseUrl) => set({ mode, hostBaseUrl }),
  setConnection: (connection) => set({ connection }),
  setLastEventId: (lastEventId) => set({ lastEventId }),
  
  setProjects: (projectsArray) => {
    const projects = projectsArray.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    set({ projects });
  },
  
  setTasks: (tasksArray) => {
    const tasks = tasksArray.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
    set({ tasks });
  },
  
  setEpics: (epicsArray) => {
    const epics = epicsArray.reduce((acc, e) => ({ ...acc, [e.id]: e }), {});
    set({ epics });
  },
  
  setFeatures: (featuresArray) => {
    const features = featuresArray.reduce((acc, f) => ({ ...acc, [f.id]: f }), {});
    set({ features });
  },
  
  setDependencies: (depsArray) => {
    const dependencies = depsArray.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});
    set({ dependencies });
  },
  
  upsertProject: (project) => set((state) => ({
    projects: { ...state.projects, [project.id]: project }
  })),
  
  upsertTask: (task) => set((state) => ({
    tasks: { ...state.tasks, [task.id]: task }
  })),
  
  upsertEpic: (epic) => set((state) => ({
    epics: { ...state.epics, [epic.id]: epic }
  })),
  
  upsertFeature: (feature) => set((state) => ({
    features: { ...state.features, [feature.id]: feature }
  })),
  
  upsertDependency: (dep) => set((state) => ({
    dependencies: { ...state.dependencies, [dep.id]: dep }
  })),
  
  removeProject: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.projects;
    return { projects: rest };
  }),
  
  removeTask: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.tasks;
    return { tasks: rest };
  }),
  
  removeEpic: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.epics;
    return { epics: rest };
  }),
  
  removeFeature: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.features;
    return { features: rest };
  }),
  
  removeDependency: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.dependencies;
    return { dependencies: rest };
  }),
  
  setSelectedProject: (selectedProject) => set((state) => ({
    ui: { ...state.ui, selectedProject }
  })),
  
  setSelectedTask: (selectedTask) => set((state) => ({
    ui: { ...state.ui, selectedTask }
  })),
  
  setTimelineZoom: (timelineZoom) => set((state) => ({
    ui: { ...state.ui, timelineZoom }
  })),
  
  setShowDependencies: (showDependencies) => set((state) => ({
    ui: { ...state.ui, showDependencies }
  })),
  
  setShowArchived: (showArchived) => set((state) => ({
    ui: { ...state.ui, showArchived }
  })),
  
  setCurrentView: (currentView) => set((state) => ({
    ui: { ...state.ui, currentView }
  })),
  
  setSidebarOpen: (sidebarOpen) => set((state) => ({
    ui: { ...state.ui, sidebarOpen }
  })),
  
  setLinkingMode: (linkingMode) => set((state) => ({
    ui: { ...state.ui, linkingMode }
  })),
  
  showProjectDetail: (projectId) => set((state) => ({
    ui: { ...state.ui, currentView: 'project-detail', viewingProjectId: projectId }
  })),
  
  showProjectList: () => set((state) => ({
    ui: { ...state.ui, currentView: 'project-list', viewingProjectId: null }
  })),
  
  setUser: (user) => set({ user }),
  
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),
  
  addError: (error) => set((state) => ({
    errors: [...state.errors, error]
  })),
  
  clearErrors: () => set({ errors: [] }),
  
  removeError: (index) => set((state) => ({
    errors: state.errors.filter((_, i) => i !== index)
  })),
  
  // Computed getters
  getProjectsAsArray: () => Object.values(get().projects),
  
  getTasksForProject: (projectId) => 
    Object.values(get().tasks).filter(t => t.project_id === projectId),
  
  getEpicsForProject: (projectId) => 
    Object.values(get().epics).filter(e => e.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order),
  
  getFeaturesForEpic: (epicId) => 
    Object.values(get().features).filter(f => f.epic_id === epicId).sort((a, b) => a.sort_order - b.sort_order),
  
  getDependenciesForProject: (projectId) => 
    Object.values(get().dependencies).filter(d => 
      (d.from.type === 'project' && d.from.id === projectId) ||
      (d.to.type === 'project' && d.to.id === projectId)
    ),
  
  getProjectById: (id) => get().projects[id],
  
  getEpicById: (id) => get().epics[id],
  
  getFeatureById: (id) => get().features[id],
  
  // Data operations
  loadProjects: async () => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    state.setLoading('projects', true);
    try {
      const response = await window.electronAPI.getAllProjects();
      if (response.success && response.data) {
        // Convert budget_cents to budget_nzd for UI compatibility
        const convertedProjects = response.data.map(project => ({
          ...project,
          budget_nzd: (project.budget_cents || 0) / 100
        }));
        state.setProjects(convertedProjects);
        console.log(`Loaded ${response.data.length} projects from database`);
      } else {
        const errorMessage = response.errors?.join(', ') || 'Failed to fetch projects';
        state.addError(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      state.addError(`Failed to load projects: ${error.message}`);
    } finally {
      state.setLoading('projects', false);
    }
  },
  
  createProject: async (projectData: (Omit<Project, 'id'> & { customId?: string })) => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    const { customId, budget_nzd, ...data } = projectData;
    
    // Convert budget_nzd to budget_cents and format for new API
    const createProjectRequest = {
      title: data.title,
      description: data.description || '',
      lane: data.lane || '',
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      pm_name: data.pm_name || '',
      budget_nzd: budget_nzd ? budget_nzd.toString() : '0',
      financial_treatment: data.financial_treatment || 'CAPEX',
      row: data.row
    };
    
    state.setLoading('mutations', true);
    try {
      const response = await window.electronAPI.createProject(createProjectRequest);
      if (response.success && response.data) {
        // Convert back to old format for the store
        const projectWithNzd = {
          ...response.data,
          budget_nzd: (response.data.budget_cents || 0) / 100
        };
        state.upsertProject(projectWithNzd);
        console.log('Project created:', response.data.id);
      } else {
        const errorMessage = response.errors?.join(', ') || 'Failed to create project';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);
      state.addError(`Failed to create project: ${error.message}`);
      throw error;
    } finally {
      state.setLoading('mutations', false);
    }
  },
  
  updateProject: async (id, updates) => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    // Handle ID changes
    const payload: any = { id, ...updates };
    if (updates.customId && updates.customId !== id) {
      payload.newId = updates.customId;
      delete payload.customId; // Remove customId from the payload as backend expects newId
    }
    
    const mutation = {
      opId: `update-${Date.now()}`,
      user: state.user,
      ts: new Date().toISOString(),
      type: 'project.update',
      payload
    };
    
    state.setLoading('mutations', true);
    try {
      const result = await window.electronAPI.applyMutation(mutation);
      if (result.success) {
        const currentProject = state.getProjectById(id);
        if (currentProject) {
          const updatedProject = { ...currentProject, ...updates };
          
          // Handle ID change in the store
          if (payload.newId && payload.newId !== id) {
            // Remove old project and add with new ID
            state.removeProject(id);
            updatedProject.id = payload.newId;
            state.upsertProject(updatedProject);
            
            // Update UI state if this project was selected
            if (state.ui.selectedProject === id) {
              state.setSelectedProject(payload.newId);
            }
            if (state.ui.viewingProjectId === id) {
              state.showProjectDetail(payload.newId);
            }
            
            console.log('Project updated with new ID:', id, '->', payload.newId);
          } else {
            state.upsertProject(updatedProject);
            console.log('Project updated:', id);
          }
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to update project:', error);
      state.addError(`Failed to update project: ${error.message}`);
      throw error;
    } finally {
      state.setLoading('mutations', false);
    }
  },
  
  deleteProject: async (id) => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    const mutation = {
      opId: `delete-${Date.now()}`,
      user: state.user,
      ts: new Date().toISOString(),
      type: 'project.delete',
      payload: { id }
    };
    
    state.setLoading('mutations', true);
    try {
      const result = await window.electronAPI.applyMutation(mutation);
      if (result.success) {
        state.removeProject(id);
        if (state.ui.selectedProject === id) {
          state.setSelectedProject(null);
        }
        console.log('Project deleted:', id);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      state.addError(`Failed to delete project: ${error.message}`);
      throw error;
    } finally {
      state.setLoading('mutations', false);
    }
  },
  
  // Task operations
  loadTasks: async () => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    state.setLoading('projects', true);
    try {
      const tasks = await window.electronAPI.getTasks();
      state.setTasks(tasks);
      console.log(`Loaded ${tasks.length} tasks from database`);
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      state.addError(`Failed to load tasks: ${error.message}`);
    } finally {
      state.setLoading('projects', false);
    }
  },
  
  loadTasksForProject: async (projectId) => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    try {
      const tasks = await window.electronAPI.getTasksForProject(projectId);
      // Merge tasks into the store while preserving other tasks
      const currentTasks = get().tasks;
      const updatedTasks = { ...currentTasks };
      
      tasks.forEach(task => {
        updatedTasks[task.id] = task;
      });
      
      set({ tasks: updatedTasks });
      console.log(`Loaded ${tasks.length} tasks for project ${projectId}`);
    } catch (error: any) {
      console.error('Failed to load tasks for project:', error);
      state.addError(`Failed to load tasks for project: ${error.message}`);
    }
  },
  
  createTask: async (taskData) => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    const task = {
      ...taskData,
      id: `TSK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    };
    
    const mutation = {
      opId: `create-task-${Date.now()}`,
      user: state.user,
      ts: new Date().toISOString(),
      type: 'task.create',
      payload: task
    };
    
    state.setLoading('mutations', true);
    try {
      const result = await window.electronAPI.applyMutation(mutation);
      if (result.success) {
        state.upsertTask(task);
        console.log('Task created:', task.id);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to create task:', error);
      state.addError(`Failed to create task: ${error.message}`);
      throw error;
    } finally {
      state.setLoading('mutations', false);
    }
  },
  
  updateTask: async (id, updates) => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    const mutation = {
      opId: `update-task-${Date.now()}`,
      user: state.user,
      ts: new Date().toISOString(),
      type: 'task.update',
      payload: { id, ...updates }
    };
    
    state.setLoading('mutations', true);
    try {
      const result = await window.electronAPI.applyMutation(mutation);
      if (result.success) {
        const currentTask = state.tasks[id];
        if (currentTask) {
          const updatedTask = { ...currentTask, ...updates };
          state.upsertTask(updatedTask);
          console.log('Task updated:', id);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to update task:', error);
      state.addError(`Failed to update task: ${error.message}`);
      throw error;
    } finally {
      state.setLoading('mutations', false);
    }
  },
  
  deleteTask: async (id) => {
    const state = get();
    if (!window.electronAPI) {
      state.addError('Electron API not available');
      return;
    }
    
    const mutation = {
      opId: `delete-task-${Date.now()}`,
      user: state.user,
      ts: new Date().toISOString(),
      type: 'task.delete',
      payload: { id }
    };
    
    state.setLoading('mutations', true);
    try {
      const result = await window.electronAPI.applyMutation(mutation);
      if (result.success) {
        state.removeTask(id);
        if (state.ui.selectedTask === id) {
          state.setSelectedTask(null);
        }
        console.log('Task deleted:', id);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      state.addError(`Failed to delete task: ${error.message}`);
      throw error;
    } finally {
      state.setLoading('mutations', false);
    }
  }
})));

console.log('Zustand store initialized');