/**
 * Sample Resource Data Fixtures
 * 
 * Comprehensive resource data for testing ResourceManager functionality.
 * Includes all resource types, edge cases, validation scenarios, and examples.
 * 
 * Resource structure:
 * {
 *   id: string,
 *   name: string,
 *   type: 'internal' | 'contractor' | 'vendor',
 *   allocation: number (0.0 to 1.0),
 *   rate_per_hour?: number (cents, optional)
 * }
 */

// Valid resource examples covering all types
export const VALID_RESOURCES = {
  // Internal resources (no rates required)
  internal_developer: {
    id: 'res-internal-001',
    name: 'Senior Full Stack Developer',
    type: 'internal',
    allocation: 0.8
  },

  internal_architect: {
    id: 'res-internal-002', 
    name: 'Solution Architect',
    type: 'internal',
    allocation: 0.5
  },

  internal_pm: {
    id: 'res-internal-003',
    name: 'Technical Project Manager',
    type: 'internal',
    allocation: 0.3
  },

  internal_qa: {
    id: 'res-internal-004',
    name: 'Quality Assurance Lead',
    type: 'internal',
    allocation: 1.0
  },

  // Contractor resources (with rates)
  contractor_specialist: {
    id: 'res-contractor-001',
    name: 'SharePoint Specialist',
    type: 'contractor',
    allocation: 0.6,
    rate_per_hour: 12000 // $120/hour
  },

  contractor_architect: {
    id: 'res-contractor-002',
    name: 'Enterprise Architect',
    type: 'contractor',
    allocation: 0.4,
    rate_per_hour: 18000 // $180/hour
  },

  contractor_developer: {
    id: 'res-contractor-003',
    name: 'React Developer',
    type: 'contractor',
    allocation: 1.0,
    rate_per_hour: 15000 // $150/hour
  },

  contractor_security: {
    id: 'res-contractor-004',
    name: 'Cybersecurity Consultant',
    type: 'contractor',
    allocation: 0.25,
    rate_per_hour: 25000 // $250/hour
  },

  // Vendor resources (external services)
  vendor_support: {
    id: 'res-vendor-001',
    name: 'Microsoft Support Services',
    type: 'vendor',
    allocation: 0.2,
    rate_per_hour: 20000 // $200/hour
  },

  vendor_training: {
    id: 'res-vendor-002',
    name: 'User Training Provider',
    type: 'vendor',
    allocation: 0.1,
    rate_per_hour: 8000 // $80/hour
  },

  vendor_infrastructure: {
    id: 'res-vendor-003',
    name: 'Cloud Infrastructure Services',
    type: 'vendor',
    allocation: 0.15,
    rate_per_hour: 30000 // $300/hour
  }
};

// Invalid resource examples for validation testing
export const INVALID_RESOURCES = {
  missing_name: {
    type: 'internal',
    allocation: 0.5
  },

  missing_type: {
    name: 'Missing Type Resource',
    allocation: 0.5
  },

  missing_allocation: {
    name: 'Missing Allocation Resource',
    type: 'internal'
  },

  invalid_type: {
    name: 'Invalid Type Resource',
    type: 'freelancer', // Invalid type
    allocation: 0.5
  },

  negative_allocation: {
    name: 'Negative Allocation Resource',
    type: 'internal',
    allocation: -0.1
  },

  over_allocation: {
    name: 'Over Allocation Resource',
    type: 'internal',
    allocation: 1.5
  },

  zero_allocation: {
    name: 'Zero Allocation Resource',
    type: 'internal',
    allocation: 0
  },

  negative_rate: {
    name: 'Negative Rate Resource',
    type: 'contractor',
    allocation: 0.5,
    rate_per_hour: -1000
  },

  string_allocation: {
    name: 'String Allocation Resource',
    type: 'internal',
    allocation: 'invalid_number'
  },

  string_rate: {
    name: 'String Rate Resource',
    type: 'contractor',
    allocation: 0.5,
    rate_per_hour: 'not_a_number'
  }
};

// Edge case scenarios
export const EDGE_CASE_RESOURCES = {
  minimum_allocation: {
    id: 'res-edge-001',
    name: 'Minimum Allocation Resource',
    type: 'internal',
    allocation: 0.01 // 1% allocation
  },

  maximum_allocation: {
    id: 'res-edge-002',
    name: 'Maximum Allocation Resource',
    type: 'internal',
    allocation: 1.0 // 100% allocation
  },

  very_expensive_contractor: {
    id: 'res-edge-003',
    name: 'Executive Consultant',
    type: 'contractor',
    allocation: 0.1,
    rate_per_hour: 50000 // $500/hour
  },

  free_contractor: {
    id: 'res-edge-004',
    name: 'Pro Bono Consultant',
    type: 'contractor',
    allocation: 0.2,
    rate_per_hour: 0 // Free
  },

  very_long_name: {
    id: 'res-edge-005',
    name: 'This Is A Resource With An Extremely Long Name That Might Cause UI Or Database Issues In Real World Applications',
    type: 'vendor',
    allocation: 0.3,
    rate_per_hour: 12000
  },

  special_characters_name: {
    id: 'res-edge-006',
    name: 'Spéciál Çhåracters & Símböls Resource',
    type: 'internal',
    allocation: 0.4
  },

  decimal_precision: {
    id: 'res-edge-007',
    name: 'Decimal Precision Resource',
    type: 'contractor',
    allocation: 0.3333, // Testing floating point precision
    rate_per_hour: 12345 // Odd rate
  }
};

// Resource allocation scenarios for utilization testing
export const ALLOCATION_SCENARIOS = {
  underutilized: [
    {
      id: 'res-under-001',
      name: 'Underutilized Developer',
      type: 'internal',
      allocation: 0.2
    }
  ],

  optimal: [
    {
      id: 'res-optimal-001',
      name: 'Optimally Allocated Architect',
      type: 'internal',
      allocation: 0.8
    }
  ],

  overallocated: [
    {
      id: 'res-over-001',
      name: 'Overallocated Consultant',
      type: 'contractor',
      allocation: 0.7,
      rate_per_hour: 15000
    }
    // Note: This would need to appear in multiple projects to be truly overallocated
  ],

  multiple_projects_shared: [
    {
      id: 'res-shared-001',
      name: 'Cross-Project Resource',
      type: 'internal',
      allocation: 0.4 // This resource appears in multiple projects
    }
  ]
};

// Cost calculation test scenarios
export const COST_SCENARIOS = {
  high_cost: {
    id: 'res-cost-high-001',
    name: 'Expensive Senior Consultant',
    type: 'contractor',
    allocation: 1.0,
    rate_per_hour: 40000 // $400/hour
  },

  medium_cost: {
    id: 'res-cost-med-001',
    name: 'Mid-level Contractor',
    type: 'contractor',
    allocation: 0.8,
    rate_per_hour: 15000 // $150/hour
  },

  low_cost: {
    id: 'res-cost-low-001',
    name: 'Junior Contractor',
    type: 'contractor',
    allocation: 0.6,
    rate_per_hour: 8000 // $80/hour
  },

  no_cost_internal: {
    id: 'res-cost-none-001',
    name: 'Internal Employee',
    type: 'internal',
    allocation: 1.0
    // No rate_per_hour for internal resources
  }
};

// Resources by functional area
export const RESOURCES_BY_FUNCTION = {
  development: [
    {
      id: 'res-dev-001',
      name: 'Frontend Developer',
      type: 'internal',
      allocation: 0.8
    },
    {
      id: 'res-dev-002',
      name: 'Backend Developer',
      type: 'contractor',
      allocation: 1.0,
      rate_per_hour: 14000
    },
    {
      id: 'res-dev-003',
      name: 'Full Stack Developer',
      type: 'internal',
      allocation: 0.9
    }
  ],

  architecture: [
    {
      id: 'res-arch-001',
      name: 'Enterprise Architect',
      type: 'internal',
      allocation: 0.4
    },
    {
      id: 'res-arch-002',
      name: 'Solution Architect',
      type: 'contractor',
      allocation: 0.6,
      rate_per_hour: 20000
    }
  ],

  security: [
    {
      id: 'res-sec-001',
      name: 'Security Analyst',
      type: 'internal',
      allocation: 0.3
    },
    {
      id: 'res-sec-002',
      name: 'Penetration Tester',
      type: 'contractor',
      allocation: 0.2,
      rate_per_hour: 18000
    }
  ],

  infrastructure: [
    {
      id: 'res-infra-001',
      name: 'DevOps Engineer',
      type: 'internal',
      allocation: 0.7
    },
    {
      id: 'res-infra-002',
      name: 'Cloud Specialist',
      type: 'vendor',
      allocation: 0.3,
      rate_per_hour: 16000
    }
  ]
};

// Helper functions for test data generation
export const ResourceHelpers = {
  /**
   * Generate a resource with specific properties
   */
  generateResource(overrides = {}) {
    const defaults = {
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Generated Test Resource',
      type: 'internal',
      allocation: 0.5
    };

    return { ...defaults, ...overrides };
  },

  /**
   * Generate multiple resources for testing
   */
  generateResources(count, baseProperties = {}) {
    const resources = [];
    for (let i = 0; i < count; i++) {
      resources.push(this.generateResource({
        ...baseProperties,
        name: `${baseProperties.name || 'Test Resource'} ${i + 1}`
      }));
    }
    return resources;
  },

  /**
   * Create resources for overallocation testing
   */
  createOverallocationScenario(resourceId, totalAllocation = 1.2) {
    const allocationPerProject = totalAllocation / 2;
    return [
      {
        id: resourceId,
        name: 'Overallocated Resource',
        type: 'internal',
        allocation: allocationPerProject
      },
      {
        id: resourceId,
        name: 'Overallocated Resource',
        type: 'internal',
        allocation: allocationPerProject
      }
    ];
  },

  /**
   * Get all valid resource types
   */
  getValidResourceTypes() {
    return ['internal', 'contractor', 'vendor'];
  },

  /**
   * Get all resources of a specific type
   */
  getResourcesByType(type) {
    const allResources = { ...VALID_RESOURCES, ...EDGE_CASE_RESOURCES };
    return Object.values(allResources).filter(resource => resource.type === type);
  },

  /**
   * Validate resource data structure
   */
  validateResourceStructure(resource) {
    const required = ['name', 'type', 'allocation'];
    const validTypes = this.getValidResourceTypes();

    // Check required fields
    for (const field of required) {
      if (!(field in resource)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate type
    if (!validTypes.includes(resource.type)) {
      return { valid: false, error: `Invalid type: ${resource.type}` };
    }

    // Validate allocation
    if (typeof resource.allocation !== 'number' || resource.allocation <= 0 || resource.allocation > 1) {
      return { valid: false, error: `Invalid allocation: ${resource.allocation}` };
    }

    // Validate rate if present
    if (resource.rate_per_hour !== undefined) {
      if (typeof resource.rate_per_hour !== 'number' || resource.rate_per_hour < 0) {
        return { valid: false, error: `Invalid rate_per_hour: ${resource.rate_per_hour}` };
      }
    }

    return { valid: true };
  }
};