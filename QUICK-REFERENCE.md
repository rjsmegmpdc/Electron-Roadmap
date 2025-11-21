# 🚨 QUICK REFERENCE - Critical Patterns

## Status Values (USE EXACTLY THESE)
```typescript
type ProjectStatus = 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
```

## API Usage (NEW API ONLY)
```typescript
// ✅ CORRECT
const response = await window.electronAPI.getAllProjects();

// ❌ WRONG  
const projects = await window.electronAPI.getProjects();
```

## Budget Conversion (REQUIRED)
```typescript
// Loading: cents → NZD
budget_nzd: (project.budget_cents || 0) / 100

// Saving: NZD → string
budget_nzd: nzdAmount.toString()
```

## Safe Display (ALWAYS USE)
```typescript
// ✅ SAFE
${(project.budget_nzd || 0).toLocaleString('en-NZ', { minimumFractionDigits: 2 })}

// ❌ CRASHES
${project.budget_nzd.toLocaleString()}
```

## Pre-Commit Test
```bash
npm run build:main && npm run build:renderer
# Test: Load projects → Click project → Check budget display
```