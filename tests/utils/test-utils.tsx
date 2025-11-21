import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { useProjectStore } from '../../app/renderer/stores/projectStore';
import type { Project, ProjectStatus } from '../../app/main/preload';

// Mock project data for testing
export const mockProjects: Project[] = [
  {
    id: 'PROJ-001-TEST1',
    title: 'Test Project Alpha',
    description: 'First test project for component testing',
    lane: 'Development',
    start_date: '01-01-2025',
    end_date: '31-03-2025',
    status: 'active',
    pm_name: 'Alice Johnson',
    budget_cents: 5000000, // $50,000
    financial_treatment: 'CAPEX',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'PROJ-002-TEST2',
    title: 'Test Project Beta',
    description: 'Second test project for component testing',
    lane: 'Testing',
    start_date: '15-02-2025',
    end_date: '30-06-2025',
    status: 'completed',
    pm_name: 'Bob Smith',
    budget_cents: 7500000, // $75,000
    financial_treatment: 'OPEX',
    created_at: '2024-12-01T11:00:00Z',
    updated_at: '2024-12-15T14:30:00Z',
  },
  {
    id: 'PROJ-003-TEST3',
    title: 'Test Project Gamma',
    description: 'Third test project for component testing',
    lane: 'Infrastructure',
    start_date: '01-04-2025',
    end_date: '31-12-2025',
    status: 'on-hold',
    pm_name: 'Charlie Brown',
    budget_cents: 12000000, // $120,000
    financial_treatment: 'CAPEX',
    created_at: '2024-12-01T12:00:00Z',
    updated_at: '2024-12-10T09:15:00Z',
  }
];

// Mock electron API for components
export const mockElectronAPI = {
  getAllProjects: jest.fn(),
  getProjectById: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  getProjectsByStatus: jest.fn(),
  getProjectStats: jest.fn(),
};

// Test wrapper component that provides necessary context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Reset store state before each test
  React.useEffect(() => {
    useProjectStore.getState().reset();
  }, []);

  return <>{children}</>;
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

// Setup functions for different test scenarios
export const setupMockElectronAPI = () => {
  // Reset all mocks
  Object.values(mockElectronAPI).forEach(mock => mock.mockReset());

  // Setup default successful responses
  mockElectronAPI.getAllProjects.mockResolvedValue({
    success: true,
    data: mockProjects
  });

  mockElectronAPI.getProjectById.mockResolvedValue({
    success: true,
    data: mockProjects[0]
  });

  mockElectronAPI.createProject.mockResolvedValue({
    success: true,
    data: mockProjects[0]
  });

  mockElectronAPI.updateProject.mockResolvedValue({
    success: true,
    data: { ...mockProjects[0], title: 'Updated Title' }
  });

  mockElectronAPI.deleteProject.mockResolvedValue({
    success: true
  });

  mockElectronAPI.getProjectsByStatus.mockResolvedValue({
    success: true,
    data: mockProjects.filter(p => p.status === 'active')
  });

  mockElectronAPI.getProjectStats.mockResolvedValue({
    success: true,
    data: {
      total: 3,
      by_status: { active: 1, completed: 1, 'on-hold': 1, cancelled: 0 },
      total_budget_cents: 24500000
    }
  });

  // Mock the global window.electronAPI
  (global as any).window = {
    ...((global as any).window || {}),
    electronAPI: mockElectronAPI
  };

  return mockElectronAPI;
};

// Helper to wait for async operations
export const waitForAsyncOperations = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to get project by status for testing
export const getProjectsByStatus = (status: ProjectStatus): Project[] => {
  return mockProjects.filter(project => project.status === status);
};

// Helper to create test project data
export const createTestProject = (overrides: Partial<Project> = {}): Project => {
  return {
    id: 'PROJ-TEST-NEW',
    title: 'New Test Project',
    description: 'A project created for testing',
    lane: 'Testing',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    status: 'active',
    pm_name: 'Test Manager',
    budget_cents: 1000000, // $10,000
    financial_treatment: 'CAPEX',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
};

// Helper for form data
export const createTestFormData = (overrides: any = {}) => {
  return {
    title: 'Test Form Project',
    description: 'A project from form testing',
    lane: 'Development',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    status: 'active' as ProjectStatus,
    pm_name: 'Form Test Manager',
    budget_nzd: '10,000.00',
    financial_treatment: 'CAPEX' as const,
    ...overrides
  };
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };