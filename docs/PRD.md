Roadmap Tool — PRD (Greenfield, Junior-Ready)

Goal: Browser-only roadmap app (projects, tasks, resources, financials, forecasting) with localStorage and CSV import/export.
Stack: ES6 modules, HTML, CSS.
Tests: Jest (unit) + Playwright (UI).
Dates: NZ format DD-MM-YYYY for input, storage, display, CSV, tests.
Money: integers in cents (NZD) for storage; format on display.

0) Project Skeleton (create first)
roadmap-tool/
├── docs/
│   └── PRD.md
├── src/
│   ├── index.html                 # Timeline/Gantt
│   ├── project-details.html       # Project CRUD + tabs
│   ├── launchpad.html             # Entry hub
│   ├── styles/
│   │   └── main.css
│   └── js/
│       ├── app.js                 # DI/bootstrap + window.prdIntegration
│       ├── date-utils.js          # NZ date helper (DD-MM-YYYY)
│       ├── data-persistence-manager.js
│       ├── project-manager.js
│       ├── task-manager.js
│       ├── resource-manager.js
│       ├── financial-manager.js
│       ├── forecasting-engine.js
│       ├── csv-manager.js
│       ├── form-validation.js
│       ├── drag-drop-manager.js
│       ├── lineage-validator.js
│       └── prd-integration.js
└── tests/
    ├── fixtures/
    │   ├── seed.json
    │   ├── sample_simple.csv
    │   ├── sample_full.csv
    │   └── invalid.csv
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
    │   └── prd-integration.test.js
    └── e2e/
        └── ui.test.js

Bootstrap
npm init -y
npm i -D jest @playwright/test eslint
npx playwright install


package.json scripts:

"scripts": {
  "dev": "python -m http.server 8000",
  "test": "jest --coverage",
  "e2e": "playwright test"
}

Coding Standards

ES6 modules.

Dates: DD-MM-YYYY only.

Currency: cents (integers).

Errors: throw new Error("Readable message").

ESLint: eslint:recommended (no unused vars, no-undef).

1) Fixtures (golden)

tests/fixtures/seed.json (sample)

{
  "projects": [
    {
      "id": "proj-001",
      "title": "Project Alpha",
      "description": "Test project",
      "lane": "office365",
      "start_date": "01-01-2025",
      "end_date": "30-06-2025",
      "status": "concept-design",
      "pm_name": "Alice Example",
      "budget_cents": 10000000,
      "financial_treatment": "CAPEX",
      "tasks": [
        {
          "id": "task-001",
          "project_id": "proj-001",
          "title": "Kickoff",
          "start_date": "01-01-2025",
          "end_date": "05-01-2025",
          "effort_hours": 8,
          "status": "completed",
          "assigned_resources": []
        }
      ],
      "resources": [],
      "forecasts": []
    }
  ]
}


tests/fixtures/sample_simple.csv

Title,Description,Start Date,End Date,State,Technology Stack
Project Alpha,Test project,15-01-2025,30-06-2025,concept design,office365


tests/fixtures/sample_full.csv

project_number,id,title,description,lane,start_date,end_date,status,dependencies,pm_name,project_code,financial_treatment,budget_cents,tasks,resources,forecasts
P001,proj-1,Project Alpha,Test project,office365,15-01-2025,30-06-2025,concept-design,,John Doe,ALPHA001,CAPEX,15000000,[],[],[]


tests/fixtures/invalid.csv

Contains ISO dates like 2025-01-15 and impossible dates like 31-11-2025.

2) UI Wireframes & DOM IDs

launchpad.html

Buttons: #btn-roadmap, #btn-details, #btn-table

project-details.html

Inputs:

#input-title, #input-start-date (placeholder DD-MM-YYYY),

#input-end-date (placeholder DD-MM-YYYY),

#input-budget (cents or dollars → convert to cents in code),

#select-financial-treatment

Buttons: #btn-save-project, #btn-delete-project, #btn-forecast, #btn-approve

Error spans (inline): #err-title, #err-start-date, #err-end-date, #err-budget, #err-treatment

index.html

Timeline container: #timeline-container

Project bar: .project-bar[data-id="proj-..."]

3) DateUtils (NZ format everywhere)

File: src/js/date-utils.js
Purpose: single source of truth for date validation, parsing, formatting, comparison, arithmetic.

API (required):

export default class DateUtils {
  static isValidNZ(dateStr /* string */) -> boolean
  static parseNZ(dateStr /* string */) -> Date           // throws on invalid
  static formatNZ(date /* Date */) -> string             // DD-MM-YYYY
  static compareNZ(a /* string */, b /* string */) -> -1|0|1
  static addDaysNZ(dateStr /* string */, days /* number */) -> string
}


Validation

Regex: ^([0-2]\d|3[01])-(0\d|1[0-2])-\d{4}$

Reject impossible dates via Date.

Errors

Invalid NZ date format (expected DD-MM-YYYY): ${value}

Invalid calendar date: ${value}

Unit plan: tests/unit/date-utils.test.js

Valid/invalid formats, leap years, addDays, compare.

STEP-BY-STEP IMPLEMENTATION (12 Modules)
1) DataPersistenceManager

File: data-persistence-manager.js
Purpose: Save/load/backup/restore projects array.

API

export default class DataPersistenceManager {
  constructor(storageKey = "projectsData", backupPrefix = "projectsDataBackup_") {}
  saveProjects(projects /* Array */) -> void
  loadProjects() -> Array                      // returns [] if empty/corrupt
  backupProjects() -> string                   // returns backup key
  restoreProjects(backupKey /* string */) -> void
  listBackups() -> Array<string>
}


Errors

Backup not found: ${backupKey}

Edge

Corrupt JSON → log warning; return [].

Done

Round-trip save/load OK; backup key timestamped; restore replaces current.

Tests: data-persistence-manager.test.js (save/load/backup/restore/missing key).

2) ProjectManager

File: project-manager.js
Purpose: CRUD + lifecycle gates; persists via DataPM.

Data (project)

{
  id: string, title: string, description?: string,
  lane?: "office365"|"euc"|"compliance"|"other",
  start_date: "DD-MM-YYYY", end_date: "DD-MM-YYYY",
  status: "concept-design"|"solution-design"|"engineering"|"uat"|"release",
  pm_name?: string,
  budget_cents: number,
  financial_treatment: "CAPEX"|"OPEX"|"MIXED",
  tasks: Array, resources: Array, forecasts: Array
}


API

export default class ProjectManager {
  constructor(dataPM /* DataPersistenceManager */) {}
  createProject(projectData /* Object */) -> Object
  getProject(id /* string */) -> Object|null
  updateProject(id /* string */, updates /* Object */) -> Object
  deleteProject(id /* string */) -> boolean
  listProjects() -> Array
  _validateProject(pd /* Object */, isUpdate=false) -> void
}


Validation & Gates (use DateUtils for dates)

Required: title, start_date, end_date, budget_cents, financial_treatment
→ Project ${field} is required

end_date after start_date
→ Project end_date must be after start_date

budget_cents >= 0
→ Project budget_cents must be >= 0

Unique id on create
→ Project id already exists: ${id}

Status gate errors (on update to specific status)

→ solution-design requires budget_cents > 0
Cannot enter solution-design without budget

→ engineering requires tasks.length > 0
Cannot enter engineering without tasks

→ uat requires forecasts.length > 0
Cannot enter uat without forecast

→ release requires all tasks status==="completed"
Cannot enter release with incomplete tasks

Done

CRUD persists; gates enforced.

Tests: project-manager.test.js (create, required, dates, duplicate, gate failures).

3) TaskManager

File: task-manager.js
Purpose: Task CRUD; anchored to project; progress roll-up.

Data (task)

{
  id: string, project_id: string, title: string,
  start_date: "DD-MM-YYYY", end_date: "DD-MM-YYYY",
  effort_hours: number,
  status: "planned"|"in-progress"|"blocked"|"completed",
  assigned_resources: string[]
}


API

export default class TaskManager {
  constructor(projectManager /* ProjectManager */) {}
  createTask(projectId /* string */, taskData /* Object */) -> Object
  updateTask(taskId /* string */, updates /* Object */) -> Object
  deleteTask(taskId /* string */) -> boolean
  getTask(taskId /* string */) -> Object|null
  getProjectTasks(projectId /* string */) -> Array
  calculateProjectProgress(projectId /* string */)
    -> { progress:number, total_hours:number, completed_hours:number }
  _validateTask(projectId, td /* Object */, isUpdate=false) -> void
}


Validation (DateUtils)

Must anchor to existing project
Tasks must be anchored to a project

Required: title, start_date, end_date, effort_hours
Task ${field} is required

end_date after start_date
Task end_date must be after start_date

effort_hours >= 0 (coerce string to number)

Edge

Forbid changing project_id on update
Cannot change task project association

Progress

completed_hours = sum(effort_hours for completed)

progress = floor( completed_hours / total_hours * 100 )

Done

Roll-up correct for mixed statuses.

Tests: task-manager.test.js (anchor, dates, progress, project_id immutability).

4) ResourceManager

File: resource-manager.js
Purpose: Resource CRUD; allocations; utilization; overallocation warnings.

Data (resource)

{
  id: string, name: string, role: string,
  cost_rate_per_hour_cents: number,
  skills?: string[], capacity_percentage: number, // 1..100
  active: boolean                                // default true
}


Data (allocation)

{
  id: string, resource_id: string, task_id: string, project_id: string,
  allocation_percentage: number,                 // 1..100
  start_date: "DD-MM-YYYY", end_date: "DD-MM-YYYY"
}


API

export default class ResourceManager {
  constructor(taskManager /* TaskManager */) {}
  createResource(data /* Object */) -> Object
  updateResource(id /* string */, updates /* Object */) -> Object
  deleteResource(id /* string */) -> boolean

  allocateResourceToTask(resourceId /* string */, taskId /* string */,
                         allocationPct /* number=100 */,
                         startDate /* string? */, endDate /* string? */) -> Object
  deallocate(allocationId /* string */) -> boolean

  getResource(id /* string */) -> Object|null
  getResourceAllocations(resourceId /* string */) -> Array
  getProjectResourceAllocations(projectId /* string */) -> Array

  checkResourceOverallocation(resourceId /* string */,
                              start /* string|Date */,
                              end /* string|Date */,
                              newAllocPct /* number */,
                              excludeTaskId /* string? */)
    -> { isOverallocated:boolean, total_allocation:number, max_capacity:number,
         overallocation_percentage:number, current_allocation:number,
         overlapping_allocations:Array }

  calculateResourceUtilization(resourceId /* string */,
                               start /* string|Date */,
                               end /* string|Date */)
    -> { resource_id:string, period_days:number,
         allocated_days:number, utilization_percentage:number,
         is_underutilized:boolean, is_overutilized:boolean }
}


Validation & Errors

Resource required: name, role, cost_rate_per_hour_cents, capacity_percentage

Resource ${field} is required

Cost rate per hour must be greater than 0

Capacity percentage must be between 1 and 100

Allocation:

Resource exists & active; Task exists
Resource ${id} is inactive / Task ${taskId} not found

Percentage in 1..100
Allocation percentage must be between 1 and 100

Dates default to task dates (NZ format)

Edge

Overallocation → warn (console), still allocate.

Ensure task’s assigned_resources contains resource id once.

Done

Utilization math correct; allocate/deallocate consistent.

Tests: resource-manager.test.js (create, allocate, overallocation warn, utilization windows, deletion).

5) FinancialManager

File: financial-manager.js
Purpose: Budget baseline, actuals from allocations, variance.

Assumptions

Task chargeable hours per resource = effort_hours * (allocation% / 100).

Actual cost resource = chargeable hours × cost_rate_per_hour_cents.

API

export default class FinancialManager {
  constructor(projectManager, resourceManager, taskManager) {}

  getProjectBudget(projectId /* string */)
    -> { budget_cents:number, financial_treatment:string }

  setProjectBudget(projectId /* string */, budget_cents /* number */,
                   treatment /* "CAPEX"|"OPEX"|"MIXED" */)
    -> { budget_cents:number, financial_treatment:string }

  calculateTaskActualCostCents(taskId /* string */) -> number

  calculateProjectActualCosts(projectId /* string */)
    -> { total_actual_cents:number,
         by_task:Array<{task_id:string, actual_cents:number}>,
         by_resource:Array<{resource_id:string, actual_cents:number}> }

  calculateVariance(projectId /* string */)
    -> { budget_cents:number, actual_cents:number, variance_cents:number }
}


Errors

Project ${projectId} not found

Budget must be >= 0

Edge

No allocations → 0 cost; zero rates → 0 contribution.

Done

Variance correct.

Tests: financial-manager.test.js (set/get, task cost, project variance, zero cases).

6) ForecastingEngine

File: forecasting-engine.js
Purpose: Delivery/resource/cost projections; scenarios; confidence.

Heuristics (simple, deterministic)

Remaining hours = sum(effort_hours of non-completed tasks).

Daily capacity (hours) = sum over active resources likely available for remaining tasks: 8 * (capacity%/100).
(Accept an approximate model; we just need consistent outputs for tests.)

ETA days = ceil(remaining_hours / max(1, daily_capacity)).

eta_end_date = DateUtils.addDaysNZ(todayNZ, ETA).

API

export default class ForecastingEngine {
  constructor(projectManager, taskManager, resourceManager, financialManager) {}

  createProjectForecast(projectId /* string */)
    -> {
      project_id:string,
      forecast_date:string, // DD-MM-YYYY (today)
      delivery:{ estimated_days:number, eta_end_date:string },
      resources:{ capacity_hours_per_day:number, risk_overallocation:boolean },
      costs:{ projected_cents:number, actual_cents:number, remaining_cents:number },
      scenarios:{
        baseline:Object,
        scope_reduction_20:Object,
        scope_increase_15:Object,
        key_resource_unavailable:Object
      },
      confidence_rating:0|1|2|3|4|5,
      warnings:string[],
      recommendations:string[]
    }
}


Errors

Project ${id} not found

Cannot forecast: no tasks

Edge

Zero capacity → warn; very large ETA; confidence low.

Done

Scenarios differ; returns NZ date strings.

Tests: forecasting-engine.test.js (baseline, no tasks, zero capacity warning, scenarios vary).

7) CSVManager

File: csv-manager.js
Purpose: CSV import/export; format detection; round-trip safety.

Formats

simple: Title,Description,Start Date,End Date,State,Technology Stack

full: project_number,id,title,description,lane,start_date,end_date,status,dependencies,pm_name,project_code,financial_treatment,budget_cents,tasks,resources,forecasts

API

export default class CSVManager {
  constructor() {}
  detectFormat(text /* string */) -> "simple"|"full"
  parseCSV(text /* string */)
    -> { projects:Array, errors:Array<{row:number,msg:string}>, warnings:Array<string> }
  exportToCSV(projects /* Array */, format /* "simple"|"full"="full" */) -> string
  generateTemplate(format /* "simple"|"full" */) -> string
  downloadCSV(csv /* string */, filename /* string */) -> void
}


Validation & Errors

Expect DD-MM-YYYY.

Optional compatibility: accept ISO YYYY-MM-DD → convert to NZ; add warning:
Imported non-NZ date; converted to DD-MM-YYYY at row ${n}

Missing fields → Row ${n}: missing ${field}

Invalid date → Row ${n}: invalid date ${field}

Edge

Partial import allowed; errors array populated.

Done

Full export→import round-trip preserves data.

Simple format import produces minimal valid projects.

Tests: csv-manager.test.js (detect, import simple/full, round-trip full, invalid rows, ISO→NZ warning case).

8) Launchpad & app.js

Files: launchpad.html, js/app.js
Purpose: Entry hub; DI singletons; expose window.prdIntegration.

app.js (required pattern)

import DateUtils from "./date-utils.js";
import DataPM from "./data-persistence-manager.js";
import ProjectManager from "./project-manager.js";
import TaskManager from "./task-manager.js";
import ResourceManager from "./resource-manager.js";
import FinancialManager from "./financial-manager.js";
import ForecastingEngine from "./forecasting-engine.js";
import CSVManager from "./csv-manager.js";
import PRDIntegration from "./prd-integration.js";

const dataPM = new DataPM();
const projectManager = new ProjectManager(dataPM);
const taskManager = new TaskManager(projectManager);
const resourceManager = new ResourceManager(taskManager);
const financialManager = new FinancialManager(projectManager, resourceManager, taskManager);
const forecastingEngine = new ForecastingEngine(projectManager, taskManager, resourceManager, financialManager);
const csvManager = new CSVManager();

const prdIntegration = new PRDIntegration({
  dataPM, projectManager, taskManager, resourceManager, financialManager, forecastingEngine, csvManager
});

window.prdIntegration = prdIntegration;


Done

Buttons open correct pages; window.prdIntegration exists.

E2E: e2e/ui.test.js checks launchpad buttons, basic navigation.

9) FormValidation

File: form-validation.js
Purpose: Client-side field validation; return {valid, errors}.

API

export default class FormValidation {
  static validateProjectForm(fields /* {title,start_date,end_date,budget_cents,financial_treatment} */)
    -> { valid:boolean, errors:Object }
  static validateTaskForm(fields /* {title,start_date,end_date,effort_hours} */)
    -> { valid, errors }
  static validateResourceForm(fields /* {name,role,cost_rate_per_hour_cents,capacity_percentage} */)
    -> { valid, errors }
}


Rules (reuse manager messages)

Project: requireds; NZ date check via DateUtils; end>start; budget>=0.

Task: requireds; NZ date; end>start; effort>=0.

Resource: requireds; cost>0; capacity in 1..100.

Done

Invalid submit blocked; errors shown in #err-* spans.

Tests: form-validation.test.js (project requireds, task date logic, resource capacity bounds).

10) DragDropManager (Timeline)

File: drag-drop-manager.js
Purpose: Render simple Gantt; drag move/resize; persist dates.

DOM

Container #timeline-container

Bars .project-bar[data-id="..."]

API

export default class DragDropManager {
  constructor(projectManager /* ProjectManager */) {}
  mount(containerEl /* HTMLElement */) -> void
  render(projects /* Array */) -> void
  onChange(callback /* (project)=>void */) -> void
}


Behaviour

Drag bar → shift start_date & end_date equally (use DateUtils.addDaysNZ).

Resize edges → change only one date; enforce end>start or revert.

Snap to days; use DateUtils.formatNZ for updates.

Persist via ProjectManager.updateProject(...).

Done

Drag/resizes update/persist NZ dates; no console errors.

E2E: ui.test.js simulates drag and asserts date change in DOM.

11) LineageValidator

File: lineage-validator.js
Purpose: Enforce PRD lineage; light auto-fix.

Rules

Every task has valid project_id.

Every allocation references valid resource and task.

Costs trace: allocations → tasks → project budget present.

Valid financial_treatment.

Forecast required before uat/release.

Lifecycle consistency (warn if illogical mixes).

API

export default class LineageValidator {
  constructor(pm /* ProjectManager */, tm /* TaskManager */, rm /* ResourceManager */, fm /* FinancialManager */, fe /* ForecastingEngine */) {}
  validateAll()
    -> { ok:boolean, errors:Array<{code:string,msg:string,entityId?:string}>, warnings:Array<string> }
  autoFix(projectId /* string */)
    -> { fixed:number, remaining:number, warnings:Array<string> }
}


Error examples

Task ${taskId} missing valid project

Allocation ${allocId} references unknown ${kind}: ${id}

Project ${projectId} missing budget

Project ${projectId} requires forecast before uat/release

Done

Report structured; autofix fills trivial empties.

Tests: lineage-validator.test.js (invalid task project, missing forecast, autofix trivial).

12) PRDIntegration (Orchestrator)

File: prd-integration.js
Purpose: High-level operations; enforce gates; CSV/backup flows.

API

export default class PRDIntegration {
  constructor(deps /* {dataPM, projectManager, taskManager, resourceManager, financialManager, forecastingEngine, csvManager} */) {}

  seed(data /* {projects:Array} */) -> void

  createProjectWithTasks(projectData /* Object */, tasks /* Array */)
    -> { project:Object, tasks:Array }

  approveProject(projectId /* string */)
    -> { ok:boolean, errors?:Array<{msg:string,code?:string}> }

  runForecast(projectId /* string */) -> Object

  exportCSV(format /* "simple"|"full" */="full") -> string
  importCSV(text /* string */)
    -> { imported:number, errors:Array<{row?:number,msg:string}>, warnings:Array<string> }

  backup() -> string
  restore(key /* string */) -> void
}


Behaviour

approveProject: validate lineage & gates; if ok, advance status (e.g., concept→solution, solution→engineering, etc.); otherwise return errors.

CSV delegates to CSVManager; persistence via DataPM.

Done

window.prdIntegration created in app.js; end-to-end flows work.

Tests: prd-integration.test.js (seed+create+approve, CSV round-trip, backup/restore).

Edge-Case Matrix (minimum)
Area	Case	Expected
Dates	Wrong format 2025-01-15	Import: warn+convert (if enabled). UI/Managers: reject with Invalid NZ date format (expected DD-MM-YYYY): 2025-01-15
Dates	Impossible 31-11-2025	Reject: Invalid calendar date: 31-11-2025
Dates	end == start	Reject: “must be after”
Leap	28-02-2024 + 1 day	29-02-2024 valid
Budget	Negative	Project budget_cents must be >= 0
Resource	capacity 0 or 101	Capacity percentage must be between 1 and 100
Allocation	0% / 101%	Allocation percentage must be between 1 and 100
Persistence	Corrupt JSON	Reset to [] with console warning
Forecast	No tasks/resources	Error or warnings; large ETA
Gates	Release with incomplete tasks	Block with gate message
Definition of Done (per step)

All unit tests green (npm test).

If UI step: Playwright tests pass (npm run e2e).

No console errors on page load.

ESLint clean.

docs/PRD.md updated if contract changes.