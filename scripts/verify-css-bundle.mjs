import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const BUILD_ROOT = path.resolve(PROJECT_ROOT, "build/client");
const ASSETS_DIR = path.join(BUILD_ROOT, "assets");

function extractStylesheetHrefs(html) {
  const hrefs = [];
  const re = /<link\s+[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
  for (const match of html.matchAll(re)) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

async function findAnyNestedHtmlPage() {
  const queue = [BUILD_ROOT];

  while (queue.length > 0) {
    const dir = queue.shift();
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (entry.name !== "index.html") continue;

      const rel = path.relative(BUILD_ROOT, fullPath);
      if (rel === "index.html") continue;
      if (rel === "__spa-fallback.html") continue;

      return fullPath;
    }
  }

  return null;
}

async function main() {
  const assetEntries = await fs.readdir(ASSETS_DIR);
  const cssAssets = assetEntries.filter((f) => f.endsWith(".css"));

  const nonBundledCss = cssAssets.filter((f) => !/^style-[^.]+\.css$/.test(f));
  if (nonBundledCss.length > 0) {
    console.error(
      [
        "Detected route-level CSS chunks (expected only bundled style-*.css outputs).",
        ...nonBundledCss.map((f) => `- ${f}`),
      ].join("\n")
    );
    process.exit(1);
  }

  const homeHtml = await fs.readFile(path.join(BUILD_ROOT, "index.html"), "utf8");
  const homeStylesheets = extractStylesheetHrefs(homeHtml);
  const homeUnique = Array.from(new Set(homeStylesheets));

  if (homeUnique.length !== 1) {
    console.error(
      [
        "Home page should reference only the single bundled CSS file.",
        "Found:",
        ...homeUnique.map((h) => `- ${h}`),
      ].join("\n")
    );
    process.exit(1);
  }

  const bundledCssHref = homeUnique[0];
  if (!bundledCssHref.startsWith("/assets/style-") || !bundledCssHref.endsWith(".css")) {
    console.error(
      [
        "Home page stylesheet does not look like the bundled style-*.css output.",
        `Found: ${bundledCssHref}`,
      ].join("\n")
    );
    process.exit(1);
  }

  const bundledCssFilename = bundledCssHref.replace("/assets/", "");
  if (!cssAssets.includes(bundledCssFilename)) {
    console.error(
      [
        "Home page references a CSS asset that does not exist in build/client/assets.",
        `Referenced: ${bundledCssHref}`,
      ].join("\n")
    );
    process.exit(1);
  }

  const nestedHtmlPath = await findAnyNestedHtmlPage();
  if (!nestedHtmlPath) {
    console.error("Could not find a nested prerendered HTML page to verify.");
    process.exit(1);
  }

  const nestedHtml = await fs.readFile(nestedHtmlPath, "utf8");
  const nestedStylesheets = extractStylesheetHrefs(nestedHtml);
  const nestedUnique = Array.from(new Set(nestedStylesheets));

  if (nestedUnique.length !== 1 || nestedUnique[0] !== bundledCssHref) {
    console.error(
      [
        "Nested page should reference only the single bundled CSS file.",
        `Page: ${path.relative(PROJECT_ROOT, nestedHtmlPath)}`,
        `Expected: ${bundledCssHref}`,
        "Found:",
        ...nestedUnique.map((h) => `- ${h}`),
      ].join("\n")
    );
    process.exit(1);
  }

  console.log(
    [
      "CSS bundling verified.",
      `Bundled: ${bundledCssHref}`,
      `Checked: build/client/index.html`,
      `Checked: ${path.relative(PROJECT_ROOT, nestedHtmlPath)}`,
    ].join("\n")
  );
}

await main();
