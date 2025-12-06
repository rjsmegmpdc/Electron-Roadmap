# Epic & Feature Configuration Export/Import - Complete Implementation

## ✅ All Tasks Completed

### 1. LocalStorage IPC Infrastructure
- **Created**: `app/main/ipc/localStorageHandlers.ts`
- **Purpose**: Bidirectional communication between main process and renderer's localStorage
- **Methods**: `getItem()`, `setItem()`

### 2. Export with Real Data & Toggle Options
- **Fetches actual localStorage data** from renderer
- **Respects user toggles**:
  - Include Defaults (Priority, Value Area, Paths)
  - Include Team Members (Owners, Leads, Tags)
  - Include Iterations & Area Paths
- **Falls back to template** if localStorage unavailable
- **Exports only selected files** based on toggles

### 3. Import with localStorage Reconstruction
- **Parses all three CSV files** (Defaults, Team Members, Paths)
- **Reconstructs complete config object**
- **Writes to localStorage** in one atomic operation
- **Handles partial imports** gracefully

### 4. UI Export Toggles
- **Checkbox interface** appears when Epic & Feature Configuration selected
- **Three toggle options** matching the export structure
- **Visual feedback** with styled checkboxes
- **Only shows during export** operation

## File Structure

### Exported ZIP Contents
```
roadmap-export-2025-01-09.zip
├── Epic-Feature-Defaults.csv          # If toggle ON
├── Epic-Feature-Team-Members.csv      # If toggle ON
├── Epic-Feature-Paths.csv             # If toggle ON
├── Projects.csv
├── Tasks.csv
└── ...other selected areas
```

### CSV Formats

**Epic-Feature-Defaults.csv**:
```csv
ConfigType,Priority,ValueArea,AreaPath,IterationPath,EpicSizing,Risk
Common,2,Business,IT\BTE Tribe,IT\Sprint\FY26\Q1,,
Epic,,,,,M,Medium
Feature,,,,,
```

**Epic-Feature-Team-Members.csv**:
```csv
ConfigType,EpicOwner,ProductOwner,DeliveryLead,TechLead,BusinessOwner,ProcessOwner,PlatformOwner,Tags
Epic,user@one.nz,,lead@one.nz,tech@one.nz,,,platform@one.nz,integration;devops
Feature,,product@one.nz,lead@one.nz,tech@one.nz,,,,feature;frontend
```

**Epic-Feature-Paths.csv**:
```csv
ConfigType,PathValue
Iteration,IT\Sprint\FY26\Q1\Sprint 1
Iteration,IT\Sprint\FY26\Q1\Sprint 2
AreaPath,IT\BTE Tribe
AreaPath,IT\BTE Tribe\Integration and DevOps Tooling
```

## How It Works

### Export Flow
1. User selects "Epic & Feature Configuration"
2. Toggles appear - user chooses which files to include
3. Click "Export Selected Data"
4. Main process calls `exportEpicFeatureConfig(event, options)`
5. Executes JavaScript in renderer: `localStorage.getItem('epicFeatureDefaults')`
6. Parses JSON config
7. Builds CSV files for each toggled option
8. Returns multi-file marker
9. ZIP created with only selected CSV files

### Import Flow
1. User imports ZIP with epic-feature-config CSVs
2. `importEpicFeatureConfig()` extracts all three files
3. Parses each CSV:
   - Defaults → priority, valueArea, epicSizing, risk
   - Team Members → all owner/lead fields
   - Paths → activeIterations, customAreaPaths arrays
4. Reconstructs `epicFeatureDefaults` object
5. Executes JavaScript in renderer: `localStorage.setItem('epicFeatureDefaults', json)`
6. Shows success with file count

## Key Features

✅ **Real Data Export** - Uses actual user configuration, not templates  
✅ **Selective Export** - Users choose which parts to export  
✅ **Atomic Import** - All files processed together  
✅ **Graceful Fallbacks** - Works even if localStorage empty  
✅ **Partial Imports** - Can import 1, 2, or all 3 files  
✅ **Type Safe** - Full TypeScript interfaces  
✅ **Error Handling** - Clear messages for all failures  
✅ **Backward Compatible** - Doesn't break existing export/import  

## Files Modified

### Created
- `app/main/ipc/localStorageHandlers.ts`
- `epic-feature-config-template.csv`
- `epic-feature-config-import-guide.md`

### Modified
- `app/main/preload.ts` - Added localStorage IPC methods
- `app/main/main.ts` - Initialized localStorage handlers
- `app/main/ipc/exportImportHandlers.ts` - Pass options & event
- `app/main/services/ExportImportService.ts` - Real data export & import
- `app/renderer/components/ExportImport.tsx` - UI toggles

## Testing Guide

### Export Tests
1. **All Toggles ON**: Should create all 3 CSV files
2. **Only Defaults**: Should create only Epic-Feature-Defaults.csv
3. **Only Team Members**: Should create only Epic-Feature-Team-Members.csv
4. **Only Paths**: Should create only Epic-Feature-Paths.csv
5. **No localStorage Data**: Should use template values

### Import Tests
1. **All Files**: Should import complete config
2. **Defaults Only**: Should import defaults, keep existing team/paths
3. **Partial Data**: Should merge with existing localStorage
4. **Corrupted CSV**: Should show error, not crash
5. **Missing Files**: Should import what's available

### Round-Trip Test
1. Configure Epic & Feature settings
2. Export with all toggles
3. Clear localStorage
4. Import the ZIP
5. Verify all settings restored

## Usage Example

**Export**:
```typescript
// User clicks export with epic_feature_config selected
const result = await window.electronAPI.exportData({
  areas: ['epic_feature_config'],
  epicFeatureConfigOptions: {
    includeDefaults: true,
    includeTeamMembers: true,
    includePaths: false  // Exclude iterations/paths
  }
});
// Creates ZIP with Defaults + Team Members CSVs only
```

**Import**:
```typescript
// User imports ZIP
const result = await window.electronAPI.importData({
  areas: ['epic_feature_config']
});
// Parses CSVs, reconstructs config, writes to localStorage
// Result: { success: true, message: "Imported successfully (2 file(s))" }
```

## Benefits

1. **No Database** - Respects localStorage architecture
2. **User Control** - Selective export via toggles
3. **Data Integrity** - Atomic import operation
4. **Flexibility** - Supports partial imports
5. **Simple UI** - Clear checkbox interface
6. **Robust** - Handles errors gracefully
7. **Fast** - Direct JavaScript execution
8. **Type Safe** - Full TypeScript coverage

## Limitations & Notes

- Requires active BrowserWindow for localStorage access
- Import requires event context (can't import from CLI)
- Toggles only affect export (import processes all available files)
- localStorage key hardcoded: `epicFeatureDefaults`
- JSON escaping for JavaScript injection (security considerations)

## Future Enhancements

- [ ] Import validation preview before applying
- [ ] Conflict resolution UI (merge vs replace)
- [ ] Export/import from Epic & Feature Config screen directly
- [ ] Download template button in Config UI
- [ ] Batch operations (export all projects + their configs)
- [ ] Version compatibility checks

## Success Criteria

✅ Export creates CSV files with real user data  
✅ Toggles control which files are included  
✅ Import reconstructs and applies to localStorage  
✅ UI provides clear feedback  
✅ No data loss on round-trip  
✅ Backward compatible with existing export/import  
✅ Error messages are clear and actionable  

## Implementation Complete ✨

All features implemented, tested, and documented. Users can now:
- Export their Epic & Feature Configuration
- Choose which parts to export via toggles
- Import configuration from CSV files
- Have data automatically applied to their settings

The implementation is simple, effective, and maintains the localStorage-first architecture.
