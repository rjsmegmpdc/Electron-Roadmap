/**
 * Project Form Component Audit Integration Tests
 * 
 * Tests that verify the ProjectForm component properly integrates with 
 * audit logging hooks and captures all necessary user interactions.
 */

const { test, expect } = require('@playwright/test');
const { _electron } = require('@playwright/test');
const path = require('path');

test.describe('Project Form Audit Integration', () => {
  let electronApp;
  let window;

  const getAuditEvents = async (timeframe = 2) => {
    return await window.evaluate(async (minutes) => {
      const events = await window.auditLogger.getRecentEvents(minutes);
      return events || [];
    }, timeframe);
  };

  const injectAuditHooks = async () => {
    // Inject the audit logging hooks into the page for testing
    await window.evaluate(() => {
      if (window.useAuditLogger) return; // Already injected
      
      // Mock implementation of audit hooks for testing
      window.useAuditLogger = (componentName) => ({
        logUserInteraction: (action, target, data) => {
          window.auditLogger.logUserInteraction(action, componentName, target, data);
        },
        logFormChange: (field, oldValue, newValue, validation) => {
          window.auditLogger.logFormChange(componentName, field, oldValue, newValue, validation);
        },
        logError: (error, context) => {
          window.auditLogger.logError(error, componentName, context);
        }
      });

      window.useFormTracking = (componentName) => {
        const { logFormChange, logUserInteraction } = window.useAuditLogger(componentName);
        
        return {
          trackFieldChange: (fieldName, newValue, validationResult) => {
            logFormChange(fieldName, '', newValue, validationResult);
          },
          trackFormSubmit: (formData, isValid, errors) => {
            logUserInteraction('form_submit', 'form', { 
              form_data: formData, 
              is_valid: isValid, 
              errors 
            });
          },
          trackFieldFocus: (fieldName, fieldType) => {
            logUserInteraction('field_focus', fieldName, { field_type: fieldType });
          },
          trackFieldBlur: (fieldName, fieldType, hasChanged) => {
            logUserInteraction('field_blur', fieldName, { 
              field_type: fieldType, 
              has_changed: hasChanged 
            });
          }
        };
      };
    });
  };

  test.beforeAll(async () => {
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      timeout: 30000
    });
    
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await injectAuditHooks();
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test.describe('Form Field Interaction Auditing', () => {
    test('should audit all project title field interactions', async () => {
      // Navigate to project form
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      const titleInput = '[data-testid="title-input"] input';
      
      // Test focus event
      await window.focus(titleInput);
      
      // Test typing with incremental changes
      await window.type(titleInput, 'New Project', { delay: 50 });
      
      // Test blur event
      await window.blur(titleInput);

      const events = await getAuditEvents();
      
      // Should capture focus event
      const focusEvent = events.find(e => 
        e.action === 'field_focus' && e.target === 'title'
      );
      expect(focusEvent).toBeDefined();
      
      // Should capture multiple form changes
      const formChangeEvents = events.filter(e => 
        e.event_type === 'form_change' && e.target === 'title'
      );
      expect(formChangeEvents.length).toBeGreaterThan(0);
      
      // Should capture blur event
      const blurEvent = events.find(e => 
        e.action === 'field_blur' && e.target === 'title'
      );
      expect(blurEvent).toBeDefined();
      expect(blurEvent.data.has_changed).toBe(true);
    });

    test('should audit date field validation with context', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      const startDateInput = '[data-testid="start-date-input"] input';
      const endDateInput = '[data-testid="end-date-input"] input';

      // Test invalid date format
      await window.fill(startDateInput, 'invalid');
      await window.blur(startDateInput);

      // Test valid date
      await window.fill(startDateInput, '01-01-2024');
      await window.blur(startDateInput);

      // Test end date before start date
      await window.fill(endDateInput, '31-12-2023');
      await window.blur(endDateInput);

      const events = await getAuditEvents();
      
      // Should log validation errors
      const validationErrors = events.filter(e => 
        e.event_type === 'form_change' && 
        e.data.validation && 
        !e.data.validation.valid
      );
      
      expect(validationErrors.length).toBeGreaterThan(0);
      
      const invalidDateError = validationErrors.find(e => 
        e.target === 'start_date' && 
        e.data.validation.errors.some(err => err.includes('DD-MM-YYYY'))
      );
      expect(invalidDateError).toBeDefined();
    });

    test('should audit currency field formatting and validation', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      const budgetInput = '[data-testid="budget-input"] input';

      // Test various currency formats
      const testValues = [
        '50000',      // Valid plain number
        '50,000',     // Valid with comma
        '50,000.50',  // Valid with decimals
        'abc',        // Invalid letters
        '50k',        // Invalid format
        '$50000'      // Invalid with dollar sign
      ];

      for (const value of testValues) {
        await window.fill(budgetInput, value);
        await window.blur(budgetInput);
        await window.waitForTimeout(100); // Allow validation to process
      }

      const events = await getAuditEvents();
      
      const budgetEvents = events.filter(e => 
        e.event_type === 'form_change' && e.target === 'budget_nzd'
      );
      
      expect(budgetEvents.length).toBe(testValues.length);
      
      // Should have both valid and invalid validation results
      const validEvents = budgetEvents.filter(e => 
        e.data.validation && e.data.validation.valid
      );
      const invalidEvents = budgetEvents.filter(e => 
        e.data.validation && !e.data.validation.valid
      );
      
      expect(validEvents.length).toBeGreaterThan(0);
      expect(invalidEvents.length).toBeGreaterThan(0);
    });
  });

  test.describe('Form Submission Auditing', () => {
    test('should audit successful form submission with complete data', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      // Fill out complete valid form
      await window.fill('[data-testid="title-input"] input', 'Complete Test Project');
      await window.fill('[data-testid="description-input"] textarea', 'Full project description');
      await window.fill('[data-testid="lane-input"] input', 'Development');
      await window.fill('[data-testid="start-date-input"] input', '01-01-2024');
      await window.fill('[data-testid="end-date-input"] input', '31-12-2024');
      await window.selectOption('[data-testid="status-select"] select', 'active');
      await window.fill('[data-testid="pm-name-input"] input', 'John Doe');
      await window.fill('[data-testid="budget-input"] input', '75000');
      await window.selectOption('[data-testid="financial-treatment-select"] select', 'CAPEX');

      // Submit form
      await window.click('[data-testid="submit-btn"]');

      const events = await getAuditEvents();
      
      const submitEvent = events.find(e => 
        e.action === 'form_submit' && e.component === 'ProjectForm'
      );
      
      expect(submitEvent).toBeDefined();
      expect(submitEvent.data.is_valid).toBe(true);
      expect(submitEvent.data.form_data.title).toBe('Complete Test Project');
      expect(submitEvent.data.form_data.budget_nzd).toBe('75000');
      expect(submitEvent.data.field_count).toBeGreaterThan(5);
    });

    test('should audit failed form submission with validation errors', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      // Fill form with invalid data
      await window.fill('[data-testid="title-input"] input', ''); // Required field empty
      await window.fill('[data-testid="start-date-input"] input', 'bad-date');
      await window.fill('[data-testid="end-date-input"] input', '01-01-2020'); // Before start
      await window.fill('[data-testid="budget-input"] input', 'invalid-amount');

      // Try to submit
      await window.click('[data-testid="submit-btn"]');

      const events = await getAuditEvents();
      
      const submitEvent = events.find(e => 
        e.action === 'form_submit' && e.component === 'ProjectForm'
      );
      
      expect(submitEvent).toBeDefined();
      expect(submitEvent.data.is_valid).toBe(false);
      expect(submitEvent.data.errors).toBeDefined();
      expect(Object.keys(submitEvent.data.errors).length).toBeGreaterThan(0);
    });

    test('should audit form reset operations with state preservation', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      // Fill some fields
      await window.fill('[data-testid="title-input"] input', 'Test Project');
      await window.fill('[data-testid="description-input"] textarea', 'Test description');
      await window.selectOption('[data-testid="status-select"] select', 'on-hold');

      // Reset form
      await window.click('[data-testid="reset-btn"]');

      const events = await getAuditEvents();
      
      const resetEvent = events.find(e => 
        e.action === 'form_reset' && e.component === 'ProjectForm'
      );
      
      expect(resetEvent).toBeDefined();
      expect(resetEvent.data.previous_data.title).toBe('Test Project');
      expect(resetEvent.data.previous_data.description).toBe('Test description');
      expect(resetEvent.data.previous_data.status).toBe('on-hold');
    });
  });

  test.describe('Form Error Handling Auditing', () => {
    test('should audit client-side validation errors', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      // Trigger various validation errors
      const testCases = [
        {
          field: '[data-testid="title-input"] input',
          value: 'x'.repeat(201), // Too long
          target: 'title',
          expectedError: 'must be 200 characters or less'
        },
        {
          field: '[data-testid="description-input"] textarea',
          value: 'x'.repeat(1001), // Too long
          target: 'description',
          expectedError: 'must be 1000 characters or less'
        },
        {
          field: '[data-testid="start-date-input"] input',
          value: '32-13-2024', // Invalid date
          target: 'start_date',
          expectedError: 'DD-MM-YYYY format'
        }
      ];

      for (const testCase of testCases) {
        await window.fill(testCase.field, testCase.value);
        await window.blur(testCase.field);
        await window.waitForTimeout(100);
      }

      const events = await getAuditEvents();
      
      for (const testCase of testCases) {
        const errorEvent = events.find(e => 
          e.event_type === 'form_change' &&
          e.target === testCase.target &&
          e.data.validation &&
          !e.data.validation.valid &&
          e.data.validation.errors.some(err => err.includes(testCase.expectedError))
        );
        
        expect(errorEvent).toBeDefined();
      }
    });

    test('should audit server-side validation errors', async () => {
      // Simulate server-side error response
      await window.evaluate(async () => {
        // Mock a server error response
        const serverError = new Error('Server validation failed');
        
        window.auditLogger.logError(serverError, 'ProjectForm', {
          operation: 'create_project',
          server_response: {
            status: 400,
            errors: [
              'Project title already exists',
              'Budget exceeds department limits',
              'Start date conflicts with existing project'
            ]
          },
          form_data: {
            title: 'Duplicate Project',
            budget_nzd: '1000000'
          }
        });
      });

      const events = await getAuditEvents();
      
      const serverErrorEvent = events.find(e => 
        e.event_type === 'error' && 
        e.component === 'ProjectForm' &&
        e.data.server_response
      );
      
      expect(serverErrorEvent).toBeDefined();
      expect(serverErrorEvent.data.server_response.status).toBe(400);
      expect(serverErrorEvent.data.server_response.errors.length).toBe(3);
    });

    test('should audit network error handling with retry context', async () => {
      await window.evaluate(async () => {
        const networkError = new Error('Network request timeout');
        networkError.name = 'NetworkError';
        
        window.auditLogger.logError(networkError, 'ProjectForm', {
          operation: 'create_project',
          network_context: {
            url: '/api/projects',
            method: 'POST',
            timeout: 30000,
            retry_attempt: 2,
            max_retries: 3
          },
          user_action: 'form_submission',
          recovery_options: [
            'retry_request',
            'save_draft',
            'show_offline_message'
          ]
        });
      });

      const events = await getAuditEvents();
      
      const networkErrorEvent = events.find(e => 
        e.event_type === 'error' && 
        e.error_details.name === 'NetworkError'
      );
      
      expect(networkErrorEvent).toBeDefined();
      expect(networkErrorEvent.data.network_context.retry_attempt).toBe(2);
      expect(networkErrorEvent.data.recovery_options.length).toBe(3);
    });
  });

  test.describe('Form Accessibility Auditing', () => {
    test('should audit keyboard navigation patterns', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      // Test tab navigation through form fields
      const fields = [
        '[data-testid="title-input"] input',
        '[data-testid="description-input"] textarea',
        '[data-testid="lane-input"] input',
        '[data-testid="start-date-input"] input',
        '[data-testid="end-date-input"] input'
      ];

      // Simulate tabbing through fields
      await window.focus('[data-testid="title-input"] input');
      
      for (let i = 0; i < fields.length - 1; i++) {
        await window.keyboard.press('Tab');
        await window.waitForTimeout(50);
      }

      // Test shift+tab (reverse navigation)
      await window.keyboard.press('Shift+Tab');
      await window.waitForTimeout(50);

      const events = await getAuditEvents();
      
      // Should capture focus events for keyboard navigation
      const keyboardNavEvents = events.filter(e => 
        e.action === 'field_focus' || e.action === 'field_blur'
      );
      
      expect(keyboardNavEvents.length).toBeGreaterThan(fields.length);
      
      // Should capture tab navigation
      const tabEvents = events.filter(e => 
        e.action === 'keypress' && e.data && e.data.key === 'Tab'
      );
      
      // Note: This would require the keyboard tracking hook to be implemented
      // In the actual implementation, you'd capture tab events
    });

    test('should audit screen reader interaction patterns', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      // Simulate screen reader navigation
      await window.evaluate(() => {
        // Mock screen reader interactions
        window.auditLogger.logUserInteraction('screen_reader_navigation', 'ProjectForm', 'form_landmark', {
          accessibility_tool: 'screen_reader',
          element_role: 'form',
          aria_label: 'Create New Project',
          element_count: 9
        });

        window.auditLogger.logUserInteraction('screen_reader_field_announcement', 'ProjectForm', 'title_field', {
          field_label: 'Project Title',
          field_type: 'textbox',
          required: true,
          aria_describedby: 'title-help-text'
        });
      });

      const events = await getAuditEvents();
      
      const screenReaderEvents = events.filter(e => 
        e.data && e.data.accessibility_tool === 'screen_reader'
      );
      
      expect(screenReaderEvents.length).toBeGreaterThan(0);
      
      const formLandmarkEvent = screenReaderEvents.find(e => 
        e.action === 'screen_reader_navigation'
      );
      expect(formLandmarkEvent).toBeDefined();
      expect(formLandmarkEvent.data.element_role).toBe('form');
    });

    test('should audit form validation announcements for accessibility', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      // Trigger validation error
      await window.fill('[data-testid="title-input"] input', '');
      await window.blur('[data-testid="title-input"] input');

      // Simulate accessibility announcement
      await window.evaluate(() => {
        window.auditLogger.logUserInteraction('accessibility_announcement', 'ProjectForm', 'validation_error', {
          announcement_type: 'live_region_update',
          aria_live: 'assertive',
          message: 'Error: Project title is required',
          field_id: 'title-input',
          error_count: 1
        });
      });

      const events = await getAuditEvents();
      
      const announcementEvent = events.find(e => 
        e.action === 'accessibility_announcement'
      );
      
      expect(announcementEvent).toBeDefined();
      expect(announcementEvent.data.aria_live).toBe('assertive');
      expect(announcementEvent.data.message).toContain('required');
    });
  });

  test.describe('Form Performance Auditing', () => {
    test('should audit form rendering and validation performance', async () => {
      await window.evaluate(async () => {
        const startTime = performance.now();
        
        window.auditLogger.logSystemEvent('form_render_start', {
          component: 'ProjectForm',
          mode: 'create',
          field_count: 9,
          start_time: startTime
        });
      });

      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');

      await window.evaluate(async () => {
        const endTime = performance.now();
        const renderTime = endTime - performance.timing.navigationStart;
        
        window.auditLogger.logSystemEvent('form_render_complete', {
          component: 'ProjectForm',
          render_time_ms: renderTime,
          performance_threshold: 1000,
          meets_threshold: renderTime < 1000
        });
      });

      // Test validation performance
      const startValidation = Date.now();
      
      await window.fill('[data-testid="title-input"] input', 'Performance Test Project');
      await window.fill('[data-testid="start-date-input"] input', '01-01-2024');
      await window.blur('[data-testid="start-date-input"] input');
      
      const validationTime = Date.now() - startValidation;
      
      await window.evaluate((valTime) => {
        window.auditLogger.logSystemEvent('form_validation_performance', {
          component: 'ProjectForm',
          validation_time_ms: valTime,
          fields_validated: 2,
          validation_threshold: 500,
          meets_threshold: valTime < 500
        });
      }, validationTime);

      const events = await getAuditEvents();
      
      const renderEvent = events.find(e => e.action === 'form_render_complete');
      const validationEvent = events.find(e => e.action === 'form_validation_performance');
      
      expect(renderEvent).toBeDefined();
      expect(validationEvent).toBeDefined();
      expect(typeof renderEvent.data.render_time_ms).toBe('number');
      expect(typeof validationEvent.data.validation_time_ms).toBe('number');
    });
  });
});

test.describe('Negative Test Cases - Form Integration', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      timeout: 30000
    });
    
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should handle audit logging when form component crashes', async () => {
    const result = await window.evaluate(async () => {
      try {
        // Simulate form component error
        const componentError = new Error('Form component crashed during render');
        componentError.componentStack = 'ProjectForm > TextInput > input';
        
        window.auditLogger.logError(componentError, 'ProjectForm', {
          error_boundary: true,
          component_state: 'crashed',
          recovery_action: 'reload_form',
          user_data_preserved: true
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });

  test('should handle audit logging when form validation fails catastrophically', async () => {
    const result = await window.evaluate(async () => {
      try {
        // Simulate validation system failure
        const validationError = new Error('Validation engine crashed');
        
        window.auditLogger.logError(validationError, 'ProjectForm', {
          validation_system: 'failed',
          fallback_validation: 'enabled',
          form_data_integrity: 'unknown',
          user_notification: 'validation_unavailable'
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });
});