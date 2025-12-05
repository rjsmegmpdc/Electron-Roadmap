---
rt_project_id: {{task.project_id}}
rt_task_id: {{task.id}}
{{#if task.initiative_id}}
rt_initiative_id: {{task.initiative_id}}
{{else}}{{#if project.initiative_id}}
rt_initiative_id: {{project.initiative_id}}
{{/if}}{{/if}}
start_date_nz: {{task.start_date}}
end_date_nz: {{task.end_date}}
status: {{task.status}}
priority: {{task.priority}}
{{#if task.effort_hours}}
effort_hours: {{task.effort_hours}}
{{/if}}
---

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