// app/main/utils/dateParser.ts

/**
 * Parse various date formats and convert to ISO
 * Supports: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, DD.MM.YYYY, M/D/YYYY
 * @param dateStr Date string in various formats
 * @returns ISO date string or null if invalid
 */
export function parseNZDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const trimmed = dateStr.trim();
  
  // Try DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  let parts = trimmed.split(/[-\/\.]/);
  
  if (parts.length === 3) {
    let day: number, month: number, year: number;
    
    // Check if it's YYYY-MM-DD format (year first)
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
    // Otherwise assume DD-MM-YYYY or similar
    else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
    }
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31) return null;
    if (month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;
    
    // Create date and validate it's real
    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null; // Invalid date like 31-11-2025
    }
    
    return date.toISOString();
  }
  
  // Try parsing as ISO date directly
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString();
  }
  
  return null;
}

/**
 * Format ISO date to DD-MM-YYYY
 */
export function formatToNZDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Get month name from date string
 */
export function getMonthName(dateStr: string): string {
  const date = dateStr.includes('-') 
    ? new Date(parseNZDate(dateStr) || '') 
    : new Date(dateStr);
  
  return date.toLocaleString('en-US', { month: 'long' });
}
