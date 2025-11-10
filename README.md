# Roadmap Tool - Electron Implementation

A standalone desktop roadmap application built with TypeScript, React, and Electron.

## 🚨 IMPORTANT FOR DEVELOPERS

**Before making any changes, read these critical documents:**

- **[IMPLEMENTATION-NOTES.md](./IMPLEMENTATION-NOTES.md)** - Complete bug prevention guide
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Critical patterns cheat sheet

These documents contain fixes for critical bugs that prevented data display and caused crashes. Following these patterns is **mandatory** to avoid reintroducing bugs.

## Quick Start

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production  
npm run build

# Test before committing
npm run build:main && npm run build:renderer
```

## Architecture

- **Main Process**: Electron + SQLite + ProjectService API
- **Renderer Process**: React + Vite + Zustand state management
- **IPC Communication**: Structured request/response patterns

## Critical Implementation Rules

1. **Status Values**: Only use `'planned' | 'in-progress' | 'blocked' | 'done' | 'archived'`
2. **API Usage**: Always use `window.electronAPI.getAllProjects()` (not `getProjects()`)
3. **Budget Format**: Convert `budget_cents` ↔ `budget_nzd` in store layer
4. **Null Safety**: Always check for undefined values before calling methods

## Project Structure

```
app/
├── main/                 # Electron main process
│   ├── services/         # ProjectService (source of truth)
│   ├── ipc/             # IPC handlers
│   └── db.ts            # Database schema
├── renderer/            # React UI
│   ├── components/      # UI components
│   ├── state/          # Zustand stores
│   └── stores/         # New ProjectStore
```

## Testing Checklist

Before any commit, verify:
- [ ] Projects load and display
- [ ] Project details open without crashes
- [ ] Budget shows proper NZD formatting
- [ ] All status types work in UI
- [ ] New projects save successfully

## License

Private project - Team access only

---
**⚠️ Remember**: Check [IMPLEMENTATION-NOTES.md](./IMPLEMENTATION-NOTES.md) before making changes!