// CSV import for targets: a small RFC-ish parser plus validation that reports, per
// row, whether it is importable and if not, why. Kept pure so it is easy to test.
export type ParsedTarget = {
  email: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  locale: 'tr' | 'en';
  groups: string[];
};

export type ImportRow =
  | { line: number; valid: true; data: ParsedTarget }
  | { line: number; valid: false; reason: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Parses CSV text into rows of fields, handling quoted fields and escaped quotes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const COLUMN_ALIASES: Record<string, keyof ParsedTarget | 'skip'> = {
  email: 'email',
  firstname: 'firstName',
  first_name: 'firstName',
  lastname: 'lastName',
  last_name: 'lastName',
  department: 'department',
  locale: 'locale',
  groups: 'groups',
};

// Validates CSV text against the target schema. The first row is the header.
export function validateTargetsCsv(text: string): { rows: ImportRow[]; validCount: number } {
  const parsed = parseCsv(text);
  if (parsed.length === 0) return { rows: [], validCount: 0 };

  const header = parsed[0]!.map((h) => h.trim().toLowerCase());
  const cols = header.map((h) => COLUMN_ALIASES[h] ?? 'skip');
  if (!cols.includes('email')) {
    return {
      rows: [{ line: 1, valid: false, reason: 'Missing required "email" column' }],
      validCount: 0,
    };
  }

  const rows: ImportRow[] = [];
  let validCount = 0;
  const seen = new Set<string>();

  for (let r = 1; r < parsed.length; r++) {
    const line = r + 1;
    const cells = parsed[r]!;
    const record: Record<string, string> = {};
    cols.forEach((key, i) => {
      if (key !== 'skip') record[key] = (cells[i] ?? '').trim();
    });

    const email = (record.email ?? '').toLowerCase();
    if (!EMAIL_RE.test(email)) {
      rows.push({ line, valid: false, reason: 'Invalid email address' });
      continue;
    }
    if (seen.has(email)) {
      rows.push({ line, valid: false, reason: 'Duplicate email in file' });
      continue;
    }
    const localeRaw = (record.locale ?? '').toLowerCase();
    if (localeRaw && localeRaw !== 'tr' && localeRaw !== 'en') {
      rows.push({ line, valid: false, reason: 'Locale must be tr or en' });
      continue;
    }

    seen.add(email);
    validCount += 1;
    rows.push({
      line,
      valid: true,
      data: {
        email,
        firstName: record.firstName || undefined,
        lastName: record.lastName || undefined,
        department: record.department || undefined,
        locale: localeRaw === 'en' ? 'en' : 'tr',
        groups: (record.groups ?? '')
          .split(';')
          .map((g) => g.trim())
          .filter(Boolean),
      },
    });
  }

  return { rows, validCount };
}

export const SAMPLE_CSV = [
  'email,firstName,lastName,department,locale,groups',
  'ayse@demo.example,Ayşe,Yılmaz,Finance,tr,finance;all',
  'john@demo.example,John,Carter,Sales,en,sales;all',
].join('\n');
