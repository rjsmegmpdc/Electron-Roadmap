/**
 * New Zealand Currency Validation and Formatting
 * Handles NZD amounts with strict 2-decimal precision
 */
export class NZCurrency {
  private static readonly MAX_AMOUNT = 99999999.99; // Max ~100M NZD
  private static readonly CURRENCY_REGEX = /^[\d,]+(?:\.\d{1,2})?$/;

  /**
   * Validates a currency string in NZD format
   * @param value - String like "1,234.56" or "1234.56" or "1234"
   * @returns true if valid NZD format
   */
  static validate(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    
    // Remove whitespace
    const cleaned = value.trim();
    if (!cleaned) return false;
    
    // Check basic format
    if (!this.CURRENCY_REGEX.test(cleaned)) return false;
    
    // Parse and validate range
    try {
      const amount = this.parseToNumber(cleaned);
      return amount >= 0 && amount <= this.MAX_AMOUNT;
    } catch {
      return false;
    }
  }

  /**
   * Parses NZD string to number with 2 decimal places
   * @param value - String like "1,234.56"
   * @returns number like 1234.56
   */
  static parseToNumber(value: string): number {
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);
    
    if (isNaN(num)) {
      throw new Error(`Invalid currency format: ${value}`);
    }
    
    // Check decimal places
    const decimalPart = cleaned.split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      throw new Error(`Too many decimal places: ${value}. Maximum 2 decimal places allowed.`);
    }
    
    return Math.round(num * 100) / 100; // Ensure 2 decimal precision
  }

  /**
   * Converts NZD string to cents (integer)
   * @param value - String like "1,234.56"
   * @returns number like 123456 (cents)
   */
  static parseToCents(value: string): number {
    const dollarAmount = this.parseToNumber(value);
    return Math.round(dollarAmount * 100);
  }

  /**
   * Formats cents back to NZD display string
   * @param cents - Integer cents like 123456
   * @returns formatted string like "1,234.56"
   */
  static formatFromCents(cents: number): string {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new Error(`Invalid cents value: ${cents}. Must be non-negative integer.`);
    }
    
    const dollars = cents / 100;
    return this.format(dollars);
  }

  /**
   * Formats a numeric amount to NZ currency string
   * @param amount - Number like 1234.56
   * @returns formatted string like "1,234.56"
   */
  static format(amount: number): string {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error(`Invalid amount: ${amount}. Must be a valid number.`);
    }
    
    return amount.toLocaleString('en-NZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Formats a numeric amount to NZ currency string (alias for format)
   * @param amount - Number like 1234.56
   * @returns formatted string like "1,234.56"
   */
  static formatNumber(amount: number): string {
    return this.format(amount);
  }

  /**
   * Formats cents to NZD currency string
   * @param cents - Integer cents value like 155000 (for $1,550.00)
   * @returns formatted string like "$1,550.00"
   */
  static formatCents(cents: number): string {
    if (typeof cents !== 'number' || isNaN(cents)) {
      return '$0.00';
    }
    
    const amount = cents / 100;
    return '$' + amount.toLocaleString('en-NZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

/**
 * New Zealand Date Validation and Formatting
 * Handles DD-MM-YYYY format exclusively
 */
export class NZDate {
  private static readonly DATE_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;
  private static readonly MIN_YEAR = 2020;
  private static readonly MAX_YEAR = 2030;

  /**
   * Validates a date string in DD-MM-YYYY format
   * @param dateString - String like "01-03-2025"
   * @returns true if valid NZ date format
   */
  static validate(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') return false;
    
    const match = dateString.match(this.DATE_REGEX);
    if (!match) return false;
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Basic range checks
    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < this.MIN_YEAR || yearNum > this.MAX_YEAR) return false;
    
    // Create date and verify it's valid (handles leap years, etc.)
    const jsDate = new Date(yearNum, monthNum - 1, dayNum);
    return jsDate.getFullYear() === yearNum && 
           jsDate.getMonth() === monthNum - 1 && 
           jsDate.getDate() === dayNum;
  }

  /**
   * Parses DD-MM-YYYY string to JavaScript Date object
   * @param dateString - String like "01-03-2025"
   * @returns Date object
   */
  static parse(dateString: string): Date {
    if (!this.validate(dateString)) {
      throw new Error(`Invalid date format: ${dateString}. Expected DD-MM-YYYY.`);
    }
    
    const [, day, month, year] = dateString.match(this.DATE_REGEX)!;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }

  /**
   * Formats JavaScript Date to DD-MM-YYYY string
   * @param date - JavaScript Date object
   * @returns formatted string like "01-03-2025"
   */
  static format(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error(`Invalid date object: ${date}`);
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    return `${day}-${month}-${year}`;
  }

  /**
   * Converts DD-MM-YYYY to ISO string (YYYY-MM-DD)
   * @param dateString - String like "01-03-2025"
   * @returns ISO string like "2025-03-01"
   */
  static toISO(dateString: string): string {
    if (!this.validate(dateString)) {
      throw new Error(`Invalid date format: ${dateString}. Expected DD-MM-YYYY.`);
    }
    
    const [, day, month, year] = dateString.match(this.DATE_REGEX)!;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  /**
   * Converts ISO string (YYYY-MM-DD) to DD-MM-YYYY
   * @param isoString - String like "2025-03-01"
   * @returns NZ format string like "01-03-2025"
   */
  static fromISO(isoString: string): string {
    // Basic format check
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = isoString.match(isoRegex);
    if (!match) {
      throw new Error(`Invalid ISO date string: ${isoString}`);
    }
    
    const [, year, month, day] = match;
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    
    // Check for impossible dates before creating Date object
    if (monthNum < 1 || monthNum > 12) {
      throw new Error(`Invalid ISO date string: ${isoString}`);
    }
    
    // Create date and verify it matches the input (handles impossible dates like Feb 30)
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getFullYear() !== yearNum || 
        date.getMonth() !== monthNum - 1 || 
        date.getDate() !== dayNum) {
      throw new Error(`Invalid ISO date string: ${isoString}`);
    }
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ISO date string: ${isoString}`);
    }
    
    return this.format(date);
  }

  /**
   * Gets current date in DD-MM-YYYY format
   * @returns current date string like "15-10-2025"
   */
  static today(): string {
    return this.format(new Date());
  }

  /**
   * Adds days to a DD-MM-YYYY date string
   * @param dateString - String like "01-03-2025"
   * @param days - Number of days to add (can be negative)
   * @returns new date string
   */
  static addDays(dateString: string, days: number): string {
    const date = this.parse(dateString);
    date.setDate(date.getDate() + days);
    return this.format(date);
  }
}