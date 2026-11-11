// Renders an HTML string to an A4 PDF using a system browser via puppeteer-core.
import puppeteer from 'puppeteer-core';
import { findBrowserExecutable } from './browser.js';

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: findBrowserExecutable(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
