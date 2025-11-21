/**
 * Test Suite for DateUtils - NZ Date Format (DD-MM-YYYY)
 * 
 * Tests cover:
 * - Valid/invalid formats
 * - Leap years
 * - Date arithmetic (addDays)
 * - Date comparison
 * - Edge cases and error handling
 */

import DateUtils from '../../src/js/date-utils.js';

describe('DateUtils', () => {
  describe('isValidNZ', () => {
    test('should return true for valid NZ date formats', () => {
      expect(DateUtils.isValidNZ('01-01-2025')).toBe(true);
      expect(DateUtils.isValidNZ('15-03-2024')).toBe(true);
      expect(DateUtils.isValidNZ('31-12-2023')).toBe(true);
      expect(DateUtils.isValidNZ('29-02-2024')).toBe(true); // Leap year
    });

    test('should return false for invalid NZ date formats', () => {
      expect(DateUtils.isValidNZ('2025-01-01')).toBe(false); // ISO format
      expect(DateUtils.isValidNZ('1-1-2025')).toBe(false); // No leading zeros
      expect(DateUtils.isValidNZ('32-01-2025')).toBe(false); // Invalid day
      expect(DateUtils.isValidNZ('01-13-2025')).toBe(false); // Invalid month
      expect(DateUtils.isValidNZ('29-02-2023')).toBe(false); // Non-leap year
      expect(DateUtils.isValidNZ('31-11-2025')).toBe(false); // November doesn't have 31 days
      expect(DateUtils.isValidNZ('')).toBe(false);
      expect(DateUtils.isValidNZ('invalid')).toBe(false);
      expect(DateUtils.isValidNZ('01/01/2025')).toBe(false); // Wrong separator
    });

    test('should return false for null/undefined inputs', () => {
      expect(DateUtils.isValidNZ(null)).toBe(false);
      expect(DateUtils.isValidNZ(undefined)).toBe(false);
    });
  });

  describe('parseNZ', () => {
    test('should parse valid NZ dates to Date objects', () => {
      const date1 = DateUtils.parseNZ('01-01-2025');
      expect(date1).toBeInstanceOf(Date);
      expect(date1.getFullYear()).toBe(2025);
      expect(date1.getMonth()).toBe(0); // 0-indexed
      expect(date1.getDate()).toBe(1);

      const date2 = DateUtils.parseNZ('15-03-2024');
      expect(date2.getFullYear()).toBe(2024);
      expect(date2.getMonth()).toBe(2); // March = 2
      expect(date2.getDate()).toBe(15);
    });

    test('should handle leap year correctly', () => {
      const leapDate = DateUtils.parseNZ('29-02-2024');
      expect(leapDate.getFullYear()).toBe(2024);
      expect(leapDate.getMonth()).toBe(1); // February = 1
      expect(leapDate.getDate()).toBe(29);
    });

    test('should throw error for invalid NZ format', () => {
      expect(() => DateUtils.parseNZ('2025-01-01')).toThrow('Invalid NZ date format (expected DD-MM-YYYY): 2025-01-01');
      expect(() => DateUtils.parseNZ('1-1-2025')).toThrow('Invalid NZ date format (expected DD-MM-YYYY): 1-1-2025');
      expect(() => DateUtils.parseNZ('')).toThrow('Invalid NZ date format (expected DD-MM-YYYY): ');
    });

    test('should throw error for invalid calendar dates', () => {
      expect(() => DateUtils.parseNZ('32-01-2025')).toThrow('Invalid calendar date: 32-01-2025');
      expect(() => DateUtils.parseNZ('29-02-2023')).toThrow('Invalid calendar date: 29-02-2023');
      expect(() => DateUtils.parseNZ('31-11-2025')).toThrow('Invalid calendar date: 31-11-2025');
    });
  });

  describe('formatNZ', () => {
    test('should format Date objects to NZ format', () => {
      const date1 = new Date(2025, 0, 1); // Jan 1, 2025
      expect(DateUtils.formatNZ(date1)).toBe('01-01-2025');

      const date2 = new Date(2024, 2, 15); // Mar 15, 2024
      expect(DateUtils.formatNZ(date2)).toBe('15-03-2024');

      const date3 = new Date(2023, 11, 31); // Dec 31, 2023
      expect(DateUtils.formatNZ(date3)).toBe('31-12-2023');
    });

    test('should handle single digit days and months with leading zeros', () => {
      const date = new Date(2025, 8, 5); // Sep 5, 2025
      expect(DateUtils.formatNZ(date)).toBe('05-09-2025');
    });

    test('should handle leap year dates', () => {
      const leapDate = new Date(2024, 1, 29); // Feb 29, 2024
      expect(DateUtils.formatNZ(leapDate)).toBe('29-02-2024');
    });
  });

  describe('compareNZ', () => {
    test('should return -1 when first date is before second', () => {
      expect(DateUtils.compareNZ('01-01-2025', '02-01-2025')).toBe(-1);
      expect(DateUtils.compareNZ('01-01-2025', '01-02-2025')).toBe(-1);
      expect(DateUtils.compareNZ('01-01-2024', '01-01-2025')).toBe(-1);
    });

    test('should return 0 when dates are equal', () => {
      expect(DateUtils.compareNZ('01-01-2025', '01-01-2025')).toBe(0);
      expect(DateUtils.compareNZ('15-03-2024', '15-03-2024')).toBe(0);
    });

    test('should return 1 when first date is after second', () => {
      expect(DateUtils.compareNZ('02-01-2025', '01-01-2025')).toBe(1);
      expect(DateUtils.compareNZ('01-02-2025', '01-01-2025')).toBe(1);
      expect(DateUtils.compareNZ('01-01-2026', '01-01-2025')).toBe(1);
    });

    test('should throw error for invalid date formats in comparison', () => {
      expect(() => DateUtils.compareNZ('2025-01-01', '01-01-2025')).toThrow();
      expect(() => DateUtils.compareNZ('01-01-2025', '2025-01-01')).toThrow();
    });
  });

  describe('addDaysNZ', () => {
    test('should add positive days correctly', () => {
      expect(DateUtils.addDaysNZ('01-01-2025', 1)).toBe('02-01-2025');
      expect(DateUtils.addDaysNZ('01-01-2025', 7)).toBe('08-01-2025');
      expect(DateUtils.addDaysNZ('25-01-2025', 10)).toBe('04-02-2025'); // Cross month
    });

    test('should subtract days with negative input', () => {
      expect(DateUtils.addDaysNZ('02-01-2025', -1)).toBe('01-01-2025');
      expect(DateUtils.addDaysNZ('08-01-2025', -7)).toBe('01-01-2025');
      expect(DateUtils.addDaysNZ('05-02-2025', -10)).toBe('26-01-2025'); // Cross month
    });

    test('should handle year boundaries', () => {
      expect(DateUtils.addDaysNZ('31-12-2024', 1)).toBe('01-01-2025');
      expect(DateUtils.addDaysNZ('01-01-2025', -1)).toBe('31-12-2024');
    });

    test('should handle leap years correctly', () => {
      expect(DateUtils.addDaysNZ('28-02-2024', 1)).toBe('29-02-2024'); // Leap year
      expect(DateUtils.addDaysNZ('28-02-2023', 1)).toBe('01-03-2023'); // Non-leap year
    });

    test('should handle zero days (no change)', () => {
      expect(DateUtils.addDaysNZ('15-03-2025', 0)).toBe('15-03-2025');
    });

    test('should throw error for invalid input date format', () => {
      expect(() => DateUtils.addDaysNZ('2025-01-01', 1)).toThrow();
      expect(() => DateUtils.addDaysNZ('invalid', 1)).toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle February 29th in leap years', () => {
      expect(DateUtils.isValidNZ('29-02-2024')).toBe(true);  // 2024 is leap year
      expect(DateUtils.isValidNZ('29-02-2023')).toBe(false); // 2023 is not leap year
      expect(DateUtils.isValidNZ('29-02-2000')).toBe(true);  // 2000 is leap year
      expect(DateUtils.isValidNZ('29-02-1900')).toBe(false); // 1900 is not leap year
    });

    test('should validate days per month correctly', () => {
      // 31-day months
      expect(DateUtils.isValidNZ('31-01-2025')).toBe(true);
      expect(DateUtils.isValidNZ('31-03-2025')).toBe(true);
      expect(DateUtils.isValidNZ('31-05-2025')).toBe(true);
      expect(DateUtils.isValidNZ('31-07-2025')).toBe(true);
      expect(DateUtils.isValidNZ('31-08-2025')).toBe(true);
      expect(DateUtils.isValidNZ('31-10-2025')).toBe(true);
      expect(DateUtils.isValidNZ('31-12-2025')).toBe(true);
      
      // 30-day months
      expect(DateUtils.isValidNZ('31-04-2025')).toBe(false);
      expect(DateUtils.isValidNZ('31-06-2025')).toBe(false);
      expect(DateUtils.isValidNZ('31-09-2025')).toBe(false);
      expect(DateUtils.isValidNZ('31-11-2025')).toBe(false);
    });

    test('should preserve time when formatting (use midday)', () => {
      // This ensures consistent behavior regardless of timezone
      const date = new Date(2025, 0, 1, 12, 0, 0); // Jan 1, 2025 at noon
      expect(DateUtils.formatNZ(date)).toBe('01-01-2025');
    });
  });
});