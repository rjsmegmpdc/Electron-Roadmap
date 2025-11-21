# Issue Suggestion Template

## Scope
applyTo: "Issue"

## Basic Information

### System.Title
**Field:** `System.Title`
**Format:** `[Issue Type] | [Brief Description]`
**Example:** `Bug | API timeout errors in ifp-accessory-ws-v1 after Mule upgrade`

### Microsoft.VSTS.Common.Priority
**Field:** `Microsoft.VSTS.Common.Priority`
- **1** - Critical/Urgent (system down, security breach)
- **2** - High Priority (as in example)
- **3** - Medium Priority
- **4** - Low Priority

### Microsoft.VSTS.Common.Severity
**Field:** `Microsoft.VSTS.Common.Severity`
- **1 - Critical** - System unusable, data loss, security breach
- **2 - High** - Major functionality impacted (as in example)
- **3 - Medium** - Minor functionality impacted
- **4 - Low** - Cosmetic or minor inconvenience

### Custom.IssueType
**Field:** `Custom.IssueType`
- **Bug** - Software defect requiring fix
- **Impediment** - Blocking issue preventing progress
- **Risk** - Potential problem requiring mitigation
- **Debt** - Technical debt requiring attention

## Ownership & Accountability

### System.AssignedTo
**Field:** `System.AssignedTo`
*Person responsible for resolving the issue*
**Format:** User object with displayName, uniqueName, email
**Example:** Vamshi Arelli (Vamshi.Arelli@one.nz)

### Microsoft.VSTS.Common.ResolvedBy
**Field:** `Microsoft.VSTS.Common.ResolvedBy`
*Person who resolved the issue (populated when resolved)*
**Format:** User object with displayName, uniqueName, email

## Issue Definition

### System.Description
**Field:** `System.Description`
*Detailed description of the issue with reproduction steps*
**Format:** HTML formatted text

**Template:**
```html
<div><b>Issue Summary:</b> [Brief description of the problem]</div>
<div><br></div>
<div><b>Environment:</b> [Where the issue occurs]</div>
<div><br></div>
<div><b>Steps to Reproduce:</b></div>
<div>
<ol>
<li>Step 1</li>
<li>Step 2</li>
<li>Step 3</li>
</ol>
</div>
<div><b>Expected Result:</b> [What should happen]</div>
<div><br></div>
<div><b>Actual Result:</b> [What actually happens]</div>
<div><br></div>
<div><b>Impact:</b> [Business or technical impact]</div>
```

**Example:**
```html
<div><b>Issue Summary:</b> API requests to ifp-accessory-ws-v1 are timing out after Mule Runtime 4.9 upgrade</div>
<div><br></div>
<div><b>Environment:</b> Production environment, Mule Runtime 4.9, JDK 17</div>
<div><br></div>
<div><b>Steps to Reproduce:</b></div>
<div>
<ol>
<li>Send API request to /api/v1/accessories endpoint</li>
<li>Wait for response</li>
<li>Request times out after 30 seconds</li>
</ol>
</div>
<div><b>Expected Result:</b> API should respond within 5 seconds with valid data</div>
<div><br></div>
<div><b>Actual Result:</b> Request times out, returns 504 Gateway Timeout error</div>
<div><br></div>
<div><b>Impact:</b> Customer-facing functionality unavailable, affecting order processing</div>
```

### Microsoft.VSTS.TCM.ReproSteps
**Field:** `Microsoft.VSTS.TCM.ReproSteps`
*Detailed reproduction steps for testing*
**Format:** HTML formatted text

**Template:**
```html
<div><b>Prerequisites:</b></div>
<div>
<ul>
<li>Prerequisite 1</li>
<li>Prerequisite 2</li>
</ul>
</div>
<div><b>Detailed Steps:</b></div>
<div>
<ol>
<li>Detailed step 1 with specific parameters</li>
<li>Detailed step 2 with expected intermediate result</li>
<li>Detailed step 3 with final expected outcome</li>
</ol>
</div>
```

### Custom.RootCause
**Field:** `Custom.RootCause`
*Root cause analysis once identified*
**Format:** HTML formatted text

**Template:**
```html
<div><b>Root Cause:</b> [Underlying cause of the issue]</div>
<div><br></div>
<div><b>Contributing Factors:</b></div>
<div>
<ul>
<li>Factor 1</li>
<li>Factor 2</li>
</ul>
</div>
```

### Custom.Resolution
**Field:** `Custom.Resolution`
*Description of how the issue was resolved*
**Format:** HTML formatted text

**Template:**
```html
<div><b>Solution Applied:</b> [What was done to fix the issue]</div>
<div><br></div>
<div><b>Changes Made:</b></div>
<div>
<ul>
<li>Change 1</li>
<li>Change 2</li>
</ul>
</div>
<div><b>Verification:</b> [How the fix was verified]</div>
```

## Impact Assessment

### Custom.BusinessImpact
**Field:** `Custom.BusinessImpact`
*Business impact of the issue*
**Options:**
- **Critical** - Business operations stopped
- **High** - Major business function impacted
- **Medium** - Minor business function impacted
- **Low** - Minimal business impact

### Custom.UserImpact
**Field:** `Custom.UserImpact`
*Impact on end users*
**Format:** HTML formatted text

**Template:**
```html
<div><b>Users Affected:</b> [Number/type of users affected]</div>
<div><b>Functionality Impact:</b> [What functionality is impacted]</div>
<div><b>Workaround Available:</b> [Yes/No and description if available]</div>
```

## Resolution Information

### Microsoft.VSTS.Common.Resolution
**Field:** `Microsoft.VSTS.Common.Resolution`
*Type of resolution applied*
**Options:**
- **Fixed** - Issue resolved with code/configuration change
- **Duplicate** - Duplicate of another issue
- **Won't Fix** - Issue acknowledged but not fixing
- **By Design** - Behavior is as designed
- **Cannot Reproduce** - Unable to reproduce the issue

### Microsoft.VSTS.Scheduling.OriginalEstimate
**Field:** `Microsoft.VSTS.Scheduling.OriginalEstimate`
*Estimated hours to resolve the issue*
**Example:** `4` (4 hours estimated)

### Microsoft.VSTS.Scheduling.RemainingWork
**Field:** `Microsoft.VSTS.Scheduling.RemainingWork`
*Remaining hours to complete resolution*
**Example:** `2` (2 hours remaining)

## Categorization

### System.Parent
**Field:** `System.Parent`
*ID of the parent work item if this issue is related to a specific feature/epic*
**Format:** Integer (Work Item ID)
**Example:** `622311`

### System.Tags
**Field:** `System.Tags`
*Relevant tags for categorization and searchability*
**Format:** Semicolon-separated string
**Example:** `"Bug;API;Timeout;Production;MuleUpgrade"`

### System.AreaPath
**Field:** `System.AreaPath`
*Organizational area/team path*
**Format:** Always "IT\\BTE Tribe\\Integration and DevOps Tooling"

### System.IterationPath
**Field:** `System.IterationPath`
*Sprint/iteration path for resolution*
**Format:** Current active sprint or next available sprint
**Example:** `IT\\Sprint\\FY26\\Q1\\Sprint 1`

---

## Agent Guidelines for Issue Suggestions

When suggesting new issues, ensure all mapped fields are populated:

### 1. Core Information (Required)
```json
{
  "System.Title": "[Type] | [Brief Description]",
  "Microsoft.VSTS.Common.Priority": 2,
  "Microsoft.VSTS.Common.Severity": 2,
  "Custom.IssueType": "Bug",
  "Custom.BusinessImpact": "High"
}
```

### 2. Ownership (Required)
```json
{
  "System.AssignedTo": {"displayName": "Name", "uniqueName": "email@domain.com"}
}
```

### 3. Content Fields (Required)
```json
{
  "System.Description": "<div>HTML formatted description</div>",
  "Microsoft.VSTS.TCM.ReproSteps": "<div><ol><li>Step 1</li></ol></div>",
  "Custom.UserImpact": "<div>Impact description</div>"
}
```

### 4. Resolution Planning (Optional initially)
```json
{
  "Microsoft.VSTS.Scheduling.OriginalEstimate": 4,
  "Microsoft.VSTS.Scheduling.RemainingWork": 4
}
```

### 5. Categorization Fields
```json
{
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
- **Priority/Severity**: Integer values 1-4
- **Work Estimates**: Integer values representing hours

### Common Issue Types and Patterns
- **Bugs**: Code defects, functional issues, integration problems
- **Performance Issues**: Slow response times, timeouts, resource consumption
- **Security Issues**: Vulnerabilities, access control problems, data exposure
- **Infrastructure Issues**: Environment problems, deployment failures, connectivity
- **Configuration Issues**: Settings problems, environment mismatches
- **Integration Issues**: API failures, data synchronization problems
- **Impediments**: Blocked work, dependency issues, resource constraints
- **Technical Debt**: Code quality issues, outdated dependencies, architectural problems

### Issue Lifecycle Management
- **New**: Issue reported and awaiting triage
- **Active**: Issue assigned and being worked on
- **Resolved**: Issue fixed and awaiting verification
- **Closed**: Issue verified as resolved and closed

### Quality Assurance Elements
- **Clear Reproduction Steps**: Detailed steps to reproduce the issue
- **Impact Assessment**: Clear business and user impact
- **Root Cause Analysis**: When available, document root cause
- **Resolution Documentation**: How the issue was resolved for future reference
