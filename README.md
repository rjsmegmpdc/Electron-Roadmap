# Roadmap-Tool v2

## 🚀 Complete Interactive Data Visualization Platform

**Roadmap-Tool v2** is a comprehensive project management and data visualization platform that combines advanced roadmap management with real-time analytics, interactive dashboards, and powerful visualization capabilities.

### 🏆 System Overview

This platform provides enterprise-grade features for:
- **Project & Resource Management** - Complete CRUD operations with validation
- **Task Management** - Integrated task tracking with resource assignments
- **Interactive Dashboards** - Drag-and-drop grid-based dashboard system
- **Advanced Analytics** - Real-time user interaction and performance tracking
- **Data Visualization** - Charts, heatmaps, treemaps, network diagrams
- **Real-time Streaming** - WebSocket-based live data updates
- **Data Export** - Multiple format exports (JSON, CSV, XML, PDF)

---

## 📊 Core Modules Status

### ✅ Project Management Core
- **ProjectManager** - Complete with TDD (97.72% coverage)
- **ResourceManager** - Complete with integration (100% coverage)
- **TaskManager** - Enhanced with resource integration

### ✅ Visualization Engine
- **Dashboard System** - Advanced grid-based dashboards (1,214 lines)
- **Chart Engine** - Canvas/SVG rendering with animations
- **Analytics Engine** - User tracking and performance metrics (1,169 lines)
- **Real-time Streaming** - WebSocket live updates (1,205 lines)
- **Data Export Tools** - Advanced visualizations (1,098 lines)

---

## 📋 Advanced Features

### 📈 Interactive Dashboard System
- **Grid-based Layout** - Drag-and-drop widget positioning
- **Responsive Design** - Mobile-friendly adaptive layouts
- **Widget Management** - Charts, metrics, tables, custom widgets
- **Theme Support** - Light/dark themes with customization
- **Real-time Updates** - Live data binding and synchronization
- **Export/Import** - Dashboard configuration persistence

### 📊 Advanced Analytics Engine
- **User Interaction Tracking** - Click, navigation, and engagement metrics
- **Performance Monitoring** - Page load times, memory usage, errors
- **Session Management** - User sessions with device fingerprinting
- **Custom Events** - Flexible event tracking system
- **Report Generation** - Automated insights and trend analysis
- **Data Anonymization** - Privacy-compliant user data handling

### 🎨 Visualization Tools
- **Chart Types** - Line, bar, pie, scatter, timeline charts
- **Advanced Visualizations** - Heatmaps, treemaps, network diagrams
- **Specialized Charts** - Calendar views, Sankey diagrams, sunburst
- **Interactive Features** - Zoom, pan, tooltips, animations
- **Export Capabilities** - PNG, SVG, PDF chart exports

### ⏱️ Real-time Streaming
- **WebSocket Integration** - Live data streaming
- **Performance Optimization** - Buffering, throttling, batching
- **Subscription Management** - Channel-based data delivery
- **Reconnection Logic** - Automatic reconnection with exponential backoff
- **Latency Monitoring** - Connection performance tracking

### 📊 Test Results
- **52 tests passing** (40 unit + 12 integration)
- **97.72% code coverage** for ProjectManager
- **94.56% branch coverage**
- Full CRUD operations validated
- Status gate enforcement tested
- Field validation comprehensive

### 🚀 Features Implemented

#### Core CRUD Operations
- ✅ `createProject(projectData)` - Creates projects with validation and defaults
- ✅ `getProject(id)` - Retrieves projects by ID
- ✅ `updateProject(id, updates)` - Updates projects with validation
- ✅ `deleteProject(id)` - Removes projects from storage
- ✅ `listProjects()` - Returns all projects

#### Validation System
- ✅ **Required fields:** title, start_date, end_date, budget_cents, financial_treatment
- ✅ **Date validation:** Uses DateUtils for NZ format (DD-MM-YYYY) validation and comparison
- ✅ **Budget validation:** Ensures budget_cents >= 0
- ✅ **ID uniqueness:** Prevents duplicate project IDs
- ✅ **Partial validation:** Only validates changed fields during updates

#### Lifecycle Gates Enforcement
- ✅ **solution-design** requires budget_cents > 0
- ✅ **engineering** requires tasks.length > 0  
- ✅ **uat** requires forecasts.length > 0
- ✅ **release** requires all tasks status === "completed"

#### Smart Defaults
- ✅ Auto-generates unique IDs when not provided
- ✅ Sets default status to 'concept-design'
- ✅ Initializes empty arrays for tasks, resources, forecasts

#### Integration Features
- ✅ Uses DataPersistenceManager dependency injection for storage
- ✅ Uses DateUtils for date validation and comparison
- ✅ Proper error handling with descriptive messages
- ✅ Full persistence through localStorage

### 🧪 Test Coverage

#### Unit Tests (`tests/unit/project-manager.test.js`)
- Constructor validation
- CRUD operation testing
- Field validation (all required and optional fields)
- Status gate enforcement
- Edge cases and error handling
- Enum value validation
- Date format and comparison testing

#### Integration Tests (`tests/integration/project-manager-integration.test.js`)
- Full CRUD workflows with real persistence
- Status gate enforcement with real data
- Field validation integration with DateUtils
- Complete project lifecycle transitions
- Bulk operations across all statuses
- Persistence integration with localStorage

### 📝 Sample Data Fixtures

Comprehensive sample data provided for testing and validation.

**Location:** `tests/fixtures/sample-projects.js`

**Exports:**
- **VALID_PROJECTS:** Valid projects spanning all lifecycle statuses
- **LANE_EXAMPLES:** Valid examples for each lane (office365, euc, compliance, other)
- **INVALID_DATA:** Invalid cases for validation tests
- **DATE_EXAMPLES:** NZ date format samples (valid and invalid)
- **ENUM_VALUES:** All supported enumerations
- **STATUS_GATE_SCENARIOS:** Specific test cases for gate enforcement
- **EDGE_CASES:** Boundary conditions and special characters
- **UPDATE_SCENARIOS:** Common update payloads
- **createTestProject(overrides):** Helper to create valid base projects
- **createProjectsForAllStatuses():** Helper to generate projects across all statuses

**Usage Example:**
```js path=null start=null
import { VALID_PROJECTS, INVALID_DATA, createTestProject } from '../fixtures/sample-projects';

// Create a valid project with overrides
const project = createTestProject({ 
  title: 'My Custom Project',
  budget_cents: 5000000 
});

// Test with invalid data
const invalid = INVALID_DATA.invalidDateFormat;
```

### 🎯 Field Formats & Validation Rules

#### Required Fields
- **title:** String, non-empty
- **start_date:** NZ format DD-MM-YYYY, valid date
- **end_date:** NZ format DD-MM-YYYY, valid date, must be after start_date
- **budget_cents:** Integer >= 0 (amount in cents)
- **financial_treatment:** One of ['CAPEX', 'OPEX', 'MIXED']

#### Optional Fields
- **id:** Auto-generated if not provided
- **description:** String
- **lane:** One of ['office365', 'euc', 'compliance', 'other']
- **status:** One of ['concept-design', 'solution-design', 'engineering', 'uat', 'release'] (defaults to 'concept-design')
- **pm_name:** String
- **tasks:** Array (defaults to [])
- **resources:** Array (defaults to [])
- **forecasts:** Array (defaults to [])

#### Status Gates
1. **concept-design → solution-design:** Requires budget_cents > 0
2. **solution-design → engineering:** Requires tasks.length > 0
3. **engineering → uat:** Requires forecasts.length > 0
4. **uat → release:** Requires all tasks have status === 'completed'

### 🏗️ Architecture

```
ProjectManager
├── Constructor(dataPM)
├── Public API
│   ├── createProject(projectData)
│   ├── getProject(id)
│   ├── updateProject(id, updates)
│   ├── deleteProject(id)
│   └── listProjects()
├── Private Methods
│   ├── _validateProject(projectData, isUpdate)
│   ├── _validateStatusGate(project, newStatus)
│   └── _generateId()
└── Dependencies
    ├── DataPersistenceManager (localStorage)
    └── DateUtils (NZ date validation)
```

### 📈 Implementation Approach

**Test-Driven Development (TDD):**
1. ✅ Created comprehensive failing tests first
2. ✅ Implemented minimal code to make tests pass
3. ✅ Refactored while maintaining test coverage
4. ✅ Added integration tests to validate real-world usage
5. ✅ Created extensive sample data for ongoing validation

**Key Benefits:**
- High confidence in correctness
- Comprehensive error handling
- Excellent code coverage
- Integration validated
- Sample data for ongoing development

---

## 📋 ResourceManager Implementation

The ResourceManager module provides comprehensive resource management within projects, including CRUD operations, utilization tracking, cost calculations, and multi-project resource analysis.

### 📈 Test Results
- **53 tests passing** (44 unit + 9 integration)
- **100% code coverage** for ResourceManager
- Full CRUD operations validated
- Cost calculations tested
- Resource utilization analysis validated
- Cross-project resource tracking

### 🚀 Features Implemented

#### Core CRUD Operations
- ✅ `createResource(projectId, resourceData)` - Creates resources within projects
- ✅ `getResource(projectId, resourceId)` - Retrieves specific resources
- ✅ `getProjectResources(projectId)` - Gets all resources for a project
- ✅ `updateResource(projectId, resourceId, updates)` - Updates resources with validation
- ✅ `deleteResource(projectId, resourceId)` - Removes resources from projects

#### Resource Analysis
- ✅ `getTotalResourceAllocation(resourceId)` - Calculates total allocation across projects
- ✅ `isResourceOverallocated(resourceId)` - Detects overallocation (>100%)
- ✅ `getResourcesByType(type)` - Filters resources by type across projects
- ✅ `searchResourcesByName(searchTerm)` - Search resources by name

#### Cost Calculations
- ✅ `calculateHourlyCost(resource)` - Gets hourly cost (rate_per_hour or 0)
- ✅ `calculateResourceCost(resource, hours)` - Calculates total cost for hours worked

#### Validation System
- ✅ **Required fields:** name, type, allocation
- ✅ **Resource types:** internal, contractor, vendor
- ✅ **Allocation validation:** Must be between 0.0 and 1.0 (exclusive of 0)
- ✅ **Rate validation:** Optional rate_per_hour >= 0 for contractors/vendors
- ✅ **String/number conversion:** Handles string inputs with validation

#### Integration Features
- ✅ Integrates with ProjectManager for project validation and persistence
- ✅ Auto-generates unique resource IDs
- ✅ Preserves project resource arrays during operations
- ✅ Cross-project resource analysis and utilization tracking

### 📁 Resource Data Structure

```js path=null start=null
{
  id: string,                    // Auto-generated unique ID
  name: string,                  // Resource name (required)
  type: 'internal' | 'contractor' | 'vendor',  // Resource type (required)
  allocation: number,            // 0.0 to 1.0 allocation percentage (required)
  rate_per_hour?: number        // Hourly rate in cents (optional)
}
```

### 🧪 Test Coverage

#### Unit Tests (`tests/unit/resource-manager.test.js`)
- Constructor validation with ProjectManager dependency
- CRUD operations with validation
- Resource type enum validation
- Allocation range validation (0.0 to 1.0)
- Rate validation for contractors
- Cost calculation methods
- Resource utilization analysis
- Search and filtering functionality
- Edge cases (string conversion, boundary values)
- Error handling scenarios

#### Integration Tests (`tests/integration/resource-manager-integration.test.js`)
- End-to-end resource management with real persistence
- Multi-project resource utilization scenarios
- Resource overallocation detection
- Different resource types with persistence
- Cost calculation integration
- Storage corruption recovery
- Concurrent operations

### 📄 Sample Data Fixtures

**Location:** `tests/fixtures/sample-resources.js`

**Exports:**
- **VALID_RESOURCES:** Complete examples for all resource types
- **INVALID_RESOURCES:** Invalid cases for validation testing
- **EDGE_CASE_RESOURCES:** Boundary conditions and special scenarios
- **ALLOCATION_SCENARIOS:** Under/optimal/overallocated examples
- **COST_SCENARIOS:** High/medium/low cost examples
- **RESOURCES_BY_FUNCTION:** Resources organized by functional area
- **ResourceHelpers:** Utility functions for generating test data

**Usage Example:**
```js path=null start=null
import { VALID_RESOURCES, ResourceHelpers } from '../fixtures/sample-resources';

// Use predefined valid resource
const contractor = VALID_RESOURCES.contractor_specialist;

// Generate custom resource
const customResource = ResourceHelpers.generateResource({
  name: 'Custom Developer',
  type: 'contractor',
  allocation: 0.75,
  rate_per_hour: 16000
});
```

### 📊 Resource Types & Use Cases

#### Internal Resources
- Company employees
- No hourly rate required
- Examples: Developers, Architects, Project Managers
- Cost: $0 (handled outside system)

#### Contractor Resources  
- External individuals/consultants
- Require hourly rate (rate_per_hour in cents)
- Examples: Specialists, Temporary developers
- Cost: allocation × hours × rate_per_hour

#### Vendor Resources
- External service providers
- Require hourly rate for cost calculations
- Examples: Support services, Training providers
- Cost: allocation × hours × rate_per_hour

### 🔍 Resource Analysis Features

#### Allocation Tracking
```js path=null start=null
// Get total allocation across all projects
const totalAllocation = resourceManager.getTotalResourceAllocation('res-001');
if (totalAllocation > 1.0) {
  console.log('Resource is overallocated!');
}
```

#### Cost Analysis
```js path=null start=null
// Calculate cost for 40 hours of work
const resource = { rate_per_hour: 15000 }; // $150/hour
const cost = resourceManager.calculateResourceCost(resource, 40);
console.log(`Total cost: $${cost / 100}`); // $6,000
```

#### Resource Search
```js path=null start=null
// Find all contractors
const contractors = resourceManager.getResourcesByType('contractor');

// Search by name
const developers = resourceManager.searchResourcesByName('developer');
```

### 🏧 Architecture

```
ResourceManager
├── Constructor(projectManager)
├── Public API
│   ├── CRUD Operations
│   │   ├── createResource(projectId, resourceData)
│   │   ├── getResource(projectId, resourceId)
│   │   ├── getProjectResources(projectId)
│   │   ├── updateResource(projectId, resourceId, updates)
│   │   └── deleteResource(projectId, resourceId)
│   ├── Analysis Operations
│   │   ├── getTotalResourceAllocation(resourceId)
│   │   ├── isResourceOverallocated(resourceId)
│   │   ├── getResourcesByType(type)
│   │   └── searchResourcesByName(searchTerm)
│   └── Cost Operations
│       ├── calculateHourlyCost(resource)
│       └── calculateResourceCost(resource, hours)
├── Private Methods
│   ├── _validateResource(resourceData, isUpdate)
│   ├── _parseNumber(value, fieldName)
│   └── _generateResourceId()
└── Dependencies
    └── ProjectManager (integration and persistence)
```

---

## 📋 TaskManager

**Enhanced Task Management with Resource Integration**

The TaskManager provides comprehensive task lifecycle management, integrated with ResourceManager for resource assignments and ProjectManager for persistence and status gate validation.

### ✨ Key Features

- **Task CRUD Operations:** Create, read, update, delete tasks
- **Resource Assignment:** Assign resources to tasks with validation
- **Progress Tracking:** Calculate project progress based on task completion
- **Status Management:** Track task status (planned, in-progress, completed)
- **Date & Effort Tracking:** Track task dates and effort hours
- **Integration:** Seamless integration with ProjectManager status gates
- **Validation:** Comprehensive field validation and error handling

### 🚀 Usage Examples

#### Basic Task Operations
```js path=null start=null
import TaskManager from './src/js/task-manager.js';
import ProjectManager from './src/js/project-manager.js';
import ResourceManager from './src/js/resource-manager.js';

const taskManager = new TaskManager(projectManager, resourceManager);

// Create a new task
const task = taskManager.createTask('proj-001', {
  title: 'API Development',
  start_date: '01-06-2025',
  end_date: '30-06-2025',
  effort_hours: 120,
  status: 'planned',
  assigned_resources: ['res-dev-001', 'res-dev-002']
});

// Update task status
const updatedTask = taskManager.updateTask(task.id, {
  status: 'in-progress'
});

// Get all project tasks
const projectTasks = taskManager.getProjectTasks('proj-001');
```

#### Progress Tracking
```js path=null start=null
// Calculate project progress
const progress = taskManager.calculateProjectProgress('proj-001');
console.log(`Project is ${progress.progress}% complete`);
console.log(`${progress.completed_hours}/${progress.total_hours} hours completed`);

// Example output:
// {
//   progress: 33,        // 33% complete
//   total_hours: 300,    // Total effort across all tasks
//   completed_hours: 100 // Hours from completed tasks
// }
```

#### Resource Assignment
```js path=null start=null
// Create task with multiple resources
const complexTask = taskManager.createTask('proj-001', {
  title: 'Integration Testing',
  start_date: '01-07-2025',
  end_date: '15-07-2025',
  effort_hours: 80,
  assigned_resources: ['tester-001', 'dev-lead-001', 'automation-001']
});

// Update resource assignments
taskManager.updateTask(complexTask.id, {
  assigned_resources: ['tester-001', 'tester-002'] // Replace with new team
});
```

### 🔧 Task Data Structure

**Required Fields:**
- `title` (string): Task name/description
- `start_date` (string): Start date in DD-MM-YYYY format  
- `end_date` (string): End date in DD-MM-YYYY format
- `effort_hours` (number): Estimated effort in hours (≥ 0)

**Optional Fields:**
- `status` (string): 'planned', 'in-progress', or 'completed' (default: 'planned')
- `assigned_resources` (array): Resource IDs assigned to task (default: [])

**Auto-Generated:**
- `id`: Unique task identifier
- `project_id`: Associated project ID

### 🧪 Testing

#### Unit Tests (`tests/unit/task-manager.test.js`)
- Task creation with validation
- Task updates and status changes
- Resource assignment validation
- Progress calculation algorithms
- Error handling scenarios
- Edge cases (zero hours, empty resources, etc.)

#### Integration Tests (`tests/integration/task-manager-enhanced-integration.test.js`)
- End-to-end task management with real dependencies
- TaskManager-ResourceManager integration
- TaskManager-ProjectManager status gate integration
- Persistence and data integrity
- Concurrent operations
- Storage corruption recovery

### 📄 Sample Data Fixtures

**Location:** `tests/fixtures/sample-tasks.js`

**Exports:**
- **validTasks:** Complete task examples with various configurations
- **invalidTasks:** Invalid cases for validation testing
- **edgeCaseTasks:** Boundary conditions and special scenarios
- **complexProjectScenarios:** Multi-task project examples
- **progressTestCases:** Progress calculation test data
- **resourceAssignmentScenarios:** Resource assignment examples
- **taskHelpers:** Utility functions for generating test data

**Usage Example:**
```js path=null start=null
import { validTasks, taskHelpers } from '../fixtures/sample-tasks';

// Use predefined valid task
const apiTask = validTasks.find(t => t.title.includes('API'));

// Generate custom task
const customTask = taskHelpers.generateTask('proj-001', {
  title: 'Custom Development Task',
  effort_hours: 60,
  assigned_resources: ['dev-001']
});

// Generate tasks with specific completion ratio
const tasks = taskHelpers.generateTasksWithCompletionRatio('proj-001', 10, 0.4);
// Creates 10 tasks, 40% completed
```

### 📊 Task Status & Progress

#### Task Status Enum
- **planned:** Task is scheduled but not started
- **in-progress:** Task is currently being worked on
- **completed:** Task is finished

#### Progress Calculation
```js path=null start=null
// Progress is calculated as: floor((completed_hours / total_hours) * 100)
// Only tasks with status 'completed' count toward progress

const progress = taskManager.calculateProjectProgress(projectId);
// Returns: { progress: number, total_hours: number, completed_hours: number }
```

### 🔍 Task Operations

#### Task Retrieval
```js path=null start=null
// Get single task
const task = taskManager.getTask('task-001');

// Get all tasks for a project
const projectTasks = taskManager.getProjectTasks('proj-001');

// Filter completed tasks
const completedTasks = projectTasks.filter(t => t.status === 'completed');
```

#### Task Validation
```js path=null start=null
// Automatic validation on create/update:
// - Title must be non-empty string
// - Dates must be valid DD-MM-YYYY format
// - End date must be after start date
// - Effort hours must be >= 0
// - Status must be valid enum value
// - Assigned resources must exist in project
// - No duplicate resource assignments
```

### 🏗️ Integration with ProjectManager

#### Status Gate Integration
```js path=null start=null
// TaskManager integrates with ProjectManager status gates:
// - Cannot enter 'engineering' status without tasks
// - Cannot enter 'release' status with incomplete tasks
// - Task deletion affects status gate validation

// Example: Adding tasks enables engineering status
taskManager.createTask(projectId, taskData);
projectManager.updateProject(projectId, { status: 'engineering' }); // Now allowed
```

#### Persistence Integration
```js path=null start=null
// Tasks are automatically persisted through ProjectManager
// - Create/update/delete operations persist immediately
// - Task data is stored as part of project data
// - Supports storage corruption recovery
```

### 🏧 Architecture

```
TaskManager
├── Constructor(projectManager, resourceManager)
├── Public API
│   ├── CRUD Operations
│   │   ├── createTask(projectId, taskData)
│   │   ├── getTask(taskId)
│   │   ├── getProjectTasks(projectId)
│   │   ├── updateTask(taskId, updates)
│   │   └── deleteTask(taskId)
│   └── Analysis Operations
│       └── calculateProjectProgress(projectId)
├── Private Methods
│   ├── _validateTask(taskData, isUpdate)
│   ├── _validateResourceAssignments(projectId, resources)
│   ├── _parseEffortHours(value)
│   ├── _validateDateRange(startDate, endDate)
│   └── _generateTaskId()
└── Dependencies
    ├── ProjectManager (persistence and status gates)
    └── ResourceManager (resource validation)
```
