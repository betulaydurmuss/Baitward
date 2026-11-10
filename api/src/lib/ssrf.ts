// SSRF protection. Anything the server might reach out to on behalf of a user —
// here, external resource URLs inside an email template — is resolved to its IP
// addresses first, and refused if any of them point inside a private network or at
// a cloud metadata endpoint.
import dns from 'node:dns/promises';
import net from 'node:net';
import { AppError } from './http-error.js';

// True for addresses that must never be reachable from a user-supplied URL.
export function isPrivateIp(ip: string): boolean {
  // Normalise IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1) to the IPv4 form.
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const addr = mapped ? mapped[1]! : ip;

  if (net.isIPv4(addr)) {
    const parts = addr.split('.').map(Number);
    const [a, b] = parts as [number, number, number, number];
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    return false;
  }

  const lower = addr.toLowerCase();
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local fc00::/7
  if (lower.startsWith('fe80')) return true; // link-local
  return false;
}

// Rejects a URL whose scheme is not http(s) or that resolves to a private address.
export async function assertSafeUrl(raw: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError(400, 'bad_url', `Not a valid URL: ${raw}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppError(400, 'bad_url', 'Only http(s) URLs are allowed');
  }

  const host = url.hostname;
  let addresses: string[];
  if (net.isIP(host)) {
    addresses = [host];
  } else {
    const resolved = await dns.lookup(host, { all: true });
    addresses = resolved.map((r) => r.address);
  }
  for (const ip of addresses) {
    if (isPrivateIp(ip)) {
      throw new AppError(400, 'blocked_url', `URL resolves to a blocked address: ${host}`);
    }
  }
}

// Pulls http(s) URLs out of src="" and href="" attributes in template HTML.
export function extractHttpUrls(html: string): string[] {
  const urls = new Set<string>();
  const re = /\b(?:src|href)\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    urls.add(match[1]!);
  }
  return [...urls];
}

// Validates every external URL referenced by a template's HTML.
export async function assertTemplateUrlsSafe(html: string): Promise<void> {
  for (const url of extractHttpUrls(html)) {
    await assertSafeUrl(url);
  }
}
