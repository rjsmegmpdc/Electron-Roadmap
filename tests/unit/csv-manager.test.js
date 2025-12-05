/**
 * @jest-environment jsdom
 * 
 * Test Suite for CSVManager
 * 
 * Tests cover:
 * - Project CSV import/export functionality
 * - Task CSV import/export functionality  
 * - Resource CSV import/export functionality
 * - Date format conversion and validation
 * - CSV escaping and data integrity
 * - Error handling and edge cases
 */

import CSVManager from '../../src/js/csv-manager.js';
import DateUtils from '../../src/js/date-utils.js';

// Mock DateUtils
jest.mock('../../src/js/date-utils.js');

// Mock console for error handling tests
let consoleSpy;

describe('CSVManager', () => {
  let csvManager;
  let mockProjectManager;
  let mockTaskManager;
  let mockResourceManager;

  const sampleProjects = [
    {
      id: 'proj-001',
      title: 'Sample Project 1',
      start_date: '01/01/2025',
      end_date: '30/06/2025',
      status: 'concept-design',
      budget_cents: 1000000,
      financial_treatment: 'CAPEX'
    },
    {
      id: 'proj-002',
      title: 'Sample Project 2',
      start_date: '01/07/2025',
      end_date: '31/12/2025',
      status: 'engineering',
      budget_cents: 2000000,
      financial_treatment: 'OPEX'
    }
  ];

  const sampleTasks = [
    {
      id: 'task-001',
      project_id: 'proj-001',
      title: 'Task 1',
      start_date: '01/01/2025',
      end_date: '15/01/2025',
      effort_hours: 40,
      status: 'planned'
    },
    {
      id: 'task-002',
      project_id: 'proj-001',
      title: 'Task 2',
      start_date: '16/01/2025',
      end_date: '31/01/2025',
      effort_hours: 60,
      status: 'in-progress'
    }
  ];

  const sampleResources = [
    {
      id: 'res-001',
      project_id: 'proj-001',
      name: 'John Doe',
      type: 'internal',
      allocation_percentage: 100,
      rate_per_hour_cents: 0
    },
    {
      id: 'res-002',
      project_id: 'proj-001',
      name: 'Jane Smith',
      type: 'contractor',
      allocation_percentage: 50,
      rate_per_hour_cents: 8000
    }
  ];

  beforeEach(() => {
    // Setup mock managers
    mockProjectManager = {
      listProjects: jest.fn(() => sampleProjects)
    };
    mockTaskManager = {
      getAllTasks: jest.fn(() => sampleTasks)
    };
    mockResourceManager = {
      getAllResources: jest.fn(() => sampleResources)
    };

    // Setup DateUtils mocks
    DateUtils.formatNZ = jest.fn((date) => {
      if (date instanceof Date) {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
      return date; // Return as-is for strings
    });
    
    DateUtils.parseNZ = jest.fn((dateStr) => {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    });
    
    DateUtils.isValidNZ = jest.fn((dateStr) => {
      return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
    });

    csvManager = new CSVManager(mockProjectManager, mockTaskManager, mockResourceManager);
    
    // Setup console spy
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Constructor', () => {
    test('should initialize with all required dependencies', () => {
      expect(csvManager.projectManager).toBe(mockProjectManager);
      expect(csvManager.taskManager).toBe(mockTaskManager);
      expect(csvManager.resourceManager).toBe(mockResourceManager);
    });

    test('should throw error if ProjectManager is not provided', () => {
      expect(() => {
        new CSVManager(null, mockTaskManager, mockResourceManager);
      }).toThrow('ProjectManager is required');
    });

    test('should throw error if TaskManager is not provided', () => {
      expect(() => {
        new CSVManager(mockProjectManager, null, mockResourceManager);
      }).toThrow('TaskManager is required');
    });

    test('should throw error if ResourceManager is not provided', () => {
      expect(() => {
        new CSVManager(mockProjectManager, mockTaskManager, null);
      }).toThrow('ResourceManager is required');
    });
  });

  describe('exportProjectsCSV', () => {
    test('should export projects in simple format', () => {
      const csv = csvManager.exportProjectsCSV('simple');
      
      expect(csv).toContain('ID,Title,Start Date,End Date,Status,Budget (NZD),Financial Treatment');
      expect(csv).toContain('proj-001,Sample Project 1,01/01/2025,30/06/2025,concept-design,$10000.00,CAPEX');
      expect(csv).toContain('proj-002,Sample Project 2,01/07/2025,31/12/2025,engineering,$20000.00,OPEX');
    });

    test('should export projects in full format', () => {
      const csv = csvManager.exportProjectsCSV('full');
      
      expect(csv).toContain('ID,Title,Start Date,End Date,Status,Budget (NZD),Financial Treatment');
      expect(csv).toContain('proj-001');
      expect(csv).toContain('Sample Project 1');
    });

    test('should handle empty project list', () => {
      mockProjectManager.listProjects.mockReturnValue([]);
      
      const csv = csvManager.exportProjectsCSV('simple');
      
      expect(csv).toContain('ID,Title,Start Date,End Date,Status,Budget (NZD),Financial Treatment');
      expect(csv.split('\n')).toHaveLength(2); // Header + empty line
    });

    test('should escape CSV special characters', () => {
      const projectWithSpecialChars = {
        id: 'proj-special',
        title: 'Project with "quotes" and, commas',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        status: 'concept-design',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      mockProjectManager.listProjects.mockReturnValue([projectWithSpecialChars]);
      
      const csv = csvManager.exportProjectsCSV('simple');
      
      expect(csv).toContain('"Project with ""quotes"" and, commas"');
    });
  });

  describe('exportTasksCSV', () => {
    test('should export tasks in simple format', () => {
      const csv = csvManager.exportTasksCSV('simple');
      
      expect(csv).toContain('ID,Project ID,Title,Start Date,End Date,Effort Hours,Status');
      expect(csv).toContain('task-001,proj-001,Task 1,01/01/2025,15/01/2025,40,planned');
      expect(csv).toContain('task-002,proj-001,Task 2,16/01/2025,31/01/2025,60,in-progress');
    });

    test('should handle empty task list', () => {
      mockTaskManager.getAllTasks.mockReturnValue([]);
      
      const csv = csvManager.exportTasksCSV('simple');
      
      expect(csv).toContain('ID,Project ID,Title,Start Date,End Date,Effort Hours,Status');
      expect(csv.split('\n')).toHaveLength(2);
    });
  });

  describe('exportResourcesCSV', () => {
    test('should export resources in simple format', () => {
      const csv = csvManager.exportResourcesCSV('simple');
      
      expect(csv).toContain('ID,Project ID,Name,Type,Allocation %,Rate (NZD/hour)');
      expect(csv).toContain('res-001,proj-001,John Doe,internal,100%,$0.00');
      expect(csv).toContain('res-002,proj-001,Jane Smith,contractor,50%,$80.00');
    });

    test('should handle empty resource list', () => {
      mockResourceManager.getAllResources.mockReturnValue([]);
      
      const csv = csvManager.exportResourcesCSV('simple');
      
      expect(csv).toContain('ID,Project ID,Name,Type,Allocation %,Rate (NZD/hour)');
      expect(csv.split('\n')).toHaveLength(2);
    });
  });

  describe('parseCSV', () => {
    test('should parse valid CSV data', () => {
      const csvData = 'name,age,city\nJohn,25,Auckland\nJane,30,Wellington';
      
      const result = csvManager.parseCSV(csvData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'John', age: '25', city: 'Auckland' });
      expect(result[1]).toEqual({ name: 'Jane', age: '30', city: 'Wellington' });
    });

    test('should handle CSV with quoted fields', () => {
      const csvData = 'name,description\n"John Doe","A person with ""quotes"""';
      
      const result = csvManager.parseCSV(csvData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: 'John Doe', description: 'A person with "quotes"' });
    });

    test('should handle empty CSV data', () => {
      const result = csvManager.parseCSV('');
      expect(result).toEqual([]);
    });

    test('should handle CSV with only headers', () => {
      const csvData = 'name,age,city';
      
      const result = csvManager.parseCSV(csvData);
      expect(result).toEqual([]);
    });

    test('should handle malformed CSV gracefully', () => {
      const csvData = 'name,age\nJohn,25,extra\nJane';
      
      const result = csvManager.parseCSV(csvData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'John', age: '25' }); // Extra field ignored
      expect(result[1]).toEqual({ name: 'Jane', age: '' }); // Missing field becomes empty
    });
  });

  describe('convertDateFields', () => {
    test('should convert date fields to NZ format', () => {
      const data = [
        { name: 'John', start_date: '2025-01-01', end_date: '2025-12-31' },
        { name: 'Jane', start_date: '2025-06-15', end_date: '2025-07-30' }
      ];
      
      const result = csvManager.convertDateFields(data, ['start_date', 'end_date']);
      
      expect(DateUtils.formatNZ).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    test('should handle invalid date fields gracefully', () => {
      const data = [
        { name: 'John', start_date: 'invalid-date', end_date: '2025-12-31' }
      ];
      
      const result = csvManager.convertDateFields(data, ['start_date', 'end_date']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid date format'),
        expect.any(String)
      );
    });

    test('should skip missing date fields', () => {
      const data = [
        { name: 'John', start_date: '2025-01-01' } // missing end_date
      ];
      
      const result = csvManager.convertDateFields(data, ['start_date', 'end_date']);
      
      expect(result[0]).toHaveProperty('name', 'John');
      expect(result[0]).toHaveProperty('start_date');
    });
  });

  describe('escapeCSV', () => {
    test('should escape fields containing commas', () => {
      const result = csvManager.escapeCSV('hello, world');
      expect(result).toBe('"hello, world"');
    });

    test('should escape fields containing quotes', () => {
      const result = csvManager.escapeCSV('say "hello"');
      expect(result).toBe('"say ""hello"""');
    });

    test('should escape fields containing newlines', () => {
      const result = csvManager.escapeCSV('line1\nline2');
      expect(result).toBe('"line1\nline2"');
    });

    test('should not escape simple strings', () => {
      const result = csvManager.escapeCSV('simple text');
      expect(result).toBe('simple text');
    });

    test('should handle null and undefined values', () => {
      expect(csvManager.escapeCSV(null)).toBe('');
      expect(csvManager.escapeCSV(undefined)).toBe('');
    });
  });

  describe('Error Handling', () => {
    test('should handle project manager errors gracefully', () => {
      mockProjectManager.listProjects.mockImplementation(() => {
        throw new Error('Project manager error');
      });
      
      expect(() => {
        csvManager.exportProjectsCSV('simple');
      }).toThrow('Project manager error');
    });

    test('should handle task manager errors gracefully', () => {
      mockTaskManager.getAllTasks.mockImplementation(() => {
        throw new Error('Task manager error');
      });
      
      expect(() => {
        csvManager.exportTasksCSV('simple');
      }).toThrow('Task manager error');
    });

    test('should handle resource manager errors gracefully', () => {
      mockResourceManager.getAllResources.mockImplementation(() => {
        throw new Error('Resource manager error');
      });
      
      expect(() => {
        csvManager.exportResourcesCSV('simple');
      }).toThrow('Resource manager error');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete export workflow', () => {
      const projectsCsv = csvManager.exportProjectsCSV('simple');
      const tasksCsv = csvManager.exportTasksCSV('simple');
      const resourcesCsv = csvManager.exportResourcesCSV('simple');
      
      expect(projectsCsv).toContain('proj-001');
      expect(tasksCsv).toContain('task-001');
      expect(resourcesCsv).toContain('res-001');
    });

    test('should handle export with no data', () => {
      mockProjectManager.listProjects.mockReturnValue([]);
      mockTaskManager.getAllTasks.mockReturnValue([]);
      mockResourceManager.getAllResources.mockReturnValue([]);
      
      const projectsCsv = csvManager.exportProjectsCSV('simple');
      const tasksCsv = csvManager.exportTasksCSV('simple');
      const resourcesCsv = csvManager.exportResourcesCSV('simple');
      
      expect(projectsCsv.split('\n')).toHaveLength(2);
      expect(tasksCsv.split('\n')).toHaveLength(2);
      expect(resourcesCsv.split('\n')).toHaveLength(2);
    });
  });
});