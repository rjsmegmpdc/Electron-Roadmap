# Financial Coordinator Build Checklist
**Your progress tracker** - Update this file daily

---

## Phase 0: Foundation (Days 1-2)
**Goal**: Understand patterns and how to get started

- [ ] Read `README.md` (5 min)
- [ ] Browse `app/renderer/pages/` - pick one page and read it (15 min)
- [ ] Read `app/main/ipc/coordinatorHandlers.ts` - understand IPC pattern (10 min)
- [ ] Read `app/main/services/coordinator/` - skim file names (5 min)
- [ ] Run `npm run dev` and verify app loads (5 min)
- [ ] **DONE** - Ready for Phase 1

---

## Phase 1: Import Manager (Days 3-6)
**Goal**: Build CSV upload form - easiest feature
**Status**: ✅ COMPLETE

### Tasks
- [x] Create `app/renderer/pages/CoordinatorImport.tsx` (copy template from plan)
- [x] Create `app/renderer/styles/coordinator.css` (copy styles from plan)
- [x] Add IPC handlers to `app/main/ipc/coordinatorHandlers.ts` (from plan)
- [x] Add route in `app/renderer/components/DashboardLayout.tsx`
- [x] Add navigation menu item in `NavigationSidebar.tsx`
- [x] Verify build compiles successfully
- [ ] Test with sample CSV file (PENDING):
  - [ ] Upload timesheet CSV → Should see "Imported: X"
  - [ ] Try actuals CSV → Should work too
  - [ ] Try labour rates → Should work with fiscal year
- [ ] **DONE** - Move to Phase 2

### Debug If Stuck
- [ ] Check component exports with `export const CoordinatorImport`
- [ ] Check route is registered correctly
- [ ] Check IPC handler name matches exactly (typos = crash)
- [ ] Try `npm run typecheck` for TypeScript errors

---

## Phase 2: Resource Commitment (Days 7-12)
**Goal**: Create "I can commit 6 hours/day" form

### Tasks
- [ ] Create `app/renderer/pages/ResourceCommitment.tsx` (copy template)
- [ ] Add CSS to `app/renderer/styles/coordinator.css` (copy styles)
- [ ] Add IPC handlers:
  - [ ] `coordinator:resources:list` - Load resource dropdown
  - [ ] `coordinator:commitment:create` - Save commitment
- [ ] Add route in App.tsx
- [ ] Test the form:
  - [ ] Select resource from dropdown
  - [ ] Enter period (01-04-2025 to 30-06-2025)
  - [ ] Enter 6 hours/day
  - [ ] Click submit → See "Total Available Hours: 390"
- [ ] **DONE** - Move to Phase 3

### Debug If Stuck
- [ ] Resources not loading? Check query in `coordinator:resources:list` handler
- [ ] Form not submitting? Check try/catch wraps everything
- [ ] Dates not working? Make sure format is DD-MM-YYYY

---

## Phase 3: Variance Alerts (Days 13-17)
**Goal**: Display alerts from database - build filtering UI

### Tasks
- [ ] Create `app/renderer/pages/VarianceAlerts.tsx` (copy template)
- [ ] Add CSS (copy styles from plan)
- [ ] Add IPC handlers:
  - [ ] `coordinator:alerts:list` - Load alerts
  - [ ] `coordinator:alerts:acknowledge` - Mark alert as acknowledged
- [ ] Add route in App.tsx
- [ ] Test the page:
  - [ ] Page loads (might be empty if no alerts yet)
  - [ ] Filter by severity
  - [ ] Filter by type
  - [ ] Click "Acknowledge" button on alert
- [ ] **DONE** - Move to Phase 4

### Debug If Stuck
- [ ] Alerts not showing? Import some timesheets first (generates alerts)
- [ ] Filters not working? Check useEffect dependency array
- [ ] Acknowledge button does nothing? Check IPC handler name

---

## Phase 4: Project Finance (Days 18-23)
**Goal**: Display P&L table - most complex, but follow template closely

### Tasks
- [ ] Create `app/main/services/coordinator/FinanceLedgerService.ts` (COPY EXACTLY - don't modify)
- [ ] Create `app/renderer/pages/ProjectFinance.tsx` (copy template)
- [ ] Add CSS (copy styles)
- [ ] Add IPC handler:
  - [ ] `coordinator:finance:getLedger` - Return ledger data
- [ ] Add route in App.tsx
- [ ] Test the page:
  - [ ] Page loads without errors
  - [ ] Table shows workstreams
  - [ ] Shows forecast, actual, variance columns
  - [ ] Totals row at bottom
- [ ] **DONE** - Move to Phase 5

### Debug If Stuck
- [ ] Page blank? Check ledger query in FinanceLedgerService
- [ ] Numbers showing 0? Make sure you've imported data first
- [ ] Currency formatting wrong? Check `formatNZD()` function

---

## Phase 5: Polish & Testing (Days 24-27)
**Goal**: Fix bugs, improve UX, ensure everything works

### Navigation
- [ ] Update `NavigationSidebar.tsx` with links to all 4 pages
- [ ] Test all links work

### Documentation
- [ ] Update `README.md` with "Financial Coordinator" section (copy template from plan)
- [ ] Add usage guide with 4 steps

### Final Testing
- [ ] [ ] No console errors when app starts
- [ ] [ ] All 4 pages load
- [ ] [ ] Forms validate (try submitting empty forms)
- [ ] [ ] Errors display clearly
- [ ] [ ] Loading states show (might need network delay)
- [ ] [ ] Data persists across page navigation
- [ ] [ ] No TypeScript errors: `npm run typecheck`
- [ ] [ ] No lint errors: `npm run lint`

### Launch Tests (Do These in Order)

**Test 1: Import Timesheet**
```
1. Go to Import page
2. Select "SAP Timesheets"
3. Upload test CSV (create one with 5 rows)
4. Should see: "Processed: 5, Imported: 5, Failed: 0"
```
✅ PASS / ❌ FAIL

**Test 2: Create Commitment**
```
1. Go to Resource Commitment
2. Select resource "Abbie AllHouse"
3. Start: 01-04-2025, End: 30-06-2025
4. Per: Day, Hours: 6
5. Click Create → Should show "Total Available Hours: 390"
```
✅ PASS / ❌ FAIL

**Test 3: View Alerts**
```
1. Go to Variance Alerts
2. If no alerts, go back and import timesheets first
3. Should see alert list
4. Try filtering by severity
5. Try acknowledging one alert
```
✅ PASS / ❌ FAIL

**Test 4: View Finance**
```
1. Go to Project Finance
2. Should see 3 summary cards (Forecast, Actual, Variance)
3. Should see table with WBSE rows
4. Should show totals at bottom
```
✅ PASS / ❌ FAIL

---

## Current Status

**Today's Date**: ________  
**Current Phase**: ________  
**Blockers**: ________  
**Next Step**: ________  

---

## Helpful Commands

```bash
# Start development
npm run dev

# Check for TypeScript errors
npm run typecheck

# Fix linting errors
npm run lint

# Build for production (when ready)
npm run build
```

---

## Key Files to Know

### Frontend (React/TypeScript)
- `app/renderer/pages/` ← Put your new pages here
- `app/renderer/components/` ← Reusable components
- `app/renderer/styles/` ← CSS files

### Backend (Node/Electron)
- `app/main/ipc/coordinatorHandlers.ts` ← IPC handlers
- `app/main/services/coordinator/` ← Business logic
- `app/main/db.ts` ← Database schema

### Database
- SQLite database at: `~/AppData/Roaming/RoadmapTool/roadmap.db`
- Use SQLite Viewer to inspect tables

---

## Common Issues & Solutions

**Issue**: "Cannot find module 'coordinator.css'"
**Fix**: Check file path matches exactly (case-sensitive)

**Issue**: "window.electronAPI is undefined"
**Fix**: Make sure you're in React component, not backend file

**Issue**: "IPC handler 'X' is not registered"
**Fix**: Check handler is in `coordinatorHandlers.ts` AND called in `main.ts`

**Issue**: "TypeScript error: Property 'X' does not exist"
**Fix**: Add the property to the interface at top of file

---

## Questions to Ask

When stuck, answer these first:
1. What exactly are you trying to do?
2. What's the error message? (Check console)
3. Have you checked the plan for the exact pattern?
4. Can you copy/paste more code from template?
5. Is this related to Phase 0 concepts?

---

**Goal**: Complete all phases by end of week 4  
**Success**: All 4 pages working, no console errors, README updated

Good luck! 🚀
