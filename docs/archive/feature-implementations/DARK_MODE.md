# Dark Mode Feature

## Overview
The Roadmap Electron application now supports a comprehensive dark mode theme with the following capabilities:

- **System Theme Integration**: Automatically follows your operating system's light/dark theme preference
- **Manual Override**: Toggle dark mode on/off manually in Settings
- **Persistent Settings**: Theme preferences are saved to the database and persist across app restarts
- **Smooth Transitions**: Theme changes are animated with smooth color transitions
- **Comprehensive Coverage**: All components use CSS variables for proper theming

## User Guide

### Accessing Theme Settings
1. Navigate to **Settings** in the application sidebar
2. Scroll to the **Appearance** section at the top

### Using System Theme (Default)
By default, the app follows your system's theme preference:
- The **"Use System Theme"** toggle is enabled by default
- The app automatically switches between light and dark mode based on your OS settings
- Changes to your system theme are detected instantly

### Manual Theme Control
To manually control the theme:
1. Turn off the **"Use System Theme"** toggle
2. The **"Dark Mode"** toggle will appear
3. Toggle it on/off to switch between light and dark themes manually
4. Your preference is saved automatically

### Saving Settings
- Theme changes are applied instantly
- Click **"Save Settings"** to persist all settings to the database
- Settings are also auto-saved to localStorage for quick loading

## Technical Implementation

### Architecture
The dark mode implementation uses a multi-layered approach:

1. **CSS Variables**: All colors are defined as CSS custom properties in `unified-styles.css`
2. **Data Attribute**: Theme is controlled via `data-theme` attribute on the root element
3. **ThemeProvider Component**: Initializes theme on app startup and handles system theme changes
4. **Settings Component**: Provides UI controls for theme preferences
5. **Database Storage**: Theme preferences are stored in the `app_settings` table

### CSS Variables
The following CSS variable categories are theme-aware:
- Background colors (`--bg-primary`, `--bg-secondary`, etc.)
- Text colors (`--text-primary`, `--text-secondary`, etc.)
- Border colors (`--border-color`, `--border-color-light`, etc.)
- Shadow values (adjusted opacity for dark mode)

### Theme Modes
Three theme modes are supported:

1. **System Theme**: 
   ```css
   @media (prefers-color-scheme: dark) {
     :root:not([data-theme="light"]) { /* dark theme variables */ }
   }
   ```

2. **Manual Dark Mode**:
   ```css
   :root[data-theme="dark"] { /* dark theme variables */ }
   ```

3. **Manual Light Mode**:
   ```css
   :root[data-theme="light"] { /* light theme variables */ }
   ```

### Color Palette - Dark Theme
- **Primary Background**: `#1a1a1a`
- **Secondary Background**: `#2D2D2D`
- **Tertiary Background**: `#3A3A3A`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#E0E0E0`
- **Text Tertiary**: `#B0B0B0`
- **Borders**: `#464646`

### Color Palette - Light Theme
- **Primary Background**: `#FFFFFF`
- **Secondary Background**: `#F0F5FA`
- **Tertiary Background**: `#FAFAFA`
- **Text Primary**: `#464646`
- **Text Secondary**: `#646464`
- **Text Tertiary**: `#8C8C8C`
- **Borders**: `#C8C8C8`

## Files Modified

### Core Files
- `app/renderer/styles/unified-styles.css` - Added dark theme CSS variables
- `app/renderer/components/Settings.tsx` - Added theme toggle UI
- `app/renderer/components/ThemeProvider.tsx` - New component for theme initialization
- `app/renderer/App.tsx` - Integrated ThemeProvider

### Database Schema
Theme settings are stored in the `app_settings` table:
- `darkMode` (boolean) - Manual dark mode preference
- `useSystemTheme` (boolean) - Whether to follow system theme

### Settings Interface
```typescript
interface SettingsData {
  timelineEndDate: string;
  darkMode: boolean;
  useSystemTheme: boolean;
}
```

## Browser Support
The dark mode feature uses modern CSS features:
- CSS Custom Properties (CSS Variables)
- `prefers-color-scheme` media query
- Data attributes for theme switching

Supported browsers:
- Chrome 76+
- Firefox 67+
- Safari 12.1+
- Edge 79+

## Accessibility
The dark mode implementation considers accessibility:
- Sufficient contrast ratios in both themes
- No reliance on color alone for information
- Smooth transitions reduce jarring changes
- Respects system preferences by default

## Future Enhancements
Potential improvements for future releases:
- Additional theme options (e.g., high contrast mode)
- Per-component theme customization
- Theme scheduling (automatic switching based on time)
- Custom color accent selection
- Theme preview before applying

## Troubleshooting

### Theme not applying
- Check that settings are saved to the database
- Verify the `data-theme` attribute is set on `<html>` element
- Clear browser cache if using web version
- Check browser console for JavaScript errors

### System theme not detected
- Verify OS theme preference is set correctly
- Ensure "Use System Theme" toggle is enabled
- Check browser compatibility with `prefers-color-scheme`

### Colors not changing
- Verify all components use CSS variables
- Check for hardcoded color values in inline styles
- Ensure CSS file is loaded properly
- Review browser DevTools for CSS variable values

## Support
For issues or questions about the dark mode feature, please:
1. Check this documentation
2. Review the console for error messages
3. Verify settings are properly saved
4. Test with system theme disabled/enabled
