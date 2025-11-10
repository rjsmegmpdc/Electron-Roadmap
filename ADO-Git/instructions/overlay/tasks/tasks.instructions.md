# Task Suggestion Template

## Scope
applyTo: "task"

## Basic Information

### System.Title
**Field:** `System.Title`
**Format:** `[Brief Description of Task]`
**Example:** `Configure Dynatrace monitoring for ifp-accessory-ws-v1`

### Microsoft.VSTS.Common.Priority
**Field:** `Microsoft.VSTS.Common.Priority`
- **1** - Critical/Urgent
- **2** - High Priority
- **3** - Medium Priority (as in example)
- **4** - Low Priority

### Microsoft.VSTS.Common.ValueArea
**Field:** `Microsoft.VSTS.Common.ValueArea`
- **Business** - Direct business value
- **Architectural** - Technical/infrastructure improvements (as in example)

### Microsoft.VSTS.Scheduling.RemainingWork
**Field:** `Microsoft.VSTS.Scheduling.RemainingWork`
*Estimate of effort in hours*
**Example:** `8` (8 hours of work)

### Microsoft.VSTS.Scheduling.OriginalEstimate
**Field:** `Microsoft.VSTS.Scheduling.OriginalEstimate`
*Original estimate of effort in hours*
**Example:** `8` (8 hours originally estimated)

## Ownership & Accountability

### System.AssignedTo
**Field:** `System.AssignedTo`
*Person responsible for completing the task*
**Format:** User object with displayName, uniqueName, email
**Example:** Iryn Rudy (Iryn.Rudy@one.nz)

## Task Definition

### System.Description
**Field:** `System.Description`
*Clear description of what needs to be accomplished*
**Format:** HTML formatted text

**Template:**
```html
<div>Task: [What needs to be done]</div>
<div><br></div>
<div>Context: [Background information and rationale]</div>
<div><br></div>
<div>Steps:</div>
<div>
<ol>
<li>Step 1 with specific action</li>
<li>Step 2 with specific action</li>
<li>Step 3 with specific action</li>
</ol>
</div>
```

**Example:**
```html
<div>Task: Configure Dynatrace monitoring and alerting for the ifp-accessory-ws-v1 application after migration to Mule Runtime 4.9</div>
<div><br></div>
<div>Context: As part of the migration process, monitoring needs to be transitioned from Splunk to Dynatrace with equivalent alerting capabilities.</div>
<div><br></div>
<div>Steps:</div>
<div>
<ol>
<li>Install Dynatrace OneAgent on the application servers</li>
<li>Configure application-specific tags and metadata</li>
<li>Set up performance monitoring dashboards</li>
<li>Configure alerting rules based on previous Splunk alerts</li>
<li>Test alerting functionality and validate thresholds</li>
</ol>
</div>
```

### Microsoft.VSTS.Common.AcceptanceCriteria
**Field:** `Microsoft.VSTS.Common.AcceptanceCriteria`
*Specific, testable criteria that must be met for the task to be considered complete*
**Format:** HTML formatted list

**Template:**
```html
<div>
<ul>
<li>Acceptance Criteria 1 - [Specific deliverable with clear success measure]</li>
<li>Acceptance Criteria 2 - [Specific deliverable with clear success measure]</li>
<li>Acceptance Criteria 3 - [Specific deliverable with clear success measure]</li>
</ul>
</div>
```

**Example:**
```html
<div>
<ul>
<li>Dynatrace OneAgent is successfully installed and reporting metrics</li>
<li>Application performance metrics are visible in Dynatrace dashboard</li>
<li>All critical alerts are configured and tested</li>
<li>Alert notifications are delivered to the correct teams</li>
<li>Documentation is updated with new monitoring procedures</li>
</ul>
</div>
```

## Categorization

### System.Parent
**Field:** `System.Parent`
*ID of the parent user story or feature that this task belongs to*
**Format:** Integer (User Story or Feature ID)
**Example:** `622312`

### System.Tags
**Field:** `System.Tags`
*Relevant tags for categorization and searchability*
**Format:** Semicolon-separated string
**Example:** `"Monitoring;Dynatrace;Migration;DevOps"`

### System.AreaPath
**Field:** `System.AreaPath`
*Organizational area/team path*
**Format:** Always "IT\\BTE Tribe\\Integration and DevOps Tooling"

### System.IterationPath
**Field:** `System.IterationPath`
*Sprint/iteration path for planning*
**Format:** Match with the parent user story or feature's sprint
**Example:** `IT\\Sprint\\FY26\\Q1\\Sprint 1`

## System Field Mapping Reference

### Required System Fields (Auto-populated)
- `System.WorkItemType`: "Task"
- `System.State`: "New" → "Active" → "Closed"
- `System.Reason`: State transition reason
- `System.CreatedDate`: Auto-generated timestamp
- `System.CreatedBy`: User who created the task
- `System.ChangedDate`: Last modified timestamp
- `System.ChangedBy`: User who last modified the task

### Activity Tracking
- `Microsoft.VSTS.Scheduling.CompletedWork`: Hours of work completed
- `Microsoft.VSTS.Common.Activity`: Type of work (Development, Testing, Documentation, etc.)

---

## Agent Guidelines for Task Suggestions

When suggesting new tasks, ensure all mapped fields are populated:

### 1. Core Information (Required)
```json
{
  "System.Title": "[Brief Description of Task]",
  "Microsoft.VSTS.Common.Priority": 3,
  "Microsoft.VSTS.Common.ValueArea": "Architectural",
  "Microsoft.VSTS.Scheduling.RemainingWork": 8,
  "Microsoft.VSTS.Scheduling.OriginalEstimate": 8
}
```

### 2. Task Specifics
Only User Story can be broken down into Tasks, not User stories or epics or initiatives.
```

### 3. Categorization Fields
```json
{
  "System.Parent": 622312,
  "System.Tags": "Tag1;Tag2;Tag3",
  "System.AreaPath": "IT\\BTE Tribe\\Integration and DevOps Tooling",
  "System.IterationPath": "IT\\Sprint\\FY26\\Q1\\Sprint 1"
}
```

### Field Validation Rules
- **User Objects**: Must include displayName and uniqueName at minimum
- **HTML Fields**: Use proper HTML tags with div/ul/li/ol structure
- **Tags**: Semicolon-separated, no spaces around semicolons
- **Paths**: Use double backslash (\\) as separator
- **Priority**: Integer values 1-4
- **Work Estimates**: Integer values representing hours

### Common Task Patterns
- **Development Tasks**: Code implementation, refactoring, bug fixes
- **Configuration Tasks**: Environment setup, tool configuration
- **Testing Tasks**: Unit testing, integration testing, validation
- **Documentation Tasks**: Creating guides, updating procedures
- **Deployment Tasks**: Release preparation, deployment activities
- **Monitoring Tasks**: Setting up alerts, dashboards, logging
- **Security Tasks**: Vulnerability fixes, security configuration
- **Process Tasks**: Workflow setup, automation, CI/CD pipeline work

### Quality Assurance Elements
- **Clear Acceptance Criteria**: Specific, measurable outcomes
- **Proper Estimation**: Realistic time estimates in hours
- **Parent Relationship**: Linked to appropriate user story or feature
- **Team Assignment**: Assigned to team member with appropriate skills
