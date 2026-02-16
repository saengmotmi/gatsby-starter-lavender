import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

function usage(message) {
  if (message) {
    console.error(message);
    console.error("");
  }

  console.error("Usage:");
  console.error("  corepack yarn modern-screenshot --url <url> [--url <url> ...] [options]");
  console.error("");
  console.error("Options:");
  console.error("  --outDir <dir>       Output directory (default: docs/pr-screenshots)");
  console.error("  --fullPage           Capture full page instead of viewport");
  console.error("  --selector <css>     Capture only an element by CSS selector");
  console.error("  --width <px>         Viewport width (default: 1280)");
  console.error("  --height <px>        Viewport height (default: 720)");
  console.error("  --dpr <n>            Device scale factor (default: 2)");
  console.error("  --wait <ms>          Extra wait after load (default: 500)");
  console.error("");
  console.error("Examples:");
  console.error("  corepack yarn modern-screenshot --url https://saengmotmi.netlify.app --outDir docs/pr/33");
  console.error("  corepack yarn modern-screenshot --url https://saengmotmi.netlify.app --selector main");
}

function filenameForUrl(url) {
  const parsed = new URL(url);
  const pathname = parsed.pathname.replace(/\/$/, "") || "/root";
  const base = `${parsed.hostname}${pathname}`;
  const safe = base
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 8);
  return `${safe || "shot"}-${hash}.png`;
}

function parseArgs(argv) {
  const urls = [];
  const options = {
    outDir: "docs/pr-screenshots",
    fullPage: false,
    selector: null,
    width: 1280,
    height: 720,
    dpr: 2,
    wait: 500,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--url") {
      const value = argv[++i];
      if (!value) {
        throw new Error("--url requires a value");
      }
      urls.push(value);
      continue;
    }

    if (arg === "--outDir") {
      const value = argv[++i];
      if (!value) {
        throw new Error("--outDir requires a value");
      }
      options.outDir = value;
      continue;
    }

    if (arg === "--fullPage") {
      options.fullPage = true;
      continue;
    }

    if (arg === "--selector") {
      const value = argv[++i];
      if (!value) {
        throw new Error("--selector requires a value");
      }
      options.selector = value;
      continue;
    }

    if (arg === "--width") {
      options.width = Number(argv[++i]);
      continue;
    }

    if (arg === "--height") {
      options.height = Number(argv[++i]);
      continue;
    }

    if (arg === "--dpr") {
      options.dpr = Number(argv[++i]);
      continue;
    }

    if (arg === "--wait") {
      options.wait = Number(argv[++i]);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }

    throw new Error(`Unknown arg: ${arg}`);
  }

  return { urls, options };
}

async function main() {
  const { urls, options } = parseArgs(process.argv.slice(2));

  if (!urls.length) {
    usage("Missing required --url");
    process.exit(1);
  }

  await fs.mkdir(options.outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: options.dpr,
  });

  // Make screenshots stable across runs.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });

  const results = [];

  for (const url of urls) {
    const filename = filenameForUrl(url);
    const outPath = path.join(options.outDir, filename);

    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for font loading if supported.
    await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      if (document?.fonts?.ready) {
        // eslint-disable-next-line no-undef
        await document.fonts.ready;
      }
    });

    if (options.wait > 0) {
      await page.waitForTimeout(options.wait);
    }

    if (options.selector) {
      await page.locator(options.selector).first().screenshot({ path: outPath });
    } else {
      await page.screenshot({ path: outPath, fullPage: options.fullPage });
    }

    results.push({ url, outPath });
    console.log(outPath);
  }

  await page.close();
  await browser.close();

  // Convenience summary for PR markdown.
  console.log("");
  console.log("Markdown:");
  for (const { url, outPath } of results) {
    console.log(`- ${url}`);
    console.log(`  ![](${outPath})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

