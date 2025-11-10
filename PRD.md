# Roadmap-Electron Product Requirements Document (PRD)

## Executive Summary

Roadmap-Electron is an Electron-based desktop application for managing project roadmaps, timelines, and dependencies. The application provides a comprehensive view of projects across multiple lanes with status tracking, epic/feature management, and task dependencies.

## Project Overview

### Purpose
Enable project managers and stakeholders to visualize, plan, and track projects across organizational lanes with integrated dependency management and real-time collaboration.

### Key Features
- **Project Roadmap Visualization**: Advanced Gantt chart with drag-and-drop timeline editing
- **Multi-lane Project Organization**: Projects organized by business lanes/streams
- **Project Status Tracking**: Comprehensive status management (planned, in-progress, blocked, done, archived)
- **Task and Dependency Management**: Full dependency tracking (FS, SS, FF, SF) with cycle detection
- **Epic/Feature Hierarchy**: Complete epic and feature configuration with ADO integration
- **Azure DevOps Integration**: 
  - Encrypted PAT token storage with expiry tracking
  - Token expiry warnings (30-day alert window)
  - OAuth 2.0 support (ready)
  - Webhook integration for real-time updates
  - Retry logic with exponential backoff
- **Test Suite Management**: Automated test execution and monitoring
- **Real-time Dashboard with Comprehensive Statistics**:
  - Project counts by status (total, active, completed, planned, blocked, archived)
  - Timeline metrics (starting soon, ending soon, overdue)
  - Budget analytics (total, committed, active, CAPEX/OPEX split)
  - Resource metrics (PM count, projects per PM)
  - Performance metrics (completion rate, average duration)
- **Calendar Management System**:
  - Working days and hours configuration
  - Public holiday tracking with iCal import
  - Monthly and yearly calendar views
  - Work hours calculation for resource planning
- **Settings Management**:
  - Timeline configuration (custom end dates)
  - Theme management (light/dark/system)
  - Persistent database-backed settings
- **Backup & Restore**: Full database backup and restore functionality

## Design System & Styling Architecture

### Unified Stylesheet Approach

**Objective**: Maintain consistency across all modules and pages through a single, comprehensive CSS stylesheet.

#### Why One Stylesheet?
1. **Consistency**: Ensures uniform styling across all components and pages
2. **Maintainability**: Single source of truth for all styles reduces duplication and conflicts
3. **Performance**: One CSS file loads faster than multiple stylesheets
4. **Scalability**: Easier to implement design changes globally
5. **Developer Experience**: Clear organization and CSS variable system for quick reference

#### Single Stylesheet Structure
- **File**: `app/renderer/styles/unified-styles.css`
- **Import Location**: `App.tsx` (root component)
- **Organization**: 
  - CSS Custom Properties (Variables) - Color, spacing, typography, shadows, z-index
  - Reset & Base Styles - HTML, body, common elements
  - Layout Objects - Grid, flexbox, containers
  - Form Objects - Inputs, labels, validation states
  - Button Objects - Various button styles and states
  - Card Objects - Card containers and layouts
  - Table Objects - Table styling
  - Navigation Objects - Navigation components and tabs
  - Status Objects - Badges, indicators, progress bars
  - Modal Objects - Modals, dropdowns
  - Typography Objects - Text utilities
  - Utility Classes - Margin, padding, display, etc.
  - Component-Specific Styles - Dashboard, sidebar, forms
  - Scrollbar Styling - Custom scrollbars
  - Animations - Keyframes and transitions
  - Responsive Design - Media queries
  - Accessibility - Focus states, sr-only classes

### CSS Custom Properties (Variables)

#### Color System
```css
--color-primary: #00A45F (OneNZ Green)
--color-secondary: #646464 (Gray)
--color-success: #00A45F
--color-warning: #FF9500
--color-error: #E74C3C
--color-info: #3498DB
--color-priority-1 to -4: Risk/priority indicators
--color-risk-low/medium/high/critical: Risk levels
```

#### Spacing Scale
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
```

#### Typography
```css
--font-family-sans: System font stack
--font-family-mono: Monospace font stack
--font-size-xs to 4xl: 12px to 36px
--font-weight-normal/medium/semibold/bold: 400-700
--line-height-tight/normal/relaxed: 1.25-1.75
```

#### Layout Dimensions
```css
--sidebar-width: 250px
--header-height: 60px
--content-max-width: 1200px
```

#### Shadows
```css
--shadow-sm/md/lg/xl/2xl: Elevation shadows
--shadow-inner: Inset shadows
```

#### Z-Index Layers
```css
--z-dropdown: 1000
--z-sticky: 1100
--z-fixed: 1200
--z-modal-backdrop: 1300
--z-modal: 1400
--z-popover: 1500
--z-tooltip: 1600
--z-toast: 1700
```

### Class Naming Conventions

#### Component Classes
- Prefixed with component name: `.card`, `.btn`, `.nav-link`, `.form-input`
- Variants use modifiers: `.btn.primary`, `.btn.secondary`, `.card.hover`
- Size variations: `.btn-sm`, `.btn-lg`, `.input-sm`, `.input-lg`

#### Utility Classes
- Display: `.block`, `.hidden`, `.flex`, `.flex-col`, `.flex-row`
- Spacing: `.m-{size}`, `.p-{size}`, `.gap-{size}`
- Alignment: `.justify-center`, `.items-center`, `.flex-wrap`
- Text: `.text-{size}`, `.font-{weight}`, `.text-{color}`
- Colors: `.bg-{color}`, `.text-{color}`, `.border-{color}`
- States: `.hover:`, `.active`, `.disabled`, `.loading`

#### Layout System
- Grid: `.grid`, `.grid-cols-{n}`, `.col-span-{n}`
- Flexbox: `.flex`, `.flex-col`, `.flex-row`, `.flex-1`, `.flex-wrap`
- Responsive: `.app-container`, `.app-main`, `.dashboard-content`, `.info-pane`

### Theme Support

#### Light Theme (Default)
- Background colors from `--bg-primary` to `--bg-quaternary`
- Text colors optimized for light backgrounds
- Border colors for light theme

#### Dark Theme
- Media query: `@media (prefers-color-scheme: dark)`
- Automatically applies dark color palette when system preference is dark

#### Accessibility
- Media query: `@media (prefers-contrast: high)` for high contrast mode
- Media query: `@media (prefers-reduced-motion: reduce)` for reduced animations

## Application Layout

### Three-Column Dashboard Layout
1. **Sidebar** (300px): Navigation menu with modules
2. **Content Area** (flexible): Active module content (Gantt chart, forms, lists)
3. **Info Pane** (320px): Context-aware information panel

### Module Organization
- **Dashboard**: Project roadmap visualization (Gantt chart with timeline controls)
- **Projects**: Project list and management (card and table views with filtering)
- **Quick Task**: Rapid task creation and assignment
- **Epic Features**: Epic and feature management with drag-and-drop ordering and allocation tracking
- **Epic Config**: Default values for epic/feature creation (area paths, iteration paths, templates)
- **Resource Management**: Resource capacity, commitments, allocations, and capacity tracking (NEW)
- **ADO Configuration**: Azure DevOps integration setup and PAT token management
- **Tests**: Test suite creation, execution, and monitoring
- **Calendar**: Working days, holidays, and work hours management
- **Settings**: Application settings and preferences
- **Components**: Reusable component library (future)
- **Services**: Backend services and API integrations (future)
- **Guides**: User documentation and tutorials (future)
- **Documentation**: Technical documentation and API references (future)

## InfoPane - Context-Aware Statistics Panel

### Overview
The InfoPane is a dynamic information panel (320px wide) that displays context-aware statistics and actions based on the active module. It provides real-time insights into project portfolio health and quick access to common actions.

### Dynamic Statistics by Module

#### Dashboard Module Statistics
- **Modules**: Total number of available modules (12)
- **Project Counts**: Total, Active, Completed, Blocked
- **Risk Indicators**: Overdue projects count
- **Timeline Metrics**: 
  - Starting Soon (30d): Projects starting within 30 days
  - Ending Soon (30d): Projects ending within 30 days
- **Performance**: Completion rate percentage
- **Financial**: Total Budget, Committed Budget, CAPEX/OPEX split
- **Resources**: Number of unique project managers

#### Projects Module Statistics (Comprehensive)
**Status Breakdown**:
- Total Projects
- Active (in-progress)
- Completed (done)
- Planned (future projects)
- Blocked (impediments)
- Overdue (past end date, not done)

**Performance Metrics**:
- Completion Rate: Percentage of non-archived projects completed
- Average Duration: Mean duration of completed projects (in days)

**Timeline Risk Indicators**:
- Starting Soon (30d): Planned projects starting within 30 days
- Ending Soon (30d): Active/planned projects ending within 30 days
- Overdue: Projects past their end date that aren't done

**Organization**:
- Unique Lanes: Count of distinct business lanes
- Top Lane: Lane with most projects
- Project Managers: Count of unique PMs
- Avg Projects/PM: Workload distribution metric

**Financial Analytics**:
- Total Budget: Sum of all project budgets
- Committed Budget: Budget for planned + in-progress projects
- Active Budget: Budget for in-progress projects only
- Average Budget: Mean budget per project
- CAPEX Projects: Count and total budget
- OPEX Projects: Count and total budget

### Quick Actions Panel
The InfoPane includes context-sensitive action buttons:
- **⚡ Quick Task**: Rapid task creation
- **🔗 Renew Token**: ADO PAT token renewal (with expiry status)
  - Visual alerts when token expires within 30 days
  - Red warning when token is expired
  - Shows days until expiry
- **🔄 Refresh Module**: Reload current module data
- **📤 Export Data**: Export module data to CSV/JSON

### ADO Token Status Display
When an ADO PAT token is configured, the InfoPane header displays:
- **🔗 ADO Token Status** badge with color-coded alerts:
  - 🟢 **Valid**: More than 30 days until expiry (blue background)
  - 🟡 **Expiring Soon**: 1-30 days until expiry (yellow background)
  - 🔴 **Expired**: Token has expired (red background)
- Exact expiry date or days remaining
- Direct navigation to ADO Configuration when clicked

### Real-Time Updates
All statistics are calculated dynamically using `useMemo` hooks and update automatically when:
- Projects are created, updated, or deleted
- Project status changes
- Module navigation occurs
- Settings are modified

## Component Library

### Core Components
- **DashboardLayout**: Main layout container with 3-column grid
- **NavigationSidebar**: Module navigation menu with 12 modules
- **ContentPane**: Main content area renderer with loading states
- **InfoPane**: Context-aware statistics and actions panel (see detailed section above)
- **GanttChart**: Interactive project timeline visualization with drag-and-drop

### Form Components
- **BaseInput**: Standard text input with validation
- **TextInput, TextAreaInput**: Text field variants
- **SelectInput**: Dropdown/select field
- **DateInput**: Date picker input
- **CurrencyInput**: Currency formatted input

### Layout Components
- **Card**: Reusable card container
- **Modal**: Dialog/modal component
- **FormModal**: Modal with form content
- **ConfirmationModal**: Confirmation dialog

### Status Components
- **StatusBadge**: Status indicator badge
- **ProgressBar**: Progress visualization
- **LoadingSpinner**: Loading state indicator

### Navigation Components
- **Tabs**: Tabbed interface
- **DropdownMenu**: Dropdown menu
- **NavLink**: Navigation link styling

## Styling Maintenance Guidelines

### Adding New Styles
1. Determine component type (layout, form, button, etc.)
2. Add to appropriate section in `unified-styles.css`
3. Use CSS custom properties for colors, spacing, sizes
4. Follow existing naming conventions
5. Include comments for complex rules

### Modifying Existing Styles
1. Search for class/property in unified-styles.css
2. Edit in-place within proper section
3. Test across all affected components
4. Update related variables if needed

### CSS Variables Best Practices
1. Define base variables at `:root` level
2. Use semantic naming: `--color-primary` instead of `--color-green`
3. Create theme variants in media queries
4. Reference variables in components for consistency
5. Avoid inline styles; use CSS classes with variables

### Component Styling Pattern
```css
.component {
  /* Use CSS variables */
  color: var(--text-primary);
  background-color: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: var(--transition-colors);
}

.component:hover {
  background-color: var(--bg-hover);
  border-color: var(--accent-color);
}

.component.variant {
  /* Variant styling */
}
```

## Performance Considerations

### CSS Optimization
- Single stylesheet reduces HTTP requests
- CSS variables enable efficient theme switching
- Animations use GPU-accelerated transforms
- Scrollbar styling optimized for performance

### Loading Strategy
- CSS loaded synchronously in `App.tsx`
- No per-component CSS imports
- Media queries handle responsive breakpoints
- Print styles included for dashboard export

## Responsive Design

### Breakpoints
- **Tablet**: 1024px and below
- **Mobile**: 768px and below
- **Small Mobile**: 480px and below

### Layout Changes
- Info pane hidden on mobile (display: none)
- Form layouts stack to single column
- Navigation becomes compact
- Content area uses full width

## Documentation & Learning Resources

### For Developers
- CSS variables reference in unified-styles.css comments
- Class naming conventions documented in PRD
- Component examples in GANTT-CHART-README.md
- Utility class reference in style comments

### For Designers
- Color palette and spacing scale defined
- Typography scale documented
- Component variants documented
- Responsive breakpoints defined

## Future Enhancements

### Potential Improvements
1. CSS-in-JS migration for component-scoped styles
2. Tailwind CSS integration for rapid prototyping
3. Design tokens export for external tools
4. Style guide/Storybook integration
5. Automated style testing

## New Feature Modules

### Calendar Management System
**Purpose**: Configure working days, holidays, and work hours for accurate project planning.

**Features**:
- **Monthly Calendar View**: Visual calendar showing working days, weekends, and holidays
- **Working Days Configuration**: Set working days per month with weekend exclusions
- **Public Holiday Management**:
  - Manual holiday entry with start/end dates
  - Bulk holiday entry via text input
  - iCal file import for national/regional holidays
  - Recurring holiday support
- **Work Hours Calculation**: Automatic calculation of available work hours per month
- **Notes**: Custom notes per month for planning context

**Database Tables**:
- `calendar_years`: Yearly calendar configuration
- `calendar_months`: Monthly working day data
- `public_holidays`: Holiday definitions with recurrence

### ADO Configuration Management
**Purpose**: Secure integration with Azure DevOps for work item synchronization.

**Features**:
- **Encrypted PAT Token Storage**: Tokens encrypted at rest in database
- **Token Expiry Management**:
  - Expiry date tracking with 30-day warning window
  - Visual alerts in InfoPane
  - Automatic token validation
- **Connection Configuration**:
  - Organization URL and Project Name setup
  - Webhook URL configuration for real-time updates
  - Retry logic with exponential backoff
  - Connection status monitoring
- **OAuth 2.0 Ready**: Infrastructure prepared for OAuth authentication

**Database Tables**:
- `ado_config`: ADO connection configurations
- `ado_tags`: Tag categories and values
- `dependencies_ado`: ADO-specific dependencies
- `ado_webhook_events`: Webhook event processing

### Settings Management
**Purpose**: Persistent application configuration and user preferences.

**Features**:
- **Timeline Configuration**: Custom timeline end dates (default: 2 years from today)
- **Theme Management**:
  - Light/Dark mode toggle
  - System theme preference (follows OS setting)
  - Automatic theme switching based on system preference
- **Database-Backed Settings**: All settings stored in SQLite for persistence
- **Real-time Application**: Settings changes apply immediately
- **localStorage Sync**: Critical settings synced to localStorage for performance

**Database Table**: `app_settings` with key-value storage

### Enhanced Epic/Feature Management
**Purpose**: Comprehensive epic and feature hierarchy with ADO integration and resource allocation tracking.

**Features**:
- **Drag-and-Drop Ordering**: Visual reordering of epics and features
- **Hierarchical Structure**: Epics contain features with proper parent-child relationships
- **ADO Integration**: Synchronized with Azure DevOps work items
- **Rich Metadata**:
  - Business value and time criticality scoring
  - Effort estimation (story points)
  - Area and iteration path assignment
  - Risk assessment and value area categorization
- **Template System**: Default values for rapid creation
- **Resource Allocations View** (`EnhancedEpicFeatureManager.tsx`):
  - **Fourth Tab**: 👥 Allocations (added to existing Epics/Features/Dependencies tabs)
  - **Summary Statistics Cards**:
    - Total Allocations count
    - Total Hours Allocated (sum across all allocations)
    - Actual Hours (sum of time tracked)
    - Variance (allocated vs actual)
  - **Hierarchical Allocation Display**:
    - Grouped by Epic → Feature → Allocations
    - Expandable/collapsible epic sections
    - Allocation details table per feature:
      - Resource name
      - Allocated hours
      - Forecast start/end dates
      - Actual hours
      - Variance (color-coded: green for under, red for over)
      - Status badges (ON-TRACK, AT-RISK, OVER-BUDGET)
  - **Refresh Button**: Manual reload of allocations from database
  - **Auto-Load**: Allocations load automatically when switching to Allocations tab
  - **Integration**: Links to Resource Management module for allocation creation

**Database Tables**:
- `epics`: Epic definitions with ADO metadata
- `features`: Feature definitions linked to epics
- `feature_allocations`: Resource allocations linked to features (displayed in Allocations tab)

### Backup & Restore System
**Purpose**: Data protection and migration capabilities.

**Features**:
- **Full Database Backup**: Complete SQLite database export
- **Selective Restore**: Choose which data to restore
- **Migration Support**: Database schema version management
- **Audit Trail**: Backup and restore operations logged

### Audit Logging
**Purpose**: Comprehensive activity tracking for compliance and debugging.

**Features**:
- **Enhanced Audit Events**: Detailed logging with context:
  - Module and component identification
  - Entity type and ID tracking
  - Session and source tracking
  - Route and action logging
- **Performance Impact**: Minimal overhead with async logging
- **Searchable History**: Indexed for quick queries

**Database Table**: `audit_events` with enhanced metadata columns

## Data Architecture

### Enhanced Database Schema
The application now includes 15+ tables covering:
- **Core Project Data**: projects, tasks, dependencies, epics, features
- **ADO Integration**: ado_config, ado_tags, dependencies_ado, ado_webhook_events
- **Calendar System**: calendar_years, calendar_months, public_holidays
- **System Management**: app_settings, audit_events, initiatives

### Data Validation
- **New Zealand Date Format**: Strict DD-MM-YYYY validation with leap year support
- **Currency Handling**: NZD amounts stored as integer cents for precision
- **Financial Treatment**: CAPEX/OPEX categorization for budget reporting

### Performance Optimizations
- **Indexed Queries**: Strategic indexes for date ranges, foreign keys, and audit searches
- **Connection Pooling**: SQLite WAL mode for concurrent access
- **Foreign Key Constraints**: Data integrity enforcement

## Technical Implementation

### State Management
Using Zustand for efficient state management:
- **Projects, Tasks, Epics, Features**: Full CRUD operations
- **Dependencies**: Complex relationship tracking
- **UI State**: Loading states, error handling, selected items
- **Connection Management**: Solo/Host/Client modes for future collaboration

### Security
- **PAT Token Encryption**: Sensitive tokens encrypted at rest
- **Preload Script**: Secure IPC communication between main and renderer
- **Input Validation**: Server-side validation for all mutations

### Testing Strategy
- **Unit Tests**: NZ validation system with 26+ test cases
- **Integration Tests**: Database operations and API endpoints
- **E2E Testing**: Complete user workflows (Playwright ready)

### Project Coordinator - Financial Tracking & Resource Management
**Purpose**: Comprehensive project financial tracking, resource capacity management, and multi-dimensional variance analysis integrated with ADO and SAP data.

**Core Capabilities**:
- **Multi-Source Data Integration**:
  - Raw Timesheet imports (SAP CATS exports)
  - Raw Actuals imports (SAP FI exports - software, hardware, contractor invoices)
  - Labour Rate management (annual FY rates for CAPEX/OPEX)
  - Financial Resource management (FTE, SOW contractors, External Squads)

- **Resource Capacity Management**:
  - **"I can commit X hours per day/week/fortnight"** model
  - Flexible commitment entry (per-day, per-week, per-fortnight)
  - Capacity calculation based on working days from Calendar module
  - Over-commitment detection and alerts
  - Resource allocation to Features (integrated with existing Epic/Feature hierarchy)

- **ADO Integration for Resource Allocation**:
  - Automatic sync of ADO Feature assignments → Resource allocations
  - ADO `assigned_to` field → Financial Resource mapping via `ado_identity_id`
  - ADO `effort` field → Forecasted hours
  - External squad milestone tracking (ServiceHub, other projects)
  - Milestone lifecycle: Backlog → Design Workshop → Dev → UAT → Defect Resolution → Prod

- **Variance Detection (Adjustable Thresholds)**:
  - **Per-Resource Thresholds**: Customizable variance % for individual resources
  - **Per-Project Thresholds**: Project-specific variance tolerance
  - **Multi-Dimensional Variance**:
    - Commitment vs Actual hours (effort variance)
    - Forecasted vs Actual cost (cost variance based on hours × labour rates)
    - Schedule variance (ADO milestone slippage)
    - Unauthorized time entries (timesheets without feature allocation)
  - **Alert Severity**: Low / Medium / High / Critical with acknowledgement workflow

- **Financial Tracking & P&L**:
  - Project Financial Detail (SAP coding: WBSE, Sentinel #, IO Code, AUC Number)
  - Workstreams (major delivery components with WBSE mapping)
  - Finance Ledger (monthly accruals by WBSE, workstream, expenditure type)
  - Budget vs Forecast vs Actual tracking
  - CAPEX/OPEX split reporting
  - Cost calculation: Timesheets → Hours × Labour Rates → P&L

- **Unauthorized Time Detection**:
  - Validates every timesheet entry against feature allocations
  - Alerts when:
    - Resource submits time but not allocated to any Feature
    - Resource allocated to Feature but submits time to different WBSE
    - Unknown personnel number in timesheets
  - Prevents budget leakage and improves forecast accuracy

- **External Squad Workflow Management**:
  - Track ServiceHub and other external squads (contract_type = 'External Squad')
  - Milestone-based tracking (no timesheets from external squads)
  - Key milestones:
    - Backlog submission date
    - Design workshop scheduled/delivered
    - Development start/target dates
    - UAT target/start/passed dates
    - Defect resolution tracking
    - Production deployment actual vs planned
  - Delay impact analysis on dependent work items
  - Kanban-style visualization: Backlog → Design → Dev → UAT → Prod

**Database Tables** (11 new coordinator tables):
1. `raw_timesheets`: SAP CATS imports with feature linkage
2. `raw_actuals`: SAP FI imports (software, hardware, contractor SOWs)
3. `raw_labour_rates`: Annual FY rates by band (N1-N6 CAP/OPX)
4. `financial_resources`: Resource master (FTE, SOW, External Squad) with ADO identity mapping
5. `resource_commitments`: "I can commit X hours" entries with capacity calculations
6. `feature_allocations`: Resource → Feature allocations with actual vs forecast tracking
7. `financial_workstreams`: Major delivery components with WBSE
8. `project_financial_detail`: SAP coding (WBSE, Sentinel #, IO Code, budgets)
9. `ado_feature_mapping`: Links Roadmap Features → ADO Work Items with milestone cache
10. `variance_thresholds`: Adjustable thresholds per resource/project/global
11. `variance_alerts`: Multi-dimensional alerts with severity and acknowledgement
12. `finance_ledger_entries`: Monthly P&L entries by project/workstream/WBSE

**UI Components**:
1. **Project Detail - Finance Tab**:
   - Financial Summary (WBSE, SAP codes, Budget vs Actual gauge)
   - Resource Allocations table (Allocated | Actual | Variance | Status)
   - Epics & Features forecast tree view with cost rollup
   - Variance Alerts list for project
   - Timesheet Summary by resource

2. **Resource Management Module** (`ResourceManagement.tsx`):
   - **Four-Tab Interface**:
     - 📋 Resources: Master resource list with search and filtering
     - 📅 Commitments: Resource capacity commitment management
     - 🎯 Allocations: Feature allocation creation and editing with project hierarchy
     - 📊 Capacity: Resource capacity overview and utilization tracking
   
   - **Enhanced Allocations Tab**:
     - **Project Hierarchy Integration**: Project → Epic → Feature cascading dropdowns
     - **Calendar Date Pickers**: HTML5 date inputs for Forecast Start/End dates
     - **Quick Stats Panel**:
       - Total Resources count
       - Total Projects count
       - Active Allocations count
       - **Project Timeline Display**: Shows selected project's start/end dates
     - **Editable Allocations Table**:
       - Inline editing with Edit/Save/Cancel buttons
       - Editable fields: Allocated Hours, Forecast Start Date, Forecast End Date
       - Calendar controls for date editing
       - Status badges: ON-TRACK, AT-RISK, OVER-BUDGET
       - Variance tracking (hours and cost)
     - **Create New Allocation Form**:
       - Resource selection with contract type display
       - Project → Epic → Feature cascading dropdowns (auto-populated from database)
       - Allocated hours input
       - Forecast dates with calendar pickers
       - Form validation and disabled states
   
   - **Date Handling**:
     - Internal format: DD-MM-YYYY (database storage)
     - Display format: HTML5 date picker (YYYY-MM-DD)
     - Automatic conversion between formats
     - Helper functions: `convertToISO()`, `convertToDDMMYYYY()`

3. **Resource Capacity Dashboard**:
   - Commitment Entry Panel ("I can commit X hours per [day/week/fortnight]")
   - Capacity Heatmap (Resources × Weeks/Months)
   - Color: Green (under-utilized) → Yellow (optimal) → Red (over-committed)
   - Resource drill-down: Commitment vs Allocated vs Actual charts

3. **Variance Dashboard**:
   - Alert Summary Cards (by severity: Critical/High/Medium/Low)
   - Variance Table (sortable by entity, type, amount, severity)
   - Trend Charts (variance over time by project/resource/workstream)
   - Alert acknowledgement workflow

4. **External Squad Tracker**:
   - Squad Selection Dropdown (External Squad resources)
   - Kanban Board (Backlog → Design → Dev → UAT → Prod)
   - Milestone Timeline (Gantt-style with delay indicators)
   - Work item cards with milestone progress bars

5. **Import Manager**:
   - Drag-Drop CSV Upload (Timesheets | Actuals | Labour Rates)
   - Validation Results table with error reporting
   - Import History with rollback capability

**Service Layer** (`app/main/services/coordinator/`):
- `CoordinatorService.ts`: Main orchestration
- `TimesheetImportService.ts`: CSV parsing, validation, unauthorized detection
- `ActualsImportService.ts`: SAP actuals processing (software, SOWs)
- `ResourceCommitmentService.ts`: Commitment management and capacity calculations
- `AllocationService.ts`: Feature allocation tracking and variance calculation
- `AdoSyncService.ts`: ADO Feature → Resource allocation sync
- `VarianceDetectionService.ts`: Multi-dimensional variance detection
- `FinanceLedgerService.ts`: P&L calculation and monthly accruals
- `ReportingService.ts`: Dashboard data and CSV exports

**Key Business Logic**:
1. **Capacity Calculation**:
   ```
   Per Day: Total Hours = Committed Hours/Day × Working Days in Period
   Per Week: Total Hours = Committed Hours/Week × (Period Days ÷ 7)
   Per Fortnight: Total Hours = Committed Hours/Fortnight × (Period Days ÷ 14)
   Remaining Capacity = Total Available - Allocated
   ```

2. **Effort Variance**:
   ```
   Variance Hours = Actual Hours - Allocated Hours
   Variance % = (Variance Hours / Allocated Hours) × 100
   Cost Variance = Variance Hours × Labour Hourly Rate
   Status: on-track (±10%), at-risk (10-20%), over/under (>20% or custom threshold)
   ```

3. **Unauthorized Timesheet Detection**:
   ```
   1. Find resource by personnel_number
   2. Find project by WBSE in timesheet
   3. Find features for project in timesheet date range
   4. Check if resource has allocation to ANY of those features
   5. Generate 'unauthorized' alert if no allocation found
   ```

4. **External Squad Milestone Sync**:
   ```
   1. Fetch ADO work item via AdoApiService
   2. Extract milestone dates from custom fields/tags
   3. Update ado_feature_mapping cache
   4. Detect slippage: if target date < today and milestone not completed
   5. Create schedule variance alert with severity based on delay days
   6. Analyze impact on dependent work items
   ```

**Configuration & Settings**:
- Global variance thresholds in `app_settings` (default: 20% hours, 20% cost, 7 days schedule)
- Per-resource/per-project threshold overrides in `variance_thresholds` table
- FY calendar integration with existing Calendar module
- ADO sync interval configurable (default: 30 minutes)

**Integration Points**:
1. **Existing Projects → Epics → Features hierarchy**:
   - Feature allocations link to existing `features` table
   - Effort estimates stored in `features.effort` field
   - Project financial detail extends existing `projects` table

2. **ADO Integration via existing `AdoApiService`**:
   - Reuses `ado_config` for connection settings
   - Extends `ado_feature_mapping` for milestone tracking
   - Maps ADO identities to financial_resources via `ado_identity_id`

3. **Calendar Module Integration**:
   - Working days calculation for capacity: uses `calendar_months.working_days`
   - Public holidays excluded from capacity: reads `public_holidays` table
   - FY period calculations: follows `app_settings` FY start/end

4. **Settings Module Integration**:
   - Variance thresholds stored in `app_settings`
   - Theme support for all coordinator UI components
   - Dashboard timeline settings apply to capacity views

**Implementation Phases** (8 weeks):
- **Week 1**: Database schema migration (user_version 6) + TypeScript models
- **Week 2**: CSV import services (Timesheets, Actuals, Labour Rates) + validation
- **Week 3**: Resource commitment & allocation services + basic capacity UI
- **Week 4**: ADO sync service + feature allocation automation
- **Week 5**: Variance detection service + threshold configuration + alerts
- **Week 6**: Finance ledger service + P&L calculation + Project Finance tab
- **Week 7-8**: UI polish (dashboards, squad tracker) + E2E tests + documentation

**Testing Strategy**:
- **Unit Tests**: CSV parsers, variance calculations, capacity logic, ADO sync mapping
- **Integration Tests**: Timesheet import → reconciliation → variance → alerts
- **E2E Tests**: Full workflow from CSV import to variance dashboard acknowledgement

**Performance Optimizations**:
- Strategic indexes on timesheet date ranges, personnel numbers, WBSEs
- Batch processing for large CSV imports (chunk size: 1000 rows)
- Cached labour rates (refreshed on annual import)
- Async variance detection (scheduled background job)
- Incremental ADO sync (only changed work items)

**Documentation**:
- Architecture: `docs/PROJECT_COORDINATOR_ARCHITECTURE.md` (standalone design)
- Integration: `docs/PROJECT_COORDINATOR_INTEGRATION.md` (integration with Roadmap-Electron)
- Sample Data: `C:\Users\smhar\OneDrive\98047 MWP Financial Tracker.xlsx`

### Project Governance - Enterprise Portfolio Management & Compliance
**Purpose**: Comprehensive project governance framework providing portfolio oversight, stage gate management, policy compliance, and executive decision tracking integrated with existing project lifecycle.

**Core Capabilities**:

#### 1. Portfolio Health Monitoring
- **Executive Dashboard**:
  - Portfolio risk score (aggregated from project risks with weighted scoring)
  - Strategic alignment metrics (% of projects aligned to business goals/initiatives)
  - Resource utilization across portfolio (FTE capacity vs demand)
  - Budget utilization vs capacity (CAPEX/OPEX portfolio view)
  - Delivery predictability index (forecast accuracy trend over time)
  - Project velocity (average days to complete gates)
  - Portfolio value realization (benefits tracking)
  
- **Multi-Dimensional Portfolio Views**:
  - By Strategic Initiative (link projects to strategic goals)
  - By Business Lane/Stream
  - By Investment Type (CAPEX/OPEX/BAU)
  - By Risk Profile (Low/Medium/High/Critical)
  - By Stage Gate Position
  - By Project Manager/Sponsor

- **Portfolio Heatmaps**:
  - Risk vs Value matrix
  - Resource demand vs capacity by period
  - Budget burn rate vs forecast
  - Compliance status by policy type

#### 2. Stage Gate Process Management
- **Configurable Gate Framework**:
  - **Pre-defined Gates**: Ideation → Business Case → Design → Build → UAT → Deploy → Post-Implementation Review
  - **Custom Gates**: Define additional gates per project type (e.g., Security Review, Architecture Approval)
  - **Gate Templates**: Reusable gate configurations for project types (Strategic/Tactical/BAU)
  
- **Gate Criteria & Checklist Management**:
  - **Required Documents**: Business case, architecture diagram, test plan, security assessment
  - **Required Approvals**: Sponsor, PMO, Architecture Board, Security Team, Finance
  - **Quality Gates**: Code coverage %, test pass rate, security scan results
  - **Budget Gates**: Budget approval, forecast variance within threshold
  - **Resource Gates**: Team assigned, capacity confirmed
  - **Dependency Gates**: All blocking dependencies resolved
  
- **Gate Review Workflow**:
  - **Scheduled Reviews**: Automatic calendar integration for gate review meetings
  - **Review Outcomes**: Pass / Pass with Conditions / Fail / Defer
  - **Conditional Passage**: Track conditions that must be met post-gate
  - **Gate Hold Reasons**: Document why projects are held at gates
  - **Auto-Progression**: Projects auto-advance when all criteria met (optional)
  - **Escalation Path**: Escalate to governance board for stuck projects

- **Gate Performance Metrics**:
  - Average time at each gate
  - Gate pass/fail rates
  - Most common failure reasons
  - Bottleneck identification

#### 3. Compliance & Policy Management
- **Policy Repository**:
  - **Policy Categories**: Security, Privacy, Architecture, Procurement, HR, Legal, Finance
  - **Policy Definitions**: Policy name, description, owner, applicability rules
  - **Policy Versions**: Track policy changes over time
  - **Effective Dates**: Policy start/end dates, grace periods
  
- **Compliance Tracking**:
  - **Project-Level Compliance**: Track compliance per policy per project
  - **Compliance Status**: Not Started / In Progress / Compliant / Non-Compliant / Exempt / Waived
  - **Evidence Management**: Link to compliance evidence documents (stored externally, reference only)
  - **Due Dates**: Compliance deadline tracking with alerts
  - **Remediation Plans**: Track actions to achieve compliance
  - **Compliance History**: Audit trail of compliance status changes
  
- **Waiver Management**:
  - **Waiver Requests**: Request policy exemptions with justification
  - **Waiver Approvals**: Track approver chain and decision
  - **Waiver Expiry**: Time-bound waivers with auto-expiry
  - **Waiver Conditions**: Conditions that must be met for waiver to remain valid
  
- **Compliance Dashboards**:
  - Portfolio compliance score by policy category
  - Projects with overdue compliance items
  - Non-compliance risk assessment
  - Waiver usage trends

#### 4. Decision Log & Governance Actions
- **Decision Tracking**:
  - **Decision Record**: Decision title, description, context, rationale
  - **Decision Metadata**: Date, decision maker(s), decision type (Strategic/Tactical/Operational)
  - **Impact Assessment**: Projects affected, budget impact, timeline impact, resource impact
  - **Decision Status**: Proposed / Approved / Rejected / Deferred / Reversed
  - **Implementation Tracking**: Link decisions to action items
  - **Decision Dependencies**: Track decisions that depend on other decisions
  
- **Governance Actions (Action Items)**:
  - **Action Definition**: Description, owner, due date, priority
  - **Action Source**: Linked to decision, gate review, or issue
  - **Action Status**: Open / In Progress / Blocked / Completed / Cancelled
  - **Action Dependencies**: Actions that block or are blocked by others
  - **Recurring Actions**: Actions that repeat (e.g., monthly compliance checks)
  
- **Escalation Management**:
  - **Escalation Triggers**: Auto-escalate overdue actions, blocked projects, non-compliance
  - **Escalation Paths**: Define escalation hierarchy (PM → PMO → Governance Board → Exec)
  - **Escalation History**: Track escalation events and resolutions
  - **Escalation SLAs**: Define response time targets per escalation level
  
- **Meeting Management**:
  - **Governance Board Meetings**: Schedule, agenda, attendees
  - **Meeting Minutes**: Link to external meeting notes (reference only)
  - **Action Items from Meetings**: Auto-create actions from meeting outcomes
  - **Decision Ratification**: Formalize decisions made in meetings

#### 5. Risk & Issue Governance
- **Portfolio Risk Aggregation**:
  - Aggregate project risks to portfolio level
  - Risk concentration analysis (multiple projects with same risk)
  - Portfolio risk appetite vs exposure
  - Top 10 portfolio risks dashboard
  
- **Risk Mitigation Governance**:
  - **Mitigation Plans**: Document mitigation strategies
  - **Mitigation Owners**: Assign accountability for risk mitigation
  - **Mitigation Progress**: Track mitigation action completion
  - **Residual Risk**: Track remaining risk after mitigation
  
- **Issue Management**:
  - **Governance Issues**: Issues requiring board attention
  - **Issue Severity**: Critical / High / Medium / Low
  - **Issue Resolution Tracking**: Track resolution progress and blockers
  - **Issue Escalation**: Auto-escalate unresolved critical issues

#### 6. Benefits Realization Tracking
- **Benefits Definition**:
  - **Benefit Types**: Financial (cost savings, revenue), Non-Financial (efficiency, quality, risk reduction)
  - **Benefit Owners**: Assign accountability for benefit realization
  - **Target Values**: Quantified benefit targets with units
  - **Realization Timeline**: When benefits expected to materialize
  
- **Benefits Tracking**:
  - **Baseline Measurement**: Pre-project baseline values
  - **Actual Values**: Post-implementation measurements
  - **Realization Status**: Not Yet / Partially Realized / Fully Realized / Not Realized
  - **Variance Analysis**: Actual vs target benefits
  
- **Benefits Dashboard**:
  - Portfolio benefits by project
  - Benefits realization rate
  - ROI calculation (benefits vs costs)
  - Benefits at risk (projects in trouble)

#### 7. Strategic Alignment
- **Strategic Initiatives**:
  - Define organizational strategic initiatives/objectives
  - Initiative owners and timelines
  - Initiative KPIs and targets
  
- **Project Linkage**:
  - Link projects to strategic initiatives
  - Strategic alignment score per project
  - Portfolio view by strategic initiative
  - Initiative progress rollup from projects
  
- **Alignment Dashboard**:
  - % of portfolio budget aligned to strategy
  - Initiatives with insufficient project support
  - Strategic vs BAU investment split

**Database Tables** (14 new governance tables):

1. **`governance_gates`**: Gate definitions and templates
   - `gate_id` (PK), `gate_name`, `gate_order`, `gate_description`, `gate_type`, `is_mandatory`, `template_id`
   
2. **`gate_criteria`**: Checklist items per gate
   - `criteria_id` (PK), `gate_id` (FK), `criteria_type` (document/approval/quality/budget/resource/dependency), `criteria_name`, `criteria_description`, `is_mandatory`, `validation_rule`
   
3. **`project_gates`**: Project progression through gates
   - `project_gate_id` (PK), `project_id` (FK), `gate_id` (FK), `gate_status` (not-started/in-review/passed/passed-with-conditions/failed/deferred), `scheduled_date`, `review_date`, `outcome`, `conditions`, `reviewer_notes`, `next_review_date`
   
4. **`gate_criteria_compliance`**: Checklist completion per project per gate
   - `compliance_id` (PK), `project_gate_id` (FK), `criteria_id` (FK), `status` (not-started/in-progress/met/not-met/waived), `evidence_reference`, `completed_date`, `completed_by`
   
5. **`governance_policies`**: Policy definitions
   - `policy_id` (PK), `policy_name`, `policy_category`, `policy_description`, `policy_owner`, `effective_date`, `end_date`, `version`, `applicability_rules`, `is_active`
   
6. **`policy_compliance`**: Project compliance tracking
   - `compliance_id` (PK), `project_id` (FK), `policy_id` (FK), `compliance_status` (not-started/in-progress/compliant/non-compliant/exempt/waived), `due_date`, `evidence_reference`, `last_assessed_date`, `assessed_by`, `remediation_plan`, `notes`
   
7. **`policy_waivers`**: Policy exemption tracking
   - `waiver_id` (PK), `compliance_id` (FK), `waiver_reason`, `requested_by`, `requested_date`, `approved_by`, `approved_date`, `waiver_status` (pending/approved/rejected/expired), `expiry_date`, `conditions`, `review_notes`
   
8. **`governance_decisions`**: Decision log
   - `decision_id` (PK), `decision_title`, `decision_description`, `decision_context`, `decision_rationale`, `decision_date`, `decision_maker`, `decision_type` (strategic/tactical/operational), `decision_status` (proposed/approved/rejected/deferred/reversed), `impact_budget`, `impact_timeline`, `impact_resources`, `affected_projects`, `parent_decision_id` (FK self-reference)
   
9. **`governance_actions`**: Action items from decisions/reviews
   - `action_id` (PK), `action_description`, `action_owner`, `action_source` (decision/gate-review/issue/meeting), `source_id`, `due_date`, `priority` (critical/high/medium/low), `action_status` (open/in-progress/blocked/completed/cancelled), `completed_date`, `completion_notes`, `is_recurring`, `recurrence_rule`
   
10. **`action_dependencies`**: Action dependency tracking
    - `dependency_id` (PK), `action_id` (FK), `depends_on_action_id` (FK), `dependency_type` (blocks/blocked-by)
    
11. **`escalations`**: Escalation tracking
    - `escalation_id` (PK), `entity_type` (project/action/issue/compliance), `entity_id`, `escalation_reason`, `escalation_level` (1-5), `escalated_to`, `escalated_date`, `escalation_status` (open/in-progress/resolved/closed), `resolution_date`, `resolution_notes`
    
12. **`strategic_initiatives`**: Strategic goals/objectives
    - `initiative_id` (PK), `initiative_name`, `initiative_description`, `initiative_owner`, `start_date`, `target_date`, `initiative_status` (active/on-hold/completed/cancelled), `kpi_targets`, `progress_percentage`
    
13. **`project_benefits`**: Benefits tracking per project
    - `benefit_id` (PK), `project_id` (FK), `benefit_type` (financial/non-financial), `benefit_category` (cost-savings/revenue/efficiency/quality/risk-reduction), `benefit_description`, `benefit_owner`, `target_value`, `value_unit`, `baseline_value`, `actual_value`, `realization_status` (not-yet/partial/full/not-realized), `realization_date`, `measurement_notes`
    
14. **`governance_meetings`**: Meeting tracking
    - `meeting_id` (PK), `meeting_type` (governance-board/gate-review/steering-committee), `meeting_date`, `agenda`, `attendees`, `minutes_reference`, `decisions_made`, `actions_created`

**Database Schema Changes to Existing Tables**:

1. **`projects` table additions**:
   - `current_gate_id` (FK to governance_gates)
   - `strategic_initiative_id` (FK to strategic_initiatives)
   - `governance_status` (on-track/at-risk/blocked/escalated)
   - `last_gate_review_date`
   - `next_gate_review_date`
   
2. **`projects` extended for alignment**:
   - `strategic_alignment_score` (0-100)
   - `benefit_realization_status` (not-started/on-track/at-risk/achieved)

**Service Layer** (`app/main/services/governance/`):

1. **`GovernanceService.ts`**: Main orchestration service
   - Portfolio metrics calculation
   - Cross-module data aggregation
   - Governance health scoring
   
2. **`StageGateService.ts`**: Gate management
   - Gate configuration CRUD
   - Gate criteria management
   - Project gate progression logic
   - Gate compliance checking
   - Auto-progression evaluation
   
3. **`ComplianceService.ts`**: Policy compliance
   - Policy CRUD operations
   - Compliance tracking and status updates
   - Waiver request and approval workflow
   - Compliance alerts and notifications
   - Overdue compliance escalation
   
4. **`DecisionLogService.ts`**: Decision and action management
   - Decision recording and tracking
   - Action item CRUD
   - Action dependency management
   - Recurring action scheduling
   - Decision impact analysis
   
5. **`EscalationService.ts`**: Escalation management
   - Auto-escalation rule evaluation
   - Escalation workflow execution
   - SLA monitoring
   - Escalation history tracking
   
6. **`RiskGovernanceService.ts`**: Portfolio risk management
   - Portfolio risk aggregation
   - Risk concentration analysis
   - Risk mitigation tracking
   - Risk appetite monitoring
   
7. **`BenefitsService.ts`**: Benefits realization
   - Benefits definition and tracking
   - Baseline and actual measurement
   - ROI calculation
   - Benefits variance analysis
   
8. **`StrategicAlignmentService.ts`**: Strategic initiative management
   - Initiative CRUD operations
   - Project-initiative linkage
   - Alignment scoring
   - Initiative progress rollup
   
9. **`PortfolioAnalyticsService.ts`**: Advanced analytics
   - Portfolio health score calculation
   - Delivery predictability index
   - Portfolio velocity metrics
   - Heatmap data generation
   
10. **`GovernanceReportingService.ts`**: Reporting and exports
    - Executive summary reports
    - Gate status reports
    - Compliance reports
    - Portfolio analytics exports

**UI Components & Pages**:

**New Sidebar Module: "Governance"** with 8 sub-pages:

1. **Portfolio Dashboard** (`PortfolioDashboard.tsx`):
   - Executive metrics cards (12 key metrics)
   - Portfolio heatmaps (Risk vs Value, Resource Demand vs Capacity)
   - Strategic alignment donut chart
   - Project distribution by gate (funnel chart)
   - Risk concentration chart (top 10 risks)
   - Benefits realization tracker
   - Quick filters: By Initiative, By Lane, By PM, By Risk Level
   
2. **Stage Gates** (`StageGateManager.tsx`):
   - **Gate Configuration Panel**:
     - Gate definitions list with add/edit/reorder
     - Gate template management
     - Criteria library with drag-drop to gates
   - **Projects by Gate View** (Kanban board):
     - Columns for each gate
     - Project cards with gate status, due date, criteria completion %
     - Drag-drop to move projects (triggers gate review workflow)
   - **Gate Review Queue**:
     - Upcoming reviews calendar
     - Overdue reviews alert list
     - Quick review action (pass/fail/defer)
   - **Gate Analytics**:
     - Average time at gate chart
     - Pass/fail rates by gate
     - Bottleneck identification
   
3. **Compliance Tracker** (`ComplianceTracker.tsx`):
   - **Policy Management Panel**:
     - Policy list with filter by category
     - Add/edit policies with version control
     - Policy applicability rules editor
   - **Compliance Matrix View**:
     - Table: Projects (rows) × Policies (columns)
     - Cell color: Green (compliant), Yellow (in-progress), Red (non-compliant), Gray (exempt)
     - Click cell to see evidence, remediation plan
   - **Waiver Management**:
     - Pending waivers queue
     - Waiver approval workflow
     - Expiring waivers alert
   - **Compliance Alerts**:
     - Overdue compliance items
     - Upcoming due dates (30-day window)
     - Non-compliance risk score
   
4. **Decision Log** (`DecisionLog.tsx`):
   - **Decision Timeline View**:
     - Chronological decision list with filters (type, status, date range)
     - Decision cards with expand/collapse details
     - Impact badges (budget, timeline, resources)
   - **Decision Detail Panel**:
     - Full decision record with context and rationale
     - Affected projects list
     - Linked action items with status
     - Decision dependency graph
   - **Decision Impact Dashboard**:
     - Total decisions by type and status (charts)
     - Decision implementation rate
     - Average time to decision implementation
   
5. **Action Items** (`ActionItemsManager.tsx`):
   - **Action Queue**:
     - Kanban board: Open → In Progress → Blocked → Completed
     - Action cards with owner, due date, priority, source
     - Drag-drop to change status
   - **My Actions View** (filtered by current user):
     - Overdue actions alert
     - Due this week
     - Blocked actions requiring escalation
   - **Action Dependencies**:
     - Dependency graph visualization
     - Critical path highlighting
   - **Recurring Actions**:
     - Scheduled recurring actions list
     - Next occurrence date
     - Recurrence pattern editor
   
6. **Strategic Alignment** (`StrategicAlignmentDashboard.tsx`):
   - **Initiative Overview**:
     - Strategic initiatives list with progress bars
     - Initiative KPI tracking
     - Initiative timeline (Gantt view)
   - **Project Alignment Matrix**:
     - Table: Projects × Initiatives
     - Alignment strength indicator (Strong/Medium/Weak/None)
     - Investment per initiative (budget rollup)
   - **Alignment Analytics**:
     - Portfolio alignment score (% aligned to strategy)
     - Strategic vs BAU investment split (pie chart)
     - Initiatives at risk (insufficient project support)
     - Alignment trends over time
   
7. **Benefits Realization** (`BenefitsRealizationTracker.tsx`):
   - **Benefits Portfolio View**:
     - Table: Projects × Benefits with target vs actual
     - Realization status color coding
     - ROI calculation per project
   - **Benefits Timeline**:
     - Expected vs actual benefit realization dates
     - Benefits at risk (projects in trouble)
   - **Benefits Analytics**:
     - Total portfolio benefits (financial and non-financial)
     - Benefits by category (cost savings, revenue, efficiency)
     - ROI distribution (histogram)
     - Top 10 benefit-generating projects
   
8. **Governance Reports** (`GovernanceReports.tsx`):
   - **Report Templates**:
     - Executive Dashboard (PDF export)
     - Gate Status Report
     - Compliance Report
     - Benefits Realization Report
     - Portfolio Health Report
   - **Scheduled Reports**:
     - Configure automated report generation
     - Email distribution lists (reference only, no email sending)
   - **Report History**:
     - Generated reports archive
     - Report download links

**InfoPane Enhancements for Governance Module**:

When Governance module is active, InfoPane displays:
- **Portfolio Health Score** (0-100 with color indicator)
- **Active Gates**: Count of projects at each gate
- **Overdue Compliance Items**: Count with severity
- **Open Actions**: Total, Overdue, Due This Week
- **Recent Decisions**: Last 5 decisions with quick links
- **Escalated Items**: Count of active escalations
- **Benefits at Risk**: Count of projects with unrealized benefits
- **Quick Actions**:
  - 🚀 Create Decision
  - ✅ Record Gate Review
  - 📋 Add Action Item
  - 🔄 Refresh Portfolio Metrics

**Integration with Existing Modules**:

1. **Projects Module Integration**:
   - Add "Current Gate" field to project cards and detail view
   - Add "Compliance Status" indicator to project cards
   - Add "Strategic Initiative" tag to projects
   - Show governance status badge (on-track/at-risk/blocked/escalated)
   - Link to governance actions and decisions from project detail
   
2. **Dashboard (Gantt) Integration**:
   - Color-code projects by governance status
   - Add gate milestone markers on timeline
   - Show compliance alerts on project hover
   - Filter projects by gate, compliance status, strategic initiative
   
3. **InfoPane Integration**:
   - Show project-specific governance metrics when project selected
   - Display gate criteria checklist
   - Show outstanding compliance items
   - List related decisions and actions
   
4. **Audit Events Integration**:
   - Log all governance actions (gate reviews, decisions, escalations)
   - Enhanced audit context: module="governance", component, entity_type, entity_id
   - Governance audit trail accessible from governance pages
   
5. **Calendar Module Integration**:
   - Show gate review dates on calendar
   - Show compliance due dates
   - Show governance meeting dates
   - Alert for upcoming governance events
   
6. **ADO Integration**:
   - Sync governance decisions as ADO work items (if configured)
   - Sync action items as ADO tasks
   - Sync compliance items as ADO compliance work items
   
7. **Project Coordinator Integration**:
   - Link financial variance alerts to governance escalations
   - Include resource over-commitment in portfolio risk score
   - Show project financial health in portfolio dashboard

**Key Business Logic**:

1. **Portfolio Health Score Calculation** (0-100):
   ```
   Health Score = Weighted Average of:
   - On-Time Delivery Score (30%): % projects on schedule
   - Budget Performance Score (25%): % projects within budget variance threshold
   - Risk Score (20%): Inverse of portfolio risk exposure
   - Compliance Score (15%): % projects compliant with policies
   - Benefits Realization Score (10%): % benefits realized vs target
   
   Score Bands:
   - 90-100: Excellent (Green)
   - 75-89: Good (Light Green)
   - 60-74: Fair (Yellow)
   - 40-59: Poor (Orange)
   - 0-39: Critical (Red)
   ```

2. **Gate Auto-Progression Logic**:
   ```
   For each project at a gate:
   1. Check if all mandatory criteria are met
   2. Check if all required approvals are obtained
   3. Check if quality gates pass (test coverage, security scan)
   4. Check if budget gates pass (budget approved, variance within threshold)
   5. Check if dependency gates pass (all blockers resolved)
   6. If all checks pass AND auto-progression enabled:
      - Move project to next gate
      - Log audit event
      - Create action item for next gate preparation
      - Notify project manager
   ```

3. **Compliance Escalation Logic**:
   ```
   Daily Check:
   1. Find all compliance items with due_date <= today + 30 days
   2. For each overdue compliance item:
      - Calculate days overdue
      - Determine escalation level based on days and severity:
        - 1-7 days overdue: Level 1 (PM)
        - 8-14 days: Level 2 (PMO)
        - 15-30 days: Level 3 (Governance Board)
        - 31+ days: Level 4 (Executive)
      - Create escalation record if not exists
      - Update escalation level if exists and days threshold crossed
   3. Generate compliance alert for InfoPane
   ```

4. **Strategic Alignment Score** (per project, 0-100):
   ```
   Alignment Score = Average of:
   - Direct Linkage (40%): Linked to strategic initiative = 100, else 0
   - Value Contribution (30%): Project benefit value / Initiative target value × 100
   - Timeline Alignment (30%): Project timeline overlaps initiative timeline = 100, else 50
   
   Portfolio Alignment Score = Σ(Project Alignment Score × Project Budget) / Total Budget
   ```

5. **Escalation Auto-Creation**:
   ```
   Escalation Triggers:
   1. Overdue Actions (critical: 1 day, high: 7 days, medium: 14 days)
   2. Blocked Projects (>14 days at same gate)
   3. Non-Compliant Projects (past due date)
   4. Failed Gates (3 consecutive failures)
   5. High Portfolio Risk (risk score > threshold)
   6. Budget Overrun (>20% over budget)
   7. Benefits Not Realized (>90 days past realization date)
   
   For each trigger:
   - Determine escalation level based on severity and duration
   - Create escalation record
   - Link to source entity (project/action/compliance)
   - Assign to escalation owner based on level
   - Set SLA based on escalation level
   ```

6. **Benefits ROI Calculation**:
   ```
   For each project:
   - Total Costs = Project Budget (from projects table) + Actual Costs (from raw_actuals)
   - Total Benefits = Σ(Actual Benefit Value for all realized benefits)
   - ROI % = ((Total Benefits - Total Costs) / Total Costs) × 100
   - Payback Period = Total Costs / (Total Benefits / Benefit Realization Period in months)
   
   Portfolio ROI = Σ(Project Benefits) / Σ(Project Costs) × 100
   ```

**Configuration & Settings**:

- **Governance Settings** (stored in `app_settings`):
  - `governance.portfolio_health_weights`: JSON object with health score component weights
  - `governance.escalation_sla_hours`: JSON object with SLA hours per escalation level
  - `governance.auto_progression_enabled`: Boolean flag
  - `governance.compliance_alert_days`: Days before due date to show compliance alerts (default: 30)
  - `governance.gate_review_reminder_days`: Days before scheduled review to send reminder (default: 7)
  - `governance.default_gate_template`: Default gate template ID for new projects
  
- **Per-Project Governance Settings** (in `projects` table extended fields):
  - `governance_level`: Standard / Enhanced / Custom (determines mandatory policies)
  - `gate_template_id`: Which gate template to use
  - `auto_progression`: Boolean override per project

**Performance Optimizations**:

1. **Indexed Queries**:
   - Index on `project_gates.gate_status` for gate funnel queries
   - Index on `policy_compliance.compliance_status, due_date` for compliance alerts
   - Index on `governance_actions.action_status, due_date` for action queue
   - Index on `governance_decisions.decision_date` for timeline queries
   - Index on `escalations.escalation_status, escalation_level` for escalation dashboards
   
2. **Cached Calculations**:
   - Portfolio health score cached in `projects` table as computed field
   - Strategic alignment score cached per project
   - Gate criteria completion % cached in `project_gates` table
   - Recalculate on project update, gate status change, compliance status change
   
3. **Async Processing**:
   - Portfolio metrics calculation runs async on background thread
   - Escalation auto-creation runs as scheduled job (every hour)
   - Compliance alerts generated as background job (daily at 6am)
   - Gate auto-progression evaluation runs after each criteria update
   
4. **Data Aggregation**:
   - Use SQL aggregate functions for portfolio rollups
   - Minimize cross-table joins with strategic denormalization
   - Batch queries for gate criteria compliance checks

**Testing Strategy**:

1. **Unit Tests**:
   - Portfolio health score calculation with various scenarios
   - Gate auto-progression logic (all pass, some fail, conditional pass)
   - Compliance escalation logic (various overdue scenarios)
   - Strategic alignment score calculation
   - Benefits ROI calculation
   - Escalation trigger evaluation
   
2. **Integration Tests**:
   - Gate review workflow: criteria update → auto-progression → audit log
   - Compliance workflow: compliance update → alert generation → escalation
   - Decision to action: decision created → actions created → action dependencies
   - Benefits tracking: project completed → benefits measured → ROI calculated
   - Portfolio health: project updates → metrics recalculated → dashboard updated
   
3. **E2E Tests (Playwright)**:
   - Full gate progression: Create project → Add gate criteria → Complete criteria → Auto-progress
   - Compliance management: Create policy → Assign to projects → Track compliance → Request waiver → Approve waiver
   - Decision workflow: Create decision → Create actions → Complete actions → Verify decision implemented
   - Portfolio analytics: View portfolio dashboard → Drill into project → View governance details → Export report

**Documentation**:

- Architecture: `docs/GOVERNANCE_ARCHITECTURE.md`
- User Guide: `docs/GOVERNANCE_USER_GUIDE.md`
- Integration Guide: `docs/GOVERNANCE_INTEGRATION.md`
- API Reference: `docs/GOVERNANCE_API.md`

## Conclusion

Roadmap-Electron has evolved into a comprehensive project management platform with enterprise-grade features:
- **Real-time Statistics**: Context-aware insights into project portfolio health
- **Enterprise Integration**: Secure ADO integration with token management
- **Resource Planning**: Calendar system for accurate capacity planning
- **Financial Tracking**: Complete P&L tracking with SAP integration and multi-dimensional variance analysis
- **Resource Management**: Flexible commitment model with capacity tracking and over-commitment detection
- **External Squad Coordination**: Milestone-based tracking for ServiceHub and other external dependencies
- **Project Governance**: Comprehensive portfolio oversight with stage gates, policy compliance, and strategic alignment
- **Data Protection**: Backup/restore and comprehensive audit logging
- **Performance**: Optimized database design with strategic indexing
- **User Experience**: Consistent styling with theme support and responsive design

The unified stylesheet approach provides a scalable, maintainable foundation for consistent UI/UX across all modules. By leveraging CSS custom properties and semantic naming, developers can quickly understand and modify styles while maintaining visual consistency across the expanding feature set.

The Project Governance module represents the culmination of the platform's evolution into a full-spectrum enterprise project management solution, providing executive oversight and organizational alignment. Combined with the Project Coordinator (financial tracking) and existing modules, Roadmap-Electron now delivers:
- **Strategic Layer**: Portfolio governance, strategic alignment, benefits realization
- **Tactical Layer**: Project roadmaps, stage gates, resource capacity, compliance
- **Operational Layer**: ADO integration, financial tracking, timesheet reconciliation, variance analysis

This three-tier architecture enables organizations to manage projects from executive portfolio decisions down to individual developer timesheets, all within a single integrated platform.
