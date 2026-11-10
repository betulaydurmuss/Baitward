import { describe, expect, it } from 'vitest';
import { assertSafeUrl, extractHttpUrls, isPrivateIp } from './ssrf.js';

describe('isPrivateIp', () => {
  it('flags private, loopback, link-local and metadata addresses', () => {
    for (const ip of ['10.0.0.1', '127.0.0.1', '192.168.1.1', '172.16.0.1', '169.254.169.254']) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });

  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34']) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });

  it('handles IPv6 loopback, unique-local and IPv4-mapped forms', () => {
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('fd00::1')).toBe(true);
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateIp('2606:4700:4700::1111')).toBe(false);
  });
});

describe('assertSafeUrl', () => {
  it('rejects a literal private address without a DNS lookup', async () => {
    await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow();
    await expect(assertSafeUrl('http://127.0.0.1:8080')).rejects.toThrow();
  });

  it('rejects non-http(s) schemes', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow();
  });
});

describe('extractHttpUrls', () => {
  it('pulls URLs from src and href attributes', () => {
    const html = '<img src="https://cdn.example/a.png"><a href="http://x.example/b">x</a>';
    expect(extractHttpUrls(html).sort()).toEqual([
      'http://x.example/b',
      'https://cdn.example/a.png',
    ]);
  });
});
