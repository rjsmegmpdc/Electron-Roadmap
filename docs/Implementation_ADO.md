# Dependency Management Framework for Azure DevOps Work Items  
**Version:** 1.1 (Updated for Junior Developer Implementation)  
**Author:** Matt Harkness – Product Manager, Modern Workplace  
**Date:** 14/10/2025  

---

## 1. Objective
Introduce a standardized, auditable, and automated **Dependency Management capability** in Azure DevOps (ADO) for structured and cross-workstream dependencies.  
This enables visibility, automation, and governance across: **Initiative → Issue**.

---

## 2. Business Problem
Dependencies are inconsistently tracked using comments or ad-hoc tags, leading to:
- Hidden cross-team blockers  
- Sprint scheduling conflicts  
- Limited visibility for management dashboards  
- No automated unblocking when dependent items complete  

**Goal:** Create a governed, traceable, and automated mechanism to manage dependencies across ADO work items, improving delivery sequencing and risk visibility.

---

## 3. Scope
### In Scope
- Hard and soft dependency creation between any non-hierarchical work items  
- Validation of dependencies (duplicate, cycle, hierarchy conflicts)  
- Automatic `Blocked` tagging and unblocking logic  
- Dependency Register dashboard in ADO Analytics  
- Comment-based audit trail for transparency  
- Delegated authentication (eventually; PAT used for development)

### Out of Scope
- External dependencies (e.g., Jira)  
- Automatic sprint reassignment  
- Historical dependency imports  

---

## 4. Roles
| Role | Responsibilities |
|------|------------------|
| Product Owner | Approves and reviews hard dependencies |
| Engineer | Creates soft dependencies for coordination |
| AI Agent | Suggests dependencies based on pattern detection |
| ADO Admin | Manages link rules and dashboards |
| Portfolio Owner | Monitors dependency risks through analytics |
| Mentor (Senior DevOps Engineer) | Guides OAuth setup, webhook deployment, and API review |

---

## 5. Dependency Types
| Type | Description | ADO Relation | Tags |
|------|--------------|--------------|------|
| **Hard (Blocking)** | Work cannot progress until dependency resolved | `System.LinkTypes.Dependency-Forward` | `Status:Blocked`, `Dependency:<TargetId>` |
| **Soft (Coordination)** | Work benefits from sequencing but not required | `System.LinkTypes.Related` | `Dependency:<TargetId>` |

---

## 6. Logical Flow

### Input Parameters
| Field | Description | Example |
|--------|-------------|---------|
| `SourceId` | Work item waiting for dependency | `621101` |
| `TargetId` | Blocking work item | `621092` |
| `Type` | `Hard` or `Soft` | `Hard` |
| `Reason` | Rationale | API Gateway migration depends on Mule deployment |
| `NeededBy` | Sprint or date | FY27-Q2-Sprint2 |

### Validation Rules
1. Reject ancestor/descendant relationships  
2. Prevent duplicates and circular dependencies  
3. Enforce read permissions for both items  
4. Warn on sprint misalignment (`SchedulingMismatch`)  
5. Maintain classification integrity (Confidential/Internal)

### Dependency Creation Logic
```json
PATCH /_apis/wit/workItems/{sourceId}?api-version=7.0
[
  {
    "op": "add",
    "path": "/relations/-",
    "value": {
      "rel": "System.LinkTypes.Dependency-Forward",
      "url": "https://dev.azure.com/{org}/{proj}/_apis/wit/workItems/{targetId}",
      "attributes": { "comment": "Reason: API migration depends on Mule deployment; NeededBy: FY27-Q2-Sprint2" }
    }
  }
]
Tag Updates

Add Status:Blocked to source

Add Dependency:<TargetId>

Comment: Dependency created: Source {sourceId} depends on {targetId}.

Resolution Logic
When target transitions to Done or Closed:

Check dependencies referencing target

Remove Status:Blocked if no remaining hard dependencies

Add comment: Unblocked after completion of {targetId}

7. Visualization
Dependency Register View
| Source ID | Source Title | Target ID | Type | Sprint | Risk | Status |
|------------|--------------|------------|--------|--------|--------|
| 621101 | Cloud Migration | 621092 | Hard | Q2 | Medium | Blocked |

8. Authentication Model
Development Mode: Use Personal Access Token (PAT)

Production Mode: Use delegated OAuth2 tokens (MSAL, user identity)

Service accounts disallowed for production

Helper script provided: Get-AdoAuthHeader.ps1

9. Non-Functional Requirements
Requirement	Detail
Performance	Create dependency in under 3s
Reliability	3 retry attempts on failure
Scalability	50 concurrent operations
Security	Enforced via delegated auth and ADO permissions
Auditability	Comment + Analytics log per event

10. Analytics & Reporting
ADO Analytics View: Dependencies by Project / Epic / Feature

Metrics: % blocked items, top blockers, average dependency duration

Dashboard: Integrated into Roadmap-Electron or Power BI

11. Acceptance Criteria
#	Criteria	Validation
1	Users can create hard and soft dependencies	Manual + API test
2	Hard dependencies mark source as Blocked	Tag check
3	Completing target unblocks source	Webhook integration test
4	Dependencies visible in Analytics	Dashboard validation
5	Audit log captured via comments	REST validation
6	Scheduling mismatch detected	Tag + comment check

Implementation Plan (v1.1)
1. Environment Setup
Prerequisites
PowerShell 7.x, VS Code, Git

Azure DevOps access (read/write work items)

PAT for initial testing

Azure AD App registration (for later delegated auth)

Environment Variables
ini
Copy code
ADO_ORG=https://dev.azure.com/<org>
ADO_PROJECT=<project>
ADO_PAT=<dev only>
Folder Structure
arduino
Copy code
ado-deps/
  src/
    Auth/
    Api/
    Core/
    Hooks/
    Logging/
  tests/
    Unit/
    Integration/
  config/
  scripts/
  logs/
  README.md
2. Configuration Files
appsettings.json
json
Copy code
{
  "OrgUrl": "https://dev.azure.com/<org>",
  "Project": "<project>",
  "Retry": {"MaxAttempts": 3, "BaseDelayMs": 500},
  "AuthMode": "PAT",
  "Webhook": {"PublicUrl": "https://<endpoint>", "Events": ["workitem.updated"]},
  "Tags": {
    "Blocked": "Status:Blocked",
    "DependencyPrefix": "Dependency:",
    "SchedulingMismatch": "SchedulingMismatch",
    "RiskPrefix": "Risk:"
  }
}
tags.json
json
Copy code
{
  "StrategicPillar": ["P1","P2","P3","P4"],
  "Funding": ["CAPEX","OPEX"],
  "ValueStream": ["DigitalWorkplace","Retail","Network"],
  "Status": ["Planned","InProgress","Blocked","Done"],
  "Quarter": ["FY27-Q1","FY27-Q2","FY27-Q3","FY27-Q4"],
  "Risk": ["High","Medium","Low"]
}
3. Core Modules
Validation - Validate-Dependency.ps1
Checks:

Visibility of source/target

Prevents duplicates and cycles

Rejects hierarchy links

Detects scheduling mismatch

Ensures classification alignment

Returns:

powershell
Copy code
@{IsValid=$true; Reasons=@()}
Creation - Add-Dependency.ps1
Adds relation (Hard or Soft)

Adds Status:Blocked, Dependency:<id>, and Risk:<level> tags

Adds comment and writes JSONL transaction log

Resolution - Resolve-IfUnblocked.ps1
Triggered on webhook when target closed:

Finds related source items

Removes Status:Blocked when all dependencies cleared

Logs unblock event

Scheduling - Detect-SchedulingMismatch.ps1
Compares source and target iteration dates

Adds tag + comment if misaligned

4. REST API Wrappers
Script	Purpose
Invoke-AdoApi.ps1	Handles auth header, retry logic, error handling
Get-WorkItem.ps1	Retrieves work item with relations
Patch-WorkItem.ps1	Executes ADO PATCH call
Query-Wiql.ps1	Detects duplicates and cycles

5. CLI Tool
scripts/New-Dependency.ps1

powershell
Copy code
param(
  [int]$SourceId,
  [int]$TargetId,
  [ValidateSet('Hard','Soft')]$Type,
  [string]$Reason='',
  [string]$NeededBy='',
  [ValidateSet('High','Medium','Low')]$Risk='Medium'
)

$report = ./src/Core/Validate-Dependency.ps1 -SourceId $SourceId -TargetId $TargetId -Type $Type
if(-not $report.IsValid){ throw "Invalid: $($report.Reasons -join ', ')" }

./src/Core/Add-Dependency.ps1 -SourceId $SourceId -TargetId $TargetId -Type $Type -Reason $Reason -NeededBy $NeededBy -Risk $Risk
./src/Core/Detect-SchedulingMismatch.ps1 -SourceId $SourceId -TargetId $TargetId
6. Logging Helpers
Write-LogJson.ps1
powershell
Copy code
param($EventType, $Data)
$timestamp = (Get-Date).ToString('s')
Add-Content -Path './logs/transactions.jsonl' -Value (ConvertTo-Json @{time=$timestamp; type=$EventType; data=$Data})
Invoke-Retry.ps1
powershell
Copy code
param($ScriptBlock, $MaxAttempts=3, $BaseDelayMs=500)
for($i=1; $i -le $MaxAttempts; $i++){
  try { return & $ScriptBlock }
  catch { Start-Sleep -Milliseconds ($BaseDelayMs * $i) }
}
throw "Operation failed after $MaxAttempts attempts"
7. Webhook Automation
Register Hook - Register-ServiceHook.ps1
Event: workitem.updated
Filter: System.State transitions to Done or Closed

Handler - Webhook-Handler.ps1
Parses JSON payload

Extracts TargetId

Calls Resolve-IfUnblocked.ps1

Logs all events with Write-LogJson.ps1

Local testing:
Invoke-WebRequest -Uri http://localhost:7071 -Method POST -Body (Get-Content mock-payload.json -Raw)

8. Automated Tests (Pester)
Unit Tests
Validate dependency logic

Verify correct tags/comments

Test scheduling mismatch tagging

Integration Tests
End-to-End Flow:

Create 2 sandbox work items

Add hard dependency

Validate Blocked tag

Close target

Validate unblocked

Verify logs + comments

Run:

powershell
Copy code
Invoke-Pester -Path tests -Output Detailed
9. Developer Checklist
Step	Description
[ ] Setup environment and test REST access	
[ ] Build REST wrappers	
[ ] Implement validation logic	
[ ] Implement add/unblock scripts	
[ ] Add logging and retry	
[ ] Register webhook	
[ ] Write unit & integration tests	
[ ] Run end-to-end sandbox test	
[ ] Document results	

10. Timeline Estimate
Phase	Task	Duration
Setup	Env + API config	1d
Core	REST + Validation + Add Logic	2d
Webhook	Handler + Registration	1.5d
Tests	Unit + Integration	2d
Deploy	Sandbox + Pilot	1d
Total	End-to-End Delivery	7.5 days

11. Mentor Checkpoints
Phase	Mentor Review
After REST setup	Validate API connectivity
After Core logic	Review tagging and validation rules
After Webhook config	Verify event payloads
Final	Validate test coverage and analytics outputs

12. Success Indicators
Metric	Description
100% passing tests	Validates correctness
<3s latency	Meets performance goal
0 manual unblocks	Confirms automation works
Analytics dashboard refreshes	Confirms reporting link

13. Post-Implementation
Publish runbook for L2 team

Integrate Power BI / Roadmap-Electron dashboard

Transition to OAuth2

Package as PowerShell module (Ado.Dependency)

14. Appendix – Junior Developer Resources
Reference: Azure DevOps REST API Docs

Sample Collection: Postman file ado-dependency-api.postman.json

Mock Data: mock-payload.json and sample-workitems.json