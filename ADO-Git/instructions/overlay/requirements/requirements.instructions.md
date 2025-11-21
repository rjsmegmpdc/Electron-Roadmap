# Requirement Suggestion Template
## Scope
applyTo: "requirement"

## Basic Information

### System.Title
**Field:** `System.Title`
**Format:** `[Requirement Category] | [Brief Description]`
**Example:** `Security | Multi-factor authentication for API access`

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

### Custom.RequirementType
**Field:** `Custom.RequirementType`
- **Functional** - Business functionality requirements
- **Non-Functional** - Performance, security, scalability requirements
- **Compliance** - Regulatory or policy requirements
- **Technical** - Technical constraints or standards

## Ownership & Accountability

### System.AssignedTo
**Field:** `System.AssignedTo`
*Person responsible for the requirement definition and validation*
**Format:** User object with displayName, uniqueName, email
**Example:** Adrian Albuquerque (Adrian.Albuquerque@one.nz)

### Custom.BusinessOwner
**Field:** `Custom.BusinessOwner`
*Business stakeholder who owns this requirement*
**Format:** User object with displayName, uniqueName, email
**Example:** Adrian Albuquerque (Adrian.Albuquerque@one.nz)

### Custom.TechnicalOwner
**Field:** `Custom.TechnicalOwner`
*Technical lead responsible for implementation approach*
**Format:** User object with displayName, uniqueName, email
**Example:** Ashish Shivhare (Ashish.Shivhare@one.nz)

## Requirement Definition

### System.Description
**Field:** `System.Description`
*Detailed description of the requirement*
**Format:** HTML formatted text

**Template:**
```html
<div><b>Requirement:</b> [Clear statement of what is required]</div>
<div><br></div>
<div><b>Rationale:</b> [Why this requirement is needed]</div>
<div><br></div>
<div><b>Context:</b> [Background and situational information]</div>
<div><br></div>
<div><b>Constraints:</b></div>
<div>
<ul>
<li>Constraint 1</li>
<li>Constraint 2</li>
<li>Constraint 3</li>
</ul>
</div>
```

**Example:**
```html
<div><b>Requirement:</b> All API endpoints must implement multi-factor authentication (MFA) for access control</div>
<div><br></div>
<div><b>Rationale:</b> To enhance security posture and comply with organizational security policies for API access</div>
<div><br></div>
<div><b>Context:</b> Current APIs use basic authentication which is insufficient for sensitive operations and data access</div>
<div><br></div>
<div><b>Constraints:</b></div>
<div>
<ul>
<li>Must integrate with existing Active Directory infrastructure</li>
<li>Should support multiple MFA methods (SMS, app-based, hardware tokens)</li>
<li>Must maintain backward compatibility during transition period</li>
</ul>
</div>
```

### Microsoft.VSTS.Common.AcceptanceCriteria
**Field:** `Microsoft.VSTS.Common.AcceptanceCriteria`
*Specific, testable criteria that define when the requirement is satisfied*
**Format:** HTML formatted list

**Template:**
```html
<div><b>Functional Criteria:</b></div>
<div>
<ul>
<li>Functional requirement 1 with measurable outcome</li>
<li>Functional requirement 2 with measurable outcome</li>
</ul>
</div>
<div><b>Non-Functional Criteria:</b></div>
<div>
<ul>
<li>Performance requirement with specific metrics</li>
<li>Security requirement with compliance standard</li>
</ul>
</div>
<div><b>Compliance Criteria:</b></div>
<div>
<ul>
<li>Regulatory requirement with specific standard</li>
</ul>
</div>
```

**Example:**
```html
<div><b>Functional Criteria:</b></div>
<div>
<ul>
<li>All API endpoints require MFA token validation before processing requests</li>
<li>Support for at least 3 MFA methods (SMS, authenticator app, hardware token)</li>
<li>Graceful fallback mechanism when MFA service is unavailable</li>
</ul>
</div>
<div><b>Non-Functional Criteria:</b></div>
<div>
<ul>
<li>MFA validation must complete within 2 seconds</li>
<li>System must maintain 99.9% availability during MFA implementation</li>
</ul>
</div>
<div><b>Compliance Criteria:</b></div>
<div>
<ul>
<li>Meets ISO 27001 multi-factor authentication requirements</li>
</ul>
</div>
```

### Custom.TestCriteria
**Field:** `Custom.TestCriteria`
*Specific test scenarios to validate the requirement*
**Format:** HTML formatted text

**Template:**
```html
<div><b>Test Scenarios:</b></div>
<div>
<ol>
<li>Test scenario 1 with expected outcome</li>
<li>Test scenario 2 with expected outcome</li>
<li>Test scenario 3 with expected outcome</li>
</ol>
</div>
```

## Dependencies and Traceability

### Custom.Dependencies
**Field:** `Custom.Dependencies`
*Other requirements or components this requirement depends on*
**Format:** HTML formatted text

**Template:**
```html
<div><b>Upstream Dependencies:</b></div>
<div>
<ul>
<li>Dependency 1 - [Description]</li>
<li>Dependency 2 - [Description]</li>
</ul>
</div>
<div><b>Downstream Impact:</b></div>
<div>
<ul>
<li>Impact 1 - [Description]</li>
<li>Impact 2 - [Description]</li>
</ul>
</div>
```

## Categorization

### System.Parent
**Field:** `System.Parent`
*ID of the parent epic or feature that this requirement belongs to*
**Format:** Integer (Epic or Feature ID)
**Example:** `622310`

### System.Tags
**Field:** `System.Tags`
*Relevant tags for categorization and searchability*
**Format:** Semicolon-separated string
**Example:** `"Security;Authentication;API;Compliance"`

### System.AreaPath
**Field:** `System.AreaPath`
*Organizational area/team path*
**Format:** Always "IT\\BTE Tribe\\Integration and DevOps Tooling"

### System.IterationPath
**Field:** `System.IterationPath`
*Sprint/iteration path for planning*
**Format:** Match with the parent epic or feature's iteration
**Example:** `IT\\Sprint\\FY26\\Q1`

---

## Agent Guidelines for Requirement Suggestions

When suggesting new requirements, ensure all mapped fields are populated:

### 1. Core Information (Required)
```json
{
  "System.Title": "[Category] | [Brief Description]",
  "Microsoft.VSTS.Common.Priority": 2,
  "Microsoft.VSTS.Common.ValueArea": "Business",
  "Custom.RequirementType": "Functional"
}
```

### 2. Ownership (Required)
```json
{
  "System.AssignedTo": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.BusinessOwner": {"displayName": "Name", "uniqueName": "email@domain.com"},
  "Custom.TechnicalOwner": {"displayName": "Name", "uniqueName": "email@domain.com"}
}
```

### 3. Content Fields (Required)
```json
{
  "System.Description": "<div>HTML formatted description</div>",
  "Microsoft.VSTS.Common.AcceptanceCriteria": "<div><ul><li>Criteria 1</li></ul></div>",
  "Custom.TestCriteria": "<div><ol><li>Test 1</li></ol></div>",
  "Custom.Dependencies": "<div><ul><li>Dependency 1</li></ul></div>"
}
```

### 4. Categorization Fields
```json
{
  "System.Parent": 622310,
  "System.Tags": "Tag1;Tag2;Tag3",
  "System.AreaPath": "IT\\BTE Tribe\\Integration and DevOps Tooling",
  "System.IterationPath": "IT\\Sprint\\FY26\\Q1"
}
```

### Field Validation Rules
- **User Objects**: Must include displayName and uniqueName at minimum
- **HTML Fields**: Use proper HTML tags with div/ul/li/ol structure
- **Tags**: Semicolon-separated, no spaces around semicolons
- **Paths**: Use double backslash (\\) as separator
- **Priority**: Integer values 1-4
- **Requirement Type**: Must be one of the defined values

### Common Requirement Categories
- **Functional Requirements**: Business processes, data handling, user interactions
- **Performance Requirements**: Response times, throughput, scalability
- **Security Requirements**: Authentication, authorization, encryption, compliance
- **Integration Requirements**: API specifications, data exchange, system connectivity
- **Compliance Requirements**: Regulatory standards, organizational policies
- **Usability Requirements**: User experience, accessibility, interface design
- **Reliability Requirements**: Availability, fault tolerance, disaster recovery
- **Maintainability Requirements**: Code quality, documentation, monitoring

### Quality Assurance Elements
- **Clear Traceability**: Linked to parent epic or feature
- **Testable Criteria**: Specific acceptance and test criteria
- **Stakeholder Ownership**: Clear business and technical ownership
- **Dependency Management**: Documented dependencies and impacts
