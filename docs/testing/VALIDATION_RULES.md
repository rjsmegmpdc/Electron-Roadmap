# Validation Rules & Error Messages Reference

**Purpose:** Complete reference for validation rules and error messages  
**Last Updated:** December 5, 2025  
**Audience:** Junior developers writing tests and validating user input

---

## Table of Contents

- [Overview](#overview)
- [ProjectService Validation](#projectservice-validation)
- [TaskService Validation](#taskservice-validation)
- [DependencyService Validation](#dependencyservice-validation)
- [Testing Validation](#testing-validation)

---

## Overview

All service layer methods (ProjectService, TaskService, DependencyService) validate input data before persisting to the database. This document lists:
- All validation rules
- Exact error messages returned
- How to test for specific validation errors
- Edge cases and special behaviors

**Service Response Pattern:**
```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;        // Only present if success=true
  errors?: string[]; // Only present if success=false
}
```

---

## ProjectService Validation

### Project Title

**Rules:**
- Required (cannot be empty or whitespace-only)
- Maximum 200 characters (after trimming)
- Automatically trimmed before storage

**Error Messages:**
```typescript
"Project title is required"
"Project title must be 200 characters or less"
```

**Examples:**
```typescript
// ❌ Empty title
{ title: '' }
// Error: "Project title is required"

// ❌ Whitespace only
{ title: '   ' }
// Error: "Project title is required"

// ❌ Too long
{ title: 'A'.repeat(201) }
// Error: "Project title must be 200 characters or less"

// ✅ Valid - exactly 200 characters
{ title: 'A'.repeat(200) }

// ✅ Valid - whitespace trimmed
{ title: '  Valid Title  ' }
// Stored as: "Valid Title"
```

---

### Project Dates

**Rules:**
- Required: start_date and end_date
- Format: DD-MM-YYYY (NZ date format)
- Must be valid calendar dates
- End date must be after start date
- Leap year validation included

**Error Messages:**
```typescript
"Start date must be in DD-MM-YYYY format"
"End date must be in DD-MM-YYYY format"
"End date must be after start date"
"Invalid date range"
```

**Examples:**
```typescript
// ❌ Invalid format (ISO)
{ start_date: '2025-01-01', end_date: '2025-12-31' }
// Error: "Start date must be in DD-MM-YYYY format"

// ❌ Invalid format (wrong separator)
{ start_date: '01/01/2025', end_date: '31/12/2025' }
// Error: "Start date must be in DD-MM-YYYY format"

// ❌ Invalid day
{ start_date: '32-01-2025', end_date: '31-12-2025' }
// Error: "Start date must be in DD-MM-YYYY format"

// ❌ Invalid month
{ start_date: '01-13-2025', end_date: '31-12-2025' }
// Error: "Start date must be in DD-MM-YYYY format"

// ❌ Invalid leap year date
{ start_date: '29-02-2025', end_date: '01-03-2025' }
// Error: "Start date must be in DD-MM-YYYY format"
// Note: 2025 is not a leap year

// ✅ Valid leap year date
{ start_date: '29-02-2024', end_date: '01-03-2024' }
// 2024 is a leap year

// ❌ End before start
{ start_date: '31-12-2025', end_date: '01-01-2025' }
// Error: "End date must be after start date"

// ❌ Same dates
{ start_date: '01-01-2025', end_date: '01-01-2025' }
// Error: "End date must be after start date"

// ✅ Valid date range
{ start_date: '01-01-2025', end_date: '31-12-2025' }
```

---

### Project Status

**Rules:**
- Required
- Must be one of: 'planned', 'in-progress', 'blocked', 'done', 'archived'
- Case-sensitive

**Error Message:**
```typescript
"Status must be one of: planned, in-progress, blocked, done, archived"
```

**Examples:**
```typescript
// ❌ Invalid status
{ status: 'active' }
// Error: "Status must be one of: planned, in-progress, blocked, done, archived"

// ❌ Invalid status (old enum values)
{ status: 'completed' }
{ status: 'on-hold' }
{ status: 'cancelled' }
// Error: "Status must be one of: planned, in-progress, blocked, done, archived"

// ❌ Case mismatch
{ status: 'In-Progress' }
{ status: 'DONE' }
// Error: "Status must be one of: planned, in-progress, blocked, done, archived"

// ✅ Valid statuses
{ status: 'planned' }
{ status: 'in-progress' }
{ status: 'blocked' }
{ status: 'done' }
{ status: 'archived' }
```

---

### Budget (NZD)

**Rules:**
- Optional
- Format: NZD currency string (e.g., "1,234.56")
- Accepts: numbers with/without commas, with/without decimals
- Stored as cents (integer) in database
- Maximum: $99,999,999.99 (9,999,999,999 cents)

**Error Message:**
```typescript
"Budget must be a valid NZD amount (e.g., \"1,234.56\")"
```

**Examples:**
```typescript
// ❌ Invalid format
{ budget_nzd: 'invalid' }
{ budget_nzd: '$100' }
{ budget_nzd: '100 dollars' }
// Error: "Budget must be a valid NZD amount (e.g., \"1,234.56\")"

// ✅ Valid formats
{ budget_nzd: '100' }           // Stored as: 10000 cents
{ budget_nzd: '100.00' }        // Stored as: 10000 cents
{ budget_nzd: '1,234.56' }      // Stored as: 123456 cents
{ budget_nzd: '50000' }         // Stored as: 5000000 cents
{ budget_nzd: '0.99' }          // Stored as: 99 cents
{ budget_nzd: '99,999,999.99' } // Stored as: 9999999999 cents (max)

// ✅ Omitted (defaults to 0)
{ budget_nzd: undefined }       // Stored as: 0 cents
```

---

### Financial Treatment

**Rules:**
- Optional (defaults to 'CAPEX')
- Must be: 'CAPEX' or 'OPEX'
- Case-sensitive

**Error Message:**
```typescript
"Financial treatment must be either CAPEX or OPEX"
```

**Examples:**
```typescript
// ❌ Invalid value
{ financial_treatment: 'INVALID' }
{ financial_treatment: 'capex' }  // lowercase not allowed
{ financial_treatment: 'Operating' }
// Error: "Financial treatment must be either CAPEX or OPEX"

// ✅ Valid values
{ financial_treatment: 'CAPEX' }
{ financial_treatment: 'OPEX' }

// ✅ Omitted (defaults to CAPEX)
{ financial_treatment: undefined }  // Stored as: 'CAPEX'
```

---

### Optional Text Fields

**Rules:**

**PM Name:**
- Optional (defaults to empty string)
- Maximum: 100 characters (after trimming)
- Automatically trimmed

**Description:**
- Optional (defaults to empty string)
- Maximum: 1000 characters (after trimming)
- Automatically trimmed

**Lane:**
- Optional (defaults to empty string)
- Maximum: 100 characters (after trimming)
- Automatically trimmed

**Error Messages:**
```typescript
"PM name must be 100 characters or less"
"Description must be 1000 characters or less"
"Lane must be 100 characters or less"
```

**Examples:**
```typescript
// ❌ Too long
{ pm_name: 'A'.repeat(101) }
// Error: "PM name must be 100 characters or less"

{ description: 'A'.repeat(1001) }
// Error: "Description must be 1000 characters or less"

{ lane: 'A'.repeat(101) }
// Error: "Lane must be 100 characters or less"

// ✅ Valid - whitespace trimmed
{ pm_name: '  John Doe  ' }        // Stored as: "John Doe"
{ description: '   ' }               // Stored as: ""
{ lane: '' }                         // Stored as: ""

// ✅ Maximum length
{ pm_name: 'A'.repeat(100) }        // OK
{ description: 'A'.repeat(1000) }   // OK
{ lane: 'A'.repeat(100) }           // OK
```

---

## TaskService Validation

### Task Title

**Rules:**
- Required (cannot be empty or whitespace-only)
- Maximum: 200 characters (after trimming)
- Automatically trimmed

**Error Messages:**
```typescript
"Task title is required"
"Task title must be 200 characters or less"
```

---

### Task Dates

**Rules:**
- Same as Project dates
- Format: DD-MM-YYYY
- End date must be after start date

**Error Messages:**
```typescript
"Start date must be in DD-MM-YYYY format"
"End date must be in DD-MM-YYYY format"
"End date must be after start date"
```

---

### Task Status

**Rules:**
- Required
- Must be one of: 'planned', 'in-progress', 'done'
- Case-sensitive

**Error Message:**
```typescript
"Status must be one of: planned, in-progress, done"
```

**Examples:**
```typescript
// ❌ Invalid status
{ status: 'active' }
{ status: 'completed' }
{ status: 'blocked' }     // Not valid for tasks
{ status: 'archived' }    // Not valid for tasks
// Error: "Status must be one of: planned, in-progress, done"

// ✅ Valid statuses
{ status: 'planned' }
{ status: 'in-progress' }
{ status: 'done' }
```

---

### Effort Hours

**Rules:**
- Required
- Must be a positive number
- Maximum: 10,000 hours
- Can include decimals (e.g., 40.5 hours)

**Error Messages:**
```typescript
"Effort hours must be a positive number"
"Effort hours cannot exceed 10,000 hours"
```

**Examples:**
```typescript
// ❌ Invalid values
{ effort_hours: 0 }
{ effort_hours: -10 }
// Error: "Effort hours must be a positive number"

{ effort_hours: 10001 }
{ effort_hours: 100000 }
// Error: "Effort hours cannot exceed 10,000 hours"

// ✅ Valid values
{ effort_hours: 1 }
{ effort_hours: 40 }
{ effort_hours: 40.5 }
{ effort_hours: 160 }
{ effort_hours: 10000 }  // Maximum allowed
```

---

### Assigned Resources

**Rules:**
- Required (can be empty array)
- Must be an array of strings
- Maximum: 20 resources
- Stored as JSON string in database
- Automatically parsed when retrieved

**Error Message:**
```typescript
"Cannot assign more than 20 resources to a task"
```

**Examples:**
```typescript
// ❌ Too many resources
{ assigned_resources: Array(21).fill('Person') }
// Error: "Cannot assign more than 20 resources to a task"

// ✅ Valid values
{ assigned_resources: [] }
{ assigned_resources: ['Alice'] }
{ assigned_resources: ['Alice', 'Bob'] }
{ assigned_resources: ['Alice', 'Bob', 'Charlie', 'Diana'] }
{ assigned_resources: Array(20).fill('Person') }  // Maximum allowed

// Note: Automatically parsed when retrieved
const task = taskService.getTaskById('TASK-123');
task.assigned_resources  // Returns: ['Alice', 'Bob'] (array, not JSON string)
```

---

### Project ID (Foreign Key)

**Rules:**
- Required
- Must be a valid project ID that exists in database
- Cannot reference deleted projects

**Error Messages:**
```typescript
"Project ID is required"
"Project not found"
```

---

## DependencyService Validation

### Dependency Types

**Rules:**
- from_type and to_type required
- Must be: 'project' or 'task'

**Error Messages:**
```typescript
"from_type must be either 'project' or 'task'"
"to_type must be either 'project' or 'task'"
```

---

### Dependency IDs

**Rules:**
- from_id and to_id required
- Must reference existing entities
- Cannot create dependency from entity to itself (self-reference)

**Error Messages:**
```typescript
"from_id is required"
"to_id is required"
"Cannot create a dependency from an entity to itself"
"Source entity not found"
"Target entity not found"
```

**Examples:**
```typescript
// ❌ Self-reference
{
  from_type: 'project',
  from_id: 'PROJ-123',
  to_type: 'project',
  to_id: 'PROJ-123'  // Same as from_id
}
// Error: "Cannot create a dependency from an entity to itself"

// ✅ Valid dependency
{
  from_type: 'project',
  from_id: 'PROJ-123',
  to_type: 'project',
  to_id: 'PROJ-456'
}
```

---

### Dependency Kind

**Rules:**
- Required
- Must be one of: 'FS', 'SS', 'FF', 'SF'
- Represents: Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish

**Error Message:**
```typescript
"Dependency kind must be one of: FS, SS, FF, SF"
```

---

### Cycle Detection

**Rules:**
- Automatically validates that new dependency won't create a cycle
- Checks entire dependency graph
- Returns cycle path if detected

**Error Message:**
```typescript
"Creating this dependency would create a cycle: [path details]"
```

**Examples:**
```typescript
// Given: P1 -> P2 -> P3
// ❌ Trying to create: P3 -> P1 (creates cycle)
{
  from_type: 'project',
  from_id: 'P3',
  to_type: 'project',
  to_id: 'P1'
}
// Error: "Creating this dependency would create a cycle: P1 -> P2 -> P3 -> P1"

// ✅ Valid: P1 -> P4 (no cycle)
{
  from_type: 'project',
  from_id: 'P1',
  to_type: 'project',
  to_id: 'P4'
}
```

---

## Testing Validation

### Testing for Specific Errors

```typescript
test('should reject empty project title', () => {
  const result = projectService.createProject({
    title: '',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    status: 'in-progress'
  });
  
  expect(result.success).toBe(false);
  expect(result.errors).toBeDefined();
  expect(result.errors).toContain('Project title is required');
});
```

---

### Testing Multiple Validation Errors

```typescript
test('should return all validation errors', () => {
  const result = projectService.createProject({
    title: '',                    // Error 1
    start_date: 'invalid',        // Error 2
    end_date: '31-12-2025',
    status: 'invalid' as any      // Error 3
  });
  
  expect(result.success).toBe(false);
  expect(result.errors).toHaveLength(3);
  expect(result.errors).toContain('Project title is required');
  expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
  expect(result.errors).toContain('Status must be one of: planned, in-progress, blocked, done, archived');
});
```

---

### Testing Edge Cases

```typescript
test('should handle whitespace-only fields', () => {
  const result = projectService.createProject({
    title: '  Valid Title  ',
    description: '   ',
    pm_name: '  ',
    lane: '',
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    status: 'in-progress'
  });
  
  expect(result.success).toBe(true);
  expect(result.project!.title).toBe('Valid Title');  // Trimmed
  expect(result.project!.description).toBe('');        // Empty after trim
  expect(result.project!.pm_name).toBe('');            // Empty after trim
});
```

---

### Testing Maximum Lengths

```typescript
test('should accept exactly maximum length', () => {
  const result = projectService.createProject({
    title: 'A'.repeat(200),         // Exactly 200 chars
    description: 'B'.repeat(1000),  // Exactly 1000 chars
    pm_name: 'C'.repeat(100),       // Exactly 100 chars
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    status: 'in-progress'
  });
  
  expect(result.success).toBe(true);
});

test('should reject one over maximum length', () => {
  const result = projectService.createProject({
    title: 'A'.repeat(201),  // 201 chars - too long
    start_date: '01-01-2025',
    end_date: '31-12-2025',
    status: 'in-progress'
  });
  
  expect(result.success).toBe(false);
  expect(result.errors).toContain('Project title must be 200 characters or less');
});
```

---

## Quick Reference Table

### ProjectService

| Field | Required | Type | Max Length | Error Message |
|-------|----------|------|------------|---------------|
| title | Yes | string | 200 | "Project title is required" / "...must be 200 characters or less" |
| start_date | Yes | DD-MM-YYYY | - | "Start date must be in DD-MM-YYYY format" |
| end_date | Yes | DD-MM-YYYY | - | "End date must be in DD-MM-YYYY format" / "...must be after start date" |
| status | Yes | enum | - | "Status must be one of: planned, in-progress, blocked, done, archived" |
| pm_name | No | string | 100 | "PM name must be 100 characters or less" |
| description | No | string | 1000 | "Description must be 1000 characters or less" |
| lane | No | string | 100 | "Lane must be 100 characters or less" |
| budget_nzd | No | currency | - | "Budget must be a valid NZD amount (e.g., \"1,234.56\")" |
| financial_treatment | No | enum | - | "Financial treatment must be either CAPEX or OPEX" |

### TaskService

| Field | Required | Type | Max Length | Error Message |
|-------|----------|------|------------|---------------|
| title | Yes | string | 200 | "Task title is required" / "...must be 200 characters or less" |
| project_id | Yes | string | - | "Project ID is required" / "Project not found" |
| start_date | Yes | DD-MM-YYYY | - | "Start date must be in DD-MM-YYYY format" |
| end_date | Yes | DD-MM-YYYY | - | "End date must be in DD-MM-YYYY format" / "...must be after start date" |
| status | Yes | enum | - | "Status must be one of: planned, in-progress, done" |
| effort_hours | Yes | number | 10,000 | "Effort hours must be a positive number" / "...cannot exceed 10,000 hours" |
| assigned_resources | Yes | array | 20 items | "Cannot assign more than 20 resources to a task" |

### DependencyService

| Field | Required | Type | Error Message |
|-------|----------|------|---------------|
| from_type | Yes | enum | "from_type must be either 'project' or 'task'" |
| from_id | Yes | string | "from_id is required" / "Source entity not found" |
| to_type | Yes | enum | "to_type must be either 'project' or 'task'" |
| to_id | Yes | string | "to_id is required" / "Target entity not found" / "Cannot create a dependency from an entity to itself" |
| kind | Yes | enum | "Dependency kind must be one of: FS, SS, FF, SF" |

---

## Summary for Junior Developers

**Key Takeaways:**

1. **Always Check `success` Flag:**
   ```typescript
   const result = service.createProject({...});
   if (result.success) {
     // Use result.project
   } else {
     // Handle result.errors
   }
   ```

2. **Error Arrays Can Have Multiple Items:**
   - One invalid field = one error
   - Three invalid fields = three errors
   - Always iterate or check specific errors

3. **Trimming Is Automatic:**
   - Whitespace automatically removed from text fields
   - Empty after trimming = empty string (or error if required)

4. **Use Valid Enum Values:**
   - ProjectStatus: 'planned', 'in-progress', 'blocked', 'done', 'archived'
   - TaskStatus: 'planned', 'in-progress', 'done'
   - NOT: 'active', 'completed', 'on-hold', 'cancelled'

5. **Test Your Validation:**
   - Write tests for each validation rule
   - Test edge cases (max length, boundary conditions)
   - Test multiple errors at once
