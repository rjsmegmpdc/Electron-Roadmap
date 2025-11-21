/**
 * WorkValidation - Validates work items against rules, security, and standards
 * 
 * Provides validation for titles, sections, NZ dates, and priorities
 * according to the governance rules defined in the sub-PRD.
 */

import DateUtils from '../../date-utils.js';

export default class WorkValidation {
  constructor({ rulesDoc, securityDoc, standardsDoc }) {
    this.rulesDoc = rulesDoc || this._getDefaultRulesDoc();
    this.securityDoc = securityDoc || this._getDefaultSecurityDoc();
    this.standardsDoc = standardsDoc || this._getDefaultStandardsDoc();
  }

  /**
   * Validate title format and prefix
   * @param {string} title - The title to validate
   * @param {string} type - Work item type (epic, feature, userstory, task, issue)
   * @returns {Object} Validation result
   */
  validateTitle(title, type) {
    if (!title || typeof title !== 'string') {
      return {
        valid: false,
        error: 'Title is required and must be a string'
      };
    }

    const validPrefixes = {
      epic: '[Epic]',
      feature: '[Feature]', 
      userstory: '[Story]',
      task: '[Task]',
      issue: '[Issue]'
    };

    const expectedPrefix = validPrefixes[type];
    if (!expectedPrefix) {
      return {
        valid: false,
        error: `Unknown work item type: ${type}`
      };
    }

    if (!title.startsWith(expectedPrefix)) {
      return {
        valid: false,
        error: `Title must start with ${expectedPrefix} prefix`
      };
    }

    // Check minimum length after prefix
    const titleContent = title.substring(expectedPrefix.length).trim();
    if (titleContent.length < 3) {
      return {
        valid: false,
        error: 'Title content must be at least 3 characters after prefix'
      };
    }

    // Check maximum length
    if (title.length > 200) {
      return {
        valid: false,
        error: 'Title must not exceed 200 characters'
      };
    }

    return { valid: true };
  }

  /**
   * Validate required sections in body
   * @param {string} body - The body content to validate
   * @param {string} type - Work item type
   * @returns {Object} Validation result
   */
  validateSections(body, type) {
    if (!body || typeof body !== 'string') {
      return {
        valid: false,
        missing: ['Body content is required']
      };
    }

    const requiredSections = this._getRequiredSections(type);
    const missing = [];

    for (const section of requiredSections) {
      if (!body.includes(section)) {
        missing.push(section);
      }
    }

    // Check for base appendices (security, standards, rules)
    const baseAppendices = [
      'Security Considerations',
      'Engineering Standards', 
      'Delivery Rules'
    ];

    for (const appendix of baseAppendices) {
      if (!body.includes(appendix)) {
        missing.push(appendix);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Validate NZ date format in frontmatter
   * @param {Object} frontmatter - Frontmatter object with dates
   * @returns {Object} Validation result
   */
  validateNZDates(frontmatter) {
    if (!frontmatter || typeof frontmatter !== 'object') {
      return { valid: true }; // No dates to validate
    }

    const dateFields = ['start_date_nz', 'end_date_nz'];
    
    for (const field of dateFields) {
      if (frontmatter[field]) {
        if (!DateUtils.isValidNZ(frontmatter[field])) {
          return {
            valid: false,
            error: `${field} must be in DD-MM-YYYY format`
          };
        }
      }
    }

    // Validate date logic if both dates present
    if (frontmatter.start_date_nz && frontmatter.end_date_nz) {
      try {
        const comparison = DateUtils.compareNZ(
          frontmatter.start_date_nz, 
          frontmatter.end_date_nz
        );
        
        if (comparison >= 0) {
          return {
            valid: false,
            error: 'End date must be after start date'
          };
        }
      } catch (error) {
        return {
          valid: false,
          error: `Date comparison failed: ${error.message}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate priority value
   * @param {string} priorityLabelOrField - Priority as label or field value
   * @returns {Object} Validation result
   */
  validatePriority(priorityLabelOrField) {
    if (!priorityLabelOrField) {
      return { valid: true }; // Priority is optional
    }

    const validPriorities = ['P1', 'P2', 'P3', 'P4'];
    const validPriorityLabels = validPriorities.map(p => `priority:${p}`);
    
    // Check if it's a direct priority value or a label
    const isValid = validPriorities.includes(priorityLabelOrField) ||
                   validPriorityLabels.includes(priorityLabelOrField);

    if (!isValid) {
      return {
        valid: false,
        error: `Priority must be one of: ${validPriorities.join(', ')} or ${validPriorityLabels.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Comprehensive validation of a complete work item
   * @param {Object} workItem - Complete work item with title, body, frontmatter
   * @param {string} type - Work item type
   * @returns {Object} Comprehensive validation result
   */
  validateWorkItem(workItem, type) {
    const errors = [];
    
    // Validate title
    const titleValidation = this.validateTitle(workItem.title, type);
    if (!titleValidation.valid) {
      errors.push(`Title: ${titleValidation.error}`);
    }

    // Validate sections
    const sectionsValidation = this.validateSections(workItem.body, type);
    if (!sectionsValidation.valid) {
      errors.push(`Missing sections: ${sectionsValidation.missing.join(', ')}`);
    }

    // Validate NZ dates
    const dateValidation = this.validateNZDates(workItem.frontmatter);
    if (!dateValidation.valid) {
      errors.push(`Date: ${dateValidation.error}`);
    }

    // Validate priority if present
    if (workItem.frontmatter && workItem.frontmatter.priority) {
      const priorityValidation = this.validatePriority(workItem.frontmatter.priority);
      if (!priorityValidation.valid) {
        errors.push(`Priority: ${priorityValidation.error}`);
      }
    }

    // Validate governance rules compliance
    const governanceValidation = this._validateGovernanceCompliance(workItem, type);
    if (!governanceValidation.valid) {
      errors.push(...governanceValidation.errors.map(e => `Governance: ${e}`));
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate against security requirements
   * @param {Object} workItem - Work item to validate
   * @returns {Object} Security validation result
   */
  validateSecurity(workItem) {
    const securityIssues = [];

    // Check for PII handling requirements
    if (this._containsPIIReferences(workItem.body)) {
      if (!this._hasSecurityConsiderations(workItem.body)) {
        securityIssues.push('Work items referencing PII must include security considerations');
      }
    }

    // Check for authentication/authorization requirements
    if (this._requiresAuth(workItem.body)) {
      if (!this._hasAuthSecurity(workItem.body)) {
        securityIssues.push('Work items with auth requirements must include least privilege considerations');
      }
    }

    return {
      valid: securityIssues.length === 0,
      issues: securityIssues
    };
  }

  /**
   * Get required sections based on work item type
   * @private
   */
  _getRequiredSections(type) {
    const sectionsByType = {
      epic: ['## Problem', '## Outcome', '## Scope', '## Acceptance Criteria'],
      feature: ['## Context', '## Feature Description', '## Value Proposition', '## Requirements', '## Acceptance Criteria'],
      userstory: ['## As a', '## I want', '## So that', '## Acceptance Criteria'],
      task: ['## Description', '## Implementation Details', '## Definition of Done'],
      issue: ['## Problem Description', '## Expected Behavior', '## Actual Behavior', '## Impact']
    };

    return sectionsByType[type] || ['## Acceptance Criteria'];
  }

  /**
   * Validate governance compliance
   * @private
   */
  _validateGovernanceCompliance(workItem, type) {
    const errors = [];

    // Check RT metadata requirements
    if (!workItem.frontmatter) {
      errors.push('Missing frontmatter with RT metadata');
    } else {
      // Epics must have rt_project_id
      if (type === 'epic' && !workItem.frontmatter.rt_project_id) {
        errors.push('Epic must have rt_project_id in frontmatter');
      }

      // Stories and tasks must have both rt_project_id and rt_task_id
      if ((type === 'userstory' || type === 'task')) {
        if (!workItem.frontmatter.rt_project_id) {
          errors.push(`${type} must have rt_project_id in frontmatter`);
        }
        if (!workItem.frontmatter.rt_task_id) {
          errors.push(`${type} must have rt_task_id in frontmatter`);
        }
      }
    }

    // Check labels compliance
    if (!workItem.labels || !Array.isArray(workItem.labels)) {
      errors.push('Work item must have labels array');
    } else {
      const hasTypeLabel = workItem.labels.some(label => label.startsWith('type:'));
      if (!hasTypeLabel) {
        errors.push('Work item must have a type label');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if content contains PII references
   * @private
   */
  _containsPIIReferences(body) {
    const piiKeywords = [
      'personal data', 'pii', 'customer data', 'user information',
      'email address', 'phone number', 'address', 'social security'
    ];
    
    const lowerBody = body.toLowerCase();
    return piiKeywords.some(keyword => lowerBody.includes(keyword));
  }

  /**
   * Check if work item has security considerations
   * @private
   */
  _hasSecurityConsiderations(body) {
    return body.includes('Security Considerations') || 
           body.includes('security') || 
           body.includes('privacy');
  }

  /**
   * Check if work item requires authentication
   * @private
   */
  _requiresAuth(body) {
    const authKeywords = ['login', 'authentication', 'authorization', 'permission', 'access control'];
    const lowerBody = body.toLowerCase();
    return authKeywords.some(keyword => lowerBody.includes(keyword));
  }

  /**
   * Check if work item includes auth security considerations
   * @private
   */
  _hasAuthSecurity(body) {
    const authSecurityKeywords = ['least privilege', 'role-based', 'permissions'];
    const lowerBody = body.toLowerCase();
    return authSecurityKeywords.some(keyword => lowerBody.includes(keyword));
  }

  /**
   * Get default rules documentation
   * @private
   */
  _getDefaultRulesDoc() {
    return `
Delivery Rules:
- Link work to roadmap
- Use labels for status & priority  
- Include RT metadata in frontmatter
- Follow template structure
    `;
  }

  /**
   * Get default security documentation
   * @private
   */
  _getDefaultSecurityDoc() {
    return `
Security Requirements:
- Enforce least privilege
- Handle PII per policy
- Include security considerations for auth work
- Validate all user inputs
    `;
  }

  /**
   * Get default standards documentation
   * @private
   */
  _getDefaultStandardsDoc() {
    return `
Engineering Standards:
- Lint, unit tests, code review
- Follow coding standards
- Include documentation
- Validate in staging environment
    `;
  }
}