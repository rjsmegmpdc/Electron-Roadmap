# Sample Data Documentation

This directory contains comprehensive sample data for the Roadmap Tool v2 project system. The sample data is designed to support development, testing, and validation of all project management features.

## 📁 Directory Structure

```
Docs/sample-data/
├── README.md                    # This overview document
├── project-examples.md          # Complete project examples for all statuses
├── field-formats.md            # Field format specifications and examples
├── validation-rules.md         # Validation rules with examples
├── status-gates.md             # Status gate documentation with test cases
├── enum-values.md              # All enumeration values supported
├── edge-cases.md               # Boundary conditions and special cases
└── integration-examples.md     # Usage examples for development and testing
```

## 🎯 Purpose

The sample data serves multiple purposes:

### **Development Support**
- Provides realistic data for UI development
- Enables consistent testing across team members
- Demonstrates proper field formats and relationships

### **Testing Validation**
- Covers all positive test scenarios
- Includes negative test cases for validation
- Provides edge cases and boundary conditions

### **Documentation Examples**
- Shows correct usage patterns
- Demonstrates business rules enforcement
- Provides integration examples

## 📊 Data Coverage

### **Project Lifecycle Statuses**
- ✅ **concept-design** - Minimal requirements, no budget needed
- ✅ **solution-design** - Budget required (> 0)
- ✅ **engineering** - Tasks required (length > 0)
- ✅ **uat** - Forecasts required (length > 0)
- ✅ **release** - All tasks must be completed

### **Project Lanes**
- ✅ **office365** - Microsoft Office 365 projects
- ✅ **euc** - End User Computing projects
- ✅ **compliance** - Compliance and governance projects
- ✅ **other** - General IT projects

### **Financial Treatments**
- ✅ **CAPEX** - Capital expenditure projects
- ✅ **OPEX** - Operational expenditure projects
- ✅ **MIXED** - Combined CAPEX and OPEX projects

### **Date Formats**
- ✅ **Valid NZ Dates** - DD-MM-YYYY format examples
- ✅ **Invalid Dates** - Common format errors for validation testing
- ✅ **Edge Cases** - Leap years, month boundaries, year transitions

### **Budget Examples**
- ✅ **Zero Budget** - Valid for concept-design phase
- ✅ **Typical Budgets** - Realistic project budget ranges
- ✅ **Large Budgets** - High-value enterprise projects
- ✅ **Invalid Budgets** - Negative values for validation testing

## 🔗 Integration with Code

The sample data is directly integrated with the test suite:

```javascript
// Import from test fixtures
import { VALID_PROJECTS, INVALID_DATA, createTestProject } from '../tests/fixtures/sample-projects.js';

// Use in development
const sampleProject = createTestProject({
  title: 'My Development Project',
  lane: 'office365'
});
```

## 📋 Quick Reference

| Document | Purpose | Use Cases |
|----------|---------|-----------|
| `project-examples.md` | Complete project samples | Development, UI testing, demos |
| `field-formats.md` | Field specifications | Form validation, data entry |
| `validation-rules.md` | Business rules | Validation logic, error handling |
| `status-gates.md` | Lifecycle transitions | Workflow implementation |
| `enum-values.md` | Dropdown options | UI dropdowns, validation |
| `edge-cases.md` | Boundary conditions | Robustness testing |
| `integration-examples.md` | Usage patterns | Development workflows |

## 🚀 Getting Started

1. **For Developers**: Start with `project-examples.md` to see complete project structures
2. **For Testers**: Review `validation-rules.md` for comprehensive test scenarios  
3. **For UI Designers**: Use `field-formats.md` for form design specifications
4. **For Integration**: Check `integration-examples.md` for usage patterns

## 📝 Data Format Standards

- **Dates**: New Zealand format DD-MM-YYYY
- **Currency**: All amounts in cents (integer values)
- **IDs**: Generated format `proj-{timestamp}-{random}` or custom strings
- **Status**: Lowercase with hyphens (e.g., 'concept-design')
- **Financial Treatment**: Uppercase (e.g., 'CAPEX')

## 🔄 Maintenance

This sample data is maintained alongside the codebase and updated when:
- New fields are added to the project schema
- New validation rules are implemented
- New status gates are introduced
- New enum values are supported

For questions or updates, refer to the test fixtures in `tests/fixtures/sample-projects.js`.