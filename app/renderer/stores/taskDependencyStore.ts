import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Task types (mirroring the main process types)
export type TaskStatus = 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  start_date: string; // DD-MM-YYYY format
  end_date: string;   // DD-MM-YYYY format
  effort_hours: number;
  status: TaskStatus;
  assigned_resources: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
  effort_hours?: number;
  status: TaskStatus;
  assigned_resources?: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

// Dependency types (mirroring the main process types)
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';
export type EntityType = 'project' | 'task';

export interface Dependency {
  id: string;
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  kind: DependencyType;
  lag_days: number;
  note: string;
  created_at: string;
}

export interface CreateDependencyRequest {
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  kind: DependencyType;
  lag_days?: number;
  note?: string;
}

export interface UpdateDependencyRequest {
  id: string;
  kind?: DependencyType;
  lag_days?: number;
  note?: string;
}

// Store state interface
interface TaskDependencyState {
  // Task data
  tasks: Record<string, Task>;
  tasksByProject: Record<string, string[]>; // project_id -> task_ids[]
  currentTask: Task | null;
  
  // Dependency data
  dependencies: Record<string, Dependency>;
  dependenciesByEntity: Record<string, string[]>; // entity_key -> dependency_ids[]
  
  // UI state for tasks
  taskUI: {
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    selectedTaskIds: Set<string>;
    filterStatus: TaskStatus | 'all';
    filterProject: string | 'all';
  };
  
  // UI state for dependencies
  dependencyUI: {
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    showDependencies: boolean;
    linkingMode: {
      active: boolean;
      from?: { type: EntityType; id: string };
    };
    selectedDependencyIds: Set<string>;
  };
  
  // Statistics
  taskStats: {
    total: number;
    by_status: Record<TaskStatus, number>;
    total_effort_hours: number;
  } | null;
  
  dependencyStats: {
    total: number;
    by_kind: Record<DependencyType, number>;
    by_entity_type: {
      'project-to-project': number;
      'project-to-task': number;
      'task-to-project': number;
      'task-to-task': number;
    };
  } | null;
}

interface TaskDependencyActions {
  // Task actions
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setCurrentTask: (task: Task | null) => void;
  
  // Dependency actions
  setDependencies: (dependencies: Dependency[]) => void;
  upsertDependency: (dependency: Dependency) => void;
  removeDependency: (dependencyId: string) => void;
  
  // UI actions for tasks
  setTaskLoading: (loading: boolean) => void;
  setTaskError: (error: string | null) => void;
  setTaskCreating: (isCreating: boolean) => void;
  setTaskUpdating: (isUpdating: boolean) => void;
  setTaskDeleting: (isDeleting: boolean) => void;
  setSelectedTasks: (taskIds: Set<string>) => void;
  setTaskFilter: (status: TaskStatus | 'all', project?: string | 'all') => void;
  
  // UI actions for dependencies
  setDependencyLoading: (loading: boolean) => void;
  setDependencyError: (error: string | null) => void;
  setDependencyCreating: (isCreating: boolean) => void;
  setDependencyUpdating: (isUpdating: boolean) => void;
  setDependencyDeleting: (isDeleting: boolean) => void;
  setShowDependencies: (show: boolean) => void;
  setLinkingMode: (mode: { active: boolean; from?: { type: EntityType; id: string } }) => void;
  setSelectedDependencies: (dependencyIds: Set<string>) => void;
  
  // Statistics actions
  setTaskStats: (stats: TaskDependencyState['taskStats']) => void;
  setDependencyStats: (stats: TaskDependencyState['dependencyStats']) => void;
  
  // Async actions (these would be implemented when we add IPC handlers)
  fetchTasks: () => Promise<void>;
  fetchTasksByProject: (projectId: string) => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<{ success: boolean; task?: Task; errors?: string[] }>;
  updateTask: (data: UpdateTaskRequest) => Promise<{ success: boolean; task?: Task; errors?: string[] }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; errors?: string[] }>;
  fetchTaskStats: () => Promise<void>;
  
  fetchDependencies: () => Promise<void>;
  fetchDependenciesForEntity: (entityType: EntityType, entityId: string) => Promise<void>;
  createDependency: (data: CreateDependencyRequest) => Promise<{ success: boolean; dependency?: Dependency; errors?: string[] }>;
  updateDependency: (data: UpdateDependencyRequest) => Promise<{ success: boolean; dependency?: Dependency; errors?: string[] }>;
  deleteDependency: (dependencyId: string) => Promise<{ success: boolean; errors?: string[] }>;
  fetchDependencyStats: () => Promise<void>;
  
  // Computed selectors
  getTasksAsArray: () => Task[];
  getTasksByProjectId: (projectId: string) => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  getFilteredTasks: () => Task[];
  
  getDependenciesAsArray: () => Dependency[];
  getDependencyById: (dependencyId: string) => Dependency | undefined;
  getDependenciesForEntity: (entityType: EntityType, entityId: string) => Dependency[];
  getDependenciesFromEntity: (entityType: EntityType, entityId: string) => Dependency[];
  getDependenciesToEntity: (entityType: EntityType, entityId: string) => Dependency[];
  
  // Utility actions
  clearTaskError: () => void;
  clearDependencyError: () => void;
  reset: () => void;
}

type TaskDependencyStore = TaskDependencyState & TaskDependencyActions;

const initialState: TaskDependencyState = {
  tasks: {},
  tasksByProject: {},
  currentTask: null,
  dependencies: {},
  dependenciesByEntity: {},
  
  taskUI: {
    loading: false,
    error: null,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    selectedTaskIds: new Set(),
    filterStatus: 'all',
    filterProject: 'all',
  },
  
  dependencyUI: {
    loading: false,
    error: null,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    showDependencies: true,
    linkingMode: { active: false },
    selectedDependencyIds: new Set(),
  },
  
  taskStats: null,
  dependencyStats: null,
};

export const useTaskDependencyStore = create<TaskDependencyStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // Task data actions
    setTasks: (tasksArray) => {
      const tasks = tasksArray.reduce((acc, task) => ({ ...acc, [task.id]: task }), {});
      
      // Build project-to-tasks index
      const tasksByProject: Record<string, string[]> = {};
      tasksArray.forEach(task => {
        if (!tasksByProject[task.project_id]) {
          tasksByProject[task.project_id] = [];
        }
        tasksByProject[task.project_id].push(task.id);
      });
      
      set({ tasks, tasksByProject });
    },
    
    upsertTask: (task) => set((state) => {
      const newTasks = { ...state.tasks, [task.id]: task };
      
      // Update project-to-tasks index
      const newTasksByProject = { ...state.tasksByProject };
      if (!newTasksByProject[task.project_id]) {
        newTasksByProject[task.project_id] = [];
      }
      if (!newTasksByProject[task.project_id].includes(task.id)) {
        newTasksByProject[task.project_id].push(task.id);
      }
      
      return { tasks: newTasks, tasksByProject: newTasksByProject };
    }),
    
    removeTask: (taskId) => set((state) => {
      const { [taskId]: removed, ...remainingTasks } = state.tasks;
      
      // Update project-to-tasks index
      const newTasksByProject = { ...state.tasksByProject };
      Object.keys(newTasksByProject).forEach(projectId => {
        newTasksByProject[projectId] = newTasksByProject[projectId].filter(id => id !== taskId);
        if (newTasksByProject[projectId].length === 0) {
          delete newTasksByProject[projectId];
        }
      });
      
      return { 
        tasks: remainingTasks, 
        tasksByProject: newTasksByProject,
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask
      };
    }),
    
    setCurrentTask: (currentTask) => set({ currentTask }),
    
    // Dependency data actions
    setDependencies: (dependenciesArray) => {
      const dependencies = dependenciesArray.reduce((acc, dep) => ({ ...acc, [dep.id]: dep }), {});
      
      // Build entity-to-dependencies index
      const dependenciesByEntity: Record<string, string[]> = {};
      dependenciesArray.forEach(dep => {
        const fromKey = `${dep.from_type}:${dep.from_id}`;
        const toKey = `${dep.to_type}:${dep.to_id}`;
        
        if (!dependenciesByEntity[fromKey]) {
          dependenciesByEntity[fromKey] = [];
        }
        if (!dependenciesByEntity[toKey]) {
          dependenciesByEntity[toKey] = [];
        }
        
        dependenciesByEntity[fromKey].push(dep.id);
        dependenciesByEntity[toKey].push(dep.id);
      });
      
      set({ dependencies, dependenciesByEntity });
    },
    
    upsertDependency: (dependency) => set((state) => {
      const newDependencies = { ...state.dependencies, [dependency.id]: dependency };
      
      // Update entity-to-dependencies index
      const newDependenciesByEntity = { ...state.dependenciesByEntity };
      const fromKey = `${dependency.from_type}:${dependency.from_id}`;
      const toKey = `${dependency.to_type}:${dependency.to_id}`;
      
      [fromKey, toKey].forEach(key => {
        if (!newDependenciesByEntity[key]) {
          newDependenciesByEntity[key] = [];
        }
        if (!newDependenciesByEntity[key].includes(dependency.id)) {
          newDependenciesByEntity[key].push(dependency.id);
        }
      });
      
      return { dependencies: newDependencies, dependenciesByEntity: newDependenciesByEntity };
    }),
    
    removeDependency: (dependencyId) => set((state) => {
      const dependency = state.dependencies[dependencyId];
      if (!dependency) return state;
      
      const { [dependencyId]: removed, ...remainingDependencies } = state.dependencies;
      
      // Update entity-to-dependencies index
      const newDependenciesByEntity = { ...state.dependenciesByEntity };
      const fromKey = `${dependency.from_type}:${dependency.from_id}`;
      const toKey = `${dependency.to_type}:${dependency.to_id}`;
      
      [fromKey, toKey].forEach(key => {
        if (newDependenciesByEntity[key]) {
          newDependenciesByEntity[key] = newDependenciesByEntity[key].filter(id => id !== dependencyId);
          if (newDependenciesByEntity[key].length === 0) {
            delete newDependenciesByEntity[key];
          }
        }
      });
      
      return { dependencies: remainingDependencies, dependenciesByEntity: newDependenciesByEntity };
    }),
    
    // Task UI actions
    setTaskLoading: (loading) => set((state) => ({
      taskUI: { ...state.taskUI, loading }
    })),
    
    setTaskError: (error) => set((state) => ({
      taskUI: { ...state.taskUI, error }
    })),
    
    setTaskCreating: (isCreating) => set((state) => ({
      taskUI: { ...state.taskUI, isCreating }
    })),
    
    setTaskUpdating: (isUpdating) => set((state) => ({
      taskUI: { ...state.taskUI, isUpdating }
    })),
    
    setTaskDeleting: (isDeleting) => set((state) => ({
      taskUI: { ...state.taskUI, isDeleting }
    })),
    
    setSelectedTasks: (selectedTaskIds) => set((state) => ({
      taskUI: { ...state.taskUI, selectedTaskIds }
    })),
    
    setTaskFilter: (filterStatus, filterProject = 'all') => set((state) => ({
      taskUI: { ...state.taskUI, filterStatus, filterProject }
    })),
    
    // Dependency UI actions
    setDependencyLoading: (loading) => set((state) => ({
      dependencyUI: { ...state.dependencyUI, loading }
    })),
    
    setDependencyError: (error) => set((state) => ({
      dependencyUI: { ...state.dependencyUI, error }
    })),
    
    setDependencyCreating: (isCreating) => set((state) => ({
      dependencyUI: { ...state.dependencyUI, isCreating }
    })),
    
    setDependencyUpdating: (isUpdating) => set((state) => ({
      dependencyUI: { ...state.dependencyUI, isUpdating }
    })),
    
    setDependencyDeleting: (isDeleting) => set((state) => ({
      dependencyUI: { ...state.dependencyUI, isDeleting }
    })),
    
    setShowDependencies: (showDependencies) => set((state) => ({
      dependencyUI: { ...state.dependencyUI, showDependencies }
    })),
    
    setLinkingMode: (linkingMode) => set((state) => ({
      dependencyUI: { ...state.dependencyUI, linkingMode }
    })),
    
    setSelectedDependencies: (selectedDependencyIds) => set((state) => ({
      dependencyUI: { ...state.dependencyUI, selectedDependencyIds }
    })),
    
    // Statistics actions
    setTaskStats: (taskStats) => set({ taskStats }),
    setDependencyStats: (dependencyStats) => set({ dependencyStats }),
    
  // Async actions
  fetchTasks: async () => {
    set((state) => ({ taskUI: { ...state.taskUI, loading: true, error: null } }));
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const response = await window.electronAPI.getAllTasks();
      if (response.success && response.data) {
        get().setTasks(response.data);
      } else {
        const errorMessage = response.errors?.join(', ') || 'Failed to fetch tasks';
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set((state) => ({ taskUI: { ...state.taskUI, error: errorMessage } }));
    } finally {
      set((state) => ({ taskUI: { ...state.taskUI, loading: false } }));
    }
  },
    
  fetchTasksByProject: async (projectId: string) => {
    set((state) => ({ taskUI: { ...state.taskUI, loading: true, error: null } }));
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const response = await window.electronAPI.getTasksByProject(projectId);
      if (response.success && response.data) {
        // Update only tasks for this project
        const tasks = response.data;
        tasks.forEach(task => get().upsertTask(task));
      } else {
        const errorMessage = response.errors?.join(', ') || 'Failed to fetch tasks';
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set((state) => ({ taskUI: { ...state.taskUI, error: errorMessage } }));
    } finally {
      set((state) => ({ taskUI: { ...state.taskUI, loading: false } }));
    }
  },
    
  createTask: async (data: CreateTaskRequest) => {
    set((state) => ({ taskUI: { ...state.taskUI, isCreating: true, error: null } }));
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const response = await window.electronAPI.createTask(data);
      if (response.success && response.data) {
        get().upsertTask(response.data);
        return { success: true, task: response.data };
      } else {
        const errors = response.errors || ['Failed to create task'];
        set((state) => ({ taskUI: { ...state.taskUI, error: errors[0] } }));
        return { success: false, errors };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      set((state) => ({ taskUI: { ...state.taskUI, error: errorMessage } }));
      return { success: false, errors: [errorMessage] };
    } finally {
      set((state) => ({ taskUI: { ...state.taskUI, isCreating: false } }));
    }
  },
    
  updateTask: async (data: UpdateTaskRequest) => {
    set((state) => ({ taskUI: { ...state.taskUI, isUpdating: true, error: null } }));
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const response = await window.electronAPI.updateTask(data);
      if (response.success && response.data) {
        get().upsertTask(response.data);
        return { success: true, task: response.data };
      } else {
        const errors = response.errors || ['Failed to update task'];
        set((state) => ({ taskUI: { ...state.taskUI, error: errors[0] } }));
        return { success: false, errors };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      set((state) => ({ taskUI: { ...state.taskUI, error: errorMessage } }));
      return { success: false, errors: [errorMessage] };
    } finally {
      set((state) => ({ taskUI: { ...state.taskUI, isUpdating: false } }));
    }
  },
    
  deleteTask: async (taskId: string) => {
    set((state) => ({ taskUI: { ...state.taskUI, isDeleting: true, error: null } }));
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const response = await window.electronAPI.deleteTask(taskId);
      if (response.success) {
        get().removeTask(taskId);
        return { success: true };
      } else {
        const errors = response.errors || ['Failed to delete task'];
        set((state) => ({ taskUI: { ...state.taskUI, error: errors[0] } }));
        return { success: false, errors };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      set((state) => ({ taskUI: { ...state.taskUI, error: errorMessage } }));
      return { success: false, errors: [errorMessage] };
    } finally {
      set((state) => ({ taskUI: { ...state.taskUI, isDeleting: false } }));
    }
  },
    
  fetchTaskStats: async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const response = await window.electronAPI.getTaskStats();
      if (response.success && response.data) {
        get().setTaskStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  },
    
    // Dependency async actions
    fetchDependencies: async () => {
      set((state) => ({ dependencyUI: { ...state.dependencyUI, loading: true, error: null } }));
      
      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }
        
        const response = await window.electronAPI.getAllDependencies();
        if (response.success && response.data) {
          get().setDependencies(response.data);
        } else {
          const errorMessage = response.errors?.join(', ') || 'Failed to fetch dependencies';
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dependencies';
        set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errorMessage } }));
      } finally {
        set((state) => ({ dependencyUI: { ...state.dependencyUI, loading: false } }));
      }
    },
    
    fetchDependenciesForEntity: async (entityType: EntityType, entityId: string) => {
      set((state) => ({ dependencyUI: { ...state.dependencyUI, loading: true, error: null } }));
      
      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }
        
        const response = await window.electronAPI.getDependenciesForEntity(entityType, entityId);
        if (response.success && response.data) {
          const dependencies = response.data;
          dependencies.forEach(dep => get().upsertDependency(dep));
        } else {
          const errorMessage = response.errors?.join(', ') || 'Failed to fetch dependencies';
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dependencies';
        set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errorMessage } }));
      } finally {
        set((state) => ({ dependencyUI: { ...state.dependencyUI, loading: false } }));
      }
    },
    
    createDependency: async (data: CreateDependencyRequest) => {
      set((state) => ({ dependencyUI: { ...state.dependencyUI, isCreating: true, error: null } }));
      
      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }
        
        const response = await window.electronAPI.createDependency(data);
        if (response.success && response.data) {
          get().upsertDependency(response.data);
          return { success: true, dependency: response.data };
        } else {
          const errors = response.errors || ['Failed to create dependency'];
          set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errors[0] } }));
          return { success: false, errors };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create dependency';
        set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errorMessage } }));
        return { success: false, errors: [errorMessage] };
      } finally {
        set((state) => ({ dependencyUI: { ...state.dependencyUI, isCreating: false } }));
      }
    },
    
    updateDependency: async (data: UpdateDependencyRequest) => {
      set((state) => ({ dependencyUI: { ...state.dependencyUI, isUpdating: true, error: null } }));
      
      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }
        
        const response = await window.electronAPI.updateDependency(data);
        if (response.success && response.data) {
          get().upsertDependency(response.data);
          return { success: true, dependency: response.data };
        } else {
          const errors = response.errors || ['Failed to update dependency'];
          set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errors[0] } }));
          return { success: false, errors };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update dependency';
        set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errorMessage } }));
        return { success: false, errors: [errorMessage] };
      } finally {
        set((state) => ({ dependencyUI: { ...state.dependencyUI, isUpdating: false } }));
      }
    },
    
    deleteDependency: async (dependencyId: string) => {
      set((state) => ({ dependencyUI: { ...state.dependencyUI, isDeleting: true, error: null } }));
      
      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }
        
        const response = await window.electronAPI.deleteDependency(dependencyId);
        if (response.success) {
          get().removeDependency(dependencyId);
          return { success: true };
        } else {
          const errors = response.errors || ['Failed to delete dependency'];
          set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errors[0] } }));
          return { success: false, errors };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete dependency';
        set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errorMessage } }));
        return { success: false, errors: [errorMessage] };
      } finally {
        set((state) => ({ dependencyUI: { ...state.dependencyUI, isDeleting: false } }));
      }
    },
    
    fetchDependenciesByProject: async (projectId: string) => {
      set((state) => ({ dependencyUI: { ...state.dependencyUI, loading: true, error: null } }));
      
      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }
        
        const response = await window.electronAPI.getDependenciesByProject(projectId);
        if (response.success && response.data) {
          const dependencies = response.data;
          dependencies.forEach(dep => get().upsertDependency(dep));
        } else {
          const errorMessage = response.errors?.join(', ') || 'Failed to fetch dependencies';
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dependencies';
        set((state) => ({ dependencyUI: { ...state.dependencyUI, error: errorMessage } }));
      } finally {
        set((state) => ({ dependencyUI: { ...state.dependencyUI, loading: false } }));
      }
    },

    fetchDependencyStats: async () => {
      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }
        
        const response = await window.electronAPI.getDependencyStats();
        if (response.success && response.data) {
          // Future enhancement: add dependency stats to state if needed
        }
      } catch (error) {
        console.error('Failed to fetch dependency stats:', error);
      }
    },
    
    // Computed selectors
    getTasksAsArray: () => Object.values(get().tasks),
    
    getTasksByProjectId: (projectId: string) => {
      const state = get();
      const taskIds = state.tasksByProject[projectId] || [];
      return taskIds.map(id => state.tasks[id]).filter(Boolean);
    },
    
    getTaskById: (taskId: string) => get().tasks[taskId],
    
    getFilteredTasks: () => {
      const state = get();
      const tasks = Object.values(state.tasks);
      
      return tasks.filter(task => {
        if (state.taskUI.filterStatus !== 'all' && task.status !== state.taskUI.filterStatus) {
          return false;
        }
        if (state.taskUI.filterProject !== 'all' && task.project_id !== state.taskUI.filterProject) {
          return false;
        }
        return true;
      });
    },
    
    getDependenciesAsArray: () => Object.values(get().dependencies),
    
    getDependencyById: (dependencyId: string) => get().dependencies[dependencyId],
    
    getDependenciesForEntity: (entityType: EntityType, entityId: string) => {
      const state = get();
      const entityKey = `${entityType}:${entityId}`;
      const dependencyIds = state.dependenciesByEntity[entityKey] || [];
      return dependencyIds.map(id => state.dependencies[id]).filter(Boolean);
    },
    
    getDependenciesFromEntity: (entityType: EntityType, entityId: string) => {
      const state = get();
      return Object.values(state.dependencies).filter(dep => 
        dep.from_type === entityType && dep.from_id === entityId
      );
    },
    
    getDependenciesToEntity: (entityType: EntityType, entityId: string) => {
      const state = get();
      return Object.values(state.dependencies).filter(dep => 
        dep.to_type === entityType && dep.to_id === entityId
      );
    },
    
    // Utility actions
    clearTaskError: () => set((state) => ({
      taskUI: { ...state.taskUI, error: null }
    })),
    
    clearDependencyError: () => set((state) => ({
      dependencyUI: { ...state.dependencyUI, error: null }
    })),
    
    reset: () => set(initialState),
  }))
);