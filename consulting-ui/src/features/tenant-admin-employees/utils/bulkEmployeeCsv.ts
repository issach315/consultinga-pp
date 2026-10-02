import { exportRowsToCsv } from '@/utils/exportCsv';

export function downloadEmployeeCsvTemplate(): void {
  exportRowsToCsv(
    [
      {
        'First Name': 'Jane',
        'Last Name': 'Doe',
        Email: 'jane.doe@company.com',
        Department: 'Recruitment',
      },
    ],
    'employee-bulk-onboarding-template.csv',
  );
}

export interface ParsedEmployeeCsvRow {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}

/** Splits one CSV line into fields, honoring double-quoted values (with "" as an escaped quote). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

const HEADER_ALIASES: Record<string, keyof ParsedEmployeeCsvRow> = {
  firstname: 'firstName',
  'first name': 'firstName',
  lastname: 'lastName',
  'last name': 'lastName',
  email: 'email',
  department: 'department',
};

/** Parses the app's employee CSV template (or any file with matching header names) into rows. */
export function parseEmployeeCsv(text: string): ParsedEmployeeCsvRow[] {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headerCells = splitCsvLine(lines[0]!);
  const columnKeys = headerCells.map((cell) => HEADER_ALIASES[cell.trim().toLowerCase()]);

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: ParsedEmployeeCsvRow = { firstName: '', lastName: '', email: '', department: '' };
    columnKeys.forEach((key, index) => {
      if (key) row[key] = cells[index] ?? '';
    });
    return row;
  });
}
