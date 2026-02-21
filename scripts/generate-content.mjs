import fs from "node:fs/promises";
import path from "node:path";

import React from "react";
import { ImageResponse } from "@vercel/og";
import matter from "gray-matter";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrism from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import { visit } from "unist-util-visit";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "content", "blog");
const GENERATED_DIR = path.join(ROOT, "app", "generated");
const PUBLIC_DIR = path.join(ROOT, "public");
const PUBLIC_BLOG_ASSET_DIR = path.join(PUBLIC_DIR, "content", "blog");
const STATIC_DIR = path.join(ROOT, "static");
const SITE_CONFIG_PATH = path.join(ROOT, "site.config.json");

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const OG_IMAGE_DIR = path.join(PUBLIC_DIR, "og");
const OG_AVATAR_PATH = path.join(ROOT, "app", "images", "profile-pic.jpeg");
const OG_FONT_DIR = path.join(ROOT, "app", "fonts", "Pretendard", "woff");
const OG_FONT_FAMILY = "Pretendard";

let ogFontsPromise;

async function getOgFonts() {
  if (ogFontsPromise) {
    return ogFontsPromise;
  }

  ogFontsPromise = (async () => {
    // @vercel/og uses Satori + Resvg (WASM), so it doesn't depend on system fonts.
    const semiBoldPath = path.join(OG_FONT_DIR, "Pretendard-SemiBold.woff");
    const extraBoldPath = path.join(OG_FONT_DIR, "Pretendard-ExtraBold.woff");

    const [semiBold, extraBold] = await Promise.all([fs.readFile(semiBoldPath), fs.readFile(extraBoldPath)]);

    return [
      { name: OG_FONT_FAMILY, data: semiBold, weight: 600, style: "normal" },
      { name: OG_FONT_FAMILY, data: extraBold, weight: 800, style: "normal" },
    ];
  })();

  return ogFontsPromise;
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function isExternalLink(url) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(url);
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[>#*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNodeText(node) {
  if (!node) {
    return "";
  }

  if (node.type === "text" && typeof node.value === "string") {
    return node.value;
  }

  if (Array.isArray(node.children)) {
    return node.children.map((child) => getNodeText(child)).join("");
  }

  return "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapText(text, maxCharsPerLine, maxLines) {
  const normalized = String(text).replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const words = normalized.split(" ");
  const lines = [];

  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      // No spaces or a single token longer than max - hard break.
      lines.push(word.slice(0, maxCharsPerLine));
      current = word.slice(maxCharsPerLine);
    }

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  // If we had to truncate, add an ellipsis to the last line.
  const rejoined = lines.join(" ");
  if (rejoined.length < normalized.length) {
    const lastIndex = lines.length - 1;
    const last = lines[lastIndex] ?? "";
    const trimmed = last.replace(/\s+$/, "");
    lines[lastIndex] = trimmed.length >= 2 ? `${trimmed.slice(0, Math.max(0, trimmed.length - 1))}…` : `${trimmed}…`;
  }

  return lines;
}

function formatOgSubtitle({ date, tags }) {
  const tagList = Array.isArray(tags) ? tags.map(String).filter(Boolean) : [];
  const trimmed = tagList.slice(0, 6);
  const suffix = tagList.length > 6 ? ` +${tagList.length - 6}` : "";
  const tagText = trimmed.length ? `${trimmed.join(" · ")}${suffix}` : "";
  return [date, tagText].filter(Boolean).join(" · ");
}

function buildOgElement({ siteTitle, title, subtitle, avatarDataUri }) {
  const safeSiteTitle = String(siteTitle || "Blog").trim() || "Blog";
  const safeTitle = String(title || "").trim();
  const safeSubtitle = String(subtitle || "").trim();

  const titleLines = wrapText(safeTitle, 24, 3);
  const subtitleLines = safeSubtitle ? wrapText(safeSubtitle, 52, 2) : [];

  const paddingX = 80;
  const titleFontSize = 64;
  const titleLineHeight = 76;
  const subtitleFontSize = 28;
  const subtitleLineHeight = 38;

  // These numbers were tuned to match the legacy lavender OG layout.
  const titleTop = 190;
  const subtitleTop = titleTop + titleLines.length * titleLineHeight + 28;

  return React.createElement(
    "div",
    {
      style: {
        width: `${OG_IMAGE_WIDTH}px`,
        height: `${OG_IMAGE_HEIGHT}px`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundImage: "linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 55%, #EEF2FF 100%)",
        fontFamily: OG_FONT_FAMILY,
      },
    },
    React.createElement("div", {
      style: {
        position: "absolute",
        left: "20px",
        top: "-100px",
        width: "440px",
        height: "440px",
        borderRadius: "220px",
        backgroundImage:
          "radial-gradient(circle at 20% 15%, rgba(167, 139, 250, 0.22) 0%, rgba(167, 139, 250, 0) 80%)",
      },
    }),
    React.createElement("div", {
      style: {
        position: "absolute",
        left: "780px",
        top: "280px",
        width: "560px",
        height: "560px",
        borderRadius: "280px",
        backgroundColor: "rgba(167, 139, 250, 0.10)",
      },
    }),
    React.createElement("div", {
      style: {
        position: "absolute",
        left: `${paddingX - 22}px`,
        top: "64px",
        width: "44px",
        height: "44px",
        borderRadius: "22px",
        backgroundColor: "rgba(167, 139, 250, 0.85)",
      },
    }),
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          left: `${paddingX + 34}px`,
          top: "60px",
          fontSize: "32px",
          lineHeight: "32px",
          fontWeight: 800,
          color: "#0F172A",
        },
      },
      safeSiteTitle
    ),
    avatarDataUri
      ? React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              left: "1056px",
              top: "48px",
              width: "96px",
              height: "96px",
              borderRadius: "48px",
              backgroundColor: "rgba(17, 24, 39, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },
	          React.createElement(
	            "div",
	            { style: { display: "flex", width: "88px", height: "88px", borderRadius: "44px", overflow: "hidden" } },
	            React.createElement("img", {
	              src: avatarDataUri,
	              width: 88,
	              height: 88,
              style: { objectFit: "cover" },
            })
          )
        )
      : null,
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          left: `${paddingX}px`,
          top: `${titleTop}px`,
          display: "flex",
          flexDirection: "column",
          color: "#111827",
          fontSize: `${titleFontSize}px`,
          lineHeight: `${titleLineHeight}px`,
          fontWeight: 800,
        },
      },
      ...titleLines.map((line) => React.createElement("div", { key: line }, line))
    ),
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          left: `${paddingX}px`,
          top: `${subtitleTop}px`,
          display: "flex",
          flexDirection: "column",
          color: "#475569",
          fontSize: `${subtitleFontSize}px`,
          lineHeight: `${subtitleLineHeight}px`,
          fontWeight: 600,
        },
      },
      ...subtitleLines.map((line) => React.createElement("div", { key: line }, line))
    )
  );
}

async function writeOgPng({ element, outputPath, fonts }) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  validateSatoriDisplay(element);
  const response = new ImageResponse(element, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts,
  });
  const png = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, png);
}

function validateSatoriDisplay(element) {
  const allowed = new Set(["flex", "contents", "none"]);

  function walk(node, pointer) {
    if (node == null || node === false) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((child, index) => walk(child, `${pointer}[${index}]`));
      return;
    }

    if (typeof node !== "object") {
      return;
    }

    const type = node.type;
    const props = node.props || {};
    const children = props.children;

    const childList = Array.isArray(children) ? children : children == null || children === false ? [] : [children];
    const effectiveChildCount = childList.filter((child) => child != null && child !== false).length;

    if (type === "div" && effectiveChildCount > 1) {
      const display = props.style && typeof props.style === "object" ? props.style.display : undefined;
      if (!allowed.has(display)) {
        throw new Error(`Satori requires explicit display on <div> with multiple children: ${pointer} (display=${display})`);
      }
    }

    childList.forEach((child, index) => walk(child, `${pointer}/${String(type)}[${index}]`));
  }

  walk(element, "root");
}

async function generateOgImages({ siteConfig, posts }) {
  await fs.mkdir(OG_IMAGE_DIR, { recursive: true });

  const fonts = await getOgFonts();

  let avatarDataUri = null;
  try {
    const avatar = await fs.readFile(OG_AVATAR_PATH);
    avatarDataUri = `data:image/jpeg;base64,${avatar.toString("base64")}`;
  } catch {
    // Optional
  }

  const siteOgElement = buildOgElement({
    siteTitle: siteConfig.title,
    title: siteConfig.title,
    subtitle: siteConfig.description,
    avatarDataUri,
  });
  await writeOgPng({ element: siteOgElement, outputPath: path.join(OG_IMAGE_DIR, "index.png"), fonts });

  for (const post of posts) {
    if (post.draft) {
      continue;
    }

    const ogImagePath = typeof post.ogImage === "string" ? post.ogImage : "";
    if (!ogImagePath.startsWith("/og/") || !ogImagePath.endsWith(".png")) {
      continue;
    }

    const outputPath = path.join(PUBLIC_DIR, ogImagePath.replace(/^\/+/, ""));

    const element = buildOgElement({
      siteTitle: siteConfig.title,
      title: post.title,
      subtitle: formatOgSubtitle(post),
      avatarDataUri,
    });

    await writeOgPng({ element, outputPath, fonts });
  }
}

function collectHeadings(headings) {
  return () => (tree) => {
    visit(tree, "element", (node) => {
      if (!node.properties) {
        return;
      }

      if (!/^h[1-6]$/.test(node.tagName)) {
        return;
      }

      const id = typeof node.properties.id === "string" ? node.properties.id : "";
      const text = getNodeText(node).trim();

      if (!id || !text) {
        return;
      }

      headings.push({
        id,
        text,
        depth: Number(node.tagName.slice(1)),
      });
    });
  };
}

function buildTableOfContents(headings) {
  if (headings.length === 0) {
    return "";
  }

  const tocItems = headings
    .filter((heading) => heading.depth <= 4)
    .map(
      (heading) =>
        `<li class="toc-depth-${heading.depth}"><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`
    )
    .join("");

  return tocItems ? `<ul>${tocItems}</ul>` : "";
}

function normalizeDate(value) {
  const fallback = new Date().toISOString().slice(0, 10);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function rewriteRelativeUrls(relativeDir) {
  return () => (tree) => {
    visit(tree, "element", (node) => {
      if (!node.properties) {
        return;
      }

      if (node.tagName === "img" && typeof node.properties.src === "string") {
        const src = node.properties.src;
        if (!isExternalLink(src)) {
          const resolved = path.posix.normalize(path.posix.join(relativeDir, src));
          node.properties.src = `/content/blog/${resolved}`;
        }
      }

      if (node.tagName === "a" && typeof node.properties.href === "string") {
        const href = node.properties.href;
        if (!isExternalLink(href)) {
          const resolved = path.posix.normalize(path.posix.join(relativeDir, href));
          if (href.toLowerCase().endsWith(".md")) {
            const markdownPath = resolved.replace(/\.md$/i, "");
            const segments = markdownPath.split("/").filter(Boolean);
            if (segments[segments.length - 1] === "index") {
              segments.pop();
            }
            node.properties.href = `/${segments.join("/")}/`;
          } else {
            node.properties.href = `/content/blog/${resolved}`;
          }
        }
      }
    });
  };
}

async function walkMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function copyDir(src, dest, shouldCopyFile = () => true) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  await fs.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, shouldCopyFile);
      continue;
    }

    if (entry.isFile() && shouldCopyFile(srcPath)) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function buildRssXml(siteConfig, posts) {
  const escapeXml = (value) =>
    escapeHtml(value).replaceAll("&#39;", "&apos;");

  const items = posts
    .map((post) => {
      const link = `${siteConfig.siteUrl}${post.path}`;
      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid>${escapeXml(link)}</guid>`,
        `<pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `<description>${escapeXml(post.description || post.excerpt)}</description>`,
        `</item>`,
      ].join("");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(siteConfig.title)}</title>`,
    `<link>${escapeXml(siteConfig.siteUrl)}</link>`,
    `<description>${escapeXml(siteConfig.description)}</description>`,
    items,
    "</channel>",
    "</rss>",
  ].join("\n");
}

function normalizeSiteUrl(siteUrl) {
  const normalized = String(siteUrl || "").trim();
  if (!normalized) {
    return "";
  }

  return normalized.replace(/\/+$/, "");
}

function toAbsoluteSiteUrl(siteUrl, pathname) {
  const base = normalizeSiteUrl(siteUrl);
  const normalizedPath = pathname === "/" ? "/" : `/${String(pathname).replace(/^\/+|\/+$/g, "")}/`;
  return `${base}${normalizedPath}`;
}

function toIsoDateString(value) {
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function buildSitemapXml(siteConfig, posts) {
  const escapeXml = (value) =>
    escapeHtml(value).replaceAll("&#39;", "&apos;");

  const publishedPosts = posts.filter((post) => !post.draft);
  const homepageLastmod = publishedPosts.length > 0 ? toIsoDateString(publishedPosts[0].date) : null;
  const entries = [
    { path: "/", lastmod: homepageLastmod },
    ...publishedPosts.map((post) => ({
      path: post.path,
      lastmod: toIsoDateString(post.date),
    })),
  ];

  const urls = entries
    .map((entry) => {
      const loc = toAbsoluteSiteUrl(siteConfig.siteUrl, entry.path);
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
      return `<url><loc>${escapeXml(loc)}</loc>${lastmod}</url>`;
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
  ].join("\n");
}

function buildRobotsTxt(siteConfig) {
  const sitemapUrl = `${normalizeSiteUrl(siteConfig.siteUrl)}/sitemap.xml`;
  return ["User-agent: *", "Allow: /", "", `Sitemap: ${sitemapUrl}`].join("\n");
}

async function main() {
  const markdownFiles = await walkMarkdownFiles(BLOG_DIR);

  const posts = [];

  for (const markdownPath of markdownFiles) {
    const raw = await fs.readFile(markdownPath, "utf8");
    const { data, content } = matter(raw);

    const relativePath = toPosixPath(path.relative(BLOG_DIR, markdownPath));
    const withoutExt = relativePath.replace(/\.md$/i, "");
    const segments = withoutExt.split("/").filter(Boolean);
    if (segments[segments.length - 1] === "index") {
      segments.pop();
    }
    const [category, ...restParts] = segments;
    const slug = restParts.join("/");
    const normalizedPath = segments.join("/");
    const postPath = `/${normalizedPath}/`;
    const headingRecords = [];

    const html = String(
      await remark()
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkRehype)
        .use(rehypeSlug)
        .use(collectHeadings(headingRecords))
        .use(rewriteRelativeUrls(path.posix.dirname(relativePath)))
        .use(rehypeAutolinkHeadings, {
          behavior: "append",
          properties: { className: ["heading-anchor"] },
        })
        .use(rehypeKatex)
        .use(rehypePrism, { ignoreMissing: true })
        .use(rehypeStringify)
        .process(content)
    );
    const tableOfContents = buildTableOfContents(headingRecords);

    const excerpt = stripMarkdown(content).slice(0, 220);

    posts.push({
      id: normalizedPath,
      path: postPath,
      category,
      slug,
      title: String(data.title || normalizedPath),
      description: String(data.description || ""),
      excerpt,
      date: normalizeDate(data.date),
      tags: normalizeTags(data.tags),
      ogImage: `/og/${normalizedPath}.png`,
      thumbnail: String(data.thumbnail || "/thumbnails/hello-world.jpg"),
      draft: Boolean(data.draft),
      html,
      tableOfContents,
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));
  const postSummaries = posts.map(({ html, tableOfContents, ...summary }) => summary);

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.writeFile(path.join(GENERATED_DIR, "posts.json"), `${JSON.stringify(posts, null, 2)}\n`, "utf8");
  await fs.writeFile(
    path.join(GENERATED_DIR, "post-summaries.json"),
    `${JSON.stringify(postSummaries, null, 2)}\n`,
    "utf8"
  );

  await copyDir(STATIC_DIR, PUBLIC_DIR);
  await copyDir(BLOG_DIR, PUBLIC_BLOG_ASSET_DIR, (filePath) => !filePath.toLowerCase().endsWith(".md"));

  const siteConfigRaw = await fs.readFile(SITE_CONFIG_PATH, "utf8");
  const siteConfig = JSON.parse(siteConfigRaw);
  await generateOgImages({ siteConfig, posts });
  const rss = buildRssXml(siteConfig, posts.filter((post) => !post.draft));
  await fs.writeFile(path.join(PUBLIC_DIR, "rss.xml"), `${rss}\n`, "utf8");
  const sitemap = buildSitemapXml(siteConfig, posts);
  await fs.writeFile(path.join(PUBLIC_DIR, "sitemap.xml"), `${sitemap}\n`, "utf8");
  const robots = buildRobotsTxt(siteConfig);
  await fs.writeFile(path.join(PUBLIC_DIR, "robots.txt"), `${robots}\n`, "utf8");

  console.log(`generated ${posts.length} posts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
