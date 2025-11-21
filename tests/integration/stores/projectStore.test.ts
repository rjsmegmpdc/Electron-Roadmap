/**
 * @jest-environment jsdom
 */
import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { useProjectStore, projectSelectors } from '../../../app/renderer/stores/projectStore';
import type { Project, CreateProjectRequest, UpdateProjectRequest, IpcResponse } from '../../../app/main/preload';

// Mock window.electronAPI
const mockElectronAPI = {
  getAllProjects: jest.fn(),
  getProjectById: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  getProjectsByStatus: jest.fn(),
  getProjectStats: jest.fn(),
};

// Setup global mock in a way that works reliably in jsdom
declare global {
  interface Window {
    electronAPI: typeof mockElectronAPI;
  }
}

// Setup mock on window object for jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
    configurable: true,
  });
}

describe('ProjectStore Integration Tests', () => {
  beforeEach(() => {
    // Reset store to initial state
    useProjectStore.getState().reset();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockElectronAPI.getAllProjects.mockResolvedValue({ success: true, data: [] });
    mockElectronAPI.getProjectById.mockResolvedValue({ success: true, data: null });
    mockElectronAPI.createProject.mockResolvedValue({ success: true, data: {} as Project });
    mockElectronAPI.updateProject.mockResolvedValue({ success: true, data: {} as Project });
    mockElectronAPI.deleteProject.mockResolvedValue({ success: true });
    mockElectronAPI.getProjectsByStatus.mockResolvedValue({ success: true, data: [] });
    mockElectronAPI.getProjectStats.mockResolvedValue({ 
      success: true, 
      data: { total: 0, by_status: { active: 0, completed: 0, 'on-hold': 0, cancelled: 0 }, total_budget_cents: 0 } 
    });
  });

  describe('Store Initialization', () => {
    test('should have correct initial state', () => {
      const store = useProjectStore.getState();
      expect(store.projects).toEqual([]);
      expect(store.currentProject).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.isCreating).toBe(false);
      expect(store.isUpdating).toBe(false);
      expect(store.isDeleting).toBe(false);
      expect(store.stats).toBeNull();
    });

    test('should reset to initial state', () => {
      const store = useProjectStore.getState();
      // Modify state
      store.setProjects([{ id: 'test', title: 'Test' } as Project]);
      store.setError('Test error');
      store.setLoading(true);

      // Reset
      store.reset();

      // Verify reset
      const resetStore = useProjectStore.getState();
      expect(resetStore.projects).toEqual([]);
      expect(resetStore.error).toBeNull();
      expect(resetStore.loading).toBe(false);
    });
  });

  describe('Fetch Projects', () => {
    test('should fetch projects successfully', async () => {
      const mockProjects: Project[] = [
        {
          id: 'PROJ-001',
          title: 'Test Project 1',
          description: 'Test Description 1',
          lane: 'Development',
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'active',
          pm_name: 'Test Manager 1',
          budget_cents: 10000000, // $100,000
          financial_treatment: 'CAPEX',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'PROJ-002',
          title: 'Test Project 2',
          description: 'Test Description 2',
          lane: 'Testing',
          start_date: '01-02-2025',
          end_date: '28-02-2025',
          status: 'completed',
          pm_name: 'Test Manager 2',
          budget_cents: 5000000, // $50,000
          financial_treatment: 'OPEX',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockElectronAPI.getAllProjects.mockResolvedValue({
        success: true,
        data: mockProjects,
      });

      await useProjectStore.getState().fetchProjects();

      const store = useProjectStore.getState();
      expect(mockElectronAPI.getAllProjects).toHaveBeenCalledTimes(1);
      expect(store.projects).toEqual(mockProjects);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    test('should handle fetch projects error', async () => {
      const errorMessage = 'Failed to fetch projects';
      mockElectronAPI.getAllProjects.mockResolvedValue({
        success: false,
        errors: [errorMessage],
      });

      await useProjectStore.getState().fetchProjects();

      const store = useProjectStore.getState();
      expect(store.projects).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(errorMessage);
    });

    test('should handle API exception during fetch', async () => {
      const errorMessage = 'Network error';
      mockElectronAPI.getAllProjects.mockRejectedValue(new Error(errorMessage));

      await useProjectStore.getState().fetchProjects();

      const store = useProjectStore.getState();
      expect(store.projects).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(errorMessage);
    });

    test('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      
      mockElectronAPI.getAllProjects.mockImplementation(() => {
        loadingDuringFetch = useProjectStore.getState().loading;
        return Promise.resolve({ success: true, data: [] });
      });

      await useProjectStore.getState().fetchProjects();

      expect(loadingDuringFetch).toBe(true);
      expect(useProjectStore.getState().loading).toBe(false);
    });
  });

  describe('Fetch Single Project', () => {
    test('should fetch project by ID successfully', async () => {
      const mockProject: Project = {
        id: 'PROJ-001',
        title: 'Test Project',
        description: 'Test Description',
        lane: 'Development',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        pm_name: 'Test Manager',
        budget_cents: 10000000,
        financial_treatment: 'CAPEX',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.getProjectById.mockResolvedValue({
        success: true,
        data: mockProject,
      });

      await useProjectStore.getState().fetchProject('PROJ-001');

      const store = useProjectStore.getState();
      expect(mockElectronAPI.getProjectById).toHaveBeenCalledWith('PROJ-001');
      expect(store.currentProject).toEqual(mockProject);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    test('should handle project not found', async () => {
      mockElectronAPI.getProjectById.mockResolvedValue({
        success: true,
        data: null,
      });

      await useProjectStore.getState().fetchProject('non-existent');

      const store = useProjectStore.getState();
      expect(store.currentProject).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    test('should handle fetch project error', async () => {
      const errorMessage = 'Project not found';
      mockElectronAPI.getProjectById.mockResolvedValue({
        success: false,
        errors: [errorMessage],
      });

      await useProjectStore.getState().fetchProject('PROJ-001');

      const store = useProjectStore.getState();
      expect(store.currentProject).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('Create Project', () => {
    test('should create project successfully', async () => {
      const projectData: CreateProjectRequest = {
        title: 'New Test Project',
        description: 'New project description',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        budget_nzd: '25,000.00',
      };

      const createdProject: Project = {
        id: 'PROJ-NEW',
        title: 'New Test Project',
        description: 'New project description',
        lane: '',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        pm_name: '',
        budget_cents: 2500000, // $25,000
        financial_treatment: 'CAPEX',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.createProject.mockResolvedValue({
        success: true,
        data: createdProject,
      });

      const result = await useProjectStore.getState().createProject(projectData);

      const store = useProjectStore.getState();
      expect(mockElectronAPI.createProject).toHaveBeenCalledWith(projectData);
      expect(result.success).toBe(true);
      expect(result.project).toEqual(createdProject);
      expect(store.projects).toContain(createdProject);
      expect(store.currentProject).toEqual(createdProject);
      expect(store.isCreating).toBe(false);
      expect(store.error).toBeNull();
    });

    test('should handle create project validation errors', async () => {
      const projectData: CreateProjectRequest = {
        title: '', // Invalid: empty title
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
      };

      const errors = ['Project title is required'];
      mockElectronAPI.createProject.mockResolvedValue({
        success: false,
        errors,
      });

      const result = await useProjectStore.getState().createProject(projectData);

      const store = useProjectStore.getState();
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(errors);
      expect(store.projects).toEqual([]);
      expect(store.currentProject).toBeNull();
      expect(store.isCreating).toBe(false);
      expect(store.error).toBe(errors.join(', '));
    });

    test('should handle create project API exception', async () => {
      const projectData: CreateProjectRequest = {
        title: 'Test Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
      };

      const errorMessage = 'Database connection failed';
      mockElectronAPI.createProject.mockRejectedValue(new Error(errorMessage));

      const result = await useProjectStore.getState().createProject(projectData);

      const store = useProjectStore.getState();
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([errorMessage]);
      expect(store.isCreating).toBe(false);
      expect(store.error).toBe(errorMessage);
    });

    test('should set creating state during create', async () => {
      let creatingDuringCreate = false;
      
      mockElectronAPI.createProject.mockImplementation(() => {
        creatingDuringCreate = useProjectStore.getState().isCreating;
        return Promise.resolve({ success: true, data: {} as Project });
      });

      const projectData: CreateProjectRequest = {
        title: 'Test Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
      };

      await useProjectStore.getState().createProject(projectData);

      expect(creatingDuringCreate).toBe(true);
      expect(useProjectStore.getState().isCreating).toBe(false);
    });
  });

  describe('Update Project', () => {
    test('should update project successfully', async () => {
      // First, add a project to the store
      const existingProject: Project = {
        id: 'PROJ-001',
        title: 'Original Title',
        description: 'Original Description',
        lane: 'Development',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        pm_name: 'Original Manager',
        budget_cents: 10000000,
        financial_treatment: 'CAPEX',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      useProjectStore.getState().setProjects([existingProject]);

      const updateData: UpdateProjectRequest = {
        id: 'PROJ-001',
        title: 'Updated Title',
        status: 'completed',
      };

      const updatedProject: Project = {
        ...existingProject,
        title: 'Updated Title',
        status: 'completed',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockElectronAPI.updateProject.mockResolvedValue({
        success: true,
        data: updatedProject,
      });

      const result = await useProjectStore.getState().updateProject(updateData);

      const store = useProjectStore.getState();
      expect(mockElectronAPI.updateProject).toHaveBeenCalledWith(updateData);
      expect(result.success).toBe(true);
      expect(result.project).toEqual(updatedProject);
      expect(store.projects[0]).toEqual(updatedProject);
      expect(store.currentProject).toEqual(updatedProject);
      expect(store.isUpdating).toBe(false);
      expect(store.error).toBeNull();
    });

    test('should handle update project validation errors', async () => {
      const updateData: UpdateProjectRequest = {
        id: 'PROJ-001',
        title: '', // Invalid: empty title
      };

      const errors = ['Project title is required'];
      mockElectronAPI.updateProject.mockResolvedValue({
        success: false,
        errors,
      });

      const result = await useProjectStore.getState().updateProject(updateData);

      const store = useProjectStore.getState();
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(errors);
      expect(store.isUpdating).toBe(false);
      expect(store.error).toBe(errors.join(', '));
    });

    test('should handle update non-existent project', async () => {
      const updateData: UpdateProjectRequest = {
        id: 'non-existent',
        title: 'Updated Title',
      };

      const errors = ['Project not found'];
      mockElectronAPI.updateProject.mockResolvedValue({
        success: false,
        errors,
      });

      const result = await useProjectStore.getState().updateProject(updateData);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(errors);
    });
  });

  describe('Delete Project', () => {
    test('should delete project successfully', async () => {
      // First, add projects to the store
      const project1: Project = {
        id: 'PROJ-001',
        title: 'Project 1',
        description: 'Description 1',
        lane: 'Development',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        pm_name: 'Manager 1',
        budget_cents: 10000000,
        financial_treatment: 'CAPEX',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const project2: Project = {
        id: 'PROJ-002',
        title: 'Project 2',
        description: 'Description 2',
        lane: 'Testing',
        start_date: '01-02-2025',
        end_date: '28-02-2025',
        status: 'active',
        pm_name: 'Manager 2',
        budget_cents: 5000000,
        financial_treatment: 'OPEX',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      useProjectStore.getState().setProjects([project1, project2]);
      useProjectStore.getState().setCurrentProject(project1);

      mockElectronAPI.deleteProject.mockResolvedValue({
        success: true,
      });

      const result = await useProjectStore.getState().deleteProject('PROJ-001');

      const store = useProjectStore.getState();
      expect(mockElectronAPI.deleteProject).toHaveBeenCalledWith('PROJ-001');
      expect(result.success).toBe(true);
      expect(store.projects).toEqual([project2]);
      expect(store.currentProject).toBeNull(); // Should clear if deleted project was current
      expect(store.isDeleting).toBe(false);
      expect(store.error).toBeNull();
    });

    test('should handle delete project error', async () => {
      const errors = ['Project not found'];
      mockElectronAPI.deleteProject.mockResolvedValue({
        success: false,
        errors,
      });

      const result = await useProjectStore.getState().deleteProject('non-existent');

      const store = useProjectStore.getState();
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(errors);
      expect(store.isDeleting).toBe(false);
      expect(store.error).toBe(errors.join(', '));
    });

    test('should not clear current project if deleting different project', async () => {
      const project1: Project = {
        id: 'PROJ-001',
        title: 'Project 1',
        description: 'Description 1',
        lane: 'Development',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        pm_name: 'Manager 1',
        budget_cents: 10000000,
        financial_treatment: 'CAPEX',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const project2: Project = {
        ...project1,
        id: 'PROJ-002',
        title: 'Project 2',
      };

      useProjectStore.getState().setProjects([project1, project2]);
      useProjectStore.getState().setCurrentProject(project1);

      mockElectronAPI.deleteProject.mockResolvedValue({
        success: true,
      });

      await useProjectStore.getState().deleteProject('PROJ-002');

      expect(useProjectStore.getState().currentProject).toEqual(project1); // Should remain unchanged
    });
  });

  describe('Fetch Projects by Status', () => {
    test('should fetch projects by status successfully', async () => {
      const activeProjects: Project[] = [
        {
          id: 'PROJ-001',
          title: 'Active Project 1',
          description: 'Description 1',
          lane: 'Development',
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'active',
          pm_name: 'Manager 1',
          budget_cents: 10000000,
          financial_treatment: 'CAPEX',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockElectronAPI.getProjectsByStatus.mockResolvedValue({
        success: true,
        data: activeProjects,
      });

      await useProjectStore.getState().fetchProjectsByStatus('active');

      const store = useProjectStore.getState();
      expect(mockElectronAPI.getProjectsByStatus).toHaveBeenCalledWith('active');
      expect(store.projects).toEqual(activeProjects);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('Fetch Project Stats', () => {
    test('should fetch project statistics successfully', async () => {
      const mockStats = {
        total: 5,
        by_status: {
          active: 2,
          completed: 2,
          'on-hold': 1,
          cancelled: 0,
        },
        total_budget_cents: 15000000, // $150,000
      };

      mockElectronAPI.getProjectStats.mockResolvedValue({
        success: true,
        data: mockStats,
      });

      await useProjectStore.getState().fetchProjectStats();

      const store = useProjectStore.getState();
      expect(mockElectronAPI.getProjectStats).toHaveBeenCalledTimes(1);
      expect(store.stats).toEqual(mockStats);
      expect(store.error).toBeNull();
    });

    test('should handle fetch stats error', async () => {
      const errorMessage = 'Failed to fetch statistics';
      mockElectronAPI.getProjectStats.mockResolvedValue({
        success: false,
        errors: [errorMessage],
      });

      await useProjectStore.getState().fetchProjectStats();

      const store = useProjectStore.getState();
      expect(store.stats).toBeNull();
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('Store Selectors', () => {
    test('should provide correct selectors', () => {
      const project1: Project = {
        id: 'PROJ-001',
        title: 'Project 1',
        description: 'Description 1',
        lane: 'Development',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        pm_name: 'Manager 1',
        budget_cents: 10000000,
        financial_treatment: 'CAPEX',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const project2: Project = {
        ...project1,
        id: 'PROJ-002',
        title: 'Project 2',
        status: 'completed',
        budget_cents: 5000000,
      };

      useProjectStore.getState().setProjects([project1, project2]);

      expect(projectSelectors.getProjectById('PROJ-001')).toEqual(project1);
      expect(projectSelectors.getProjectById('non-existent')).toBeNull();
      
      expect(projectSelectors.getProjectsByStatus('active')).toEqual([project1]);
      expect(projectSelectors.getProjectsByStatus('completed')).toEqual([project2]);
      
      expect(projectSelectors.getActiveProjects()).toEqual([project1]);
      expect(projectSelectors.getCompletedProjects()).toEqual([project2]);
      
      expect(projectSelectors.hasProjects()).toBe(true);
      expect(projectSelectors.getProjectsCount()).toBe(2);
      expect(projectSelectors.getTotalBudget()).toBe(15000000); // $150,000 in cents
    });

    test('should handle empty project list in selectors', () => {
      expect(projectSelectors.getProjectById('any-id')).toBeNull();
      expect(projectSelectors.getProjectsByStatus('active')).toEqual([]);
      expect(projectSelectors.hasProjects()).toBe(false);
      expect(projectSelectors.getProjectsCount()).toBe(0);
      expect(projectSelectors.getTotalBudget()).toBe(0);
    });

    test('should detect loading states correctly', () => {
      expect(projectSelectors.isProjectLoading()).toBe(false);

      useProjectStore.getState().setLoading(true);
      expect(projectSelectors.isProjectLoading()).toBe(true);

      useProjectStore.getState().setLoading(false);
      useProjectStore.getState().setCreating(true);
      expect(projectSelectors.isProjectLoading()).toBe(true);

      useProjectStore.getState().setCreating(false);
      useProjectStore.getState().setUpdating(true);
      expect(projectSelectors.isProjectLoading()).toBe(true);

      useProjectStore.getState().setUpdating(false);
      useProjectStore.getState().setDeleting(true);
      expect(projectSelectors.isProjectLoading()).toBe(true);
    });
  });

  describe('Error Management', () => {
    test('should clear errors', () => {
      useProjectStore.getState().setError('Test error');
      expect(useProjectStore.getState().error).toBe('Test error');

      useProjectStore.getState().clearError();
      expect(useProjectStore.getState().error).toBeNull();
    });

    test('should handle multiple error sources', async () => {
      // Test different operations setting errors
      mockElectronAPI.getAllProjects.mockResolvedValue({
        success: false,
        errors: ['Fetch error'],
      });

      await useProjectStore.getState().fetchProjects();
      expect(useProjectStore.getState().error).toBe('Fetch error');

      mockElectronAPI.createProject.mockResolvedValue({
        success: false,
        errors: ['Create error'],
      });

      await useProjectStore.getState().createProject({
        title: 'Test',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
      });
      expect(useProjectStore.getState().error).toBe('Create error');
    });
  });
});