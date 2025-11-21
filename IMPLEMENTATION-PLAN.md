# Roadmap-Electron Implementation Plan

## Project Overview

Roadmap-Electron is an Electron-based desktop application for managing project roadmaps, timelines, and dependencies with an integrated test suite, epic/feature management, and ADO integration.

## Unified Styling System Architecture

### Objective
Implement a single, comprehensive CSS stylesheet to ensure consistency across all modules and pages while improving maintainability and performance.

### Why Unified Styles?

1. **Consistency**: All components follow the same design system
2. **Maintainability**: Single source of truth reduces duplication and conflicts
3. **Performance**: One CSS file is more efficient than multiple stylesheets
4. **Scalability**: Global design changes apply everywhere
5. **Developer Experience**: Clear organization and easy to locate/modify styles

### Implementation Strategy

#### Phase 1: Establish Foundation ✅ COMPLETED
- Created `app/renderer/styles/unified-styles.css` (2,500+ lines)
- Organized into logical sections with clear comments
- Defined comprehensive CSS custom properties for all design tokens
- Imported in `App.tsx` as root stylesheet
- Verified no other CSS imports in component files

**Deliverables:**
- [x] Single unified stylesheet with all necessary styles
- [x] CSS custom properties for colors, spacing, typography, shadows, z-index
- [x] Layout system (flexbox, grid utilities)
- [x] Form, button, card, table, navigation, status components
- [x] Utility classes for common patterns
- [x] Responsive design media queries
- [x] Accessibility features (focus rings, sr-only)
- [x] Animation keyframes
- [x] Dark theme and high contrast mode support

#### Phase 2: Documentation & Standardization (IN PROGRESS)

**Objectives:**
1. Document unified styling architecture in PRD
2. Create implementation plan with clear guidelines
3. Establish CSS variable naming conventions
4. Document class naming patterns
5. Create style guide for future development

**Deliverables:**
- [x] PRD.md - Complete product requirements with styling architecture section
- [x] IMPLEMENTATION-PLAN.md - This document with styling guidelines
- [ ] STYLE-GUIDE.md - Comprehensive style reference for developers
- [ ] Component CSS class reference
- [ ] Migration guide for any legacy styles

**Tasks:**
- [x] Create PRD.md with unified styling details
- [x] Create IMPLEMENTATION-PLAN.md with this strategy
- [ ] Create STYLE-GUIDE.md with CSS variable reference
- [ ] Archive legacy CSS files with documentation

#### Phase 3: Archive Legacy Styles

**Objectives:**
1. Document all legacy CSS files
2. Move legacy CSS to archive folder
3. Create migration reference
4. Verify no styles are lost

**Tasks:**
- [ ] Create `docs/legacy-styles` directory
- [ ] Move `app/renderer/styles/legacy-backup/*.css` to archive
- [ ] Create `docs/legacy-styles/README.md` with file descriptions
- [ ] Create `docs/legacy-styles/migration-reference.md`
- [ ] Verify all styles are represented in unified-styles.css

**Legacy Files to Archive:**
- `common.css` - Common component styles
- `components-index.css` - Component index styles
- `dashboard.css` - Dashboard-specific styles
- `EpicFeatureConfig.css` - Epic feature configuration styles
- `EpicFeatureHierarchy.css` - Epic hierarchy styles
- `globals.css` - Global styles
- `old-index.css` - Old index file
- `task-manager.css` - Task manager styles
- `TestSuite.css` - Test suite styles
- `TestSuiteNew.css` - New test suite styles
- `variables.css` - CSS variables (now in unified-styles.css)

#### Phase 4: Validation & Testing

**Objectives:**
1. Test all modules with unified styles
2. Verify responsive behavior across breakpoints
3. Check dark theme functionality
4. Validate accessibility features

**Test Scenarios:**
- [ ] Dashboard layout renders correctly
- [ ] Gantt chart displays properly
- [ ] Sidebar navigation functions
- [ ] Info pane updates correctly
- [ ] Forms render and validate properly
- [ ] Buttons show all variants correctly
- [ ] Cards display with proper styling
- [ ] Tables render with proper alignment
- [ ] Modals and dropdowns work correctly
- [ ] Mobile responsive (< 768px)
- [ ] Tablet responsive (768px - 1024px)
- [ ] Dark theme toggles correctly
- [ ] High contrast mode works
- [ ] Focus rings visible for accessibility
- [ ] Print styles work

**Execution:**
- [ ] Manual testing of all modules
- [ ] Cross-browser testing
- [ ] Responsive design testing
- [ ] Accessibility audit

#### Phase 5: Developer Guidelines & Maintenance

**Objectives:**
1. Document CSS variable usage
2. Create component styling patterns
3. Establish maintenance procedures
4. Set up code review standards

**Deliverables:**
- [ ] `docs/STYLING-GUIDE.md` - Complete CSS reference
- [ ] `docs/CSS-VARIABLES.md` - All custom properties documented
- [ ] `docs/COMPONENT-PATTERNS.md` - Reusable style patterns
- [ ] Style linting rules (if using ESLint/Stylelint)

**Guidelines:**

**Adding New Styles:**
1. Identify the component/object type
2. Add to appropriate section in `unified-styles.css`
3. Use CSS custom properties (--color-*, --spacing-*, etc.)
4. Follow existing naming conventions
5. Include explanatory comments
6. Test across all relevant pages/modules
7. Update documentation if introducing new patterns

**Style Organization:**
```
unified-styles.css
├── CSS Custom Properties (Variables)
├── Reset & Base Styles
├── Layout Objects (grid, flexbox, containers)
├── Form Objects (inputs, labels, validation)
├── Button Objects (variants, sizes, states)
├── Card Objects (containers, layouts)
├── Table Objects (tables, cells)
├── Navigation Objects (nav items, tabs)
├── Status Objects (badges, progress, indicators)
├── Modal Objects (modals, dropdowns)
├── Typography Objects (font sizes, weights, colors)
├── Utility Classes (margin, padding, display, etc.)
├── Component-Specific Styles (dashboard, sidebar, etc.)
├── Scrollbar Styling
├── Animations (keyframes, transitions)
├── Responsive Design (media queries)
└── Accessibility (focus states, sr-only)
```

**CSS Variable Usage Pattern:**
```css
.my-component {
  color: var(--text-primary);
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: var(--transition-colors);
}

.my-component:hover {
  background: var(--bg-hover);
  box-shadow: var(--shadow-lg);
}

.my-component.active {
  background: var(--color-primary);
  color: var(--text-inverse);
}
```

**Class Naming Convention:**
- Component classes: `.component-name`, `.component-variant`
- Size variants: `.component-sm`, `.component-lg`
- State variants: `.component.active`, `.component.disabled`
- Utility classes: `.class-name` (e.g., `.flex-col`, `.m-lg`)
- Nested elements: `.parent-child` pattern or BEM-style (e.g., `.card__header`)

**Maintenance Procedures:**
1. Regular style audits for unused CSS
2. Consistency checks for similar components
3. Performance optimization of animations
4. Accessibility testing of focus states
5. Responsive design verification

## CSS Custom Properties Reference

### Color System
```css
--color-primary: #00A45F
--color-primary-hover: #008C50
--color-primary-active: #007742
--color-primary-light: #80D2AF
--color-primary-dark: #006639

--color-secondary: #646464
--color-secondary-hover: #464646
--color-secondary-light: #C8C8C8
--color-secondary-dark: #2D2D2D

--color-success: #00A45F
--color-warning: #FF9500
--color-error: #E74C3C
--color-info: #3498DB

--color-priority-1: #dc2626 (Critical)
--color-priority-2: #ea580c (High)
--color-priority-3: #ca8a04 (Medium)
--color-priority-4: #65a30d (Low)

--color-risk-low: #10b981
--color-risk-medium: #f59e0b
--color-risk-high: #ef4444
--color-risk-critical: #dc2626
```

### Background Colors
```css
--bg-primary: #FFFFFF
--bg-secondary: #F0F5FA
--bg-tertiary: #FAFAFA
--bg-quaternary: #F0F5FA
--bg-hover: #FAFAFA
--bg-active: #F0F5FA
--bg-selected: rgba(0, 164, 95, 0.1)
--bg-overlay: rgba(0, 0, 0, 0.5)
```

### Text Colors
```css
--text-primary: #464646
--text-secondary: #646464
--text-tertiary: #8C8C8C
--text-muted: #C8C8C8
--text-inverse: #ffffff
```

### Border & Shadows
```css
--border-color: #C8C8C8
--border-color-light: #E0E0E0
--border-color-dark: #8C8C8C
--border-focus: var(--color-primary)

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1)
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25)
```

### Typography
```css
--font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...
--font-family-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, ...

--font-size-xs: 12px
--font-size-sm: 14px
--font-size-md: 16px
--font-size-lg: 18px
--font-size-xl: 20px
--font-size-2xl: 24px
--font-size-3xl: 30px
--font-size-4xl: 36px

--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

--line-height-tight: 1.25
--line-height-normal: 1.5
--line-height-relaxed: 1.75
```

### Spacing Scale
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
```

### Border Radius
```css
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--radius-xl: 12px
--radius-2xl: 16px
--radius-full: 9999px
```

### Transitions
```css
--transition-fast: 0.1s ease
--transition-normal: 0.2s ease
--transition-slow: 0.3s ease
--transition-colors: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease
--transition-transform: transform 0.2s ease
--transition-opacity: opacity 0.2s ease
--transition-all: all 0.2s ease
```

### Z-Index Layers
```css
--z-dropdown: 1000
--z-sticky: 1100
--z-fixed: 1200
--z-modal-backdrop: 1300
--z-modal: 1400
--z-popover: 1500
--z-tooltip: 1600
--z-toast: 1700
```

## Application Layout Structure

### Three-Column Dashboard
```
┌────────────────────────────────────────────┐
│           App Container (flex-row)         │
├──────────┬─────────────────────────┬───────┤
│ Sidebar  │   App Main (grid)       │ Info  │
│ (300px)  │ ┌─────────────────┐     │ Pane  │
│          │ │ Content Pane    │     │ (320px)
│          │ │ (flex-grow: 1)  │     │
│ • Module │ │                 │     │ • Stats
│   Links  │ │ • Gantt Chart   │     │ • Meta
│ • Nav    │ │ • Forms         │     │ • Actions
│          │ │ • Lists         │     │
│          │ └─────────────────┘     │
└──────────┴─────────────────────────┴───────┘
```

### Key Classes
- `.app-container`: Main flex container (row)
- `.app-main`: Grid with 2 columns (content + info)
- `.dashboard-content`: Main content area
- `.dashboard-info`/`.info-pane`: Right sidebar (320px)
- `.app-sidebar`: Left navigation (300px)

## Responsive Breakpoints

### Desktop (> 1024px)
- Full 3-column layout visible
- All components at full width
- Navigation sidebar expanded

### Tablet (768px - 1024px)
- Info pane width reduced to 280px
- Content area may wrap
- Navigation adjusts

### Mobile (< 768px)
- Single column layout
- Info pane hidden (display: none)
- Sidebar collapses or becomes overlay
- Full-width content area

### Small Mobile (< 480px)
- Minimal padding/spacing
- Simplified forms (single column)
- Compact buttons and inputs
- Hidden non-essential elements

## Recent Component Improvements

### Gantt Chart Component ✅ COMPLETED

**Implementation Date**: November 3, 2025  
**Component**: `app/renderer/components/GanttChart.tsx`

#### Enhanced Features

**1. Interactive Legend Filters**
- Checkbox-based status filtering
- Clean design with text labels only
- Status-colored checkboxes using `accentColor`
- Sticky positioning for always-visible controls

**2. Smart Default State**
```typescript
const [statusFilters, setStatusFilters] = useState({
  planned: true,      // ✅ Visible by default
  'in-progress': true, // ✅ Visible by default
  blocked: true,      // ✅ Visible by default
  done: true,         // ✅ Visible by default
  archived: false     // ❌ Hidden by default
});
```

**3. Auto-Sizing Layout**
- Responsive height based on parent container
- Fixed 50px row height for consistency
- Flex-based scrolling for overflow
- Optimal space utilization

**4. Enhanced UX**
- Hover effects on project rows
- Status-based color coding
- Project duration indicators
- Smooth animations and transitions

#### Technical Implementation

**Legend Structure:**
```jsx
<label>
  <input type="checkbox" accentColor={statusColor} />
  <span>Status Name</span>
</label>
```

**Layout Strategy:**
- Legend: Sticky header (flexShrink: 0)
- Timeline Header: Fixed height (60px)
- Rows: Flexible scrollable area (flex: 1)
- Each Row: Fixed height (50px)

**Filtering Logic:**
```typescript
projectData.timeline
  .filter(project => statusFilters[project.status])
  .map((project, idx, filteredList) => (
    // Render visible projects only
  ))
```

#### Benefits Achieved
✅ **User Control**: Toggle status visibility instantly  
✅ **Clean Interface**: Minimal, focused legend design  
✅ **Smart Defaults**: Most relevant statuses visible  
✅ **Responsive**: Adapts to any container size  
✅ **Performance**: Only renders filtered projects  
✅ **Accessibility**: Proper labeling and keyboard support  

#### Lessons Learned
- Color indicators can be redundant when checkboxes are color-coded
- "Archived" projects are typically noise - hiding by default improves UX
- Flex layout is superior to fixed heights for responsive components
- Sticky legends provide better UX than bottom placement

## Timeline & Milestones

### Week 1-2: Documentation & Setup ✅
- [x] Create PRD.md with styling architecture
- [x] Create IMPLEMENTATION-PLAN.md
- [x] Verify unified-styles.css completeness
- [ ] Create STYLE-GUIDE.md

### Week 3: Legacy Cleanup
- [ ] Archive legacy CSS files
- [ ] Create migration reference
- [ ] Update documentation

### Week 4: Testing & Validation
- [ ] Test all modules with unified styles
- [ ] Verify responsive behavior
- [ ] Accessibility audit
- [ ] Cross-browser testing

### Week 5: Developer Guidelines
- [ ] Document CSS best practices
- [ ] Create component styling patterns
- [ ] Establish code review standards
- [ ] Set up style linting

## Success Criteria

✅ **Completed:**
- Single unified stylesheet in place
- CSS custom properties defined
- All component styles included
- Layout system functioning
- Responsive design working
- Dark theme support enabled
- Accessibility features included
- PRD and Implementation Plan documented
- Gantt Chart component enhanced with:
  - Interactive status filter checkboxes
  - Auto-sizing responsive layout
  - Sticky legend positioning
  - Smart default filter state (archived hidden)
  - Hover effects and smooth animations

🎯 **In Progress:**
- Create comprehensive style guide
- Archive legacy CSS files
- Validate across all modules

**Yet to Complete:**
- Create component pattern library
- Establish maintenance procedures
- Set up developer guidelines
- Create migration documentation

## Maintenance & Support

### Ongoing Tasks
1. **Weekly**: Code review of new styles
2. **Monthly**: Audit for unused CSS
3. **Quarterly**: Performance optimization
4. **Bi-annual**: Design system review

### Common Tasks

**Adding a new component style:**
1. Identify section in unified-styles.css
2. Add styles using CSS variables
3. Document class names
4. Test responsive behavior
5. Update style guide if needed

**Modifying existing component:**
1. Search for component class
2. Update styles in-place
3. Test all affected modules
4. Verify responsive behavior
5. Update documentation

**Implementing new design token:**
1. Add CSS variable to `:root`
2. Consider dark theme variant
3. Update CSS-VARIABLES.md
4. Create utility classes if applicable
5. Test in components

## Conclusion

The unified stylesheet architecture provides a solid foundation for consistent, maintainable styling across Roadmap-Electron. By following these guidelines and leveraging CSS custom properties, the development team can efficiently manage the application's visual design while ensuring consistency across all modules and maintaining high code quality.

## Appendix: File Structure

```
Roadmap-Electron/
├── app/
│   └── renderer/
│       ├── styles/
│       │   └── unified-styles.css (2,500+ lines)
│       ├── components/
│       │   ├── DashboardLayout.tsx
│       │   ├── NavigationSidebar.tsx
│       │   ├── ContentPane.tsx
│       │   ├── InfoPane.tsx
│       │   ├── GanttChart.tsx
│       │   └── ... (other components)
│       └── App.tsx (imports unified-styles.css)
├── docs/
│   ├── STYLING-GUIDE.md (to be created)
│   ├── CSS-VARIABLES.md (to be created)
│   ├── COMPONENT-PATTERNS.md (to be created)
│   └── legacy-styles/ (to be created)
├── PRD.md ✅
└── IMPLEMENTATION-PLAN.md ✅
```
