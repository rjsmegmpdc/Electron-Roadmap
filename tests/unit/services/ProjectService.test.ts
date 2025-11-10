import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { ProjectService, CreateProjectRequest, UpdateProjectRequest, ProjectStatus, FinancialTreatment } from '../../../app/main/services/ProjectService';
import { openDB } from '../../../app/main/db';
import * as fs from 'fs';
import * as path from 'path';

describe('ProjectService', () => {
  let db: Database.Database;
  let projectService: ProjectService;
  let testDbPath: string;

  beforeEach(() => {
    // Create temporary database for testing
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    db = openDB(testDbPath);
    projectService = new ProjectService(db);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    // Clean up test database
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Project Validation', () => {
    test('should validate correct project data', () => {
      const validProject: CreateProjectRequest = {
        title: 'Test Project',
        description: 'A test project for validation',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        pm_name: 'John Doe',
        budget_nzd: '10,000.50',
        financial_treatment: 'CAPEX'
      };

      const result = projectService.validateProject(validProject);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty title', () => {
      const invalidProject: CreateProjectRequest = {
        title: '',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active'
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project title is required');
    });

    test('should reject title longer than 200 characters', () => {
      const invalidProject: CreateProjectRequest = {
        title: 'A'.repeat(201),
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active'
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project title must be 200 characters or less');
    });

    test('should reject invalid date formats', () => {
      const invalidProject: CreateProjectRequest = {
        title: 'Test Project',
        start_date: '2025-01-01', // ISO format instead of DD-MM-YYYY
        end_date: '2025/12/31',   // Wrong separator
        status: 'active'
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
      expect(result.errors).toContain('End date must be in DD-MM-YYYY format');
    });

    test('should reject invalid date values', () => {
      const invalidProject: CreateProjectRequest = {
        title: 'Test Project',
        start_date: '32-01-2025', // Invalid day
        end_date: '01-13-2025',   // Invalid month
        status: 'active'
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
      expect(result.errors).toContain('End date must be in DD-MM-YYYY format');
    });

    test('should reject end date before start date', () => {
      const invalidProject: CreateProjectRequest = {
        title: 'Test Project',
        start_date: '31-12-2025',
        end_date: '01-01-2025',
        status: 'active'
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });

    test('should reject invalid status', () => {
      const invalidProject: CreateProjectRequest = {
        title: 'Test Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'invalid-status' as ProjectStatus
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Status must be one of: active, completed, on-hold, cancelled');
    });

    test('should reject invalid budget format', () => {
      const invalidProject: CreateProjectRequest = {
        title: 'Test Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        budget_nzd: 'invalid-budget'
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Budget must be a valid NZD amount (e.g., "1,234.56")');
    });

    test('should reject invalid financial treatment', () => {
      const invalidProject: CreateProjectRequest = {
        title: 'Test Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        financial_treatment: 'INVALID' as FinancialTreatment
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Financial treatment must be either CAPEX or OPEX');
    });

    test('should reject oversized fields', () => {
      const invalidProject: CreateProjectRequest = {
        title: 'Test Project',
        description: 'A'.repeat(1001), // Too long
        pm_name: 'B'.repeat(101),       // Too long  
        lane: 'C'.repeat(101),          // Too long
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active'
      };

      const result = projectService.validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be 1000 characters or less');
      expect(result.errors).toContain('PM name must be 100 characters or less');
      expect(result.errors).toContain('Lane must be 100 characters or less');
    });
  });

  describe('Project Creation', () => {
    test('should create a valid project successfully', () => {
      const projectData: CreateProjectRequest = {
        title: 'New Test Project',
        description: 'Project for testing creation',
        lane: 'Development',
        start_date: '15-01-2025',
        end_date: '15-12-2025',
        status: 'active',
        pm_name: 'Jane Smith',
        budget_nzd: '25,500.75',
        financial_treatment: 'CAPEX',
        row: 1
      };

      const result = projectService.createProject(projectData);
      
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project!.title).toBe(projectData.title);
      expect(result.project!.description).toBe(projectData.description);
      expect(result.project!.start_date).toBe(projectData.start_date);
      expect(result.project!.end_date).toBe(projectData.end_date);
      expect(result.project!.status).toBe(projectData.status);
      expect(result.project!.pm_name).toBe(projectData.pm_name);
      expect(result.project!.budget_cents).toBe(2550075); // 25,500.75 * 100
      expect(result.project!.financial_treatment).toBe(projectData.financial_treatment);
      expect(result.project!.id).toMatch(/^PROJ-\d+-[A-Z0-9]{5}$/);
      expect(result.project!.created_at).toBeDefined();
      expect(result.project!.updated_at).toBeDefined();
    });

    test('should create project with minimal required fields', () => {
      const projectData: CreateProjectRequest = {
        title: 'Minimal Project',
        start_date: '01-06-2025',
        end_date: '30-06-2025',
        status: 'active'
      };

      const result = projectService.createProject(projectData);
      
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project!.description).toBe('');
      expect(result.project!.lane).toBe('');
      expect(result.project!.pm_name).toBe('');
      expect(result.project!.budget_cents).toBe(0);
      expect(result.project!.financial_treatment).toBe('CAPEX');
    });

    test('should reject invalid project data', () => {
      const invalidProjectData: CreateProjectRequest = {
        title: '', // Invalid
        start_date: 'invalid-date', // Invalid
        end_date: '31-12-2025',
        status: 'invalid' as ProjectStatus // Invalid
      };

      const result = projectService.createProject(invalidProjectData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project title is required');
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
      expect(result.errors).toContain('Status must be one of: active, completed, on-hold, cancelled');
    });

    test('should handle budget conversion correctly', () => {
      const testCases = [
        { budget_nzd: '100.00', expected_cents: 10000 },
        { budget_nzd: '1,234.56', expected_cents: 123456 },
        { budget_nzd: '50000', expected_cents: 5000000 },
        { budget_nzd: '0.99', expected_cents: 99 }
      ];

      testCases.forEach(({ budget_nzd, expected_cents }, index) => {
        const projectData: CreateProjectRequest = {
          title: `Budget Test ${index}`,
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'active',
          budget_nzd
        };

        const result = projectService.createProject(projectData);
        expect(result.success).toBe(true);
        expect(result.project!.budget_cents).toBe(expected_cents);
      });
    });
  });

  describe('Project Retrieval', () => {
    let testProject: any;

    beforeEach(() => {
      const projectData: CreateProjectRequest = {
        title: 'Retrieval Test Project',
        description: 'For testing retrieval operations',
        start_date: '01-03-2025',
        end_date: '31-08-2025',
        status: 'active',
        pm_name: 'Test Manager',
        budget_nzd: '15000.00'
      };

      const result = projectService.createProject(projectData);
      testProject = result.project;
    });

    test('should retrieve project by ID', () => {
      const retrieved = projectService.getProjectById(testProject.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(testProject.id);
      expect(retrieved!.title).toBe(testProject.title);
      expect(retrieved!.description).toBe(testProject.description);
    });

    test('should return null for non-existent project', () => {
      const retrieved = projectService.getProjectById('NON-EXISTENT-ID');
      expect(retrieved).toBeNull();
    });

    test('should retrieve all projects', () => {
      // Create another project
      const projectData2: CreateProjectRequest = {
        title: 'Second Test Project',
        start_date: '01-02-2025',
        end_date: '28-02-2025',
        status: 'completed'
      };
      projectService.createProject(projectData2);

      const allProjects = projectService.getAllProjects();
      expect(allProjects).toHaveLength(2);
      
      // Should be ordered by start_date_iso
      expect(allProjects[0].title).toBe('Second Test Project'); // Starts Feb 1st
      expect(allProjects[1].title).toBe('Retrieval Test Project'); // Starts Mar 1st
    });

    test('should retrieve projects by status', () => {
      // Create projects with different statuses
      const statuses: ProjectStatus[] = ['completed', 'on-hold', 'cancelled'];
      statuses.forEach((status, index) => {
        const projectData: CreateProjectRequest = {
          title: `Project ${status}`,
          start_date: `0${index + 2}-01-2025`,
          end_date: `0${index + 2}-02-2025`,
          status
        };
        projectService.createProject(projectData);
      });

      const activeProjects = projectService.getProjectsByStatus('active');
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].status).toBe('active');

      const completedProjects = projectService.getProjectsByStatus('completed');
      expect(completedProjects).toHaveLength(1);
      expect(completedProjects[0].status).toBe('completed');
    });
  });

  describe('Project Updates', () => {
    let testProject: any;

    beforeEach(() => {
      const projectData: CreateProjectRequest = {
        title: 'Update Test Project',
        description: 'Original description',
        start_date: '01-04-2025',
        end_date: '30-09-2025',
        status: 'active',
        pm_name: 'Original Manager',
        budget_nzd: '10000.00'
      };

      const result = projectService.createProject(projectData);
      testProject = result.project;
    });

    test('should update project successfully', () => {
      const updateData: UpdateProjectRequest = {
        id: testProject.id,
        title: 'Updated Project Title',
        description: 'Updated description',
        status: 'on-hold',
        budget_nzd: '20000.50'
      };

      const result = projectService.updateProject(updateData);
      
      expect(result.success).toBe(true);
      expect(result.project!.title).toBe('Updated Project Title');
      expect(result.project!.description).toBe('Updated description');
      expect(result.project!.status).toBe('on-hold');
      expect(result.project!.budget_cents).toBe(2000050);
      
      // Unchanged fields should remain the same
      expect(result.project!.pm_name).toBe('Original Manager');
      expect(result.project!.start_date).toBe('01-04-2025');
      expect(result.project!.end_date).toBe('30-09-2025');
    });

    test('should update only specified fields', () => {
      const originalTitle = testProject.title;
      const updateData: UpdateProjectRequest = {
        id: testProject.id,
        status: 'completed'
      };

      const result = projectService.updateProject(updateData);
      
      expect(result.success).toBe(true);
      expect(result.project!.status).toBe('completed');
      expect(result.project!.title).toBe(originalTitle); // Should remain unchanged
    });

    test('should reject updates with invalid data', () => {
      const invalidUpdateData: UpdateProjectRequest = {
        id: testProject.id,
        title: '', // Invalid
        start_date: 'invalid-date' // Invalid
      };

      const result = projectService.updateProject(invalidUpdateData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project title is required');
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
    });

    test('should reject update for non-existent project', () => {
      const updateData: UpdateProjectRequest = {
        id: 'NON-EXISTENT-ID',
        title: 'New Title'
      };

      const result = projectService.updateProject(updateData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project not found');
    });

    test('should update dates and maintain consistency', () => {
      const updateData: UpdateProjectRequest = {
        id: testProject.id,
        start_date: '15-05-2025',
        end_date: '15-10-2025'
      };

      const result = projectService.updateProject(updateData);
      
      expect(result.success).toBe(true);
      expect(result.project!.start_date).toBe('15-05-2025');
      expect(result.project!.end_date).toBe('15-10-2025');
      
      // Verify ISO dates are also updated correctly
      const retrieved = projectService.getProjectById(testProject.id);
      expect(retrieved).toBeDefined();
    });
  });

  describe('Project Deletion', () => {
    let testProject: any;

    beforeEach(() => {
      const projectData: CreateProjectRequest = {
        title: 'Delete Test Project',
        start_date: '01-05-2025',
        end_date: '31-10-2025',
        status: 'active'
      };

      const result = projectService.createProject(projectData);
      testProject = result.project;
    });

    test('should delete project successfully', () => {
      const result = projectService.deleteProject(testProject.id);
      
      expect(result.success).toBe(true);
      
      // Verify project is deleted
      const retrieved = projectService.getProjectById(testProject.id);
      expect(retrieved).toBeNull();
    });

    test('should reject deletion of non-existent project', () => {
      const result = projectService.deleteProject('NON-EXISTENT-ID');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project not found');
    });
  });

  describe('Project Statistics', () => {
    beforeEach(() => {
      // Create projects with different statuses and budgets
      const projects: CreateProjectRequest[] = [
        {
          title: 'Active Project 1',
          start_date: '01-01-2025',
          end_date: '31-03-2025',
          status: 'active',
          budget_nzd: '10000.00'
        },
        {
          title: 'Active Project 2',
          start_date: '01-02-2025',
          end_date: '30-04-2025',
          status: 'active',
          budget_nzd: '15000.50'
        },
        {
          title: 'Completed Project',
          start_date: '01-01-2024',
          end_date: '31-12-2024',
          status: 'completed',
          budget_nzd: '50000.00'
        },
        {
          title: 'On Hold Project',
          start_date: '01-06-2025',
          end_date: '31-08-2025',
          status: 'on-hold',
          budget_nzd: '7500.25'
        }
      ];

      projects.forEach(project => projectService.createProject(project));
    });

    test('should return correct project statistics', () => {
      const stats = projectService.getProjectStats();
      
      expect(stats.total).toBe(4);
      expect(stats.by_status.active).toBe(2);
      expect(stats.by_status.completed).toBe(1);
      expect(stats.by_status['on-hold']).toBe(1);
      expect(stats.by_status.cancelled).toBe(0);
      
      // Total budget: 10000 + 15000.50 + 50000 + 7500.25 = 82500.75 = 8250075 cents
      expect(stats.total_budget_cents).toBe(8250075);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle leap year dates correctly', () => {
      const projectData: CreateProjectRequest = {
        title: 'Leap Year Project',
        start_date: '29-02-2024', // 2024 is a leap year
        end_date: '01-03-2024',
        status: 'active'
      };

      const result = projectService.createProject(projectData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid leap year dates', () => {
      const projectData: CreateProjectRequest = {
        title: 'Invalid Leap Year Project',
        start_date: '29-02-2025', // 2025 is not a leap year
        end_date: '01-03-2025',
        status: 'active'
      };

      const result = projectService.createProject(projectData);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
    });

    test('should handle very large budget amounts', () => {
      const projectData: CreateProjectRequest = {
        title: 'Large Budget Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active',
        budget_nzd: '99,999,999.99' // Maximum allowed
      };

      const result = projectService.createProject(projectData);
      expect(result.success).toBe(true);
      expect(result.project!.budget_cents).toBe(9999999999);
    });

    test('should handle empty and whitespace-only fields correctly', () => {
      const projectData: CreateProjectRequest = {
        title: '  Valid Title  ',
        description: '   ',
        lane: '',
        pm_name: '  ',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active'
      };

      const result = projectService.createProject(projectData);
      expect(result.success).toBe(true);
      expect(result.project!.title).toBe('Valid Title'); // Trimmed
      expect(result.project!.description).toBe(''); // Empty after trim
      expect(result.project!.lane).toBe('');
      expect(result.project!.pm_name).toBe(''); // Empty after trim
    });
  });
});