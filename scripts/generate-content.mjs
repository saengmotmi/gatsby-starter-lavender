import fs from "node:fs/promises";
import path from "node:path";

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

function normalizePostType(value) {
  const normalized = String(value || "article")
    .trim()
    .toLowerCase();

  if (normalized === "fleeting") {
    return "fleeting";
  }

  return "article";
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

function buildRssXml(siteConfig, posts, channelOverrides = {}) {
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
    `<title>${escapeXml(channelOverrides.title || siteConfig.title)}</title>`,
    `<link>${escapeXml(siteConfig.siteUrl)}</link>`,
    `<description>${escapeXml(channelOverrides.description || siteConfig.description)}</description>`,
    items,
    "</channel>",
    "</rss>",
  ].join("\n");
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
      type: normalizePostType(data.type),
      category,
      slug,
      title: String(data.title || normalizedPath),
      description: String(data.description || ""),
      excerpt,
      date: normalizeDate(data.date),
      tags: normalizeTags(data.tags),
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
  const publishedPosts = posts.filter((post) => !post.draft);
  const rss = buildRssXml(siteConfig, publishedPosts);
  const fleetingRss = buildRssXml(
    siteConfig,
    publishedPosts.filter((post) => post.type === "fleeting"),
    {
      title: `${siteConfig.title} - Fleeting`,
      description: "짧은 메모(Fleeting) 전용 피드",
    }
  );
  await fs.writeFile(path.join(PUBLIC_DIR, "rss.xml"), `${rss}\n`, "utf8");
  await fs.writeFile(path.join(PUBLIC_DIR, "rss-fleeting.xml"), `${fleetingRss}\n`, "utf8");

  console.log(`generated ${posts.length} posts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
