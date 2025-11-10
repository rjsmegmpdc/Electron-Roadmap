import { ModuleInfo } from '../components/InfoPane';
import { governanceModuleInfo } from './governanceModuleInfo';

export const moduleInfoData: Record<string, ModuleInfo> = {
  // Merge governance modules
  ...governanceModuleInfo,
  
  dashboard: {
    title: 'Main Dashboard',
    description: 'Welcome to your central command center. Access all modules and get an overview of your current progress and activities.',
    status: 'stable',
    version: '1.0.0',
    features: [
      'Quick access to all modules',
      'Overview of system status',
      'Recent activity tracking',
      'Intuitive navigation'
    ],
    tips: [
      'Use the navigation menu to quickly switch between modules',
      'The info panel provides contextual help for each module',
      'Your progress is automatically saved as you work'
    ],
    stats: [
      { label: 'Modules', value: '12' },
      { label: 'Active Projects', value: '3' },
      { label: 'Tests Passed', value: '47' },
      { label: 'Uptime', value: '99%' }
    ],
    lastUpdated: new Date().toLocaleDateString()
  },

  projects: {
    title: 'Project Management',
    description: 'Comprehensive project management with roadmap planning, budget tracking, and status monitoring for all your initiatives.',
    status: 'stable',
    version: '2.1.0',
    features: [
      'Create and manage projects',
      'Track budgets and timelines',
      'Status monitoring and reporting',
      'Archive completed projects',
      'Export project data'
    ],
    shortcuts: [
      { key: 'Ctrl+N', description: 'New Project' },
      { key: 'Ctrl+E', description: 'Edit Selected' },
      { key: 'Delete', description: 'Delete Project' },
      { key: 'Ctrl+R', description: 'Refresh List' }
    ],
    tips: [
      'Use status colors to quickly identify project health',
      'Create sample projects to test the system',
      'Use the search function to find projects quickly',
      'Export data for external reporting'
    ],
    documentation: `Project Management Module

This module allows you to:
- Create new projects with detailed information
- Track project status, budget, and timeline
- View projects in different layouts
- Edit and update project details
- Archive completed projects

Project Fields:
- Title: Project name
- Description: Detailed project description
- Status: planned, in-progress, blocked, done, archived
- Budget: Financial allocation in NZD
- Timeline: Start and end dates
- PM Name: Project manager assignment
- Lane: Project category or stream`,
    stats: [
      { label: 'Total Projects', value: '24' },
      { label: 'Active', value: '12' },
      { label: 'Completed', value: '8' },
      { label: 'Budget', value: '$2.4M' }
    ],
    lastUpdated: '2025-01-14'
  },

  'quick-task': {
    title: 'Quick Task Creation',
    description: 'Quickly create tasks with project assignment. Tasks can be created standalone or linked to existing projects.',
    status: 'stable',
    version: '1.2.0',
    features: [
      'Quick task creation form',
      'Project selection dropdown',
      'Task assignment and scheduling',
      'Status tracking',
      'Resource allocation'
    ],
    shortcuts: [
      { key: 'Ctrl+N', description: 'New Task' },
      { key: 'Ctrl+S', description: 'Save Task' },
      { key: 'Ctrl+P', description: 'Select Project' }
    ],
    tips: [
      'Select a project first to establish task relationship',
      'Use descriptive task titles for better organization',
      'Set realistic effort estimates',
      'Assign tasks to team members for accountability'
    ],
    documentation: `Quick Task Creation

This module provides a fast way to create tasks that are linked to projects:

1. Select the target project from dropdown
2. Fill in task details (title, dates, effort)
3. Assign resources and set status
4. Save to link task to selected project

Tasks created here will appear in:
- Project detail views
- Task management reports
- Resource allocation dashboards`,
    stats: [
      { label: 'Tasks Today', value: '8' },
      { label: 'Quick Tasks', value: '156' },
      { label: 'Projects', value: '12' }
    ],
    lastUpdated: '2025-01-14'
  },

  config: {
    title: 'Epic & Feature Configuration',
    description: 'Configure default values to speed up Epic and Feature creation. Set team member defaults, iterations, area paths, and common field values.',
    status: 'stable',
    version: '1.0.0',
    features: [
      'Pre-configure Epic and Feature default values',
      'Team member assignment defaults',
      'Active iteration management',
      'Custom area path configuration',
      'Priority and value area defaults',
      'Epic sizing and risk level defaults',
      'Tag template configuration',
      'Local storage persistence',
      'Configuration import/export',
      'Reset to defaults functionality'
    ],
    shortcuts: [
      { key: 'Ctrl+S', description: 'Save Configuration' },
      { key: 'Ctrl+R', description: 'Reload Configuration' },
      { key: 'Ctrl+D', description: 'Reset to Defaults' },
      { key: 'Tab', description: 'Switch Between Tabs' }
    ],
    tips: [
      'Configure team member defaults to speed up Epic/Feature creation',
      'Add active iterations to quickly assign work to current sprints',
      'Set up custom area paths for your team structure',
      'Use tag templates to ensure consistent tagging across work items',
      'Save configuration regularly to preserve your settings',
      'Export configuration to share settings across team members'
    ],
    documentation: `Epic & Feature Configuration System

Configuration Categories:

1. Common Defaults
   - Priority levels (1-4 with descriptions)
   - Value Area (Business/Architectural)
   - Default Area Path selection
   - Default Iteration Path selection

2. Epic Defaults
   - Epic sizing (XS, S, M, L, XL with time estimates)
   - Risk level assessment (Low, Medium, High, Critical)
   - Epic Owner assignment
   - Delivery Lead assignment
   - Tech Lead assignment
   - Business Owner assignment
   - Process Owner assignment
   - Platform Owner assignment
   - Default tag templates

3. Feature Defaults
   - Product Owner assignment (replaces Epic Owner)
   - Delivery Lead assignment
   - Tech Lead assignment
   - Business Owner assignment
   - Process Owner assignment
   - Platform Owner assignment
   - Default tag templates

4. Iterations & Paths Management
   - Active iteration management
   - Custom area path configuration
   - Quick add/remove functionality
   - Path validation and formatting

Team Member Integration:
All owner/lead fields use the exact team member list from ADO overlay:
- Yash Yash (Yash.Yash@one.nz)
- Farhan Sarfraz (Farhan.Sarfraz@one.nz)
- Ashish Shivhare (Ashish.Shivhare@one.nz)
- Adrian Albuquerque (Adrian.Albuquerque@one.nz)
- Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)

Configuration Storage:
- Local browser storage persistence
- JSON format for easy import/export
- Automatic configuration loading on startup
- Change tracking with save indicators
- Reset to defaults functionality

Field Mapping:
All configured defaults map directly to ADO fields:
- System.AssignedTo → Owner assignments
- Microsoft.VSTS.Common.Priority → Priority defaults
- Microsoft.VSTS.Common.ValueArea → Value area defaults
- System.AreaPath → Area path defaults
- System.IterationPath → Iteration path defaults
- Custom.EpicSizing → Epic sizing defaults
- System.Tags → Tag template defaults

Best Practices:
1. Configure team-specific defaults before Epic/Feature creation
2. Keep active iterations updated for current sprint planning
3. Use consistent area paths aligned with ADO structure
4. Set realistic Epic sizing defaults based on team capacity
5. Configure tag templates for consistent categorization
6. Regularly backup configuration settings
7. Share configuration across team for consistency`,
    stats: [
      { label: 'Default Fields', value: '15+' },
      { label: 'Team Members', value: '5' },
      { label: 'Active Iterations', value: '3' },
      { label: 'Area Paths', value: '3' },
      { label: 'Configuration Tabs', value: '4' },
      { label: 'Auto-save', value: 'On' }
    ],
    lastUpdated: '2025-01-14'
  },

  'epic-features': {
    title: 'Epics & Features Management',
    description: 'Advanced Epic and Feature management with full Azure DevOps integration, dependency tracking, and comprehensive planning capabilities.',
    status: 'beta',
    version: '2.0.0',
    features: [
      'Epic lifecycle management with ADO sync',
      'Feature breakdown with full field support',
      'Dependency management and tracking',
      'Azure DevOps work item integration',
      'Cross-team collaboration tools',
      'Progress visualization and reporting',
      'Risk assessment and mitigation',
      'Resource allocation and planning'
    ],
    shortcuts: [
      { key: 'Ctrl+E', description: 'New Epic' },
      { key: 'Ctrl+F', description: 'New Feature' },
      { key: 'Ctrl+D', description: 'Add Dependency' },
      { key: 'Ctrl+S', description: 'Sync with ADO' }
    ],
    tips: [
      'Start with high-level Epics before breaking down Features',
      'Use ADO integration for real-time team collaboration',
      'Set up dependencies early to avoid bottlenecks',
      'Regularly sync with Azure DevOps for latest updates',
      'Use risk assessment to prioritize critical features',
      'Track business value and effort for better planning'
    ],
    documentation: `Epic & Feature Management with Azure DevOps Integration

Full ADO Integration Features:
- Bidirectional sync with Azure DevOps work items
- Automated status updates and notifications
- Cross-team dependency management
- Risk assessment and mitigation tracking
- Resource allocation and capacity planning

Epic Management:
- Create high-level initiative goals
- Break down into manageable features
- Track completion across multiple teams
- Generate comprehensive progress reports
- Manage cross-Epic dependencies

Feature Management:
- Detailed feature specifications
- Effort estimation and business value assessment
- Time criticality and risk evaluation
- Area path and iteration assignment
- Resource allocation and team assignment

Dependency Framework:
- Hard (blocking) and soft (coordination) dependencies
- Automated blocking/unblocking based on completion
- Validation to prevent cycles and conflicts
- Cross-workstream visibility and coordination
- Integration with ADO dependency links

Required Fields (ADO Integration):
Epics:
- Title, Description, State
- Effort, Business Value, Time Criticality
- Start/End Dates, Assigned To
- Area Path, Iteration Path
- Risk Level, Value Area
- Parent Feature (if applicable)

Features:
- Title, Description, State
- Effort, Business Value, Time Criticality  
- Start/End Dates, Assigned To
- Area Path, Iteration Path
- Risk Level, Value Area
- Epic Assignment

Dependency Management:
- Source and Target work items
- Dependency type (Hard/Soft)
- Reason and timeline requirements
- Risk level assessment
- Automatic validation and conflict detection`,
    stats: [
      { label: 'Active Epics', value: '12' },
      { label: 'Features', value: '47' },
      { label: 'Dependencies', value: '23' },
      { label: 'ADO Synced', value: '156' },
      { label: 'Blocked Items', value: '5' },
      { label: 'At Risk', value: '8' }
    ],
    lastUpdated: '2025-01-14'
  },

  tests: {
    title: 'Test Suite Management',
    description: 'Comprehensive test suite execution and monitoring with dual-panel interface. Run security, integration, performance, unit, and end-to-end tests with detailed error analysis.',
    status: 'stable',
    version: '3.0.0',
    features: [
      'Dual-panel test interface (cards + error output)',
      'Five test suite categories (Security, Integration, Performance, Unit, E2E)',
      'Real-time test execution with progress tracking',
      'Detailed error output with log file locations',
      'Test result history and statistics',
      'Individual test selection and re-runs',
      'Log file generation and management',
      'Test status visualization with progress bars',
      'Suite-level and individual test controls',
      'Responsive design with mobile support'
    ],
    shortcuts: [
      { key: 'Ctrl+T', description: 'Run All Tests' },
      { key: 'Ctrl+Shift+T', description: 'Run Selected Suite' },
      { key: 'F5', description: 'Clear Results' },
      { key: 'Ctrl+R', description: 'Re-run Suite' },
      { key: 'Esc', description: 'Deselect Test' }
    ],
    tips: [
      'Select individual tests to view detailed error outputs',
      'Use the suite selector to focus on specific test categories',
      'Monitor log file locations for detailed debugging',
      'Check test progress bars to identify failing components',
      'Run tests frequently during development cycles',
      'Use the dual-panel layout to analyze errors while viewing test cards'
    ],
    documentation: `Test Suite Management System

Interface Layout:
- Left Panel: Test suite cards with status indicators
- Right Panel: Error output and detailed test information
- Header: Controls, statistics, and suite selection

Test Categories:
1. Security Tests - Authentication, authorization, SQL injection
2. Integration Tests - Database, ADO integration, file system
3. Performance Tests - Query performance, memory usage, load testing
4. Unit Tests - Components, utilities, store functions
5. End-to-End Tests - Full workflows, user journeys, navigation

Test Execution:
- Individual test progress tracking
- Pass/fail status with visual indicators
- Execution time measurement
- Error capture and display
- Log file generation for failed tests

Error Analysis:
- Detailed error messages in right panel
- Log file paths for debugging
- Test metadata (type, duration, status)
- Recent log file history

Features:
- Real-time status updates during execution
- Progress bars showing pass/fail ratios
- Test suite summary statistics
- Re-run capabilities for individual suites
- Responsive design for different screen sizes

Best Practices:
- Select tests from left panel to view error details
- Monitor overall statistics in header
- Use suite filtering to focus on problem areas
- Check log files for detailed debugging information
- Run all tests before major releases`,
    stats: [
      { label: 'Total Tests', value: '254' },
      { label: 'Test Suites', value: '5' },
      { label: 'Last Run', value: '2m ago' },
      { label: 'Success Rate', value: '87%' },
      { label: 'Avg Duration', value: '3.2s' },
      { label: 'Log Files', value: '12' }
    ],
    lastUpdated: '2025-01-14'
  },

  components: {
    title: 'Component Library',
    description: 'Reusable React components with documentation, examples, and best practices for consistent UI development.',
    status: 'stable',
    version: '1.6.0',
    features: [
      'Component catalog',
      'Interactive examples',
      'Usage documentation',
      'Design system integration',
      'Accessibility guidelines'
    ],
    tips: [
      'Browse components before building new ones',
      'Follow the established design patterns',
      'Test components across different screen sizes'
    ],
    stats: [
      { label: 'Components', value: '42' },
      { label: 'Examples', value: '156' },
      { label: 'Variants', value: '78' }
    ],
    lastUpdated: '2025-01-09'
  },

  services: {
    title: 'Service Layer',
    description: 'Backend services including database operations, API integrations, and business logic components.',
    status: 'stable',
    version: '1.4.0',
    features: [
      'Database abstraction layer',
      'API service integrations',
      'Authentication services',
      'Encryption utilities',
      'Logging and monitoring'
    ],
    tips: [
      'Use service layer for all data operations',
      'Implement proper error handling',
      'Monitor service performance',
      'Keep services stateless when possible'
    ],
    documentation: `Service Architecture

Core Services:
- Database Service: SQLite operations
- ADO API Service: Azure DevOps integration
- Encryption Service: Data security
- Debug Logger: Application monitoring
- Token Manager: Authentication handling

Design Patterns:
- Repository pattern for data access
- Service layer for business logic
- Dependency injection for loose coupling
- Observer pattern for event handling

Security:
- All sensitive data is encrypted
- Secure token management
- Input validation and sanitization
- Audit logging for compliance`,
    stats: [
      { label: 'Services', value: '12' },
      { label: 'API Calls', value: '2.4K' },
      { label: 'Uptime', value: '99.8%' }
    ],
    lastUpdated: '2025-01-11'
  },

  'ado-config': {
    title: 'Azure DevOps Integration',
    description: 'Configure and manage Azure DevOps integration settings, API connections, and synchronization preferences.',
    status: 'beta',
    version: '0.9.0',
    features: [
      'ADO connection management',
      'API token configuration',
      'Sync settings',
      'Work item mapping',
      'Connection testing'
    ],
    tips: [
      'Test your connection before saving settings',
      'Keep API tokens secure and rotate regularly',
      'Configure sync intervals based on your needs'
    ],
    stats: [
      { label: 'Connections', value: '3' },
      { label: 'Synced Items', value: '456' },
      { label: 'Last Sync', value: '2m ago' }
    ],
    lastUpdated: '2025-01-07'
  },

  settings: {
    title: 'Application Settings',
    description: 'Configure application preferences, user settings, and system parameters for optimal performance.',
    status: 'stable',
    version: '1.2.0',
    features: [
      'User preferences',
      'Theme selection',
      'Performance tuning',
      'Data management',
      'Export/Import settings'
    ],
    tips: [
      'Backup your settings before major changes',
      'Use performance mode for better speed',
      'Regularly clean up old data'
    ],
    lastUpdated: '2025-01-06'
  },

  guides: {
    title: 'User Guides',
    description: 'Comprehensive guides and tutorials to help you make the most of the Roadmap Tool features.',
    status: 'stable',
    version: '1.1.0',
    features: [
      'Step-by-step tutorials',
      'Best practice guides',
      'Video walkthroughs',
      'FAQ section',
      'Troubleshooting tips'
    ],
    tips: [
      'Start with the getting started guide',
      'Check FAQ for common questions',
      'Use search to find specific topics'
    ],
    lastUpdated: '2025-01-05'
  },

  documentation: {
    title: 'Technical Documentation',
    description: 'Detailed technical documentation including API references, architecture diagrams, and development guides.',
    status: 'stable',
    version: '1.0.0',
    features: [
      'API documentation',
      'Architecture overview',
      'Development setup',
      'Deployment guides',
      'Troubleshooting'
    ],
    tips: [
      'Keep documentation updated with changes',
      'Use examples to illustrate concepts',
      'Include diagrams for complex workflows'
    ],
    lastUpdated: '2025-01-04'
  },

  coordinator: {
    title: 'Project Coordinator',
    description: 'Financial tracking, timesheet management, labour rates, and actuals import for comprehensive project financial management.',
    status: 'stable',
    version: '1.0.0',
    features: [
      'Timesheet import and tracking',
      'Labour rates management by fiscal year',
      'Actuals import from SAP',
      'Resource master data import',
      'Import history and status tracking',
      'Data validation and error reporting'
    ],
    tips: [
      'Import labour rates at the start of each fiscal year',
      'Import resources before creating allocations',
      'Use the Import Manager for CSV uploads',
      'Check import results for validation errors',
      'Download templates from CSV Templates tab'
    ],
    stats: [
      { label: 'Timesheets', value: '0' },
      { label: 'Actuals', value: '0' },
      { label: 'Labour Rates', value: '0' },
      { label: 'Resources', value: '0' }
    ],
    lastUpdated: '2025-11-09'
  },

  resources: {
    title: 'Resource Management',
    description: 'Manage resources, create commitments, allocate to features, and monitor capacity utilization with integrated working days calculation.',
    status: 'stable',
    version: '1.0.0',
    features: [
      'Resource master data management',
      'Capacity commitment tracking (per-day/week/fortnight)',
      'Feature allocation with forecast dates',
      'Utilization monitoring and status tracking',
      'Working days integration with Calendar module',
      'Cost variance calculation with labour rates',
      'Allocation reconciliation with actual hours',
      'Visual capacity dashboard'
    ],
    shortcuts: [
      { key: 'Ctrl+R', description: 'Refresh Resources' },
      { key: 'Ctrl+C', description: 'Create Commitment' },
      { key: 'Ctrl+A', description: 'Create Allocation' },
      { key: 'Tab', description: 'Switch Tabs' }
    ],
    tips: [
      'Import resources first using CSV template',
      'Create commitments to establish capacity',
      'Allocate resources to features for tracking',
      'Monitor capacity tab for over/under utilization',
      'Utilization: Optimal 70-100%, Under <70%, Over >100%',
      'Working days calculation excludes weekends and holidays',
      'Use search to quickly find resources'
    ],
    documentation: `Resource Management Module

This module allows you to:
- Manage FTE, SOW, and External Squad resources
- Track resource capacity commitments
- Allocate resources to features
- Monitor utilization and capacity

Four Main Tabs:

1. Resources Tab:
   - View all resources in searchable table
   - Filter by name, email, or contract type
   - View allocations for specific resources
   - Display: Name, Email, Contract Type, Work Area, Employee ID

2. Commitments Tab:
   - Create capacity commitments for resources
   - Specify period dates (DD-MM-YYYY format)
   - Choose commitment type: per-day, per-week, per-fortnight
   - Enter committed hours
   - System calculates total available hours using working days

3. Allocations Tab:
   - Allocate resources to features
   - Specify allocated hours and forecast dates
   - View existing allocations with actual vs allocated comparison
   - Track variance hours and status
   - Delete allocations as needed

4. Capacity Tab:
   - Visual dashboard showing resource utilization
   - Cards display: Total Capacity, Allocated, Actual, Remaining
   - Utilization percentage with status indicator
   - Progress bars showing capacity usage
   - Status: Optimal (green), Under-utilized (yellow), Over-committed (red)

Capacity Calculation:
- Total Available Hours = Committed Hours × Working Days
- Working Days = Excludes weekends and public holidays from Calendar
- Allocated Hours = Sum of feature allocations
- Actual Hours = From timesheet imports
- Remaining Capacity = Total - Allocated
- Utilization % = (Actual / Total) × 100

Status Determination:
- Optimal: 70% ≤ utilization ≤ 100%
- Under-utilized: utilization < 70%
- Over-committed: utilization > 100%

Integration:
- Calendar Module: Working days calculation
- Features Module: Feature allocation
- Timesheets: Actual hours tracking
- Labour Rates: Cost variance calculation`,
    stats: [
      { label: 'Total Resources', value: '0' },
      { label: 'With Commitments', value: '0' },
      { label: 'Allocations', value: '0' },
      { label: 'Avg Utilization', value: '0%' }
    ],
    lastUpdated: '2025-11-09'
  },

  calendar: {
    title: 'Calendar Management',
    description: 'Manage working days, public holidays, and work hours by year and month. Import holidays from iCal files and track resource availability.',
    status: 'stable',
    version: '1.0.0',
    features: [
      'Year and month selection',
      'Working days calculation',
      'Weekend days tracking',
      'Public holiday management',
      'Work hours configuration',
      'iCal file import',
      'Holiday data export',
      'Integration with Finance & Resource modules'
    ],
    shortcuts: [
      { key: 'Ctrl+S', description: 'Save Month Data' },
      { key: 'Ctrl+I', description: 'Import Holidays' },
      { key: 'Ctrl+N', description: 'Next Month' },
      { key: 'Ctrl+P', description: 'Previous Month' }
    ],
    tips: [
      'Import public holidays once per year to save time',
      'Use bulk entry to add multiple custom org holidays at once',
      'Public holidays automatically reduce working days',
      'Work hours are calculated as working days × 8',
      'Use notes field to track special events or considerations',
      'Calendar data feeds into cost calculations and resource planning',
      'Custom holidays persist across sessions in the database'
    ],
    documentation: `Calendar Management Module

This module allows you to:
- Configure working days and holidays by month
- Add custom organization holidays manually
- Bulk entry multiple holidays at once
- Import public holidays from iCal (.ics) files
- Track work hours for cost calculations
- Manage resource availability

Key Fields:
- Days: Total days in the month (auto-calculated)
- Working Days: Excludes weekends and public holidays
- Weekend Days: Saturdays and Sundays (auto-calculated)
- Public Holidays: Holidays that impact work hours
- Work Hours: Total available work hours (working days × 8)
- Notes: Additional context for the month

Adding Custom Holidays:

1. Single Holiday Entry:
   - Click "Add Holiday" button
   - Enter holiday name and date (DD-MM-YYYY)
   - Add optional description
   - Mark as recurring if it repeats annually
   - Click "Add Holiday" to save

2. Bulk Entry (Multiple Holidays):
   - Click "Bulk Entry" button
   - Enter holidays one per line: DD-MM-YYYY, Name, Description
   - Example:
     01-01-2025, New Year's Day
     15-03-2025, Company Anniversary, Annual celebration
     25-12-2025, Christmas Day
   - Click "Add All Holidays" to save

3. iCal Import:
   - Click "Import iCal" button
   - Select a .ics file with holiday data
   - Review imported holidays in preview
   - Confirm to add holidays to database

Data Persistence:
- All holidays are saved to SQLite database on disk
- Data persists across application restarts
- Holidays are automatically loaded when app runs
- No manual save required

Integration:
- Finance Module: Work hours used for cost calculations
- Resource Module: Calendar data feeds resource effort consumption
- Project Planning: Consider holidays when setting timelines`,
    stats: [
      { label: 'Years Configured', value: '3' },
      { label: 'Holidays', value: '42' },
      { label: 'Avg Work Days/Month', value: '21' },
      { label: 'Avg Work Hours/Month', value: '168' }
    ],
    lastUpdated: '2025-11-04'
  }
};
