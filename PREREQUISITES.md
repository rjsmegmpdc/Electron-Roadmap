# Roadmap Tool - Prerequisites & Setup Guide

## Overview
This document outlines all the prerequisites and setup steps required to execute the Roadmap Tool PRD successfully.

## System Requirements

### Operating System
- **Windows**: Windows 10/11 (tested)
- **macOS**: macOS 10.15+ 
- **Linux**: Ubuntu 18.04+ or equivalent

### Core Dependencies

#### 1. Node.js & npm
- **Node.js**: v16.0.0 or higher (v24.8.0 recommended)
- **npm**: v7.0.0 or higher (v11.6.0 recommended)

**Installation:**
- Download from [nodejs.org](https://nodejs.org/)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

#### 2. Python
- **Python**: v3.7 or higher (v3.13.7 recommended)
- Required for the development server (`python -m http.server`)

**Installation:**
- Download from [python.org](https://python.org/)
- Verify installation:
  ```bash
  python --version
  ```

### Development Tools

#### 1. Git (Optional but Recommended)
- For version control and collaboration
- Download from [git-scm.com](https://git-scm.com/)

#### 2. Code Editor
- **Recommended**: Visual Studio Code with extensions:
  - ESLint
  - Prettier
  - JavaScript (ES6) code snippets
  - Live Server (alternative to Python server)

## Windows-Specific Setup

### PowerShell Execution Policy
If you encounter npm script execution issues on Windows:

1. Check current policy:
   ```powershell
   Get-ExecutionPolicy
   ```

2. If "Restricted", you have two options:
   
   **Option A: Change execution policy (requires admin)**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   
   **Option B: Use cmd instead of PowerShell**
   ```cmd
   cmd /c "npm [command]"
   ```

## Project Setup

### 1. Initialize Project
```bash
npm init -y
```

### 2. Install Development Dependencies
```bash
npm install -D jest @playwright/test eslint
```

### 3. Install Playwright Browsers
```bash
npx playwright install
```

### 4. Configure package.json Scripts
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "dev": "python -m http.server 8000",
    "test": "jest --coverage",
    "e2e": "playwright test"
  },
  "type": "module"
}
```

### 5. Verify Installation
Test each tool works:
```bash
# Test Jest
npm test

# Test development server (Ctrl+C to stop)
npm run dev

# Test Playwright
npx playwright --version

# Test ESLint
npx eslint --version
```

## Project Structure Requirements
The PRD expects this directory structure:
```
roadmap-tool/
├── docs/
│   └── PRD.md
├── src/
│   ├── index.html
│   ├── project-details.html
│   ├── launchpad.html
│   ├── styles/
│   │   └── main.css
│   └── js/
│       ├── app.js
│       ├── date-utils.js
│       ├── data-persistence-manager.js
│       ├── project-manager.js
│       ├── task-manager.js
│       ├── resource-manager.js
│       ├── financial-manager.js
│       ├── forecasting-engine.js
│       ├── csv-manager.js
│       ├── form-validation.js
│       ├── drag-drop-manager.js
│       ├── lineage-validator.js
│       └── prd-integration.js
└── tests/
    ├── fixtures/
    │   ├── seed.json
    │   ├── sample_simple.csv
    │   ├── sample_full.csv
    │   └── invalid.csv
    ├── unit/
    │   └── [module].test.js files
    └── e2e/
        └── ui.test.js
```

## Browser Requirements

### For Development
- **Chrome/Chromium**: v90+ (primary development target)
- **Firefox**: v88+ (cross-browser testing)
- **Safari**: v14+ (if on macOS)
- **Edge**: v90+ (Windows testing)

### For End Users
The application will run in any modern browser that supports:
- ES6 modules
- localStorage API
- File API (for CSV import/export)
- Drag and Drop API

## Optional Tools

### 1. ESLint Configuration
Create `.eslintrc.js`:
```javascript
export default {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'error',
    'no-undef': 'error'
  }
};
```

### 2. Jest Configuration
Create `jest.config.js`:
```javascript
export default {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/app.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

### 3. Playwright Configuration
Create `playwright.config.js`:
```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    port: 8000,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:8000'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

## Troubleshooting

### Common Issues

#### 1. "npm command not found"
- Ensure Node.js is installed and added to PATH
- Restart terminal after installation

#### 2. "python command not found"
- Install Python and add to PATH
- On some systems, use `python3` instead of `python`

#### 3. PowerShell execution policy errors
- Use the Windows-specific setup instructions above
- Or use Command Prompt instead of PowerShell

#### 4. Port 8000 already in use
- Kill existing processes: `netstat -ano | findstr :8000`
- Or change port in package.json: `"dev": "python -m http.server 8001"`

#### 5. Playwright browser installation fails
- Run with explicit chromium only: `npx playwright install chromium`
- Check internet connection and disk space

### Performance Considerations
- **RAM**: Minimum 4GB, 8GB+ recommended
- **Storage**: At least 2GB free space for dependencies and browsers
- **Network**: Stable internet connection for initial setup

## Security Notes
- The application runs locally and uses localStorage only
- No external API calls or data transmission
- CSV import/export happens client-side only
- Development server binds to localhost only

## Next Steps
After completing prerequisites:
1. Create the project structure
2. Implement modules as per PRD specification
3. Run tests to verify implementation
4. Use the development server for testing UI

---

**Last Updated**: January 2025  
**PRD Version**: v2.0  
**Tested On**: Windows 11, Node.js v24.8.0, Python v3.13.7