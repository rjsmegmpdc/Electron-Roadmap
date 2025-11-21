import { NZCurrency, NZDate } from '../../app/renderer/utils/validation';

// Mock database operations to test validation integration
interface MockProject {
  id: string;
  title: string;
  start_date_nz: string;
  end_date_nz: string;
  start_date_iso: string;
  end_date_iso: string;
  budget_cents: number;
  status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
}

describe('Validation-Database Integration', () => {
  describe('✅ POSITIVE TESTS - Valid project data creation', () => {
    test('should create valid project with properly formatted data', () => {
      const projectInput = {
        title: 'Test Project',
        start_date_nz: '01-01-2025',
        end_date_nz: '31-12-2025',
        budget_nzd_string: '125,000.50',
        status: 'planned' as const
      };

      // Validate dates
      expect(NZDate.validate(projectInput.start_date_nz)).toBe(true);
      expect(NZDate.validate(projectInput.end_date_nz)).toBe(true);

      // Validate currency
      expect(NZCurrency.validate(projectInput.budget_nzd_string)).toBe(true);

      // Create project with converted data
      const project: MockProject = {
        id: 'test-project-1',
        title: projectInput.title,
        start_date_nz: projectInput.start_date_nz,
        end_date_nz: projectInput.end_date_nz,
        start_date_iso: NZDate.toISO(projectInput.start_date_nz),
        end_date_iso: NZDate.toISO(projectInput.end_date_nz),
        budget_cents: NZCurrency.parseToCents(projectInput.budget_nzd_string),
        status: projectInput.status
      };

      // Verify the converted data
      expect(project.start_date_iso).toBe('2025-01-01');
      expect(project.end_date_iso).toBe('2025-12-31');
      expect(project.budget_cents).toBe(12500050); // 125,000.50 in cents
      expect(project.budget_cents).toBeValidNZCurrency();
    });

    test('should handle round-trip data conversion (UI -> DB -> UI)', () => {
      const uiData = {
        startDate: '15-03-2025',
        endDate: '30-06-2025',
        budget: '50,000.00'
      };

      // Convert UI data to DB format
      const dbData = {
        start_date_nz: uiData.startDate,
        end_date_nz: uiData.endDate,
        start_date_iso: NZDate.toISO(uiData.startDate),
        end_date_iso: NZDate.toISO(uiData.endDate),
        budget_cents: NZCurrency.parseToCents(uiData.budget)
      };

      // Simulate database storage and retrieval
      const retrievedData = { ...dbData };

      // Convert back to UI format
      const backToUi = {
        startDate: retrievedData.start_date_nz,
        endDate: retrievedData.end_date_nz,
        budget: NZCurrency.formatFromCents(retrievedData.budget_cents)
      };

      // Verify round-trip integrity
      expect(backToUi.startDate).toBe(uiData.startDate);
      expect(backToUi.endDate).toBe(uiData.endDate);
      expect(backToUi.budget).toBe(uiData.budget);
    });

    test('should validate complex project with multiple date/currency fields', () => {
      const complexProjectData = {
        title: 'Multi-Million Dollar Initiative',
        start_date_nz: '01-04-2025', // FY start
        end_date_nz: '31-03-2026',   // FY end
        budget_nzd: '2,500,000.99',
        contingency_nzd: '250,000.00',
        phases: [
          {
            name: 'Phase 1',
            start: '01-04-2025',
            end: '30-06-2025',
            budget: '750,000.25'
          },
          {
            name: 'Phase 2',
            start: '01-07-2025',
            end: '31-12-2025',
            budget: '1,000,000.50'
          }
        ]
      };

      // Validate all dates
      expect(NZDate.validate(complexProjectData.start_date_nz)).toBe(true);
      expect(NZDate.validate(complexProjectData.end_date_nz)).toBe(true);
      
      complexProjectData.phases.forEach(phase => {
        expect(NZDate.validate(phase.start)).toBe(true);
        expect(NZDate.validate(phase.end)).toBe(true);
        expect(NZCurrency.validate(phase.budget)).toBe(true);
      });

      // Validate all currencies
      expect(NZCurrency.validate(complexProjectData.budget_nzd)).toBe(true);
      expect(NZCurrency.validate(complexProjectData.contingency_nzd)).toBe(true);

      // Convert to database format
      const totalBudgetCents = NZCurrency.parseToCents(complexProjectData.budget_nzd) + 
                               NZCurrency.parseToCents(complexProjectData.contingency_nzd);
      
      expect(totalBudgetCents).toBe(275000099); // Total in cents
      
      // Verify we can format back
      const formattedTotal = NZCurrency.formatFromCents(totalBudgetCents);
      expect(formattedTotal).toBe('2,750,000.99');
    });
  });

  describe('❌ NEGATIVE TESTS - Invalid project data handling', () => {
    test('should reject project with invalid date formats', () => {
      const invalidProjectData = [
        {
          start_date_nz: '2025-01-01', // ISO format instead of NZ
          end_date_nz: '31-12-2025',
          budget: '100,000.00'
        },
        {
          start_date_nz: '01-01-2025',
          end_date_nz: '32-12-2025', // Invalid day
          budget: '100,000.00'
        },
        {
          start_date_nz: '01-13-2025', // Invalid month
          end_date_nz: '31-12-2025',
          budget: '100,000.00'
        }
      ];

      invalidProjectData.forEach((projectData, index) => {
        const startValid = NZDate.validate(projectData.start_date_nz);
        const endValid = NZDate.validate(projectData.end_date_nz);
        
        expect(startValid && endValid).toBe(false);
        console.log(`Test case ${index + 1}: Date validation correctly failed`);
      });
    });

    test('should reject project with invalid currency formats', () => {
      const invalidCurrencyData = [
        '100,000.999', // Too many decimal places
        '-50,000.00',  // Negative amount
        '$100,000.00', // Currency symbol
        '100000000.00', // Over limit
        'abc',         // Non-numeric
        ''             // Empty
      ];

      invalidCurrencyData.forEach(budget => {
        expect(NZCurrency.validate(budget)).toBe(false);
      });
    });

    test('should handle database constraint violations gracefully', () => {
      const projectData = {
        start_date_nz: '01-01-2025',
        end_date_nz: '31-12-2024', // End before start!
        budget_nzd: '100,000.00'
      };

      // Individual validations pass
      expect(NZDate.validate(projectData.start_date_nz)).toBe(true);
      expect(NZDate.validate(projectData.end_date_nz)).toBe(true);
      expect(NZCurrency.validate(projectData.budget_nzd)).toBe(true);

      // But logical validation should fail
      const startDate = NZDate.parse(projectData.start_date_nz);
      const endDate = NZDate.parse(projectData.end_date_nz);
      
      expect(endDate.getTime()).toBeLessThan(startDate.getTime());
      
      // This would be caught by business logic validation
      const isLogicallyValid = endDate >= startDate;
      expect(isLogicallyValid).toBe(false);
    });
  });

  describe('🧪 INTEGRATION SCENARIOS - Real-world workflows', () => {
    test('should handle CSV import data validation workflow', () => {
      // Simulate CSV row data as it might come from import
      const csvRows = [
        {
          'Project Title': 'Website Redesign',
          'Start Date': '01-04-2025',
          'End Date': '30-06-2025',
          'Budget (NZD)': '125,000.50',
          'Status': 'planned'
        },
        {
          'Project Title': 'Database Migration',
          'Start Date': '01-07-2025',
          'End Date': '31-08-2025',
          'Budget (NZD)': '75,500.00',
          'Status': 'planned'
        }
      ];

      const validatedProjects: MockProject[] = [];
      const validationErrors: string[] = [];

      csvRows.forEach((row, index) => {
        try {
          // Validate each field
          const startDateValid = NZDate.validate(row['Start Date']);
          const endDateValid = NZDate.validate(row['End Date']);
          const budgetValid = NZCurrency.validate(row['Budget (NZD)']);

          if (!startDateValid) {
            validationErrors.push(`Row ${index + 1}: Invalid start date format`);
          }
          if (!endDateValid) {
            validationErrors.push(`Row ${index + 1}: Invalid end date format`);
          }
          if (!budgetValid) {
            validationErrors.push(`Row ${index + 1}: Invalid budget format`);
          }

          if (startDateValid && endDateValid && budgetValid) {
            const project: MockProject = {
              id: `csv-import-${index + 1}`,
              title: row['Project Title'],
              start_date_nz: row['Start Date'],
              end_date_nz: row['End Date'],
              start_date_iso: NZDate.toISO(row['Start Date']),
              end_date_iso: NZDate.toISO(row['End Date']),
              budget_cents: NZCurrency.parseToCents(row['Budget (NZD)']),
              status: row['Status'] as MockProject['status']
            };
            
            validatedProjects.push(project);
          }
        } catch (error) {
          validationErrors.push(`Row ${index + 1}: ${(error as Error).message}`);
        }
      });

      // Should have no validation errors for valid data
      expect(validationErrors).toHaveLength(0);
      expect(validatedProjects).toHaveLength(2);
      
      // Verify converted data
      expect(validatedProjects[0].start_date_iso).toBe('2025-04-01');
      expect(validatedProjects[0].budget_cents).toBe(12500050);
      expect(validatedProjects[1].budget_cents).toBe(7550000);
    });

    test('should handle form validation with user input', () => {
      // Simulate form data as it might come from UI
      const formInputs = {
        projectTitle: 'New Initiative',
        startDate: '15-10-2025',
        endDate: '30-11-2025',
        budgetInput: '50,000.25', // User typed this
        pmName: 'John Smith'
      };

      // Validation workflow
      const validationResults = {
        startDate: NZDate.validate(formInputs.startDate),
        endDate: NZDate.validate(formInputs.endDate),
        budget: NZCurrency.validate(formInputs.budgetInput),
        title: formInputs.projectTitle.trim().length > 0
      };

      // All should be valid
      expect(Object.values(validationResults).every(Boolean)).toBe(true);

      // If all valid, create database record
      if (Object.values(validationResults).every(Boolean)) {
        const databaseRecord = {
          id: `form-${Date.now()}`,
          title: formInputs.projectTitle,
          start_date_nz: formInputs.startDate,
          end_date_nz: formInputs.endDate,
          start_date_iso: NZDate.toISO(formInputs.startDate),
          end_date_iso: NZDate.toISO(formInputs.endDate),
          budget_cents: NZCurrency.parseToCents(formInputs.budgetInput),
          pm_name: formInputs.pmName
        };

        expect(databaseRecord.start_date_iso).toBe('2025-10-15');
        expect(databaseRecord.end_date_iso).toBe('2025-11-30');
        expect(databaseRecord.budget_cents).toBe(5000025);
      }
    });
  });

  describe('🔧 PERFORMANCE TESTS - Validation efficiency', () => {
    test('should validate large datasets efficiently', () => {
      const startTime = Date.now();
      const testRecords = 1000;
      
      // Generate test data
      const records = Array.from({ length: testRecords }, (_, i) => ({
        date: `${String(i % 28 + 1).padStart(2, '0')}-${String(i % 12 + 1).padStart(2, '0')}-2025`,
        currency: `${(i * 100).toLocaleString()}.${String(i % 100).padStart(2, '0')}`
      }));

      // Validate all records
      let validCount = 0;
      records.forEach(record => {
        if (NZDate.validate(record.date) && NZCurrency.validate(record.currency)) {
          validCount++;
        }
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance assertions
      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(validCount).toBeGreaterThan(0); // Some records should be valid
      
      console.log(`Validated ${testRecords} records in ${executionTime}ms`);
      console.log(`Valid records: ${validCount}/${testRecords}`);
    });
  });

  describe('🎯 CUSTOM VALIDATION RULES - Business logic', () => {
    test('should validate project timeline constraints', () => {
      const projectData = {
        start_date_nz: '01-04-2025', // FY start
        end_date_nz: '31-03-2026',   // FY end (exactly 1 year)
        budget_nzd: '1,000,000.00'
      };

      // Basic validation
      expect(NZDate.validate(projectData.start_date_nz)).toBe(true);
      expect(NZDate.validate(projectData.end_date_nz)).toBe(true);
      expect(NZCurrency.validate(projectData.budget_nzd)).toBe(true);

      // Business rule validation
      const startDate = NZDate.parse(projectData.start_date_nz);
      const endDate = NZDate.parse(projectData.end_date_nz);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Business rules
      expect(durationDays).toBeGreaterThan(0); // End after start
      expect(durationDays).toBeLessThan(732); // Less than 2 years (accounting for leap years)
      
      const budgetCents = NZCurrency.parseToCents(projectData.budget_nzd);
      expect(budgetCents).toBeLessThan(1000000000); // Less than 10M NZD in cents
    });
  });
});