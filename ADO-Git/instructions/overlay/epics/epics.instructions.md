# Epic Suggestion Template

## Scope
applyTo: "epic"

## Basic Information

### System.Title
**Field:** `System.Title`
**Format:** `[Domain] | [Brief Description]`
**Example:** `[IDS] | Enabling Security as Code & Standardizing the Platforms`

### Microsoft.VSTS.Common.Priority
**Field:** `Microsoft.VSTS.Common.Priority`
- **1** - Critical/Urgent
- **2** - High Priority (as in example)
- **3** - Medium Priority
- **4** - Low Priority

### Microsoft.VSTS.Common.ValueArea
**Field:** `Microsoft.VSTS.Common.ValueArea`
- **Business** - Direct business value (as in example)
- **Architectural** - Technical/infrastructure improvements

### Custom.EpicSizing
**Field:** `Custom.EpicSizing`
- **XS** - Very small effort (1-2 weeks)
- **S** - Small effort (3-4 weeks) (as in example)
- **M** - Medium effort (1-2 months)
- **L** - Large effort (2-3 months)
- **XL** - Extra large effort (3+ months)

## Ownership & Accountability

### System.AssignedTo
**Field:** `System.AssignedTo`
*Default assignee for the epic*
**Format:** User object with displayName, uniqueName, email
**Example:** Yash Yash (Yash.Yash@one.nz)

### Custom.EpicOwner
**Field:** `Custom.EpicOwner`
*Primary person responsible for the epic's success*
**Format:** User object with displayName, uniqueName, email
**Example:** Yash Yash (Yash.Yash@one.nz)

### Custom.DeliveryLead
**Field:** `Custom.DeliveryLead`
*Person responsible for coordinating delivery*
**Format:** User object with displayName, uniqueName, email
**Example:** Farhan Sarfraz (Farhan.Sarfraz@one.nz)

### Custom.TechLead
**Field:** `Custom.TechLead`
*Technical leadership and architecture decisions*
**Format:** User object with displayName, uniqueName, email
**Example:** Ashish Shivhare (Ashish.Shivhare@one.nz)

### Custom.BusinessOwner
**Field:** `Custom.BusinessOwner`
*Business stakeholder and decision maker*
**Format:** User object with displayName, uniqueName, email
**Example:** Adrian Albuquerque (Adrian.Albuquerque@one.nz)

### Custom.ProcessOwner
**Field:** `Custom.ProcessOwner`
*Process and methodology oversight*
**Format:** User object with displayName, uniqueName, email
**Example:** Yash Yash (Yash.Yash@one.nz)

### Custom.PlatformOwner
**Field:** `Custom.PlatformOwner`
*Platform and infrastructure ownership*
**Format:** User object with displayName, uniqueName, email
**Example:** Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)

## Timeline & Planning

### Custom.PlannedStartDate
**Field:** `Custom.PlannedStartDate`
*When the epic is expected to begin*
**Format:** ISO 8601 date (e.g., "2023-06-30T12:00:00Z")

### Custom.PlannedDeliveryDate
**Field:** `Custom.PlannedDeliveryDate`
*Target completion date*
**Format:** ISO 8601 date (e.g., "2023-09-29T11:00:00Z")

### Microsoft.VSTS.Scheduling.TargetDate
**Field:** `Microsoft.VSTS.Scheduling.TargetDate`
*Final deadline if different from delivery date*
**Format:** ISO 8601 date (e.g., "2023-09-29T11:00:00Z")

### Microsoft.VSTS.Scheduling.StartDate
**Field:** `Microsoft.VSTS.Scheduling.StartDate`
*Scheduled start date*
**Format:** ISO 8601 date (e.g., "2023-06-30T12:00:00Z")

## Epic Definition

### System.Description
**Field:** `System.Description`
*Comprehensive description of what needs to be accomplished and why*
**Format:** HTML formatted text

**Template:**
```html
<div>At [Organization], in order to [business objective], we need to [solution approach].</div>
<div><br></div>
<div>This is to ensure [expected benefits/outcomes].</div>
<div><br></div>
<div>[Additional context and background information]</div>
<div><br></div>
<div>In Scope Applications</div>
<div>
<ul>
<li>Application/Tool 1</li>
<li>Application/Tool 2</li>
<li>Application/Tool 3</li>
</ul>
</div>
```

### Custom.OutofScope
**Field:** `Custom.OutofScope`
*Explicitly state what is NOT included in this epic*
**Format:** HTML formatted text

**Template:**
```html
<div>Item 1 that is excluded</div>
<div>Item 2 that is excluded</div>
<div>Rationale for exclusions</div>
```

## Success Criteria

### Custom.Outcomes
**Field:** `Custom.Outcomes`
*High-level business outcomes expected from this epic*
**Format:** HTML formatted list

**Template:**
```html
<ul>
<li>Outcome 1</li>
<li>Outcome 2</li>
<li>Outcome 3</li>
</ul>
```

### Custom.LeadingIndicators
**Field:** `Custom.LeadingIndicators`
*Measurable milestones that indicate progress toward outcomes*
**Format:** HTML formatted list

**Template:**
```html
<ul>
<li>Milestone 1 with specific deliverable</li>
<li>Milestone 2 with specific deliverable</li>
<li>Milestone 3 with specific deliverable</li>
</ul>
```

### Custom.EpicAcceptanceCriteria
**Field:** `Custom.EpicAcceptanceCriteria`
*Specific, testable criteria that must be met for the epic to be considered complete*
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

## Technical Considerations

### Custom.NonfunctionalRequirements
**Field:** `Custom.NonfunctionalRequirements`
*Performance, security, scalability, and other technical requirements*
**Format:** Plain text or HTML

**Template:**
```
[Non-functional requirements (NFRs) associated with the epic.]
- NFR 1: [Specific requirement with measurable criteria]
- NFR 2: [Specific requirement with measurable criteria]
```

## Categorization

### System.Tags
**Field:** `System.Tags`
*Relevant tags for categorization and searchability*
**Format:** Semicolon-separated string (e.g., "Devsecops;Security;Platform")

### System.AreaPath
**Field:** `System.AreaPath`
*Organizational area/team path*
**Format:** Always "IT\\BTE Tribe"

### System.IterationPath
**Field:** `System.IterationPath`
*Sprint/iteration path for planning*
**Format:** Current fiscal year and quarter (e.g., "IT\\Sprint\\FY26\\Q1")

---

## System Field Mapping Reference

### Required System Fields (Auto-populated)
- `System.WorkItemType`: "Epic"
- `System.State`: "New" → "Active" → "Resolved" → "Closed"
- `System.Reason`: State transition reason
- `System.CreatedDate`: Auto-generated timestamp
- `System.CreatedBy`: User who created the epic
- `System.ChangedDate`: Last modified timestamp
- `System.ChangedBy`: User who last modified the epic
- `Microsoft.VSTS.Common.StateChangeDate`: When state last changed
- `Microsoft.VSTS.Common.ActivatedDate`: When epic was activated
- `Microsoft.VSTS.Common.ActivatedBy`: User who activated the epic

### Board/Kanban Fields
- `System.BoardColumn`: Current board column
- `System.BoardColumnDone`: Boolean for column completion
- `WEF_*_Kanban.Column`: Board-specific column tracking
- `WEF_*_Kanban.Column.Done`: Board-specific completion status

## Agent Guidelines for Epic Suggestions

When suggesting new epics, ensure all mapped fields are populated:

### 1. Core Business Fields (Required)
```json
{
  "System.Title": "[Quarter] | [Domain] | [Description]",
  "Microsoft.VSTS.Common.Priority": 2,
  "Microsoft.VSTS.Common.ValueArea": "Business",
  "Custom.EpicSizing": "S"
}
```

### 2. Ownership Fields (Required)
```json
{
  "Custom.EpicOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.DeliveryLead": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.TechLead": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.BusinessOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.ProcessOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.PlatformOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "System.AssignedTo": {"displayName": "Name", "uniqueName": "email@domain.com"}
}
```

### 3. Timeline Fields (Required)
```json
{
  "Custom.PlannedStartDate": "2024-01-01T12:00:00Z",
  "Custom.PlannedDeliveryDate": "2024-03-31T11:00:00Z",
  "Microsoft.VSTS.Scheduling.TargetDate": "2024-03-31T11:00:00Z",
  "Microsoft.VSTS.Scheduling.StartDate": "2024-01-01T12:00:00Z",
  "Custom.AdjustedStartDate": "2024-01-01T12:00:00Z"
}
```

### 4. Content Fields (Required)
```json
{
  "System.Description": "<div>HTML formatted description</div>",
  "Custom.Outcomes": "<ul><li>Outcome 1</li></ul>",
  "Custom.LeadingIndicators": "<ul><li>Indicator 1</li></ul>",
  "Custom.EpicAcceptanceCriteria": "<div><ul><li>Criteria 1</li></ul></div>",
  "Custom.NonfunctionalRequirements": "[Requirements text]",
  "Custom.OutofScope": "<div>Out of scope items</div>"
}
```

### 5. Categorization Fields
```json
{
  "System.Tags": "Tag1;Tag2;Tag3",
  "System.AreaPath": "IT\\Team Name",
  "System.IterationPath": "IT\\Sprint\\FY25\\Q1"
}
```

### Field Validation Rules
- **Dates**: Must be in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
- **User Objects**: Must include displayName and uniqueName at minimum
- **HTML Fields**: Use proper HTML tags with div/ul/li structure
- **Tags**: Semicolon-separated, no spaces around semicolons
- **Paths**: Use double backslash (\\) as separator
- **Priority**: Integer values 1-4
- **Epic Sizing**: Single letter values (XS, S, M, L, XL)

### Common Epic Patterns Based on Example
- **Platform Modernization**: Upgrading or standardizing development platforms
- **Security Enhancement**: Implementing security tools, processes, or compliance
- **Developer Experience**: Improving tools, processes, or automation for development teams
- **Integration Projects**: Connecting systems or implementing new integrations
- **Compliance Initiatives**: Meeting regulatory or organizational standards