# Work Integration Module

Manual synchronization system between Roadmap Tool and Azure DevOps (ADO) work items.

## Overview

The Work Integration module provides **manual-trigger** sync operations to push RT projects/tasks to ADO and pull updates back. This is designed for controlled, user-initiated synchronization rather than automatic syncing.

## Architecture

### Core Components

- **WorkIntegration** - Main orchestrator and public API
- **WorkSyncEngine** - Core sync logic (push/pull/reconcile)
- **AzureDevOpsClient** - ADO REST API wrapper
- **WorkTemplateEngine** - Template rendering for work items
- **WorkValidation** - Rule validation and compliance checks
- **WorkMappingConfig** - Status/priority/field mappings
- **AuditLog** - Comprehensive audit trail for compliance

### Data Flow

```
RT Project/Task --> Template Engine --> Validation --> ADO Client
                      |                    |              |
                   Render work          Validate        Create/Update
                   item template        against         work item
                                       rules
```

## Setup

### Configuration

```javascript
import { createWorkIntegration } from './work-integration.js';

const workIntegration = await createWorkIntegration({
  adoOrganization: 'your-org',
  adoProject: 'your-project', 
  adoPat: 'your-personal-access-token',
  templatesPath: './path/to/templates',
  auditStorage: 'localStorage' // or 'memory'
});
```

### Environment Variables

```bash
ADO_ORGANIZATION=your-azure-devops-org
ADO_PROJECT=your-project-name
ADO_PAT=your-personal-access-token
```

### Prerequisites

1. Azure DevOps organization and project
2. Personal Access Token (PAT) with Work Items (read/write) permissions
3. Template files (see fixture structure below)

## Usage

### Push RT Entity to ADO

```javascript
// Push project to ADO as Epic
const result = await workIntegration.pushToADO(rtProject, {
  userId: 'user@company.com',
  workItemType: 'Epic', // Optional, auto-detected
  renderTemplates: true, // Apply templates (default: true)
  force: false // Allow duplicate push (default: false)
});

console.log(result);
// {
//   success: true,
//   operation: 'push',
//   entityId: 'rt-project-123',
//   entityType: 'project',
//   adoWorkItemId: 1001,
//   adoWorkItemType: 'Epic',
//   adoUrl: 'https://dev.azure.com/org/project/_workitems/edit/1001',
//   syncedAt: '2024-01-15T10:30:00Z'
// }
```

### Pull from ADO to RT

```javascript
// Pull updates from ADO work item
const result = await workIntegration.pullFromADO(1001, {
  userId: 'user@company.com',
  resolveConflicts: 'manual' // 'auto' or 'manual'
});

console.log(result);
// {
//   success: true,
//   operation: 'pull',
//   adoWorkItemId: 1001,
//   entityId: 'rt-project-123',
//   entityType: 'project',
//   updatedFields: ['status', 'priority'],
//   conflicts: [],
//   syncedAt: '2024-01-15T10:35:00Z'
// }
```

### Reconcile Differences

```javascript
// Compare RT entity with ADO work item
const result = await workIntegration.reconcile(rtProject, 1001, {
  userId: 'user@company.com',
  lockedFields: ['rt_ids', 'security_block']
});

console.log(result);
// {
//   success: true,
//   operation: 'reconcile',
//   entityId: 'rt-project-123',
//   adoWorkItemId: 1001,
//   recommendedAction: 'push', // 'push', 'pull', or 'skip'
//   reasons: ['RT entity is newer'],
//   conflicts: [
//     {
//       field: 'status',
//       rtValue: 'In Progress',
//       adoValue: 'Active',
//       type: 'field_mismatch'
//     }
//   ],
//   recommendations: [...]
// }
```

### Find Linked Work Items

```javascript
// Find ADO work items linked to RT entity
const linkedItems = await workIntegration.findLinkedWorkItems(rtProject);

console.log(linkedItems);
// [
//   {
//     id: 1001,
//     title: '[Epic] Digital Transformation Initiative',
//     workItemType: 'Epic',
//     state: 'Active',
//     url: 'https://dev.azure.com/org/project/_workitems/edit/1001',
//     lastModified: '2024-01-15T09:30:00Z'
//   }
// ]
```

### Check Sync Status

```javascript
// Check if entity is synced
const status = workIntegration.getSyncStatus(rtProject);

console.log(status);
// {
//   synced: true,
//   status: 'synced',
//   lastSync: '2024-01-15T10:30:00Z',
//   lastSyncDirection: 'RT -> ADO',
//   adoWorkItemId: 1001,
//   adoUrl: 'https://dev.azure.com/org/project/_workitems/edit/1001'
// }
```

## Data Mapping

### RT Entity Types → ADO Work Item Types

| RT Entity | ADO Work Item Type |
|-----------|-------------------|
| Project   | Epic              |
| Task      | User Story        |

### Status Mapping

| RT Status      | ADO State |
|----------------|-----------|
| Not Started    | New       |
| In Progress    | Active    |
| On Hold        | Resolved  |
| Completed      | Closed    |

### Priority Mapping

| RT Priority | ADO Priority |
|-------------|--------------|
| P1          | 1            |
| P2          | 2            |
| P3          | 3            |
| P4          | 4            |

### Field Mappings

| RT Field            | ADO Field                              |
|--------------------|---------------------------------------|
| title              | System.Title (prefixed with type)     |
| description        | System.Description                    |
| status             | System.State                          |
| priority           | Microsoft.VSTS.Common.Priority        |
| start_date         | Microsoft.VSTS.Scheduling.StartDate   |
| end_date           | Microsoft.VSTS.Scheduling.TargetDate  |
| effort_hours       | Microsoft.VSTS.Scheduling.Effort      |
| id / project_id    | Custom.RTProjectId                    |
| id (tasks only)    | Custom.RTTaskId                       |
| financial_treatment| System.Tags (as tag)                  |

## Templates

The system uses templates to format work items consistently:

### Template Structure
```
templates/
├── overlay/
│   ├── epic.md
│   ├── user_story.md
│   ├── task.md
│   └── issue.md
├── base/
│   ├── security.md
│   ├── standards.md
│   └── rules.md
└── chatmodes/
    ├── context_epic.md
    └── context_user_story.md
```

### Template Variables

Templates support these variables:
- `{{title}}` - Work item title
- `{{description}}` - Work item description  
- `{{priority}}` - Priority (P1-P4)
- `{{status}}` - Current status
- `{{start_date}}` - Start date (NZ format: dd/mm/yyyy)
- `{{end_date}}` - End date (NZ format: dd/mm/yyyy)
- `{{financial_treatment}}` - CAPEX/OPEX classification
- `{{effort_hours}}` - Effort estimate (tasks only)
- `{{security_block}}` - Security blocker flag

### Sample Epic Template
```markdown
---
work_item_type: Epic
labels:
  - roadmap-tool
  - {{financial_treatment}}
assignees: []
---

# {{title}}

## Description
{{description}}

## Priority
{{priority}}

## Timeline
- **Start:** {{start_date}}
- **Target:** {{end_date}}

## Security Considerations
{% if security_block %}
⚠️ **Security Review Required**
{% endif %}

*Synced from Roadmap Tool*
```

## Audit Trail

All sync operations are logged for compliance:

```javascript
// Get sync statistics
const stats = workIntegration.getSyncStatistics({
  since: '2024-01-01',
  until: '2024-01-31'
});

// Get recent operations
const recent = workIntegration.getRecentOperations({ 
  limit: 50 
});

// Export audit log
const auditJson = workIntegration.exportAuditLog({
  entityId: 'rt-project-123'
});
```

### Audit Entry Structure
```javascript
{
  id: 'audit_1642234567890_xyz123',
  ts: '2024-01-15T10:30:00Z',
  actor: 'user@company.com',
  action: 'push_completed',
  entityType: 'project',
  entityId: 'rt-project-123',
  details: {
    adoWorkItemId: 1001,
    adoWorkItemType: 'Epic',
    adoUrl: 'https://dev.azure.com/...'
  },
  source: 'work-integration',
  level: 'info'
}
```

## Error Handling

The module provides comprehensive error handling:

```javascript
try {
  const result = await workIntegration.pushToADO(rtProject);
} catch (error) {
  if (error.message.includes('already synced')) {
    // Handle duplicate sync
  } else if (error.message.includes('Validation failed')) {
    // Handle validation error
  } else if (error.message.includes('ADO API error')) {
    // Handle ADO connection/API error
  } else {
    // Handle other errors
  }
}
```

## Testing

### Unit Tests

```bash
npm test -- tests/unit/integrations/work/
```

### Mock Mode

For development and testing:

```javascript
import { MockWorkIntegration } from './work-integration.js';

const mockIntegration = new MockWorkIntegration();
await mockIntegration.initialize();

// All operations work the same but use mock ADO client
```

## Security Considerations

1. **PAT Security**: Store Personal Access Tokens securely
2. **Field Locking**: RT ID fields are locked in ADO to prevent tampering
3. **Audit Trail**: All operations are logged with user attribution
4. **Validation**: All work items validated against governance rules
5. **Manual Trigger**: No automatic sync - all operations user-initiated

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check ADO organization/project names
   - Verify PAT permissions (Work Items read/write)
   - Check network connectivity

2. **Template Rendering Failed**
   - Verify template file paths
   - Check template syntax (Mustache format)
   - Ensure template variables exist in data

3. **Validation Failed**
   - Check rule files in templates/base/
   - Verify required fields are present
   - Check NZ date format (dd/mm/yyyy)

4. **Duplicate Sync Error**
   - Use `force: true` to override
   - Check entity sync status first
   - Review audit log for sync history

### Debug Mode

Enable detailed logging:

```javascript
const workIntegration = await createWorkIntegration({
  // ... config
  debug: true
});
```

## Configuration Files

The system expects these configuration files in the templates directory:

- `config/ado-default.json` - ADO connection defaults
- `config/confluence-default.json` - Documentation settings  
- `config/settings.json` - General settings
- `config/team-structure.json` - Team/role mappings

See the fixture directory for examples of all required files.