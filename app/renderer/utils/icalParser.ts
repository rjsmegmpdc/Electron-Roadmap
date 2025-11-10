/**
 * iCal Parser for Public Holidays
 * Parses .ics files and extracts holiday events
 */

export interface ICalEvent {
  name: string;
  start_date: string;
  end_date: string;
  year: number;
  month: number;
  day: number;
  end_year: number;
  end_month: number;
  end_day: number;
  description: string;
  isRecurring: boolean;
}

export interface ParsedHolidays {
  holidays: ICalEvent[];
  errors: string[];
}

/**
 * Parse an iCal file content and extract holiday events
 */
export function parseICalFile(fileContent: string): ParsedHolidays {
  const holidays: ICalEvent[] = [];
  const errors: string[] = [];

  try {
    // Split by VEVENT blocks
    const events = fileContent.split('BEGIN:VEVENT');

    for (let i = 1; i < events.length; i++) {
      const eventBlock = events[i].split('END:VEVENT')[0];
      
      try {
        const holiday = parseEvent(eventBlock);
        if (holiday) {
          holidays.push(holiday);
        }
      } catch (error) {
        errors.push(`Failed to parse event ${i}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to parse iCal file: ${error}`);
  }

  return { holidays, errors };
}

/**
 * Parse a single VEVENT block
 */
function parseEvent(eventBlock: string): ICalEvent | null {
  const lines = eventBlock.split(/\r?\n/).filter(line => line.trim());
  
  let name = '';
  let startDateStr = '';
  let endDateStr = '';
  let description = '';
  let isRecurring = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('SUMMARY:')) {
      name = trimmedLine.substring('SUMMARY:'.length).trim();
    } else if (trimmedLine.startsWith('DTSTART;VALUE=DATE:')) {
      startDateStr = trimmedLine.substring('DTSTART;VALUE=DATE:'.length).trim();
    } else if (trimmedLine.startsWith('DTSTART:')) {
      startDateStr = trimmedLine.substring('DTSTART:'.length).trim().substring(0, 8);
    } else if (trimmedLine.startsWith('DTEND;VALUE=DATE:')) {
      endDateStr = trimmedLine.substring('DTEND;VALUE=DATE:'.length).trim();
    } else if (trimmedLine.startsWith('DTEND:')) {
      endDateStr = trimmedLine.substring('DTEND:'.length).trim().substring(0, 8);
    } else if (trimmedLine.startsWith('DESCRIPTION:')) {
      description = trimmedLine.substring('DESCRIPTION:'.length).trim();
    } else if (trimmedLine.startsWith('RRULE:')) {
      isRecurring = true;
    }
  }

  if (!name || !startDateStr) {
    return null;
  }

  // If no end date, use start date
  if (!endDateStr) {
    endDateStr = startDateStr;
  }

  // Parse start date from YYYYMMDD format
  const startYear = parseInt(startDateStr.substring(0, 4));
  const startMonth = parseInt(startDateStr.substring(4, 6));
  const startDay = parseInt(startDateStr.substring(6, 8));

  // Parse end date from YYYYMMDD format
  const endYear = parseInt(endDateStr.substring(0, 4));
  const endMonth = parseInt(endDateStr.substring(4, 6));
  const endDay = parseInt(endDateStr.substring(6, 8));

  // Format dates as DD-MM-YYYY
  const formattedStartDate = `${startDay.toString().padStart(2, '0')}-${startMonth.toString().padStart(2, '0')}-${startYear}`;
  const formattedEndDate = `${endDay.toString().padStart(2, '0')}-${endMonth.toString().padStart(2, '0')}-${endYear}`;

  return {
    name,
    start_date: formattedStartDate,
    end_date: formattedEndDate,
    year: startYear,
    month: startMonth,
    day: startDay,
    end_year: endYear,
    end_month: endMonth,
    end_day: endDay,
    description: description || '',
    isRecurring
  };
}

/**
 * Read and parse an iCal file from disk
 */
export async function importICalFile(filePath: string): Promise<ParsedHolidays> {
  try {
    // Use Electron API to read file
    if (window.electronAPI?.readFile) {
      const content = await window.electronAPI.readFile(filePath);
      return parseICalFile(content);
    }
    
    throw new Error('Electron API not available');
  } catch (error) {
    return {
      holidays: [],
      errors: [`Failed to read file: ${error}`]
    };
  }
}

/**
 * Validate a parsed holiday event
 */
export function validateHoliday(holiday: ICalEvent): string[] {
  const errors: string[] = [];

  if (!holiday.name) {
    errors.push('Holiday name is required');
  }

  if (!holiday.date) {
    errors.push('Date is required');
  }

  if (holiday.year < 1900 || holiday.year > 2100) {
    errors.push('Year must be between 1900 and 2100');
  }

  if (holiday.month < 1 || holiday.month > 12) {
    errors.push('Month must be between 1 and 12');
  }

  if (holiday.day < 1 || holiday.day > 31) {
    errors.push('Day must be between 1 and 31');
  }

  return errors;
}
