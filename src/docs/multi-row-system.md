# Multi-Row Timeline System

## Overview

The multi-row timeline system allows multiple projects to be displayed on separate rows, preventing visual overlaps and enabling better organization of concurrent projects. This system automatically assigns projects to rows and provides drag-and-drop functionality to move projects between rows.

## Key Features

### 1. **Automatic Row Assignment**
- Projects are automatically assigned to rows to minimize date overlaps
- Algorithm prioritizes placing projects in existing rows with no conflicts
- Creates new rows when necessary to prevent overlaps

### 2. **Visual Row System**
- **Row Backgrounds**: Alternating colors for visual separation between rows
- **Row Labels**: Each row displays a clear "Row 1", "Row 2", etc. label
- **Minimum Rows**: System ensures at least 3 rows are always visible

### 3. **Enhanced Drag and Drop**
- **Horizontal Movement**: Projects can be dragged to change dates (existing functionality)
- **Vertical Movement**: Projects can be dragged between rows with visual feedback
- **Row Indicators**: Visual highlighting shows target row during drag operations
- **Resize Handles**: Projects can be resized from left/right edges to adjust dates

### 4. **Data Persistence**
- Row assignments are stored in localStorage with project data
- Projects remember their row assignments between page reloads
- Automatic re-assignment when projects are moved or modified

## Technical Implementation

### Row Manager System

The `TimelineRenderer.rowManager` object handles all row-related operations:

```javascript
rowManager: {
  // Assign projects to rows to minimize conflicts
  assignProjectsToRows(projects),
  
  // Find the best row for a project (least conflicts)
  findBestRow(project, existingRows),
  
  // Check for date conflicts in a specific row
  checkRowConflicts(newStart, newEnd, rowProjects),
  
  // Move a project to a different row
  moveProjectToRow(projectId, targetRow, allProjects),
  
  // Update project data in localStorage
  updateProjectInStorage(project),
  
  // Get visual drop zones for row interactions
  getRowDropZones(containerBounds, totalRows)
}
```

### Configuration

Row system configuration is part of `TimelineRenderer.config`:

```javascript
config: {
  rowHeight: 70,         // Height of each row (project height + spacing)
  minRows: 3,            // Minimum number of rows to display
  maxRows: 10,           // Maximum number of rows before adding scroll
  projectHeight: 50,     // Height of each project bar
  projectSpacing: 10     // Spacing between project bars
}
```

### Project Data Schema

Projects now include a `row` property:

```javascript
{
  id: 'project-id',
  title: 'Project Title',
  start_date: '2024-01-01',
  end_date: '2024-03-31',
  status: 'engineering',
  row: 0  // Row index (0-based)
}
```

## User Interactions

### Drag Behaviors

1. **Horizontal Drag (Date Change)**:
   - Click and drag project bar horizontally to move dates
   - Resize handles on left/right edges adjust start/end dates
   - Auto-scroll when dragging near timeline edges

2. **Vertical Drag (Row Change)**:
   - Drag project bar vertically to move between rows
   - Visual indicator shows target row during drag
   - Threshold of 15 pixels vertical movement activates row mode

3. **Visual Feedback**:
   - Real-time date feedback during drag operations
   - Row highlighting shows target drop zone
   - Success notifications for completed operations

### Row Assignment Logic

1. **Initial Assignment**:
   - Projects without row assignments are auto-assigned
   - Algorithm sorts projects by start date
   - Finds first available row with no date conflicts

2. **Conflict Detection**:
   - Checks for date overlap between projects in same row
   - Projects with overlapping dates are placed in different rows
   - Algorithm ensures visual clarity and prevents overlaps

3. **Manual Override**:
   - Users can drag projects to specific rows
   - Manual assignments are preserved in storage
   - System respects user preferences while preventing conflicts

## Rendering Process

### Timeline Render Sequence

1. **Project Assignment**: `assignProjectsToRows()` creates row structure
2. **Timeline Wrapper**: Calculate height based on total rows
3. **Row Backgrounds**: `renderRowBackgrounds()` creates visual separation
4. **Project Bars**: `renderProjectBars()` places projects in assigned rows
5. **Enhanced Interactions**: `addProjectDragListenersWithRows()` enables row functionality

### Visual Elements

- **Row Backgrounds**: Alternating light gray colors for visual separation
- **Row Labels**: Blue badges showing "Row 1", "Row 2", etc.
- **Project Bars**: Positioned based on row index and timeline dates
- **Drag Indicators**: Blue dashed outline during row drag operations

## Testing

### Test Page: `test-multi-row.html`

The test page provides:
- Pre-loaded projects with intentional date overlaps
- Visual project list showing current row assignments
- Controls for testing zoom levels and navigation
- Real-time feedback on row assignments and changes

### Test Scenarios

1. **Load Overlapping Projects**: Verify automatic row assignment
2. **Drag Between Rows**: Test vertical drag functionality
3. **Persistence**: Reload page to confirm row assignments persist
4. **Zoom Levels**: Ensure row system works at all zoom levels
5. **Date Changes**: Verify horizontal drag still works correctly

## Integration Points

### Storage System
- Projects stored in `localStorage` with row property
- `SimpleStorage.getAllProjects()` returns projects with row assignments
- Row changes trigger immediate storage updates

### Timeline Renderer
- Enhanced `renderTimeline()` method includes row processing
- Row backgrounds rendered before project bars for proper z-index
- Timeline height calculated based on total rows

### Drag System
- Extended drag listeners support both horizontal and vertical movement
- Row detection based on mouse Y position relative to timeline
- Visual feedback system enhanced for row operations

## Configuration Options

### Customization Parameters

```javascript
// Row spacing and sizing
rowHeight: 70,           // Adjust row height
projectHeight: 50,       // Project bar height
projectSpacing: 10,      // Space between projects

// Row limits
minRows: 3,              // Always show minimum rows
maxRows: 10,             // Maximum before scrolling

// Visual styling
alternatingColors: true, // Row background alternation
showRowLabels: true,     // Display row numbers
```

## Future Enhancements

### Potential Improvements

1. **Row Naming**: Allow custom row names instead of "Row 1", "Row 2"
2. **Row Grouping**: Group related projects in specific rows
3. **Row Collapse**: Ability to collapse/expand empty rows
4. **Row Reordering**: Drag rows to reorder their position
5. **Swimlane Mode**: Assign rows to departments or teams

### Performance Considerations

- Row assignment algorithm is O(n²) for conflict detection
- Consider optimization for large numbers of projects
- Lazy rendering for rows outside viewport
- Virtualization for extremely large project sets

## Troubleshooting

### Common Issues

1. **Projects Not Showing in Rows**: Check console for assignment errors
2. **Drag Not Working**: Verify event listeners are properly attached
3. **Row Backgrounds Missing**: Ensure `renderRowBackgrounds()` is called
4. **Persistence Issues**: Check localStorage storage and retrieval

### Debug Information

Enable detailed console logging by checking:
- Row assignment process logs
- Drag operation status messages
- Storage update confirmations
- Visual feedback activation/deactivation

## Conclusion

The multi-row timeline system provides a robust solution for displaying multiple concurrent projects without visual conflicts. The automatic assignment algorithm, combined with manual drag-and-drop capabilities, offers both automation and user control for optimal project organization.