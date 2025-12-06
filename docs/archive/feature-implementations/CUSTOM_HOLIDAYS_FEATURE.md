# Custom Holiday Entry Feature

## Overview
Enhanced the Calendar module with custom organization holiday entry capabilities. Users can now add holidays manually in addition to importing from iCal files. All data persists to disk and loads automatically on app startup.

## New Features

### 1. Single Holiday Entry
- **Button**: "➕ Add Holiday"
- **Fields**:
  - Holiday Name (required)
  - Date in DD-MM-YYYY format (required)
  - Description (optional)
  - Recurring annually checkbox
- **Validation**: Date format and value validation
- **Save**: Immediate persistence to SQLite database

### 2. Bulk Holiday Entry
- **Button**: "📝 Bulk Entry"
- **Format**: One holiday per line: `DD-MM-YYYY, Holiday Name, Description`
- **Example Input**:
  ```
  01-01-2025, New Year's Day
  06-02-2025, Waitangi Day
  15-03-2025, Company Anniversary, Annual celebration
  25-04-2025, ANZAC Day
  25-12-2025, Christmas Day
  26-12-2025, Boxing Day
  ```
- **Features**:
  - Multi-line textarea input
  - Line-by-line validation with error reporting
  - Batch import of all valid entries
  - Clear error messages showing line numbers

### 3. iCal Import (Existing - Enhanced)
- **Button**: "📥 Import iCal"
- **Process**:
  1. Select .ics file
  2. Preview imported holidays
  3. Confirm to add to database
- **Integration**: Works alongside manual entry

## Data Persistence

### Storage
- **Database**: SQLite (`%APPDATA%/Electron/roadmap.db`)
- **Table**: `public_holidays`
- **Fields**:
  - id, name, date, year, month, day
  - description, is_recurring, source
  - created_at, updated_at
- **Source Tracking**: 
  - `manual` - Custom entries
  - `ical` - iCal imports

### Automatic Loading
- Holidays loaded when app starts
- No configuration required
- Month view automatically shows relevant holidays
- Data available across sessions

### Data Integrity
- **Unique Constraint**: One holiday per date (no duplicates)
- **Foreign Keys**: Calendar months reference years
- **Indexes**: Optimized for date and month queries
- **Transactions**: Atomic bulk operations

## User Interface

### Layout
```
┌─────────────────────────────────────────────┐
│ 📅 Calendar Management                      │
├─────────────────────────────────────────────┤
│ Year: [2025 ▼]  Month: [November ▼]       │
├─────────────────────────────────────────────┤
│ Month Data Form (Days, Working Days, etc.) │
├─────────────────────────────────────────────┤
│ Public Holidays                             │
│ [➕ Add Holiday] [📝 Bulk Entry] [📥 iCal] │
├─────────────────────────────────────────────┤
│ ┌─ Add Holiday Form ─────────────────────┐ │
│ │ Name: [Company Anniversary          ]  │ │
│ │ Date: [15-03-2025                   ]  │ │
│ │ Desc: [Annual celebration           ]  │ │
│ │ [✓] Recurring annually                 │ │
│ │           [Cancel] [Add Holiday]       │ │
│ └────────────────────────────────────────┘ │
│                  OR                         │
│ ┌─ Bulk Entry Form ──────────────────────┐ │
│ │ Enter one holiday per line:             │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │01-01-2025, New Year's Day          ││ │
│ │ │06-02-2025, Waitangi Day            ││ │
│ │ │25-04-2025, ANZAC Day               ││ │
│ │ └─────────────────────────────────────┘ │ │
│ │           [Cancel] [Add All Holidays]  │ │
│ └────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Holiday List (for selected month)           │
│ • New Year's Day - 01-01-2025 [Delete]     │
│ • Waitangi Day - 06-02-2025 [Delete]       │
└─────────────────────────────────────────────┘
```

### Interactions
1. **Toggle Forms**: Only one form visible at a time
2. **Validation**: Real-time feedback on errors
3. **Status Messages**: Success/error notifications
4. **Auto-close**: Forms close after successful save
5. **Confirmation**: No confirmation needed - instant save

## Validation Rules

### Date Format
- **Required**: DD-MM-YYYY
- **Examples**: `01-01-2025`, `25-12-2025`
- **Invalid**: `2025-01-01`, `1/1/2025`, `01-Jan-2025`

### Date Values
- Day: 1-31
- Month: 1-12
- Year: 1900-2100 (reasonable range)

### Name
- Required field
- No length restrictions
- Free text entry

### Bulk Entry
- **Line Format**: `Date, Name, Description (optional)`
- **Separator**: Comma (`,`)
- **Minimum**: Date and Name required
- **Description**: Everything after second comma
- **Blank Lines**: Ignored
- **Error Reporting**: Shows first error with line number

## Error Handling

### User-Friendly Messages
- ❌ "Holiday name and date are required"
- ❌ "Date must be in DD-MM-YYYY format"
- ❌ "Invalid date format"
- ❌ "Line 3: Invalid date format (use DD-MM-YYYY)"
- ✅ "Holiday added successfully!"
- ✅ "Successfully added 5 holidays!"

### Silent Failures
- Network errors: Graceful degradation
- Database errors: User-friendly message
- No console spam: Clean error handling

## Integration

### With Existing Calendar Features
- Custom holidays counted in "Public Holidays" field
- Affects working days calculation
- Impacts work hours (working days × 8)
- Visible in month holiday list
- Can be deleted like imported holidays

### With Future Modules
- **Finance Module**: Work hours drive cost calculations
- **Resource Module**: Holiday data for availability
- **Project Planning**: Timeline adjustments for holidays

## Testing Scenarios

### 1. Single Holiday Entry
```
Name: Company Anniversary
Date: 15-03-2025
Description: Annual celebration
Recurring: Yes
Expected: Holiday added, appears in March 2025
```

### 2. Bulk Entry - Valid
```
01-01-2025, New Year's Day
06-02-2025, Waitangi Day
25-04-2025, ANZAC Day
Expected: 3 holidays added successfully
```

### 3. Bulk Entry - Mixed Valid/Invalid
```
01-01-2025, New Year's Day
invalid-date, Bad Holiday
25-04-2025, ANZAC Day
Expected: Error on line 2, no holidays added
```

### 4. Persistence Test
```
1. Add holiday
2. Close app
3. Reopen app
4. Navigate to Calendar
Expected: Holiday still present
```

### 5. Duplicate Prevention
```
1. Add: 25-12-2025, Christmas
2. Try add: 25-12-2025, Xmas
Expected: Second entry rejected (unique constraint)
```

## Performance Considerations

### Database Operations
- **Single Insert**: <10ms typical
- **Bulk Insert**: Transaction-based, atomic
- **Query**: Indexed by date and month
- **Load Time**: Instant for typical year

### UI Responsiveness
- **Form Toggle**: Immediate
- **Validation**: Real-time
- **Save**: Non-blocking with loading state
- **List Update**: Automatic after save

## Future Enhancements

1. **Date Picker**: Calendar widget for date selection
2. **Templates**: Predefined holiday sets by country
3. **Edit**: Modify existing holidays
4. **CSV Import**: Alternative to bulk text entry
5. **Export**: Generate holiday list for sharing
6. **Recurrence Rules**: More complex recurrence patterns
7. **Holiday Categories**: Work/Personal/Org
8. **Color Coding**: Visual distinction by category

## Documentation Updates

### Updated Files
- ✅ `CalendarManager.tsx` - UI and logic
- ✅ `moduleInfo.ts` - Module documentation
- ✅ `CALENDAR_MODULE_README.md` - User guide
- ✅ `CUSTOM_HOLIDAYS_FEATURE.md` - This document

### User Help Text
- Added tips about bulk entry
- Updated usage instructions
- Added data persistence section
- Included format examples

## Summary

Custom holiday entry is now fully functional with:
- ✅ Single holiday manual entry
- ✅ Bulk entry for multiple holidays
- ✅ Existing iCal import support
- ✅ Data persistence to disk
- ✅ Automatic loading on startup
- ✅ Input validation and error handling
- ✅ User-friendly interface
- ✅ Complete documentation

Users can now manage their organization's custom holidays efficiently without relying solely on iCal files.
