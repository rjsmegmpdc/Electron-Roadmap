# Audit Logging and Backup/Restore System

This document describes the comprehensive audit logging and backup/restore system implemented in the Roadmap Electron application.

## Overview

The system provides:

1. **Comprehensive Audit Logging** - Track all user interactions, form changes, navigation, errors, and data modifications
2. **Backup and Restore** - Create full application backups with integrity validation and restore capabilities
3. **React Hooks Integration** - Easy-to-use hooks for logging user interactions in React components
4. **Secure IPC Communication** - Safe communication between renderer and main processes

## Architecture

### Main Process Services

#### AuditLogger (`app/main/services/AuditLogger.ts`)
- Logs events to SQLite database and NDJSON files
- Supports log rotation and filtering
- Provides query capabilities for recent events and error context
- Includes system context and memory usage tracking

#### BackupRestoreService (`app/main/services/BackupRestoreService.ts`)
- Creates comprehensive backups of all application data
- Validates backup integrity with checksums
- Supports selective restoration with conflict resolution
- Includes metadata and compression

### Renderer Process Integration

#### React Hooks (`app/renderer/hooks/useAuditLogger.ts`)
- `useAuditLogger` - General logging hook for any component
- `useClickTracking` - Specialized for tracking mouse interactions
- `useKeyboardTracking` - Specialized for keyboard event tracking
- `useFormTracking` - Comprehensive form interaction logging
- `useComponentTracking` - Automatic component lifecycle tracking
- `useNavigationTracking` - Page/route navigation tracking
- `useWindowTracking` - Window focus, resize, and visibility events

### IPC Communication (`app/main/preload.ts`)
- Secure context bridge API
- Type-safe method signatures
- Error handling and validation

## Usage Examples

### Basic Audit Logging in React Components

```typescript
import { useAuditLogger } from '../hooks/useAuditLogger';

function MyComponent() {
  const { logUserInteraction, logFormChange } = useAuditLogger('MyComponent');

  const handleClick = (event: React.MouseEvent) => {
    logUserInteraction('button_click', 'submit-button', {
      buttonText: 'Save Project',
      currentStep: 'project-creation'
    });
  };

  const handleFormChange = (field: string, oldValue: any, newValue: any) => {
    logFormChange(field, oldValue, newValue, {
      valid: true,
      errors: []
    });
  };

  return (
    <button onClick={handleClick}>
      Save Project
    </button>
  );
}
```

### Click Tracking with Detailed Context

```typescript
import { useClickTracking } from '../hooks/useAuditLogger';

function InteractiveComponent() {
  const { trackClick } = useClickTracking('InteractiveComponent');

  const handleClick = (event: React.MouseEvent) => {
    trackClick(event, 'feature_button_click', {
      feature: 'project-timeline',
      userRole: 'project-manager'
    });
  };

  return <div onClick={handleClick}>Timeline View</div>;
}
```

### Form Tracking with Validation

```typescript
import { useFormTracking } from '../hooks/useAuditLogger';

function ProjectForm() {
  const {
    trackFieldChange,
    trackFormSubmit,
    trackFieldFocus,
    trackFieldBlur
  } = useFormTracking('ProjectForm');

  const handleSubmit = (formData: any, isValid: boolean, errors?: any) => {
    trackFormSubmit(formData, isValid, errors);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        onFocus={() => trackFieldFocus('title', 'text')}
        onBlur={() => trackFieldBlur('title', 'text', true)}
        onChange={(e) => trackFieldChange('title', '', e.target.value)}
      />
    </form>
  );
}
```

### Automatic Component Tracking

```typescript
import { useComponentTracking } from '../hooks/useAuditLogger';

function TrackedComponent() {
  // Automatically logs mount/unmount events
  const { trackComponentError } = useComponentTracking('TrackedComponent');

  // Use in error boundaries or try/catch blocks
  const handleError = (error: Error) => {
    trackComponentError(error, { componentStack: 'detailed stack info' });
  };

  return <div>Component content</div>;
}
```

### Higher-Order Component for Automatic Tracking

```typescript
import { withAuditTracking } from '../hooks/useAuditLogger';

const MyComponent = () => <div>My Component</div>;

// Automatically wraps with error tracking
export default withAuditTracking(MyComponent, 'MyComponent');
```

## Backup and Restore Operations

### Creating a Backup

```typescript
// From renderer process
const result = await window.electronAPI.createBackup(
  'Monthly backup', // description
  ['scheduled', 'monthly'], // tags
  false // includeFullAuditHistory
);

if (result.success) {
  console.log('Backup created:', result.backupPath);
}
```

### Listing Available Backups

```typescript
const result = await window.electronAPI.listBackups();

if (result.success) {
  result.backups.forEach(backup => {
    console.log(`Backup: ${backup.metadata.description}`);
    console.log(`Created: ${backup.metadata.created_at}`);
    console.log(`Size: ${backup.metadata.backup_size_bytes} bytes`);
  });
}
```

### Restoring from Backup

```typescript
const restoreOptions = {
  includeAuditLogs: true,
  includeUserPreferences: true,
  includeAppSettings: true,
  conflictResolution: 'overwrite', // 'overwrite' | 'skip' | 'merge'
  validateIntegrity: true
};

const result = await window.electronAPI.restoreFromBackup(
  '/path/to/backup.json',
  restoreOptions
);

if (result.success) {
  console.log('Restore completed:', result.result);
  console.log('Warnings:', result.result.warnings);
  console.log('Projects restored:', result.result.stats.projects_restored);
}
```

## Audit Event Types

The system tracks several types of events:

### User Interactions
- Button clicks, menu selections
- Mouse movements and hovers
- Keyboard shortcuts and key presses
- Touch and gesture events

### Form Changes
- Field value changes with old/new values
- Validation results and errors
- Form submission attempts
- Focus and blur events

### Navigation
- Page/route changes
- Modal openings and closings
- Tab switches
- Back/forward navigation

### Data Changes
- CRUD operations on projects, tasks, etc.
- Import/export operations
- Bulk data modifications
- Configuration changes

### System Events
- Application startup/shutdown
- Error occurrences with stack traces
- Performance metrics
- Memory usage tracking

### Error Tracking
- JavaScript errors with full stack traces
- Network request failures
- Database operation errors
- Validation failures

## Database Schema

### Audit Events Table

```sql
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  component TEXT,
  action TEXT NOT NULL,
  target TEXT,
  data TEXT, -- JSON
  error_details TEXT, -- JSON
  system_context TEXT, -- JSON
  user_context TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## File Structure

```
app/
├── main/
│   ├── services/
│   │   ├── AuditLogger.ts        # Core audit logging service
│   │   └── BackupRestoreService.ts # Backup and restore functionality
│   ├── main.ts                   # IPC handlers and service initialization
│   └── preload.ts               # Secure API exposure
├── renderer/
│   └── hooks/
│       └── useAuditLogger.ts    # React hooks for audit logging
└── tests/
    └── integration/
        └── audit-backup.test.js # Integration tests
```

## Configuration

### Audit Logger Configuration

```typescript
const rotationConfig = {
  maxFileSize: 50, // MB
  maxFiles: 10,
  rotateOnStartup: true
};
```

### Log Filtering and Querying

```typescript
// Query events from the last hour
const recentEvents = auditLogger.getRecentEvents(60);

// Get error context (events leading up to an error)
const context = auditLogger.getErrorContext(errorTimestamp, 5);

// Query with filters
const events = auditLogger.queryEvents({
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-31T23:59:59Z',
  eventType: 'user_interaction',
  component: 'ProjectForm',
  limit: 100
});
```

## Security Considerations

1. **Context Bridge**: All IPC communication uses Electron's secure context bridge
2. **Data Sanitization**: Sensitive data is filtered before logging
3. **File Permissions**: Log files use restricted permissions
4. **Checksum Validation**: Backups include integrity checksums
5. **Error Serialization**: Error objects are safely serialized for IPC

## Performance Features

1. **Asynchronous Logging**: Non-blocking event logging
2. **Log Rotation**: Automatic log file rotation to prevent disk space issues
3. **Batch Operations**: Efficient database operations
4. **Memory Management**: Automatic cleanup and garbage collection
5. **Lazy Loading**: Components loaded only when needed

## Testing

Run the integration tests:

```bash
npm test -- tests/integration/audit-backup.test.js
```

The test suite covers:
- API availability
- Event logging functionality
- Backup creation and listing
- Error handling
- Data integrity

## Future Enhancements

1. **Real-time Dashboard**: Live audit event monitoring
2. **Advanced Analytics**: User behavior analytics and insights  
3. **Custom Event Types**: Extensible event type system
4. **Cloud Backup**: Integration with cloud storage providers
5. **Compliance Reports**: Automated audit reports for compliance
6. **Event Filtering**: Advanced filtering and search capabilities
7. **Performance Monitoring**: Application performance tracking
8. **User Session Analysis**: Detailed user session reconstructions