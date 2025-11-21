# Calendar Module - Implementation Summary

## Overview
A complete Calendar module has been implemented for managing working days, public holidays, and work hours by year and month. This module integrates with the Finance and Resource modules to support cost calculations and resource effort tracking.

## Features Implemented

### 1. Database Schema (db.ts)
- **calendar_years** table: Stores year-level data
- **calendar_months** table: Stores monthly data including:
  - Days (total days in month)
  - Working days
  - Weekend days
  - Public holidays
  - Work hours
  - Notes
- **public_holidays** table: Stores holiday information with:
  - Name, date, year, month, day
  - Description
  - Recurring flag
  - Source (manual/ical)

### 2. iCal Import Utility (icalParser.ts)
- Parses .ics (iCalendar) files
- Extracts holiday events from VEVENT blocks
- Handles both DATE and DATETIME formats
- Supports recurring events detection
- Validates parsed holiday data
- Location: `app/renderer/utils/icalParser.ts`

### 3. Calendar Manager Component (CalendarManager.tsx)
A comprehensive React component with:
- **Year/Month Picker**: Select any year and month
- **Month Data Entry**:
  - Auto-calculated total days
  - Auto-calculated weekend days
  - Editable public holidays count
  - Auto-calculated working days
  - Editable work hours (defaults to working days × 8)
  - Notes field for additional context
- **Public Holiday Management**:
  - Add custom organization holidays manually
  - Bulk entry for multiple holidays at once
  - Import from iCal files with preview
  - List of holidays for selected month
  - Delete individual holidays
  - Mark holidays as recurring
- **Auto-calculations**:
  - Weekend days calculated from calendar
  - Working days = Total days - Weekend days - Public holidays
  - Work hours = Working days × 8 (editable)

### 4. Backend Mutations (mutations.ts)
Calendar CRUD operations:
- `saveCalendarMonth`: Insert or update month data
- `getCalendarMonth`: Retrieve data for specific month
- `importPublicHolidays`: Bulk import holidays
- `getPublicHolidays`: Get holidays by year/month
- `deletePublicHoliday`: Remove a holiday

### 5. IPC Communication (main.ts)
IPC handlers for frontend-backend communication:
- `calendar:saveMonth`
- `calendar:getMonth`
- `calendar:importHolidays`
- `calendar:getHolidays`
- `calendar:deleteHoliday`

### 6. Electron API (preload.ts)
Type-safe API exposed to renderer:
- `saveCalendarMonth(monthData)`
- `getCalendarMonth(year, month)`
- `importPublicHolidays(holidays[])`
- `getPublicHolidays(year?, month?)`
- `deletePublicHoliday(id)`

### 7. Navigation & Routing
- Added Calendar item to NavigationSidebar with 📅 icon
- Added calendar route case to DashboardLayout
- Module info added to moduleInfo.ts with documentation

## File Structure
```
app/
├── main/
│   ├── db.ts                    # Database schema (tables & indexes)
│   ├── mutations.ts             # Calendar CRUD functions
│   ├── main.ts                  # IPC handlers
│   └── preload.ts               # Electron API definitions
├── renderer/
│   ├── components/
│   │   ├── CalendarManager.tsx  # Main calendar component
│   │   ├── DashboardLayout.tsx  # Added calendar route
│   │   └── NavigationSidebar.tsx # Added navigation item
│   ├── data/
│   │   └── moduleInfo.ts        # Calendar module metadata
│   └── utils/
│       └── icalParser.ts        # iCal file parser
```

## Usage

### Accessing the Module
1. Click "Calendar" (📅) in the navigation sidebar
2. Select year and month using dropdowns
3. Month data loads automatically or initializes with defaults

### Managing Month Data
1. Review auto-calculated fields (Days, Weekend Days)
2. Enter number of public holidays
3. Adjust working days if needed
4. Work hours auto-calculate (editable)
5. Add notes for context
6. Click "Save Month Data"

### Adding Custom Holidays

**Single Holiday:**
1. Click "➕ Add Holiday" button
2. Enter holiday name (required)
3. Enter date in DD-MM-YYYY format (required)
4. Add optional description
5. Check "Recurring annually" if applicable
6. Click "Add Holiday" to save

**Bulk Entry (Multiple Holidays):**
1. Click "📝 Bulk Entry" button
2. Enter holidays one per line in format: `DD-MM-YYYY, Holiday Name, Description`
3. Example:
   ```
   01-01-2025, New Year's Day
   06-02-2025, Waitangi Day
   15-03-2025, Company Anniversary, Annual celebration
   25-04-2025, ANZAC Day
   25-12-2025, Christmas Day
   ```
4. Click "Add All Holidays" to save
5. All valid holidays are imported at once

### Importing from iCal
1. Click "📥 Import iCal" button
2. Select a .ics file from your computer
3. Review the preview of imported holidays
4. Click "Confirm Import" to add to database
5. Imported holidays appear in the Public Holidays section

### Managing Holidays
- View all holidays for selected month
- Delete unwanted holidays with "Delete" button
- Holidays are automatically counted in month calculations

## Integration Points

### With Finance Module (Coming)
- Work hours used for cost calculations
- Monthly capacity planning
- Resource cost allocation

### With Resource Module (Coming)
- Resource holidays tracked separately
- Combines with public holidays for availability
- Effort consumption calculations

### With Project Planning
- Consider holidays when setting project timelines
- Work hour calculations for effort estimation
- Resource availability tracking

## Data Flow

```
1. User selects Year/Month
   ↓
2. Load month data from database (or create defaults)
   ↓
3. Load public holidays for that month
   ↓
4. Display in UI with auto-calculations
   ↓
5. User makes changes
   ↓
6. Save to database
   ↓
7. Data available for Finance/Resource modules
```

## Database Indexes
Optimized queries with indexes on:
- `calendar_months(year, month)`
- `public_holidays(date)`
- `public_holidays(year, month)`

## Auto-Calculations

### Weekend Days
```javascript
// Calculates all Saturdays and Sundays in the month
for each day in month:
  if day is Saturday or Sunday:
    increment weekend_days
```

### Working Days
```javascript
working_days = total_days - weekend_days - public_holidays
```

### Work Hours
```javascript
work_hours = working_days × 8  // 8 hours per working day
```

## Future Enhancements
- Resource-specific holidays (from Resource module)
- Calendar year overview
- Holiday templates by country
- Export calendar data
- Multi-year holiday import
- Holiday recurrence rules
- Custom work hours per day
- Part-time work day support

## Testing
The module is ready for testing:
1. Navigate to Calendar module
2. Select different months
3. Import an iCal file with holidays
4. Save month data
5. Verify calculations are correct
6. Check data persists across sessions

## Data Persistence

### Automatic Saving
- **Holidays**: Saved immediately to SQLite database on disk
- **Month Data**: Saved when "Save Month Data" is clicked
- **Location**: `%APPDATA%/Electron/roadmap.db` (Windows)
- **No manual backups needed**: Data persists across app restarts

### Loading on Startup
- All holiday data automatically loaded when app runs
- Month data loaded when year/month selected
- No configuration required
- Instant access to previously entered data

### Data Integrity
- Unique constraint prevents duplicate holidays by date
- Foreign key relationships maintain data consistency
- Transactions ensure atomic operations
- Indexes optimize query performance

## Notes
- All dates use DD-MM-YYYY format for consistency
- Public holidays are unique by date (no duplicates)
- Calendar data persists in SQLite database on disk
- Holidays auto-save immediately upon creation
- Month data saved when "Save Month Data" clicked
- Import preview prevents accidental bulk imports
- Custom holidays marked with source='manual'
