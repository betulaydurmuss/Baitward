import { describe, expect, it } from 'vitest';
import { compose } from './compose.js';

const base = {
  subject: 'Hello {{first_name}} from {{company}}',
  html: '<p>Hi {{first_name}} in {{department}}. {{unknown}}</p>',
  target: { email: 'ayse@demo.example', firstName: 'Ayşe', department: 'Finance' },
  companyName: 'Demo Corp',
  apiBaseUrl: 'https://track.example',
};

describe('compose', () => {
  it('fills personalisation variables and drops unknown ones', () => {
    const { subject, html } = compose({ ...base, token: 'tok1' });
    expect(subject).toBe('Hello Ayşe from Demo Corp');
    expect(html).toContain('Hi Ayşe in Finance.');
    expect(html).not.toContain('{{unknown}}');
  });

  it('adds a tracking link and open pixel carrying the token', () => {
    const { html } = compose({ ...base, token: 'tok-abc' });
    expect(html).toContain('https://track.example/c/tok-abc');
    expect(html).toContain('https://track.example/t/tok-abc');
  });

  it('never puts the recipient email or name in a tracking URL', () => {
    const { html } = compose({ ...base, token: 'tok1' });
    const links = [...html.matchAll(/https:\/\/track\.example\/[ct]\/(\S+?)"/g)].map((m) => m[1]);
    for (const l of links) {
      expect(l).not.toContain('ayse');
      expect(l).not.toContain('Ayşe');
    }
  });

  it('gives different recipients different tracking links', () => {
    const a = compose({ ...base, token: 'tokA' }).html;
    const b = compose({ ...base, token: 'tokB' }).html;
    expect(a).not.toBe(b);
  });
});
