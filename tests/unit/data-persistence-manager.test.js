/**
 * @jest-environment jsdom
 * 
 * Test Suite for DataPersistenceManager
 * 
 * Tests cover:
 * - Save/load projects with localStorage
 * - Backup and restore functionality  
 * - Corrupt JSON handling
 * - Round-trip data integrity
 * - Edge cases and error handling
 */

import DataPersistenceManager from '../../src/js/data-persistence-manager.js';

// Mock dependencies
jest.mock('../../src/js/config-manager.js', () => ({
  configManager: {
    get: jest.fn((key, defaultValue) => defaultValue)
  }
}));

jest.mock('../../src/js/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../src/js/error-handler.js', () => ({
  errorHandler: {
    handleStorage: jest.fn()
  },
  ErrorCategory: { STORAGE: 'storage' },
  ErrorSeverity: { HIGH: 3 }
}));

jest.mock('../../src/js/event-bus.js', () => ({
  eventBus: {
    emit: jest.fn()
  },
  AppEvents: {
    DATA_SAVED: 'data.saved',
    DATA_LOADED: 'data.loaded'
  }
}));

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store = {};
  const mock = {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() { return Object.keys(store).length; },
    get store() { return store; },
    set store(newStore) { store = newStore; }
  };
  return mock;
})();

// Mock console.warn for corrupt JSON tests
const originalWarn = console.warn;
let consoleSpy;

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('DataPersistenceManager', () => {
  let dataPM;
  const testProjects = [
    {
      id: 'proj-001',
      title: 'Test Project 1',
      start_date: '01-01-2025',
      end_date: '30-06-2025',
      status: 'concept-design',
      budget_cents: 1000000,
      financial_treatment: 'CAPEX',
      tasks: [],
      resources: [],
      forecasts: []
    },
    {
      id: 'proj-002', 
      title: 'Test Project 2',
      start_date: '01-07-2025',
      end_date: '31-12-2025',
      status: 'engineering',
      budget_cents: 2000000,
      financial_treatment: 'OPEX',
      tasks: [],
      resources: [],
      forecasts: []
    }
  ];

  beforeEach(() => {
    // Clear localStorage and create fresh instance
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.key.mockClear();
    
    // Reset store to empty
    mockLocalStorage.store = {};
    
    // Restore mock implementations after mockClear()
    mockLocalStorage.getItem.mockImplementation((key) => mockLocalStorage.store[key] || null);
    mockLocalStorage.setItem.mockImplementation((key, value) => {
      mockLocalStorage.store[key] = String(value);
    });
    mockLocalStorage.key.mockImplementation((index) => {
      const keys = Object.keys(mockLocalStorage.store);
      return keys[index] || null;
    });
    
    dataPM = new DataPersistenceManager();
    
    // Setup console spy
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Constructor', () => {
    test('should use default storage keys', () => {
      const manager = new DataPersistenceManager();
      expect(manager).toBeDefined();
      // Test with actual save to verify keys
      manager.saveProjects([]);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('projectsData', '[]');
    });

    test('should accept custom storage keys', () => {
      const manager = new DataPersistenceManager('customKey', 'customBackup_');
      manager.saveProjects([]);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('customKey', '[]');
    });
  });

  describe('saveProjects', () => {
    test('should save projects array to localStorage', () => {
      dataPM.saveProjects(testProjects);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'projectsData', 
        JSON.stringify(testProjects)
      );
    });

    test('should save empty array', () => {
      dataPM.saveProjects([]);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('projectsData', '[]');
    });

    test('should handle complex project data', () => {
      const complexProject = {
        id: 'complex-001',
        title: 'Complex Project',
        description: 'A project with nested data',
        tasks: [{ id: 'task-1', title: 'Test Task' }],
        resources: [{ id: 'res-1', name: 'Test Resource' }],
        forecasts: [{ id: 'forecast-1', date: '01-01-2025' }]
      };
      
      dataPM.saveProjects([complexProject]);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'projectsData',
        JSON.stringify([complexProject])
      );
    });
  });

  describe('loadProjects', () => {
    test('should load projects from localStorage', () => {
      // Setup: save projects first
      mockLocalStorage.setItem('projectsData', JSON.stringify(testProjects));
      
      const loaded = dataPM.loadProjects();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('projectsData');
      expect(loaded).toEqual(testProjects);
    });

    test('should return empty array when no data exists', () => {
      // localStorage returns null for non-existent keys
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const loaded = dataPM.loadProjects();
      
      expect(loaded).toEqual([]);
    });

    test('should return empty array and warn on corrupt JSON', () => {
      // Setup corrupt JSON in localStorage
      mockLocalStorage.getItem.mockReturnValue('{ invalid json }');
      
      const loaded = dataPM.loadProjects();
      
      expect(loaded).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Corrupt projects data in localStorage'),
        expect.any(String)
      );
    });

    test('should handle empty string in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('');
      
      const loaded = dataPM.loadProjects();
      
      expect(loaded).toEqual([]);
    });
  });

  describe('backupProjects', () => {
    test('should create timestamped backup and return key', () => {
      // Setup: save projects first and ensure they're available in mock store
      dataPM.saveProjects(testProjects);
      // Verify the data was saved properly
      expect(mockLocalStorage.store['projectsData']).toBe(JSON.stringify(testProjects));
      
      const backupKey = dataPM.backupProjects();
      
      // Verify backup key format: projectsDataBackup_TIMESTAMP
      expect(backupKey).toMatch(/^projectsDataBackup_\d+$/);
      
      // Verify backup exists in store
      expect(mockLocalStorage.store[backupKey]).toBe(JSON.stringify(testProjects));
    });

    test('should backup empty projects', () => {
      mockLocalStorage.setItem('projectsData', '[]');
      
      const backupKey = dataPM.backupProjects();
      
      expect(backupKey).toMatch(/^projectsDataBackup_\d+$/);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(backupKey, '[]');
    });

    test('should backup even when no current data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const backupKey = dataPM.backupProjects();
      
      expect(backupKey).toMatch(/^projectsDataBackup_\d+$/);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(backupKey, '[]');
    });

    test('should use custom backup prefix', () => {
      const manager = new DataPersistenceManager('test', 'customBackup_');
      
      const backupKey = manager.backupProjects();
      
      expect(backupKey).toMatch(/^customBackup_\d+$/);
    });
  });

  describe('restoreProjects', () => {
    test('should restore projects from backup key', () => {
      const backupKey = 'projectsDataBackup_1234567890';
      mockLocalStorage.store[backupKey] = JSON.stringify(testProjects);
      
      dataPM.restoreProjects(backupKey);
      
      // Should restore to main storage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'projectsData',
        JSON.stringify(testProjects)
      );
    });

    test('should throw error when backup not found', () => {
      const backupKey = 'nonexistent_backup';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      expect(() => {
        dataPM.restoreProjects(backupKey);
      }).toThrow('Backup not found: nonexistent_backup');
    });

    test('should restore empty backup', () => {
      const backupKey = 'projectsDataBackup_empty';
      mockLocalStorage.store[backupKey] = '[]';
      
      dataPM.restoreProjects(backupKey);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('projectsData', '[]');
    });

    test('should handle corrupt backup gracefully', () => {
      const backupKey = 'projectsDataBackup_corrupt';
      mockLocalStorage.getItem.mockReturnValueOnce('{ corrupt json }');
      
      expect(() => {
        dataPM.restoreProjects(backupKey);
      }).toThrow('Backup not found: projectsDataBackup_corrupt');
    });
  });

  describe('listBackups', () => {
    test('should return empty array when no backups exist', () => {
      // Mock localStorage with no backup keys
      mockLocalStorage.store = {};
      
      const backups = dataPM.listBackups();
      
      expect(backups).toEqual([]);
    });

    test('should return list of backup keys', () => {
      // Setup mock backups in localStorage
      mockLocalStorage.store = {
        'projectsData': JSON.stringify(testProjects),
        'projectsDataBackup_1640995200000': JSON.stringify(testProjects),
        'projectsDataBackup_1640995300000': JSON.stringify([]),
        'otherKey': 'other data',
        'projectsDataBackup_1640995400000': JSON.stringify(testProjects)
      };
      
      const backups = dataPM.listBackups();
      
      expect(backups).toEqual([
        'projectsDataBackup_1640995200000',
        'projectsDataBackup_1640995300000', 
        'projectsDataBackup_1640995400000'
      ]);
    });

    test('should work with custom backup prefix', () => {
      const manager = new DataPersistenceManager('test', 'custom_');
      
      mockLocalStorage.store = {
        'test': '[]',
        'custom_123': '[]',
        'custom_456': '[]',
        'projectsDataBackup_789': '[]'
      };
      
      const backups = manager.listBackups();
      
      expect(backups).toEqual(['custom_123', 'custom_456']);
    });

    test('should return sorted backup keys', () => {
      mockLocalStorage.store = {
        'projectsDataBackup_1640995400000': '[]',
        'projectsDataBackup_1640995200000': '[]',
        'projectsDataBackup_1640995300000': '[]'
      };
      
      const backups = dataPM.listBackups();
      
      expect(backups).toEqual([
        'projectsDataBackup_1640995200000',
        'projectsDataBackup_1640995300000',
        'projectsDataBackup_1640995400000'
      ]);
    });
  });

  describe('Round-trip data integrity', () => {
    test('should maintain data integrity through save/load cycle', () => {
      dataPM.saveProjects(testProjects);
      const loaded = dataPM.loadProjects();
      
      expect(loaded).toEqual(testProjects);
    });

    test('should maintain data integrity through backup/restore cycle', () => {
      // Save original data
      dataPM.saveProjects(testProjects);
      
      // Create backup - this will read the saved data and create a backup
      const backupKey = dataPM.backupProjects();
      
      // Clear main data and restore from backup
      dataPM.saveProjects([]);
      dataPM.restoreProjects(backupKey);
      
      const restored = dataPM.loadProjects();
      expect(restored).toEqual(testProjects);
    });

    test('should handle complex nested data through full cycle', () => {
      const complexData = [
        {
          id: 'proj-complex',
          title: 'Complex Project',
          nested: {
            deep: {
              value: 'test',
              array: [1, 2, 3]
            }
          },
          tasks: [
            { id: 't1', nested: { prop: 'value' } }
          ]
        }
      ];
      
      dataPM.saveProjects(complexData);
      const backupKey = dataPM.backupProjects();
      
      dataPM.saveProjects([]);
      dataPM.restoreProjects(backupKey);
      const final = dataPM.loadProjects();
      
      expect(final).toEqual(complexData);
    });
  });
});