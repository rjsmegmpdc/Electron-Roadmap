# Azure DevOps Initiative JSON Field Instructions

## Scope
applyTo: "initiative"

## Overview
This document provides comprehensive instructions for formatting and filling all fields in an Azure DevOps Initiative JSON work item. Use this as a reference when creating or updating initiative work items.


### Area and Iteration Paths
- **System.AreaPath**: use default 
- **System.AreaLevel1**: Always "IT"
- **System.AreaLevel2**: Tribe name (e.g., "BTE Tribe")
- **System.IterationPath**: as per the current fiscal year
- **System.IterationLevel1**: Always "IT"
- **System.IterationLevel2**: Always "Sprint"
- **System.IterationLevel3**: Fiscal year (e.g., "FY26")


Apply this structure to:
- **System.AssignedTo**: Primary assignee
- **Custom.TechnicalOwner**: Technical lead
- **Custom.BusinessOwner**: Business lead

### Date Fields
Use ISO 8601 format: "YYYY-MM-DDTHH:MM:SS.sssZ"
- **System.CreatedDate**: When work item was created
- **Microsoft.VSTS.Common.StateChangeDate**: When state last changed
- **Microsoft.VSTS.Scheduling.StartDate**: Project start date
- **Microsoft.VSTS.Scheduling.TargetDate**: Target completion date
- **Custom.PlannedStartDate**: Planned start date
- **Custom.PlannedDeliveryDate**: Planned delivery date

## Required Content Fields

### System.Title
- **Format**: Clear, descriptive title
- **Example**: "IT DevSecOps Tools Maintain, Manage & Operate"
- **Guidelines**: Use action verbs, be specific about scope

### System.Description
- **Format**: HTML div with detailed description
- **Structure**:
```html
<div><span style="color:rgb(66, 66, 66);font-size:16px;background-color:rgb(250, 250, 250);display:inline !important;">[DESCRIPTION]</span></div>
```
- **Content**: 2-3 sentences explaining purpose, scope, and goals
- **Length**: 100-300 words

### Custom.Budget
- **Format**: "$[AMOUNT]K" or "$[AMOUNT]M"
- **Examples**: "$1250K", "$2.5M"
- **Guidelines**: Use K for thousands, M for millions

### Custom.InitiativeSize
- **Options**: "S", "M", "L", "XL"
- **Guidelines**:
  - S: < 3 months, < $100K
  - M: 3-6 months, $100K-$500K
  - L: 6-12 months, $500K-$2M
  - XL: > 12 months, > $2M

### Custom.Timeline
- **Format**: "[DURATION] ([START MONTH])"
- **Example**: "12 months (start APR)"
- **Guidelines**: Use 3-letter month abbreviations

### Custom.StrategicPillar
- **Options**: "P1", "P2", "P3", "P4"
- **Guidelines**: Align with organizational strategic pillars

## Custom Content Fields (HTML Format)

### Custom.Assumptions
Structure as numbered list:
```html
<div><ol style="margin:0px 0px 8px;max-width:none;box-sizing:border-box;color:rgb(66, 66, 66);font-size:16px;background-color:rgb(250, 250, 250);">
  <li style=""><strong style="font-weight:590;">Assumption Title:</strong> Description</li>
</ol></div>
```

### Custom.Expected_Benefits
Use same HTML structure as assumptions with benefit categories:
Examples : 
- Improved Security
- Higher Code Quality
- Efficient Processes
- Better Collaboration
- Compliance and Auditing

### Custom.AdditionalNotes
Include tools/scope information:
```html
<div>Tools In Scope:</div>
<div><ol>
  <li>Tool 1</li>
  <li>Tool 2</li>
</ol></div>
```

## System Tags


## Auto-Generated Fields (Do Not Manually Set)
- System.AreaId
- System.IterationId
- System.PersonId
- System.Watermark
- System.CommentCount
- WEF_* fields (extension markers)

## Validation Rules

### Required Fields Checklist
- [ ] System.Title (not empty)
- [ ] System.AssignedTo (valid user)
- [ ] System.State (valid state)
- [ ] Custom.Budget (proper format)
- [ ] Custom.InitiativeSize (S/M/L/XL)
- [ ] Custom.BusinessOwner (valid user)
- [ ] Custom.TechnicalOwner (valid user)

### Data Quality Checks
- [ ] All dates in ISO 8601 format
- [ ] All user objects have required fields
- [ ] HTML content properly formatted
- [ ] Budget format matches pattern
- [ ] Tags properly semicolon-separated
- [ ] Relations have correct structure

## Common Mistakes to Avoid
1. **Missing @ in email addresses** - Use "firstname.lastname@one.nz"
2. **Incorrect date formats** - Always use ISO 8601
3. **Invalid HTML in description fields** - Validate HTML structure
4. **Wrong relation types** - Use exact relation type strings
5. **Missing user object fields** - Include all required user properties
6. **Inconsistent timeline formats** - Follow "[DURATION] (start [MONTH])" pattern

## Template Usage
When creating new initiatives:
1. Copy the JSON structure
2. Update all user references with actual users
3. Fill required content fields
4. Set appropriate dates
5. Validate all HTML content
6. Verify relations point to existing work items
7. Test JSON validity before submission