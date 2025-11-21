/**
 * WorkTemplateEngine - Template rendering engine with overlay support
 * 
 * Loads overlay templates from zip-mirror fixture and renders work items
 * with proper frontmatter, NZ dates, and base appendices.
 */

import DateUtils from '../../date-utils.js';

export default class WorkTemplateEngine {
  constructor({ overlaysSource, dateUtils }) {
    this.overlaysSource = overlaysSource || 'tests/fixtures/work/zip-mirror';
    this.dateUtils = dateUtils || DateUtils;
    this.overlays = {};
    this.baseTemplates = {};
    this.loaded = false;
  }

  /**
   * Load overlay templates from zip-mirror fixture
   */
  async loadOverlays() {
    try {
      // In a real implementation, this would load from zip files
      // For now, we'll simulate loading from the fixture directory
      this.overlays = {
        epic: await this._loadTemplate('epics/epics.instructions.md'),
        feature: await this._loadTemplate('features/features.instructions.md'),
        userstory: await this._loadTemplate('userstories/user_stories.instructions.md'),
        task: await this._loadTemplate('tasks/tasks.instructions.md'),
        issue: await this._loadTemplate('issues/issues.instructions.md')
      };

      this.baseTemplates = {
        security: await this._loadBaseTemplate('security.instructions.md'),
        standards: await this._loadBaseTemplate('standards.instructions.md'),
        rules: await this._loadBaseTemplate('rules.instructions.md')
      };

      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to load overlays: ${error.message}`);
    }
  }

  /**
   * Render a work item from source data
   * @param {string} type - 'epic'|'feature'|'userstory'|'task'|'issue'
   * @param {Object} src - Project or Task object
   * @param {Object} options - Additional rendering options
   * @returns {Object} Rendered work item with title, body, labels, assignees, frontmatter
   */
  render(type, src, options = {}) {
    if (!this.loaded) {
      throw new Error('Templates not loaded. Call loadOverlays() first.');
    }

    if (!this.overlays[type]) {
      throw new Error(`Overlay not found: ${type}`);
    }

    // Validate source has required fields
    const validation = this._validateSource(type, src);
    if (!validation.valid) {
      throw new Error(`Missing required field in source: ${validation.missing.join(', ')}`);
    }

    try {
      const template = this.overlays[type];
      
      // Render title with type prefix
      const title = this._renderTitle(type, src, options);
      
      // Render body with template substitution
      const body = this._renderBody(template, src, options);
      
      // Generate frontmatter with RT metadata and NZ dates
      const frontmatter = this._generateFrontmatter(type, src, options);
      
      // Generate labels based on mapping
      const labels = this._generateLabels(type, src, options);
      
      // Generate assignees
      const assignees = this._generateAssignees(type, src, options);

      return {
        title,
        body,
        labels,
        assignees,
        frontmatter
      };
    } catch (error) {
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * Validate rendered work item
   * @param {Object} rendered - Rendered work item
   * @returns {Object} Validation result
   */
  validateRendered(rendered) {
    const errors = [];

    // Validate title has proper prefix
    if (!rendered.title || !this._hasValidPrefix(rendered.title)) {
      errors.push('Title must include overlay prefix (e.g., [Epic] or [Story])');
    }

    // Validate body has required sections
    if (!rendered.body || !this._hasRequiredSections(rendered.body)) {
      errors.push('Body must include required sections from overlay');
    }

    // Validate NZ dates in frontmatter
    if (rendered.frontmatter) {
      const dateValidation = this._validateNZDatesInFrontmatter(rendered.frontmatter);
      if (!dateValidation.valid) {
        errors.push(`NZ date validation failed: ${dateValidation.error}`);
      }
    }

    // Validate base appendices are included
    if (!this._hasBaseAppendices(rendered.body)) {
      errors.push('Body must include base rules, security, and standards sections');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Private helper to simulate loading template from fixture
   */
  async _loadTemplate(path) {
    // In a real implementation, this would use fetch() or file system APIs
    // For testing, we return the template content as it would be loaded
    const templates = {
      'epics/epics.instructions.md': `# [Epic] {{project.title}}

## Problem
{{project.description}}

## Outcome
- Define clear measurable outcome.

## Scope
- In: ...
- Out: ...

## Acceptance Criteria
- AC1: ...
- AC2: ...

---
{{> base/security }}
{{> base/standards }}
{{> base/rules }}`,

      'features/features.instructions.md': `# [Feature] {{project.title}} - {{feature.name}}

## Context
{{project.description}}

## Feature Description
{{feature.description}}

## Value Proposition
- Business Value: {{feature.businessValue}}
- User Impact: {{feature.userImpact}}

## Requirements
- REQ1: ...
- REQ2: ...

## Dependencies
- Technical: ...
- Business: ...

## Acceptance Criteria
- Feature AC1: ...
- Feature AC2: ...

---
{{> base/security }}
{{> base/standards }}
{{> base/rules }}`,

      'userstories/user_stories.instructions.md': `# [Story] {{task.title}}

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
{{> base/rules }}`,

      'tasks/tasks.instructions.md': `# [Task] {{task.title}}

## Description
{{task.description}}

## Implementation Details
- Step 1: ...
- Step 2: ...
- Step 3: ...

## Testing Strategy
- Unit tests: ...
- Integration tests: ...
- Manual verification: ...

## Definition of Done
- [ ] Code complete and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Deployed to staging

---
{{> base/security }}
{{> base/standards }}
{{> base/rules }}`,

      'issues/issues.instructions.md': `# [Issue] {{issue.title}}

## Problem Description
{{issue.description}}

## Expected Behavior
{{issue.expectedBehavior}}

## Actual Behavior
{{issue.actualBehavior}}

## Steps to Reproduce
1. ...
2. ...
3. ...

## Impact
- Severity: {{issue.severity}}
- Affected Users: {{issue.affectedUsers}}
- Business Impact: {{issue.businessImpact}}

## Investigation Notes
- Initial findings: ...
- Root cause: ...

---
{{> base/security }}
{{> base/standards }}
{{> base/rules }}`
    };

    return templates[path] || '';
  }

  /**
   * Load base template content
   */
  async _loadBaseTemplate(filename) {
    const baseTemplates = {
      'security.instructions.md': `## Security Considerations
- Enforce least privilege.
- Handle PII per policy.`,
      
      'standards.instructions.md': `## Engineering Standards
- Lint, unit tests, code review.`,
      
      'rules.instructions.md': `## Delivery Rules
- Link work to roadmap.
- Use labels for status & priority.`
    };

    return baseTemplates[filename] || '';
  }

  /**
   * Validate source object has required fields
   */
  _validateSource(type, src) {
    const requiredFields = {
      epic: ['title', 'description'],
      feature: ['title', 'description'],
      userstory: ['title'],
      task: ['title'],
      issue: ['title', 'description']
    };

    const required = requiredFields[type] || [];
    const missing = required.filter(field => !src[field]);

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Render title with type prefix
   */
  _renderTitle(type, src, options) {
    const prefixes = {
      epic: '[Epic]',
      feature: '[Feature]',
      userstory: '[Story]',
      task: '[Task]',
      issue: '[Issue]'
    };

    const prefix = prefixes[type] || '[Work]';
    
    if (type === 'feature' && options.feature) {
      return `${prefix} ${src.title} - ${options.feature.name}`;
    }
    
    return `${prefix} ${src.title}`;
  }

  /**
   * Render body with template substitution and base appendices
   */
  _renderBody(template, src, options) {
    let body = template;

    // Simple template substitution (Mustache-like)
    body = body.replace(/{{project\.(\w+)}}/g, (match, prop) => src[prop] || '');
    body = body.replace(/{{task\.(\w+)}}/g, (match, prop) => src[prop] || '');
    body = body.replace(/{{issue\.(\w+)}}/g, (match, prop) => src[prop] || '');
    body = body.replace(/{{feature\.(\w+)}}/g, (match, prop) => 
      options.feature ? options.feature[prop] || '' : ''
    );

    // Replace base template includes
    body = body.replace(/{{> base\/security }}/g, this.baseTemplates.security);
    body = body.replace(/{{> base\/standards }}/g, this.baseTemplates.standards);
    body = body.replace(/{{> base\/rules }}/g, this.baseTemplates.rules);

    return body;
  }

  /**
   * Generate frontmatter with RT metadata and NZ dates
   */
  _generateFrontmatter(type, src, options) {
    const frontmatter = {};

    // Add RT project ID
    if (src.id && type === 'epic') {
      frontmatter.rt_project_id = src.id;
    } else if (src.project_id) {
      frontmatter.rt_project_id = src.project_id;
    }

    // Add RT task ID for stories/tasks
    if ((type === 'userstory' || type === 'task') && src.id) {
      frontmatter.rt_task_id = src.id;
    }

    // Add NZ formatted dates
    if (src.start_date) {
      frontmatter.start_date_nz = this._ensureNZFormat(src.start_date);
    }
    if (src.end_date) {
      frontmatter.end_date_nz = this._ensureNZFormat(src.end_date);
    }

    // Add status and priority
    if (src.status) {
      frontmatter.status = src.status;
    }
    if (src.priority || options.priority) {
      frontmatter.priority = src.priority || options.priority;
    }

    return frontmatter;
  }

  /**
   * Generate labels based on type and mapping
   */
  _generateLabels(type, src, options) {
    const labels = [`type:${type}`];

    // Add status labels
    if (src.status) {
      labels.push(`status:${src.status}`);
    }

    // Add priority labels
    if (src.priority) {
      labels.push(`priority:${src.priority}`);
    } else if (options.priority) {
      labels.push(`priority:${options.priority}`);
    }

    return labels;
  }

  /**
   * Generate assignees based on defaults
   */
  _generateAssignees(type, src, options) {
    const defaults = {
      epic: ['example-user'],
      feature: ['example-user'],
      userstory: [],
      task: [],
      issue: []
    };

    return options.assignees || defaults[type] || [];
  }

  /**
   * Ensure date is in NZ format (DD-MM-YYYY)
   */
  _ensureNZFormat(dateStr) {
    if (this.dateUtils.isValidNZ(dateStr)) {
      return dateStr;
    }

    try {
      // Try to parse and reformat
      const date = new Date(dateStr);
      return this.dateUtils.formatNZ(date);
    } catch {
      return dateStr; // Return as-is if can't parse
    }
  }

  /**
   * Validate title has proper prefix
   */
  _hasValidPrefix(title) {
    const prefixes = ['[Epic]', '[Feature]', '[Story]', '[Task]', '[Issue]'];
    return prefixes.some(prefix => title.startsWith(prefix));
  }

  /**
   * Check if body has required sections
   */
  _hasRequiredSections(body) {
    const requiredSections = ['## Acceptance Criteria'];
    return requiredSections.some(section => body.includes(section));
  }

  /**
   * Validate NZ dates in frontmatter
   */
  _validateNZDatesInFrontmatter(frontmatter) {
    const dateFields = ['start_date_nz', 'end_date_nz'];
    
    for (const field of dateFields) {
      if (frontmatter[field] && !this.dateUtils.isValidNZ(frontmatter[field])) {
        return {
          valid: false,
          error: `${field} must be in DD-MM-YYYY format`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Check if body includes base appendices
   */
  _hasBaseAppendices(body) {
    const requiredAppendices = [
      'Security Considerations',
      'Engineering Standards',
      'Delivery Rules'
    ];
    
    return requiredAppendices.every(appendix => body.includes(appendix));
  }
}