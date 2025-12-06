# Portfolio Governance Module - User Guide

**Version 1.0** | **Last Updated**: January 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Governance Dashboard](#governance-dashboard)
4. [Portfolio Analytics](#portfolio-analytics)
5. [Stage Gate Management](#stage-gate-management)
6. [Compliance Tracking](#compliance-tracking)
7. [Decision Logging](#decision-logging)
8. [Benefits Tracking](#benefits-tracking)
9. [Strategic Alignment](#strategic-alignment)
10. [Escalation Management](#escalation-management)
11. [Reporting](#reporting)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)

---

## Introduction

The Portfolio Governance Module provides executive-level oversight and control of your project portfolio. It enables you to:

- **Monitor portfolio health** with real-time scoring across 5 key dimensions
- **Track project progression** through standardized stage gates
- **Ensure compliance** with organizational policies and standards
- **Log critical decisions** and track resulting actions
- **Measure benefits realization** with ROI calculations
- **Align projects** to strategic initiatives
- **Manage escalations** with automated SLA monitoring

### Key Features

✅ **Portfolio Health Dashboard** - Single-pane view of portfolio status  
✅ **7-Gate Framework** - Ideation → Business Case → Design → Build → UAT → Deploy → Post-Implementation  
✅ **Automated Compliance** - Policy tracking with escalation workflows  
✅ **Decision Audit Trail** - Complete history of governance decisions  
✅ **Benefits Tracking** - Track expected vs. realized value with ROI  
✅ **Strategic Alignment** - Link projects to strategic initiatives  
✅ **Risk Heatmaps** - Visual risk vs. value analysis  
✅ **Executive Reports** - Export-ready governance reports

---

## Getting Started

### Accessing Governance

1. Click **Portfolio Governance** in the left navigation sidebar
2. Select **Governance Dashboard** for overview or **Portfolio Analytics** for detailed analysis

### First-Time Setup

When first accessing the governance module, the system will:

1. ✅ Initialize 7 default stage gates
2. ✅ Create 6 baseline governance policies
3. ✅ Set up default gate criteria (17 criteria)
4. ✅ Configure escalation levels (4 levels)

This happens automatically via database migration on first launch.

### Navigation Structure

```
📊 Portfolio Governance
  ├── 🎯 Governance Dashboard    (Executive overview)
  └── 📊 Portfolio Analytics      (Detailed analytics)
```

---

## Governance Dashboard

**Access**: Portfolio Governance → Governance Dashboard

The Governance Dashboard provides a real-time executive summary of your portfolio health.

### Dashboard Components

#### 1. Portfolio Health Score

**Location**: Top-left card

Displays overall portfolio health as a score from 0-100 with color-coded band:

| Score Range | Band | Color | Meaning |
|-------------|------|-------|---------|
| 90-100 | Excellent | 🟢 Green | Portfolio performing exceptionally |
| 75-89 | Good | 🟢 Light Green | Portfolio on track |
| 60-74 | Fair | 🟡 Yellow | Minor concerns, monitor closely |
| 40-59 | Poor | 🟠 Orange | Intervention required |
| 0-39 | Critical | 🔴 Red | Urgent action needed |

**Calculation Formula**:
```
Health Score = (On-Time × 30%) + (Budget × 25%) + (Risk × 20%) + (Compliance × 15%) + (Benefits × 10%)
```

#### 2. Health Component Breakdown

Five sub-scores displayed as progress bars:

- **On-Time Score** (30% weight): % of projects meeting schedule
- **Budget Score** (25% weight): % of projects on budget
- **Risk Score** (20% weight): Inverse of risk levels (low risk = high score)
- **Compliance Score** (15% weight): % of policies compliant
- **Benefits Score** (10% weight): % of benefits on track

#### 3. Projects by Stage Gate

**Location**: Middle section

Visual cards showing project distribution across 7 gates:

```
[Ideation: 3] [Business Case: 2] [Design: 4] [Build: 5] [UAT: 2] [Deploy: 1] [PIR: 1]
```

**Click any gate card** to filter analytics by that gate.

#### 4. Compliance Alerts

**Location**: Right panel, top

Shows overdue compliance items with severity:

- 🔴 **Critical** (30+ days overdue)
- 🟠 **High** (15-29 days)
- 🟡 **Medium** (7-14 days)
- ⚪ **Low** (1-6 days)

**Actions**:
- Click **View Details** to see full compliance list
- Click individual alert to navigate to compliance tracking

#### 5. Open Actions Summary

**Location**: Right panel, middle

Displays overdue actions grouped by priority:

```
Critical: 2
High: 5
Medium: 8
Low: 3
```

**Click to navigate** to action management view.

#### 6. Active Escalations

**Location**: Right panel, bottom

Shows count of active escalations by level:

```
Level 4 (Executive): 1
Level 3 (Portfolio): 2
Level 2 (PM): 5
Level 1 (Team): 8
```

#### 7. Benefits at Risk

**Location**: Bottom panel

Displays count and total value of benefits at risk or delayed.

### Dashboard Actions

**🔄 Refresh Metrics** - Update all dashboard data (bottom-right button)  
**🖨️ Print to PDF** - Press `Ctrl+P` or click Print button  
**📺 Full Screen** - Press `F11` to toggle full-screen mode (ESC to exit)

---

## Portfolio Analytics

**Access**: Portfolio Governance → Portfolio Analytics

Advanced analytics with interactive visualizations and filtering.

### Analytics Components

#### 1. Risk vs. Value Heatmap

**Location**: Top-left quadrant

Interactive scatter plot mapping projects by risk and strategic value:

```
High Value,
Low Risk     ● ● ●          High Value,
  (IDEAL)                    High Risk
                              (MONITOR)
─────────────────────────────────────
Low Value,                  Low Value,
Low Risk                    High Risk
(HARVEST)     ● ●            (EXIT)
```

**Quadrants**:
- **Top-Left (Green)**: High value, low risk - Prioritize these
- **Top-Right (Yellow)**: High value, high risk - Monitor closely
- **Bottom-Left (Blue)**: Low value, low risk - Harvest or maintain
- **Bottom-Right (Red)**: Low value, high risk - Consider cancellation

**Interaction**: Hover over dots to see project details.

#### 2. Portfolio Health Trend

**Location**: Top-right

Line chart showing health score over time with configurable ranges:

- **30 Days** - Short-term trends
- **90 Days** - Quarterly view
- **180 Days** - Six-month trend

**Use Case**: Identify improving or declining portfolio health patterns.

#### 3. Gate Progression Analytics

**Location**: Bottom-left

Displays:
- **Average Days per Gate** - Time projects spend at each gate
- **Stuck Projects** - Projects at same gate for 60+ days
- **Gate Completion Rate** - % of projects completing each gate

**Key Metric**: Identify bottleneck gates where projects get delayed.

#### 4. Compliance Analytics

**Location**: Bottom-right

Shows:
- **Overall Compliance Rate** - Portfolio-wide percentage
- **Compliance by Policy** - Breakdown by each governance policy
- **Top Non-Compliant Projects** - Projects with most violations

### Analytics Filters

**Status Filter**: Active, On-Hold, Completed, All  
**Priority Filter**: Critical, High, Medium, Low, All  
**Date Range**: Custom start/end dates  
**Initiative Filter**: Filter by strategic initiative

**Apply Filters** button updates all charts simultaneously.

---

## Stage Gate Management

The governance module uses a 7-gate framework to control project progression.

### The 7 Stage Gates

#### Gate 1: Ideation
**Purpose**: Validate project concept and strategic fit  
**Key Criteria**:
- Strategic alignment documented
- High-level scope defined
- Stakeholder sponsor identified

**Exit Criteria**: Concept approval from Portfolio Manager

---

#### Gate 2: Business Case
**Purpose**: Validate financial and business justification  
**Key Criteria**:
- ROI calculation completed (≥ 15% minimum)
- Cost-benefit analysis documented
- Resource requirements estimated
- Risk assessment completed

**Exit Criteria**: Business case approved by Finance and Portfolio Manager

---

#### Gate 3: Design
**Purpose**: Validate solution design and approach  
**Key Criteria**:
- Solution architecture documented
- Technical feasibility confirmed
- Resource plan detailed
- Project plan with milestones

**Exit Criteria**: Design review passed, project plan approved

---

#### Gate 4: Build
**Purpose**: Validate implementation readiness  
**Key Criteria**:
- Development/implementation complete
- Unit testing passed
- Documentation complete
- Training materials prepared

**Exit Criteria**: Build review passed, ready for UAT

---

#### Gate 5: UAT (User Acceptance Testing)
**Purpose**: Validate solution meets requirements  
**Key Criteria**:
- UAT test cases executed
- Critical defects resolved
- User acceptance sign-off obtained
- Go-live plan approved

**Exit Criteria**: UAT passed, deployment authorized

---

#### Gate 6: Deploy
**Purpose**: Validate successful deployment  
**Key Criteria**:
- Production deployment complete
- Post-deployment testing passed
- Support handover complete
- Users trained

**Exit Criteria**: Deployment verified, system stable

---

#### Gate 7: Post-Implementation Review (PIR)
**Purpose**: Validate benefits realization and lessons learned  
**Key Criteria**:
- Benefits realization confirmed
- Lessons learned documented
- Final budget vs. actual reconciled
- Stakeholder satisfaction assessed

**Exit Criteria**: Project formally closed

---

### Gate Progression Rules

**Sequential Progression**: Projects must complete gates in order. Skipping gates is not allowed.

**Mandatory Criteria**: All mandatory criteria must be met before progressing.

**Approval Requirements**: Each gate requires approval from designated roles:
- Gates 1-2: Portfolio Manager
- Gates 3-4: Project Manager + Technical Lead
- Gates 5-7: Project Manager + Sponsor

**Auto-Progression**: If enabled, projects automatically progress when all criteria met (default: OFF).

### Managing Project Gates

#### Viewing Current Gate

1. Navigate to **Projects** → Select project
2. **Governance** tab shows current gate status
3. View gate criteria checklist with completion status

#### Progressing a Gate

1. Ensure all **mandatory criteria** are checked ✅
2. Click **Progress to Next Gate** button
3. System validates criteria compliance
4. If approved, project moves to next gate
5. Entry date and approval recorded

#### Gate History

View complete gate progression history:
- Entry dates for each gate
- Approval dates and approvers
- Time spent at each gate
- Gate review notes

---

## Compliance Tracking

Track adherence to organizational policies and standards.

### Default Governance Policies

The system includes 6 baseline policies:

1. **Project Documentation Standard**
   - All projects must maintain current documentation
   - Check frequency: Monthly
   - Severity: Medium

2. **Financial Reporting Requirement**
   - Monthly financial reports required
   - Check frequency: Monthly
   - Severity: High

3. **Risk Management Process**
   - Risk register must be maintained
   - Check frequency: Weekly
   - Severity: High

4. **Stakeholder Communication Plan**
   - Communication plan required and followed
   - Check frequency: Bi-weekly
   - Severity: Medium

5. **Change Control Procedure**
   - All changes must follow approval process
   - Check frequency: Per change
   - Severity: High

6. **Quality Assurance Standards**
   - QA checkpoints must be passed
   - Check frequency: Per milestone
   - Severity: Critical

### Compliance Statuses

- ✅ **Compliant** - Policy requirements met
- ❌ **Non-Compliant** - Policy requirements not met
- ⚠️ **Waived** - Exception granted with justification
- 🔍 **Under Review** - Compliance being assessed

### Compliance Workflow

#### Checking Compliance

1. Navigate to **Compliance Tracking** page
2. Select project and policy
3. Click **Check Compliance**
4. Set status (Compliant/Non-Compliant)
5. Add compliance notes
6. Record checker name and date

#### Requesting a Waiver

For justified exceptions to policy requirements:

1. From compliance view, click **Request Waiver**
2. Fill in waiver details:
   - Policy being waived
   - Justification (required)
   - Requested by
   - Valid from/to dates
3. Submit for approval
4. Waiver requires Portfolio Manager approval

**Waiver Status**:
- 🔵 Pending - Awaiting approval
- ✅ Approved - Waiver active
- ❌ Rejected - Waiver denied
- ⏰ Expired - Waiver period ended

### Escalation Triggers

Non-compliance automatically escalates based on days overdue:

| Days Overdue | Level | Escalated To | SLA |
|--------------|-------|--------------|-----|
| 1-7 days | Level 1 | Team Lead | 7 days |
| 8-14 days | Level 2 | Project Manager | 7 days |
| 15-30 days | Level 3 | Portfolio Manager | 15 days |
| 31+ days | Level 4 | Executive Sponsor | Immediate |

**Escalation Actions**:
- Automated notifications sent to escalation contacts
- Escalation appears on dashboard
- Resolution tracking activated

---

## Decision Logging

Maintain an audit trail of all governance decisions.

### Decision Types

- **Approve** - Green light decision (proceed)
- **Reject** - Red light decision (stop/cancel)
- **Defer** - Yellow light (postpone decision)
- **Conditional Approve** - Proceed with conditions
- **Escalate** - Escalate to higher authority

### Recording a Decision

1. Navigate to **Decision Log** page
2. Click **Record Decision**
3. Fill in decision details:
   - **Project** (required)
   - **Decision Type** (required)
   - **Decision Date** (DD-MM-YYYY format, required)
   - **Decided By** (required)
   - **Rationale** (recommended, text)
   - **Impact** (text, optional)
4. Click **Save Decision**

### Linking Actions to Decisions

Every decision can have associated actions:

1. From decision detail view, click **Add Action**
2. Fill in action details:
   - **Action Title** (required)
   - **Priority** (Critical/High/Medium/Low)
   - **Assigned To** (person responsible)
   - **Due Date** (DD-MM-YYYY)
   - **Description** (details)
3. Click **Create Action**

**Action Dependencies**: Actions can depend on other actions. System prevents circular dependencies.

### Decision History

View complete decision history:
- Filter by project, date range, decision type
- Export to CSV for external analysis
- Search by keywords

**Audit Trail**: All decisions are timestamped and immutable.

---

## Benefits Tracking

Track expected benefits and measure realization against targets.

### Benefit Types

- 💰 **Financial** - Cost savings, revenue generation
- ⚙️ **Operational** - Efficiency improvements, time savings
- 📈 **Strategic** - Market position, competitive advantage
- 😊 **Customer** - Satisfaction, retention, NPS improvements

### Creating a Benefit

1. Navigate to **Benefits Tracking** page
2. Click **Add Benefit**
3. Fill in benefit details:
   - **Benefit Type** (required)
   - **Description** (required)
   - **Expected Value** (numeric, required)
   - **Target Date** (DD-MM-YYYY)
   - **Measurement Method** (how to track)
4. Click **Save Benefit**

### Tracking Benefit Realization

#### Realization Statuses

- 🟢 **On Track** - Benefit realization progressing as planned
- 🟡 **At Risk** - Concerns about achieving target
- 🔴 **Delayed** - Target date will be missed
- ✅ **Realized** - Benefit fully achieved
- ❌ **Not Realized** - Benefit will not be achieved

#### Updating Realized Value

1. From benefits list, select benefit
2. Click **Update Realization**
3. Enter:
   - **Realized Value** (actual value achieved to date)
   - **Realization Date** (when value was achieved)
   - **Realization Status** (On Track/At Risk/Delayed/Realized)
   - **Notes** (explanation of variance)
4. Click **Save**

### ROI Calculation

The system automatically calculates ROI for projects with tracked benefits.

**Formula**:
```
ROI % = ((Total Benefits - Total Costs) / Total Costs) × 100
```

**Example**:
- Total Project Cost: $100,000
- Total Expected Benefits: $175,000
- ROI: ((175,000 - 100,000) / 100,000) × 100 = **75%**

**Payback Period**:
```
Payback Period (months) = Total Costs / (Total Benefits / 12)
```

**Viewing ROI**:
1. Navigate to **Benefits Tracking**
2. Click **ROI Calculations** tab
3. View portfolio-wide and per-project ROI

---

## Strategic Alignment

Link projects to strategic initiatives and measure alignment.

### Creating Strategic Initiatives

Strategic initiatives are high-level business goals (defined by executives).

**Example Initiatives**:
- Digital Transformation Program
- Customer Experience Enhancement
- Operational Excellence
- Market Expansion APAC

### Linking Projects to Initiatives

1. Navigate to **Strategic Alignment** page
2. Select project
3. Click **Link to Initiative**
4. Choose initiative from dropdown
5. Rate alignment strength (1-5):
   - 5 = Critical to initiative success
   - 4 = Strongly aligned
   - 3 = Moderately aligned
   - 2 = Weakly aligned
   - 1 = Tangentially related
6. Add justification notes
7. Click **Link**

### Alignment Scoring

The system calculates a strategic alignment score (0-100) based on:

**Formula**:
```
Alignment Score = (Linkage × 40%) + (Value Contribution × 30%) + (Timeline Alignment × 30%)
```

**Components**:
- **Linkage Score**: Strength of initiative connection (1-5 rating → 0-100)
- **Value Contribution**: Project's contribution to initiative value
- **Timeline Alignment**: How well project timeline supports initiative

**Viewing Alignment**:
1. Navigate to **Strategic Alignment** page
2. View alignment matrix (initiatives × projects)
3. Color-coded cells show alignment strength
4. Filter by initiative or project

---

## Escalation Management

Track and manage governance escalations with SLA monitoring.

### Escalation Levels

#### Level 1: Team-Level
- **Triggered By**: 1-7 days overdue
- **Escalated To**: Team Lead
- **SLA**: 7 days to resolve
- **Required Approvals**: Team Lead

#### Level 2: Project-Level
- **Triggered By**: 8-14 days overdue or Level 1 expired
- **Escalated To**: Project Manager
- **SLA**: 7 days to resolve
- **Required Approvals**: Team Lead + Project Manager

#### Level 3: Portfolio-Level
- **Triggered By**: 15-30 days overdue or Level 2 expired
- **Escalated To**: Portfolio Manager
- **SLA**: 15 days to resolve
- **Required Approvals**: Team Lead + PM + Portfolio Manager

#### Level 4: Executive-Level
- **Triggered By**: 31+ days overdue or Level 3 expired
- **Escalated To**: Executive Sponsor
- **SLA**: Immediate action required
- **Required Approvals**: All + Executive Sponsor

### Managing Escalations

#### Viewing Active Escalations

1. Navigate to **Escalations Manager** page
2. View escalations grouped by level
3. Sort by priority, days overdue, or SLA deadline

#### Resolving an Escalation

1. From escalations list, select escalation
2. Click **Resolve**
3. Enter:
   - **Resolution Notes** (required)
   - **Resolution Date** (auto-populated)
   - **Resolved By** (your name)
4. Click **Save Resolution**
5. Status changes to **Resolved**

#### Escalation History

View complete escalation history:
- All escalations (active + resolved)
- Time to resolution metrics
- Resolution effectiveness tracking

---

## Reporting

Generate and export governance reports for stakeholders.

### Report Types

#### 1. Executive Summary
**Audience**: C-Level, Executive Sponsors  
**Content**:
- Portfolio health score and trend
- Key risks and issues
- Critical escalations
- Strategic alignment overview
- High-level financial summary

**Export Formats**: PDF, HTML

#### 2. Project Governance Report
**Audience**: Project Managers, PMO  
**Content**:
- Project-specific gate status
- Compliance checklist
- Decision log
- Action items
- Benefits realization
- Risk assessment

**Export Formats**: PDF, HTML, CSV

#### 3. Compliance Audit Report
**Audience**: Audit, Compliance Teams  
**Content**:
- Compliance rate by policy
- Non-compliant projects list
- Waiver register
- Escalations by severity
- Remediation actions

**Export Formats**: PDF, CSV

#### 4. Benefits Realization Report
**Audience**: Finance, PMO, Sponsors  
**Content**:
- Expected vs. realized benefits
- ROI calculations
- Payback period analysis
- Benefits at risk
- Variance explanations

**Export Formats**: PDF, Excel, CSV

### Generating Reports

1. Navigate to **Governance Reports** page
2. Select **Report Type**
3. Configure filters:
   - Date range
   - Projects (all or specific)
   - Include/exclude sections
4. Click **Generate Report**
5. Preview report in browser
6. Click **Export** and choose format

### Scheduling Reports

**Available in roadmap** - Future release will support:
- Automated report generation
- Email distribution lists
- Custom schedules (daily/weekly/monthly)

---

## Best Practices

### Portfolio Health Management

✅ **Review dashboard daily** - Stay on top of portfolio status  
✅ **Act on red/orange alerts** - Don't let critical issues linger  
✅ **Monitor health trends** - Declining trends need intervention  
✅ **Balance the portfolio** - Mix of risk levels and strategic value  

### Gate Management

✅ **Don't skip gates** - Each gate has important validation criteria  
✅ **Complete criteria thoroughly** - Don't rush through checklists  
✅ **Document gate reviews** - Record rationale for decisions  
✅ **Use gates for go/no-go** - Kill projects that don't pass gates  

### Compliance

✅ **Check compliance regularly** - Don't wait until it's overdue  
✅ **Document waivers thoroughly** - Justify exceptions clearly  
✅ **Resolve escalations quickly** - Don't let them reach Level 4  
✅ **Review policies annually** - Ensure they're still relevant  

### Decision Logging

✅ **Record all major decisions** - Build complete audit trail  
✅ **Link actions immediately** - Don't forget follow-ups  
✅ **Track action completion** - Hold people accountable  
✅ **Reference past decisions** - Learn from history  

### Benefits Tracking

✅ **Set realistic targets** - Over-promising damages credibility  
✅ **Define measurement methods** - Know how you'll track value  
✅ **Update regularly** - Monthly at minimum  
✅ **Explain variances** - Document why actual differs from expected  

---

## Troubleshooting

### Common Issues

#### Dashboard Not Loading

**Symptoms**: Dashboard shows loading spinner indefinitely  
**Causes**:
- Database connection issue
- No projects in system
- Browser cache issue

**Solutions**:
1. Refresh page (F5)
2. Clear browser cache and reload
3. Check that projects exist in system
4. Restart application if issue persists

---

#### Cannot Progress Gate

**Symptoms**: "Progress Gate" button disabled or error message  
**Causes**:
- Mandatory criteria not met
- Trying to skip a gate
- Insufficient permissions

**Solutions**:
1. Check all mandatory criteria are checked ✅
2. Ensure you're progressing to next gate (no skipping)
3. Verify you have Project Manager or Portfolio Manager role
4. Review gate progression validation errors

---

#### Compliance Escalation Not Triggering

**Symptoms**: Overdue compliance item not escalating  
**Causes**:
- Escalation automation disabled
- Dates incorrectly formatted
- Compliance status set to "Waived"

**Solutions**:
1. Verify compliance status is "Non-Compliant"
2. Check due date format is DD-MM-YYYY
3. Ensure escalation contacts are configured
4. Manually create escalation if automation fails

---

#### ROI Calculation Incorrect

**Symptoms**: ROI percentage doesn't match manual calculation  
**Causes**:
- Missing benefit values
- Project costs not entered
- Currency conversion issues

**Solutions**:
1. Verify all benefits have expected_value entered
2. Check project budget_cents is populated
3. Ensure all values in same currency
4. Re-calculate after updating values

---

#### Report Export Fails

**Symptoms**: Export button doesn't download file  
**Causes**:
- Browser popup blocker
- Insufficient permissions
- Large report size timeout

**Solutions**:
1. Allow popups for this application
2. Try smaller date range
3. Use CSV format instead of PDF for large datasets
4. Check browser download settings

---

### Getting Help

**In-App Support**:
- Click **Help** (?) icon in top-right
- View contextual help for current page

**Documentation**:
- User Guide: `docs/GOVERNANCE_USER_GUIDE.md`
- API Docs: `docs/GOVERNANCE_API.md`
- Architecture: `docs/GOVERNANCE_ARCHITECTURE.md`

**Support Contact**:
- Email: support@roadmaptool.com
- Slack: #governance-support

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F11` | Toggle full-screen mode |
| `Ctrl+P` | Print current view to PDF |
| `Ctrl+R` | Refresh dashboard |
| `Esc` | Exit full-screen mode |
| `Ctrl+F` | Search/filter |

### Date Format

All dates in the governance module use **New Zealand date format**:

**Format**: `DD-MM-YYYY`  
**Example**: `25-12-2024` (25 December 2024)

### Glossary

**Gate**: A decision point in the project lifecycle where continuation is approved  
**Compliance**: Adherence to organizational policies and standards  
**Escalation**: Progressive elevation of issues to higher authority  
**Waiver**: Approved exception to policy requirements  
**ROI**: Return on Investment - measure of project value  
**PIR**: Post-Implementation Review - final project gate  
**SLA**: Service Level Agreement - time limit for resolution  
**Portfolio**: Collection of all projects under governance  

---

**End of User Guide**

For technical documentation, see `GOVERNANCE_API.md` and `GOVERNANCE_ARCHITECTURE.md`.
