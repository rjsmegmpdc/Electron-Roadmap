import { NZCurrency } from '../../app/renderer/utils/validation';

describe('NZCurrency', () => {
  describe('validate()', () => {
    describe('✅ POSITIVE TESTS - Valid currency formats', () => {
      test('should accept valid whole numbers', () => {
        expect(NZCurrency.validate('1234')).toBe(true);
        expect(NZCurrency.validate('0')).toBe(true);
        expect(NZCurrency.validate('999999')).toBe(true);
      });

      test('should accept valid amounts with comma separators', () => {
        expect(NZCurrency.validate('1,234')).toBe(true);
        expect(NZCurrency.validate('1,234,567')).toBe(true);
        expect(NZCurrency.validate('12,345,678.99')).toBe(true);
      });

      test('should accept valid amounts with decimals', () => {
        expect(NZCurrency.validate('1234.56')).toBe(true);
        expect(NZCurrency.validate('0.01')).toBe(true);
        expect(NZCurrency.validate('99999999.99')).toBe(true);
      });

      test('should accept amounts with single decimal place', () => {
        expect(NZCurrency.validate('1234.5')).toBe(true);
        expect(NZCurrency.validate('0.9')).toBe(true);
      });

      test('should accept zero and minimal amounts', () => {
        expect(NZCurrency.validate('0.00')).toBe(true);
        expect(NZCurrency.validate('0.01')).toBe(true);
        expect(NZCurrency.validate('1.00')).toBe(true);
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid currency formats', () => {
      test('should reject empty and null values', () => {
        expect(NZCurrency.validate('')).toBe(false);
        expect(NZCurrency.validate('   ')).toBe(false);
        expect(NZCurrency.validate(null as any)).toBe(false);
        expect(NZCurrency.validate(undefined as any)).toBe(false);
      });

      test('should reject non-string values', () => {
        expect(NZCurrency.validate(1234 as any)).toBe(false);
        expect(NZCurrency.validate([] as any)).toBe(false);
        expect(NZCurrency.validate({} as any)).toBe(false);
      });

      test('should reject amounts with more than 2 decimal places', () => {
        expect(NZCurrency.validate('10.999')).toBe(false);
        expect(NZCurrency.validate('1234.567')).toBe(false);
        expect(NZCurrency.validate('0.001')).toBe(false);
      });

      test('should reject negative amounts', () => {
        expect(NZCurrency.validate('-100')).toBe(false);
        expect(NZCurrency.validate('-1.50')).toBe(false);
        expect(NZCurrency.validate('-0.01')).toBe(false);
      });

      test('should reject amounts exceeding maximum', () => {
        expect(NZCurrency.validate('100000000')).toBe(false); // Over 99,999,999.99
        expect(NZCurrency.validate('999999999.99')).toBe(false);
      });

      test('should reject invalid characters', () => {
        expect(NZCurrency.validate('$1234')).toBe(false);
        expect(NZCurrency.validate('1234 NZD')).toBe(false);
        expect(NZCurrency.validate('1,234.56.78')).toBe(false);
        expect(NZCurrency.validate('abc')).toBe(false);
        expect(NZCurrency.validate('12.34.56')).toBe(false);
      });
    });
  });

  describe('parseToNumber()', () => {
    describe('✅ POSITIVE TESTS - Valid parsing', () => {
      test('should parse whole numbers correctly', () => {
        expect(NZCurrency.parseToNumber('1234')).toBe(1234);
        expect(NZCurrency.parseToNumber('0')).toBe(0);
      });

      test('should parse comma-separated amounts', () => {
        expect(NZCurrency.parseToNumber('1,234')).toBe(1234);
        expect(NZCurrency.parseToNumber('1,234,567')).toBe(1234567);
      });

      test('should parse decimal amounts', () => {
        expect(NZCurrency.parseToNumber('1234.56')).toBe(1234.56);
        expect(NZCurrency.parseToNumber('1.50')).toBe(1.50);
        expect(NZCurrency.parseToNumber('0.99')).toBe(0.99);
      });

      test('should handle precision correctly', () => {
        expect(NZCurrency.parseToNumber('123.45')).toBe(123.45);
        expect(NZCurrency.parseToNumber('0.01')).toBe(0.01);
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid parsing', () => {
      test('should throw on invalid formats', () => {
        expect(() => NZCurrency.parseToNumber('abc')).toThrow('Invalid currency format');
        expect(() => NZCurrency.parseToNumber('')).toThrow('Invalid currency format');
        expect(() => NZCurrency.parseToNumber('$123')).toThrow('Invalid currency format');
      });

      test('should throw on too many decimal places', () => {
        expect(() => NZCurrency.parseToNumber('10.999')).toThrow('Too many decimal places');
        expect(() => NZCurrency.parseToNumber('123.456')).toThrow('Too many decimal places');
      });
    });
  });

  describe('parseToCents()', () => {
    describe('✅ POSITIVE TESTS - Convert to cents', () => {
      test('should convert dollars to cents correctly', () => {
        expect(NZCurrency.parseToCents('1.00')).toBe(100);
        expect(NZCurrency.parseToCents('1234.56')).toBe(123456);
        expect(NZCurrency.parseToCents('0.01')).toBe(1);
        expect(NZCurrency.parseToCents('0')).toBe(0);
      });

      test('should handle comma-separated amounts', () => {
        expect(NZCurrency.parseToCents('1,234.56')).toBe(123456);
        expect(NZCurrency.parseToCents('12,345.67')).toBe(1234567);
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid conversion', () => {
      test('should throw on invalid input', () => {
        expect(() => NZCurrency.parseToCents('abc')).toThrow();
        expect(() => NZCurrency.parseToCents('10.999')).toThrow();
      });
    });
  });

  describe('formatFromCents()', () => {
    describe('✅ POSITIVE TESTS - Format from cents', () => {
      test('should format cents to currency string', () => {
        expect(NZCurrency.formatFromCents(100)).toBe('1.00');
        expect(NZCurrency.formatFromCents(123456)).toBe('1,234.56');
        expect(NZCurrency.formatFromCents(1)).toBe('0.01');
        expect(NZCurrency.formatFromCents(0)).toBe('0.00');
      });

      test('should handle large amounts', () => {
        expect(NZCurrency.formatFromCents(1000000)).toBe('10,000.00');
        expect(NZCurrency.formatFromCents(9999999999)).toBe('99,999,999.99');
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid cents values', () => {
      test('should throw on non-integer cents', () => {
        expect(() => NZCurrency.formatFromCents(123.45)).toThrow('Invalid cents value');
        expect(() => NZCurrency.formatFromCents(NaN)).toThrow('Invalid cents value');
      });

      test('should throw on negative cents', () => {
        expect(() => NZCurrency.formatFromCents(-100)).toThrow('Invalid cents value');
        expect(() => NZCurrency.formatFromCents(-1)).toThrow('Invalid cents value');
      });
    });
  });

  describe('formatNumber()', () => {
    describe('✅ POSITIVE TESTS - Number formatting', () => {
      test('should format numbers with proper locale', () => {
        expect(NZCurrency.formatNumber(1234.56)).toBe('1,234.56');
        expect(NZCurrency.formatNumber(0)).toBe('0.00');
        expect(NZCurrency.formatNumber(1)).toBe('1.00');
      });

      test('should always show 2 decimal places', () => {
        expect(NZCurrency.formatNumber(1234)).toBe('1,234.00');
        expect(NZCurrency.formatNumber(1234.5)).toBe('1,234.50');
      });
    });

    describe('❌ NEGATIVE TESTS - Invalid numbers', () => {
      test('should throw on invalid number types', () => {
        expect(() => NZCurrency.formatNumber('123' as any)).toThrow('Invalid amount');
        expect(() => NZCurrency.formatNumber(NaN)).toThrow('Invalid amount');
        expect(() => NZCurrency.formatNumber(undefined as any)).toThrow('Invalid amount');
      });
    });
  });

  describe('🧪 INTEGRATION TESTS - End-to-end workflows', () => {
    test('should handle round-trip conversion (string -> cents -> string)', () => {
      const original = '1,234.56';
      const cents = NZCurrency.parseToCents(original);
      const formatted = NZCurrency.formatFromCents(cents);
      expect(formatted).toBe('1,234.56');
    });

    test('should maintain precision through conversions', () => {
      const testAmounts = ['0.01', '1.99', '1234.56', '99999.99'];
      
      testAmounts.forEach(amount => {
        const cents = NZCurrency.parseToCents(amount);
        const backToString = NZCurrency.formatFromCents(cents);
        const normalizedOriginal = NZCurrency.formatNumber(NZCurrency.parseToNumber(amount));
        expect(backToString).toBe(normalizedOriginal);
      });
    });
  });

  describe('🔒 BOUNDARY TESTS - Edge cases', () => {
    test('should handle maximum allowed amount', () => {
      const maxAmount = '99,999,999.99';
      expect(NZCurrency.validate(maxAmount)).toBe(true);
      expect(NZCurrency.parseToCents(maxAmount)).toBe(9999999999);
    });

    test('should handle minimum allowed amount', () => {
      expect(NZCurrency.validate('0.01')).toBe(true);
      expect(NZCurrency.parseToCents('0.01')).toBe(1);
    });

    test('should reject amounts just over the limit', () => {
      expect(NZCurrency.validate('100,000,000.00')).toBe(false);
    });
  });
});