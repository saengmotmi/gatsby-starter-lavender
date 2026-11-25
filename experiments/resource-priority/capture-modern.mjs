import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const [url, output] = process.argv.slice(2);
if (!url || !output) throw new Error('Usage: yarn modern-screenshot <url> <output.png>');
// Pinned browser-only capture tool; does not enter the blog dependency graph.
const source = process.env.MODERN_SCREENSHOT_SCRIPT
  ? await fs.readFile(process.env.MODERN_SCREENSHOT_SCRIPT, 'utf8')
  : await fetch('https://unpkg.com/modern-screenshot@4.6.6/dist/index.js').then(r => {
      if (!r.ok) throw new Error(`modern-screenshot download: ${r.status}`);
      return r.text();
    });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const origin = new URL(url).origin;
  await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ content: source });
  const dataUrl = await page.evaluate(() => window.modernScreenshot.domToPng(document.documentElement, {
    width: 1280, height: 900, scale: 1,
    filter: node => !['SCRIPT', 'IFRAME'].includes(node.nodeName),
  }));
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`modern-screenshot 4.6.6: ${url} -> ${output}`);
} finally { await browser.close(); }
