import { create } from 'zustand';
import type { Project, CreateProjectRequest, UpdateProjectRequest, ProjectStatus, IpcResponse } from '../../main/preload';

interface ProjectState {
  // Data
  projects: Project[];
  currentProject: Project | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Statistics
  stats: {
    total: number;
    by_status: Record<ProjectStatus, number>;
    total_budget_cents: number;
  } | null;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCreating: (isCreating: boolean) => void;
  setUpdating: (isUpdating: boolean) => void;
  setDeleting: (isDeleting: boolean) => void;
  setStats: (stats: ProjectState['stats']) => void;
  
  // Async actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<{ success: boolean; project?: Project; errors?: string[] }>;
  updateProject: (data: UpdateProjectRequest) => Promise<{ success: boolean; project?: Project; errors?: string[] }>;
  deleteProject: (id: string) => Promise<{ success: boolean; errors?: string[] }>;
  fetchProjectsByStatus: (status: ProjectStatus) => Promise<void>;
  fetchProjectStats: () => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  stats: null,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,
  
  // Synchronous actions
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCreating: (isCreating) => set({ isCreating }),
  setUpdating: (isUpdating) => set({ isUpdating }),
  setDeleting: (isDeleting) => set({ isDeleting }),
  setStats: (stats) => set({ stats }),
  
  // Async actions
  fetchProjects: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await window.electronAPI.getAllProjects();
      if (response.success && response.data) {
        set({ projects: response.data, loading: false });
      } else {
        const errorMessage = response.errors?.join(', ') || 'Failed to fetch projects';
        set({ error: errorMessage, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      set({ error: errorMessage, loading: false });
    }
  },
  
  fetchProject: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await window.electronAPI.getProjectById(id);
      if (response.success) {
        set({ currentProject: response.data || null, loading: false });
      } else {
        const errorMessage = response.errors?.join(', ') || 'Failed to fetch project';
        set({ error: errorMessage, loading: false, currentProject: null });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project';
      set({ error: errorMessage, loading: false, currentProject: null });
    }
  },
  
  createProject: async (data: CreateProjectRequest) => {
    set({ isCreating: true, error: null });
    
    try {
      const response = await window.electronAPI.createProject(data);
      
      if (response.success && response.data) {
        const { projects } = get();
        set({ 
          projects: [...projects, response.data],
          isCreating: false,
          currentProject: response.data
        });
      } else {
        set({ 
          error: response.errors?.join(', ') || 'Failed to create project',
          isCreating: false 
        });
      }
      
      return {
        success: response.success,
        project: response.data,
        errors: response.errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      set({ error: errorMessage, isCreating: false });
      return { success: false, errors: [errorMessage] };
    }
  },
  
  updateProject: async (data: UpdateProjectRequest) => {
    set({ isUpdating: true, error: null });
    
    try {
      const response = await window.electronAPI.updateProject(data);
      
      if (response.success && response.data) {
        const { projects } = get();
        const updatedProjects = projects.map(p => 
          p.id === data.id ? response.data! : p
        );
        
        set({ 
          projects: updatedProjects,
          isUpdating: false,
          currentProject: response.data
        });
      } else {
        set({ 
          error: response.errors?.join(', ') || 'Failed to update project',
          isUpdating: false 
        });
      }
      
      return {
        success: response.success,
        project: response.data,
        errors: response.errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      set({ error: errorMessage, isUpdating: false });
      return { success: false, errors: [errorMessage] };
    }
  },
  
  deleteProject: async (id: string) => {
    set({ isDeleting: true, error: null });
    
    try {
      const response = await window.electronAPI.deleteProject(id);
      
      if (response.success) {
        const { projects, currentProject } = get();
        const filteredProjects = projects.filter(p => p.id !== id);
        
        set({ 
          projects: filteredProjects,
          isDeleting: false,
          currentProject: currentProject?.id === id ? null : currentProject
        });
      } else {
        set({ 
          error: response.errors?.join(', ') || 'Failed to delete project',
          isDeleting: false 
        });
      }
      
      return {
        success: response.success,
        errors: response.errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      set({ error: errorMessage, isDeleting: false });
      return { success: false, errors: [errorMessage] };
    }
  },
  
  fetchProjectsByStatus: async (status: ProjectStatus) => {
    set({ loading: true, error: null });
    
    try {
      const response = await window.electronAPI.getProjectsByStatus(status);
      if (response.success && response.data) {
        set({ projects: response.data, loading: false });
      } else {
        const errorMessage = response.errors?.join(', ') || 'Failed to fetch projects by status';
        set({ error: errorMessage, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects by status';
      set({ error: errorMessage, loading: false });
    }
  },
  
  fetchProjectStats: async () => {
    set({ error: null });
    
    try {
      const response = await window.electronAPI.getProjectStats();
      if (response.success && response.data) {
        set({ stats: response.data });
      } else {
        const errorMessage = response.errors?.join(', ') || 'Failed to fetch project statistics';
        set({ error: errorMessage });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project statistics';
      set({ error: errorMessage });
    }
  },
  
  // Utility actions
  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}));

// Computed selectors for convenience
export const projectSelectors = {
  getProjectById: (id: string) => {
    const { projects } = useProjectStore.getState();
    return projects.find(p => p.id === id) || null;
  },
  
  getProjectsByStatus: (status: ProjectStatus) => {
    const { projects } = useProjectStore.getState();
    return projects.filter(p => p.status === status);
  },
  
  getActiveProjects: () => {
    return projectSelectors.getProjectsByStatus('active');
  },
  
  getCompletedProjects: () => {
    return projectSelectors.getProjectsByStatus('completed');
  },
  
  isProjectLoading: () => {
    const { loading, isCreating, isUpdating, isDeleting } = useProjectStore.getState();
    return loading || isCreating || isUpdating || isDeleting;
  },
  
  hasProjects: () => {
    const { projects } = useProjectStore.getState();
    return projects.length > 0;
  },
  
  getTotalBudget: () => {
    const { projects } = useProjectStore.getState();
    return projects.reduce((total, project) => total + project.budget_cents, 0);
  },
  
  getProjectsCount: () => {
    const { projects } = useProjectStore.getState();
    return projects.length;
  }
};

// Type for the Electron API that needs to be exposed
declare global {
  interface Window {
    electronAPI: {
      // Project operations
      getAllProjects: () => Promise<IpcResponse<Project[]>>;
      getProjectById: (id: string) => Promise<IpcResponse<Project | null>>;
      createProject: (data: CreateProjectRequest) => Promise<IpcResponse<Project>>;
      updateProject: (data: UpdateProjectRequest) => Promise<IpcResponse<Project>>;
      deleteProject: (id: string) => Promise<IpcResponse<void>>;
      getProjectsByStatus: (status: ProjectStatus) => Promise<IpcResponse<Project[]>>;
      getProjectStats: () => Promise<IpcResponse<{
        total: number;
        by_status: Record<ProjectStatus, number>;
        total_budget_cents: number;
      }>>;
    };
  }
}
