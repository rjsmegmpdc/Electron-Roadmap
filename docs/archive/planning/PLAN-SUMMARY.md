# Financial Coordinator Development Plan - Executive Summary

## Overview

**What**: Build UI dashboards for the Financial Coordinator module to allow users to track project finances  
**Why**: Backend is complete (65% done). UI is the missing piece (35% remaining).  
**Who**: Junior developer (follow templates, copy patterns)  
**Timeline**: 3-4 weeks (4 work phases + polish)  
**Effort**: ~100-120 hours

---

## What We're Building

A 4-page financial tracking system:

1. **📥 Import Manager** - Upload SAP timesheets, actuals, labour rates
2. **📅 Resource Commitments** - Track "I can commit 6 hours/day" capacity
3. **⚠️ Variance Alerts** - Monitor and acknowledge cost/schedule variances
4. **💰 Project Finance** - View P&L (budget vs forecast vs actual)

---

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Database | ✅ 100% | 12 tables, all schema ready |
| Services | ✅ 100% | All backend logic implemented |
| IPC Wiring | ✅ 100% | Frontend-backend bridge ready |
| UI Pages | ❌ 0% | **This is what we're building** |
| Dashboards | ❌ 0% | This is what we're building |

---

## The Plan (5 Phases)

### Phase 0: Foundation (2-3 days)
**Goal**: Junior dev reads existing code, understands patterns  
**Deliverable**: Dev can answer "How do I copy a component?"  
**Risk**: Low (just reading)

### Phase 1: Import Manager (3-4 days)
**Goal**: Build CSV upload form  
**Deliverable**: Users can upload timesheets, actuals, labour rates  
**Difficulty**: Easy (mostly forms)  
**Risk**: Low (backend fully tested)

### Phase 2: Resource Commitments (5-6 days)
**Goal**: Build "I can commit X hours/day" form  
**Deliverable**: Users can create capacity commitments  
**Difficulty**: Medium (date handling)  
**Risk**: Low (service exists)

### Phase 3: Variance Alerts (4-5 days)
**Goal**: Build alert dashboard with filtering  
**Deliverable**: Users see and acknowledge variance alerts  
**Difficulty**: Medium (table + filters)  
**Risk**: Low (data already generated)

### Phase 4: Project Finance (5-6 days)
**Goal**: Build P&L dashboard  
**Deliverable**: Users see budget vs forecast vs actual by workstream  
**Difficulty**: Medium-High (calculations)  
**Risk**: Medium (most complex phase)

### Phase 5: Polish & Testing (3-4 days)
**Goal**: Fix bugs, improve UX, add documentation  
**Deliverable**: Production-ready, no console errors  
**Difficulty**: Easy (bug fixes)  
**Risk**: Low (depends on earlier phases)

---

## Success Metrics

### Immediate (End of Phase 1)
- ✅ CSV import form loads and works
- ✅ User can upload test file and see results

### Mid-point (End of Phase 3)
- ✅ 3/4 pages working
- ✅ Resource commitments created and displayed
- ✅ Variance alerts visible and filterable

### Final (End of Phase 5)
- ✅ All 4 pages working
- ✅ No console errors
- ✅ Data persists across sessions
- ✅ README updated
- ✅ Production-ready

---

## Resource Requirements

### Developer
- Junior-level React/TypeScript skills
- Can follow templates and patterns
- Can debug with browser console

### Environment
- Node.js (already installed)
- SQLite viewer (optional but helpful)
- 30-40 hours/week available

### Tools Provided
- Complete code templates for all UI pages
- Copy-paste IPC handlers
- Pre-built CSS styles
- Step-by-step checklist

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Junior dev gets stuck on TypeScript | Medium | Provide templates, pair programming available |
| IPC calls fail | High | All handlers pre-written and tested |
| Database queries slow | Low | Indexes already created |
| UI looks bad | Low | CSS styles provided |
| Scope creep | Medium | Strict phase boundaries, no feature requests mid-phase |

---

## Budget Estimate

### Developer Time
- Phase 0: 2-3 days
- Phase 1: 3-4 days
- Phase 2: 5-6 days
- Phase 3: 4-5 days
- Phase 4: 5-6 days
- Phase 5: 3-4 days
- **Total**: 22-28 days (4-5.5 weeks)

### At 40 hrs/week
- ~100-120 hours
- ~2-3 weeks at full-time
- ~4-5 weeks at part-time

---

## Go/No-Go Criteria

### Go (Proceed)
- ✅ Junior dev reads Phase 0 docs and understands
- ✅ Backend services already tested
- ✅ Database has real data to test with
- ✅ 4+ weeks of uninterrupted dev time available

### No-Go (Consider Different Approach)
- ❌ Need it done in 1 week (unrealistic)
- ❌ Junior dev has no React experience
- ❌ Backend needs more fixes (not ready)
- ❌ Requirements keep changing

---

## Assumptions

1. Backend services are stable and won't change
2. Database migrations are applied correctly
3. Junior dev has 30-40 hours/week available
4. Can do bug fixes/escalation swaps as needed
5. Final phase (polish) can extend if issues found

---

## Deliverables

**By End of Week 1** (Phase 0-1)
- [ ] Import Manager page working
- [ ] Sample CSV import successful

**By End of Week 2** (Phase 1-2)
- [ ] Resource Commitment page working
- [ ] Capacity calculations verified

**By End of Week 3** (Phase 2-3)
- [ ] Variance Alerts page working
- [ ] Alert filtering functional

**By End of Week 4** (Phase 3-4-5)
- [ ] All 4 pages working
- [ ] Production-ready code
- [ ] README updated
- [ ] No console errors
- [ ] Manual testing passed

---

## Handoff to Junior Dev

**Day 1 Actions**:
1. Read `FINANCIAL-COORDINATOR-BUILD-PLAN.md` (comprehensive guide)
2. Read `COORDINATOR-BUILD-CHECKLIST.md` (daily tracker)
3. Run `npm run dev` and verify app loads
4. Ask any clarifying questions

**During Development**:
- Update checklist daily
- Ask questions early (don't get stuck >30 min)
- Copy templates exactly (don't "improve" them)
- Test after each phase

**End of Development**:
- All checklist items completed
- All 4 success tests pass
- No console errors
- Ready to demo to stakeholders

---

## FAQ

**Q: Is 3-4 weeks realistic?**  
A: Yes, with templates provided and junior dev working 30-40 hrs/week. Could be 2 weeks with senior dev.

**Q: What if Phase 4 takes longer?**  
A: Phase 4 (Finance) is hardest. Can defer to v1.1 if needed. Phases 1-3 are higher priority.

**Q: Can we parallelize work?**  
A: Not recommended. Each phase depends on previous. Sequential is safer for junior dev.

**Q: What if backend breaks?**  
A: Unlikely (tested). But if so, fix backend before continuing UI.

**Q: Can we demo to stakeholders mid-development?**  
A: Yes after Phase 1 (import works). Then Phase 2, 3, 4 in weekly demos.

---

## Next Steps

1. **Review this plan** with team (30 min)
2. **Assign junior dev** who meets prerequisites
3. **Share plan documents** with dev (FINANCIAL-COORDINATOR-BUILD-PLAN.md + COORDINATOR-BUILD-CHECKLIST.md)
4. **Day 1 kickoff** - Dev reads Phase 0, asks questions
5. **Weekly check-ins** - Review phase progress, blockers

---

## Contact & Support

If junior dev gets stuck:
1. Check plan section for debugging tips
2. Look for similar pattern in existing pages
3. Check console for error message
4. Ask senior dev (don't spend >1 hour stuck)

---

**Status**: Plan Ready  
**Created**: 2 December 2025  
**Updated**: Same  
**Approved By**: [Stakeholder]  
**Dev Assigned**: [Junior Developer Name]  
**Start Date**: [Next Monday]  
**Expected Completion**: [4 Weeks]

---

# Quick Reference

| Item | Location | Size |
|------|----------|------|
| Full Plan | `FINANCIAL-COORDINATOR-BUILD-PLAN.md` | 1300+ lines |
| Daily Checklist | `COORDINATOR-BUILD-CHECKLIST.md` | 250 lines |
| Assessment | `FINANCIAL-COORDINATOR-ASSESSMENT.md` | 600 lines |
| This Summary | `PLAN-SUMMARY.md` | 300 lines |

Start with the **BUILD-PLAN** - it has everything needed.
