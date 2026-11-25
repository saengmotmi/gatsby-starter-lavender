import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const out = path.resolve('docs/benchmarks/resource-priority');
await fs.mkdir(out, { recursive: true });
const variants = ['baseline', 'css-first', 'font-bold', 'font-all'].map((name, index) => ({ name, port: 4321 + index }));
const pages = [{ slug: 'home', url: '/' }, { slug: 'rsc-article', url: '/react/what-is-rsc/' }, { slug: 'carpenters-life', url: '/article/carpenters-life/' }];
const report = { pages: [], functional: [], diffs: [] };
const browser = await chromium.launch();
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    for (const variant of variants) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' });
      await context.route('**/*', r => r.request().url().startsWith(`http://127.0.0.1:${variant.port}`) ? r.continue() : r.abort());
      for (const target of pages) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${variant.port}${target.url}`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(600);
        const snapshot = await page.evaluate(() => ({ text: document.querySelector('main').innerText, font: getComputedStyle(document.body).fontFamily, fontStatus: document.fonts.status, h1: [...document.querySelectorAll('h1')].map(e => ({ text: e.textContent, size: getComputedStyle(e).fontSize, width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })), stylesheets: [...document.styleSheets].map(s => s.href), overflow: document.documentElement.scrollWidth > innerWidth }));
        const filename = `${variant.name}-${target.slug}-${viewport.width}.png`;
        await page.screenshot({ path: path.join(out, filename), animations: 'disabled' });
        report.pages.push({ variant: variant.name, target: target.slug, viewport, filename, ...snapshot, errors });
        if (!snapshot.font.includes('Pretendard')) throw new Error(`${variant.name}: missing Pretendard CSS`);
        expect(errors).toEqual([]);
        await page.close();
      }
      await context.close();
    }
  }
  for (const variant of variants) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
    await context.route('**/*', r => r.request().url().startsWith(`http://127.0.0.1:${variant.port}`) ? r.continue() : r.abort());
    const page = await context.newPage();
    const errors = [], failures = [], documentRequests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) failures.push({ url: r.url(), status: r.status() }); });
    page.on('request', r => { if (r.isNavigationRequest() && r.frame() === page.mainFrame()) documentRequests.push(r.url()); });
    await page.goto(`http://127.0.0.1:${variant.port}/`);
    await page.waitForTimeout(300);
    await page.locator('header [role=button]').click();
    await expect(page.locator('header [role=button]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('header [role=button]').click();
    await page.getByRole('button', { name: 'Fleeting', exact: true }).click();
    await expect(page).toHaveURL(/type=fleeting/);
    await page.getByRole('button', { name: 'Article', exact: true }).click();
    await page.locator('a[href="/react/what-is-rsc/"]').first().click();
    await expect(page.locator('article h1').first()).toContainText('RSC');
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(300);
    const scroll = await page.evaluate(() => scrollY);
    await page.goBack();
    await expect(page).toHaveURL(`http://127.0.0.1:${variant.port}/`);
    await page.goForward();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll - 140);
    expect(documentRequests).toHaveLength(1);
    const anchor = page.locator('article a[href^="#"]').first();
    const hash = await anchor.getAttribute('href');
    await anchor.click();
    await expect.poll(() => page.evaluate(id => { const t = document.getElementById(id)?.getBoundingClientRect().top; return t !== undefined && t >= 0 && t < innerHeight * 0.6; }, decodeURIComponent(hash.slice(1)))).toBe(true);
    // Regression check for a non-ASCII article URL.
    await page.goto(`http://127.0.0.1:${variant.port}/javascript-study/2021-09-01-클로저/`);
    await expect(page.locator('article h1').first()).toContainText('클로저');
    expect(errors).toEqual([]); expect(failures).toEqual([]);
    report.functional.push({ variant: variant.name, theme: true, filter: true, clientNavigation: true, historyScroll: true, hash: true, koreanPath: true, errors, failures });
    await context.close();
  }
  for (const candidate of report.pages.filter(p => p.variant !== 'baseline')) {
    const baseline = report.pages.find(p => p.variant === 'baseline' && p.target === candidate.target && p.viewport.width === candidate.viewport.width);
    expect(candidate.text).toBe(baseline.text);
    const a = await sharp(path.join(out, baseline.filename)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const b = await sharp(path.join(out, candidate.filename)).ensureAlpha().raw().toBuffer();
    const diff = Buffer.alloc(a.data.length); let changed = 0;
    for (let i = 0; i < a.data.length; i += 4) {
      const delta = Math.max(...[0,1,2].map(c => Math.abs(a.data[i+c] - b[i+c])));
      if (delta > 10) changed++;
      diff[i] = delta > 10 ? 255 : 0; diff[i+1] = 0; diff[i+2] = 0; diff[i+3] = 255;
    }
    const filename = `diff-${candidate.filename}`;
    await sharp(diff, { raw: a.info }).png().toFile(path.join(out, filename));
    report.diffs.push({ variant: candidate.variant, target: candidate.target, width: candidate.viewport.width, changedPixels: changed, changedPercent: changed / (a.info.width * a.info.height) * 100, sameText: true, filename });
  }
} finally {
  await fs.writeFile(path.join(out, 'verification.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ functional: report.functional, diffs: report.diffs }, null, 2));
