/**
 * Sample Project Data Fixtures
 * 
 * Provides comprehensive sample data for testing ProjectManager functionality.
 * Covers all field formats, validation scenarios, status gates, and edge cases.
 * 
 * Data includes:
 * - Valid projects in all status phases
 * - Projects for testing status gate transitions
 * - Invalid data for validation testing
 * - Edge cases and boundary conditions
 * - NZ date format examples
 * - All enum value combinations
 */

// Valid sample projects covering all status phases
export const VALID_PROJECTS = {
  // Concept Design Phase - Minimal requirements
  conceptDesign: {
    id: 'proj-concept-001',
    title: 'Digital Workplace Strategy',
    description: 'Comprehensive strategy for digital workplace transformation',
    lane: 'office365',
    start_date: '15-01-2025',
    end_date: '30-06-2025',
    status: 'concept-design',
    pm_name: 'Sarah Johnson',
    budget_cents: 0, // No budget required for concept phase
    financial_treatment: 'CAPEX',
    tasks: [],
    resources: [],
    forecasts: []
  },

  // Solution Design Phase - Budget required
  solutionDesign: {
    id: 'proj-solution-001',
    title: 'Microsoft Teams Rollout',
    description: 'Enterprise-wide Microsoft Teams deployment',
    lane: 'office365',
    start_date: '01-02-2025',
    end_date: '31-08-2025',
    status: 'solution-design',
    pm_name: 'Michael Chen',
    budget_cents: 2500000, // $25,000 in cents
    financial_treatment: 'CAPEX',
    tasks: [],
    resources: [
      {
        id: 'res-001',
        name: 'Solution Architect',
        type: 'internal',
        allocation: 0.5
      }
    ],
    forecasts: []
  },

  // Engineering Phase - Tasks required
  engineering: {
    id: 'proj-engineering-001',
    title: 'SharePoint Migration',
    description: 'Migrate legacy SharePoint to SharePoint Online',
    lane: 'office365',
    start_date: '01-03-2025',
    end_date: '30-09-2025',
    status: 'engineering',
    pm_name: 'Emma Wilson',
    budget_cents: 5000000, // $50,000 in cents
    financial_treatment: 'OPEX',
    tasks: [
      {
        id: 'task-001',
        title: 'Site Assessment',
        description: 'Assess current SharePoint sites',
        status: 'in-progress',
        assigned_to: 'John Doe',
        due_date: '15-03-2025',
        effort_hours: 40
      },
      {
        id: 'task-002',
        title: 'Migration Scripts',
        description: 'Develop automated migration scripts',
        status: 'planned',
        assigned_to: 'Jane Smith',
        due_date: '01-04-2025',
        effort_hours: 80
      }
    ],
    resources: [
      {
        id: 'res-002',
        name: 'SharePoint Developer',
        type: 'contractor',
        allocation: 1.0,
        rate_per_hour: 12000 // $120/hour in cents
      }
    ],
    forecasts: []
  },

  // UAT Phase - Forecasts required
  uat: {
    id: 'proj-uat-001',
    title: 'EUC Security Compliance',
    description: 'Implement end-user computing security compliance',
    lane: 'euc',
    start_date: '01-04-2025',
    end_date: '31-10-2025',
    status: 'uat',
    pm_name: 'David Brown',
    budget_cents: 7500000, // $75,000 in cents
    financial_treatment: 'MIXED',
    tasks: [
      {
        id: 'task-003',
        title: 'Security Policy Review',
        description: 'Review and update security policies',
        status: 'completed',
        assigned_to: 'Alice Johnson',
        due_date: '15-04-2025',
        effort_hours: 60
      }
    ],
    resources: [
      {
        id: 'res-003',
        name: 'Security Consultant',
        type: 'contractor',
        allocation: 0.3,
        rate_per_hour: 15000 // $150/hour in cents
      }
    ],
    forecasts: [
      {
        id: 'forecast-001',
        month: '2025-05',
        capex_cents: 300000, // $3,000
        opex_cents: 200000,  // $2,000
        resource_hours: 120,
        confidence_level: 'medium'
      },
      {
        id: 'forecast-002',
        month: '2025-06',
        capex_cents: 400000, // $4,000
        opex_cents: 250000,  // $2,500
        resource_hours: 160,
        confidence_level: 'high'
      }
    ]
  },

  // Release Phase - All tasks completed
  release: {
    id: 'proj-release-001',
    title: 'Compliance Dashboard',
    description: 'Enterprise compliance monitoring dashboard',
    lane: 'compliance',
    start_date: '01-05-2025',
    end_date: '30-11-2025',
    status: 'release',
    pm_name: 'Lisa Anderson',
    budget_cents: 10000000, // $100,000 in cents
    financial_treatment: 'CAPEX',
    tasks: [
      {
        id: 'task-004',
        title: 'Dashboard Development',
        description: 'Develop compliance monitoring dashboard',
        status: 'completed',
        assigned_to: 'Tom Wilson',
        due_date: '01-06-2025',
        effort_hours: 200
      },
      {
        id: 'task-005',
        title: 'User Training',
        description: 'Train end users on dashboard usage',
        status: 'completed',
        assigned_to: 'Sarah Davis',
        due_date: '15-06-2025',
        effort_hours: 40
      },
      {
        id: 'task-006',
        title: 'Documentation',
        description: 'Create user documentation',
        status: 'completed',
        assigned_to: 'Mike Johnson',
        due_date: '20-06-2025',
        effort_hours: 30
      }
    ],
    resources: [
      {
        id: 'res-004',
        name: 'Full Stack Developer',
        type: 'internal',
        allocation: 0.8
      },
      {
        id: 'res-005',
        name: 'UX Designer',
        type: 'contractor',
        allocation: 0.2,
        rate_per_hour: 10000 // $100/hour in cents
      }
    ],
    forecasts: [
      {
        id: 'forecast-003',
        month: '2025-07',
        capex_cents: 1000000, // $10,000
        opex_cents: 500000,   // $5,000
        resource_hours: 200,
        confidence_level: 'high'
      }
    ]
  }
};

// Test data for different lanes
export const LANE_EXAMPLES = {
  office365: {
    id: 'proj-o365-001',
    title: 'Office 365 Migration',
    lane: 'office365',
    description: 'Migrate from on-premises Exchange to Office 365',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 5000000,
    financial_treatment: 'CAPEX'
  },
  euc: {
    id: 'proj-euc-001', 
    title: 'Windows 11 Deployment',
    lane: 'euc',
    description: 'Enterprise-wide Windows 11 upgrade',
    start_date: '15-02-2025',
    end_date: '31-12-2025',
    budget_cents: 8000000,
    financial_treatment: 'CAPEX'
  },
  compliance: {
    id: 'proj-comp-001',
    title: 'GDPR Compliance Audit',
    lane: 'compliance',
    description: 'Comprehensive GDPR compliance assessment',
    start_date: '01-03-2025',
    end_date: '30-09-2025',
    budget_cents: 3000000,
    financial_treatment: 'OPEX'
  },
  other: {
    id: 'proj-other-001',
    title: 'Network Infrastructure Upgrade',
    lane: 'other',
    description: 'Upgrade core network infrastructure',
    start_date: '01-04-2025',
    end_date: '31-08-2025',
    budget_cents: 15000000,
    financial_treatment: 'CAPEX'
  }
};

// Invalid data for validation testing
export const INVALID_DATA = {
  missingTitle: {
    // title missing
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
  },
  
  missingStartDate: {
    title: 'Invalid Project',
    // start_date missing
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
  },
  
  missingEndDate: {
    title: 'Invalid Project',
    start_date: '01-01-2025',
    // end_date missing
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
  },
  
  missingBudget: {
    title: 'Invalid Project',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    // budget_cents missing
    financial_treatment: 'CAPEX'
  },
  
  missingFinancialTreatment: {
    title: 'Invalid Project',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000
    // financial_treatment missing
  },
  
  invalidDateFormat: {
    title: 'Invalid Project',
    start_date: '2025-01-01', // Wrong format - should be DD-MM-YYYY
    end_date: '2025-06-30',   // Wrong format - should be DD-MM-YYYY
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
  },
  
  endDateBeforeStartDate: {
    title: 'Invalid Project',
    start_date: '30-06-2025',
    end_date: '01-01-2025', // End before start
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
  },
  
  negativeBudget: {
    title: 'Invalid Project',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: -1000, // Negative budget
    financial_treatment: 'CAPEX'
  }
};

// Date format examples (NZ format: DD-MM-YYYY)
export const DATE_EXAMPLES = {
  valid: [
    '01-01-2025',
    '15-06-2025',
    '31-12-2025',
    '29-02-2024', // Leap year
    '28-02-2025'  // Non-leap year
  ],
  invalid: [
    '2025-01-01',    // ISO format
    '01/01/2025',    // US format with slashes
    '1-1-2025',      // Single digits
    '32-01-2025',    // Invalid day
    '01-13-2025',    // Invalid month
    '29-02-2025',    // Invalid leap year
    'invalid-date',   // Text
    '',              // Empty
    null,            // Null
    undefined        // Undefined
  ]
};

// Enum value examples
export const ENUM_VALUES = {
  lanes: ['office365', 'euc', 'compliance', 'other'],
  statuses: ['concept-design', 'solution-design', 'engineering', 'uat', 'release'],
  financialTreatments: ['CAPEX', 'OPEX', 'MIXED'],
  taskStatuses: ['planned', 'in-progress', 'completed', 'blocked', 'cancelled'],
  resourceTypes: ['internal', 'contractor', 'vendor'],
  confidenceLevels: ['low', 'medium', 'high']
};

// Status gate test scenarios
export const STATUS_GATE_SCENARIOS = {
  // Cannot go to solution-design without budget
  solutionDesignWithoutBudget: {
    id: 'proj-gate-001',
    title: 'Test Project',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 0, // No budget
    financial_treatment: 'CAPEX',
    status: 'concept-design',
    tasks: [],
    resources: [],
    forecasts: []
  },
  
  // Cannot go to engineering without tasks
  engineeringWithoutTasks: {
    id: 'proj-gate-002',
    title: 'Test Project',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX',
    status: 'solution-design',
    tasks: [], // No tasks
    resources: [],
    forecasts: []
  },
  
  // Cannot go to UAT without forecasts
  uatWithoutForecasts: {
    id: 'proj-gate-003',
    title: 'Test Project',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX',
    status: 'engineering',
    tasks: [{ id: 'task-001', status: 'in-progress' }],
    resources: [],
    forecasts: [] // No forecasts
  },
  
  // Cannot go to release with incomplete tasks
  releaseWithIncompleteTasks: {
    id: 'proj-gate-004',
    title: 'Test Project',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX',
    status: 'uat',
    tasks: [
      { id: 'task-001', status: 'completed' },
      { id: 'task-002', status: 'in-progress' } // Not completed
    ],
    resources: [],
    forecasts: [{ id: 'forecast-001', month: '2025-01' }]
  }
};

// Edge cases and boundary conditions
export const EDGE_CASES = {
  minimumValidProject: {
    title: 'Minimum Project',
    start_date: '01-01-2025',
    end_date: '02-01-2025', // Next day
    budget_cents: 0,
    financial_treatment: 'OPEX'
  },
  
  maximumBudget: {
    title: 'Large Budget Project',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    budget_cents: 999999999999, // Very large budget
    financial_treatment: 'CAPEX'
  },
  
  longTitle: {
    title: 'This is a very long project title that tests the system\'s ability to handle lengthy text inputs and ensures proper validation',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
  },
  
  specialCharactersInFields: {
    title: 'Project with Special Characters: @#$%^&*()',
    description: 'Description with special chars: <>&"\'\\/',
    pm_name: 'John O\'Connor-Smith',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
  },
  
  emptyOptionalFields: {
    title: 'Project with Minimal Data',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
    // description, pm_name, lane intentionally omitted
  }
};

// Data for testing updates and partial validation
export const UPDATE_SCENARIOS = {
  titleUpdate: {
    title: 'Updated Project Title'
  },
  
  budgetUpdate: {
    budget_cents: 2000000
  },
  
  statusUpdate: {
    status: 'engineering'
  },
  
  multipleFieldUpdate: {
    title: 'Updated Title',
    budget_cents: 3000000,
    pm_name: 'New Project Manager'
  },
  
  dateUpdate: {
    start_date: '15-01-2025',
    end_date: '15-07-2025'
  }
};

// Helper function to create a project with specific characteristics
export function createTestProject(overrides = {}) {
  const baseProject = {
    title: 'Test Project',
    description: 'A test project for validation',
    lane: 'office365',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    status: 'concept-design',
    pm_name: 'Test Manager',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX',
    tasks: [],
    resources: [],
    forecasts: []
  };
  
  return { ...baseProject, ...overrides };
}

// Helper function to create projects for each status
export function createProjectsForAllStatuses() {
  const projects = [];
  let counter = 1;
  
  ENUM_VALUES.statuses.forEach(status => {
    const project = createTestProject({
      id: `test-${status}-${counter++}`,
      title: `${status} Project`,
      status,
      budget_cents: status === 'concept-design' ? 0 : 1000000,
      tasks: ['engineering', 'uat', 'release'].includes(status) ? 
        [{ id: `task-${counter}`, status: status === 'release' ? 'completed' : 'in-progress' }] : [],
      forecasts: ['uat', 'release'].includes(status) ? 
        [{ id: `forecast-${counter}`, month: '2025-01' }] : []
    });
    projects.push(project);
  });
  
  return projects;
}

export default {
  VALID_PROJECTS,
  LANE_EXAMPLES,
  INVALID_DATA,
  DATE_EXAMPLES,
  ENUM_VALUES,
  STATUS_GATE_SCENARIOS,
  EDGE_CASES,
  UPDATE_SCENARIOS,
  createTestProject,
  createProjectsForAllStatuses
};