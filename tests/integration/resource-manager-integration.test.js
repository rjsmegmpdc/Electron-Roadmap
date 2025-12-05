/**
 * Integration Tests for ResourceManager
 * 
 * Tests ResourceManager with real ProjectManager and DataPersistenceManager
 * to ensure proper integration and data persistence.
 */

import ResourceManager from '../../src/js/resource-manager.js';
import ProjectManager from '../../src/js/project-manager.js';
import DataPersistenceManager from '../../src/js/data-persistence-manager.js';
import DateUtils from '../../src/js/date-utils.js';

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

describe('ResourceManager Integration Tests', () => {
  let resourceManager;
  let projectManager;
  let dataPM;

  beforeEach(() => {
    // Clear storage completely
    global.localStorage.clear();
    
    // Setup with real dependencies
    dataPM = new DataPersistenceManager('testResourcesData');
    projectManager = new ProjectManager(dataPM);
    resourceManager = new ResourceManager(projectManager);
  });

  afterEach(() => {
    global.localStorage.clear();
  });

  describe('End-to-End Resource Management', () => {
    test('should create project, add resources, and persist correctly', () => {
      // Create a project
      const projectData = {
        title: 'Integration Test Project',
        description: 'Test project for resource management',
        lane: 'office365',
        start_date: '01-01-2025',
        end_date: '30-06-2025',
        status: 'concept-design',
        pm_name: 'Test Manager',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };

      const project = projectManager.createProject(projectData);

      // Add resources to the project
      const internalResource = {
        name: 'Senior Developer',
        type: 'internal',
        allocation: 0.8
      };

      const contractorResource = {
        name: 'External Consultant',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: 15000
      };

      const resource1 = resourceManager.createResource(project.id, internalResource);
      const resource2 = resourceManager.createResource(project.id, contractorResource);

      // Verify persistence
      const reloadedProjects = dataPM.loadProjects();
      expect(reloadedProjects).toHaveLength(1);

      const persistedProject = reloadedProjects[0];
      expect(persistedProject.resources).toHaveLength(2);

      const persistedResource1 = persistedProject.resources.find(r => r.id === resource1.id);
      const persistedResource2 = persistedProject.resources.find(r => r.id === resource2.id);

      expect(persistedResource1).toMatchObject({
        id: resource1.id,
        name: 'Senior Developer',
        type: 'internal',
        allocation: 0.8
      });

      expect(persistedResource2).toMatchObject({
        id: resource2.id,
        name: 'External Consultant',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: 15000
      });
    });

    test('should handle resource updates with persistence', () => {
      // Create project and resource
      const project = projectManager.createProject({
        title: 'Test Project',
        description: 'Test',
        lane: 'euc',
        start_date: '01-02-2025',
        end_date: '28-02-2025',
        status: 'concept-design',
        pm_name: 'Test PM',
        budget_cents: 500000,
        financial_treatment: 'OPEX'
      });

      const originalResource = resourceManager.createResource(project.id, {
        name: 'Original Name',
        type: 'internal',
        allocation: 0.6
      });

      // Update the resource
      const updates = {
        name: 'Updated Name',
        allocation: 0.9,
        rate_per_hour: 5000
      };

      const updatedResource = resourceManager.updateResource(project.id, originalResource.id, updates);

      // Verify updates persisted
      const reloadedProjects = dataPM.loadProjects();
      const persistedProject = reloadedProjects[0];
      const persistedResource = persistedProject.resources[0];

      expect(persistedResource).toMatchObject({
        id: originalResource.id,
        name: 'Updated Name',
        type: 'internal',
        allocation: 0.9,
        rate_per_hour: 5000
      });

      expect(updatedResource).toEqual(persistedResource);
    });

    test('should handle resource deletion with persistence', () => {
      // Create project with multiple resources
      const project = projectManager.createProject({
        title: 'Delete Test Project',
        description: 'Test',
        lane: 'compliance',
        start_date: '15-03-2025',
        end_date: '15-09-2025',
        status: 'concept-design',
        pm_name: 'Delete Test PM',
        budget_cents: 750000,
        financial_treatment: 'MIXED'
      });

      const resource1 = resourceManager.createResource(project.id, {
        name: 'Resource 1',
        type: 'internal',
        allocation: 0.4
      });

      const resource2 = resourceManager.createResource(project.id, {
        name: 'Resource 2',
        type: 'contractor',
        allocation: 0.6,
        rate_per_hour: 12000
      });

      // Delete one resource
      const deleteResult = resourceManager.deleteResource(project.id, resource1.id);
      expect(deleteResult).toBe(true);

      // Verify persistence
      const reloadedProjects = dataPM.loadProjects();
      const persistedProject = reloadedProjects[0];

      expect(persistedProject.resources).toHaveLength(1);
      expect(persistedProject.resources[0]).toMatchObject({
        id: resource2.id,
        name: 'Resource 2',
        type: 'contractor',
        allocation: 0.6,
        rate_per_hour: 12000
      });
    });
  });

  describe('Multi-Project Resource Analysis', () => {
    test('should handle resource utilization across multiple projects', () => {
      // Create multiple projects
      const project1 = projectManager.createProject({
        title: 'Project Alpha',
        description: 'First project',
        lane: 'office365',
        start_date: '01-04-2025',
        end_date: '30-06-2025',
        status: 'concept-design',
        pm_name: 'PM Alpha',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      });

      const project2 = projectManager.createProject({
        title: 'Project Beta',
        description: 'Second project',
        lane: 'euc',
        start_date: '01-05-2025',
        end_date: '31-07-2025',
        status: 'concept-design',
        pm_name: 'PM Beta',
        budget_cents: 800000,
        financial_treatment: 'OPEX'
      });

      // Add the same resource to both projects (using same ID to simulate shared resource)
      const resource1Id = resourceManager.createResource(project1.id, {
        name: 'Shared Developer',
        type: 'internal',
        allocation: 0.6
      }).id;

      // Manually add same resource to second project to simulate cross-project allocation
      const sharedResourceInProject2 = {
        id: resource1Id, // Same resource ID
        name: 'Shared Developer',
        type: 'internal',
        allocation: 0.3
      };

      const project2WithSharedResource = projectManager.getProject(project2.id);
      project2WithSharedResource.resources.push(sharedResourceInProject2);
      projectManager.updateProject(project2.id, { resources: project2WithSharedResource.resources });

      // Test utilization analysis
      const totalAllocation = resourceManager.getTotalResourceAllocation(resource1Id);
      expect(totalAllocation).toBeCloseTo(0.9, 2); // 0.6 + 0.3

      const isOverallocated = resourceManager.isResourceOverallocated(resource1Id);
      expect(isOverallocated).toBe(false);

      // Test resource search across projects
      const searchResults = resourceManager.searchResourcesByName('shared');
      expect(searchResults).toHaveLength(2);
      expect(searchResults[0].projectId).toBe(project1.id);
      expect(searchResults[1].projectId).toBe(project2.id);
    });

    test('should detect resource overallocation', () => {
      // Create projects with overallocated resource
      const project1 = projectManager.createProject({
        title: 'Overallocation Test 1',
        description: 'Test project 1',
        lane: 'office365',
        start_date: '01-06-2025',
        end_date: '30-08-2025',
        status: 'concept-design',
        pm_name: 'Test PM 1',
        budget_cents: 600000,
        financial_treatment: 'CAPEX'
      });

      const project2 = projectManager.createProject({
        title: 'Overallocation Test 2',
        description: 'Test project 2',
        lane: 'euc',
        start_date: '15-06-2025',
        end_date: '15-09-2025',
        status: 'concept-design',
        pm_name: 'Test PM 2',
        budget_cents: 700000,
        financial_treatment: 'OPEX'
      });

      // Create overallocated resource scenario
      const resourceId = resourceManager.createResource(project1.id, {
        name: 'Overallocated Developer',
        type: 'internal',
        allocation: 0.8
      }).id;

      // Add same resource to second project with high allocation
      const project2Resources = projectManager.getProject(project2.id).resources || [];
      project2Resources.push({
        id: resourceId,
        name: 'Overallocated Developer',
        type: 'internal',
        allocation: 0.7
      });
      projectManager.updateProject(project2.id, { resources: project2Resources });

      // Test overallocation detection
      const totalAllocation = resourceManager.getTotalResourceAllocation(resourceId);
      expect(totalAllocation).toBe(1.5); // 0.8 + 0.7

      const isOverallocated = resourceManager.isResourceOverallocated(resourceId);
      expect(isOverallocated).toBe(true);
    });
  });

  describe('Resource Types and Filtering', () => {
    test('should handle different resource types with persistence', () => {
      const project = projectManager.createProject({
        title: 'Resource Types Test',
        description: 'Testing different resource types',
        lane: 'compliance',
        start_date: '01-07-2025',
        end_date: '31-12-2025',
        status: 'concept-design',
        pm_name: 'Types Test PM',
        budget_cents: 1500000,
        financial_treatment: 'MIXED'
      });

      // Create resources of different types
      const internalResource = resourceManager.createResource(project.id, {
        name: 'Internal Dev',
        type: 'internal',
        allocation: 0.75
      });

      const contractorResource = resourceManager.createResource(project.id, {
        name: 'Contract Specialist',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: 18000
      });

      const vendorResource = resourceManager.createResource(project.id, {
        name: 'Vendor Support',
        type: 'vendor',
        allocation: 0.25,
        rate_per_hour: 25000
      });

      // Verify all types created and persisted
      const reloadedProjects = dataPM.loadProjects();
      const persistedProject = reloadedProjects[0];
      expect(persistedProject.resources).toHaveLength(3);

      const persistedInternal = persistedProject.resources.find(r => r.type === 'internal');
      const persistedContractor = persistedProject.resources.find(r => r.type === 'contractor');
      const persistedVendor = persistedProject.resources.find(r => r.type === 'vendor');

      expect(persistedInternal).toMatchObject({
        name: 'Internal Dev',
        type: 'internal',
        allocation: 0.75
      });

      expect(persistedContractor).toMatchObject({
        name: 'Contract Specialist',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: 18000
      });

      expect(persistedVendor).toMatchObject({
        name: 'Vendor Support',
        type: 'vendor',
        allocation: 0.25,
        rate_per_hour: 25000
      });

      // Test filtering by type
      const contractors = resourceManager.getResourcesByType('contractor');
      expect(contractors).toHaveLength(1);
      expect(contractors[0].name).toBe('Contract Specialist');
      expect(contractors[0].projectId).toBe(project.id);
    });
  });

  describe('Cost Calculations Integration', () => {
    test('should calculate resource costs accurately', () => {
      const project = projectManager.createProject({
        title: 'Cost Calculation Test',
        description: 'Testing cost calculations',
        lane: 'office365',
        start_date: '01-08-2025',
        end_date: '30-11-2025',
        status: 'concept-design',
        pm_name: 'Cost Test PM',
        budget_cents: 2000000,
        financial_treatment: 'CAPEX'
      });

      // Create resources with different rates
      const expensiveContractor = resourceManager.createResource(project.id, {
        name: 'Senior Architect',
        type: 'contractor',
        allocation: 1.0,
        rate_per_hour: 20000 // $200/hour
      });

      const moderateContractor = resourceManager.createResource(project.id, {
        name: 'Mid-level Developer',
        type: 'contractor',
        allocation: 0.8,
        rate_per_hour: 12000 // $120/hour
      });

      const internalResource = resourceManager.createResource(project.id, {
        name: 'Internal QA',
        type: 'internal',
        allocation: 0.6
        // No rate for internal
      });

      // Test cost calculations
      const expensiveCost = resourceManager.calculateResourceCost(expensiveContractor, 40);
      expect(expensiveCost).toBe(800000); // $8,000 for 40 hours at $200/hour

      const moderateCost = resourceManager.calculateResourceCost(moderateContractor, 80);
      expect(moderateCost).toBe(960000); // $9,600 for 80 hours at $120/hour

      const internalCost = resourceManager.calculateResourceCost(internalResource, 100);
      expect(internalCost).toBe(0); // Internal resources have no cost

      // Verify hourly rates
      expect(resourceManager.calculateHourlyCost(expensiveContractor)).toBe(20000);
      expect(resourceManager.calculateHourlyCost(moderateContractor)).toBe(12000);
      expect(resourceManager.calculateHourlyCost(internalResource)).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle storage corruption gracefully', () => {
      // Corrupt the storage
      localStorage.setItem('testResourcesData', 'invalid json');

      // ResourceManager should still work (ProjectManager handles corruption)
      const projects = projectManager.listProjects();
      expect(projects).toEqual([]);

      // Should be able to create new projects and resources
      const project = projectManager.createProject({
        title: 'Recovery Test',
        description: 'Testing recovery from corruption',
        lane: 'other',
        start_date: '01-09-2025',
        end_date: '30-09-2025',
        status: 'concept-design',
        pm_name: 'Recovery PM',
        budget_cents: 100000,
        financial_treatment: 'OPEX'
      });

      const resource = resourceManager.createResource(project.id, {
        name: 'Recovery Resource',
        type: 'internal',
        allocation: 0.5
      });

      expect(resource).toBeDefined();
      expect(resource.name).toBe('Recovery Resource');
    });

    test('should handle concurrent operations', () => {
      const project = projectManager.createProject({
        title: 'Concurrency Test',
        description: 'Testing concurrent operations',
        lane: 'euc',
        start_date: '01-10-2025',
        end_date: '31-10-2025',
        status: 'concept-design',
        pm_name: 'Concurrency PM',
        budget_cents: 300000,
        financial_treatment: 'CAPEX'
      });

      // Simulate concurrent resource creation
      const resources = [];
      for (let i = 0; i < 5; i++) {
        const resource = resourceManager.createResource(project.id, {
          name: `Concurrent Resource ${i + 1}`,
          type: 'internal',
          allocation: 0.2
        });
        resources.push(resource);
      }

      // Verify all resources were created with unique IDs
      expect(resources).toHaveLength(5);
      const uniqueIds = new Set(resources.map(r => r.id));
      expect(uniqueIds.size).toBe(5);

      // Verify persistence
      const reloadedProjects = dataPM.loadProjects();
      const persistedProject = reloadedProjects[0];
      expect(persistedProject.resources).toHaveLength(5);
    });
  });
});
