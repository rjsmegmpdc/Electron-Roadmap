# All CSV Templates - COMPLETE ✅

**Date Completed:** Current Session  
**Total Templates:** 13

## Overview

Complete set of CSV templates created for all Import/Export data areas in the Roadmap Electron application. Each template includes properly formatted headers and sample data.

## Templates Created

### Core Roadmap Data (4 templates)

#### 1. **projects-template.csv**
- **Purpose:** Import/export project roadmap data
- **Columns:** id, title, description, lane, start_date, end_date, status, pm_name, budget_nzd, financial_treatment, row
- **Sample Rows:** 3 projects with varying budgets and lanes
- **Date Format:** DD-MM-YYYY
- **Currency:** NZD with comma thousands separator
- **Status Values:** planned, in-progress, blocked, done, archived
- **Financial Treatment:** CAPEX or OPEX

#### 2. **tasks-template.csv**
- **Purpose:** Import/export tasks linked to projects
- **Columns:** id, project_id, title, start_date, end_date, effort_hours, status, assigned_resources
- **Sample Rows:** 4 tasks with JSON array for assigned resources
- **Assigned Resources Format:** `["Name1","Name2"]` (JSON array as string)
- **References:** project_id must match existing projects

#### 3. **epics-template.csv**
- **Purpose:** Import/export Epic work items
- **Columns:** id, project_id, title, description, state, effort, business_value, time_criticality, start_date, end_date, assigned_to, area_path, iteration_path, risk, value_area, parent_feature, sort_order
- **Sample Rows:** 3 epics across different projects
- **Path Format:** `\Project\Area` (backslash-separated)
- **State Values:** New, Active, Resolved, Closed
- **Risk Values:** Low, Medium, High

#### 4. **features-template.csv**
- **Purpose:** Import/export Feature work items
- **Columns:** id, epic_id, project_id, title, description, state, effort, business_value, time_criticality, start_date, end_date, assigned_to, area_path, iteration_path, risk, value_area, sort_order
- **Sample Rows:** 4 features linked to epics
- **References:** epic_id and project_id must match existing records
- **Value Area:** Business or Architectural

### Dependencies (1 template)

#### 5. **dependencies-template.csv**
- **Purpose:** Import/export dependencies between work items
- **Columns:** id, from_type, from_id, to_type, to_id, kind, lag_days, note
- **Sample Rows:** 4 dependencies (project-to-project, task-to-task, epic-to-epic, feature-to-feature)
- **Types:** project, task, epic, feature
- **Kind Values:** FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)
- **Lag Days:** Integer (positive or negative)

### Calendar Module (2 templates)

#### 6. **calendar-months-template.csv**
- **Purpose:** Import/export monthly working day configuration
- **Columns:** year, month, days, working_days, weekend_days, public_holidays, work_hours, notes
- **Sample Rows:** Full year 2024 (12 months)
- **Work Hours Calculation:** working_days × 8
- **Notes:** Optional descriptions for special circumstances

#### 7. **public-holidays-template.csv**
- **Purpose:** Import/export public holiday definitions
- **Columns:** name, start_date, end_date, description, is_recurring, source
- **Sample Rows:** 10 NZ public holidays for 2024
- **Date Format:** YYYY-MM-DD (ISO format for holidays)
- **Recurring:** true/false (e.g., Christmas is recurring, Queen's Birthday date changes)
- **Source:** manual, government, imported

### Settings (1 template)

#### 8. **app-settings-template.csv**
- **Purpose:** Import/export application settings
- **Columns:** key, value
- **Sample Rows:** 10 common settings
- **Format:** Key-value pairs
- **Example Keys:** theme, defaultLane, dateFormat, workHoursPerDay, fiscalYearStart

### ADO Integration (2 templates)

#### 9. **ado-config-template.csv**
- **Purpose:** Import/export Azure DevOps configuration
- **Columns:** org_url, project_name, auth_mode, is_enabled, max_retry_attempts, base_delay_ms
- **Sample Rows:** 1 ADO configuration
- **Note:** PAT tokens are NOT exported for security reasons
- **Auth Mode:** PAT (Personal Access Token)

#### 10. **ado-tags-template.csv**
- **Purpose:** Import/export ADO tag categories and values
- **Columns:** category, tag_name, tag_value, is_active, sort_order
- **Sample Rows:** 12 tags across 4 categories
- **Categories:** Priority, Value Area, Risk, State
- **Active Status:** true/false

### Project Coordinator (3 templates)

#### 11. **labour-rates-template.csv**
- **Purpose:** Import hourly/daily rates by band and activity type
- **Structure:** Title rows (2) + Header + Data
- **Columns:** Band, [Local Description], Activity Type, Hourly Rate, Daily Rate, $ Uplift, % Uplift
- **Sample Rows:** 14 rate entries (N1-N6 bands, CAP/OPX activities)
- **Validation:** Daily rate should be ~8× hourly rate
- **Import With:** Fiscal year parameter (e.g., FY26)

#### 12. **resources-template.csv**
- **Purpose:** Import resource master data
- **Columns:** Roadmap_ResourceID, ResourceName, Email, WorkArea, ActivityType_CAP, ActivityType_OPX, Contract Type, EmployeeID
- **Sample Rows:** 5 resources (FTE, SOW, External Squad)
- **Contract Types:** FTE, SOW, External Squad (exact match required)
- **Activity Types:** N1_CAP through N6_OPX format
- **Conflict Resolution:** Upserts on employee_id

#### 13. **epic-feature-config-template.csv**
- **Purpose:** Configure defaults for Epic/Feature creation
- **Structure:** Title rows + Header + Configuration rows
- **Config Types:** Common, Epic, Feature, Iteration, AreaPath
- **Columns:** 32 columns covering all configuration options
- **Import Location:** Export & Import module

## Template Mapping to Data Areas

| Data Area | Template Files | Notes |
|-----------|---------------|-------|
| Projects | projects-template.csv | Single file |
| Tasks | tasks-template.csv | Single file |
| Work Items | epics-template.csv, features-template.csv, dependencies-template.csv | 3 files exported as ZIP |
| Calendar Configuration | calendar-months-template.csv | Single file |
| Public Holidays | public-holidays-template.csv | Single file |
| Application Settings | app-settings-template.csv | Single file |
| ADO Configuration | ado-config-template.csv | Tokens not exported |
| ADO Tags | ado-tags-template.csv | Single file |
| Epic & Feature Config | epic-feature-config-template.csv | Single file |

**Note:** Work Items data area exports 3 separate CSVs in a single ZIP file.

## Access Methods

### Via UI
1. Navigate to **Export & Import** module
2. Click **📋 CSV Templates** tab
3. Click **📂 Open Template** on desired template
4. File opens in default CSV editor (Excel, etc.)

### Via File System
All templates located in: `C:\Users\smhar\Roadmap-Electron\`

## Import Workflows

### Standard Import (Most data areas)
1. Open template from Templates tab
2. Edit with your data
3. Save file
4. Go to Export & Import → Import
5. Select data area(s)
6. Choose your CSV file(s)
7. Import

### Project Coordinator Imports
1. Open template from Templates tab
2. Edit with your data
3. Save file
4. Go to **Project Coordinator Dashboard** → **Import Manager**
5. Select import type from dropdown
6. For Labour Rates: Enter fiscal year
7. Choose your CSV file
8. Import

## Format Standards

### Date Formats
- **Projects/Tasks/Epics/Features:** DD-MM-YYYY (e.g., 25-12-2024)
- **Public Holidays:** YYYY-MM-DD (ISO format)
- **Calendar Months:** Year and Month as integers

### Currency Format
- **Accepted:** `$1,500.00`, `1500.00`, `1500`, `$1,500`
- **Decimal Places:** Maximum 2
- **Thousands Separator:** Comma (optional)

### Boolean Values
- **Accepted:** true, false
- **Case:** Lowercase preferred

### Text Fields
- **Encoding:** UTF-8
- **Quotes:** Use for fields containing commas
- **Line Breaks:** Avoid within fields

### References (Foreign Keys)
- **project_id:** Must match projects.id
- **epic_id:** Must match epics.id
- **task_id:** Must match tasks.id
- **feature_id:** Must match features.id
- Referential integrity enforced on import

## Validation Rules

### Projects
- Start date must be before end date
- Status must be: planned, in-progress, blocked, done, or archived
- Financial treatment must be: CAPEX or OPEX
- Budget must be non-negative

### Tasks
- Effort hours must be non-negative
- Assigned resources must be valid JSON array
- Project ID must exist

### Epics & Features
- Effort values: Integer (Fibonacci or T-shirt sizing)
- Business value: 0-100
- Time criticality: 0-100
- State must be valid ADO state

### Dependencies
- From and to IDs must reference existing items
- Kind must be: FS, SS, FF, or SF
- Cannot create circular dependencies

### Labour Rates
- Hourly rate ≥ 0
- Daily rate ≥ 0
- Daily rate should be ~8× hourly (warning if not)

### Resources
- Contract Type must be: FTE, SOW, or External Squad
- Activity Types must match: N[1-6]_(CAP|OPX)
- Employee ID must be unique

## Common Import Errors

### "Invalid date format"
- **Cause:** Wrong date format
- **Fix:** Use DD-MM-YYYY for roadmap data, YYYY-MM-DD for holidays

### "Foreign key constraint failed"
- **Cause:** Referenced ID doesn't exist
- **Fix:** Ensure projects/epics/tasks exist before importing dependent data

### "Invalid status/state"
- **Cause:** Typo or incorrect value
- **Fix:** Check exact allowed values in templates

### "JSON parse error"
- **Cause:** Malformed assigned_resources field
- **Fix:** Use proper JSON format: `["Name1","Name2"]`

### "Invalid currency amount"
- **Cause:** Non-numeric characters in rate fields
- **Fix:** Remove text, keep only numbers and optional $ and commas

## Best Practices

1. **Import Order Matters:**
   - Import projects before tasks/epics/features
   - Import epics before features
   - Import work items before dependencies

2. **Start Small:**
   - Test with 2-3 rows first
   - Verify before importing full dataset

3. **Maintain Referential Integrity:**
   - Keep IDs consistent across related files
   - Don't delete referenced items

4. **Backup Before Import:**
   - Export current data before importing new data
   - Keep backups of working templates

5. **Validate Before Import:**
   - Check dates are in correct format
   - Verify all required fields have values
   - Ensure IDs are unique

## Related Documentation

- **CSV-TEMPLATES-GUIDE.md** - User guide
- **epic-feature-config-import-guide.md** - Epic/Feature config details
- **Export/Import Module Documentation** - Full module guide
- **Project Coordinator Guide** - Coordinator import details

---

**Status:** ✅ ALL TEMPLATES COMPLETE

All 13 CSV templates have been created with proper formatting, sample data, and documentation. Users can now easily import data into any module of the Roadmap Electron application.
