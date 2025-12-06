# Dark Mode Testing Guide

## Testing Checklist

### ✅ Test 1: First Launch (Default Behavior)
**Expected Result:** App follows system theme by default

1. Launch the app for the first time
2. Check if theme matches your Windows system theme
3. Navigate to Settings → Appearance
4. Verify "Use System Theme" toggle is ON
5. Verify current theme indicator shows correct theme

**Pass Criteria:**
- Theme matches Windows setting
- "Use System Theme" toggle is enabled
- No flash of wrong theme on startup

---

### ✅ Test 2: System Theme Changes
**Expected Result:** App automatically follows Windows theme changes

1. With "Use System Theme" enabled
2. Go to Windows Settings → Personalization → Colors
3. Change between Light and Dark mode
4. App theme should change automatically within 1 second

**Pass Criteria:**
- Theme switches automatically
- No need to restart app
- Smooth color transition

---

### ✅ Test 3: Manual Dark Mode Toggle
**Expected Result:** Manual control overrides system theme

1. Navigate to Settings → Appearance
2. Turn OFF "Use System Theme" toggle
3. "Dark Mode" toggle should appear
4. Toggle Dark Mode ON and OFF
5. Verify theme changes immediately

**Pass Criteria:**
- Dark Mode toggle appears when System Theme is off
- Theme changes instantly on toggle
- Colors transition smoothly

---

### ✅ Test 4: Settings Persistence (Database)
**Expected Result:** Theme preferences persist across app restarts

**Scenario A: System Theme Enabled**
1. Set "Use System Theme" to ON
2. Click "Save Settings" button
3. Close the app completely
4. Relaunch the app
5. Navigate to Settings → Appearance
6. Verify "Use System Theme" is still ON

**Scenario B: Manual Dark Mode**
1. Set "Use System Theme" to OFF
2. Set "Dark Mode" to ON
3. Click "Save Settings" button
4. Close the app completely
5. Relaunch the app
6. Navigate to Settings → Appearance
7. Verify both settings are preserved

**Pass Criteria:**
- Settings persist after app restart
- Theme is applied correctly on startup
- No flash of wrong theme

---

### ✅ Test 5: Auto-Save on Toggle
**Expected Result:** Theme changes are auto-saved without clicking "Save Settings"

1. Navigate to Settings → Appearance
2. Toggle "Use System Theme" OFF
3. Toggle "Dark Mode" ON
4. Close the app **WITHOUT** clicking "Save Settings"
5. Relaunch the app
6. Verify dark mode is still active

**Pass Criteria:**
- Theme settings persist without explicit save
- Database is updated automatically
- localStorage is updated automatically

---

### ✅ Test 6: Component Color Consistency
**Expected Result:** All UI elements use correct theme colors

**Light Theme Check:**
1. Set to Light theme
2. Check these areas:
   - Sidebar navigation (background, text, borders)
   - Settings page (backgrounds, text)
   - Buttons (hover states)
   - Input fields (borders, text)
   - Info pane (background, text)

**Dark Theme Check:**
1. Set to Dark theme
2. Check same areas as above

**Pass Criteria:**
- No white backgrounds in dark mode
- No black text on dark backgrounds
- All text is readable
- Borders are visible but subtle
- Hover states work correctly

---

### ✅ Test 7: Transition Smoothness
**Expected Result:** Theme switches are smooth and pleasant

1. Toggle between light and dark mode rapidly
2. Observe color transitions

**Pass Criteria:**
- Transitions are smooth (0.3s duration)
- No flickering
- All elements transition together
- No jarring color changes

---

### ✅ Test 8: Settings Page UI
**Expected Result:** Theme controls are intuitive and work correctly

1. Navigate to Settings → Appearance section
2. Verify layout and styling
3. Check toggle switches:
   - Visual feedback on hover
   - Smooth animation when toggled
   - Clear ON/OFF states
4. Check current theme indicator
5. Verify tip box colors adapt to theme

**Pass Criteria:**
- Toggle switches are visually clear
- Animation is smooth
- Colors are theme-appropriate
- Current theme text updates correctly

---

### ✅ Test 9: Cross-Session Behavior
**Expected Result:** Settings work across multiple sessions

1. Set "Use System Theme" ON
2. Close app
3. Change Windows theme
4. Open app
5. Verify app uses new Windows theme
6. Set "Use System Theme" OFF
7. Set Dark Mode ON
8. Close app
9. Change Windows theme (should not affect app now)
10. Open app
11. Verify app is still in dark mode regardless of Windows theme

**Pass Criteria:**
- System theme mode responds to Windows changes
- Manual mode ignores Windows changes
- Settings persist correctly in both modes

---

### ✅ Test 10: Error Handling
**Expected Result:** Graceful fallback on errors

1. Test with database unavailable (simulate error)
2. Verify fallback to localStorage works
3. Test with both database and localStorage unavailable
4. Verify fallback to system theme

**Pass Criteria:**
- No crashes
- Theme still works with fallbacks
- Console shows appropriate error messages
- App remains functional

---

## Visual Inspection Checklist

### Light Theme Colors
- [ ] Primary background: White
- [ ] Secondary background: Light gray/blue
- [ ] Text: Dark gray/black
- [ ] Borders: Light gray
- [ ] Buttons: Appropriate contrast

### Dark Theme Colors
- [ ] Primary background: Very dark gray (#1a1a1a)
- [ ] Secondary background: Dark gray (#2D2D2D)
- [ ] Text: White/light gray
- [ ] Borders: Medium gray
- [ ] Buttons: Appropriate contrast

### UI Elements to Check
- [ ] Sidebar navigation
- [ ] Settings page
- [ ] Main content area
- [ ] Info pane
- [ ] Buttons (all states: default, hover, active, disabled)
- [ ] Input fields
- [ ] Toggle switches
- [ ] Dropdown menus
- [ ] Modals/dialogs
- [ ] Status indicators
- [ ] Error messages
- [ ] Success messages

---

## Console Log Verification

Expected console logs:
```
✓ "Settings component: Loaded from database: {darkMode: true, useSystemTheme: false, ...}"
✓ "Theme settings auto-saved to database"
✓ "System theme preference auto-saved to database"
✓ "Settings saved to database successfully"
```

---

## Known Issues / Edge Cases

### Issue: Theme Flash on Startup
**Description:** Brief flash of wrong theme when app launches
**Expected:** ThemeProvider prevents this by showing null until theme is initialized
**Check:** No flash should occur

### Issue: Rapid Toggling
**Description:** Multiple rapid theme toggles
**Expected:** Each toggle completes smoothly
**Check:** No UI glitches or performance issues

---

## Performance Testing

1. **Startup Time:** Theme initialization should not delay app startup noticeably
2. **Toggle Response:** Theme change should be immediate (<100ms perceived delay)
3. **Memory:** No memory leaks from theme switching
4. **Database Saves:** Auto-saves should not impact UI responsiveness

---

## Accessibility Testing

1. **Color Contrast:**
   - Light theme: Check WCAG AA compliance
   - Dark theme: Check WCAG AA compliance

2. **Keyboard Navigation:**
   - Toggle switches should be keyboard accessible
   - Tab order should be logical

3. **Screen Readers:**
   - Toggles should announce state
   - Theme change should be perceivable

---

## Regression Testing

Verify these existing features still work:
- [ ] Timeline end date setting
- [ ] Gantt chart display
- [ ] Project management
- [ ] All other settings
- [ ] Database operations
- [ ] Navigation between views

---

## Sign-Off Criteria

All tests must pass before considering feature complete:
- [ ] All 10 functional tests pass
- [ ] Visual inspection complete
- [ ] Console logs correct
- [ ] Performance acceptable
- [ ] No regressions
- [ ] Documentation complete
