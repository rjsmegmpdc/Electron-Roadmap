# Roadmap Timeline Tool - Complete Product Requirements Document (PRD)

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [User Interface Components](#user-interface-components)
5. [Data Models](#data-models)
6. [System Configuration](#system-configuration)
7. [User Interactions](#user-interactions)
8. [Testing Framework](#testing-framework)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Roadmap Timeline Tool is a comprehensive project management and visualization system that provides interactive Gantt chart functionality with advanced features for handling complex project portfolios. This PRD covers all implemented features and provides detailed guidance for junior developers.

### Key Capabilities
- **Multi-row Timeline**: Prevents project overlaps through intelligent row assignment
- **Advanced Zoom System**: Six zoom levels from overview to detailed weekly view
- **Collision Detection**: Automatic conflict resolution and project positioning
- **Smooth Drag Interactions**: Real-time visual feedback with 60fps performance
- **Financial Year Support**: April-March financial year alignment
- **Responsive Design**: Works across different screen sizes and devices

---

## Core Features

### 1. Multi-Row Timeline System

#### Purpose
Eliminates visual overlaps between concurrent projects by automatically organizing them into separate rows while maintaining timeline accuracy.

#### Technical Implementation
```javascript
// Row assignment in TimelineRenderer.rowManager
assignProjectsToRows(projects) {
  const rows = [];
  const sortedProjects = [...projects].sort((a, b) => {
    const aStart = new Date(a.start_date);
    const bStart = new Date(b.start_date);
    return aStart - bStart;
  });
  
  sortedProjects.forEach(project => {
    if (typeof project.row === 'number' && project.row >= 0) {
      // Use existing row assignment
      while (rows.length <= project.row) rows.push([]);
      rows[project.row].push(project);
    } else {
      // Find optimal row
      const assignedRow = this.findBestRow(project, rows);
      project.row = assignedRow;
      rows[assignedRow].push(project);
    }
  });
  
  return { rows, totalRows: rows.length };
}
```

#### Visual Configuration
```javascript
config: {
  rowHeight: 70,         // Total height per row
  minRows: 3,            // Always visible rows
  maxVisibleRows: 8,     // Maximum drop zones
  projectHeight: 50,     // Individual project height
  projectSpacing: 10     // Space between projects
}
```

#### Row Background Styling
- **Occupied Rows**: Alternating `rgba(248, 249, 250, 0.4)` and `rgba(233, 236, 239, 0.4)`
- **Empty Rows**: Same colors with 0.2 opacity
- **Row Labels**: Blue badges with "Row X" or "+ Row X" for empty rows
- **Hover Effects**: Blue highlight during drag operations

### 2. Advanced Zoom System

#### Zoom Levels Configuration
```javascript
zoomLevels: {
  'overview': {
    name: 'Overview',
    dayWidth: 1,           // 1px per day - ultra compressed
    interval: 365,         // Yearly markers
    format: 'YYYY',        // Year only
    gridLines: 'year',
    projectStyle: 'dot'    // Renders projects as colored dots
  },
  'year': {
    name: 'Year View',
    dayWidth: 3,           // 3px per day
    interval: 60,          // Bimonthly markers
    format: 'MMM YYYY',    // Jan 2025
    gridLines: 'month'
  },
  'quarter': {
    name: 'Quarter View',
    dayWidth: 4,           // 4px per day
    interval: 14,          // Biweekly markers
    format: 'MMM DD',      // Jan 15
    gridLines: 'week'
  },
  'month': {
    name: 'Month View',    // Default view
    dayWidth: 8,           // 8px per day
    interval: 7,           // Weekly markers
    format: 'MMM DD',      // Jan 15
    gridLines: 'week'
  },
  'fortnight': {
    name: 'Fortnight View',
    dayWidth: 20,          // 20px per day
    interval: 3,           // Every 3 days
    format: 'ddd MM/DD',   // Mon 01/15
    gridLines: 'day'
  },
  'week': {
    name: 'Week View',
    dayWidth: 40,          // 40px per day - most detailed
    interval: 1,           // Daily markers
    format: 'ddd MM/DD',   // Mon 01/15
    gridLines: 'day'
  }
}
```

#### Zoom Behavior
- **Today Centering**: All zoom operations center the timeline on today's date
- **Overview Mode**: Projects appear as colored dots showing entire timeline span
- **Progressive Detail**: Each zoom level provides appropriate level of detail
- **Smooth Transitions**: Visual feedback during zoom changes

### 3. Collision Detection & Auto-Snap System

#### Conflict Resolution Strategies
```javascript
findOptimalPosition(projectId, targetRow, newStartDate, newEndDate, allProjects) {
  // Strategy 1: Check if target row is empty
  if (projectsInRow.length === 0) {
    return { row: targetRow, startDate: newStartDate, endDate: newEndDate };
  }
  
  // Strategy 2: Find gap in same row
  const emptySpace = this.findEmptySpaceInRow(projectsInRow, newStartDate, newEndDate);
  if (emptySpace) {
    return { row: targetRow, startDate: emptySpace.startDate, endDate: emptySpace.endDate };
  }
  
  // Strategy 3: Find nearest empty row
  const nearestEmptyRow = this.findNearestEmptyRow(targetRow, allProjects);
  if (nearestEmptyRow !== null) {
    return { row: nearestEmptyRow, startDate: newStartDate, endDate: newEndDate };
  }
  
  // Strategy 4: Find any available row
  // ... additional logic
}
```

#### Visual Drop Zones
- **All Rows Visible**: Shows occupied and empty rows for dropping
- **Hover Indicators**: Blue highlighting during drag operations
- **Row Drop Zones**: Visual feedback showing valid drop targets

### 4. Enhanced Drag System

#### Drag Types & Behaviors
1. **Horizontal Drag (Date Changes)**:
   - **Move Project**: Drag project bar to change dates
   - **Resize Left**: Drag left edge to change start date
   - **Resize Right**: Drag right edge to change end date
   - **Auto-scroll**: Automatic scrolling at timeline edges

2. **Vertical Drag (Row Changes)**:
   - **Row Detection**: 15px vertical threshold activates row mode
   - **Smooth Interpolation**: Projects follow mouse cursor smoothly
   - **Visual Feedback**: Row indicators and drag tooltips

#### Performance Optimizations
```javascript
// 60fps smooth animations using requestAnimationFrame
requestAnimationFrame(() => {
  // Apply visual changes immediately
  projectBar.style.left = newLeft + 'px';
  projectBar.style.top = newTop + 'px';
  projectBar.style.transition = 'none';
  
  // Enhanced visual feedback
  projectBar.style.transform = 'scale(1.05) translateZ(0)';
  projectBar.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
});
```

#### Auto-scroll Configuration
```javascript
const SCROLL_ZONE_WIDTH = 100;      // Edge detection zone
const SCROLL_SPEED_MAX = 15;        // Maximum scroll speed
const SCROLL_ACCELERATION = 1.2;     // Speed multiplier
```

### 5. Project Visualization Modes

#### Standard Mode (All zoom levels except overview)
- **Project Bars**: Rectangular bars with status colors
- **Resize Handles**: Left/right handles for date adjustment
- **Project Titles**: Text overlay on project bars
- **Hover Effects**: Scale and shadow animations

#### Overview Mode (Maximum zoom out)
- **Colored Dots**: 12px circular dots representing projects
- **Status Colors**: Same color scheme as project bars
- **Tooltips**: Hover shows project name and date range
- **Simplified Interaction**: Click navigation only (no drag/resize)

```javascript
// Overview mode rendering logic
if (isOverviewMode) {
  const centerX = startX + (width / 2);
  const dotSize = 12;
  
  projectBar.style.cssText = `
    position: absolute;
    left: ${centerX - (dotSize / 2)}px;
    top: ${dotY}px;
    width: ${dotSize}px;
    height: ${dotSize}px;
    background: ${this.getStatusColor(project.status)};
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.9);
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  `;
}
```

---

## Technical Architecture

### File Structure
```
src/
├── js/
│   ├── app-simple.js           # Main timeline application
│   ├── storage-system.js       # Data persistence layer
│   └── utils.js                # Utility functions
├── styles/
│   └── main.css               # Complete styling including scrollbars
├── docs/
│   ├── roadmap-timeline-prd.md # This document
│   └── multi-row-system.md     # Legacy documentation
└── test-*.html                # Test pages for various features
```

### Core Classes & Objects

#### TimelineRenderer
Main rendering engine with these key methods:
```javascript
TimelineRenderer = {
  config: {},              // System configuration
  zoomLevels: {},         // Zoom level definitions
  currentZoom: 'month',   // Active zoom level
  rowManager: {},         // Row management system
  
  // Core methods
  init(),                         // Initialize timeline
  renderTimeline(),              // Main render function
  renderProjectBars(),           // Project visualization
  renderRowBackgrounds(),        // Row visual system
  renderDateHeaders(),           // Timeline headers
  addProjectDragListenersWithRows() // Enhanced drag system
}
```

#### Row Manager
Handles all row-related operations:
```javascript
rowManager: {
  assignProjectsToRows(projects),           // Auto-assignment
  findOptimalPosition(),                    // Collision resolution
  moveProjectToRow(),                       // Manual row changes
  checkRowConflicts(),                      // Conflict detection
  findEmptySpaceInRow(),                   // Gap detection
  updateProjectInStorage()                  // Persistence
}
```

### Data Flow

1. **Initialization**: `TimelineRenderer.init()` → `renderTimeline()`
2. **Project Loading**: `SimpleStorage.getAllProjects()` → Row assignment
3. **Rendering**: Row backgrounds → Project bars → Date headers → Today marker
4. **Interaction**: Event listeners → Drag handlers → Collision detection → Storage update

---

## User Interface Components

### Timeline Structure
```html
<div class="timeline-view">
  <section class="timeline-controls">
    <!-- Zoom controls, add project, export/import -->
  </section>
  
  <section class="timeline-section">
    <div class="timeline-header">
      <div class="timeline-dates">
        <!-- Date markers generated dynamically -->
      </div>
    </div>
    
    <div id="timeline-container" class="timeline-container">
      <div class="timeline-wrapper">
        <!-- Row backgrounds -->
        <!-- Project bars -->
        <!-- Today marker -->
      </div>
    </div>
  </section>
  
  <section class="timeline-legend">
    <!-- Status legend -->
  </section>
</div>
```

### Project Bar Structure (Non-overview mode)
```html
<div class="timeline-project-bar status-engineering">
  <div class="resize-handle left-handle"></div>
  <div class="resize-handle right-handle"></div>
  <div>Project Title</div>
</div>
```

### CSS Classes & Styling

#### Project Status Colors
```css
.status-concept-design   { background: linear-gradient(135deg, #f39c12, #e67e22); }
.status-solution-design  { background: linear-gradient(135deg, #9b59b6, #8e44ad); }
.status-engineering      { background: linear-gradient(135deg, #3498db, #2980b9); }
.status-uat             { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.status-release         { background: linear-gradient(135deg, #27ae60, #229954); }
```

#### Enhanced Scrollbars
```css
.timeline-container::-webkit-scrollbar,
.timeline-header::-webkit-scrollbar {
  height: 16px;  /* Doubled from 8px for better visibility */
}

.timeline-container,
.timeline-header {
  scrollbar-width: thick;  /* Firefox: thick instead of thin */
}
```

---

## Data Models

### Project Data Schema
```javascript
{
  id: 'unique-project-id',        // String: Unique identifier
  title: 'Project Name',          // String: Display name
  description: 'Project details', // String: Optional description
  start_date: '2025-04-01',      // String: ISO date (YYYY-MM-DD)
  end_date: '2025-06-30',        // String: ISO date (YYYY-MM-DD)
  status: 'engineering',          // String: Project phase
  row: 0,                         // Number: Row index (0-based)
  budget: '125000',              // String: Budget amount
  financial_treatment: 'CAPEX'    // String: CAPEX|OPEX|MIXED
}
```

### Status Values
```javascript
const validStatuses = [
  'concept-design',    // Purple gradient
  'solution-design',   // Blue gradient
  'engineering',       // Light blue gradient
  'uat',              // Red gradient
  'release'           // Green gradient
];
```

### Storage Structure
Projects are stored in localStorage as JSON:
```javascript
// Key: 'roadmap-projects'
[
  { id: 'proj-1', title: 'Alpha', start_date: '2025-04-01', ... },
  { id: 'proj-2', title: 'Beta', start_date: '2025-05-01', ... }
]
```

---

## System Configuration

### Timeline Configuration
```javascript
config: {
  // Visual Layout
  yearHeaderHeight: 30,    // Year indicator height
  timelineHeight: 60,      // Date header height
  projectHeight: 50,       // Individual project bar height
  projectSpacing: 10,      // Space between projects
  todayMarkerWidth: 4,     // Today line width
  
  // Row System
  rowHeight: 70,           // Total row height (project + spacing)
  minRows: 3,              // Always visible rows
  maxRows: 10,             // Maximum before scrolling
  maxVisibleRows: 8,       // Drop zone limit
  
  // Timeline Bounds
  timelineStartYear: 2025  // Timeline start year
}
```

### Financial Year Configuration
- **Financial Year**: April 1st to March 31st
- **Date Defaults**: Start = today, End = March 31st of appropriate FY
- **FY Detection**: Automatic based on current date

---

## User Interactions

### Drag & Drop Interactions

#### 1. Horizontal Project Movement
**Trigger**: Click and drag project bar (not on resize handles)
**Behavior**: 
- Changes project start and end dates
- Maintains project duration
- Shows real-time date feedback
- Auto-scrolls at timeline edges

**Implementation**:
```javascript
// Calculate new dates based on pixel movement
const deltaX = e.clientX - dragStartX;
const dayWidth = getDayWidth();
const newLeft = dragStartLeft + deltaX;
const newStartDate = pixelToDate(newLeft);
const newEndDate = new Date(newStartDate.getTime() + projectDuration);
```

#### 2. Project Resizing
**Left Handle**: Changes start date, keeps end date fixed
**Right Handle**: Changes end date, keeps start date fixed
**Constraints**: Minimum 1 day duration

#### 3. Vertical Row Movement
**Trigger**: Vertical mouse movement > 15px during drag
**Behavior**:
- Smooth interpolation between rows
- Visual row indicators
- Collision detection and auto-snap
- Row assignment persistence

### Zoom Controls
**Zoom In**: `Ctrl + Plus` or Zoom In button
**Zoom Out**: `Ctrl + Minus` or Zoom Out button  
**Reset**: `Ctrl + 0` or Reset button
**Go to Today**: Click Today button or press `T`

### Keyboard Shortcuts
- `Ctrl + Plus`: Zoom in
- `Ctrl + Minus`: Zoom out
- `Ctrl + 0`: Reset zoom
- `T`: Go to today

---

## Testing Framework

### Test Pages Overview

#### 1. `test-multi-row.html`
**Purpose**: Test multi-row system and collision detection
**Features**:
- Pre-loaded overlapping projects (FY26 data)
- Visual project list with row assignments
- Real-time row change feedback
**Test Scenarios**:
- Auto-assignment of overlapping projects
- Manual row changes via drag
- Row persistence after page reload

#### 2. `test-smooth-drag.html`
**Purpose**: Test enhanced drag performance and visual feedback
**Features**:
- FPS counter for performance monitoring
- Projects optimized for drag testing
- Real-time drag mode indicator
**Test Scenarios**:
- 60fps smooth dragging
- Visual feedback quality
- Auto-scroll at edges

#### 3. `test-collision-snap.html`
**Purpose**: Test collision detection and auto-snap algorithms
**Features**:
- Intentionally conflicting projects
- Well-spaced projects for empty row testing
- Visual feedback for auto-snap actions
**Test Scenarios**:
- Project collision detection
- Auto-snap to empty spaces
- Date adjustment during conflicts

#### 4. Additional Test Pages
- `test-5-year-timeline.html`: Long-term timeline testing
- `test-zoom-today.html`: Zoom and today navigation
- `test-year-view.html`: Annual overview testing
- `test-auto-scroll-drag.html`: Edge scrolling behavior

### Test Data Sets

#### FY26 Project Data (2025-2026)
```javascript
// Sample test projects spanning financial year
const testProjects = [
  {
    id: 'fy26-q1-alpha',
    title: 'Project Alpha - Q1 FY26 Launch',
    start_date: '2025-04-15',
    end_date: '2025-06-30',
    status: 'engineering',
    row: null  // Auto-assigned
  },
  // ... additional test projects
];
```

### Testing Procedures

#### 1. Manual Testing Checklist
- [ ] Load test data successfully
- [ ] Auto-assign projects to rows without conflicts
- [ ] Drag projects horizontally (date changes)
- [ ] Drag projects vertically (row changes)
- [ ] Test all zoom levels
- [ ] Verify collision detection
- [ ] Check persistence after reload
- [ ] Test today navigation
- [ ] Validate auto-scroll at edges

#### 2. Performance Testing
- [ ] Measure FPS during drag operations (target: 60fps)
- [ ] Test with 50+ projects
- [ ] Memory usage validation
- [ ] Scroll performance with large timelines

#### 3. Browser Compatibility
- [ ] Chrome/Edge (Webkit scrollbars)
- [ ] Firefox (scrollbar-width)
- [ ] Safari (WebKit compatibility)
- [ ] Mobile responsiveness

---

## Implementation Guidelines

### For Junior Developers

#### 1. Getting Started
```bash
# Navigate to project directory
cd "C:\Users\smhar\Roadmap-Tool v2\src"

# Open main timeline
start index.html

# Open test dashboard
start launchpad.html
```

#### 2. Key Files to Understand
1. **`js/app-simple.js`**: Main application logic
2. **`styles/main.css`**: All styling including new scrollbar styles
3. **`test-*.html`**: Individual feature test pages
4. **`launchpad.html`**: Main dashboard with test access

#### 3. Debugging Best Practices
```javascript
// Enable detailed logging
console.log('🎨 Rendering projects:', projects);
console.log('📊 Row assignment:', { rows, totalRows });
console.log('🔍 Zoom config:', zoomConfig);
```

#### 4. Common Development Tasks

**Adding New Project Status**:
1. Update `getStatusColor()` method
2. Add CSS gradient in styles
3. Update legend in HTML

**Modifying Zoom Levels**:
1. Edit `zoomLevels` object
2. Update `zoomOrder` array
3. Test date header rendering

**Changing Row Configuration**:
1. Modify `TimelineRenderer.config`
2. Update CSS row-related styles
3. Test with various project counts

#### 5. Code Style Guidelines
```javascript
// Use descriptive console logs with emojis
console.log('📅 Timeline bounds calculated:', bounds);

// Include detailed parameter documentation
/**
 * Assigns projects to rows to minimize overlaps
 * @param {Array} projects - Array of project objects
 * @returns {Object} { rows: Array<Array>, totalRows: number }
 */
assignProjectsToRows(projects) {
  // Implementation
}
```

### Architecture Patterns

#### 1. Event-Driven Updates
```javascript
// Pattern: Update → Render → Persist
function updateProject(projectId, changes) {
  const projects = getAllProjects();
  const updatedProjects = projects.map(p => 
    p.id === projectId ? { ...p, ...changes } : p
  );
  
  saveProjects(updatedProjects);  // Persist
  renderTimeline();               // Re-render
}
```

#### 2. Configuration-Driven Rendering
```javascript
// Use config object for all sizing calculations
const y = this.config.yearHeaderHeight + 
          this.config.timelineHeight + 
          (rowIndex * this.config.rowHeight);
```

#### 3. Responsive Event Handling
```javascript
// Clean up event listeners on re-render
if (projectBar._cleanupDragListeners) {
  projectBar._cleanupDragListeners();
}
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Projects Not Showing in Rows
**Symptoms**: Projects overlap or don't display properly
**Causes**: 
- Row assignment failure
- Missing row property in project data
- Timeline bounds calculation error

**Solutions**:
```javascript
// Check project data structure
console.log('Project data:', projects);

// Verify row assignment
console.log('Row assignment result:', this.rowManager.assignProjectsToRows(projects));

// Check timeline bounds
console.log('Timeline bounds:', bounds);
```

#### 2. Drag Operations Not Working
**Symptoms**: Projects don't respond to mouse events
**Causes**:
- Event listeners not attached
- CSS pointer-events blocking interaction
- Overview mode drag prevention

**Solutions**:
```javascript
// Verify event listener attachment
console.log('Drag listeners attached:', !!projectBar._cleanupDragListeners);

// Check CSS pointer-events
projectBar.style.pointerEvents = 'auto';

// Ensure not in overview mode for drag operations
if (this.currentZoom !== 'overview') {
  this.addProjectDragListenersWithRows(/* parameters */);
}
```

#### 3. Row Backgrounds Missing
**Symptoms**: No visual row separation
**Causes**:
- `renderRowBackgrounds()` not called
- CSS z-index issues
- Container width calculation problems

**Solutions**:
```javascript
// Ensure method is called in render sequence
this.renderRowBackgrounds(container, totalRows, bounds);

// Check CSS z-index layering
// Backgrounds: z-index 0
// Projects: z-index 1+
// Row labels: z-index 5
```

#### 4. Zoom Not Centering on Today
**Symptoms**: Timeline doesn't center properly after zoom
**Causes**:
- Container width not ready during calculation
- Today position calculation error
- Timing issues with DOM updates

**Solutions**:
```javascript
// Multiple timing attempts for reliability
const attempts = [100, 200, 300];
attempts.forEach((delay, index) => {
  setTimeout(() => {
    if (!centerOnTodayAfterZoom() && index === attempts.length - 1) {
      console.warn('Failed to center on Today');
    }
  }, delay);
});
```

#### 5. Performance Issues
**Symptoms**: Lag during drag operations, low FPS
**Causes**:
- Too many DOM updates per frame
- Missing requestAnimationFrame
- Memory leaks from event listeners

**Solutions**:
```javascript
// Use requestAnimationFrame for smooth updates
requestAnimationFrame(() => {
  // Apply all visual changes in single frame
});

// Clean up event listeners
projectBar._cleanupDragListeners = () => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};
```

### Debug Console Commands

```javascript
// Check timeline state
window.TimelineRenderer.currentZoom
window.TimelineRenderer.config

// Inspect projects
SimpleStorage.getAllProjects()

// Force re-render
TimelineRenderer.renderTimeline()

// Test zoom levels
timelineZoom('overview')  // Test overview mode
timelineZoom('week')      // Test detailed mode

// Check row assignments
projects.forEach(p => console.log(p.title, 'Row:', p.row))
```

### Performance Monitoring

```javascript
// FPS monitoring (available in test pages)
let fpsCounter = 0;
let lastFpsTime = performance.now();

function updateFPS() {
  const now = performance.now();
  fpsCounter++;
  
  if (now - lastFpsTime >= 1000) {
    console.log('FPS:', fpsCounter);
    fpsCounter = 0;
    lastFpsTime = now;
  }
  requestAnimationFrame(updateFPS);
}
```

---

## Conclusion

This PRD provides comprehensive documentation for all implemented features in the Roadmap Timeline Tool. Junior developers should use this document as their primary reference for understanding system architecture, implementing new features, and troubleshooting issues.

### Key Success Metrics
- **Performance**: 60fps smooth dragging and zooming
- **Usability**: Zero overlapping projects, intuitive row system
- **Reliability**: Persistent row assignments, robust conflict resolution
- **Scalability**: Handles 50+ projects efficiently
- **Compatibility**: Works across modern browsers with enhanced scrollbars

### Next Steps for Development
1. Review test pages to understand feature implementations
2. Use debugging tools and console commands for troubleshooting
3. Follow coding patterns established in the codebase
4. Test thoroughly using provided test scenarios
5. Refer to troubleshooting section for common issues

This system provides a robust foundation for project timeline visualization with advanced features that can be extended and maintained by developers of all skill levels.