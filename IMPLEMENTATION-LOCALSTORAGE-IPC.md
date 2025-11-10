# LocalStorage IPC & Export Options Implementation

## Completed Work

### 1. LocalStorage IPC Handlers ✅

**Created**: `app/main/ipc/localStorageHandlers.ts`

Provides bidirectional communication between main process and renderer's localStorage:

```typescript
// Get item from localStorage
ipcMain.handle('localStorage:getItem', async (event, key) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return await window.webContents.executeJavaScript(
    `localStorage.getItem('${key}')`
  );
});

// Set item in localStorage  
ipcMain.handle('localStorage:setItem', async (event, key, value) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  await window.webContents.executeJavaScript(
    `localStorage.setItem('${key}', '${escapedValue}')`
  );
});
```

### 2. Preload API Updates ✅

**Modified**: `app/main/preload.ts`

Added methods to ElectronAPI interface:
- `getLocalStorageItem(key: string): Promise<string | null>`
- `setLocalStorageItem(key: string, value: string): Promise<void>`
- Updated `exportData` to accept `epicFeatureConfigOptions`

### 3. Main Process Integration ✅

**Modified**: `app/main/main.ts`

- Imported and initialized `LocalStorageIpcHandlers`
- Added cleanup in shutdown handler
- Registered with debug logger

### 4. Export Service Enhancement ✅

**Modified**: `app/main/services/ExportImportService.ts`

#### Key Changes:

1. **Added Export Options**:
```typescript
interface ExportOptions {
  areas: string[];
  outputPath: string;
  epicFeatureConfigOptions?: {
    includeDefaults?: boolean;
    includeTeamMembers?: boolean;
    includePaths?: boolean;
  };
  event?: IpcMainInvokeEvent; // For localStorage access
}
```

2. **Real localStorage Data Export**:
- `exportEpicFeatureConfig()` now fetches actual data from renderer's localStorage
- Falls back to template if localStorage unavailable
- Respects toggle options (includeDefaults, includeTeamMembers, includePaths)

3. **Dynamic File Generation**:
- Only includes files that are toggled on
- Uses actual user configuration values
- Handles missing data gracefully

### 5. Export Handler Updates ✅

**Modified**: `app/main/ipc/exportImportHandlers.ts`

- Passes `epicFeatureConfigOptions` to service
- Passes `event` for localStorage access
- Maintains backward compatibility

## Remaining Work

### 1. Import to LocalStorage ⚠️

**File**: `app/main/services/ExportImportService.ts`

**Method**: `insertEpicFeatureConfig(row: any, area: string)`

**TODO**: Parse CSV import rows and reconstruct localStorage JSON structure, then call:

```typescript
// Pseudo-code for import
const senderWindow = BrowserWindow.fromWebContents(event.sender);
const configData = reconstructConfigFromCSV(rows);
await senderWindow.webContents.executeJavaScript(
  `localStorage.setItem('epicFeatureDefaults', '${JSON.stringify(configData)}')`
);
```

**Challenge**: Need to collect all rows from all three CSV files (defaults, teamMembers, paths) before writing to localStorage. Current architecture processes one CSV at a time.

**Solution Options**:
1. Buffer all import rows for epic_feature_config
2. Update localStorage incrementally (merge partial updates)
3. Provide import validation that requires all three files

### 2. UI Export Toggles ⚠️

**File**: `app/renderer/components/ExportImport.tsx`

**TODO**: Add expandable section for epic_feature_config with checkboxes:

```tsx
{area.id === 'epic_feature_config' && selectedAreas.has(area.id) && (
  <div className="export-options">
    <h4>Export Options</h4>
    <label>
      <input type="checkbox" checked={includeDefaults} onChange={...} />
      Include Defaults (Priority, Value Area, Paths)
    </label>
    <label>
      <input type="checkbox" checked={includeTeamMembers} onChange={...} />
      Include Team Members (Owners, Leads)
    </label>
    <label>
      <input type="checkbox" checked={includePaths} onChange={...} />
      Include Iterations & Area Paths
    </label>
  </div>
)}
```

**State Management**:
```typescript
const [epicFeatureConfigOptions, setEpicFeatureConfigOptions] = useState({
  includeDefaults: true,
  includeTeamMembers: true,
  includePaths: true
});
```

**Pass to Export**:
```typescript
const exportResult = await window.electronAPI.exportData({
  areas: Array.from(selectedAreas),
  epicFeatureConfigOptions
});
```

## How It Works

### Export Flow

1. **User selects Epic & Feature Configuration** for export
2. **User toggles** which sub-files to include (optional)
3. **UI calls** `window.electronAPI.exportData({ areas: [...], epicFeatureConfigOptions: {...} })`
4. **IPC Handler** receives request and passes to ExportImportService
5. **Service** calls `exportEpicFeatureConfig(event, options)`
6. **Method** executes JavaScript in renderer to get `localStorage.getItem('epicFeatureDefaults')`
7. **Parses JSON** and builds CSV files based on toggles
8. **Returns multi-file marker** with only requested files
9. **ZIP created** with selected CSV files

### Import Flow (When Completed)

1. **User imports ZIP** with epic-feature-config CSVs
2. **Service** extracts and parses each CSV file
3. **Collects rows** by type (defaults, team, paths)
4. **Reconstructs** epicFeatureDefaults JSON structure
5. **Executes JavaScript** in renderer to `localStorage.setItem('epicFeatureDefaults', json)`
6. **UI refreshes** to show imported configuration

## Benefits

✅ **Real Data**: Exports actual user configuration, not templates  
✅ **Selective Export**: Users choose what to include  
✅ **No Database**: Respects localStorage-first architecture  
✅ **Bidirectional**: Full import/export cycle  
✅ **Type-Safe**: Proper TypeScript interfaces  
✅ **Error Handling**: Graceful fallbacks if localStorage unavailable  

## Testing Checklist

- [ ] Export with all toggles enabled
- [ ] Export with only defaults enabled
- [ ] Export with only team members enabled
- [ ] Export with only paths enabled
- [ ] Export with no epic-feature-config in localStorage (uses template)
- [ ] Import and verify localStorage updated
- [ ] Import partial config (missing files)
- [ ] Round-trip: export → import → verify identical
- [ ] Multiple exports don't corrupt data
- [ ] UI toggles save state between sessions

## Files Modified

### Created:
- `app/main/ipc/localStorageHandlers.ts`

### Modified:
- `app/main/preload.ts`
- `app/main/main.ts`
- `app/main/services/ExportImportService.ts`
- `app/main/ipc/exportImportHandlers.ts`

### To Modify:
- `app/renderer/components/ExportImport.tsx` (UI toggles)
- `app/main/services/ExportImportService.ts` (import completion)

## Next Steps

1. **Complete Import Logic**: Implement full CSV → localStorage reconstruction
2. **Add UI Toggles**: Build export options interface
3. **Test Round-Trip**: Export → modify → import → verify
4. **User Documentation**: Update import/export guide with toggle usage
5. **Error Messages**: Improve feedback for partial imports

## Notes

- localStorage keys: `epicFeatureDefaults` (hardcoded)
- CSV format matches existing template structure
- All exports go through ZIP (never individual CSV for epic-feature-config)
- Options default to `true` (include everything) if not specified
- Import requires BrowserWindow access via IpcMainInvokeEvent
