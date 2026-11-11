// Finds a Chromium-based browser to drive with puppeteer-core. We use the system
// Chrome/Edge instead of a downloaded Chromium, which keeps installs light and
// avoids shipping a browser binary.
import fs from 'node:fs';

const CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

export function findBrowserExecutable(): string {
  for (const path of CANDIDATES) {
    if (path && fs.existsSync(path)) return path;
  }
  throw new Error(
    'No Chromium-based browser found. Install Chrome/Edge or set PUPPETEER_EXECUTABLE_PATH.',
  );
}
