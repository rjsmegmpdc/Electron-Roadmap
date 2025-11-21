Product Requirements Document (PRD) – v5.1

Module: Resource Activity (Resource Info & Effort Summary)
Application: Roadmap-Electron
Owner: Matt Harkness – Product Manager (Modern Workplace)
Audience: Junior Developer / Tech Lead

1 Purpose

Provide a secure, local-first module that records staff resource information, calculates working-day effort (excluding weekends by default), and references salary-band rates.
All data remains local; no integrations run automatically. This module forms the data layer for future PM dashboards and cost analysis.

2 Scope
✅ In Scope

Encrypted local database of resources

SalaryBand ↔ Rate lookup reference table

Effort calculation on page refresh (excludes weekends unless flagged otherwise per resource)

Import / manual edit of public-holiday & mandatory-leave reference files

Per-resource “On Call” overrides for mandatory leave

CRUD + import/export

Automated daily DB backup with annual rotation or 2 GB size threshold

🚫 Out of Scope

Leave-system or ADO integrations (buttons hidden)

PM visual dashboards or analytics

3 Objectives
Goal	Description
Secure Resource Data	Store Display Name, UPN, SalaryBand and allocations locally (AES-256 encrypted).
Reference Rates on Demand	Use separate SalaryBandRates table for live lookup – no duplication.
Accurate Effort Computation	Compute EffortDays = Working Days − (Weekends + Holidays + Mandatory Leave − Overrides).
Manual Control	All updates are user-driven; no background syncs.
Extensible Foundation	Designed to support later dashboards & integrations.
4 Data Model
4.1 Resources
Field	Type	Description
ResourceID	UUID	Primary key
DisplayName	Text	Full name
UPN	Text	User Principal Name (encrypted)
SalaryBand	Text	FK → SalaryBandRates.SalaryBand
OPEX%	Int	0 – 100
CAPEX%	Int	0 – 100
FTE%	Int	0 – 100 (default 100)
IncludeWeekends	Bool	Default false – include weekends in effort calc if true
IsActive	Bool	Active status

✅ Validation: OPEX + CAPEX = 100; all % fields 0–100; no nulls.

4.2 SalaryBandRates (Reference Table)
Field	Type	Description
SalaryBand	Text	Primary key (e.g. “Band C2”)
HourlyRate	Decimal	Lookup value
DailyRate	Decimal	7.5 × HourlyRate
EffectiveFrom	Date	Start date
EffectiveTo	Date nullable	End date
Currency	Text	e.g. NZD (default)

Lookup Rule: select where today ≥ EffectiveFrom and (EffectiveTo is null or today < EffectiveTo).
Mid-Period Change Rule: if rate changes within period, apply daily rate per effective date range (pro-rata).

4.3 Reference Files

Same as v5.0 with JSON schemas unchanged.

5 Effort Calculation
EffortDays = WorkingDaysNZ 
             - (Weekends + PublicHolidays + MandatoryLeave)


Adjustments per resource R and period P:

if hasOverride(resourceId, P) and override.onCall == true:
    mandatoryDaysForR = 0
else:
    mandatoryDaysForR = periodDays


Final:

AdjustedEffortDays = EffortDays × (FTE% / 100)
EffortCost = AdjustedEffortDays × DailyRate


Rules:

Weekends excluded unless IncludeWeekends == true.

Effort recomputed on page refresh or when returning to the Resource tab.

6 Reference Data Import & Manual Entry

Unchanged schema, plus:

Error Handling: All import errors written to /logs/import_errors.log.

Atomic Rollback: Partial imports rollback to previous state.

De-duplication: strict by {category, date, title}.

7 Functional Requirements
ID	Requirement	Priority
FR1	Encrypted SQLite DB for resources	High
FR2	Separate SalaryBandRates lookup table	High
FR3	Effort auto-recalc on page refresh (exclude weekends)	High
FR4	Import .ics/.json for holidays & mandatory leave	High
FR5	Manual CRUD for reference files	High
FR6	On-Call override per resource per mandatory period	High
FR7	Hidden Leave/ADO buttons	High
FR8	OPEX + CAPEX = 100 validation	High
FR9	Audit all changes to /logs/resource_changes.log	Medium
FR10	Automatic backup rotation by size (> 2 GB) or annually	Medium
FR11	Import rollback on error	Medium
8 Non-Functional Requirements
Area	Requirement
Security	AES-256 encryption; masked UPN/salary in UI
Performance	Load + calc < 500 ms (≤ 200 records)
Reliability	Daily auto-backup; rotate annually or > 2 GB
Offline	100 % functionality without network
Auditability	Structured JSON log of CRUD and override actions (rotates as above)
Atomic Writes	Temp → replace for reference files
Validation	All percent fields 0–100 checked pre-save
9 UI Design Guidance

Minor clarifications added:

Resource List: Grid (DisplayName, masked UPN, SalaryBand, OPEX/CAPEX, EffortDays, EffortCost, IncludeWeekends).

Reference Calendars: Panels with Import/Export, manual CRUD, and error badges.

Overrides Modal: Shows existing On Call entries and reason.

Future Sync Placeholder: Disabled “Sync Now” button for later integrations.

Accessibility baseline (WCAG 2.1): tab order defined, masking readable by screen reader.

10 File & Folder Structure

Added config and test directories.

/app
  /config/
      config.json
  /modules/resources/
      resourceModel.js
      resourceStore.js
      resourceEffort.js
      salaryBandRates.js
  /modules/reference/
      icsImporter.js
      jsonImporter.js
      referenceStore.js
  /data/
      resources.db
      nz_public_holidays.json
      mandatory_leave_periods.json
  /ui/
      ResourceList.jsx
      ResourceForm.jsx
      ReferenceCalendars.jsx
      PublicHolidayForm.jsx
      MandatoryLeaveForm.jsx
  /logs/
      resource_changes.log
      import_errors.log
  /backup/
      (auto-generated daily backups)
  /tests/
      mock_data/
          sample_resources.json

11 Automation Testing Plan

Extended coverage:

Area	Scenario	Expected Result
CRUD	Add/Edit/Delete resource	DB updated & logged
Validation	OPEX/CAPEX/FTE > 100	Rejected with error
Rate Lookup	Change band mid-period	Uses correct daily rate
Auto Recalc	Refresh page	Excludes weekends unless flagged
ICS Import	All-day VEVENT	Correct dates created
Rollback	Corrupt JSON file	No data change + error logged
Override	OnCall checked	Effort excludes period
Backup Rotation	Simulate > 2 GB	New backup created, oldest deleted
Accessibility	Tab through UI	All fields focusable
Dup Prevention	Same resource twice	Rejected

Frameworks: Jest (back-end) + Playwright (UI).

12 Future Enhancements

Unchanged except for currency support now partially implemented:

Multi-currency ready column in SalaryBandRates.

Configurable weekend rules per region via config.json.

13 Acceptance Criteria
ID	Criteria
AC1	Resources and SalaryBandRates linked via SalaryBand.
AC2	Rates looked up on demand; no duplication.
AC3	Reference files import from .ics/.json with validation & rollback.
AC4	Manual entry/edit/delete for reference data available.
AC5	On Call overrides set per resource and persist.
AC6	Effort & cost auto-recalc on page refresh reflect overrides and weekend rules.
AC7	Leave/ADO buttons hidden (no auto sync).
AC8	Audit logs rotate by size (> 2 GB) or annually; all changes captured as JSON objects.

Implementation Plan (with Continuous Automated Tests)
0) Tooling & Project Baseline (Day 0)

Do

Node LTS, PNPM/Yarn, Git.

Install: electron, electron-builder, react, vite, tailwindcss, better-sqlite3, zod, rrule, ics, date-fns-tz, winston, fs-extra.

Testing: jest, ts-jest (or Babel for JS), @testing-library/react, playwright, eslint, prettier.

Scripts:

dev: electron + vite

test: jest

test:ui: playwright

lint, format

build

Test (CI from the start)

GitHub Actions workflow:

Lint → Unit (jest) → E2E smoke (playwright headless) on PR.

DoD

npm run dev starts shell app.

CI green on a blank test.

1) Config & Paths (Day 1)

Do

/app/config/config.json with:

dataDir, logsDir, backupDir, timezone: "Pacific/Auckland", currency: "NZD", backup: { sizeLimitGB: 2, rotateAnnually: true }.

config.ts helper to resolve OS-specific app data folder; ensure dirs exist.

Tests

Unit: resolve paths per OS; create if missing.

Unit: load timezone, currency defaults.

DoD

Running app creates folders.

2) Database Layer & Schema Versioning (Days 1–2)

Do

/app/modules/resources/db.ts (singleton better-sqlite3 handle).

schema.sql migrations with schema_version table.

Tables:

Resources(ResourceID PK, DisplayName, UPN, SalaryBand, OPEX, CAPEX, FTE, IncludeWeekends, IsActive)

SalaryBandRates(SalaryBand PK, HourlyRate, DailyRate, EffectiveFrom, EffectiveTo, Currency)

AuditLog(id PK, ts, user, action, entity, entityId, beforeJson, afterJson) (we won’t define security details; rotation handled later)

Constraints: CHECK(OPEX>=0 AND OPEX<=100), same for CAPEX/FTE; trigger to block OPEX+CAPEX<>100.

Tests

Unit: migration runs idempotently.

Unit: rejects invalid OPEX/CAPEX/FTE.

Unit: FK on SalaryBand works.

DoD

DB file created; constraints enforced.

3) Data Access Objects (DAO) (Day 3)

Do

resourceStore.ts: create/update/delete/get/list with validation via zod.

salaryBandRates.ts: upsert/list/activeRateForDate(date, band) with effective-date rule.

audit.ts: logChange(user, action, entity, entityId, before, after) (JSON).

Tests

Unit: CRUD happy path.

Unit: duplicate resource (same UPN) rejected.

Unit: rate effective-date selection incl. boundary (day before/after).

DoD

DAOs usable from a Node REPL script.

4) Effort Engine (Weekends & Overrides) (Day 4)

Do

resourceEffort.ts

workingDaysNZ(start, end, includeWeekends=false):

Exclude Sat/Sun by default; include if flag true.

Subtract public holidays and mandatory leave (passed in as sets).

applyOverrides(resourceId, periods, overrides):

If onCall for a period, do not deduct that period’s days.

effortForResource(resource, start, end, calendars):

EffortDays calc → AdjustedEffortDays = EffortDays * (FTE/100)

DailyRate chosen per-day if rate changes mid-period (pro-rata sum).

Tests

Unit: weekend exclusion baseline.

Unit: IncludeWeekends=true keeps weekends.

Unit: public holiday on weekday is deducted; on weekend ignored unless IncludeWeekends=true.

Unit: onCall override → zero deduction for that window.

Unit: mid-period rate change → correct pro-rata cost.

DoD

Deterministic results with fixed test calendars.

5) Reference Calendars: Importers & Stores (Days 5–6)

Do

referenceStore.ts

In-memory cache backed by /data/nz_public_holidays.json and /data/mandatory_leave_periods.json.

Atomic write: write .tmp → rename.

De-dup: {category,date,title}.

Rollback on validation failure.

jsonImporter.ts:

Validate shapes:

{date,title,category:"holiday"} or {start,end,title,category:"mandatory"}

icsImporter.ts:

Parse VEVENTs & RRULE with rrule.

Expand into 12–18 months window, map all-day to local dates in Pacific/Auckland.

Error handling:

Write errors to /logs/import_errors.log (append JSON per row).

Tests

Unit: good JSON imports; bad row rejected; partial rollback ensures no change.

Unit: ICS RRULE YEARLY expands in window; DST safe.

Unit: De-dup works.

Unit: Atomic write (simulate crash between tmp and rename) → old file intact.

DoD

Import/export buttons can call these functions (UI later).

6) Backup & Rotation (Day 7)

Do

backup.ts:

Daily backup resources_YYYYMMDD.db.

Rotation: if file count crosses annual boundary OR any backup file pushes total DB backups > 365 OR sizeLimitGB exceeded → delete oldest first.

Backups created after app start once per day.

Tests

Unit: simulate >2GB (mock fs stats) → oldest pruned.

Unit: year change → annual rotation.

DoD

Running a job creates a dated copy; list prunes as specified.

7) Audit Log Rotation (Day 7)

Do

auditRotation.ts:

Monitor /logs/resource_changes.log.

If >2GB or new year → rotate to /logs/resource_changes_YYYY.jsonl and start fresh.

Integrate into lifecycle (on app launch and weekly timer).

Tests

Unit: write past size → rotation triggers; new file starts.

Unit: year boundary rotates.

DoD

Manual script fills log → rotation observed.

8) UI: Resource List & Form (Days 8–9)

Do

ResourceList.jsx:

Table: DisplayName, masked UPN, SalaryBand, OPEX/CAPEX, FTE, IncludeWeekends, EffortDays, EffortCost.

Refresh recomputes effort (calls engine).

ResourceForm.jsx:

Create/Edit with zod validation.

SalaryBand dropdown (live from rates).

Persist; log audit on change.

Tests

UI (Playwright): create valid resource → appears in list with computed metrics.

UI: invalid percent → inline error, save disabled.

UI: toggle IncludeWeekends affects EffortDays after refresh.

DoD

Usable CRUD with correct calculations.

9) UI: Reference Calendars & Overrides (Days 10–11)

Do

ReferenceCalendars.jsx:

Tabs: Public Holidays, Mandatory Leave.

Import .ics/.json; Export .json.

Manual CRUD rows; error badge if last import had errors.

PublicHolidayForm.jsx, MandatoryLeaveForm.jsx:

Add/Edit/Delete.

Overrides Modal:

Select mandatory period; multi-select resources; On-Call tick + optional reason.

Badge “Overrides:n” per period.

Tests

UI: import valid JSON → rows appear; invalid shows toast + error badge.

UI: add override → resource’s EffortDays excludes the period.

UI: remove override → deduction resumes.

DoD

Full calendar management and overrides flow.

10) Hidden Integrations & Placeholder (Half Day)

Do

Ensure Leave/ADO buttons not rendered.

Add disabled “Sync Now” (tooltip “Manual sync not implemented”).

Tests

UI: DOM does not contain Leave/ADO buttons (assert selector missing).

UI: Sync Now disabled.

DoD

Meets visibility requirement.

11) Accessibility & UX Hygiene (Half Day)

Do

Keyboard tab order, ARIA labels, focus rings.

Masked UPN in grid; reveal on hover using title (no copy to clipboard by default).

Tests

UI: Keyboard can reach all inputs.

UI: Screen reader roles present for buttons and table.

DoD

WCAG basics satisfied.

12) Negative/Edge Testing Suite (Day 12)

Do

Add dedicated Jest suites:

Corrupt JSON / ICS.

Duplicate SalaryBand.

Conflicting overrides (same resource, overlapping periods) → latest wins (documented behavior).

Tests

Unit: conflict resolution determinism (most recent override applied).

Unit: duplicate SalaryBand rejected with clear message.

DoD

All negative tests pass.

13) Performance Check (Half Day)

Do

Seed 200 resources; 24 months of holidays/mandatory entries.

Measure load + calc under 500ms (Node performance).

Tests

Unit (perf): dev-only benchmark threshold (warn if slower).

DoD

Meets NFR.

14) Packaging & Release (Half Day)

Do

electron-builder config for Windows.

Output installer; ensure app writes to user app data folders (not Program Files).

Tests

Manual/E2E: install, run, add resource, import holidays, verify backup created next day (simulate date change by config flag in dev build).

DoD

Installer artifact available.

15) Developer Scripts & Sample Data (Half Day)

Do

/tests/mock_data/:

sample_resources.json

nz_public_holidays.json (small)

mandatory_leave.json with one period + override

rates.json with two effective windows to validate pro-rata

seed.ts to populate dev DB from mock data.

reset.ts to wipe dev DB & data files safely.

Tests

Unit: seed then compute → known totals.

DoD

One command to get a realistic dev state.

16) Definition of Done (Project)

All ACs (v5.1) verified by automated tests:

Links between tables

Rate lookup on demand

Import with validation & rollback

Manual CRUD

On-Call overrides persist and affect effort

Weekend rules respected

Hidden integrations

Audit log rotates by size/annually

CI: lint, unit, e2e all green.

Installer produced.

Test Matrix (Concise)
Area	Test	Type
Validation	OPEX+CAPEX=100; 0–100 bounds	Unit
Rates	Effective window edges; mid-period pro-rata	Unit
Effort	Weekend exclude/include; holiday vs weekend; override on/off	Unit
Import	JSON good/bad; ICS RRULE; de-dup; rollback	Unit
Atomicity	tmp→rename crash safety	Unit
Backup	Daily creation; >2GB prune; annual rotate	Unit
Audit	JSONL append; rotation by size/year	Unit
UI CRUD	Create/Edit/Delete resource; grid updates	E2E
UI Calendars	Import, manual add, error badge	E2E
UI Overrides	Set/unset On-Call affects Effort	E2E
Accessibility	Keyboard nav, ARIA roles	E2E
Performance	≤500ms at 200 resources	Unit (perf)
Junior-Dev Tips

Implement in thin vertical slices (DAO ➜ small UI ➜ tests) rather than all back-end first.

After each slice, write the failing test first, then code to pass it.

Keep all file IO through referenceStore/backup helpers—no ad-hoc fs in UI.