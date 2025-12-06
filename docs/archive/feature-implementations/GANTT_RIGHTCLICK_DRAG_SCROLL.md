# Gantt Chart Right-Click Drag Scrolling

## Overview
Replaced keyboard navigation with an intuitive right-click and drag scrolling feature. Users can now scroll the Gantt Chart timeline by clicking and holding the right mouse button and swiping left or right.

## Features

### Right-Click Drag to Scroll
- **Hold Right Mouse Button** + **Drag Left**: Scroll timeline left
- **Hold Right Mouse Button** + **Drag Right**: Scroll timeline right
- Smooth, responsive scrolling that tracks cursor movement in real-time
- Works seamlessly with all zoom levels
- Context menu is suppressed to prevent interference

### Visual Feedback
- **Cursor Changes**: 
  - `grab` cursor when hovering (indicates scrolling available)
  - `grabbing` cursor when actively dragging (indicates scrolling in progress)
- Provides clear visual indication of drag functionality

### Implementation Details

#### Drag State Management
```typescript
const [isDragging, setIsDragging] = useState(false);
const [dragStartX, setDragStartX] = useState(0);
const [scrollStartLeft, setScrollStartLeft] = useState(0);
```

#### Mouse Down Handler
- Detects right mouse button (button 2)
- Records starting X position and current scroll position
- Sets dragging state to true

#### Mouse Move Handler
- Calculates delta (distance moved) from drag start
- Applies delta to scroll position in real-time
- Formula: `scrollLeft = scrollStartLeft - deltaX`
  - Positive drag (moving left on screen) scrolls timeline right
  - Negative drag (moving right on screen) scrolls timeline left

#### Mouse Up Handler
- Resets dragging state when mouse released
- Attached to document to handle releases outside chart

#### Context Menu Prevention
- `handleContextMenu` prevents browser context menu
- Allows right-click to be used solely for dragging

### Scroll Synchronization
- Right-click drag scrolls the header container
- Existing scroll handlers automatically sync the rows
- Timeline header and project bars remain perfectly aligned

### User Experience Flow
1. User right-clicks on the Gantt Chart (cursor changes to `grab`)
2. User holds right mouse button
3. User drags mouse left or right while holding button
4. Timeline scrolls smoothly in response to drag
5. Header and rows stay synchronized
6. User releases mouse button to stop scrolling
7. Cursor returns to normal `grab` state

## Advantages Over Keyboard Navigation

- **Intuitive**: Mimics natural drag-to-scroll interaction (like Google Maps)
- **Responsive**: Real-time scrolling as you drag
- **Precise**: Direct correlation between cursor movement and scroll distance
- **Works Everywhere**: Functions in normal and fullscreen modes
- **No Focus Issues**: No need for element focus management
- **Smooth**: Continuous scrolling without discrete steps

## Technical Notes

### Event Handling
- Uses React synthetic events for `onMouseDown`, `onMouseMove`, `onContextMenu`
- Document-level `mouseup` listener ensures drag stops even if mouse leaves window
- `preventDefault()` on context menu suppresses default behavior

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard Mouse Events API
- No external dependencies

### Performance
- Uses refs for efficient scroll updates (no re-renders on scroll)
- Drag state updates only trigger on significant mouse movement
- Efficient delta calculation

## Styling
- Container has `userSelect: 'none'` to prevent text selection during drag
- Cursor feedback provides clear interaction hints

## Testing Checklist
- [ ] Right-click and drag left scrolls timeline left
- [ ] Right-click and drag right scrolls timeline right
- [ ] Header and rows stay synchronized during drag
- [ ] Works with all zoom levels
- [ ] Works in fullscreen mode
- [ ] Cursor changes to `grab` on hover
- [ ] Cursor changes to `grabbing` while dragging
- [ ] Context menu does not appear on right-click
- [ ] Scrolling stops when mouse released
- [ ] Works if mouse moves outside chart while dragging
- [ ] Left-click behavior unaffected
- [ ] Middle-click behavior unaffected

## Future Enhancements

### Suggested Improvements
1. **Scroll Momentum**: Add inertial scrolling after release
2. **Smooth Animation**: Add easing/smoothing to scroll motion
3. **Touch Support**: Add touch drag support for tablets/touch devices
4. **Scroll Feedback**: Visual indicator showing drag distance
5. **Snap-to-Period**: Optional snapping to month/quarter boundaries
6. **Scroll Speed**: Configurable drag-to-scroll ratio
7. **Double-Tap**: Double right-click to scroll full width
8. **Keyboard Override**: Shift+Right-click for different behavior

## Configuration Options

### Scroll Sensitivity
Could be made configurable by multiplying delta:
```typescript
const sensitivity = 1.0; // 1.0 = 1:1, 0.5 = half speed, 2.0 = double speed
headerScrollContainerRef.current.scrollLeft = scrollStartLeft - (deltaX * sensitivity);
```

### Visual Feedback
Cursor types can be customized:
- `grab` / `grabbing`: Current default
- `move`: For dragging concept
- `hand`: Alternative cursor style
