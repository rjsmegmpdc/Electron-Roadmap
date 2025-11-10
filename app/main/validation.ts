import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export function parseNZDateToISO(nz: string): string {
  // Strict DD-MM-YYYY parsing
  const d = dayjs(nz, 'DD-MM-YYYY', true);
  if (!d.isValid()) throw new Error(`Invalid NZ date: ${nz}`);
  return d.format('YYYY-MM-DD');
}

export function parseNZDToCents(input: string | number): number {
  const s = String(input).trim().replace(/,/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(s)) {
    throw new Error(`Invalid NZD (max 2dp): ${input}`);
  }
  const parts = s.split('.');
  const dollars = parseInt(parts[0] || '0', 10);
  const cents = parseInt((parts[1] || '').padEnd(2, '0').slice(0, 2) || '0', 10);
  return dollars * 100 + cents;
}

export function centsToNZD(cents: number): number {
  return Math.round(cents) / 100;
}