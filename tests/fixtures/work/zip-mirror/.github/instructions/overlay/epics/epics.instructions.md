---
rt_project_id: {{project.id}}
{{#if project.initiative_id}}
rt_initiative_id: {{project.initiative_id}}
{{/if}}
start_date_nz: {{project.start_date}}
end_date_nz: {{project.end_date}}
status: {{project.status}}
priority: {{project.priority}}
{{#if project.financial_treatment}}
financial_treatment: {{project.financial_treatment}}
{{/if}}
---

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