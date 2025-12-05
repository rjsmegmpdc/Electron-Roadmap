Sub-PRD: Work Integration (for RoadmapTool)
0) Goals

Generate and sync work items (Epic, Feature, User Story, Task, Issue) to GitHub Issues using overlays and governance.

Keep dates in NZ format DD-MM-YYYY everywhere.

Provide config UI and two-way sync (manual + webhook).

Ship with fixtures mirroring github.zip layout so tests run without secrets.

1) Files & Folders (create all)
src/
  js/
    integrations/
      work/
        work-integration-manager.js
        work-template-engine.js
        work-mapping-config.js
        work-validation.js
        work-sync-engine.js
        github-client.js
        github-webhook-receiver.js
        audit-log.js
        index.js                # exports a factory to wire module into app.js
  views/
    integrations/
      work-settings.html       # simple vanilla form for config
tests/
  unit/integrations/work/
    work-integration-manager.test.js
    work-template-engine.test.js
    work-mapping-config.test.js
    work-validation.test.js
    work-sync-engine.test.js
    github-client.test.js
    github-webhook-receiver.test.js
    audit-log.test.js
  e2e/
    work-integration.ui.test.js
tests/fixtures/work/zip-mirror/
  .github/
    instructions/
      overlay/
        epics/epics.instructions.md
        features/features.instructions.md
        userstories/user_stories.instructions.md
        tasks/tasks.instructions.md
        issues/issues.instructions.md
      base/
        rules.instructions.md
        security.instructions.md
        standards.instructions.md
    chatmodes/
      backlog_refinement.chatmode.md
      ids-refinement.chatmode.md
    config/
      team_structure-config.md
      ado-default-config.md
      confluence-default-config.md
tests/fixtures/work/
  settings.sample.json
  rendered.epic.sample.md
  rendered.story.sample.md
  webhook.issue.edited.sample.json


Hook into the app: in src/js/app.js, import integrations/work/index.js and attach as window.prdIntegration.work.

2) Configuration (minimal UI spec)

views/integrations/work-settings.html (vanilla HTML):

Inputs (IDs must match):

#cfg-gh-auth-mode (select: PAT/OAuth) → PAT only for now.

#cfg-gh-token (password), #cfg-gh-owner (text), #cfg-gh-repo (text).

#cfg-webhook-enabled (checkbox), #cfg-webhook-secret (password).

#cfg-overlay-source-type (select: zip-upload/github-repo) – use zip-upload.

#cfg-map-status-project, #cfg-map-status-task, #cfg-map-priority (JSON textareas).

#cfg-date-format (readonly = DD-MM-YYYY), #cfg-tz (text default Pacific/Auckland).

Buttons: Save, Test Connection (mock), Ensure Labels (mock), Load Sample Overlays.

Persistence:

Non-secrets → workIntegrationConfig (localStorage).

Secrets (PAT, webhook secret) → memory only on window.prdIntegration.workSecrets.

Acceptance (Config):

Can save non-secret config.

Secrets not persisted.

“Load Sample Overlays” loads tests/fixtures/work/zip-mirror.

3) Module Contracts (implement exactly)
3.1 work-template-engine.js
export default class WorkTemplateEngine {
  constructor({ overlaysSource, dateUtils }) {}
  async loadOverlays() {} // loads from zip-mirror fixture by default
  render(type /* 'epic'|'feature'|'userstory'|'task'|'issue' */, src /* Project|Task */, options = {})
    // returns:
    // { title, body, labels, assignees, frontmatter: { rt_project_id, rt_task_id?, start_date_nz, end_date_nz, status, priority } }
  validateRendered(rendered) // { valid, errors: [] }
}


Rules:

Title must include overlay prefix (e.g., [Epic] or [Story]) then short name.

Body must include required sections from overlay + append base rules, security, standards.

NZ dates only in frontmatter.

Errors:
Overlay not found: ${type} · Missing required field in source: ${field} · Validation failed: ${list}

3.2 work-validation.js
export default class WorkValidation {
  constructor({ rulesDoc, securityDoc, standardsDoc }) {}
  validateTitle(title, type)               // { valid, error? }
  validateSections(body, type)             // { valid, missing: [] }
  validateNZDates(frontmatter)             // { valid, error? }
  validatePriority(priorityLabelOrField)   // { valid, error? }
}

3.3 work-mapping-config.js
export default class WorkMappingConfig {
  constructor() {}
  getDefaultMappings() { /* status/priority/labels defaults */ }
  mapProjectToIssue(project, options = {}) // returns GH payload fields
  mapTaskToIssue(task, project, options={})
  mapStatusRTtoGH(status)                  // label list
  mapPriorityRTtoGH(priority)              // 'P1'..'P4'
}

3.4 github-client.js (mocked for unit tests)
export default class GitHubClient {
  constructor({ token, owner, repo, apiBase = "https://api.github.com" }) {}
  async createIssue(payload)   {} // → { number, url }
  async updateIssue(number, payload) {}
  async getIssue(number)       {} // → Issue object
  async listLabels()           {} // → []
  async ensureLabels(required) {} // idempotent
}


Real HTTP optional later. Unit tests mock responses.

3.5 work-sync-engine.js
export default class WorkSyncEngine {
  constructor({ githubClient, mappingConfig, validation, audit }) {}
  async pushFromRTToGH(rtEntity /* project|task */) // → { issueNumber }
  async pullFromGHIssue(issueNumber)               // → { updated: boolean }
  reconcile(rtEntity, ghIssue) // → { action:'push'|'pull'|'skip', reasons:[] }
}


Conflict policy: last-writer wins with locked fields: rt_ids, security_block, nz_dates (if project status ≥ uat). If GH edits locked fields → overwrite from RT and log.

3.6 github-webhook-receiver.js
export default class GitHubWebhookReceiver {
  constructor({ secret, onEvent /* fn */ }) {}
  verify(signature, rawBody) // boolean (HMAC)
  async handle(eventName, payload) { /* calls onEvent with normalized change set */ }
}

3.7 work-integration-manager.js (entrypoint)
export default class WorkIntegrationManager {
  constructor({ dataPM, templateEngine, mapping, syncEngine, github, validation, audit })
  async generateWorkItem(type, sourceId, options={}) // → { preview, validation }
  async createInGitHub(type, sourceId, options={})   // → { issueNumber, url }
  async syncProject(projectId)                        // → { pushed, pulled, conflicts }
  async syncTask(taskId)                              // → { pushed, pulled, conflict? }
  async handleGitHubEvent(event)                      // normalized path via webhook receiver
}

3.8 audit-log.js
export default class AuditLog {
  append(event /* { ts, actor, action, entityType, entityId, details } */) {}
  list(filter = {}) {}
  exportCSV() {} // string
}

4) Acceptance Criteria (feature level)

Generate → Validate → Create (Epic & Story)

From Project Details: Generate Epic → preview shows overlay sections + base appendices; title includes [Epic].

From Task: Generate User Story → [Story] title + required sections.

Validation passes; NZ dates appear in frontmatter.

Sync

Push creates GH issue with labels & frontmatter.

Pull updates RT status from GH label change (e.g., status:in-progress).

Conflict on locked field → RT overwrites; audit entry created.

Config

Can save non-secret config; secrets not persisted.

“Load Sample Overlays” loads fixtures; Generate works without internet.

Webhook

Given sample webhook payload, RT task status updates accordingly (test via local handler).

5) Automated Tests
5.1 Unit (Jest)

work-template-engine.test.js

Loads fixtures; render('epic', project) → title starts with [Epic], body has Acceptance Criteria, Security, Standards; frontmatter contains NZ dates.

Missing required field → Validation failed: ….

work-validation.test.js

Reject wrong NZ date format; accept 01-03-2025.

Missing section detection (e.g., “Acceptance Criteria”).

work-mapping-config.test.js

Project status→labels mapping; Task status mapping; priority mapping P2 → "priority:P2".

github-client.test.js

ensureLabels idempotence.

createIssue returns { number, url } (mock).

work-sync-engine.test.js

Push from RT→GH constructs payload using mapping + overlay.

Pull GH label change → RT task status updated.

Locked field edited on GH → reconciliation chooses push; audit logged.

github-webhook-receiver.test.js

HMAC verify pass/fail; issues.edited payload normalized and dispatched.

audit-log.test.js

Append/list/export CSV.

5.2 E2E (Playwright) – work-integration.ui.test.js

Open settings → Load Sample Overlays → Save.

Open a sample project → Generate Epic → Create (mock GH) → link appears (GH #123).

Simulate webhook edit → task status in RT updates to in-progress.

6) Sample Data (fixtures mirroring github.zip)
6.1 Overlays (minimal but functional)

tests/fixtures/work/zip-mirror/.github/instructions/overlay/epics/epics.instructions.md

# [Epic] {{project.title}}
## Problem
{{project.description}}

## Outcome
- Define clear measurable outcome.

## Scope
- In: ...
- Out: ...

## Acceptance Criteria
- AC1: ...
- AC2: ...

---
{{> base/security }}
{{> base/standards }}
{{> base/rules }}


tests/fixtures/work/zip-mirror/.github/instructions/overlay/userstories/user_stories.instructions.md

# [Story] {{task.title}}
## As a
{{task.userRole}}

## I want
{{task.capability}}

## So that
{{task.value}}

## Acceptance Criteria
- Given ...
- When ...
- Then ...
---
{{> base/security }}
{{> base/standards }}
{{> base/rules }}


tests/fixtures/work/zip-mirror/.github/instructions/base/security.instructions.md

## Security Considerations
- Enforce least privilege.
- Handle PII per policy.


tests/fixtures/work/zip-mirror/.github/instructions/base/standards.instructions.md

## Engineering Standards
- Lint, unit tests, code review.


tests/fixtures/work/zip-mirror/.github/instructions/base/rules.instructions.md

## Delivery Rules
- Link work to roadmap.
- Use labels for status & priority.


tests/fixtures/work/zip-mirror/.github/chatmodes/backlog_refinement.chatmode.md

# Backlog Refinement Chat Mode
- Expand stories; add ACs; split large items.


tests/fixtures/work/zip-mirror/.github/config/team_structure-config.md

# Team Structure
- Default assignee: example-user
- Domain owners: Platform, EUC, Compliance


These are minimal viable replicas. Swap with real zip contents later; folder paths remain the same.

6.2 Settings sample

tests/fixtures/work/settings.sample.json

{
  "github": { "authMode": "PAT", "owner": "one-nz", "repo": "roadmap-work", "apiBase": "https://api.github.com" },
  "sync": { "direction": "two-way", "schedule": "manual", "batchSize": 10, "retryMax": 2, "backoffMs": 500 },
  "overlays": { "sourceType": "zip-upload", "path": ".github" },
  "mapping": {
    "statusProject": { "concept-design": ["status:concept"], "solution-design": ["status:design"], "engineering": ["status:eng"], "uat": ["status:uat"], "release": ["status:release"] },
    "statusTask": { "planned": ["status:planned"], "in-progress": ["status:in-progress"], "blocked": ["status:blocked"], "completed": ["status:completed"] },
    "priority": { "P1": "priority:P1", "P2": "priority:P2", "P3": "priority:P3", "P4": "priority:P4" },
    "defaults": { "assignees": { "epic": ["example-user"] }, "labels": { "epic": ["type:epic"], "userstory": ["type:story"] }, "milestoneStrategy": "none" }
  },
  "governance": { "enforceTitle": true, "enforceSections": true, "lockAfter": "uat", "lockedFields": ["rt_ids","security_block"], "violationAction": "comment-and-allow" },
  "regional": { "dateFormat": "DD-MM-YYYY", "timezone": "Pacific/Auckland" }
}

6.3 Rendered samples

tests/fixtures/work/rendered.epic.sample.md

---
rt_project_id: proj-001
start_date_nz: 01-03-2025
end_date_nz: 30-06-2025
status: engineering
priority: P2
---
# [Epic] Project Alpha
## Problem
Test project

## Outcome
- Define clear measurable outcome.

## Scope
- In: ...
- Out: ...

## Acceptance Criteria
- AC1: ...
- AC2: ...

## Security Considerations
- Enforce least privilege.
- Handle PII per policy.

## Engineering Standards
- Lint, unit tests, code review.

## Delivery Rules
- Link work to roadmap.
- Use labels for status & priority.


tests/fixtures/work/rendered.story.sample.md

---
rt_project_id: proj-001
rt_task_id: task-100
start_date_nz: 05-03-2025
end_date_nz: 20-03-2025
status: planned
priority: P3
---
# [Story] As a PM, I can export roadmap to CSV
## As a
PM

## I want
to export the roadmap

## So that
I can share timelines

## Acceptance Criteria
- Given projects exist, When I export, Then I get a CSV with NZ dates.

6.4 Webhook sample

tests/fixtures/work/webhook.issue.edited.sample.json (trimmed GitHub issues event)

{
  "action": "edited",
  "issue": {
    "number": 123,
    "title": "[Story] As a PM, I can export roadmap to CSV",
    "labels": [{ "name": "status:in-progress" }],
    "body": "---\nrt_project_id: proj-001\nrt_task_id: task-100\nstart_date_nz: 05-03-2025\nend_date_nz: 20-03-2025\nstatus: in-progress\npriority: P3\n---\n..."
  },
  "repository": { "name": "roadmap-work", "owner": { "login": "one-nz" } }
}

7) Developer Steps

Scaffold files/folders above.

Template Engine: load overlays from zip-mirror; render Epic/Story.

Validation: implement title/sections/NZ dates checks.

Mapping: status/priority/labels + project/task mappers.

GitHub Client: implement methods; default to mock in tests.

Sync Engine: push/pull + conflict policy + audit logging.

Webhook Receiver: verify function + normalize event → call manager.

Settings UI: save non-secrets; keep secrets in memory; “Load Sample Overlays” action.

Wire into app.js as window.prdIntegration.work.

Tests: run Jest unit then Playwright E2E.

8) Definition of Done

Generate Epic/Story previews from fixtures; validate; create (mock GH).

Push/pull works with mapping; status flows via labels.

Webhook sample updates RT task status to in-progress.

Secrets not saved; config persists.

All unit tests + E2E pass; no console errors.