# CSV Import Templates Guide

This guide describes all available CSV templates for importing data into the Roadmap application.

## Accessing Templates

**Via UI:**
1. Navigate to **Export & Import** module
2. Click the **📋 CSV Templates** tab
3. Click **📂 Open Template** on any template
4. The file will open in your default CSV editor (Excel, Numbers, etc.)

**Via File System:**
All templates are located in the project root directory:
```
C:\Users\smhar\Roadmap-Electron\
```

---

## Available Templates

### 1. Epic & Feature Configuration Template

**File:** `epic-feature-config-template.csv`

**Purpose:** Configure default values for creating Epics and Features in Azure DevOps

**Structure:**
- **Title rows (1-2):** Metadata (preserved but not imported)
- **Header row (3):** Column names
- **Data rows (4+):** Configuration entries

**Configuration Types:**
- **Common:** Shared configuration (priority values, value areas, etc.)
- **Epic:** Epic-specific defaults
- **Feature:** Feature-specific defaults
- **Iteration:** Iteration paths with values
- **AreaPath:** Custom area paths

**Example:**
```csv
Epic & Feature Configuration Template
ConfigType,Priority,ValueArea,AreaPath,IterationPath,EpicSizing,Risk,EpicOwner,ProductOwner,...
Common,1,Business,\\Project\\Area1,\\Project\\Iteration1,,,,,,...
Epic,1,,,,S,Medium,John Doe,Jane Smith,...
Feature,2,,,,,,,,,...
Iteration,,,,,,,,,,...Path1
AreaPath,,,\\Custom\\Area,,,,,,,...\\Custom\\Area
```

**Import Location:** Export & Import → Import Data → Select "Epic & Feature Configuration"

---

### 2. Labour Rates Template

**File:** `labour-rates-template.csv`

**Purpose:** Import hourly and daily labour rates for different resource bands and activity types

**Structure:**
- **Title rows (1-2):** "Labour Rates - FY26" and "Import Template"
- **Header row (3):** `Band,,Activity Type,Hourly Rate,Daily Rate,$ Uplift,% Uplift`
- **Data rows (4+):** Rate definitions

**Required Fields:**
- **Band:** N1-N6, External, or custom bands
- **Activity Type:** CAP, OPX, or custom
- **Hourly Rate:** Numeric (can use $ and commas)
- **Daily Rate:** Numeric (should be ~8x hourly rate)

**Optional Fields:**
- **Column 2 (unnamed):** Local band description
- **$ Uplift:** Dollar amount uplift
- **% Uplift:** Percentage uplift

**Validation:**
- Hourly Rate ≥ 0
- Daily Rate ≥ 0
- Daily Rate should be within 10% of 8x Hourly Rate (warning only)

**Example:**
```csv
Labour Rates - FY26
Import Template
Band,,Activity Type,Hourly Rate,Daily Rate,$ Uplift,% Uplift
N1,Junior Developer,CAP,$75.00,$600.00,,
N2,Intermediate Developer,CAP,$100.00,$800.00,,
External,External Consultant,CAP,$250.00,$2000.00,$50.00,25%
```

**Import Location:** Project Coordinator Dashboard → Import Manager → Labour Rates

**Date Required:** Fiscal Year (e.g., FY26)

---

### 3. Resources Template

**File:** `resources-template.csv`

**Purpose:** Import resource master data for project allocation and capacity planning

**Required Fields:**
- **ResourceName:** Full name (required)
- **Contract Type:** FTE, SOW, or External Squad (required)

**Optional Fields:**
- **Roadmap_ResourceID:** Internal resource ID
- **Email:** Contact email
- **WorkArea:** Team or work area
- **ActivityType_CAP:** N1_CAP through N6_CAP format
- **ActivityType_OPX:** N1_OPX through N6_OPX format
- **EmployeeID:** Unique employee identifier

**Validation:**
- Contract Type must be exactly: FTE, SOW, or External Squad
- Activity Types must match: N[1-6]_(CAP|OPX) format
- Use "Nil" or leave blank for N/A activity types

**Example:**
```csv
Roadmap_ResourceID,ResourceName,Email,WorkArea,ActivityType_CAP,ActivityType_OPX,Contract Type,EmployeeID
1,John Smith,john.smith@example.com,Engineering,N3_CAP,N3_OPX,FTE,EMP001
2,Jane Doe,jane.doe@example.com,Product,N4_CAP,N4_OPX,FTE,EMP002
3,Bob Johnson,bob.johnson@example.com,Design,N2_CAP,N2_OPX,SOW,SOW001
```

**Import Location:** Project Coordinator Dashboard → Import Manager → Resources

**Conflict Resolution:** Upserts on employee_id - existing records are updated

---

## Import Workflows

### Epic & Feature Configuration
1. Open template
2. Modify values to match your organization
3. Keep ConfigType column intact
4. Save file
5. Go to Export & Import → Import → Select "Epic & Feature Configuration"
6. Choose your modified CSV file

### Project Coordinator Imports

#### Labour Rates
1. Open template
2. Update rates for your fiscal year
3. Keep title rows and header intact
4. Save file
5. Go to Project Coordinator Dashboard → Import Manager
6. Select "Labour Rates" from dropdown
7. Enter fiscal year (e.g., FY26)
8. Choose your CSV file
9. Click Import

#### Resources
1. Open template
2. Add/modify resource entries
3. Ensure Contract Type and Activity Type formats are correct
4. Save file
5. Go to Project Coordinator Dashboard → Import Manager
6. Select "Resources" from dropdown
7. Choose your CSV file
8. Click Import

---

## Common Format Rules

### Dates
- **Format:** DD-MM-YYYY (e.g., 25-12-2024)
- **Example:** 01-01-2024 for January 1st, 2024

### Currency
- **Accepted formats:**
  - `$150.00`
  - `150.00`
  - `150`
  - `$1,200.00`
  - `1200`
- **Decimal places:** Maximum 2
- **Note:** $ symbol and commas are stripped during parsing

### Text Fields
- **Encoding:** UTF-8
- **Quotes:** Use quotes for fields containing commas
- **Line breaks:** Avoid line breaks within fields

---

## Troubleshooting

### "Invalid hourly/daily rate" Errors
- Ensure rate cells contain only numbers (optionally with $ and commas)
- Remove text like "TBD", "N/A", "-"
- Check for trailing spaces
- Ensure decimal separator is `.` not `,`

### "Invalid Contract Type" Errors
- Must be exactly: `FTE`, `SOW`, or `External Squad`
- Check for extra spaces or typos
- Case-sensitive match required

### "Invalid Activity Type" Errors
- Must match format: `N1_CAP`, `N2_OPX`, etc. (N1 through N6)
- Use `Nil` or leave blank if not applicable
- Do not use hyphens: ~~N1-CAP~~ → N1_CAP

### Import Shows 0 Records
- Verify CSV has header row
- Check if title rows are present (required for some templates)
- Ensure file encoding is UTF-8
- Check for hidden characters or BOM markers

---

## Best Practices

1. **Always keep a backup** of original templates
2. **Test with small datasets** first (5-10 rows)
3. **Validate in Excel/Numbers** before importing
4. **Use template display names** as shown in UI
5. **Check import results** after each import
6. **Fix errors immediately** - don't continue with broken data

---

## Template Maintenance

Templates are automatically discovered by the application. To add new templates:

1. Create CSV file with format: `{name}-template.csv`
2. Place in project root directory
3. The template will automatically appear in the Templates tab

**Example:** `timesheets-template.csv` becomes "Timesheets" in the UI

---

## Related Documentation

- **Export/Import Guide:** See Export & Import module documentation
- **Project Coordinator Guide:** See Project Coordinator documentation
- **ADO Integration:** See Epic & Feature Configuration guide

---

**Last Updated:** Current Session  
**Application Version:** Roadmap Electron v1.0
