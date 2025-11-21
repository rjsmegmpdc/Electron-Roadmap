/**
 * FormValidation - Client-side field validation
 * 
 * Provides validation functions for all form fields with consistent
 * error messages matching the manager validation rules.
 */

import DateUtils from './date-utils.js';

export default class FormValidation {
  /**
   * Validate project form data
   * @param {Object} fields - Form field values
   * @returns {Object} Validation result with valid flag and errors
   */
  static validateProjectForm(fields) {
    const errors = {};
    let valid = true;

    // Title validation
    if (!fields.title || fields.title.trim() === '') {
      errors.title = 'Project title is required';
      valid = false;
    }

    // Start date validation
    if (!fields.start_date || !DateUtils.isValidNZ(fields.start_date)) {
      errors.start_date = 'Valid start date is required (DD-MM-YYYY format)';
      valid = false;
    }

    // End date validation
    if (!fields.end_date || !DateUtils.isValidNZ(fields.end_date)) {
      errors.end_date = 'Valid end date is required (DD-MM-YYYY format)';
      valid = false;
    }

    // Date comparison validation
    if (fields.start_date && fields.end_date && 
        DateUtils.isValidNZ(fields.start_date) && DateUtils.isValidNZ(fields.end_date)) {
      if (DateUtils.compareNZ(fields.start_date, fields.end_date) >= 0) {
        errors.end_date = 'Project end date must be after start date';
        valid = false;
      }
    }

    // Budget validation
    if (fields.budget_cents === undefined || fields.budget_cents === null || 
        isNaN(fields.budget_cents) || fields.budget_cents < 0) {
      errors.budget_cents = 'Budget must be >= 0';
      valid = false;
    }

    // Financial treatment validation
    const validTreatments = ['CAPEX', 'OPEX', 'MIXED'];
    if (!fields.financial_treatment || !validTreatments.includes(fields.financial_treatment)) {
      errors.financial_treatment = 'Financial treatment is required';
      valid = false;
    }

    return { valid, errors };
  }

  /**
   * Validate task form data
   * @param {Object} fields - Form field values
   * @returns {Object} Validation result with valid flag and errors
   */
  static validateTaskForm(fields) {
    const errors = {};
    let valid = true;

    // Title validation
    if (!fields.title || fields.title.trim() === '') {
      errors.title = 'Task title is required';
      valid = false;
    }

    // Start date validation
    if (!fields.start_date || !DateUtils.isValidNZ(fields.start_date)) {
      errors.start_date = 'Valid start date is required (DD-MM-YYYY format)';
      valid = false;
    }

    // End date validation
    if (!fields.end_date || !DateUtils.isValidNZ(fields.end_date)) {
      errors.end_date = 'Valid end date is required (DD-MM-YYYY format)';
      valid = false;
    }

    // Date comparison validation
    if (fields.start_date && fields.end_date && 
        DateUtils.isValidNZ(fields.start_date) && DateUtils.isValidNZ(fields.end_date)) {
      if (DateUtils.compareNZ(fields.start_date, fields.end_date) >= 0) {
        errors.end_date = 'Task end date must be after start date';
        valid = false;
      }
    }

    // Effort hours validation
    if (fields.effort_hours === undefined || fields.effort_hours === null || 
        isNaN(fields.effort_hours) || fields.effort_hours < 0) {
      errors.effort_hours = 'Effort hours must be >= 0';
      valid = false;
    }

    return { valid, errors };
  }

  /**
   * Validate resource form data
   * @param {Object} fields - Form field values
   * @returns {Object} Validation result with valid flag and errors
   */
  static validateResourceForm(fields) {
    const errors = {};
    let valid = true;

    // Name validation
    if (!fields.name || fields.name.trim() === '') {
      errors.name = 'Resource name is required';
      valid = false;
    }

    // Type validation
    const validTypes = ['internal', 'contractor', 'vendor'];
    if (!fields.type || !validTypes.includes(fields.type)) {
      errors.type = 'Valid resource type is required';
      valid = false;
    }

    // Allocation validation
    if (fields.allocation === undefined || fields.allocation === null || 
        isNaN(fields.allocation) || fields.allocation < 0 || fields.allocation > 1) {
      errors.allocation = 'Allocation must be between 0 and 1';
      valid = false;
    }

    // Rate validation for contractors and vendors
    if ((fields.type === 'contractor' || fields.type === 'vendor')) {
      if (fields.rate_per_hour === undefined || fields.rate_per_hour === null || 
          isNaN(fields.rate_per_hour) || fields.rate_per_hour <= 0) {
        errors.rate_per_hour = 'Rate per hour must be > 0 for contractors and vendors';
        valid = false;
      }
    }

    return { valid, errors };
  }
}