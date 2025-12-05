/**
 * Unit Tests for ResourceManager
 * 
 * Tests resource management functionality including:
 * - CRUD operations for resources within projects
 * - Validation of resource fields and constraints
 * - Resource type validation (internal, contractor, vendor)
 * - Allocation percentage validation (0.0 to 1.0)
 * - Rate calculations and cost computations
 * - Integration with ProjectManager for persistence
 * - Error handling and edge cases
 */

import ResourceManager from '../../src/js/resource-manager.js';
import ProjectManager from '../../src/js/project-manager.js';
import DataPersistenceManager from '../../src/js/data-persistence-manager.js';

// Mock dependencies
const mockDataPM = {
  saveProjects: jest.fn(),
  loadProjects: jest.fn(() => [])
};

const mockProjectManager = {
  getProject: jest.fn(),
  updateProject: jest.fn(),
  listProjects: jest.fn(() => [])
};

describe('ResourceManager', () => {
  let resourceManager;

  beforeEach(() => {
    jest.clearAllMocks();
    resourceManager = new ResourceManager(mockProjectManager);
  });

  describe('Constructor', () => {
    test('should initialize with ProjectManager dependency', () => {
      expect(resourceManager).toBeInstanceOf(ResourceManager);
      expect(resourceManager.projectManager).toBe(mockProjectManager);
    });

    test('should throw error if ProjectManager is not provided', () => {
      expect(() => new ResourceManager(null)).toThrow('ProjectManager is required');
      expect(() => new ResourceManager()).toThrow('ProjectManager is required');
    });
  });

  describe('Resource Creation', () => {
    const validProject = {
      id: 'proj-001',
      title: 'Test Project',
      resources: []
    };

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(validProject);
    });

    test('should create resource with valid data', () => {
      const resourceData = {
        name: 'Senior Developer',
        type: 'internal',
        allocation: 0.8
      };

      const result = resourceManager.createResource('proj-001', resourceData);

      expect(result).toMatchObject({
        id: expect.stringMatching(/^res-/),
        name: 'Senior Developer',
        type: 'internal',
        allocation: 0.8
      });
      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        resources: [result]
      });
    });

    test('should create resource with optional rate for contractors', () => {
      const resourceData = {
        name: 'External Consultant',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: 15000 // $150/hour in cents
      };

      const result = resourceManager.createResource('proj-001', resourceData);

      expect(result).toMatchObject({
        id: expect.stringMatching(/^res-/),
        name: 'External Consultant',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: 15000
      });
    });

    test('should auto-generate unique resource ID', () => {
      const resourceData = {
        name: 'Test Resource',
        type: 'internal',
        allocation: 1.0
      };

      const result1 = resourceManager.createResource('proj-001', resourceData);
      const result2 = resourceManager.createResource('proj-001', resourceData);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toMatch(/^res-[\w-]+$/);
      expect(result2.id).toMatch(/^res-[\w-]+$/);
    });

    test('should reject creation if project does not exist', () => {
      mockProjectManager.getProject.mockReturnValue(null);

      const resourceData = {
        name: 'Test Resource',
        type: 'internal',
        allocation: 0.5
      };

      expect(() => {
        resourceManager.createResource('nonexistent-proj', resourceData);
      }).toThrow('Project not found: nonexistent-proj');
    });

    test('should validate required fields', () => {
      const testCases = [
        { data: { type: 'internal', allocation: 0.5 }, field: 'name' },
        { data: { name: 'Test', allocation: 0.5 }, field: 'type' },
        { data: { name: 'Test', type: 'internal' }, field: 'allocation' }
      ];

      testCases.forEach(({ data, field }) => {
        expect(() => {
          resourceManager.createResource('proj-001', data);
        }).toThrow(`Resource ${field} is required`);
      });
    });

    test('should validate resource type enum', () => {
      const resourceData = {
        name: 'Test Resource',
        type: 'invalid_type',
        allocation: 0.5
      };

      expect(() => {
        resourceManager.createResource('proj-001', resourceData);
      }).toThrow('Resource type must be one of: internal, contractor, vendor');
    });

    test('should validate allocation range', () => {
      const testCases = [
        { allocation: -0.1, message: 'Resource allocation must be between 0.0 and 1.0' },
        { allocation: 1.1, message: 'Resource allocation must be between 0.0 and 1.0' },
        { allocation: 0, message: 'Resource allocation must be greater than 0' }
      ];

      testCases.forEach(({ allocation, message }) => {
        const resourceData = {
          name: 'Test Resource',
          type: 'internal',
          allocation: allocation
        };

        expect(() => {
          resourceManager.createResource('proj-001', resourceData);
        }).toThrow(message);
      });
    });

    test('should validate rate_per_hour for contractors', () => {
      const resourceData = {
        name: 'Contractor',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: -100
      };

      expect(() => {
        resourceManager.createResource('proj-001', resourceData);
      }).toThrow('Resource rate_per_hour must be greater than 0');
    });

    test('should allow zero rate for internal resources', () => {
      const resourceData = {
        name: 'Internal Developer',
        type: 'internal',
        allocation: 0.8,
        rate_per_hour: 0
      };

      const result = resourceManager.createResource('proj-001', resourceData);
      expect(result.rate_per_hour).toBe(0);
    });
  });

  describe('Resource Retrieval', () => {
    const projectWithResources = {
      id: 'proj-001',
      resources: [
        {
          id: 'res-001',
          name: 'Developer A',
          type: 'internal',
          allocation: 0.8
        },
        {
          id: 'res-002',
          name: 'Consultant B',
          type: 'contractor',
          allocation: 0.5,
          rate_per_hour: 12000
        }
      ]
    };

    test('should get resource by ID from project', () => {
      mockProjectManager.getProject.mockReturnValue(projectWithResources);

      const result = resourceManager.getResource('proj-001', 'res-001');

      expect(result).toMatchObject({
        id: 'res-001',
        name: 'Developer A',
        type: 'internal',
        allocation: 0.8
      });
    });

    test('should return null for non-existent resource', () => {
      mockProjectManager.getProject.mockReturnValue(projectWithResources);

      const result = resourceManager.getResource('proj-001', 'res-nonexistent');

      expect(result).toBeNull();
    });

    test('should return null if project does not exist', () => {
      mockProjectManager.getProject.mockReturnValue(null);

      const result = resourceManager.getResource('nonexistent-proj', 'res-001');

      expect(result).toBeNull();
    });

    test('should get all resources for a project', () => {
      mockProjectManager.getProject.mockReturnValue(projectWithResources);

      const result = resourceManager.getProjectResources('proj-001');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'res-001', name: 'Developer A' });
      expect(result[1]).toMatchObject({ id: 'res-002', name: 'Consultant B' });
    });

    test('should return empty array for project with no resources', () => {
      mockProjectManager.getProject.mockReturnValue({ id: 'proj-001', resources: [] });

      const result = resourceManager.getProjectResources('proj-001');

      expect(result).toEqual([]);
    });
  });

  describe('Resource Updates', () => {
    const projectWithResources = {
      id: 'proj-001',
      resources: [
        {
          id: 'res-001',
          name: 'Original Name',
          type: 'internal',
          allocation: 0.5
        }
      ]
    };

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(projectWithResources);
    });

    test('should update resource with valid data', () => {
      const updates = {
        name: 'Updated Name',
        allocation: 0.8
      };

      const result = resourceManager.updateResource('proj-001', 'res-001', updates);

      expect(result).toMatchObject({
        id: 'res-001',
        name: 'Updated Name',
        type: 'internal',
        allocation: 0.8
      });

      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        resources: [result]
      });
    });

    test('should validate updated fields', () => {
      const testCases = [
        { updates: { type: 'invalid_type' }, message: 'Resource type must be one of: internal, contractor, vendor' },
        { updates: { allocation: 1.5 }, message: 'Resource allocation must be between 0.0 and 1.0' },
        { updates: { rate_per_hour: -500 }, message: 'Resource rate_per_hour must be greater than 0' }
      ];

      testCases.forEach(({ updates, message }) => {
        expect(() => {
          resourceManager.updateResource('proj-001', 'res-001', updates);
        }).toThrow(message);
      });
    });

    test('should reject updates to non-existent resource', () => {
      expect(() => {
        resourceManager.updateResource('proj-001', 'res-nonexistent', { name: 'New Name' });
      }).toThrow('Resource not found: res-nonexistent');
    });

    test('should prevent changing resource ID', () => {
      expect(() => {
        resourceManager.updateResource('proj-001', 'res-001', { id: 'new-id' });
      }).toThrow('Cannot change resource ID');
    });
  });

  describe('Resource Deletion', () => {
    const projectWithResources = {
      id: 'proj-001',
      resources: [
        { id: 'res-001', name: 'Resource A', type: 'internal', allocation: 0.5 },
        { id: 'res-002', name: 'Resource B', type: 'contractor', allocation: 0.3 }
      ]
    };

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(projectWithResources);
    });

    test('should delete existing resource', () => {
      const result = resourceManager.deleteResource('proj-001', 'res-001');

      expect(result).toBe(true);
      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        resources: [{ id: 'res-002', name: 'Resource B', type: 'contractor', allocation: 0.3 }]
      });
    });

    test('should return false for non-existent resource', () => {
      const result = resourceManager.deleteResource('proj-001', 'res-nonexistent');

      expect(result).toBe(false);
      expect(mockProjectManager.updateProject).not.toHaveBeenCalled();
    });

    test('should return false if project does not exist', () => {
      mockProjectManager.getProject.mockReturnValue(null);

      const result = resourceManager.deleteResource('nonexistent-proj', 'res-001');

      expect(result).toBe(false);
    });
  });

  describe('Cost Calculations', () => {
    test('should calculate hourly cost for contractor', () => {
      const resource = {
        id: 'res-001',
        name: 'Contractor',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: 12000 // $120/hour
      };

      const hourlyCost = resourceManager.calculateHourlyCost(resource);

      expect(hourlyCost).toBe(12000);
    });

    test('should return 0 for internal resources without rate', () => {
      const resource = {
        id: 'res-001',
        name: 'Internal Dev',
        type: 'internal',
        allocation: 0.8
      };

      const hourlyCost = resourceManager.calculateHourlyCost(resource);

      expect(hourlyCost).toBe(0);
    });

    test('should calculate cost for given hours', () => {
      const resource = {
        id: 'res-001',
        name: 'Contractor',
        type: 'contractor',
        allocation: 1.0,
        rate_per_hour: 15000 // $150/hour
      };

      const totalCost = resourceManager.calculateResourceCost(resource, 40); // 40 hours

      expect(totalCost).toBe(600000); // $6,000 in cents
    });

    test('should handle zero hours calculation', () => {
      const resource = {
        id: 'res-001',
        name: 'Contractor',
        type: 'contractor',
        allocation: 1.0,
        rate_per_hour: 15000
      };

      const totalCost = resourceManager.calculateResourceCost(resource, 0);

      expect(totalCost).toBe(0);
    });
  });

  describe('Resource Utilization Analysis', () => {
    const multiProjectSetup = [
      {
        id: 'proj-001',
        resources: [
          { id: 'res-001', name: 'Developer A', type: 'internal', allocation: 0.5 }
        ]
      },
      {
        id: 'proj-002',
        resources: [
          { id: 'res-001', name: 'Developer A', type: 'internal', allocation: 0.3 }
        ]
      }
    ];

    test('should calculate total allocation across projects', () => {
      mockProjectManager.listProjects.mockReturnValue(multiProjectSetup);

      const totalAllocation = resourceManager.getTotalResourceAllocation('res-001');

      expect(totalAllocation).toBe(0.8); // 0.5 + 0.3
    });

    test('should identify overallocated resources', () => {
      mockProjectManager.listProjects.mockReturnValue(multiProjectSetup);

      const isOverallocated = resourceManager.isResourceOverallocated('res-001');

      expect(isOverallocated).toBe(false); // 0.8 is within reasonable limits
    });

    test('should detect overallocation above 100%', () => {
      const overallocatedSetup = [
        {
          id: 'proj-001',
          resources: [
            { id: 'res-001', name: 'Developer A', type: 'internal', allocation: 0.7 }
          ]
        },
        {
          id: 'proj-002',
          resources: [
            { id: 'res-001', name: 'Developer A', type: 'internal', allocation: 0.5 }
          ]
        }
      ];

      mockProjectManager.listProjects.mockReturnValue(overallocatedSetup);

      const isOverallocated = resourceManager.isResourceOverallocated('res-001');

      expect(isOverallocated).toBe(true); // 1.2 > 1.0
    });

    test('should return zero allocation for non-existent resource', () => {
      mockProjectManager.listProjects.mockReturnValue([]);

      const totalAllocation = resourceManager.getTotalResourceAllocation('res-nonexistent');

      expect(totalAllocation).toBe(0);
    });
  });

  describe('Resource Search and Filtering', () => {
    const projectsWithVariousResources = [
      {
        id: 'proj-001',
        resources: [
          { id: 'res-001', name: 'Java Developer', type: 'internal', allocation: 0.8 },
          { id: 'res-002', name: 'React Developer', type: 'contractor', allocation: 0.5, rate_per_hour: 12000 }
        ]
      },
      {
        id: 'proj-002',
        resources: [
          { id: 'res-003', name: 'Security Consultant', type: 'vendor', allocation: 0.3, rate_per_hour: 20000 }
        ]
      }
    ];

    beforeEach(() => {
      mockProjectManager.listProjects.mockReturnValue(projectsWithVariousResources);
    });

    test('should filter resources by type', () => {
      const contractorResources = resourceManager.getResourcesByType('contractor');

      expect(contractorResources).toHaveLength(1);
      expect(contractorResources[0]).toMatchObject({
        id: 'res-002',
        name: 'React Developer',
        type: 'contractor'
      });
    });

    test('should search resources by name', () => {
      const developerResources = resourceManager.searchResourcesByName('developer');

      expect(developerResources).toHaveLength(2);
      expect(developerResources.map(r => r.name)).toEqual(
        expect.arrayContaining(['Java Developer', 'React Developer'])
      );
    });

    test('should return empty array for no matches', () => {
      const noMatches = resourceManager.getResourcesByType('nonexistent');
      expect(noMatches).toEqual([]);

      const noNameMatches = resourceManager.searchResourcesByName('xyz123');
      expect(noNameMatches).toEqual([]);
    });

    test('should search case-insensitively', () => {
      const results = resourceManager.searchResourcesByName('JAVA');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Java Developer');
    });
  });

  describe('Validation Edge Cases', () => {
    const validProject = {
      id: 'proj-001',
      resources: []
    };

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(validProject);
    });

    test('should handle string allocation conversion', () => {
      const resourceData = {
        name: 'Test Resource',
        type: 'internal',
        allocation: '0.75' // String that should be converted
      };

      const result = resourceManager.createResource('proj-001', resourceData);

      expect(result.allocation).toBe(0.75);
    });

    test('should handle string rate conversion', () => {
      const resourceData = {
        name: 'Test Contractor',
        type: 'contractor',
        allocation: 0.5,
        rate_per_hour: '15000' // String that should be converted
      };

      const result = resourceManager.createResource('proj-001', resourceData);

      expect(result.rate_per_hour).toBe(15000);
    });

    test('should reject invalid allocation strings', () => {
      const resourceData = {
        name: 'Test Resource',
        type: 'internal',
        allocation: 'invalid_number'
      };

      expect(() => {
        resourceManager.createResource('proj-001', resourceData);
      }).toThrow('Resource allocation must be a valid number');
    });

    test('should handle exact boundary values', () => {
      const validBoundaryData = {
        name: 'Boundary Test',
        type: 'internal',
        allocation: 1.0 // Exactly at upper limit
      };

      const result = resourceManager.createResource('proj-001', validBoundaryData);

      expect(result.allocation).toBe(1.0);
    });
  });

  describe('Integration with ProjectManager', () => {
    test('should integrate with project lifecycle status gates', () => {
      const projectInConceptPhase = {
        id: 'proj-001',
        status: 'concept-design',
        resources: []
      };

      mockProjectManager.getProject.mockReturnValue(projectInConceptPhase);

      const resourceData = {
        name: 'Early Resource',
        type: 'internal',
        allocation: 0.5
      };

      const result = resourceManager.createResource('proj-001', resourceData);

      expect(result).toBeDefined();
      // Should allow resource creation in concept phase
    });

    test('should preserve project resource array structure', () => {
      const projectWithExistingResources = {
        id: 'proj-001',
        resources: [
          { id: 'existing-res', name: 'Existing', type: 'internal', allocation: 0.4 }
        ]
      };

      mockProjectManager.getProject.mockReturnValue(projectWithExistingResources);

      const newResourceData = {
        name: 'New Resource',
        type: 'contractor',
        allocation: 0.6,
        rate_per_hour: 14000
      };

      const result = resourceManager.createResource('proj-001', newResourceData);

      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        resources: [
          { id: 'existing-res', name: 'Existing', type: 'internal', allocation: 0.4 },
          result
        ]
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle ProjectManager errors gracefully', () => {
      mockProjectManager.getProject.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      expect(() => {
        resourceManager.getResource('proj-001', 'res-001');
      }).toThrow('Database connection failed');
    });

    test('should handle malformed project data', () => {
      mockProjectManager.getProject.mockReturnValue({
        id: 'proj-001',
        resources: null // Malformed - should be array
      });

      expect(() => {
        resourceManager.getProjectResources('proj-001');
      }).toThrow('Invalid project resources data');
    });

    test('should validate null/undefined inputs', () => {
      expect(() => {
        resourceManager.createResource(null, { name: 'Test', type: 'internal', allocation: 0.5 });
      }).toThrow('Project ID is required');

      expect(() => {
        resourceManager.createResource('proj-001', null);
      }).toThrow('Resource data is required');
    });
  });
});