import { NZDate } from '../../app/renderer/utils/validation';

describe('NZDate', () => {
  describe('validate()', () => {
    describe('✅ POSITIVE TESTS - Valid date formats', () => {
      test('should accept valid DD-MM-YYYY dates', () => {
        expect(NZDate.validate('01-01-2025')).toBe(true);
        expect(NZDate.validate('15-03-2024')).toBe(true);
        expect(NZDate.validate('31-12-2025')).toBe(true);
        expect(NZDate.validate('28-02-2025')).toBe(true);
      });

      test('should accept leap year dates', () => {
        expect(NZDate.validate('29-02-2024')).toBe(true); // 2024 is leap year
        expect(NZDate.validate('29-02-2028')).toBe(true); // 2028 is leap year
      });

      test('should accept boundary dates within range', () => {
        expect(NZDate.validate('01-01-2020')).toBe(true); // Min year
        expect(NZDate.validate('31-12-2030')).toBe(true); // Max year
      });

      test('should accept all valid month endings', () => {
        expect(NZDate.validate('31-01-2025')).toBe(true); // 31 days
        expect(NZDate.validate('30-04-2025')).toBe(true); // 30 days  
        expect(NZDate.validate('28-02-2025')).toBe(true); // 28 days (non-leap)
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid date formats', () => {
      test('should reject empty and null values', () => {
        expect(NZDate.validate('')).toBe(false);
        expect(NZDate.validate('   ')).toBe(false);
        expect(NZDate.validate(null as any)).toBe(false);
        expect(NZDate.validate(undefined as any)).toBe(false);
      });

      test('should reject non-string values', () => {
        expect(NZDate.validate(20251015 as any)).toBe(false);
        expect(NZDate.validate(new Date() as any)).toBe(false);
        expect(NZDate.validate([] as any)).toBe(false);
      });

      test('should reject wrong date formats', () => {
        expect(NZDate.validate('2025-10-15')).toBe(false); // ISO format
        expect(NZDate.validate('15/10/2025')).toBe(false); // Slash format
        expect(NZDate.validate('Oct 15, 2025')).toBe(false); // Text format
        expect(NZDate.validate('15-10-25')).toBe(false); // Short year
      });

      test('should reject invalid day values', () => {
        expect(NZDate.validate('00-01-2025')).toBe(false); // Day 0
        expect(NZDate.validate('32-01-2025')).toBe(false); // Day 32
        expect(NZDate.validate('31-04-2025')).toBe(false); // April only has 30 days
        expect(NZDate.validate('30-02-2025')).toBe(false); // February never has 30 days
      });

      test('should reject invalid month values', () => {
        expect(NZDate.validate('15-00-2025')).toBe(false); // Month 0
        expect(NZDate.validate('15-13-2025')).toBe(false); // Month 13
        expect(NZDate.validate('15-99-2025')).toBe(false); // Month 99
      });

      test('should reject years outside valid range', () => {
        expect(NZDate.validate('15-10-2019')).toBe(false); // Before 2020
        expect(NZDate.validate('15-10-2031')).toBe(false); // After 2030
        expect(NZDate.validate('15-10-1999')).toBe(false); // Way before
      });

      test('should reject non-leap year February 29th', () => {
        expect(NZDate.validate('29-02-2025')).toBe(false); // 2025 is not leap
        expect(NZDate.validate('29-02-2021')).toBe(false); // 2021 is not leap
      });

      test('should reject malformed date strings', () => {
        expect(NZDate.validate('1-1-2025')).toBe(false); // Single digits
        expect(NZDate.validate('15-1-2025')).toBe(false); // Single digit month
        expect(NZDate.validate('1-10-2025')).toBe(false); // Single digit day
        expect(NZDate.validate('15-10-2025-extra')).toBe(false); // Extra text
      });
    });
  });

  describe('parse()', () => {
    describe('✅ POSITIVE TESTS - Valid parsing', () => {
      test('should parse valid dates to JavaScript Date objects', () => {
        const date = NZDate.parse('15-10-2025');
        expect(date).toBeInstanceOf(Date);
        expect(date.getFullYear()).toBe(2025);
        expect(date.getMonth()).toBe(9); // October is month 9 (0-indexed)
        expect(date.getDate()).toBe(15);
      });

      test('should handle leap year correctly', () => {
        const date = NZDate.parse('29-02-2024');
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(1); // February
        expect(date.getDate()).toBe(29);
      });

      test('should parse boundary dates', () => {
        const minDate = NZDate.parse('01-01-2020');
        expect(minDate.getFullYear()).toBe(2020);
        
        const maxDate = NZDate.parse('31-12-2030');
        expect(maxDate.getFullYear()).toBe(2030);
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid parsing', () => {
      test('should throw on invalid date formats', () => {
        expect(() => NZDate.parse('2025-10-15')).toThrow('Invalid date format');
        expect(() => NZDate.parse('invalid')).toThrow('Invalid date format');
        expect(() => NZDate.parse('')).toThrow('Invalid date format');
      });

      test('should throw on impossible dates', () => {
        expect(() => NZDate.parse('32-01-2025')).toThrow('Invalid date format');
        expect(() => NZDate.parse('29-02-2025')).toThrow('Invalid date format');
        expect(() => NZDate.parse('31-04-2025')).toThrow('Invalid date format');
      });
    });
  });

  describe('format()', () => {
    describe('✅ POSITIVE TESTS - Date formatting', () => {
      test('should format JavaScript Date to DD-MM-YYYY', () => {
        const date = new Date(2025, 9, 15); // October 15, 2025
        expect(NZDate.format(date)).toBe('15-10-2025');
      });

      test('should pad single digits with zeros', () => {
        const date = new Date(2025, 0, 1); // January 1, 2025
        expect(NZDate.format(date)).toBe('01-01-2025');
        
        const date2 = new Date(2025, 8, 9); // September 9, 2025
        expect(NZDate.format(date2)).toBe('09-09-2025');
      });

      test('should handle leap year dates', () => {
        const leapDate = new Date(2024, 1, 29); // February 29, 2024
        expect(NZDate.format(leapDate)).toBe('29-02-2024');
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid date objects', () => {
      test('should throw on invalid Date objects', () => {
        expect(() => NZDate.format(new Date('invalid'))).toThrow('Invalid date object');
        expect(() => NZDate.format(null as any)).toThrow('Invalid date object');
        expect(() => NZDate.format('2025-10-15' as any)).toThrow('Invalid date object');
      });
    });
  });

  describe('toISO()', () => {
    describe('✅ POSITIVE TESTS - ISO conversion', () => {
      test('should convert DD-MM-YYYY to YYYY-MM-DD', () => {
        expect(NZDate.toISO('15-10-2025')).toBe('2025-10-15');
        expect(NZDate.toISO('01-01-2025')).toBe('2025-01-01');
        expect(NZDate.toISO('31-12-2025')).toBe('2025-12-31');
      });

      test('should handle leap year dates', () => {
        expect(NZDate.toISO('29-02-2024')).toBe('2024-02-29');
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid conversions', () => {
      test('should throw on invalid NZ date strings', () => {
        expect(() => NZDate.toISO('2025-10-15')).toThrow('Invalid date format');
        expect(() => NZDate.toISO('invalid')).toThrow('Invalid date format');
        expect(() => NZDate.toISO('32-01-2025')).toThrow('Invalid date format');
      });
    });
  });

  describe('fromISO()', () => {
    describe('✅ POSITIVE TESTS - ISO parsing', () => {
      test('should convert YYYY-MM-DD to DD-MM-YYYY', () => {
        expect(NZDate.fromISO('2025-10-15')).toBe('15-10-2025');
        expect(NZDate.fromISO('2025-01-01')).toBe('01-01-2025');
        expect(NZDate.fromISO('2025-12-31')).toBe('31-12-2025');
      });

      test('should handle leap year dates', () => {
        expect(NZDate.fromISO('2024-02-29')).toBe('29-02-2024');
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid ISO strings', () => {
      test('should throw on malformed ISO dates', () => {
        expect(() => NZDate.fromISO('invalid')).toThrow('Invalid ISO date string');
        expect(() => NZDate.fromISO('15-10-2025')).toThrow('Invalid ISO date string');
        expect(() => NZDate.fromISO('')).toThrow('Invalid ISO date string');
      });

      test('should throw on impossible ISO dates', () => {
        expect(() => NZDate.fromISO('2025-13-01')).toThrow('Invalid ISO date string');
        expect(() => NZDate.fromISO('2025-02-30')).toThrow('Invalid ISO date string');
      });
    });
  });

  describe('today()', () => {
    describe('✅ POSITIVE TESTS - Current date', () => {
      test('should return current date in DD-MM-YYYY format', () => {
        const today = NZDate.today();
        expect(today).toMatch(/^\d{2}-\d{2}-\d{4}$/);
        expect(NZDate.validate(today)).toBe(true);
      });

      test('should return consistent format', () => {
        const today1 = NZDate.today();
        const today2 = NZDate.today();
        // Should be same format (might be different if test runs at midnight)
        expect(today1).toMatch(/^\d{2}-\d{2}-\d{4}$/);
        expect(today2).toMatch(/^\d{2}-\d{2}-\d{4}$/);
      });
    });
  });

  describe('addDays()', () => {
    describe('✅ POSITIVE TESTS - Date arithmetic', () => {
      test('should add positive days correctly', () => {
        expect(NZDate.addDays('01-01-2025', 1)).toBe('02-01-2025');
        expect(NZDate.addDays('01-01-2025', 31)).toBe('01-02-2025');
        expect(NZDate.addDays('01-01-2025', 365)).toBe('01-01-2026');
      });

      test('should subtract negative days correctly', () => {
        expect(NZDate.addDays('02-01-2025', -1)).toBe('01-01-2025');
        expect(NZDate.addDays('01-02-2025', -31)).toBe('01-01-2025');
      });

      test('should handle month/year boundaries', () => {
        expect(NZDate.addDays('31-01-2025', 1)).toBe('01-02-2025');
        expect(NZDate.addDays('31-12-2025', 1)).toBe('01-01-2026');
        expect(NZDate.addDays('01-01-2025', -1)).toBe('31-12-2024');
      });

      test('should handle leap years', () => {
        expect(NZDate.addDays('28-02-2024', 1)).toBe('29-02-2024'); // 2024 is leap
        expect(NZDate.addDays('28-02-2025', 1)).toBe('01-03-2025'); // 2025 is not leap
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid inputs', () => {
      test('should throw on invalid date strings', () => {
        expect(() => NZDate.addDays('invalid', 1)).toThrow('Invalid date format');
        expect(() => NZDate.addDays('32-01-2025', 1)).toThrow('Invalid date format');
      });
    });
  });

  describe('🧪 INTEGRATION TESTS - End-to-end workflows', () => {
    test('should handle round-trip conversions (NZ -> ISO -> NZ)', () => {
      const originalNZ = '15-10-2025';
      const iso = NZDate.toISO(originalNZ);
      const backToNZ = NZDate.fromISO(iso);
      expect(backToNZ).toBe(originalNZ);
    });

    test('should handle round-trip conversions (NZ -> Date -> NZ)', () => {
      const originalNZ = '15-10-2025';
      const date = NZDate.parse(originalNZ);
      const backToNZ = NZDate.format(date);
      expect(backToNZ).toBe(originalNZ);
    });

    test('should maintain date integrity through complex operations', () => {
      const startDate = '01-01-2025';
      const plus30Days = NZDate.addDays(startDate, 30);
      const backToOriginal = NZDate.addDays(plus30Days, -30);
      expect(backToOriginal).toBe(startDate);
    });
  });

  describe('🔒 BOUNDARY TESTS - Edge cases', () => {
    test('should handle year boundaries correctly', () => {
      expect(NZDate.validate('01-01-2020')).toBe(true); // Min year
      expect(NZDate.validate('31-12-2030')).toBe(true); // Max year
      expect(NZDate.validate('31-12-2019')).toBe(false); // Below min
      expect(NZDate.validate('01-01-2031')).toBe(false); // Above max
    });

    test('should handle all month lengths correctly', () => {
      // Test all months with their maximum days
      const monthDays = [
        ['31-01-2025', true], ['29-02-2024', true], ['31-03-2025', true], 
        ['30-04-2025', true], ['31-05-2025', true], ['30-06-2025', true],
        ['31-07-2025', true], ['31-08-2025', true], ['30-09-2025', true],
        ['31-10-2025', true], ['30-11-2025', true], ['31-12-2025', true],
        // Invalid days for each month
        ['32-01-2025', false], ['30-02-2024', false], ['32-03-2025', false],
        ['31-04-2025', false], ['32-05-2025', false], ['31-06-2025', false]
      ];
      
      monthDays.forEach(([date, expected]) => {
        expect(NZDate.validate(date as string)).toBe(expected);
      });
    });

    test('should handle leap year edge cases', () => {
      // Test century years (divisible by 100)
      expect(NZDate.validate('29-02-2024')).toBe(true); // Divisible by 4
      expect(NZDate.validate('29-02-2025')).toBe(false); // Not divisible by 4
    });
  });

  describe('🎯 CUSTOM MATCHER TESTS - Jest extensions', () => {
    test('should use custom toBeValidNZDate matcher', () => {
      expect('15-10-2025').toBeValidNZDate();
      expect('01-01-2025').toBeValidNZDate();
      // Note: The following would fail - just showing the matcher exists
      // expect('2025-10-15').toBeValidNZDate(); 
    });
  });
});