# Roadmap Electron - Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** December 7, 2025  
**Status:** Production - 75% Complete  
**Target Users:** Project Managers, Portfolio Managers, Financial Coordinators  
**Platform:** Desktop (Windows 11 primary, macOS/Linux supported)

---

## Executive Summary

Roadmap Electron is a comprehensive desktop project management and portfolio governance application built with Electron, React 19, TypeScript, and SQLite. It provides enterprise-grade project planning, financial tracking, and governance capabilities with optional Azure DevOps integration.

### Current State
- **Core Features:** Fully operational
- **Financial Module:** Complete and production-ready
- **Governance Module:** 25% complete (parked for Q2 2026)
- **Reporting Module:** Not started

### Key Differentiators
1. **Offline-First Architecture** - Works entirely offline with local SQLite database
2. **New Zealand Localization** - DD-MM-YYYY dates, NZD currency formatting
3. **Financial Integration** - SAP data import and variance tracking
4. **Multi-view Timeline** - Standard, Dependency, and Fortnight views
5. **Enterprise Security** - AES-256-GCM encryption for sensitive data

---

## System Requirements

### Minimum Requirements
- **OS:** Windows 11, macOS 10.14+, Ubuntu 20.04+
- **RAM:** 4GB
- **Storage:** 500MB available space
- **Display:** 1366x768 resolution
- **Network:** Optional (required only for ADO sync and holiday API)

### Recommended Requirements
- **OS:** Windows 11 Pro
- **RAM:** 8GB+
- **Storage:** 2GB available space
- **Display:** 1920x1080 or higher
- **Network:** LAN/Internet for team features

---

## Feature Specifications

### 1. Core Project Management ✅ COMPLETE

#### 1.1 Projects
- **Create/Edit/Delete** projects with full CRUD operations
- **Fields:**
  - Title (required, max 200 chars)
  - Description (optional, max 1000 chars)
  - Lane (organizational grouping)
  - Start/End dates (DD-MM-YYYY format)
  - Status: `planned | in-progress | blocked | done | archived`
  - PM Name (Project Manager)
  - Budget (NZD, 2 decimal places, stored as cents)
  - Financial Treatment: `CAPEX | OPEX`
  - Row position (for timeline placement)

#### 1.2 Tasks
- **Linked to Projects** via project_id foreign key
- **Fields:**
  - Title (required)
  - Start/End dates (DD-MM-YYYY)
  - Effort hours
  - Status (same as project status)
  - Assigned resources (JSON array)

#### 1.3 Dependencies
- **Types:** Finish-to-Start (FS), Start-to-Start (SS), Finish-to-Finish (FF), Start-to-Finish (SF)
- **Visual Connection:** Click "+" on source bar, click target bar
- **Validation:** 
  - Cycle detection using DFS algorithm
  - No self-links
  - No duplicate dependencies
- **Lag days:** Support for positive/negative lag

### 2. Timeline Views ✅ COMPLETE

#### 2.1 Standard Timeline
- **Multi-row Layout:** Automatic row allocation to prevent overlaps
- **Drag & Drop:** Move projects horizontally (time) and vertically (rows)
- **Resize:** Drag bar edges to adjust duration
- **Zoom Levels:** Day, Week, Month, Quarter, Year
- **Grid Snapping:** Bars snap to day boundaries

#### 2.2 Gantt Chart
- **Pixel-based Rendering:** Precise positioning
- **Fullscreen Mode:** Maximize view area
- **Scroll Sync:** Header stays visible while scrolling
- **Today Line:** Visual indicator of current date
- **Weekend Shading:** Different background for non-working days

#### 2.3 Fortnight View (FY-based)
- **26 Fortnights:** F01-F26 from April 1st
- **Fiscal Year:** April to March (NZ standard)
- **Column Layout:** Months as headers, fortnights as columns
- **Bar Snapping:** Projects snap to fortnight boundaries

### 3. Epic & Feature Management ✅ COMPLETE

#### 3.1 Epic Creation
- **Sizing:** XS, S, M, L, XL
- **Risk Levels:** Low, Medium, High, Critical
- **Value Areas:** Business, Technology, Customer
- **ADO Integration Fields:** Area Path, Iteration Path, Tags

#### 3.2 Feature Linking
- **Parent-Child Relationship:** Features belong to Epics
- **Inheritance:** Features inherit project context
- **Batch Operations:** Create multiple features at once

#### 3.3 Configuration Management
- **LocalStorage-based:** User preferences persist locally
- **Export/Import:** 
  - Epic-Feature-Defaults.csv
  - Epic-Feature-Team-Members.csv
  - Epic-Feature-Paths.csv
- **Toggle Options:** Selective export of configuration areas

### 4. Calendar Management ✅ COMPLETE

#### 4.1 Working Days
- **Monthly Configuration:** Set working days per month
- **Public Holidays:** NZ holidays with API integration
- **Holiday Periods:** Multi-day spans (e.g., Christmas break)
- **Recurrence:** Annual, monthly, weekly patterns

#### 4.2 Capacity Calculation
- **Work Hours:** Calculate based on calendar
- **Resource Availability:** Consider holidays and working days
- **Effort Tracking:** Compare planned vs actual

### 5. Financial Coordinator Module ✅ COMPLETE

#### 5.1 Data Import
**Three Import Types:**
1. **SAP Timesheets**
   - Employee hours by WBS element
   - Period-based data
   - Activity type mapping

2. **SAP Actuals**
   - Actual costs from financial system
   - Cost center mapping
   - Period reconciliation

3. **Labour Rates**
   - Hourly rates by activity type
   - Fiscal year specific (e.g., FY26)
   - CAPEX/OPEX differentiation

#### 5.2 Resource Management
- **CRUD Operations:** Create, Read, Update, Delete resources
- **Fields:**
  - Name, Email, Employee ID
  - Contract Type: FTE, SOW, External Squad
  - Work Area/Role
  - Activity Types (CAP/OPX)
- **Search/Filter:** Multi-field search capability

#### 5.3 Resource Commitments
- **Capacity Definition:** Hours per day/week/fortnight
- **Period-based:** Start and end dates
- **Total Calculation:** Automatic total hours computation
- **Utilization Tracking:** Allocated vs available

#### 5.4 Variance Detection & Alerts
**Alert Types:**
- Timesheet without allocation
- Capacity exceeded (>100% utilized)
- Allocation variance (planned vs actual)
- Schedule variance (timeline shifts)
- Cost variance (budget vs actual)

**Alert Management:**
- Severity levels: Critical, High, Medium, Low
- Acknowledgment workflow
- Filter by type and severity
- Show/hide acknowledged

#### 5.5 Project Finance Dashboard
- **P&L View:** Profit & Loss by workstream
- **Metrics:**
  - Budget (original plan)
  - Forecast (calculated from allocations)
  - Actual (from SAP imports)
  - Variance (actual - forecast)
- **Visualization:** Color-coded (green = under, red = over)
- **Period Selection:** Filter by month/quarter

### 6. ADO Integration ✅ 95% COMPLETE

#### 6.1 Configuration
- **Connection Settings:**
  - Organization URL
  - Project name
  - PAT token (encrypted storage)
  - Token expiry tracking
- **Connection Test:** Verify before saving

#### 6.2 Synchronization
- **Export to ADO:** Push epics/features
- **Tag Management:** Category and value configuration
- **Field Mapping:** Map local fields to ADO fields
- **Webhook Support:** Real-time updates (infrastructure ready)

**Pending Features (5%):**
- Real-time bi-directional sync
- Conflict resolution UI
- Bulk update operations

### 7. Data Export/Import ✅ COMPLETE

#### 7.1 Export Capabilities
- **Format:** ZIP archive containing CSV files
- **Areas:**
  - Projects & Tasks
  - Epics & Features
  - Dependencies
  - Calendar & Holidays
  - ADO Configuration
  - Epic/Feature Configuration
- **Naming:** Descriptive filenames (Projects.csv, Tasks.csv, etc.)

#### 7.2 Import Capabilities
- **Validation:** Row-by-row validation with error reporting
- **Error Handling:** Continue on error with detailed log
- **Auto-reload:** UI refreshes after successful import
- **Format Requirements:** Documented CSV structure

### 8. Security & Audit ✅ COMPLETE

#### 8.1 Encryption
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Protected Data:**
  - PAT tokens
  - Webhook secrets
  - Sensitive configuration

#### 8.2 Audit Logging
- **Tracked Events:**
  - User interactions
  - Data modifications
  - Navigation
  - Errors with context
- **Storage:** audit_events table
- **Fields:** timestamp, user, action, module, entity

#### 8.3 Backup & Restore
- **Automatic Backups:** Before migrations
- **Manual Backups:** User-triggered
- **Compression:** Gzip for storage efficiency
- **Restore Options:** Full or selective

### 9. Governance Module ⏸️ PARKED (25% Complete)

#### 9.1 Completed Infrastructure
- **Database Schema:** 14 tables, 53 indexes
- **Default Data:** 7 gates, 6 policies
- **Type Definitions:** Complete TypeScript types
- **Validation Layer:** Input validation rules

#### 9.2 Planned Features (Not Implemented)
- **Stage Gates:** Project progression tracking
- **Policy Compliance:** Track adherence to governance policies
- **Decision Logging:** RACI matrix, action items
- **Escalation Management:** Issue escalation workflow
- **Benefits Tracking:** Realization monitoring
- **Portfolio Analytics:** Health scores, metrics

**Status:** Development paused, showing "Coming Soon" in UI
**Target Release:** Q2 2026

### 10. Reporting Module 🔴 NOT STARTED

#### 10.1 Planned Reports
- Executive summaries
- Portfolio health dashboards
- Financial variance reports
- Resource utilization
- Compliance audits
- Gate progression

#### 10.2 Export Formats
- PDF generation
- Excel workbooks
- PowerPoint presentations
- Interactive HTML

**Estimated Effort:** 4-6 weeks
**Priority:** Low (post-v1.0)

---

## User Interface Specifications

### Design Principles
1. **Clean & Modern:** Minimal, professional appearance
2. **Information Density:** Show maximum useful data
3. **Responsive Layout:** Adapt to screen sizes
4. **Consistent Patterns:** Reusable components
5. **Accessibility:** Keyboard navigation, ARIA labels

### Component Library
- **Inputs:** Text, Date, Currency, Select, ComboBox, TextArea
- **Modals:** Base, Confirmation, Form
- **Tables:** Sortable, filterable, paginated
- **Charts:** Gantt, Timeline, Bar charts
- **Navigation:** Sidebar, breadcrumbs, tabs

### Color Scheme
- **Primary:** Blue (#0066CC)
- **Success:** Green (#00AA44)
- **Warning:** Yellow (#FFAA00)
- **Error:** Red (#CC0000)
- **Neutral:** Grays (#333 to #F5F5F5)

---

## Technical Architecture

### Frontend Stack
- **Framework:** React 19.2.0
- **Language:** TypeScript 5.9.3
- **Build Tool:** Vite 7.1.9
- **State Management:** Zustand 5.0.8 + Local state
- **Styling:** CSS modules + Inline styles

### Backend Stack
- **Runtime:** Electron 38.2.2 (Node.js)
- **Database:** SQLite with better-sqlite3 12.4.1
- **IPC:** Electron's contextBridge
- **Security:** Node.js crypto module

### Data Flow
1. User interaction in React component
2. IPC call via window.electronAPI
3. Main process handler processes request
4. Service layer executes business logic
5. Database operation via prepared statements
6. Response sent back through IPC
7. React component updates UI

---

## Performance Requirements

### Response Times
- **Page Load:** < 1 second
- **Data Operations:** < 500ms for CRUD
- **Search:** < 200ms for filtering
- **Export:** < 5 seconds for full export
- **Import:** < 10 seconds for 1000 records

### Scalability
- **Projects:** Support 10,000+ projects
- **Tasks:** Support 50,000+ tasks
- **Resources:** Support 1,000+ resources
- **Concurrent Users:** Single user (desktop app)

### Optimization Strategies
- Database indexes (36+ for Financial module)
- Prepared statements for queries
- Transaction batching
- Code splitting
- Lazy loading

---

## Quality Requirements

### Testing Coverage
- **Unit Tests:** 80% target (currently ~40%)
- **Integration Tests:** Critical paths
- **E2E Tests:** User journeys
- **Security Tests:** Encryption, validation

### Code Quality
- **TypeScript:** Strict mode enabled
- **ESLint:** Automated linting
- **Prettier:** Code formatting
- **Documentation:** JSDoc comments

### Reliability
- **Error Handling:** Graceful degradation
- **Data Integrity:** Foreign key constraints
- **Backup:** Automatic before migrations
- **Recovery:** Database repair tools

---

## Deployment & Distribution

### Packaging
- **Windows:** NSIS installer (.exe)
- **macOS:** DMG disk image
- **Linux:** AppImage

### Installation
- **Silent Install:** Command-line options
- **Custom Directory:** User-selectable
- **Auto-update:** Built-in updater (planned)

### Data Storage
- **Windows:** %APPDATA%\RoadmapTool\
- **macOS:** ~/Library/Application Support/RoadmapTool/
- **Linux:** ~/.config/RoadmapTool/

---

## Success Metrics

### User Adoption
- Target: 50+ active users in first quarter
- Metric: Daily active users (DAU)

### Performance
- Target: 95% of operations < 500ms
- Metric: Response time percentiles

### Reliability
- Target: 99.9% uptime
- Metric: Crash-free sessions

### User Satisfaction
- Target: 4.5/5 rating
- Metric: User feedback surveys

---

## Risk Mitigation

### Technical Risks
1. **Database Corruption**
   - Mitigation: Automatic backups, WAL mode
   
2. **Performance Degradation**
   - Mitigation: Indexes, query optimization
   
3. **Security Breach**
   - Mitigation: Encryption, secure storage

### Business Risks
1. **ADO API Changes**
   - Mitigation: Version checking, graceful fallback
   
2. **Requirement Changes**
   - Mitigation: Modular architecture, iterative development

---

## Release Timeline

### Version 1.0 (Q1 2026)
- ✅ Core project management
- ✅ Financial coordinator
- ✅ ADO integration (basic)
- ✅ Export/Import
- ⚠️ Basic governance features

### Version 1.1 (Q2 2026)
- Complete governance module
- Advanced ADO sync
- Basic reporting

### Version 2.0 (Q3 2026)
- Full reporting suite
- Team collaboration
- Mobile companion app

---

## Appendices

### A. Glossary
- **WBS:** Work Breakdown Structure
- **SAP:** Systems, Applications & Products
- **ADO:** Azure DevOps
- **PAT:** Personal Access Token
- **FY:** Fiscal Year (April-March in NZ)
- **CAPEX:** Capital Expenditure
- **OPEX:** Operating Expenditure

### B. References
- Architecture Document: ARCHITECTURE.md
- Implementation Status: MODULE-IMPLEMENTATION-STATUS.md
- Financial Module: FINANCIAL-COORDINATOR-COMPLETE.md
- Quick Reference: docs/QUICK-REFERENCE.md

---

**Document Status:** Complete
**Review Cycle:** Monthly
**Owner:** Development Team
**Last Reviewed:** December 7, 2025