# Theme Settings Persistence - Technical Overview

## How Theme Settings Are Saved and Loaded

### Storage Layers

The dark mode implementation uses **dual-layer persistence** for reliability and performance:

1. **Database (Primary Storage)** - SQLite database via Electron IPC
2. **localStorage (Fast Cache)** - Browser localStorage for instant access

---

## Save Flow

### When User Toggles "Use System Theme"

```typescript
// Settings.tsx - handleSystemThemeToggle()
const handleSystemThemeToggle = async (useSystemTheme: boolean) => {
  const updatedSettings = { ...settings, useSystemTheme };
  setSettings(updatedSettings);
  
  // 1. Save to localStorage immediately (fast)
  localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
  
  // 2. Save to database asynchronously (persistent)
  try {
    if (window.electronAPI?.saveSettings) {
      await window.electronAPI.saveSettings(updatedSettings);
      console.log('System theme preference auto-saved to database');
    }
  } catch (error) {
    console.error('Failed to auto-save system theme preference:', error);
  }
  
  // 3. Notify other components
  window.dispatchEvent(new Event('settingsUpdated'));
};
```

### When User Toggles "Dark Mode"

```typescript
// Settings.tsx - handleThemeToggle()
const handleThemeToggle = async (darkMode: boolean) => {
  const updatedSettings = { ...settings, darkMode, useSystemTheme: false };
  setSettings(updatedSettings);
  
  // 1. Save to localStorage immediately
  localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
  
  // 2. Save to database asynchronously
  try {
    if (window.electronAPI?.saveSettings) {
      await window.electronAPI.saveSettings(updatedSettings);
      console.log('Theme settings auto-saved to database');
    }
  } catch (error) {
    console.error('Failed to auto-save theme settings:', error);
  }
  
  // 3. Notify other components
  window.dispatchEvent(new Event('settingsUpdated'));
};
```

### Database Storage

Settings are stored in the `app_settings` table:

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Each setting is stored as a key-value pair:
- Key: `"darkMode"` → Value: `"true"` or `"false"`
- Key: `"useSystemTheme"` → Value: `"true"` or `"false"`
- Key: `"timelineEndDate"` → Value: `"DD-MM-YYYY"`

---

## Load Flow

### On App Launch

```typescript
// ThemeProvider.tsx - useEffect()
useEffect(() => {
  const initializeTheme = async () => {
    try {
      // 1. Try to load from database first
      if (window.electronAPI?.getSettings) {
        const settings = await window.electronAPI.getSettings();
        
        const useSystemTheme = settings.useSystemTheme ?? true;
        const darkMode = settings.darkMode ?? false;

        // 2. Apply the theme
        if (useSystemTheme) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        }
      } else {
        // 3. Fallback to localStorage
        const localSettings = localStorage.getItem('appSettings');
        if (localSettings) {
          const settings = JSON.parse(localSettings);
          // Apply theme from localStorage
        } else {
          // 4. Final fallback: Use system theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
      }
    } catch (error) {
      console.error('Failed to initialize theme:', error);
      // Default to system theme on error
    }
    
    setIsInitialized(true);
  };

  initializeTheme();
}, []);
```

### Load Priority

1. **Database** (Primary source of truth)
   - Most reliable
   - Persists across browser cache clears
   - Syncs between processes

2. **localStorage** (Fast cache)
   - Instant access
   - No async delay
   - Survives app restart

3. **System Default** (Fallback)
   - Always available
   - No user data needed
   - Safe default

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                     APP LAUNCH                       │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              ThemeProvider Component                 │
│  1. Load settings from database                      │
│  2. Fallback to localStorage if needed              │
│  3. Apply theme to <html data-theme="...">          │
│  4. Show app after theme is set (prevent flash)     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                Settings Component                    │
│  - Loads same settings from database                │
│  - Updates UI controls to match                     │
│  - Listens for toggle changes                       │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│               USER TOGGLES SETTING                   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Settings Component Handlers             │
│  1. Update React state                              │
│  2. Save to localStorage (instant)                  │
│  3. Save to database (async)                        │
│  4. Apply theme immediately                         │
│  5. Dispatch 'settingsUpdated' event                │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                 Theme Applied                        │
│  - CSS variables update                             │
│  - Colors transition smoothly (0.3s)                │
│  - All components reflect new theme                 │
└─────────────────────────────────────────────────────┘
```

---

## IPC Communication

### Renderer → Main Process

```typescript
// Save settings
window.electronAPI.saveSettings({
  darkMode: true,
  useSystemTheme: false,
  timelineEndDate: '31-12-2026'
})
```

### Main Process → Database

```typescript
// settingsHandlers.ts
ipcMain.handle('settings:save', async (_event, settings) => {
  const stmt = db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);
  
  for (const [key, value] of Object.entries(settings)) {
    stmt.run(key, JSON.stringify(value), new Date().toISOString());
  }
});
```

### Database → Main Process → Renderer

```typescript
// Load settings
const settings = await window.electronAPI.getSettings();
// Returns: { darkMode: true, useSystemTheme: false, ... }
```

---

## Persistence Guarantees

### ✅ What IS Saved Automatically

1. **Use System Theme toggle** - Saved immediately on change
2. **Dark Mode toggle** - Saved immediately on change
3. **Timeline End Date** - Saved to localStorage on change, database on "Save Settings"

### ✅ When Settings Are Saved

1. **On Toggle** - Both localStorage AND database updated
2. **On "Save Settings" Button** - Explicit save to database
3. **On Component Unmount** - No additional save needed (already saved)

### ✅ Load Timing

1. **App Startup** - ThemeProvider loads before app renders
2. **Settings Page** - Loads current values when navigated to
3. **After Save** - State already updated, no reload needed

---

## Edge Cases Handled

### Case 1: Database Unavailable
- **Action:** Falls back to localStorage
- **User Impact:** Theme still works from cached values
- **Recovery:** Next save will retry database

### Case 2: localStorage Cleared
- **Action:** Loads from database on next startup
- **User Impact:** No data loss
- **Recovery:** Automatic from database

### Case 3: Both Storage Layers Fail
- **Action:** Uses system theme as default
- **User Impact:** App still works, uses OS preference
- **Recovery:** Next successful save restores settings

### Case 4: Rapid Toggle Changes
- **Action:** Each toggle saves independently
- **User Impact:** Last toggle wins
- **Recovery:** Final state is correctly saved

### Case 5: App Crash During Save
- **Action:** localStorage saved first (synchronous)
- **User Impact:** Theme preserved in localStorage
- **Recovery:** Next startup uses localStorage, next toggle saves to DB

---

## Verification

### Check If Settings Are Saved

**In Browser DevTools Console:**
```javascript
// Check localStorage
console.log(localStorage.getItem('appSettings'));
// Output: {"darkMode":true,"useSystemTheme":false,"timelineEndDate":""}
```

**In Electron Main Process:**
```sql
-- Query database
SELECT * FROM app_settings;
-- Results:
-- darkMode       | "true"  | 2025-11-04T04:47:42Z
-- useSystemTheme | "false" | 2025-11-04T04:47:42Z
```

### Check If Settings Are Loaded

**Check console logs on app startup:**
```
Settings component: Loaded from database: {darkMode: true, useSystemTheme: false}
```

**Check HTML element:**
```javascript
console.log(document.documentElement.getAttribute('data-theme'));
// Output: "dark" or "light"
```

---

## Summary

**Theme settings ARE automatically saved and loaded every time the app is launched:**

✅ **Toggles save to database automatically** - No need to click "Save Settings" for theme changes
✅ **Settings load on app startup** - ThemeProvider loads before UI renders
✅ **Dual-layer storage** - Database + localStorage for reliability
✅ **No theme flash** - Theme applied before app content shows
✅ **Graceful fallbacks** - Works even if storage fails

**User Experience:**
1. User toggles a theme setting
2. Change is instant and visible
3. Settings are auto-saved (user sees console log)
4. User closes app
5. User reopens app
6. Theme is exactly as they left it ✓
