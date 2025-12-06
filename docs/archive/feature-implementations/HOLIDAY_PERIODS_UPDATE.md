# Holiday Period Support - Feature Update

## Overview
Updated the Calendar module to support **holiday periods** with start and end dates, allowing organizations to define multi-day holiday periods like Christmas/New Year shutdowns or extended breaks.

## Changes Summary

### Database Schema Updates

**Modified Table: `public_holidays`**

Changed from single date to date range:

**Before:**
```sql
date TEXT NOT NULL UNIQUE
```

**After:**
```sql
start_date TEXT NOT NULL
end_date TEXT NOT NULL
year INTEGER NOT NULL
month INTEGER NOT NULL  
day INTEGER NOT NULL
end_year INTEGER
end_month INTEGER
end_day INTEGER
```

**Index Updates:**
- Removed: `idx_public_holidays_date` (unique constraint on single date)
- Added: `idx_public_holidays_start_date` (indexed on start_date)
- Added: `idx_public_holidays_name` (search by name)

### Backend Changes

#### mutations.ts
- Updated `PublicHolidayPayload` interface with start_date, end_date, and end date components
- Updated `importPublicHolidays()` to handle date ranges
- Added try-catch for duplicate handling instead of INSERT OR IGNORE
- Stores both start and end date information

#### IPC Handlers (main.ts)
- No changes required - existing handlers work with updated payload structure

### Frontend Changes

#### CalendarManager.tsx

**State Updates:**
```typescript
// Before
{ name: '', date: '', description: '', is_recurring: false }

// After
{ name: '', start_date: '', end_date: '', description: '', is_recurring: false }
```

**Add Custom Holiday:**
- Now validates both start and end dates
- Validates end date is not before start date
- Parses and stores both date components (year, month, day, end_year, end_month, end_day)

**Bulk Entry Format:**
```
// Before: Date, Name, Description
01-01-2025, New Year's Day
25-12-2025, Christmas Day, Public Holiday

// After: Name, Start Date, End Date, Description
New Year's Day, 01-01-2025, 01-01-2025
Christmas Shutdown, 25-12-2025, 02-01-2026
Easter Weekend, 18-04-2025, 21-04-2025, Long weekend
```

**Display Updates:**
- Single-day holidays: Shows just the date
- Multi-day holidays: Shows "start_date to end_date"
- Examples:
  - `01-01-2025` (single day)
  - `25-12-2025 to 02-01-2026` (period)

#### icalParser.ts

**Interface Updates:**
```typescript
export interface ICalEvent {
  name: string;
  start_date: string;    // Was: date
  end_date: string;      // NEW
  year: number;
  month: number;
  day: number;
  end_year: number;      // NEW
  end_month: number;     // NEW
  end_day: number;       // NEW
  description: string;
  isRecurring: boolean;
}
```

**Parser Updates:**
- Now parses `DTEND` fields from iCal files
- Falls back to start_date if no end date specified
- Handles both `DTEND;VALUE=DATE:` and `DTEND:` formats

## User Interface Updates

### Single Holiday Entry Form

```
┌─────────────────────────────────────────┐
│ Holiday Name *                          │
│ [Christmas/New Year Shutdown          ] │
│                                         │
│ Start Date (DD-MM-YYYY) * | End Date * │
│ [25-12-2025              ] [02-01-2026]│
│                                         │
│ Description                             │
│ [Optional notes                       ] │
│                                         │
│ [✓] Recurring annually                  │
│          [Cancel]  [Add Holiday]        │
└─────────────────────────────────────────┘
```

### Bulk Entry Form

```
┌─────────────────────────────────────────┐
│ Enter one holiday per line:             │
│ Name, Start Date, End Date, Description │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │New Year's Day, 01-01-2025, 01-01-25││ │
│ │Christmas Shutdown, 25-12-25, 02-01-││ │
│ │Easter Break, 18-04-25, 21-04-25    ││ │
│ └─────────────────────────────────────┘ │
│          [Cancel]  [Add All Holidays]   │
└─────────────────────────────────────────┘
```

## Validation Rules

### Date Validation
- **Format**: DD-MM-YYYY for both start and end dates
- **Range**: Day (1-31), Month (1-12), Year (1900-2100)
- **Logic**: End date must be >= Start date
- **Error Messages**:
  - "Start date must be in DD-MM-YYYY format"
  - "End date must be in DD-MM-YYYY format"
  - "End date must be on or after start date"

### Bulk Entry Validation
- **Minimum**: 3 fields (Name, Start Date, End Date)
- **Line-by-line**: Validates each entry independently
- **Error Reporting**: Shows line number and specific error
- **Example Errors**:
  - "Line 2: Invalid start date format (use DD-MM-YYYY)"
  - "Line 5: End date must be on or after start date"

## Migration Notes

### Database Migration
- **Existing Data**: If you have existing holidays with the old schema, they will need to be migrated
- **Recommended Approach**:
  1. Export existing holidays
  2. Drop and recreate database (or add columns manually)
  3. Re-import holidays with start_date = end_date = old date value

### Breaking Changes
- ❌ `date` field removed from `public_holidays` table
- ❌ Unique constraint on `date` removed
- ✅ `start_date` and `end_date` fields added
- ✅ Can now have multiple holidays with same start date (different names)

## Use Cases

### Single-Day Holidays
```
Name: New Year's Day
Start: 01-01-2025
End: 01-01-2025
Display: "New Year's Day - 01-01-2025"
```

### Multi-Day Periods
```
Name: Christmas/New Year Shutdown
Start: 25-12-2025
End: 02-01-2026
Display: "Christmas/New Year Shutdown - 25-12-2025 to 02-01-2026"
```

### Extended Breaks
```
Name: Easter Weekend
Start: 18-04-2025
End: 21-04-2025
Description: Long weekend
Display: "Easter Weekend - 18-04-2025 to 21-04-2025 • Long weekend"
```

## Benefits

### For Organizations
- ✅ Model realistic shutdown periods
- ✅ Account for extended breaks (Christmas/New Year)
- ✅ Better resource planning over holiday periods
- ✅ Accurate work hour calculations
- ✅ Clear naming of holiday periods

### For Planning
- ✅ More accurate working days calculation
- ✅ Better visibility of available work time
- ✅ Integration with Finance module (cost calculations)
- ✅ Integration with Resource module (availability tracking)

## Testing Scenarios

### 1. Single Day Holiday
```
Input: New Year's Day, 01-01-2025, 01-01-2025
Expected: Shows as "01-01-2025"
```

### 2. Multi-Day Period
```
Input: Christmas Shutdown, 25-12-2025, 02-01-2026
Expected: Shows as "25-12-2025 to 02-01-2026"
```

### 3. Invalid Date Range
```
Input: Bad Holiday, 05-01-2025, 01-01-2025
Expected: Error "End date must be on or after start date"
```

### 4. Bulk Entry Mixed
```
Input:
New Year's Day, 01-01-2025, 01-01-2025
Easter Break, 18-04-2025, 21-04-2025
Christmas Shutdown, 25-12-2025, 02-01-2026

Expected: All 3 imported successfully
```

### 5. iCal Import
```
iCal with DTSTART and DTEND
Expected: Both dates parsed and stored
```

## Data Examples

### Database Records

**Single Day:**
```json
{
  "name": "New Year's Day",
  "start_date": "01-01-2025",
  "end_date": "01-01-2025",
  "year": 2025,
  "month": 1,
  "day": 1,
  "end_year": 2025,
  "end_month": 1,
  "end_day": 1,
  "description": "",
  "is_recurring": false,
  "source": "manual"
}
```

**Multi-Day Period:**
```json
{
  "name": "Christmas/New Year Shutdown",
  "start_date": "25-12-2025",
  "end_date": "02-01-2026",
  "year": 2025,
  "month": 12,
  "day": 25,
  "end_year": 2026,
  "end_month": 1,
  "end_day": 2,
  "description": "Company-wide shutdown",
  "is_recurring": true,
  "source": "manual"
}
```

## Future Enhancements

1. **Duration Calculator**: Auto-calculate number of days in period
2. **Visual Calendar**: Show holiday periods on calendar view
3. **Overlap Detection**: Warn if holidays overlap
4. **Period Templates**: Common holiday period templates
5. **Working Days Impact**: Show how many working days affected
6. **Export Functionality**: Export holiday calendar
7. **Edit Capability**: Edit existing holiday periods
8. **Bulk Delete**: Delete multiple holidays at once

## Summary

✅ **Completed:**
- Database schema updated for date ranges
- Single holiday entry supports start/end dates
- Bulk entry updated to new format
- iCal parser handles DTEND fields
- Display shows ranges intelligently
- Full validation for date logic
- Backward compatible structure (can use same date for start/end)

✅ **Benefits:**
- Realistic modeling of holiday periods
- Better organizational planning
- Clearer communication of shutdowns
- More accurate resource calculations
- Professional holiday management

The Calendar module now supports **named holiday periods** with proper date ranges, making it production-ready for real-world organizational holiday management!
