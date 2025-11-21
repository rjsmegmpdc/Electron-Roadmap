# Gantt Chart Fullscreen Toggle Feature

## Overview
Added a fullscreen expansion feature to the Gantt Chart component. Users can click a maximize button to expand the chart to full screen and click a minimize button to return to normal view.

## Implementation Details

### State Management
- Added `isFullscreen` state: `const [isFullscreen, setIsFullscreen] = useState(false);`
- Tracks whether the chart is in fullscreen mode

### Ref for Container
- Added `ganttContainerRef` to reference the main Gantt container div
- Allows precise styling control when fullscreen state changes

### Button Placement
- Placed maximize/minimize button next to the existing refresh button (🔄)
- Both buttons grouped in a flex container with 6px gap
- Located in the top right of the status filters row

### Visual States
- **Normal State**: Icon shows "⛶" (maximize/expand symbol)
  - Button title: "Expand to fullscreen"
  - Chart maintains original dimensions and styling
  
- **Fullscreen State**: Icon changes to "⏹" (minimize/collapse symbol)
  - Button title: "Exit fullscreen"
  - Chart expands to cover entire viewport

### Fullscreen Styling
When `isFullscreen` is true, the container applies:
```css
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
width: 100vw;
height: 100vh;
z-index: 1000;
border-radius: 0;
border: none;
```

This ensures:
- Chart covers the entire screen
- High z-index (1000) ensures it's above other content
- No border radius or border in fullscreen mode
- Fixed positioning prevents scrolling behind

### Normal State Styling
Reverts to original styling when exiting fullscreen:
- Respects `height` prop if provided
- Maintains `flex: 1, minHeight: 0` for responsive layout
- Restores `borderRadius` and `border` styling

### Toggle Behavior
Clicking the button toggles the fullscreen state:
```typescript
onClick={() => setIsFullscreen(!isFullscreen)}
```

Simple boolean toggle with no keyboard escape handling (can be added if needed).

## Button Styling
Both refresh and fullscreen buttons share consistent styling:
- Padding: 6px 8px
- Size: 32px × 32px minimum
- Font size: 16px
- Hover effects:
  - Background color changes to `var(--bg-hover)`
  - Border color changes to `var(--border-color-dark)`
  - Text color changes to `var(--text-primary)`
- Smooth transitions using `var(--transition-colors)`

## User Experience
1. User sees maximize button (⛶) in the top right corner next to refresh button
2. Clicking expands the Gantt Chart to fill the entire screen
3. Button icon changes to minimize (⏹) indicating how to exit
4. All chart functionality remains available in fullscreen mode
5. Scrolling, zooming, and interactions work normally
6. Clicking the button again or any external click returns to normal view

## Technical Notes
- No keyboard shortcuts (Esc key not bound) - could be added for standard UX
- Fullscreen uses CSS position fixed, not browser fullscreen API
- All scroll references and refs continue to work in fullscreen
- Responsive to viewport changes
- Works across all zoom levels (week, fortnight, month, quarter, year)

## Future Enhancements
- Add Escape key handler to exit fullscreen
- Add fullscreen state persistence to localStorage
- Add keyboard shortcuts (F key for fullscreen)
- Add transition animation when entering/exiting fullscreen
- Consider using browser Fullscreen API for true fullscreen with permissions
