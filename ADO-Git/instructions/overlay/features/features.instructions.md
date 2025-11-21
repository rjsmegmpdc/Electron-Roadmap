# Feature Suggestion Template

## Scope
applyTo: "feature"

## Basic Information

### System.Title
**Field:** `System.Title`
**Format:** `[Domain] | [Brief Description]`
**Example:** `IDS | Build ifp-accessory-ws-v1`

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

## Ownership & Accountability

### System.AssignedTo
**Field:** `System.AssignedTo`
*Default assignee for the feature*
**Format:** User object with displayName, uniqueName, email
**Example:** Yash Yash (Yash.Yash@one.nz)

### Custom.ProductOwner
**Field:** `Custom.ProductOwner`
*Primary person responsible for the feature's requirements*
**Format:** User object with displayName, uniqueName, email
**Use:** Yash Yash (Yash.Yash@one.nz)

### Custom.DeliveryLead
**Field:** `Custom.DeliveryLead`
*Person responsible for coordinating delivery*
**Format:** User object with displayName, uniqueName, email
**Use:** Farhan Sarfraz (Farhan.Sarfraz@one.nz)

### Custom.TechLead
**Field:** `Custom.TechLead`
*Technical leadership and architecture decisions*
**Format:** User object with displayName, uniqueName, email
**Use:** Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)

### Custom.BusinessOwner
**Field:** `Custom.BusinessOwner`
*Business stakeholder and decision maker*
**Format:** User object with displayName, uniqueName, email
**Use:** Adrian Albuquerque (Adrian.Albuquerque@one.nz)

### Custom.ProcessOwner
**Field:** `Custom.ProcessOwner`
*Process and methodology oversight*
**Format:** User object with displayName, uniqueName, email
**Use:** Yash Yash (Yash.Yash@one.nz)

### Custom.PlatformOwner
**Field:** `Custom.PlatformOwner`
*Platform and infrastructure ownership*
**Format:** User object with displayName, uniqueName, email
**Use:** Ashish Shivhare (Ashish.Shivhare@one.nz)

## Feature Definition

### System.Description
**Field:** `System.Description`
*User story format describing the feature's purpose*
**Format:** HTML formatted text

**Template:**
```html
<div>
<b><span style="color:rgb(66, 66, 66);font-size:16px;">As a</span><span style="color:rgb(66, 66, 66);font-size:16px;"> </span></b><span style="color:rgb(66, 66, 66);font-size:16px;">[role],</span><br>
<span style="color:rgb(66, 66, 66);font-size:16px;"><b>I want</b> to</span><span style="color:rgb(66, 66, 66);font-size:16px;"> </span><span style="color:rgb(66, 66, 66);font-size:16px;">[action/capability],</span><br>
<b><span style="color:rgb(66, 66, 66);font-size:16px;">So that</span><span style="color:rgb(66, 66, 66);font-size:16px;"> </span></b><span style="color:rgb(66, 66, 66);font-size:16px;">[benefit/outcome].</span>
</div>
```

**Example:**
```html
<div><b><span style="color:rgb(66, 66, 66);font-size:16px;">As a</span><span style="color:rgb(66, 66, 66);font-size:16px;"> </span></b><span style="color:rgb(66, 66, 66);font-size:16px;">support engineer,</span><br>
<span style="color:rgb(66, 66, 66);font-size:16px;"><b>I want</b> to</span><span style="color:rgb(66, 66, 66);font-size:16px;"> </span><span style="color:rgb(66, 66, 66);font-size:16px;">upgrade the</span><span style="color:rgb(66, 66, 66);font-size:16px;"> </span><span style="color:rgb(66, 66, 66);font-size:16px;">application to Mule Runtime 4.9 and JDK 17, and transition its O&amp;M from Splunk to Dynatrace,</span><br>
<b><span style="color:rgb(66, 66, 66);font-size:16px;">So that</span><span style="color:rgb(66, 66, 66);font-size:16px;"> </span></b><span style="color:rgb(66, 66, 66);font-size:16px;">I can enhance performance, security, and monitoring capabilities.</span></div>
```

### Custom.OutofScope
**Field:** `Custom.OutofScope`
*Explicitly state what is NOT included in this feature*
**Format:** HTML formatted text

**Template:**
```html
<div>
<ul style="margin:0px 0px 8px;max-width:none;box-sizing:border-box;color:rgb(66, 66, 66);font-size:16px;background-color:rgb(250, 250, 250);">
<li>Item 1 that is excluded</li>
<li>Item 2 that is excluded</li>
<li>Rationale for exclusions</li>
</ul>
</div>
```

**Example:**
```html
<div>
<ul style="margin:0px 0px 8px;max-width:none;box-sizing:border-box;color:rgb(66, 66, 66);font-size:16px;background-color:rgb(250, 250, 250);">
<li>Upgrades for applications not listed in the initial 18.</li>
<li>Major refactoring of application code beyond compatibility adjustments.</li>
</ul>
</div>
```

## Success Criteria

### Microsoft.VSTS.Common.AcceptanceCriteria
**Field:** `Microsoft.VSTS.Common.AcceptanceCriteria`
*Specific, testable criteria that must be met*
**Format:** HTML formatted list

**Template:**
```html
<div>
<ul style="margin:0px 0px 8px;max-width:none;box-sizing:border-box;color:rgb(66, 66, 66);font-size:16px;background-color:rgb(250, 250, 250);">
<li>Acceptance Criteria 1 - [Specific deliverable with clear success measure]</li>
<li>Acceptance Criteria 2 - [Specific deliverable with clear success measure]</li>
<li>Acceptance Criteria 3 - [Specific deliverable with clear success measure]</li>
</ul>
</div>
```

**Example:**
```html
<div>
<ul style="margin:0px 0px 8px;max-width:none;box-sizing:border-box;color:rgb(66, 66, 66);font-size:16px;background-color:rgb(250, 250, 250);">
<li>The application is successfully upgraded to Mule Runtime 4.9 and JDK 17.</li>
<li>All the Vulnerable libraries Upgraded</li>
<li>No critical issues or downtime during the upgrade process.</li>
<li>The application passes post-upgrade testing and validation.</li>
<li>Monitoring and alerting configurations are replicated and validated in Dynatrace.</li>
<li>Deployed to production</li>
</ul>
</div>
```

### Custom.Outcomes
**Field:** `Custom.Outcomes`
*High-level business outcomes expected from this feature*
**Format:** HTML formatted list

**Template:**
```html
<ul style="margin:0px 0px 8px;max-width:none;box-sizing:border-box;color:rgb(66, 66, 66);font-size:16px;background-color:rgb(250, 250, 250);">
<li>Outcome 1</li>
<li>Outcome 2</li>
<li>Outcome 3</li>
</ul>
```

**Example:**
```html
<ul style="margin:0px 0px 8px;max-width:none;box-sizing:border-box;color:rgb(66, 66, 66);font-size:16px;background-color:rgb(250, 250, 250);">
<li>Enhanced performance and security.</li>
<li>Improved monitoring and observability.</li>
<li>Increased operational efficiency.</li>
</ul>
```

## Categorization

### System.Tags
**Field:** `System.Tags`
*Relevant tags for categorization and searchability*
**Format:** Semicolon-separated string (e.g., "BTE Tribe; Integration Platform; MuleUpgrade")

### System.AreaPath
**Field:** `System.AreaPath`
*Organizational area/team path*
**Format:** Always use "IT\\BTE Tribe\\Integration and DevOps Tooling"

### System.IterationPath
**Field:** `System.IterationPath`
*Sprint/iteration path for planning*
**Format:** use the current quarter if the last sprint is not currently active (e.g., "IT\\Sprint\\FY26\\Q1")
**Example:** "IT\\Sprint\\FY26\\Q1\\Sprint 1"
**Note:** Ensure the iteration path matches the current fiscal year and quarter.

## System Field Mapping Reference

### Required System Fields (Auto-populated)
- `System.WorkItemType`: "Feature"
- `System.State`: "New" → "Active" → "Resolved" → "Closed"
- `System.Reason`: State transition reason
- `System.CreatedDate`: Auto-generated timestamp
- `System.CreatedBy`: User who created the feature
- `System.ChangedDate`: Last modified timestamp
- `System.ChangedBy`: User who last modified the feature
- `Microsoft.VSTS.Common.StateChangeDate`: When state last changed

### Board/Kanban Fields
- `System.BoardColumn`: Current board column
- `System.BoardColumnDone`: Boolean for column completion
- `WEF_*_Kanban.Column`: Board-specific column tracking
- `WEF_*_Kanban.Column.Done`: Board-specific completion status

## Agent Guidelines for Feature Suggestions

When suggesting new features, ensure all mapped fields are populated:

### 1. Core Business Fields (Required)
```json
{
  "System.Title": "[Team/Domain] | [Quarter] | [Description]",
  "Microsoft.VSTS.Common.Priority": 2,
  "Microsoft.VSTS.Common.ValueArea": "Business"
}
```

### 2. Ownership Fields (Required)
```json
{
  "Custom.ProductOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.DeliveryLead": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.TechLead": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.BusinessOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.ProcessOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.PlatformOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "System.AssignedTo": {"displayName": "Name", "uniqueName": "email@domain.com"}
}
```

### 3. Content Fields (Required)
```json
{
  "System.Description": "<div><b>As a</b> [role],<br><b>I want</b> to [action],<br><b>So that</b> [benefit].</div>",
  "Microsoft.VSTS.Common.AcceptanceCriteria": "<div><ul><li>Criteria 1</li></ul></div>",
  "Custom.Outcomes": "<ul><li>Outcome 1</li></ul>",
  "Custom.OutofScope": "<div><ul><li>Out of scope item</li></ul></div>",
  "Custom.DefinitionOfReady": "<div>[x] {Done} Required field 1</div>",
  "Custom.DefinitionOfDone": "<div>[ ] {To do} Completion criteria 1</div>"
}
```

### 4. Categorization Fields
```json
{
  "System.Tags": "Tag1;Tag2;Tag3",
  "System.AreaPath": "IT\\Team Name",
  "System.IterationPath": "IT\\Sprint\\FY26\\Q1\\Sprint X"
}
```

### Field Validation Rules
- **User Objects**: Must include displayName and uniqueName at minimum
- **HTML Fields**: Use proper HTML tags with div/ul/li structure
- **Tags**: Semicolon-separated, no spaces around semicolons
- **Paths**: Use double backslash (\\) as separator
- **Priority**: Integer values 1-4

### Common Feature Patterns Based on Example
- **Technical Upgrades**: Upgrading applications, runtimes, or frameworks
- **Integration Development**: Building new integrations or web services
- **Monitoring Transitions**: Switching between monitoring tools
- **Security Enhancements**: Addressing vulnerabilities or security requirements 
- **Performance Optimization**: Improving application performance
