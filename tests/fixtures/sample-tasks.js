/**
 * Enhanced Task Data Fixtures
 * 
 * Provides sample task data for testing TaskManager functionality
 * including resource assignments, progress tracking, and complex scenarios.
 */

/**
 * Valid sample tasks with various configurations
 */
export const validTasks = [
  {
    id: 'task-001',
    project_id: 'proj-001',
    title: 'Requirements Analysis',
    start_date: '01-02-2025',
    end_date: '15-02-2025',
    effort_hours: 80,
    status: 'completed',
    assigned_resources: ['resource-001', 'resource-002']
  },
  {
    id: 'task-002', 
    project_id: 'proj-001',
    title: 'System Architecture Design',
    start_date: '16-02-2025',
    end_date: '28-02-2025',
    effort_hours: 120,
    status: 'in-progress',
    assigned_resources: ['resource-001']
  },
  {
    id: 'task-003',
    project_id: 'proj-001', 
    title: 'Database Schema Design',
    start_date: '01-03-2025',
    end_date: '15-03-2025',
    effort_hours: 60,
    status: 'planned',
    assigned_resources: []
  },
  {
    id: 'task-004',
    project_id: 'proj-002',
    title: 'API Development',
    start_date: '01-04-2025',
    end_date: '30-04-2025',
    effort_hours: 200,
    status: 'in-progress',
    assigned_resources: ['resource-003', 'resource-004', 'resource-005']
  },
  {
    id: 'task-005',
    project_id: 'proj-002',
    title: 'Frontend Implementation',
    start_date: '15-04-2025',
    end_date: '31-05-2025',
    effort_hours: 180,
    status: 'planned',
    assigned_resources: ['resource-006']
  }
];

/**
 * Invalid task data for validation testing
 */
export const invalidTasks = [
  {
    id: 'invalid-task-001',
    project_id: 'proj-001',
    // Missing required title
    start_date: '01-06-2025',
    end_date: '15-06-2025',
    effort_hours: 40
  },
  {
    id: 'invalid-task-002',
    project_id: 'proj-001',
    title: 'Invalid Date Task',
    start_date: 'not-a-date',
    end_date: '15-07-2025',
    effort_hours: 60
  },
  {
    id: 'invalid-task-003',
    project_id: 'proj-001',
    title: 'Invalid End Date Task',
    start_date: '01-08-2025',
    end_date: '31-07-2025', // End before start
    effort_hours: 80
  },
  {
    id: 'invalid-task-004',
    project_id: 'proj-001',
    title: 'Invalid Effort Hours',
    start_date: '01-09-2025',
    end_date: '15-09-2025',
    effort_hours: -20 // Negative hours
  },
  {
    id: 'invalid-task-005',
    project_id: 'proj-001',
    title: 'Invalid Status',
    start_date: '01-10-2025',
    end_date: '15-10-2025',
    effort_hours: 40,
    status: 'invalid-status'
  }
];

/**
 * Edge case tasks for comprehensive testing
 */
export const edgeCaseTasks = [
  {
    id: 'edge-task-001',
    project_id: 'proj-001',
    title: 'Zero Hour Task',
    start_date: '01-11-2025',
    end_date: '01-11-2025',
    effort_hours: 0,
    status: 'completed',
    assigned_resources: []
  },
  {
    id: 'edge-task-002',
    project_id: 'proj-001',
    title: 'Maximum Title Length Task with Very Long Name That Exceeds Normal Expectations but Should Still Work',
    start_date: '02-11-2025',
    end_date: '03-11-2025',
    effort_hours: 8,
    status: 'planned',
    assigned_resources: []
  },
  {
    id: 'edge-task-003',
    project_id: 'proj-001',
    title: 'High Effort Task',
    start_date: '01-12-2025',
    end_date: '31-12-2025',
    effort_hours: 1000,
    status: 'planned',
    assigned_resources: []
  },
  {
    id: 'edge-task-004',
    project_id: 'proj-001',
    title: 'Many Resources Task',
    start_date: '01-01-2026',
    end_date: '15-01-2026',
    effort_hours: 100,
    status: 'planned',
    assigned_resources: ['res-001', 'res-002', 'res-003', 'res-004', 'res-005', 'res-006', 'res-007', 'res-008']
  }
];

/**
 * Complex project scenarios with multiple tasks
 */
export const complexProjectScenarios = {
  // Scenario 1: Multi-phase project with dependencies
  multiPhaseProject: {
    project_id: 'proj-multi-phase',
    tasks: [
      {
        id: 'phase1-task1',
        project_id: 'proj-multi-phase',
        title: 'Phase 1: Discovery',
        start_date: '01-03-2025',
        end_date: '31-03-2025',
        effort_hours: 160,
        status: 'completed',
        assigned_resources: ['analyst-001', 'pm-001']
      },
      {
        id: 'phase1-task2', 
        project_id: 'proj-multi-phase',
        title: 'Phase 1: Requirements Documentation',
        start_date: '15-03-2025',
        end_date: '15-04-2025',
        effort_hours: 100,
        status: 'completed',
        assigned_resources: ['analyst-001']
      },
      {
        id: 'phase2-task1',
        project_id: 'proj-multi-phase',
        title: 'Phase 2: Architecture Design',
        start_date: '01-04-2025',
        end_date: '30-04-2025',
        effort_hours: 200,
        status: 'in-progress',
        assigned_resources: ['architect-001', 'architect-002']
      },
      {
        id: 'phase2-task2',
        project_id: 'proj-multi-phase', 
        title: 'Phase 2: Security Review',
        start_date: '15-04-2025',
        end_date: '31-05-2025',
        effort_hours: 80,
        status: 'planned',
        assigned_resources: ['security-001']
      },
      {
        id: 'phase3-task1',
        project_id: 'proj-multi-phase',
        title: 'Phase 3: Implementation',
        start_date: '01-06-2025',
        end_date: '31-08-2025',
        effort_hours: 500,
        status: 'planned',
        assigned_resources: ['dev-001', 'dev-002', 'dev-003']
      }
    ],
    expectedProgress: {
      progress: 26, // floor((160+100) / (160+100+200+80+500) * 100) = floor(25.0) = 25
      total_hours: 1040,
      completed_hours: 260
    }
  },

  // Scenario 2: Resource-heavy project with over-allocation risks
  resourceHeavyProject: {
    project_id: 'proj-resource-heavy',
    tasks: [
      {
        id: 'heavy-task1',
        project_id: 'proj-resource-heavy',
        title: 'Concurrent Development Stream 1',
        start_date: '01-05-2025',
        end_date: '30-06-2025',
        effort_hours: 300,
        status: 'in-progress',
        assigned_resources: ['dev-001', 'dev-002']
      },
      {
        id: 'heavy-task2',
        project_id: 'proj-resource-heavy', 
        title: 'Concurrent Development Stream 2',
        start_date: '01-05-2025',
        end_date: '30-06-2025',
        effort_hours: 300,
        status: 'in-progress',
        assigned_resources: ['dev-002', 'dev-003'] // dev-002 appears in both tasks
      },
      {
        id: 'heavy-task3',
        project_id: 'proj-resource-heavy',
        title: 'Integration Testing',
        start_date: '01-07-2025',
        end_date: '31-07-2025',
        effort_hours: 120,
        status: 'planned',
        assigned_resources: ['test-001', 'dev-001', 'dev-002', 'dev-003']
      }
    ],
    expectedProgress: {
      progress: 0, // All tasks are in-progress or planned
      total_hours: 720,
      completed_hours: 0
    }
  },

  // Scenario 3: Project with varied task statuses
  mixedStatusProject: {
    project_id: 'proj-mixed-status',
    tasks: [
      {
        id: 'mixed-task1',
        project_id: 'proj-mixed-status',
        title: 'Completed Task',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 100,
        status: 'completed',
        assigned_resources: ['resource-001']
      },
      {
        id: 'mixed-task2',
        project_id: 'proj-mixed-status',
        title: 'In Progress Task',
        start_date: '16-01-2025',
        end_date: '31-01-2025',
        effort_hours: 80,
        status: 'in-progress',
        assigned_resources: ['resource-002']
      },
      {
        id: 'mixed-task3',
        project_id: 'proj-mixed-status',
        title: 'Planned Task',
        start_date: '01-02-2025',
        end_date: '15-02-2025',
        effort_hours: 60,
        status: 'planned',
        assigned_resources: ['resource-003']
      }
    ],
    expectedProgress: {
      progress: 41, // floor(100 / (100+80+60) * 100) = floor(41.66) = 41
      total_hours: 240,
      completed_hours: 100
    }
  }
};

/**
 * Progress calculation test cases
 */
export const progressTestCases = [
  {
    name: 'All tasks completed',
    tasks: [
      { effort_hours: 40, status: 'completed' },
      { effort_hours: 60, status: 'completed' },
      { effort_hours: 80, status: 'completed' }
    ],
    expected: { progress: 100, total_hours: 180, completed_hours: 180 }
  },
  {
    name: 'No tasks completed',
    tasks: [
      { effort_hours: 40, status: 'planned' },
      { effort_hours: 60, status: 'in-progress' },
      { effort_hours: 80, status: 'planned' }
    ],
    expected: { progress: 0, total_hours: 180, completed_hours: 0 }
  },
  {
    name: 'Mixed completion status',
    tasks: [
      { effort_hours: 100, status: 'completed' },
      { effort_hours: 200, status: 'in-progress' },
      { effort_hours: 300, status: 'planned' }
    ],
    expected: { progress: 16, total_hours: 600, completed_hours: 100 } // floor(100/600*100) = 16
  },
  {
    name: 'Empty project',
    tasks: [],
    expected: { progress: 0, total_hours: 0, completed_hours: 0 }
  },
  {
    name: 'Zero hour tasks',
    tasks: [
      { effort_hours: 0, status: 'completed' },
      { effort_hours: 40, status: 'planned' }
    ],
    expected: { progress: 0, total_hours: 40, completed_hours: 0 }
  }
];

/**
 * Resource assignment test data
 */
export const resourceAssignmentScenarios = {
  // Valid resource assignments
  valid: [
    {
      task_id: 'task-resource-001',
      assigned_resources: ['resource-001']
    },
    {
      task_id: 'task-resource-002',
      assigned_resources: ['resource-001', 'resource-002', 'resource-003']
    },
    {
      task_id: 'task-resource-003',
      assigned_resources: [] // No resources assigned
    }
  ],

  // Invalid resource assignments
  invalid: [
    {
      task_id: 'task-resource-invalid-001',
      assigned_resources: ['non-existent-resource'],
      expectedError: 'Resource not found in project: non-existent-resource'
    },
    {
      task_id: 'task-resource-invalid-002',
      assigned_resources: ['resource-001', 'resource-001'], // Duplicates
      expectedError: 'Duplicate resource assignment: resource-001'
    }
  ]
};

/**
 * Helper functions for generating test data
 */
export const taskHelpers = {
  /**
   * Generate a task with random data
   * @param {string} projectId - Project ID to assign task to
   * @param {Object} overrides - Properties to override defaults
   * @returns {Object} Generated task
   */
  generateTask(projectId, overrides = {}) {
    const defaults = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      project_id: projectId,
      title: `Generated Task ${Math.floor(Math.random() * 1000)}`,
      start_date: '01-06-2025',
      end_date: '30-06-2025',
      effort_hours: Math.floor(Math.random() * 200) + 20,
      status: 'planned',
      assigned_resources: []
    };

    return { ...defaults, ...overrides };
  },

  /**
   * Generate multiple tasks for a project
   * @param {string} projectId - Project ID
   * @param {number} count - Number of tasks to generate
   * @param {Object} baseOverrides - Base properties for all tasks
   * @returns {Array} Array of generated tasks
   */
  generateMultipleTasks(projectId, count, baseOverrides = {}) {
    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push(this.generateTask(projectId, {
        title: `Generated Task ${i + 1}`,
        ...baseOverrides
      }));
    }
    return tasks;
  },

  /**
   * Create tasks with specific completion ratios
   * @param {string} projectId - Project ID
   * @param {number} totalTasks - Total number of tasks
   * @param {number} completedRatio - Ratio of completed tasks (0-1)
   * @returns {Array} Array of tasks with specified completion ratio
   */
  generateTasksWithCompletionRatio(projectId, totalTasks, completedRatio) {
    const tasks = [];
    const completedCount = Math.floor(totalTasks * completedRatio);
    
    for (let i = 0; i < totalTasks; i++) {
      const status = i < completedCount ? 'completed' : 'planned';
      tasks.push(this.generateTask(projectId, {
        title: `Task ${i + 1}`,
        status,
        effort_hours: 40 // Fixed effort for consistent progress calculation
      }));
    }
    
    return tasks;
  },

  /**
   * Calculate expected progress for a set of tasks
   * @param {Array} tasks - Array of tasks
   * @returns {Object} Expected progress calculation
   */
  calculateExpectedProgress(tasks) {
    const totalHours = tasks.reduce((sum, task) => sum + task.effort_hours, 0);
    const completedHours = tasks
      .filter(task => task.status === 'completed')
      .reduce((sum, task) => sum + task.effort_hours, 0);
    
    const progress = totalHours > 0 ? Math.floor((completedHours / totalHours) * 100) : 0;
    
    return {
      progress,
      total_hours: totalHours,
      completed_hours: completedHours
    };
  }
};

export default {
  validTasks,
  invalidTasks,
  edgeCaseTasks,
  complexProjectScenarios,
  progressTestCases,
  resourceAssignmentScenarios,
  taskHelpers
};