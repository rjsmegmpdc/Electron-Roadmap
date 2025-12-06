# Epic & Feature Configuration CSV Import Guide

## Overview
This guide explains how to populate the CSV template for importing Epic & Feature Configuration data into the Roadmap application.

## CSV Template Location
`epic-feature-config-template.csv`

## File Structure

The CSV file uses a row-based format where each row represents a different configuration type. The `ConfigType` column determines which fields are used in each row.

### Column Definitions

| Column Name | Description | Used By |
|------------|-------------|---------|
| **ConfigType** | Type of configuration (Common, Epic, Feature, Iteration, AreaPath) | All rows |
| **Priority** | Default priority level (1-4) | Common |
| **ValueArea** | Business or Architectural | Common |
| **AreaPath** | Azure DevOps area path | Common |
| **IterationPath** | Azure DevOps iteration path | Common |
| **EpicSizing** | Epic size estimate (XS, S, M, L, XL) | Epic |
| **Risk** | Risk level (Low, Medium, High, Critical) | Epic |
| **EpicOwner** | Email of Epic owner | Epic |
| **ProductOwner** | Email of Product owner | Feature |
| **DeliveryLead** | Email of Delivery lead | Epic, Feature |
| **TechLead** | Email of Tech lead | Epic, Feature |
| **BusinessOwner** | Email of Business owner | Epic, Feature |
| **ProcessOwner** | Email of Process owner | Epic, Feature |
| **PlatformOwner** | Email of Platform owner | Epic, Feature |
| **Tags** | Semicolon-separated tags | Epic, Feature |
| **PathValue** | Iteration or area path value | Iteration, AreaPath |

## Configuration Types

### 1. Common (Row Type: `Common`)
Defines default values that apply to both Epics and Features.

**Required Fields:**
- `ConfigType`: Must be "Common"
- `Priority`: 1-4 (1=Critical, 2=High, 3=Medium, 4=Low)
- `ValueArea`: "Business" or "Architectural"
- `AreaPath`: Azure DevOps area path (e.g., "IT\BTE Tribe")
- `IterationPath`: Azure DevOps iteration path (e.g., "IT\Sprint\FY26\Q1")

**Example:**
```csv
Common,2,Business,IT\BTE Tribe,IT\Sprint\FY26\Q1,,,,,,,,,,
```

### 2. Epic (Row Type: `Epic`)
Defines default values specific to Epic work items.

**Required Fields:**
- `ConfigType`: Must be "Epic"
- `EpicSizing`: XS, S, M, L, or XL
  - XS: 1-2 weeks
  - S: 3-4 weeks
  - M: 5-8 weeks
  - L: 9-12 weeks
  - XL: 13+ weeks
- `Risk`: Low, Medium, High, or Critical

**Optional Fields:**
- `EpicOwner`: Email address (e.g., "name@one.nz")
- `DeliveryLead`: Email address
- `TechLead`: Email address
- `BusinessOwner`: Email address
- `ProcessOwner`: Email address
- `PlatformOwner`: Email address
- `Tags`: Semicolon-separated list (e.g., "integration;devops;platform")

**Example:**
```csv
Epic,,,,,M,Medium,Yash.Yash@one.nz,,Farhan.Sarfraz@one.nz,Ashish.Shivhare@one.nz,Adrian.Albuquerque@one.nz,,,integration;devops;platform,
```

### 3. Feature (Row Type: `Feature`)
Defines default values specific to Feature work items.

**Required Fields:**
- `ConfigType`: Must be "Feature"

**Optional Fields:**
- `ProductOwner`: Email address
- `DeliveryLead`: Email address
- `TechLead`: Email address
- `BusinessOwner`: Email address
- `ProcessOwner`: Email address
- `PlatformOwner`: Email address
- `Tags`: Semicolon-separated list (e.g., "feature;user-story;frontend")

**Example:**
```csv
Feature,,,,,,,,Sanjeev.Lokavarapu@one.nz,Farhan.Sarfraz@one.nz,Ashish.Shivhare@one.nz,,,,feature;user-story;frontend,
```

### 4. Iteration (Row Type: `Iteration`)
Defines available iteration paths for quick selection.

**Required Fields:**
- `ConfigType`: Must be "Iteration"
- `PathValue`: Full iteration path (e.g., "IT\Sprint\FY26\Q1\Sprint 1")

**Example:**
```csv
Iteration,,,,,,,,,,,,,,,IT\Sprint\FY26\Q1\Sprint 1
Iteration,,,,,,,,,,,,,,,IT\Sprint\FY26\Q1\Sprint 2
Iteration,,,,,,,,,,,,,,,IT\Sprint\FY26\Q1\Sprint 3
```

### 5. AreaPath (Row Type: `AreaPath`)
Defines available area paths for quick selection.

**Required Fields:**
- `ConfigType`: Must be "AreaPath"
- `PathValue`: Full area path (e.g., "IT\BTE Tribe\Platform Engineering")

**Example:**
```csv
AreaPath,,,,,,,,,,,,,,,IT\BTE Tribe
AreaPath,,,,,,,,,,,,,,,IT\BTE Tribe\Integration and DevOps Tooling
AreaPath,,,,,,,,,,,,,,,IT\BTE Tribe\Platform Engineering
```

## Valid Values Reference

### Priority Options
- `1` - Critical (Drop everything)
- `2` - High Priority (Plan immediately)
- `3` - Medium Priority (Plan for next iteration)
- `4` - Low Priority (Backlog)

### Value Area Options
- `Business`
- `Architectural`

### Epic Sizing Options
- `XS` - 1-2 weeks
- `S` - 3-4 weeks
- `M` - 5-8 weeks
- `L` - 9-12 weeks
- `XL` - 13+ weeks

### Risk Options
- `Low`
- `Medium`
- `High`
- `Critical`

### Team Member Emails (Example)
These are examples from the system. Replace with your actual team members:
- Yash.Yash@one.nz
- Farhan.Sarfraz@one.nz
- Ashish.Shivhare@one.nz
- Adrian.Albuquerque@one.nz
- Sanjeev.Lokavarapu@one.nz

## CSV Rules

1. **Header Row**: The first row must contain column headers exactly as shown in the template
2. **ConfigType**: First column must always specify the configuration type
3. **Empty Fields**: Leave fields blank (empty) if they don't apply to that ConfigType
4. **Backslashes**: Use single backslash `\` for path separators (e.g., `IT\BTE Tribe`)
5. **Tags**: Separate multiple tags with semicolons (`;`)
6. **No Quotes**: Generally not needed unless values contain commas
7. **One Common Row**: Include exactly one "Common" configuration row
8. **One Epic Row**: Include exactly one "Epic" configuration row
9. **One Feature Row**: Include exactly one "Feature" configuration row
10. **Multiple Paths**: Include as many Iteration and AreaPath rows as needed

## Example Complete CSV

```csv
ConfigType,Priority,ValueArea,AreaPath,IterationPath,EpicSizing,Risk,EpicOwner,ProductOwner,DeliveryLead,TechLead,BusinessOwner,ProcessOwner,PlatformOwner,Tags,PathValue
Common,2,Business,IT\BTE Tribe,IT\Sprint\FY26\Q1,,,,,,,,,,
Epic,,,,,M,Medium,Yash.Yash@one.nz,,Farhan.Sarfraz@one.nz,Ashish.Shivhare@one.nz,Adrian.Albuquerque@one.nz,,,integration;devops;platform,
Feature,,,,,,,,Sanjeev.Lokavarapu@one.nz,Farhan.Sarfraz@one.nz,Ashish.Shivhare@one.nz,,,,feature;user-story;frontend,
Iteration,,,,,,,,,,,,,,,IT\Sprint\FY26\Q1\Sprint 1
Iteration,,,,,,,,,,,,,,,IT\Sprint\FY26\Q1\Sprint 2
Iteration,,,,,,,,,,,,,,,IT\Sprint\FY26\Q1\Sprint 3
AreaPath,,,,,,,,,,,,,,,IT\BTE Tribe
AreaPath,,,,,,,,,,,,,,,IT\BTE Tribe\Integration and DevOps Tooling
AreaPath,,,,,,,,,,,,,,,IT\BTE Tribe\Platform Engineering
```

## How to Use

1. Download the `epic-feature-config-template.csv` file
2. Open it in Excel, Google Sheets, or any CSV editor
3. Modify the values according to your project needs
4. Keep the structure intact (ConfigType column and header row)
5. Save the file as CSV format
6. Import the file using the application's import feature

## Troubleshooting

**Issue**: Import fails with "Invalid ConfigType"
- **Solution**: Ensure ConfigType values are exactly: Common, Epic, Feature, Iteration, or AreaPath (case-sensitive)

**Issue**: Priority values not working
- **Solution**: Use numeric values 1-4, not text like "High" or "Low"

**Issue**: Paths not appearing correctly
- **Solution**: Ensure you're using single backslash `\` not double backslash `\\` in the CSV

**Issue**: Tags not importing
- **Solution**: Use semicolons (`;`) to separate tags, not commas or other delimiters

## Notes

- The template includes sample data based on the application's defaults
- All email addresses should be valid Azure DevOps user emails
- Area paths and iteration paths must match your Azure DevOps project structure
- Empty fields will use system defaults where applicable
