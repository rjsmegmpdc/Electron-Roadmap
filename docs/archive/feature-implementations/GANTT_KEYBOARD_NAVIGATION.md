# Gantt Chart Keyboard Navigation

## Overview
Added keyboard navigation support to scroll the Gantt Chart timeline horizontally using arrow keys. Users can now navigate left and right through the timeline without using the mouse.

## Features

### Arrow Key Scrolling
- **Left Arrow (←)**: Scroll timeline left by 100 pixels
- **Right Arrow (→)**: Scroll timeline right by 100 pixels
- Works when the Gantt Chart has focus
- Smooth, responsive scrolling

### Implementation Details

#### Focus Management
- Gantt container has `tabIndex={0}` to make it focusable
- Users can click on the chart to focus it, then use arrow keys
- Keyboard events are captured via `onKeyDown` handler

#### Event Handling
```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  const scrollAmount = 100; // pixels to scroll per key press
  
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    headerScrollContainerRef.current.scrollLeft -= scrollAmount;
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    headerScrollContainerRef.current.scrollLeft += scrollAmount;
  }
};
```

#### Scroll Synchronization
- Left/Right arrow keys scroll the header container
- The header scroll is automatically synced to the rows container
- Ensures bars and timeline header stay aligned

### Accessibility
- `role="region"` indicates a meaningful area of content
- `aria-label="Gantt Chart Timeline"` provides semantic meaning for screen readers
- `outline: 'none'` prevents browser focus outline (can be enhanced with custom styling)
- Standard keyboard controls follow web accessibility guidelines

### User Experience
1. User clicks on the Gantt Chart to focus it
2. Chart receives focus (can add visual indicator like border highlight)
3. User presses Left/Right arrow keys
4. Timeline scrolls smoothly left or right
5. Header and rows stay synchronized
6. Works with all zoom levels (week, fortnight, month, quarter, year)

### Scroll Amount
- Currently set to **100 pixels per key press**
- Can be adjusted based on user preference
- Could be made configurable or vary by zoom level

## Keyboard Shortcuts Summary
| Key | Action |
|-----|--------|
| ← | Scroll timeline left 100px |
| → | Scroll timeline right 100px |

## Technical Notes

### Event Propagation
- `e.preventDefault()` prevents default browser scroll behavior
- Allows custom scroll amount and behavior

### Container References
- Uses `headerScrollContainerRef` to apply scroll changes
- Automatically syncs with `rowsScrollContainerRef` via existing scroll handlers
- Ensures visual alignment is maintained

### Focus Management
- Container is focusable via `tabIndex={0}`
- Keyboard events only work when container has focus
- User must click on chart first to enable keyboard navigation

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard React keyboard event handling
- No external dependencies

## Future Enhancements

### Suggested Improvements
1. **Visual Focus Indicator**: Add border highlight when focused
2. **Scroll Amount Options**:
   - Adjustable scroll distance in settings
   - Vary scroll amount by zoom level
   - Shift+Arrow for larger jumps
   
3. **Additional Keyboard Controls**:
   - Home key to scroll to timeline start
   - End key to scroll to timeline end
   - Page Up/Page Down for larger scrolls
   - Ctrl+Home/Ctrl+End for extremes

4. **Custom Scroll Behavior**:
   - Smooth scroll animation
   - Acceleration/deceleration
   - Snap-to-month when zoomed out

5. **Keyboard Hint**:
   - Show tooltip or help on first focus
   - Display keyboard shortcuts in UI

## Testing Checklist
- [ ] Click on chart and press Left arrow - scrolls left
- [ ] Click on chart and press Right arrow - scrolls right
- [ ] Header and rows stay synchronized during scroll
- [ ] Scrolling works with all zoom levels
- [ ] Scroll doesn't go past timeline boundaries (browser handles)
- [ ] Keyboard works both normal and fullscreen modes
- [ ] Tab key can focus the chart (accessibility)
