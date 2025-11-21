# Project Examples

This document provides complete project examples across all lifecycle statuses, demonstrating the proper structure and field values for each stage of project development.

## 📋 Complete Project Examples

### 1. Concept Design Phase

**Minimal Requirements - No Budget Needed**

```json
{
  "id": "proj-concept-001",
  "title": "Digital Workplace Strategy",
  "description": "Comprehensive strategy for digital workplace transformation",
  "lane": "office365",
  "start_date": "15-01-2025",
  "end_date": "30-06-2025",
  "status": "concept-design",
  "pm_name": "Sarah Johnson",
  "budget_cents": 0,
  "financial_treatment": "CAPEX",
  "tasks": [],
  "resources": [],
  "forecasts": []
}
```

**Key Characteristics:**
- Budget can be zero (no financial commitment yet)
- Empty arrays for tasks, resources, forecasts
- Basic project information defined

---

### 2. Solution Design Phase

**Budget Required (> 0)**

```json
{
  "id": "proj-solution-001",
  "title": "Microsoft Teams Rollout",
  "description": "Enterprise-wide Microsoft Teams deployment",
  "lane": "office365",
  "start_date": "01-02-2025",
  "end_date": "31-08-2025",
  "status": "solution-design",
  "pm_name": "Michael Chen",
  "budget_cents": 2500000,
  "financial_treatment": "CAPEX",
  "tasks": [],
  "resources": [
    {
      "id": "res-001",
      "name": "Solution Architect",
      "type": "internal",
      "allocation": 0.5
    }
  ],
  "forecasts": []
}
```

**Key Characteristics:**
- Must have budget_cents > 0 ($25,000 in this example)
- May have resources assigned
- Solution architecture work in progress

---

### 3. Engineering Phase

**Tasks Required (length > 0)**

```json
{
  "id": "proj-engineering-001",
  "title": "SharePoint Migration",
  "description": "Migrate legacy SharePoint to SharePoint Online",
  "lane": "office365",
  "start_date": "01-03-2025",
  "end_date": "30-09-2025",
  "status": "engineering",
  "pm_name": "Emma Wilson",
  "budget_cents": 5000000,
  "financial_treatment": "OPEX",
  "tasks": [
    {
      "id": "task-001",
      "title": "Site Assessment",
      "description": "Assess current SharePoint sites",
      "status": "in-progress",
      "assigned_to": "John Doe",
      "due_date": "15-03-2025",
      "effort_hours": 40
    },
    {
      "id": "task-002",
      "title": "Migration Scripts",
      "description": "Develop automated migration scripts",
      "status": "planned",
      "assigned_to": "Jane Smith",
      "due_date": "01-04-2025",
      "effort_hours": 80
    }
  ],
  "resources": [
    {
      "id": "res-002",
      "name": "SharePoint Developer",
      "type": "contractor",
      "allocation": 1.0,
      "rate_per_hour": 12000
    }
  ],
  "forecasts": []
}
```

**Key Characteristics:**
- Must have at least one task defined
- Active development work happening
- Resources may include contractors with rates
- Budget typically larger ($50,000 in this example)

---

### 4. UAT (User Acceptance Testing) Phase

**Forecasts Required (length > 0)**

```json
{
  "id": "proj-uat-001",
  "title": "EUC Security Compliance",
  "description": "Implement end-user computing security compliance",
  "lane": "euc",
  "start_date": "01-04-2025",
  "end_date": "31-10-2025",
  "status": "uat",
  "pm_name": "David Brown",
  "budget_cents": 7500000,
  "financial_treatment": "MIXED",
  "tasks": [
    {
      "id": "task-003",
      "title": "Security Policy Review",
      "description": "Review and update security policies",
      "status": "completed",
      "assigned_to": "Alice Johnson",
      "due_date": "15-04-2025",
      "effort_hours": 60
    }
  ],
  "resources": [
    {
      "id": "res-003",
      "name": "Security Consultant",
      "type": "contractor",
      "allocation": 0.3,
      "rate_per_hour": 15000
    }
  ],
  "forecasts": [
    {
      "id": "forecast-001",
      "month": "2025-05",
      "capex_cents": 300000,
      "opex_cents": 200000,
      "resource_hours": 120,
      "confidence_level": "medium"
    },
    {
      "id": "forecast-002",
      "month": "2025-06",
      "capex_cents": 400000,
      "opex_cents": 250000,
      "resource_hours": 160,
      "confidence_level": "high"
    }
  ]
}
```

**Key Characteristics:**
- Must have at least one forecast defined
- Financial forecasting active (CAPEX/OPEX breakdown)
- User testing and validation phase
- Some tasks may be completed

---

### 5. Release Phase

**All Tasks Must Be Completed**

```json
{
  "id": "proj-release-001",
  "title": "Compliance Dashboard",
  "description": "Enterprise compliance monitoring dashboard",
  "lane": "compliance",
  "start_date": "01-05-2025",
  "end_date": "30-11-2025",
  "status": "release",
  "pm_name": "Lisa Anderson",
  "budget_cents": 10000000,
  "financial_treatment": "CAPEX",
  "tasks": [
    {
      "id": "task-004",
      "title": "Dashboard Development",
      "description": "Develop compliance monitoring dashboard",
      "status": "completed",
      "assigned_to": "Tom Wilson",
      "due_date": "01-06-2025",
      "effort_hours": 200
    },
    {
      "id": "task-005",
      "title": "User Training",
      "description": "Train end users on dashboard usage",
      "status": "completed",
      "assigned_to": "Sarah Davis",
      "due_date": "15-06-2025",
      "effort_hours": 40
    },
    {
      "id": "task-006",
      "title": "Documentation",
      "description": "Create user documentation",
      "status": "completed",
      "assigned_to": "Mike Johnson",
      "due_date": "20-06-2025",
      "effort_hours": 30
    }
  ],
  "resources": [
    {
      "id": "res-004",
      "name": "Full Stack Developer",
      "type": "internal",
      "allocation": 0.8
    },
    {
      "id": "res-005",
      "name": "UX Designer",
      "type": "contractor",
      "allocation": 0.2,
      "rate_per_hour": 10000
    }
  ],
  "forecasts": [
    {
      "id": "forecast-003",
      "month": "2025-07",
      "capex_cents": 1000000,
      "opex_cents": 500000,
      "resource_hours": 200,
      "confidence_level": "high"
    }
  ]
}
```

**Key Characteristics:**
- ALL tasks must have status === 'completed'
- Ready for production deployment
- Complete forecasting and resource allocation
- High-value project ($100,000 in this example)

---

## 🏷️ Lane-Specific Examples

### Office 365 Projects
```json
{
  "id": "proj-o365-001",
  "title": "Office 365 Migration",
  "lane": "office365",
  "description": "Migrate from on-premises Exchange to Office 365",
  "start_date": "01-01-2025",
  "end_date": "30-06-2025",
  "budget_cents": 5000000,
  "financial_treatment": "CAPEX"
}
```

### End User Computing (EUC)
```json
{
  "id": "proj-euc-001", 
  "title": "Windows 11 Deployment",
  "lane": "euc",
  "description": "Enterprise-wide Windows 11 upgrade",
  "start_date": "15-02-2025",
  "end_date": "31-12-2025",
  "budget_cents": 8000000,
  "financial_treatment": "CAPEX"
}
```

### Compliance Projects
```json
{
  "id": "proj-comp-001",
  "title": "GDPR Compliance Audit",
  "lane": "compliance",
  "description": "Comprehensive GDPR compliance assessment",
  "start_date": "01-03-2025",
  "end_date": "30-09-2025",
  "budget_cents": 3000000,
  "financial_treatment": "OPEX"
}
```

### Other IT Projects
```json
{
  "id": "proj-other-001",
  "title": "Network Infrastructure Upgrade",
  "lane": "other",
  "description": "Upgrade core network infrastructure",
  "start_date": "01-04-2025",
  "end_date": "31-08-2025",
  "budget_cents": 15000000,
  "financial_treatment": "CAPEX"
}
```

## 💰 Budget Examples by Scale

### Small Projects (< $10,000)
- concept-design: $0 (budget_cents: 0)
- solution-design: $5,000 (budget_cents: 500000)
- Active projects: $8,000 (budget_cents: 800000)

### Medium Projects ($10,000 - $100,000)
- Standard enterprise projects: $25,000 - $75,000
- budget_cents: 2500000 - 7500000

### Large Projects (> $100,000)
- Major infrastructure: $100,000+ (budget_cents: 10000000+)
- Enterprise-wide deployments: $150,000+ (budget_cents: 15000000+)

## 📅 Timeline Examples

### Short Projects (< 6 months)
```json
{
  "start_date": "01-01-2025",
  "end_date": "30-06-2025"
}
```

### Medium Projects (6-12 months)
```json
{
  "start_date": "01-02-2025",
  "end_date": "31-01-2026"
}
```

### Long Projects (> 12 months)
```json
{
  "start_date": "01-01-2025",
  "end_date": "31-12-2026"
}
```

## 🔄 Usage in Development

These examples can be used for:
- **UI Development**: Populate forms and displays
- **Testing**: Validate status transitions and business rules
- **Demos**: Show realistic project data
- **Development**: Seed databases and mock services