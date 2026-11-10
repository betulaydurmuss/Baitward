import { describe, expect, it } from 'vitest';
import { parseCsv, validateTargetsCsv } from './csv.js';

describe('parseCsv', () => {
  it('handles quoted fields with commas and escaped quotes', () => {
    const rows = parseCsv('email,note\n"a@b.com","hi, ""friend"""');
    expect(rows).toEqual([
      ['email', 'note'],
      ['a@b.com', 'hi, "friend"'],
    ]);
  });
});

describe('validateTargetsCsv', () => {
  it('accepts valid rows and splits groups', () => {
    const { rows, validCount } = validateTargetsCsv(
      'email,firstName,department,locale,groups\nayse@demo.example,Ayşe,Finance,tr,finance;all',
    );
    expect(validCount).toBe(1);
    expect(rows[0]).toMatchObject({
      valid: true,
      data: {
        email: 'ayse@demo.example',
        firstName: 'Ayşe',
        groups: ['finance', 'all'],
        locale: 'tr',
      },
    });
  });

  it('flags invalid emails, bad locales and in-file duplicates with reasons', () => {
    const { rows, validCount } = validateTargetsCsv(
      [
        'email,locale',
        'not-an-email,tr',
        'ok@demo.example,fr',
        'dup@demo.example,tr',
        'dup@demo.example,en',
      ].join('\n'),
    );
    expect(validCount).toBe(1);
    expect(rows[0]).toMatchObject({ valid: false, reason: 'Invalid email address' });
    expect(rows[1]).toMatchObject({ valid: false, reason: 'Locale must be tr or en' });
    expect(rows[3]).toMatchObject({ valid: false, reason: 'Duplicate email in file' });
  });

  it('reports a missing email column', () => {
    const { rows } = validateTargetsCsv('name,department\nAyse,Finance');
    expect(rows[0]).toMatchObject({ valid: false, reason: 'Missing required "email" column' });
  });
});
