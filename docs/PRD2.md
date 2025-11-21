Strategic Layer → Core RoadmapTool

Vision, Goals, Initiatives become top-level entities in the app.

Initiatives link down into Epics (which already exist in your Core PRD).

This means:

When you create an Epic in RoadmapTool → you must select an Initiative.

Initiatives are grouped under Goals, and Goals under Vision.

Traceability:

Roadmaps (Core PRD) can now display not only Epics/Features/Releases but also which Goal and Vision they serve.

Storage:

Extend the Core PRD’s persistence model:

New keys: visions, goals, initiatives arrays in the same JSON/CSV persistence as projects, tasks.

Same NZ date format applies.

🔗 Strategic Layer → Work Integration

Initiatives feed into GitHub sync.

When generating Epics/Features with overlays (Work Integration PRD), the initiativeId is included in frontmatter.

Example GH Issue body:

---
rt_project_id: proj-001
rt_initiative_id: i1
start_date_nz: 01-07-2025
end_date_nz: 30-06-2026
status: engineering
priority: P2
---


Goals/Visions do not sync directly (they are strategic, internal-only).

Initiative → GitHub Labels/Projects mapping:

Work Mapping Config updated to support Initiative labels (e.g., initiative:tickets-to-conversations).

This lets Epics in GitHub be grouped by initiative.

🔗 Core RoadmapTool → Work Integration

Already defined in Work Integration PRD:

Projects/Tasks sync as Epics/Stories.

With Strategic Layer added:

Epics (Core) carry Initiative linkage → pass through to GitHub via overlay.

Traceability is preserved in both systems.

📊 End-to-End Flow (Example with Your Reimagine Data)

Vision: Reimagine IT Support as Conversations, not Tickets

Goal: Reduce inbound Helpdesk tickets by 60% by FY27

Initiative: Tickets → Conversations Transformation

Epic: “Build Teams App for Conversations”

Feature: “Enable knowledge article inline deflection”

Requirement: “User can resolve issue with 2 clicks”

In RoadmapTool (Core PRD):

Epic sits in a Release timeline.

Feature and Requirement attached.

In Work Integration (GitHub):

Epic pushed to GitHub Issues with Initiative label + RT Initiative ID in frontmatter.

Developers work from GitHub Issues.

Sync back:

Status updates flow back into RoadmapTool.

Initiative dashboard shows progress of linked Epics.

Goal shows KPI progress toward “60% fewer tickets.”

Vision dashboard shows overall health of “Reimagine IT Support.”

🧩 Developer Integration Points

Core RoadmapTool: add new JSON schema fields + UI tab for Strategy.

Work Integration: update work-mapping-config.js to handle initiativeId → GH label.

UI linking:

When creating/editing an Epic: dropdown to choose Initiative.

When creating Initiative: checkbox to “auto-label in GitHub.”

Help overlay: unify across all modules so the hierarchy is always visible.

✅ Clarity Summary

Strategic Layer (Vision/Goals/Initiatives) is a new top-level module.

It feeds Initiatives into Core Epics.

Those Initiatives cascade into GitHub Issues via Work Integration.

Goals + Visions are internal only (not synced to GitHub) but provide reporting and KPI alignment in RoadmapTool.