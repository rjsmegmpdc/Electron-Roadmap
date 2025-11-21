# User Story Suggestion Template

## Scope
applyTo: "userStory"

## Basic Information

### System.Title
**Field:** `System.Title`
**Format:** `[Brief Description of User Story]`
**Example:** `Create SOAP Service Migration Pattern`

### Microsoft.VSTS.Common.Priority
**Field:** `Microsoft.VSTS.Common.Priority`
- **1** - Critical/Urgent
- **2** - High Priority
- **3** - Medium Priority (as in example)
- **4** - Low Priority

### Microsoft.VSTS.Common.ValueArea
**Field:** `Microsoft.VSTS.Common.ValueArea`
- **Business** - Direct business value (as in example)
- **Architectural** - Technical/infrastructure improvements

### Microsoft.VSTS.Scheduling.StoryPoints
**Field:** `Microsoft.VSTS.Scheduling.StoryPoints`
*Estimate of effort using Fibonacci sequence (e.g., 1, 2, 3, 5, 8, 13, 21)*
**Example:** `0` (to be estimated during planning)

## Ownership & Accountability

### System.AssignedTo
**Field:** `System.AssignedTo`
*Default assignee for the user story*
**Format:** User object with displayName, uniqueName, email
**Example:** Vamshi Arelli (Vamshi.Arelli@one.nz)

## User Story Definition

### System.Description
**Field:** `System.Description`
*User story format: "As a [type of user], I want [an action] so that [a benefit/value]"*
**Format:** HTML formatted text with clear structure

**Template:**
```html
<div><b>As a</b> [type of user], </div>
<div><b>I want</b> to [action/capability], </div>
<div><b>so that</b> [benefit/value]. </div>
```

**Example:**
```html
<div><b>As a</b> migration engineer, </div>
<div><b>I want</b> to have a standardized SOAP service migration pattern, </div>
<div><b>so that</b> I can consistently migrate SOAP services to APIC V10 Datapower with clear guidance on WSDL transformation, endpoint mapping, security pattern migration, and DataPower-specific configurations. </div>
```

### Microsoft.VSTS.Common.AcceptanceCriteria
**Field:** `Microsoft.VSTS.Common.AcceptanceCriteria`
*Specific, testable criteria that must be met for the story to be considered complete*
**Format:** HTML formatted with Delivery and Review sections

**Template:**
```html
<div><b>Delivery</b>:<br>
<ul>
<li>[Specific deliverable 1 with clear success measure]</li>
<li>[Specific deliverable 2 with clear success measure]</li>
<li>[Specific deliverable 3 with clear success measure]</li>
</ul>
<div><b>Review</b></div>
</div>
<div>
<ul>
<li>Peer Reviewed</li>
<li>Accepted by Product Owner & Sign Off</li>
<li>Scrum Master Informed</li>
</ul>
</div>
```

**Example:**
```html
<div><b>Delivery</b>:<br>
<ul>
<li>SOAP service migration pattern documented with step-by-step process</li>
<li>WSDL transformation guidelines created</li>
<li>Endpoint mapping strategies defined</li>
<li>Security pattern migration approach documented</li>
<li>DataPower-specific configuration templates created</li>
<li>Pattern validated with at least 2 representative SOAP services</li>
</ul>
<div><b>Review</b></div>
</div>
<div>
<ul>
<li>Peer Reviewed</li>
<li>Accepted by Product Owner & Sign Off</li>
<li>Scrum Master Informed</li>
</ul>
</div>
```

## Categorization

### System.Parent
**Field:** `System.Parent`
*ID of the parent feature that this user story belongs to*
**Format:** Integer (Feature ID)
**Example:** `622311`

### System.Tags
**Field:** `System.Tags`
*Relevant tags for categorization and searchability*
**Format:** Semicolon-separated string
**Example:** `"Documentation; MigrationPattern; SOAP; XMLGateway"`

### System.AreaPath
**Field:** `System.AreaPath`
*Organizational area/team path*
**Format:** Always "IT\\BTE Tribe\\Integration and DevOps Tooling"

### System.IterationPath
**Field:** `System.IterationPath`
*Sprint/iteration path for planning*
**Format:** Match with the feature or epic's iteration path and if its same as parent Quarter of the current sprint and it is the last sprint of the quarter it must be next quarter.otherwise it must be the same quarter as the parent feature or epic.
**Example:** `IT\\Sprint\\FY26\\Q1`


---

## Agent Guidelines for User Story Suggestions

When suggesting new user stories, ensure all mapped fields are populated:

### 1. Core Information (Required)
```json
{
  "System.Title": "**Format:** `[Domain] | [Brief Description of User Story]",
  "Microsoft.VSTS.Common.Priority": 1,
  "Microsoft.VSTS.Common.ValueArea": "Business"
}
```
### 2. User Story Specifics 
Only feature can be broken down into user stories, not epics or initiatives.
User stories can be broken down into tasks.



### Field Validation Rules
- **User Objects**: Must include displayName and uniqueName at minimum
- **HTML Fields**: Use proper HTML tags with div/ul/li structure
- **Tags**: Semicolon-separated, no spaces around semicolons
- **Paths**: Use double backslash (\\) as separator
- **Priority**: Integer values 1-4
- **Story Points**: Integer or 0 for unestimated

### Common User Story Patterns Based on Migration Epic
- **Migration Pattern Development**: Creating standardized migration patterns for service types (SOAP, REST, XML transformation)
- **Template and Framework Creation**: Developing reusable templates and frameworks for consistent implementation
- **Security Configuration**: Establishing security patterns, authentication schemes, and encryption standards
- **Decision Support Tools**: Creating decision trees, selection guides, and pattern recommendation tools
- **Validation and Testing**: Pattern validation with representative services and test cases
- **Documentation and Training**: Comprehensive documentation, guidelines, and training materials
- **Automation Tools**: Scripts and tools for accelerated migration processes
- **CI/CD Pipeline Development**: Pipeline templates and deployment automation
- **Quality Assurance**: Testing frameworks and validation procedures
- **Governance and Standards**: Process documentation and quality control measures

**Quality Assurance Elements (Always Include):**
- **Delivery Section**: Specific deliverables with clear success measures
- **Review Section**: Must include peer review, Product Owner sign-off, and Scrum Master notification
- **Definition of Ready**: 4-point checklist for story readiness
- **Definition of Done**: 3-point checklist for completion criteria