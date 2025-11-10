# Implementation Notes & Bug Prevention Guide

## Critical Bug Fixes Applied - DO NOT REPEAT

### 1. Status Value Consistency ⚠️ **CRITICAL**

**Problem**: Status enums must be consistent across all layers.

**Correct Status Values**: `'planned' | 'in-progress' | 'blocked' | 'done' | 'archived'`

**Files that MUST use these exact values**:
- `app/main/services/ProjectService.ts` - Line 4: `export type ProjectStatus`  
- `app/main/ipc/projectHandlers.ts` - Line 163: `validStatuses` array
- `app/main/preload.ts` - Lines 11, 26: status type definitions
- All UI components in `app/renderer/components/`
- All state files in `app/renderer/state/`

**NEVER use**: `'active'`, `'completed'`, `'on-hold'`, `'cancelled'` - these cause data filtering bugs.

### 2. API Layer Consistency ⚠️ **CRITICAL**

**Problem**: Mixed usage of old and new APIs causes data not to display.

**Correct API Usage**:
```typescript
// ✅ CORRECT - Use ProjectService API
const response = await window.electronAPI.getAllProjects();
if (response.success && response.data) {
  // Handle data
}

// ❌ WRONG - Legacy API (will miss new status filtering)
const projects = await window.electronAPI.getProjects();
```

**Files Using New API**:
- `app/renderer/state/store.ts` - `loadProjects()` method
- `app/renderer/stores/projectStore.ts` - All methods
- Any new components

### 3. Budget Data Format ⚠️ **CRITICAL**

**Problem**: Backend stores `budget_cents`, UI expects `budget_nzd`.

**Data Conversion Pattern**:
```typescript
// ✅ Loading from DB (cents → NZD)
const convertedProjects = response.data.map(project => ({
  ...project,
  budget_nzd: (project.budget_cents || 0) / 100
}));

// ✅ Saving to DB (NZD → cents via string)
const createRequest = {
  ...projectData,
  budget_nzd: nzdAmount.toString() // ProjectService converts internally
};
```

**Required in**:
- `app/renderer/state/store.ts` - Lines 413-417 (loading conversion)
- `app/renderer/state/store.ts` - Line 450 (saving conversion)

### 4. Null Safety for Currency Display ⚠️ **CRITICAL**

**Problem**: `toLocaleString()` fails on undefined budget values.

**Safe Display Pattern**:
```typescript
// ✅ CORRECT
<strong>Budget:</strong> NZD ${(project.budget_nzd || 0).toLocaleString('en-NZ', { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
})}

// ❌ WRONG - Will crash on undefined
<strong>Budget:</strong> NZD ${project.budget_nzd.toLocaleString()}
```

## Implementation Checklist for New Features

### When Adding New Project Fields:
1. ✅ Add to database schema in `app/main/db.ts`
2. ✅ Add to `Project` interface in `app/main/services/ProjectService.ts`
3. ✅ Add to `CreateProjectRequest` interface
4. ✅ Add validation in `validateProject()` method
5. ✅ Update preload types in `app/main/preload.ts`
6. ✅ Add UI components with null safety
7. ✅ Test with undefined/null values

### When Adding New Status Values:
1. ✅ Update ALL status type definitions (see Section 1)
2. ✅ Update validation arrays in all services
3. ✅ Update UI dropdown options
4. ✅ Update CSS classes for status display
5. ✅ Test database queries return correct results

### When Adding New API Endpoints:
1. ✅ Add to ProjectService class
2. ✅ Add IPC handler in `projectHandlers.ts`
3. ✅ Add to preload API interface
4. ✅ Update store methods to use new endpoint
5. ✅ Maintain data format consistency

## Testing Requirements

### Before Any Commit:
```bash
# 1. Build both processes
npm run build:main
npm run build:renderer

# 2. Start application and test:
# - Load projects (should show ALL projects)
# - Click on project details (should not crash)
# - Create new project (should appear immediately)
# - Budget displays as proper NZD format
# - All status values work in dropdowns
# - Statistics panel shows real data (not zeros)
# - "Create Sample Projects" button works without errors
# - Form fields have white backgrounds and black text
# - All form labels are visible and descriptive
```

### Data Validation Tests:
1. **Empty database** - Should show "no projects" message
2. **Projects with null budgets** - Should display "$0.00"
3. **Projects with all status types** - All should be visible
4. **Large budget values** - Should format with commas
5. **Invalid status in database** - Should handle gracefully
6. **Statistics accuracy** - Numbers should match actual project counts
7. **Lane statistics** - Unique lanes and top lane should be accurate
8. **Form usability** - All fields clearly labeled and styled
9. **Sample project creation** - Should create 24 projects without errors
10. **Real-time updates** - Statistics should update immediately after creating projects

## Common Pitfalls to Avoid

### ❌ Data Format Mismatches
```typescript
// WRONG - Mixing data formats
project.budget_cents = project.budget_nzd; // Types don't match!

// WRONG - Inconsistent conversions  
budget_nzd = budget_cents * 100; // Should be divide by 100!
```

### ❌ API Mixing
```typescript
// WRONG - Using old API with new status validation
const projects = await window.electronAPI.getProjects(); // Old API
projects.filter(p => p.status === 'planned'); // New status won't exist!
```

### ❌ Missing Null Checks
```typescript
// WRONG - Will crash
project.budget_nzd.toLocaleString();
project.description.trim();

// CORRECT
(project.budget_nzd || 0).toLocaleString();
project.description?.trim() || '';
```

## File-Specific Notes

### `app/main/services/ProjectService.ts`
- **Line 4**: Status enum is the source of truth
- **Lines 139-141**: Status validation must match exactly
- **Lines 418-423**: Stats initialization needs all status values

### `app/renderer/state/store.ts`
- **Line 411**: Must use `getAllProjects()` not `getProjects()`
- **Lines 413-417**: Budget conversion is mandatory
- **Line 450**: Budget string conversion for API compatibility

### `app/renderer/components/ProjectDetailView.tsx`
- **Lines 210, 215**: Budget display needs null safety
- **Line 217**: Complex budget calculation needs null safety

## Version Compatibility

### Current Implementation (v2024.10):
- **Backend**: ProjectService API with `budget_cents`
- **Frontend**: Legacy UI expecting `budget_nzd`
- **Bridge**: Data conversion in store layer

### Migration Path for Future:
1. **Phase 1** (Current): Conversion in store layer
2. **Phase 2** (Future): Update UI to use `budget_cents` directly
3. **Phase 3** (Future): Remove legacy API endpoints

## Error Messages to Watch For

If you see these errors, you've likely introduced one of the fixed bugs:

- `Cannot read properties of undefined (reading 'toLocaleString')` → Missing null safety
- `Status must be one of: active, completed...` → Wrong status enum used  
- `Projects not displaying` → Wrong API or status mismatch
- `Budget showing as $0.00` → Missing budget conversion
- `Failed to create sample projects. Please check console` → Status validation error
- `Statistics showing 0 when projects exist` → InfoPane dependency issue
- `Form fields have colored backgrounds` → Missing explicit white background
- `Placeholder text not visible` → Missing placeholder styling

## Contact & Questions

If you encounter similar data consistency issues:
1. Check this document first
2. Verify data format conversions are in place
3. Ensure API consistency across all layers
4. Test with null/undefined values

## Recent Fixes (October 2025)

### 5. Project Statistics Not Displaying ✅ **FIXED**

**Problem**: Statistics panel showing 0 for all project counts despite database having projects.

**Root Cause**: InfoPane `useMemo` dependency wasn't properly tracking project store changes.

**Solution Applied**:
```typescript
// ✅ FIXED - Added projects object to dependencies
const { getProjectsAsArray, projects } = useAppStore();

const projectStats = useMemo(() => {
  // statistics calculation
}, [projects, getProjectsAsArray]); // Added 'projects' dependency
```

**Files Updated**:
- `app/renderer/components/InfoPane.tsx` - Lines 24, 88, 123

**Result**: Statistics now update in real-time when projects are loaded/changed.

### 6. Project Statistics Enhancement ✅ **COMPLETED**

**Enhancement**: Added lane-based statistics and improved project analytics.

**New Statistics Added**:
- **Unique Lanes**: Count of different project categories
- **Top Lane**: Most popular project lane  
- **Enhanced Status Counts**: All status types tracked separately
- **Dynamic Budget Calculation**: Real-time total and average budgets

**Dashboard Stats**: Total Projects, Active Projects, Unique Lanes, Total Budget
**Projects Stats**: All status counts, lane analytics, budget analytics (10 metrics total)

### 7. Project Form Styling Issues ✅ **FIXED** 

**Problem**: Project edit form fields had unclear styling and missing visual cues.

**Issues Fixed**:
- ✅ **Field Labels**: All fields now have clear, descriptive labels
- ✅ **White Backgrounds**: All input fields explicitly set to white background
- ✅ **Black Text**: All input text explicitly set to black color
- ✅ **Placeholder Styling**: Proper gray placeholder text across browsers
- ✅ **Form Layout**: Responsive grid layout with proper spacing

**CSS Updates**:
```css
/* Enhanced form input styling */
.form-input {
  background-color: white;
  color: #333;
}

/* Cross-browser placeholder styling */
.form-input::placeholder { color: #999; }
```

**Files Updated**:
- `app/renderer/components/ProjectEditForm.tsx` - Inline styles for all fields
- `app/renderer/styles/globals.css` - Lines 227-228, 251-268

**Form Fields Enhanced**:
1. **Project ID*** - Clear labeling with format example
2. **Project Title*** - Required field indicator
3. **Lane** - Category field with examples
4. **Project Manager** - PM assignment field
5. **Start Date*** - DD-MM-YYYY format with validation
6. **End Date*** - Date validation with range checking
7. **Status*** - Dropdown with all valid statuses
8. **Budget (NZD)** - Numeric input with proper formatting
9. **Financial Treatment** - CAPEX/OPEX dropdown
10. **Description** - Full-width textarea

### 8. Sample Project Creation Enhancement ✅ **COMPLETED**

**Enhancement**: Improved sample project generation with realistic data spread.

**Features Added**:
- **24 Diverse Projects**: Different categories and domains
- **Randomized Dates**: Projects span 24 months from today
- **Variable Durations**: 1-12 month project lengths
- **Random Budgets**: $10k-$500k range with realistic distribution
- **Lane Diversity**: 15+ different project lanes/categories
- **Status Distribution**: Weighted random status (40% in-progress, 30% planned, etc.)

**Project Categories**: Digital, Infrastructure, Security, Analytics, DevOps, Quality, FinTech, AI/ML, and more

---
**Last Updated**: 2025-10-16  
**Fixed Issues**: Status consistency, API layer, budget format, null safety, statistics display, form styling, sample data generation
