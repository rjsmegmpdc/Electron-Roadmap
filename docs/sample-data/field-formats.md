# Field Formats & Specifications

This document provides detailed specifications for all project fields, including formats, validation rules, and examples.

## 📋 Required Fields

### 1. Title
**Field:** `title`  
**Type:** String  
**Required:** Yes  
**Validation:** Non-empty string  

```json
{
  "title": "Microsoft Teams Rollout"
}
```

**Valid Examples:**
```json
"Digital Workplace Strategy"
"SharePoint Migration Project"
"EUC Security Compliance Implementation"
"Project with Special Characters: @#$%^&*()"
```

**Invalid Examples:**
```json
""           // Empty string
null         // Null value
123          // Number instead of string
```

---

### 2. Start Date
**Field:** `start_date`  
**Type:** String  
**Required:** Yes  
**Format:** DD-MM-YYYY (New Zealand format)  
**Validation:** Must be valid calendar date  

```json
{
  "start_date": "15-01-2025"
}
```

**Valid Examples:**
```json
"01-01-2025"    // Standard date
"29-02-2024"    // Leap year February 29th
"31-12-2025"    // Year end
"15-06-2025"    // Mid-year date
```

**Invalid Examples:**
```json
"2025-01-01"    // ISO format (YYYY-MM-DD)
"01/01/2025"    // US format with slashes
"1-1-2025"      // Single digits without leading zeros
"32-01-2025"    // Invalid day (32nd)
"01-13-2025"    // Invalid month (13th)
"29-02-2025"    // Invalid leap year
""              // Empty string
null            // Null value
```

---

### 3. End Date
**Field:** `end_date`  
**Type:** String  
**Required:** Yes  
**Format:** DD-MM-YYYY (New Zealand format)  
**Validation:** Must be valid calendar date AND after start_date  

```json
{
  "end_date": "30-06-2025"
}
```

**Business Rule:** end_date must be chronologically after start_date

**Valid Example Pairs:**
```json
{
  "start_date": "01-01-2025",
  "end_date": "30-06-2025"     // 6 months later ✓
}
{
  "start_date": "15-03-2025",
  "end_date": "16-03-2025"     // Next day ✓
}
```

**Invalid Example Pairs:**
```json
{
  "start_date": "01-06-2025",
  "end_date": "01-01-2025"     // End before start ✗
}
{
  "start_date": "15-03-2025",
  "end_date": "15-03-2025"     // Same date ✗
}
```

---

### 4. Budget (in cents)
**Field:** `budget_cents`  
**Type:** Integer  
**Required:** Yes  
**Validation:** Must be >= 0  
**Unit:** Cents (divide by 100 for dollars)  

```json
{
  "budget_cents": 2500000
}
```

**Budget Scale Examples:**
```json
0           // $0.00 - Valid for concept-design phase
500000      // $5,000.00 - Small project
2500000     // $25,000.00 - Medium project
10000000    // $100,000.00 - Large project
999999999999 // $9,999,999,999.99 - Maximum supported
```

**Invalid Examples:**
```json
-1000       // Negative budget ✗
"25000"     // String instead of number ✗
25000.50    // Float instead of integer ✗
null        // Null value ✗
```

---

### 5. Financial Treatment
**Field:** `financial_treatment`  
**Type:** String (Enum)  
**Required:** Yes  
**Valid Values:** `["CAPEX", "OPEX", "MIXED"]`  

```json
{
  "financial_treatment": "CAPEX"
}
```

**Value Descriptions:**
- **CAPEX**: Capital Expenditure - Asset investments
- **OPEX**: Operational Expenditure - Operating costs  
- **MIXED**: Combined CAPEX and OPEX components

**Valid Examples:**
```json
"CAPEX"     // Infrastructure, equipment, software licenses
"OPEX"      // Consulting, training, ongoing services
"MIXED"     // Projects with both asset and operational components
```

**Invalid Examples:**
```json
"capex"     // Lowercase ✗
"Capital"   // Non-standard value ✗
"OpEx"      // Mixed case ✗
null        // Null value ✗
```

---

## 🔄 Optional Fields

### 6. Project ID
**Field:** `id`  
**Type:** String  
**Required:** No (auto-generated if not provided)  
**Format:** Custom or auto-generated `proj-{timestamp}-{random}`  

```json
{
  "id": "proj-concept-001"
}
```

**Auto-generated Example:**
```json
{
  "id": "proj-1704067200000-123"
}
```

**Custom ID Examples:**
```json
"proj-concept-001"      // Sequential numbering
"teams-rollout-2025"    // Descriptive naming
"COMP-GDPR-001"         // Department prefixed
```

---

### 7. Description
**Field:** `description`  
**Type:** String  
**Required:** No  
**Validation:** Must be string if provided  

```json
{
  "description": "Enterprise-wide Microsoft Teams deployment with user training and migration support"
}
```

---

### 8. Lane
**Field:** `lane`  
**Type:** String (Enum)  
**Required:** No  
**Valid Values:** `["office365", "euc", "compliance", "other"]`  

```json
{
  "lane": "office365"
}
```

**Lane Descriptions:**
- **office365**: Microsoft Office 365 and cloud productivity projects
- **euc**: End User Computing - devices, desktops, user experience
- **compliance**: Governance, risk, compliance, and security projects  
- **other**: General IT infrastructure and miscellaneous projects

---

### 9. Status
**Field:** `status`  
**Type:** String (Enum)  
**Required:** No (defaults to "concept-design")  
**Valid Values:** `["concept-design", "solution-design", "engineering", "uat", "release"]`  

```json
{
  "status": "concept-design"
}
```

**Status Lifecycle:**
1. **concept-design**: Initial project conception and planning
2. **solution-design**: Detailed solution architecture and design
3. **engineering**: Active development and implementation
4. **uat**: User acceptance testing and validation
5. **release**: Production deployment and go-live

---

### 10. Project Manager Name
**Field:** `pm_name`  
**Type:** String  
**Required:** No  
**Validation:** Must be string if provided  

```json
{
  "pm_name": "Sarah Johnson"
}
```

**Examples:**
```json
"Sarah Johnson"         // Standard name
"John O'Connor-Smith"   // Names with apostrophes and hyphens
"Dr. Maria Rodriguez"   // Names with titles
```

---

### 11. Tasks Array
**Field:** `tasks`  
**Type:** Array of Objects  
**Required:** No (defaults to empty array `[]`)  
**Required for:** Engineering status and beyond  

```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "Site Assessment",
      "description": "Assess current SharePoint sites",
      "status": "in-progress",
      "assigned_to": "John Doe",
      "due_date": "15-03-2025",
      "effort_hours": 40
    }
  ]
}
```

**Task Status Values:** `["planned", "in-progress", "completed", "blocked", "cancelled"]`

---

### 12. Resources Array
**Field:** `resources`  
**Type:** Array of Objects  
**Required:** No (defaults to empty array `[]`)  

```json
{
  "resources": [
    {
      "id": "res-001",
      "name": "Solution Architect",
      "type": "internal",
      "allocation": 0.5
    },
    {
      "id": "res-002",
      "name": "SharePoint Developer",
      "type": "contractor",
      "allocation": 1.0,
      "rate_per_hour": 12000
    }
  ]
}
```

**Resource Type Values:** `["internal", "contractor", "vendor"]`  
**Allocation:** Decimal between 0.0 and 1.0 (percentage of full-time)  
**Rate per Hour:** In cents (for contractors/vendors)

---

### 13. Forecasts Array
**Field:** `forecasts`  
**Type:** Array of Objects  
**Required:** No (defaults to empty array `[]`)  
**Required for:** UAT status and beyond  

```json
{
  "forecasts": [
    {
      "id": "forecast-001",
      "month": "2025-05",
      "capex_cents": 300000,
      "opex_cents": 200000,
      "resource_hours": 120,
      "confidence_level": "medium"
    }
  ]
}
```

**Month Format:** YYYY-MM  
**Confidence Levels:** `["low", "medium", "high"]`  
**Financial Values:** In cents

---

## 🎯 Data Type Summary

| Field | Type | Required | Format/Values |
|-------|------|----------|---------------|
| `id` | String | No* | Custom or auto-generated |
| `title` | String | Yes | Non-empty text |
| `description` | String | No | Any text |
| `lane` | String | No | office365, euc, compliance, other |
| `start_date` | String | Yes | DD-MM-YYYY |
| `end_date` | String | Yes | DD-MM-YYYY (after start_date) |
| `status` | String | No** | concept-design, solution-design, engineering, uat, release |
| `pm_name` | String | No | Any text |
| `budget_cents` | Integer | Yes | >= 0 |
| `financial_treatment` | String | Yes | CAPEX, OPEX, MIXED |
| `tasks` | Array | No*** | Array of task objects |
| `resources` | Array | No | Array of resource objects |
| `forecasts` | Array | No**** | Array of forecast objects |

**Notes:**
- *Auto-generated if not provided
- **Defaults to 'concept-design'
- ***Required for 'engineering' status gate
- ****Required for 'uat' status gate