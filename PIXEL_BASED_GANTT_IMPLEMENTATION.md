# Pixel-Based Gantt Chart Timeline System Implementation

## Overview
Replaced the percentage-based timeline calculations with a pixel-based system for precise alignment between timeline headers and project bars. This ensures projects display with correct visual duration regardless of zoom level.

## Key Changes

### 1. Pixel-Per-Day Calculation (`getPixelsPerDay()`)
- **Week**: 20px per day
- **Fortnight**: 10px per day
- **Month**: 4px per day
- **Quarter**: 2px per day
- **Year**: 1px per day

These values ensure that the timeline remains readable and scrollable at all zoom levels.

### 2. Timeline Width Calculations

#### `getDaysDifference(date1, date2)`
- Calculates the number of days between two dates
- Uses milliseconds conversion: `(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)`

#### `getTotalTimelineWidth()`
- Computes total width of the entire timeline in pixels
- Formula: `totalDays * pixelsPerDay`
- Used to set `minWidth` on timeline containers to enable horizontal scrolling

### 3. Bar Positioning and Sizing

#### `calculatePositionPx(date)`
- Calculates pixel offset from the timeline start for a given date
- Formula: `dayOffset * pixelsPerDay` where `dayOffset` is days since `projectData.minDate`
- Used for `left` CSS property on project bars

#### `calculateWidthPx(startDate, endDate)`
- Calculates the width of a project bar in pixels
- Formula: `durationDays * pixelsPerDay`
- Ensures bar width is at least 1px for visibility
- Used for `width` CSS property on project bars

### 4. Time Labels with Days Per Period

#### Updated `getTimeLabels()`
Each period label now includes `daysInPeriod` property:
- **Week**: 7 days
- **Fortnight**: 14 days
- **Month**: Actual days in the month (28-31)
- **Quarter**: Actual days in the quarter (90-92)
- **Year**: Actual days in financial year (365-366)

This allows header columns to be sized accurately: `daysInPeriod * pixelsPerDay`

### 5. Synchronized Scrolling

#### Header and Rows Scroll Sync
- `headerScrollContainerRef` and `rowsScrollContainerRef` refs track both containers
- `handleHeaderScroll()` syncs rows scroll to header scroll
- `handleRowsScroll()` syncs header scroll to rows scroll
- Ensures timeline columns and project bars remain aligned during horizontal scrolling

### 6. Removed Old Calculations
- Deleted percentage-based `calculatePosition()` function
- Deleted percentage-based `calculateWidth()` function
- These were replaced with pixel-based equivalents

## Timeline Rendering

### Header
```typescript
<div style={{ minWidth: `${getTotalTimelineWidth()}px` }}>
  {timeLabels.map(period => (
    <div style={{ width: `${period.daysInPeriod * getPixelsPerDay()}px` }}>
      {period.label}
    </div>
  ))}
</div>
```

### Project Bars
```typescript
<div style={{ minWidth: `${getTotalTimelineWidth()}px` }}>
  <div style={{
    position: 'absolute',
    left: `${calculatePositionPx(project.startDate)}px`,
    width: `${calculateWidthPx(project.startDate, project.endDate)}px`
  }}>
    {project.title}
  </div>
</div>
```

## Expected Behavior

### Projects Display with Correct Duration
- A 333-day project now displays as ~11 months (not compressed to 5 months)
- Project bar width accurately reflects project duration
- Bar position aligns with start date on the timeline

### Zoom Levels Work Correctly
- Changing zoom level updates `pixelsPerDay` immediately
- Header columns resize to match new pixel calculation
- Project bars maintain accurate positioning and width
- Total timeline width adjusts appropriately

### Horizontal Scrolling
- Users can scroll horizontally to view the entire timeline
- Header and rows stay synchronized during scroll
- Project bars remain visible and aligned with their timeline position

## Testing Recommendations

1. **Duration Accuracy**: Verify a known duration project (e.g., 333 days) displays with correct width
2. **Zoom Levels**: Switch between zoom levels and verify bars resize proportionally
3. **Alignment**: Scroll horizontally and confirm bars stay aligned with header
4. **Edge Cases**: Test with 1-day projects, multi-year projects, projects spanning month boundaries
5. **Synchronization**: Verify header and rows scroll together smoothly

## UTC Date Handling

All dates use UTC parsing to avoid timezone offset errors:
```typescript
const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};
```

This ensures consistent calculations regardless of user's local timezone.

## Calendar Period Alignment

For month zoom level, the timeline is aligned to calendar month boundaries:
- Minimum date: 1st of the month containing the earliest project
- Maximum date: Last day of the month containing the latest project

This provides better visual context and ensures full months are visible.
