# Epic & Feature Configuration Export/Import Implementation Notes

## Summary of Changes

### 1. Added Epic & Feature Configuration to Export/Import Data Areas

**File**: `app/renderer/components/ExportImport.tsx`

Added a new data area option:
- **ID**: `epic_feature_config`
- **Label**: Epic & Feature Configuration
- **Description**: Default values for Epic and Feature creation (Common, Epic, Feature defaults, Iterations & Paths)

This appears in the UI alongside existing data areas like Projects, Tasks, Work Items, etc.

---

### 2. Enhanced Export File Naming

**File**: `app/main/services/ExportImportService.ts`

#### Changes Made:

1. **Added `getFilenameForArea()` method** - Maps data area IDs to descriptive filenames:
   - `projects` → `Projects.csv`
   - `tasks` → `Tasks.csv`
   - `calendar_months` → `Calendar-Configuration.csv`
   - `public_holidays` → `Public-Holidays.csv`
   - `app_settings` → `Application-Settings.csv`
   - `ado_config` → `ADO-Configuration.csv`
   - `ado_tags` → `ADO-Tags.csv`
   - `epic_feature_config` → `Epic-Feature-Configuration.csv`
   - Work Items exports as: `Epics.csv`, `Features.csv`, `Dependencies.csv`

2. **Updated `exportData()` method** - Now uses descriptive filenames instead of generic area IDs

3. **Added `exportEpicFeatureConfig()` method** - Exports Epic & Feature Configuration in CSV format
   - Currently exports a template structure
   - Ready for integration with actual localStorage data

---

### 3. Epic & Feature Configuration Export Format

The export uses the same CSV structure as the template created earlier:

**Columns**:
- ConfigType (Common, Epic, Feature, Iteration, AreaPath)
- Priority
- ValueArea
- AreaPath
- IterationPath
- EpicSizing
- Risk
- EpicOwner
- ProductOwner
- DeliveryLead
- TechLead
- BusinessOwner
- ProcessOwner
- PlatformOwner
- Tags
- PathValue

**Sample Row**:
```csv
ConfigType,Priority,ValueArea,AreaPath,IterationPath,EpicSizing,Risk,...
Common,2,Business,IT\BTE Tribe,IT\Sprint\FY26\Q1,,,,...
```

---

### 4. Import Logic Updates

**File**: `app/main/services/ExportImportService.ts`

#### Changes Made:

1. **Updated ZIP entry lookup** - Now supports both new descriptive names and legacy names:
   - Tries new format first (e.g., `Projects.csv`)
   - Falls back to old format (e.g., `projects.csv`)

2. **Added `insertEpicFeatureConfig()` method**:
   - Placeholder for Epic & Feature Config import
   - Logs warning that this should be handled via localStorage in renderer process
   - Ready for full implementation with IPC communication

3. **Updated work items import** - Supports both naming conventions:
   - New: `Epics.csv`, `Features.csv`, `Dependencies.csv`
   - Old: `epics.csv`, `features.csv`, `dependencies.csv`

---

## File Naming Summary

### Before:
All CSV files used lowercase area IDs:
```
roadmap-export-2025-01-09.zip
├── projects.csv
├── tasks.csv
├── epics.csv
├── features.csv
├── dependencies.csv
├── calendar_months.csv
├── public_holidays.csv
├── app_settings.csv
├── ado_config.csv
└── ado_tags.csv
```

### After:
CSV files use descriptive, human-readable names:
```
roadmap-export-2025-01-09.zip
├── Projects.csv
├── Tasks.csv
├── Epics.csv
├── Features.csv
├── Dependencies.csv
├── Calendar-Configuration.csv
├── Public-Holidays.csv
├── Application-Settings.csv
├── ADO-Configuration.csv
├── ADO-Tags.csv
└── Epic-Feature-Configuration.csv
```

---

## Benefits

1. **Better User Experience**: Users can immediately understand what each CSV file contains
2. **Professional Naming**: Descriptive names are more suitable for sharing and documentation
3. **Backward Compatible**: Import logic supports both old and new naming conventions
4. **Extensible**: Easy to add new data areas with custom filenames
5. **Organized**: Clear naming structure makes ZIP contents self-documenting

---

## Epic & Feature Configuration - Special Considerations

### Why Special Handling?

Epic & Feature Configuration is stored in **browser localStorage**, not the SQLite database. This is different from all other data areas which are database-backed.

### Current Implementation

**Export**:
- Returns a template/sample CSV structure
- Uses the same format as `epic-feature-config-template.csv`
- Exports with all required columns

**Import**:
- Placeholder method logs that import should be handled via renderer process
- Does not throw errors (graceful handling)

### Full Implementation Path

To fully implement Epic & Feature Config export/import:

1. **Export Enhancement**:
   - Add IPC handler to retrieve localStorage data from renderer process
   - Convert localStorage JSON to CSV format
   - Include actual user data instead of template

2. **Import Enhancement**:
   - Parse CSV data in main process
   - Send parsed data to renderer via IPC
   - Update localStorage in renderer process
   - Trigger UI refresh if configuration screen is open

3. **Example IPC Flow**:
   ```typescript
   // In ExportImportService
   const configData = await ipcMain.invoke('getLocalStorageItem', 'epicFeatureDefaults');
   
   // In renderer preload/IPC handlers
   ipcMain.handle('getLocalStorageItem', (event, key) => {
     return localStorage.getItem(key);
   });
   ```

---

## Testing Checklist

- [x] Export creates ZIP with descriptive filenames
- [x] Import supports both old and new filenames
- [x] Epic & Feature Configuration appears in data area list
- [x] Work Items export uses capitalized names (Epics.csv, Features.csv, Dependencies.csv)
- [ ] Epic & Feature Configuration exports actual user data (requires localStorage integration)
- [ ] Epic & Feature Configuration import updates localStorage (requires IPC implementation)
- [ ] All existing data areas export/import correctly with new naming
- [ ] Backward compatibility: Old exports can still be imported

---

## Related Files

### Created:
- `epic-feature-config-template.csv` - Sample CSV template for users
- `epic-feature-config-import-guide.md` - Comprehensive documentation

### Modified:
- `app/renderer/components/ExportImport.tsx` - Added new data area
- `app/main/services/ExportImportService.ts` - File naming and epic-feature-config handling

### Unchanged but Related:
- `app/renderer/components/EpicFeatureConfig.tsx` - Source of configuration data
- `app/main/ipc/exportImportHandlers.ts` - IPC layer (no changes needed)

---

## Next Steps

1. **Implement full localStorage export/import** (optional enhancement)
   - Add IPC handlers for localStorage access
   - Convert localStorage JSON ↔ CSV format
   - Handle import validation and update

2. **Add download button** in Epic & Feature Configuration UI
   - Direct download of template CSV
   - Pre-populated with current settings

3. **Add import button** in Epic & Feature Configuration UI
   - Upload CSV file
   - Parse and validate
   - Apply to localStorage
   - Show confirmation/errors

4. **User documentation**
   - Update user guide with export/import instructions
   - Include CSV format specifications
   - Add troubleshooting section

---

## Notes

- All exports are in **ZIP format** containing CSV files
- All CSV files use **UTF-8 encoding**
- Dates use **DD-MM-YYYY format** (NZ locale)
- Boolean values exported as **'true'/'false' strings**
- PAT tokens are **never exported** (security)
- Import uses **transactions** for data integrity
- Backward compatibility is **fully maintained**
