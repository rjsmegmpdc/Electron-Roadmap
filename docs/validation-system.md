# Roadmap Tool v2 - Data Validation System Documentation

## Overview

The validation system provides comprehensive, schema-based validation for all data entities in the Roadmap Tool v2 application. It centralizes validation logic, ensures data integrity, and provides user-friendly error reporting.

## Architecture

### Core Components

1. **BaseValidator** (`src/js/validators/base-validator.js`)
   - Foundational validation functionality
   - Common validation patterns (types, formats, constraints)
   - Extensible base class for specialized validators

2. **RoadmapValidator** (`src/js/validators/roadmap-validator.js`)
   - Domain-specific validation for roadmap entities
   - Business rule validation (circular dependencies, completion consistency)
   - Predefined schemas for roadmaps, milestones, tasks, settings

3. **ValidationManager** (`src/js/validators/validation-manager.js`)
   - Central facade for all validation operations
   - Validator registration and management
   - Performance tracking and statistics
   - Event integration

4. **ValidationResult & ValidationError** (`src/js/validators/base-validator.js`)
   - Structured error and warning handling
   - Field-level error reporting
   - Error code categorization

## Key Features

### 🔍 Schema-Based Validation
- JSON Schema-inspired validation definitions
- Type validation (string, number, integer, array, object, nz-date)
- Format validation (email, UUID, URL)
- Constraint validation (length, range, patterns)
- Enum validation for controlled vocabularies

### 🏗️ Domain-Specific Schemas
- **Roadmap Schema**: ID, title, milestones, metadata, versioning
- **Milestone Schema**: Dependencies, target dates, completion tracking
- **Task Schema**: Status, priority, effort tracking, dependencies
- **Settings Schema**: Application configuration validation
- **Preferences Schema**: User preference validation

### 🔄 Business Rules Validation
- Circular dependency detection for milestones and tasks
- Completion percentage consistency checks
- Status consistency validation (e.g., completed tasks must have completion dates)
- Date range validation and reasonableness checks

### 🌏 Localization Support
- New Zealand date format validation (DD-MM-YYYY)
- Date comparison and calculation utilities
- Configurable validation messages

### 📊 Error Management
- **ValidationError Class**: Structured error objects with field, message, code, and value
- **ValidationResult Class**: Comprehensive validation results with errors, warnings, and utility methods
- Field-level error reporting and aggregation
- Warning system for non-critical issues

### 🚀 Performance & Monitoring
- Schema caching for improved performance
- Validation history tracking
- Performance metrics and statistics
- Success rate monitoring

## Usage Examples

### Basic Field Validation

```javascript
import { validationManager } from './src/js/validators/index.js';

// Validate an email field
const emailResult = validationManager.validateWithSchema('user@example.com', {
  type: 'string',
  format: 'email',
  required: true
});

console.log(emailResult.valid); // true
```

### Roadmap Data Validation

```javascript
const roadmap = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Product Development Roadmap',
  milestones: [],
  createdAt: '01-01-2024',
  version: 1
};

const result = validationManager.validateRoadmap(roadmap);
if (!result.valid) {
  console.log('Validation errors:', result.getFieldMessages());
}
```

### Custom Schema Definition

```javascript
const customSchema = {
  type: 'object',
  required: ['name', 'priority'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    dueDate: { type: 'nz-date', required: false }
  }
};

const result = validationManager.validateWithSchema(data, customSchema);
```

## Schema Definitions

### Roadmap Schema
```javascript
{
  type: 'object',
  required: ['id', 'title', 'milestones', 'createdAt', 'version'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 2000 },
    milestones: { type: 'array', items: { $ref: '#/schemas/milestone' } },
    metadata: {
      type: 'object',
      properties: {
        category: { type: 'string', maxLength: 100 },
        tags: { type: 'array', items: { type: 'string' }, uniqueItems: true },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
      }
    },
    createdAt: { type: 'nz-date' },
    version: { type: 'integer', min: 1 }
  }
}
```

### Milestone Schema
```javascript
{
  type: 'object',
  required: ['id', 'title', 'targetDate', 'tasks'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', minLength: 1, maxLength: 150 },
    targetDate: { type: 'nz-date' },
    actualDate: { type: 'nz-date' },
    tasks: { type: 'array', items: { $ref: '#/schemas/task' } },
    dependencies: { type: 'array', items: { type: 'string', format: 'uuid' } },
    status: { type: 'string', enum: ['not-started', 'in-progress', 'completed', 'blocked', 'cancelled'] },
    completion: { type: 'integer', min: 0, max: 100 }
  }
}
```

### Task Schema
```javascript
{
  type: 'object',
  required: ['id', 'title', 'status'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 1000 },
    status: { type: 'string', enum: ['not-started', 'in-progress', 'completed', 'blocked', 'cancelled'] },
    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    assignee: { type: 'string', maxLength: 100 },
    dueDate: { type: 'nz-date' },
    completedDate: { type: 'nz-date' },
    effort: {
      type: 'object',
      properties: {
        estimated: { type: 'integer', min: 1 },
        actual: { type: 'integer', min: 0 }
      }
    }
  }
}
```

## Business Rules

### Circular Dependency Detection
The validation system automatically detects circular dependencies in milestone and task relationships:

```javascript
// This will be detected as invalid
const milestones = [
  { id: 'A', dependencies: ['B'] },
  { id: 'B', dependencies: ['C'] },
  { id: 'C', dependencies: ['A'] } // Circular reference
];
```

### Completion Consistency
Validates that completion percentages align with actual task completion:

```javascript
// This will generate a warning if completion doesn't match calculated value
const milestone = {
  tasks: [
    { status: 'completed' },
    { status: 'completed' },
    { status: 'in-progress' }
  ],
  completion: 67 // Should be ~67% (2/3 completed)
};
```

### Status Consistency
Ensures data consistency rules are enforced:

```javascript
// This will fail validation
const task = {
  status: 'completed',
  // Missing required completedDate
};
```

## Integration

### Event System Integration
```javascript
// Listen for validation events
eventBus.on('validation:failed', (event) => {
  console.log('Validation failed:', event.errors);
});

eventBus.on('validation:completed', (event) => {
  console.log('Validation completed:', event.valid);
});
```

### Configuration Integration
```javascript
// Validation behavior can be configured
configManager.set('validation.strict', true);
configManager.set('validation.allowNull', false);
```

### Logger Integration
```javascript
// Validation operations are automatically logged
// with appropriate log levels (debug, info, warn, error)
```

## Convenience Functions

The validation system provides helper functions for common operations:

```javascript
import { 
  isValid, 
  validateRoadmap, 
  validateMilestone, 
  validateTask,
  schemas,
  patterns 
} from './src/js/validators/index.js';

// Quick validation check
if (!isValid(email, schemas.email())) {
  showError('Invalid email address');
}

// Pre-built schema helpers
const userSchema = {
  name: schemas.string(1, 100, true),
  email: schemas.email(),
  age: schemas.integer(0, 150, false)
};
```

## Error Codes

| Code | Description |
|------|-------------|
| `REQUIRED` | Field is required but missing |
| `INVALID_TYPE` | Value type doesn't match schema |
| `MIN_LENGTH` | String is shorter than minimum length |
| `MAX_LENGTH` | String is longer than maximum length |
| `MIN_VALUE` | Number is below minimum value |
| `MAX_VALUE` | Number is above maximum value |
| `INVALID_EMAIL` | String is not a valid email format |
| `INVALID_UUID` | String is not a valid UUID format |
| `INVALID_NZ_DATE` | String is not a valid NZ date format |
| `INVALID_ENUM` | Value is not in allowed enum values |
| `CIRCULAR_DEPENDENCY` | Circular dependency detected |
| `MISSING_COMPLETION_DATE` | Completed item missing completion date |
| `DUPLICATE_ITEMS` | Array contains duplicate items |

## Performance Considerations

### Schema Caching
- Schemas are cached after first retrieval
- Cache can be cleared when configuration changes
- Improves validation performance for repeated operations

### Validation History
- Last 1000 validation operations are tracked
- Provides insights into validation patterns
- Can be cleared to free memory

### Statistics Tracking
```javascript
const stats = validationManager.getValidationStats();
console.log('Success rate:', stats.successRate + '%');
console.log('Most common errors:', stats.errorCounts);
```

## Testing

The validation system includes comprehensive tests covering:

- All validation rules and constraints
- Business logic validation
- Error handling and edge cases
- Performance characteristics
- Integration with other systems

Tests are located in `tests/unit/validators.test.js` and can be run with the project's test suite.

## Extension and Customization

### Creating Custom Validators

```javascript
import BaseValidator from './base-validator.js';

class CustomValidator extends BaseValidator {
  constructor(options) {
    super(options);
    this.initializeCustomSchemas();
  }
  
  initializeCustomSchemas() {
    this.schemas = {
      customEntity: this.createCustomEntitySchema()
    };
  }
  
  validateCustomEntity(data) {
    const result = this.validate(data, this.schemas.customEntity, 'customEntity');
    // Add custom business rules
    if (result.valid && data) {
      this._validateCustomBusinessRules(data, result);
    }
    return result;
  }
}
```

### Registering Custom Validators

```javascript
const customValidator = new CustomValidator();
validationManager.registerValidator('custom', customValidator);
```

## Migration and Versioning

The validation system supports data versioning for future migrations:

```javascript
const importData = {
  version: 2,
  data: { /* ... */ }
};

// Validates version compatibility
const result = validationManager.validateImportData(importData);
if (!result.valid) {
  console.log('Import data validation failed');
}
```

## Best Practices

1. **Always validate user inputs** before processing
2. **Use appropriate error codes** for different validation failures
3. **Provide user-friendly error messages** through field message formatting
4. **Cache validation schemas** for performance-critical operations
5. **Monitor validation statistics** to identify common data quality issues
6. **Handle validation warnings** appropriately (don't ignore them)
7. **Use business rule validation** to ensure data consistency
8. **Test validation logic thoroughly** with edge cases

## Future Enhancements

Potential future improvements to the validation system:

- Async validation support for remote data validation
- Custom validation rule plugins
- Internationalization of error messages  
- Schema inheritance and composition
- Conditional validation rules
- Real-time validation feedback
- Integration with form validation libraries

## Conclusion

The validation system provides a robust, comprehensive foundation for ensuring data integrity throughout the Roadmap Tool v2 application. Its modular design allows for easy extension and customization while providing excellent performance and detailed error reporting.