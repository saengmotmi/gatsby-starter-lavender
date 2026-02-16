import { expect, test } from "@playwright/test";

const ARTICLE_SELECTOR = "main > article[itemtype='http://schema.org/Article']";

test("restores article scroll position after history back/forward", async ({ page }) => {
  await page.goto("/");

  const firstPostLink = page.locator(".post-list-item a").first();
  await expect(firstPostLink).toBeVisible();
  await firstPostLink.click();

  await expect(page.locator(ARTICLE_SELECTOR)).toBeVisible();

  const expectedScrollY = await page.evaluate(() => {
    const maxScrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const target = Math.min(1400, maxScrollable);
    window.scrollTo(0, target);
    return target;
  });

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  const articleUrl = page.url();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);

  await page.goForward();
  await expect(page).toHaveURL(articleUrl);
  await expect(page.locator(ARTICLE_SELECTOR)).toBeVisible();
  await expect.poll(() => page.evaluate((target) => Math.abs(window.scrollY - target), expectedScrollY)).toBeLessThan(140);
});

test("keeps hash anchor navigation behavior", async ({ page }) => {
  await page.goto("/react/what-is-rsc/");
  await expect(page.locator(ARTICLE_SELECTOR)).toBeVisible();

  const hash = await page.locator(`${ARTICLE_SELECTOR} a[href^='#']`).first().getAttribute("href");
  expect(hash).toBeTruthy();

  const decodedTargetId = decodeURIComponent((hash as string).slice(1));
  await page.goto(`/react/what-is-rsc/${hash}`);

  await expect
    .poll(() =>
      page.evaluate((id) => {
        const target = document.getElementById(id);
        if (!target) {
          return false;
        }

        const { top } = target.getBoundingClientRect();
        return top >= 0 && top <= window.innerHeight * 0.6;
      }, decodedTargetId)
    )
    .toBe(true);
});

test("restores home list scroll position after navigating to a post and back", async ({ page }) => {
  await page.goto("/");
  const postItems = page.locator(".post-list-item");
  await expect(postItems.first()).toBeVisible();

  // Grow the list via infinite scroll so the scroll restoration target is meaningful.
  // The pre-fix bug was that the page size was only read once at module init, so
  // the home route would remount with a short list and couldn't restore deep scroll.
  let count = await postItems.count();
  for (let i = 0; i < 6 && count < 15; i++) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => postItems.count()).toBeGreaterThan(count);
    count = await postItems.count();
  }

  const expectedScrollY = await page.evaluate(() => {
    const maxScrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const target = Math.min(2200, maxScrollable);
    window.scrollTo(0, target);
    return target;
  });

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

  const href = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>(".post-list-item a[href]"));
    const visible = anchors.find((a) => {
      const rect = a.getBoundingClientRect();
      return rect.top >= 0 && rect.top <= window.innerHeight * 0.8;
    });
    return visible?.getAttribute("href");
  });
  expect(href).toBeTruthy();

  await page.click(`a[href="${href}"]`);
  await expect(page.locator(ARTICLE_SELECTOR)).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(postItems.first()).toBeVisible();
  await expect.poll(() => page.evaluate((target) => Math.abs(window.scrollY - target), expectedScrollY)).toBeLessThan(160);
});
