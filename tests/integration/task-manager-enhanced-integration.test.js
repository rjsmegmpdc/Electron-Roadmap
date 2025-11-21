/**
 * Enhanced TaskManager-ResourceManager Integration Tests
 * 
 * Tests TaskManager with real ProjectManager and ResourceManager dependencies
 * to validate complete integration including resource assignments, progress calculation,
 * and cross-module functionality.
 */

import TaskManager from '../../src/js/task-manager.js';
import ProjectManager from '../../src/js/project-manager.js';
import ResourceManager from '../../src/js/resource-manager.js';
import DataPersistenceManager from '../../src/js/data-persistence-manager.js';

// Mock localStorage for Node.js environment
const localStorageMock = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

global.localStorage = localStorageMock;

describe('Enhanced TaskManager-ResourceManager Integration Tests', () => {
  let taskManager;
  let projectManager;
  let resourceManager;
  let dataPM;

  beforeEach(() => {
    // Clear storage completely
    global.localStorage.clear();
    
    // Create real instances with full dependency chain
    dataPM = new DataPersistenceManager('testEnhancedTaskData');
    projectManager = new ProjectManager(dataPM);
    resourceManager = new ResourceManager(projectManager);
    taskManager = new TaskManager(projectManager, resourceManager);
  });

  afterEach(() => {
    global.localStorage.clear();
  });

  describe('End-to-End Task Management with Resources', () => {
    test('should create project, add resources, create tasks with resource assignments', () => {
      // Create a project
      const project = projectManager.createProject({
        title: 'Enhanced Task Integration Project',
        description: 'Testing TaskManager-ResourceManager integration',
        lane: 'office365',
        start_date: '01-01-2025',
        end_date: '30-06-2025',
        status: 'concept-design',
        pm_name: 'Integration Test Manager',
        budget_cents: 2000000,
        financial_treatment: 'CAPEX'
      });

      // Add resources to the project
      const developer = resourceManager.createResource(project.id, {
        name: 'Lead Developer',
        type: 'internal',
        allocation: 0.8
      });

      const consultant = resourceManager.createResource(project.id, {
        name: 'Technical Consultant',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: 15000
      });

      // Create tasks with resource assignments
      const task1 = taskManager.createTask(project.id, {
        title: 'System Architecture Design',
        start_date: '01-02-2025',
        end_date: '15-02-2025',
        effort_hours: 80,
        status: 'planned',
        assigned_resources: [developer.id, consultant.id]
      });

      const task2 = taskManager.createTask(project.id, {
        title: 'Core Implementation',
        start_date: '16-02-2025',
        end_date: '15-03-2025',
        effort_hours: 120,
        status: 'planned',
        assigned_resources: [developer.id]
      });

      // Verify tasks were created correctly
      expect(task1).toMatchObject({
        title: 'System Architecture Design',
        project_id: project.id,
        assigned_resources: [developer.id, consultant.id]
      });

      expect(task2).toMatchObject({
        title: 'Core Implementation',
        project_id: project.id,
        assigned_resources: [developer.id]
      });

      // Verify persistence
      const reloadedProjects = dataPM.loadProjects();
      const persistedProject = reloadedProjects[0];
      
      expect(persistedProject.tasks).toHaveLength(2);
      expect(persistedProject.resources).toHaveLength(2);
    });

    test('should handle task status updates and progress calculation', () => {
      // Create project with tasks
      const project = projectManager.createProject({
        title: 'Progress Tracking Project',
        description: 'Testing progress calculation',
        lane: 'euc',
        start_date: '01-03-2025',
        end_date: '31-08-2025',
        status: 'concept-design',
        pm_name: 'Progress Test PM',
        budget_cents: 1500000,
        financial_treatment: 'OPEX'
      });

      // Create multiple tasks with different effort hours
      const task1 = taskManager.createTask(project.id, {
        title: 'Requirements Analysis',
        start_date: '01-03-2025',
        end_date: '15-03-2025',
        effort_hours: 40,
        status: 'completed'
      });

      const task2 = taskManager.createTask(project.id, {
        title: 'Design Phase',
        start_date: '16-03-2025',
        end_date: '31-03-2025',
        effort_hours: 60,
        status: 'completed'
      });

      const task3 = taskManager.createTask(project.id, {
        title: 'Implementation',
        start_date: '01-04-2025',
        end_date: '30-06-2025',
        effort_hours: 160,
        status: 'in-progress'
      });

      const task4 = taskManager.createTask(project.id, {
        title: 'Testing',
        start_date: '01-07-2025',
        end_date: '31-07-2025',
        effort_hours: 40,
        status: 'planned'
      });

      // Calculate initial progress
      let progress = taskManager.calculateProjectProgress(project.id);
      expect(progress).toEqual({
        progress: 33, // floor((40+60) / (40+60+160+40) * 100) = floor(33.33) = 33
        total_hours: 300,
        completed_hours: 100
      });

      // Complete another task
      taskManager.updateTask(task3.id, { status: 'completed' });

      // Recalculate progress
      progress = taskManager.calculateProjectProgress(project.id);
      expect(progress).toEqual({
        progress: 86, // floor((40+60+160) / 300 * 100) = floor(86.66) = 86
        total_hours: 300,
        completed_hours: 260
      });

      // Complete all tasks
      taskManager.updateTask(task4.id, { status: 'completed' });

      progress = taskManager.calculateProjectProgress(project.id);
      expect(progress).toEqual({
        progress: 100,
        total_hours: 300,
        completed_hours: 300
      });
    });

    test('should handle resource assignment validation', () => {
      // Create project with resources
      const project = projectManager.createProject({
        title: 'Resource Validation Project',
        description: 'Testing resource assignment validation',
        lane: 'compliance',
        start_date: '01-04-2025',
        end_date: '30-09-2025',
        status: 'concept-design',
        pm_name: 'Validation Test PM',
        budget_cents: 1000000,
        financial_treatment: 'MIXED'
      });

      const resource1 = resourceManager.createResource(project.id, {
        name: 'Security Analyst',
        type: 'internal',
        allocation: 0.6
      });

      const resource2 = resourceManager.createResource(project.id, {
        name: 'Compliance Expert',
        type: 'vendor',
        allocation: 0.4,
        rate_per_hour: 20000
      });

      // Should create task with valid resources
      const validTask = taskManager.createTask(project.id, {
        title: 'Compliance Assessment',
        start_date: '01-05-2025',
        end_date: '31-05-2025',
        effort_hours: 100,
        assigned_resources: [resource1.id, resource2.id]
      });

      expect(validTask.assigned_resources).toEqual([resource1.id, resource2.id]);

      // Should reject task with non-existent resource
      expect(() => {
        taskManager.createTask(project.id, {
          title: 'Invalid Resource Task',
          start_date: '01-06-2025',
          end_date: '30-06-2025',
          effort_hours: 50,
          assigned_resources: [resource1.id, 'non-existent-resource']
        });
      }).toThrow('Resource not found in project: non-existent-resource');

      // Should reject task with duplicate resource assignments
      expect(() => {
        taskManager.createTask(project.id, {
          title: 'Duplicate Resource Task',
          start_date: '01-07-2025',
          end_date: '31-07-2025',
          effort_hours: 60,
          assigned_resources: [resource1.id, resource1.id]
        });
      }).toThrow('Duplicate resource assignment: ' + resource1.id);
    });
  });

  describe('Cross-Module Integration', () => {
    test('should integrate with ProjectManager status gates', () => {
      // Create project in solution-design status
      const project = projectManager.createProject({
        title: 'Status Gate Integration',
        description: 'Testing status gate integration',
        lane: 'office365',
        start_date: '01-06-2025',
        end_date: '31-12-2025',
        status: 'solution-design',
        pm_name: 'Status Gate PM',
        budget_cents: 3000000,
        financial_treatment: 'CAPEX'
      });

      // Cannot move to engineering without tasks
      expect(() => {
        projectManager.updateProject(project.id, { status: 'engineering' });
      }).toThrow('Cannot enter engineering without tasks');

      // Add a task
      const prepTask = taskManager.createTask(project.id, {
        title: 'Engineering Preparation',
        start_date: '01-07-2025',
        end_date: '15-07-2025',
        effort_hours: 40
      });

      // Now can move to engineering
      const engineeringProject = projectManager.updateProject(project.id, {
        status: 'engineering'
      });
      expect(engineeringProject.status).toBe('engineering');

      // Add more tasks and try to move to release
      const task1 = taskManager.createTask(project.id, {
        title: 'Feature A',
        start_date: '16-07-2025',
        end_date: '31-07-2025',
        effort_hours: 80,
        status: 'completed'
      });

      const task2 = taskManager.createTask(project.id, {
        title: 'Feature B',
        start_date: '01-08-2025',
        end_date: '31-08-2025',
        effort_hours: 60,
        status: 'in-progress'
      });

      // Add forecasts to meet UAT gate requirement
      const uatProject = projectManager.updateProject(project.id, {
        status: 'uat',
        forecasts: [{ id: 'forecast-1', month: '2025-09' }]
      });
      expect(uatProject.status).toBe('uat');

      // Cannot move to release with incomplete tasks
      expect(() => {
        projectManager.updateProject(project.id, { status: 'release' });
      }).toThrow('Cannot enter release with incomplete tasks');

      // Complete ALL tasks to meet release gate requirement
      taskManager.updateTask(prepTask.id, { status: 'completed' });
      taskManager.updateTask(task1.id, { status: 'completed' });
      taskManager.updateTask(task2.id, { status: 'completed' });

      // Now can move to release since all tasks are completed
      const releaseProject = projectManager.updateProject(project.id, {
        status: 'release'
      });
      expect(releaseProject.status).toBe('release');
    });

    test('should handle task deletion affecting project status gates', () => {
      // First create project in concept-design status
      const project = projectManager.createProject({
        title: 'Deletion Impact Project',
        description: 'Testing task deletion impact on status gates',
        lane: 'euc',
        start_date: '01-08-2025',
        end_date: '31-12-2025',
        status: 'concept-design',
        pm_name: 'Deletion Test PM',
        budget_cents: 2000000,
        financial_treatment: 'OPEX'
      });

      // Add initial task using TaskManager
      const initialTask = taskManager.createTask(project.id, {
        title: 'Initial Task',
        start_date: '01-08-2025',
        end_date: '15-08-2025',
        effort_hours: 40,
        status: 'planned'
      });

      // Now move to engineering status (should work with tasks present)
      const engineeringProject = projectManager.updateProject(project.id, {
        status: 'engineering'
      });
      expect(engineeringProject.status).toBe('engineering');

      // Add another task
      const newTask = taskManager.createTask(project.id, {
        title: 'Additional Task',
        start_date: '16-08-2025',
        end_date: '31-08-2025',
        effort_hours: 60
      });

      // Project should have 2 tasks now
      let currentProject = projectManager.getProject(project.id);
      expect(currentProject.tasks).toHaveLength(2);

      // Delete the new task
      const deleted = taskManager.deleteTask(newTask.id);
      expect(deleted).toBe(true);

      // Project should have 1 task remaining
      currentProject = projectManager.getProject(project.id);
      expect(currentProject.tasks).toHaveLength(1);

      // Delete the last task
      taskManager.deleteTask(initialTask.id);

      // Project should have 0 tasks, affecting status gate rules
      currentProject = projectManager.getProject(project.id);
      expect(currentProject.tasks).toHaveLength(0);

      // Should not be able to stay in engineering without tasks when trying to update
      // First move to a different status to reset, then try engineering
      projectManager.updateProject(project.id, { status: 'concept-design' });
      
      // Now should not be able to enter engineering without tasks
      expect(() => {
        projectManager.updateProject(project.id, { status: 'engineering' });
      }).toThrow('Cannot enter engineering without tasks');
    });
  });

  describe('Data Persistence Integration', () => {
    test('should persist task and resource relationships', () => {
      // Create project with resources and tasks
      const project = projectManager.createProject({
        title: 'Persistence Test Project',
        description: 'Testing data persistence',
        lane: 'compliance',
        start_date: '01-09-2025',
        end_date: '31-12-2025',
        status: 'concept-design',
        pm_name: 'Persistence PM',
        budget_cents: 1800000,
        financial_treatment: 'MIXED'
      });

      // Add resources
      const internalRes = resourceManager.createResource(project.id, {
        name: 'Internal Analyst',
        type: 'internal',
        allocation: 0.7
      });

      const contractorRes = resourceManager.createResource(project.id, {
        name: 'External Specialist',
        type: 'contractor',
        allocation: 0.4,
        rate_per_hour: 18000
      });

      // Add tasks with resource assignments
      const task1 = taskManager.createTask(project.id, {
        title: 'Analysis Task',
        start_date: '01-10-2025',
        end_date: '15-10-2025',
        effort_hours: 60,
        assigned_resources: [internalRes.id, contractorRes.id]
      });

      const task2 = taskManager.createTask(project.id, {
        title: 'Implementation Task',
        start_date: '16-10-2025',
        end_date: '31-10-2025',
        effort_hours: 100,
        assigned_resources: [internalRes.id]
      });

      // Verify data is persisted correctly
      const reloadedProjects = dataPM.loadProjects();
      expect(reloadedProjects).toHaveLength(1);

      const persistedProject = reloadedProjects[0];
      expect(persistedProject.resources).toHaveLength(2);
      expect(persistedProject.tasks).toHaveLength(2);

      // Verify task-resource relationships
      const persistedTask1 = persistedProject.tasks.find(t => t.title === 'Analysis Task');
      const persistedTask2 = persistedProject.tasks.find(t => t.title === 'Implementation Task');

      expect(persistedTask1.assigned_resources).toEqual([internalRes.id, contractorRes.id]);
      expect(persistedTask2.assigned_resources).toEqual([internalRes.id]);

      // Test data integrity after updates
      taskManager.updateTask(task1.id, {
        status: 'completed',
        assigned_resources: [contractorRes.id] // Remove internal resource
      });

      const updatedProjects = dataPM.loadProjects();
      const updatedProject = updatedProjects[0];
      const updatedTask = updatedProject.tasks.find(t => t.id === task1.id);

      expect(updatedTask.status).toBe('completed');
      expect(updatedTask.assigned_resources).toEqual([contractorRes.id]);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle concurrent operations gracefully', () => {
      const project = projectManager.createProject({
        title: 'Concurrency Test',
        description: 'Testing concurrent operations',
        lane: 'office365',
        start_date: '01-11-2025',
        end_date: '31-12-2025',
        status: 'concept-design',
        pm_name: 'Concurrency PM',
        budget_cents: 500000,
        financial_treatment: 'CAPEX'
      });

      // Add resource
      const resource = resourceManager.createResource(project.id, {
        name: 'Concurrent Resource',
        type: 'internal',
        allocation: 0.5
      });

      // Create multiple tasks concurrently
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        const task = taskManager.createTask(project.id, {
          title: `Concurrent Task ${i + 1}`,
          start_date: '01-11-2025',
          end_date: '15-11-2025',
          effort_hours: 20,
          assigned_resources: [resource.id]
        });
        tasks.push(task);
      }

      // Verify all tasks were created
      expect(tasks).toHaveLength(5);
      const uniqueIds = new Set(tasks.map(t => t.id));
      expect(uniqueIds.size).toBe(5); // All IDs should be unique

      // Verify persistence
      const reloadedProjects = dataPM.loadProjects();
      const persistedProject = reloadedProjects[0];
      expect(persistedProject.tasks).toHaveLength(5);
    });

    test('should handle storage corruption recovery', () => {
      // Corrupt the storage
      localStorage.setItem('testEnhancedTaskData', 'invalid json');

      // Should still work (ProjectManager handles corruption)
      const project = projectManager.createProject({
        title: 'Recovery Test',
        description: 'Testing recovery from corruption',
        lane: 'other',
        start_date: '01-12-2025',
        end_date: '31-12-2025',
        status: 'concept-design',
        pm_name: 'Recovery PM',
        budget_cents: 200000,
        financial_treatment: 'OPEX'
      });

      // Should be able to add resources and tasks
      const resource = resourceManager.createResource(project.id, {
        name: 'Recovery Resource',
        type: 'internal',
        allocation: 0.3
      });

      const task = taskManager.createTask(project.id, {
        title: 'Recovery Task',
        start_date: '01-12-2025',
        end_date: '15-12-2025',
        effort_hours: 30,
        assigned_resources: [resource.id]
      });

      expect(task).toBeDefined();
      expect(task.assigned_resources).toContain(resource.id);

      // Verify new data is persisted correctly
      const projects = dataPM.loadProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].tasks).toHaveLength(1);
      expect(projects[0].resources).toHaveLength(1);
    });
  });
});