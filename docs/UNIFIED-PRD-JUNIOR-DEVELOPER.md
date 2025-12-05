# Roadmap Tool v2 - Complete PRD for Junior Developers

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack & Architecture](#technology-stack--architecture)
3. [Project Structure & Setup](#project-structure--setup)
4. [Data Models & Field Specifications](#data-models--field-specifications)
5. [Core Modules Implementation](#core-modules-implementation)
6. [Strategic Layer (Vision/Goals/Initiatives)](#strategic-layer-visiongoalsinitiatives)
7. [Work Integration Module](#work-integration-module)
8. [User Interface Specifications](#user-interface-specifications)
9. [Testing Strategy](#testing-strategy)
10. [Development Workflow](#development-workflow)
11. [Deployment & Maintenance](#deployment--maintenance)

---

## Project Overview

### Goal
Build a comprehensive browser-only roadmap application that supports strategic planning through work execution. The system manages projects, tasks, resources, financials, and forecasting with complete traceability from Vision → Goals → Initiatives → Projects → Tasks.

### Key Features
- **Strategic Planning**: Vision, Goals, and Initiatives management
- **Project Management**: Full project lifecycle with status gates
- **Task Management**: Detailed task tracking and progress monitoring
- **Resource Management**: Resource allocation and utilization tracking
- **Financial Management**: Budget tracking, cost calculation, and variance analysis
- **Forecasting**: Delivery, resource, and cost projections
- **Work Integration**: Two-way sync with GitHub Issues
- **Data Management**: CSV import/export and local persistence

### Target Users
- Project Managers
- Strategic Planners
- Development Teams
- Resource Managers
- Financial Controllers

---

## Technology Stack & Architecture

### Core Technologies
- **Frontend**: Pure HTML5, CSS3, ES6 Modules
- **Storage**: localStorage (browser-based)
- **Testing**: Jest (unit tests) + Playwright (E2E tests)
- **Linting**: ESLint (eslint:recommended)

### Architecture Patterns
- **Modular Design**: ES6 modules with dependency injection
- **Single Responsibility**: Each module handles one concern
- **Data Persistence**: Centralized through DataPersistenceManager
- **Error Handling**: Consistent error messages and validation

### Browser Compatibility
- Modern browsers supporting ES6 modules
- No external dependencies or build process required
- Runs entirely in the browser (no server required)

---

## Project Structure & Setup

### Directory Structure
```
roadmap-tool/
├── docs/
│   ├── UNIFIED-PRD-JUNIOR-DEVELOPER.md
│   ├── sample-data/
│   │   ├── field-formats.md
│   │   ├── project-examples.md
│   │   └── README.md
├── src/
│   ├── index.html                    # Timeline/Gantt view
│   ├── project-details.html          # Project CRUD + tabs
│   ├── launchpad.html               # Entry hub
│   ├── strategic-planning.html       # Vision/Goals/Initiatives
│   ├── styles/
│   │   └── main.css
│   ├── js/
│   │   ├── app.js                   # Bootstrap + DI container
│   │   ├── date-utils.js            # NZ date utilities
│   │   ├── data-persistence-manager.js
│   │   ├── project-manager.js
│   │   ├── task-manager.js
│   │   ├── resource-manager.js
│   │   ├── financial-manager.js
│   │   ├── forecasting-engine.js
│   │   ├── csv-manager.js
│   │   ├── form-validation.js
│   │   ├── drag-drop-manager.js
│   │   ├── lineage-validator.js
│   │   ├── prd-integration.js
│   │   ├── strategic/
│   │   │   ├── vision-manager.js
│   │   │   ├── goals-manager.js
│   │   │   └── initiatives-manager.js
│   │   └── integrations/
│   │       └── work/
│   │           ├── work-integration-manager.js
│   │           ├── work-template-engine.js
│   │           ├── work-mapping-config.js
│   │           ├── work-validation.js
│   │           ├── work-sync-engine.js
│   │           ├── github-client.js
│   │           ├── github-webhook-receiver.js
│   │           ├── audit-log.js
│   │           └── index.js
│   └── views/
│       └── integrations/
│           └── work-settings.html
└── tests/
    ├── fixtures/
    │   ├── seed.json
    │   ├── sample_simple.csv
    │   ├── sample_full.csv
    │   ├── invalid.csv
    │   └── work/
    │       ├── settings.sample.json
    │       ├── rendered.epic.sample.md
    │       ├── rendered.story.sample.md
    │       ├── webhook.issue.edited.sample.json
    │       └── zip-mirror/
    │           └── .github/
    │               ├── instructions/
    │               │   ├── overlay/
    │               │   │   ├── epics/
    │               │   │   ├── features/
    │               │   │   ├── userstories/
    │               │   │   ├── tasks/
    │               │   │   └── issues/
    │               │   └── base/
    │               ├── chatmodes/
    │               └── config/
    ├── unit/
    │   ├── date-utils.test.js
    │   ├── data-persistence-manager.test.js
    │   ├── project-manager.test.js
    │   ├── task-manager.test.js
    │   ├── resource-manager.test.js
    │   ├── financial-manager.test.js
    │   ├── forecasting-engine.test.js
    │   ├── csv-manager.test.js
    │   ├── form-validation.test.js
    │   ├── drag-drop-manager.test.js
    │   ├── lineage-validator.test.js
    │   ├── prd-integration.test.js
    │   ├── strategic/
    │   │   ├── vision-manager.test.js
    │   │   ├── goals-manager.test.js
    │   │   └── initiatives-manager.test.js
    │   └── integrations/work/
    │       ├── work-integration-manager.test.js
    │       ├── work-template-engine.test.js
    │       ├── work-mapping-config.test.js
    │       ├── work-validation.test.js
    │       ├── work-sync-engine.test.js
    │       ├── github-client.test.js
    │       ├── github-webhook-receiver.test.js
    │       └── audit-log.test.js
    └── e2e/
        ├── ui.test.js
        └── work-integration.ui.test.js
```

### Initial Setup Commands
```bash
# Initialize project
npm init -y

# Install dependencies
npm i -D jest @playwright/test eslint

# Install Playwright browsers
npx playwright install

# Setup package.json scripts
```

### package.json Configuration
```json
{
  "scripts": {
    "dev": "python -m http.server 8000",
    "test": "jest --coverage",
    "e2e": "playwright test",
    "lint": "eslint src/js/ --fix"
  },
  "type": "module"
}
```

---

## Data Models & Field Specifications

### Core Data Standards
- **Dates**: DD-MM-YYYY format (New Zealand standard)
- **Currency**: All amounts stored in cents (integers)
- **IDs**: Generated format `{type}-{timestamp}-{random}` or custom
- **Status**: Lowercase with hyphens (e.g., 'concept-design')

### Project Data Model
```javascript
{
  // Required Fields
  "id": "proj-001",                    // String - unique identifier
  "title": "Microsoft Teams Rollout",  // String - non-empty
  "start_date": "15-01-2025",         // String - DD-MM-YYYY format
  "end_date": "30-06-2025",           // String - DD-MM-YYYY, after start_date
  "budget_cents": 2500000,            // Integer - >= 0 (represents $25,000.00)
  "financial_treatment": "CAPEX",      // Enum: "CAPEX"|"OPEX"|"MIXED"
  
  // Optional Fields
  "description": "Enterprise Teams deployment", // String - optional
  "lane": "office365",                 // Enum: "office365"|"euc"|"compliance"|"other"
  "status": "concept-design",          // Enum: "concept-design"|"solution-design"|"engineering"|"uat"|"release"
  "pm_name": "Sarah Johnson",          // String - optional
  "initiative_id": "init-001",         // String - links to Strategic Layer
  
  // Related Data Arrays
  "tasks": [],                         // Array of Task objects
  "resources": [],                     // Array of Resource objects
  "forecasts": []                      // Array of Forecast objects
}
```

### Task Data Model
```javascript
{
  "id": "task-001",                    // String - unique identifier
  "project_id": "proj-001",            // String - parent project reference
  "title": "Site Assessment",          // String - required
  "description": "Assess current sites", // String - optional
  "start_date": "01-01-2025",         // String - DD-MM-YYYY format
  "end_date": "05-01-2025",           // String - DD-MM-YYYY, after start_date
  "effort_hours": 40,                 // Number - >= 0
  "status": "planned",                // Enum: "planned"|"in-progress"|"blocked"|"completed"
  "assigned_resources": ["res-001"]    // Array of resource IDs
}
```

### Resource Data Model
```javascript
{
  "id": "res-001",                     // String - unique identifier
  "name": "Solution Architect",        // String - required
  "role": "Architect",                 // String - required
  "cost_rate_per_hour_cents": 12000,   // Integer - cost in cents per hour
  "skills": ["SharePoint", "Azure"],   // Array of strings - optional
  "capacity_percentage": 100,          // Integer 1-100 - working capacity
  "active": true                       // Boolean - availability status
}
```

### Strategic Layer Models

#### Vision Data Model
```javascript
{
  "id": "vision-001",
  "title": "Reimagine IT Support as Conversations, not Tickets",
  "description": "Transform IT support from reactive ticketing to proactive conversational assistance",
  "owner": "IT Leadership Team",
  "created_date": "01-01-2025",
  "target_completion": "31-12-2027",
  "success_metrics": [
    "60% reduction in helpdesk tickets",
    "90% user satisfaction score"
  ],
  "goals": []                          // Array of Goal IDs
}
```

#### Goal Data Model
```javascript
{
  "id": "goal-001",
  "vision_id": "vision-001",
  "title": "Reduce inbound Helpdesk tickets by 60% by FY27",
  "description": "Implement self-service and proactive support to reduce ticket volume",
  "owner": "Service Desk Manager",
  "start_date": "01-01-2025",
  "target_date": "31-03-2027",
  "success_criteria": [
    "Monthly ticket volume < 40% of baseline",
    "Self-service resolution rate > 70%"
  ],
  "kpis": [
    {
      "metric": "Monthly Tickets",
      "baseline": 1000,
      "target": 400,
      "current": 950
    }
  ],
  "initiatives": []                    // Array of Initiative IDs
}
```

#### Initiative Data Model
```javascript
{
  "id": "init-001",
  "goal_id": "goal-001",
  "title": "Tickets → Conversations Transformation",
  "description": "Replace traditional ticketing with conversational support interface",
  "owner": "Product Manager",
  "start_date": "01-02-2025",
  "target_date": "30-09-2026",
  "budget_cents": 15000000,           // $150,000
  "status": "planning",               // Enum: "planning"|"active"|"completed"|"cancelled"
  "github_label": "initiative:tickets-to-conversations", // For work integration
  "projects": []                      // Array of Project IDs linked to this initiative
}
```

### Field Validation Examples

#### Valid Date Examples
```javascript
"01-01-2025"    // Standard date
"29-02-2024"    // Leap year February 29th
"31-12-2025"    // Year end
"15-06-2025"    // Mid-year date
```

#### Invalid Date Examples
```javascript
"2025-01-01"    // ISO format ❌
"01/01/2025"    // US format ❌
"1-1-2025"      // No leading zeros ❌
"32-01-2025"    // Invalid day ❌
"01-13-2025"    // Invalid month ❌
"29-02-2025"    // Invalid leap year ❌
```

#### Budget Scale Examples
```javascript
0              // $0.00 - Valid for concept-design
500000         // $5,000.00 - Small project
2500000        // $25,000.00 - Medium project  
10000000       // $100,000.00 - Large project
```

### Status Gate Requirements

#### Status Transition Rules
1. **concept-design → solution-design**: Requires `budget_cents > 0`
2. **solution-design → engineering**: Requires `tasks.length > 0`
3. **engineering → uat**: Requires `forecasts.length > 0`
4. **uat → release**: Requires all tasks have `status === "completed"`

#### Example Status Gate Validation
```javascript
// Attempting to move to 'solution-design' with zero budget
{
  "status": "solution-design",
  "budget_cents": 0  // ❌ Fails: "Cannot enter solution-design without budget"
}

// Attempting to move to 'engineering' without tasks
{
  "status": "engineering",
  "tasks": []  // ❌ Fails: "Cannot enter engineering without tasks"
}

// Attempting to move to 'release' with incomplete tasks
{
  "status": "release",
  "tasks": [
    {"status": "completed"},
    {"status": "in-progress"}  // ❌ Fails: "Cannot enter release with incomplete tasks"
  ]
}
```

---

## Core Modules Implementation

### 1. DateUtils Module

**File**: `src/js/date-utils.js`

**Purpose**: Centralized NZ date handling for validation, parsing, formatting, and arithmetic.

```javascript
export default class DateUtils {
  static isValidNZ(dateStr) {
    // Regex: DD-MM-YYYY format
    const regex = /^([0-2]\d|3[01])-(0\d|1[0-2])-\d{4}$/;
    if (!regex.test(dateStr)) return false;
    
    // Validate actual calendar date
    const [day, month, year] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  }

  static parseNZ(dateStr) {
    if (!this.isValidNZ(dateStr)) {
      throw new Error(`Invalid NZ date format (expected DD-MM-YYYY): ${dateStr}`);
    }
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  static formatNZ(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static compareNZ(dateA, dateB) {
    const a = this.parseNZ(dateA);
    const b = this.parseNZ(dateB);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  static addDaysNZ(dateStr, days) {
    const date = this.parseNZ(dateStr);
    date.setDate(date.getDate() + days);
    return this.formatNZ(date);
  }
}
```

**Test Cases**:
```javascript
describe('DateUtils', () => {
  test('validates correct NZ date format', () => {
    expect(DateUtils.isValidNZ('01-01-2025')).toBe(true);
    expect(DateUtils.isValidNZ('29-02-2024')).toBe(true); // leap year
  });

  test('rejects invalid formats', () => {
    expect(DateUtils.isValidNZ('2025-01-01')).toBe(false); // ISO
    expect(DateUtils.isValidNZ('32-01-2025')).toBe(false); // invalid day
    expect(DateUtils.isValidNZ('29-02-2025')).toBe(false); // non-leap year
  });

  test('date arithmetic works correctly', () => {
    expect(DateUtils.addDaysNZ('28-02-2024', 1)).toBe('29-02-2024');
    expect(DateUtils.addDaysNZ('31-12-2024', 1)).toBe('01-01-2025');
  });
});
```

### 2. DataPersistenceManager Module

**File**: `src/js/data-persistence-manager.js`

**Purpose**: Manage localStorage operations with backup/restore functionality.

```javascript
export default class DataPersistenceManager {
  constructor(storageKey = "roadmapData", backupPrefix = "roadmapBackup_") {
    this.storageKey = storageKey;
    this.backupPrefix = backupPrefix;
  }

  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  loadData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return this.getEmptyDataStructure();
      
      const parsed = JSON.parse(data);
      return this.validateDataStructure(parsed) ? parsed : this.getEmptyDataStructure();
    } catch (error) {
      console.warn('Corrupt data found, resetting to empty:', error);
      return this.getEmptyDataStructure();
    }
  }

  backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${this.backupPrefix}${timestamp}`;
    const currentData = this.loadData();
    
    try {
      localStorage.setItem(backupKey, JSON.stringify(currentData));
      return backupKey;
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  restore(backupKey) {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error(`Backup not found: ${backupKey}`);
    }
    
    try {
      const data = JSON.parse(backupData);
      this.saveData(data);
    } catch (error) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  listBackups() {
    const keys = Object.keys(localStorage);
    return keys.filter(key => key.startsWith(this.backupPrefix))
              .sort()
              .reverse(); // Most recent first
  }

  getEmptyDataStructure() {
    return {
      projects: [],
      visions: [],
      goals: [],
      initiatives: [],
      resources: [],
      workIntegrationConfig: {}
    };
  }

  validateDataStructure(data) {
    return data && 
           Array.isArray(data.projects) &&
           Array.isArray(data.visions || []) &&
           Array.isArray(data.goals || []) &&
           Array.isArray(data.initiatives || []);
  }
}
```

### 3. ProjectManager Module

**File**: `src/js/project-manager.js`

**Purpose**: Core project CRUD operations with status gate enforcement.

```javascript
import DateUtils from './date-utils.js';

export default class ProjectManager {
  constructor(dataPersistenceManager) {
    this.dataPM = dataPersistenceManager;
  }

  createProject(projectData) {
    this._validateProject(projectData, false);
    
    const project = {
      id: projectData.id || this._generateId(),
      title: projectData.title,
      description: projectData.description || '',
      lane: projectData.lane || 'other',
      start_date: projectData.start_date,
      end_date: projectData.end_date,
      status: projectData.status || 'concept-design',
      pm_name: projectData.pm_name || '',
      budget_cents: projectData.budget_cents,
      financial_treatment: projectData.financial_treatment,
      initiative_id: projectData.initiative_id || null,
      tasks: projectData.tasks || [],
      resources: projectData.resources || [],
      forecasts: projectData.forecasts || []
    };

    const data = this.dataPM.loadData();
    data.projects.push(project);
    this.dataPM.saveData(data);
    
    return project;
  }

  getProject(id) {
    const data = this.dataPM.loadData();
    return data.projects.find(p => p.id === id) || null;
  }

  updateProject(id, updates) {
    const data = this.dataPM.loadData();
    const projectIndex = data.projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      throw new Error(`Project not found: ${id}`);
    }

    const existingProject = data.projects[projectIndex];
    const updatedProject = { ...existingProject, ...updates, id }; // Prevent ID change
    
    this._validateProject(updatedProject, true);
    this._validateStatusTransition(existingProject, updatedProject);
    
    data.projects[projectIndex] = updatedProject;
    this.dataPM.saveData(data);
    
    return updatedProject;
  }

  deleteProject(id) {
    const data = this.dataPM.loadData();
    const originalLength = data.projects.length;
    data.projects = data.projects.filter(p => p.id !== id);
    
    if (data.projects.length === originalLength) {
      return false; // Project not found
    }
    
    this.dataPM.saveData(data);
    return true;
  }

  listProjects() {
    const data = this.dataPM.loadData();
    return [...data.projects]; // Return copy to prevent accidental mutation
  }

  _validateProject(projectData, isUpdate = false) {
    // Required fields validation
    const requiredFields = ['title', 'start_date', 'end_date', 'budget_cents', 'financial_treatment'];
    for (const field of requiredFields) {
      if (projectData[field] === undefined || projectData[field] === null || projectData[field] === '') {
        throw new Error(`Project ${field} is required`);
      }
    }

    // Date format validation
    if (!DateUtils.isValidNZ(projectData.start_date)) {
      throw new Error(`Invalid start_date format: ${projectData.start_date}`);
    }
    if (!DateUtils.isValidNZ(projectData.end_date)) {
      throw new Error(`Invalid end_date format: ${projectData.end_date}`);
    }

    // End date after start date
    if (DateUtils.compareNZ(projectData.end_date, projectData.start_date) <= 0) {
      throw new Error('Project end_date must be after start_date');
    }

    // Budget validation
    if (typeof projectData.budget_cents !== 'number' || projectData.budget_cents < 0) {
      throw new Error('Project budget_cents must be >= 0');
    }

    // Financial treatment validation
    const validTreatments = ['CAPEX', 'OPEX', 'MIXED'];
    if (!validTreatments.includes(projectData.financial_treatment)) {
      throw new Error(`Invalid financial_treatment. Must be one of: ${validTreatments.join(', ')}`);
    }

    // Lane validation (if provided)
    if (projectData.lane) {
      const validLanes = ['office365', 'euc', 'compliance', 'other'];
      if (!validLanes.includes(projectData.lane)) {
        throw new Error(`Invalid lane. Must be one of: ${validLanes.join(', ')}`);
      }
    }

    // Status validation (if provided)
    if (projectData.status) {
      const validStatuses = ['concept-design', 'solution-design', 'engineering', 'uat', 'release'];
      if (!validStatuses.includes(projectData.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Unique ID validation for new projects
    if (!isUpdate && projectData.id) {
      const existing = this.getProject(projectData.id);
      if (existing) {
        throw new Error(`Project id already exists: ${projectData.id}`);
      }
    }
  }

  _validateStatusTransition(oldProject, newProject) {
    if (oldProject.status === newProject.status) return; // No status change

    // Status gate validations
    switch (newProject.status) {
      case 'solution-design':
        if (newProject.budget_cents <= 0) {
          throw new Error('Cannot enter solution-design without budget');
        }
        break;
        
      case 'engineering':
        if (!newProject.tasks || newProject.tasks.length === 0) {
          throw new Error('Cannot enter engineering without tasks');
        }
        break;
        
      case 'uat':
        if (!newProject.forecasts || newProject.forecasts.length === 0) {
          throw new Error('Cannot enter uat without forecast');
        }
        break;
        
      case 'release':
        if (!newProject.tasks || newProject.tasks.length === 0) {
          throw new Error('Cannot enter release without tasks');
        }
        const incompleteTasks = newProject.tasks.filter(task => task.status !== 'completed');
        if (incompleteTasks.length > 0) {
          throw new Error('Cannot enter release with incomplete tasks');
        }
        break;
    }
  }

  _generateId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `proj-${timestamp}-${random}`;
  }
}
```

**Test Examples**:
```javascript
describe('ProjectManager', () => {
  let projectManager;
  let mockDataPM;

  beforeEach(() => {
    mockDataPM = {
      loadData: jest.fn(() => ({ projects: [] })),
      saveData: jest.fn()
    };
    projectManager = new ProjectManager(mockDataPM);
  });

  test('creates project with valid data', () => {
    const projectData = {
      title: 'Test Project',
      start_date: '01-01-2025',
      end_date: '30-06-2025',
      budget_cents: 1000000,
      financial_treatment: 'CAPEX'
    };

    const result = projectManager.createProject(projectData);
    
    expect(result).toMatchObject(projectData);
    expect(result.id).toBeDefined();
    expect(result.status).toBe('concept-design');
  });

  test('prevents status transition without meeting gate requirements', () => {
    const project = {
      id: 'test-001',
      title: 'Test Project',
      start_date: '01-01-2025',
      end_date: '30-06-2025',
      budget_cents: 0,
      financial_treatment: 'CAPEX',
      status: 'concept-design'
    };

    expect(() => {
      projectManager.updateProject('test-001', { status: 'solution-design' });
    }).toThrow('Cannot enter solution-design without budget');
  });
});
```

<function_calls>
<invoke name="mark_todo_as_done">
<parameter name="todo_ids">["1aefb108-9380-4664-aa24-cf9f4453600d"]