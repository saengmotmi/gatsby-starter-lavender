import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import matter from "gray-matter";

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, "content", "blog", "fleeting");
const DEFAULT_SOURCE_SUBDIR = "Publish/Fleeting";
const DEFAULT_THUMBNAIL = "/thumbnails/hello-world.jpg";
const DEFAULT_TAG = "Fleeting";

const USAGE = `
Obsidian -> fleeting 동기화

Usage:
  yarn sync:obsidian
  yarn sync:obsidian -- --dry-run
  yarn sync:obsidian -- --vault "/Users/.../iCloud~md~obsidian/Documents/MyVault"
  yarn sync:obsidian -- --source "Publish/Fleeting" --prune

Options:
      --vault <path>     Obsidian 볼트 루트 경로 (기본: env 또는 자동 탐색)
      --source <path>    볼트 내부 소스 폴더 (기본: "Publish/Fleeting")
      --dry-run          파일 변경 없이 계획만 출력
      --prune            소스에서 사라진 동기화 파일 삭제
  -h, --help             도움말 출력

Environment:
  OBSIDIAN_VAULT_PATH    볼트 루트 경로
  OBSIDIAN_FLEETING_DIR  소스 폴더 경로 (기본: Publish/Fleeting)
`.trim();

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function quoteYamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function normalizeSegment(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[<>:"|?*]/g, "")
    .replace(/^\/+|\/+$/g, "");
}

function normalizePathLike(value) {
  return String(value)
    .split("/")
    .map(normalizeSegment)
    .filter(Boolean)
    .join("/");
}

function normalizeDate(value, fallbackDate) {
  const fallback = fallbackDate || new Date().toISOString().slice(0, 10);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
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

function extractTitleFromContent(content) {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : "";
}

function stripMarkdown(value) {
  return String(value)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[>#*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDescription(content) {
  const plain = stripMarkdown(content);
  if (!plain) {
    return "짧은 메모";
  }

  return plain.slice(0, 120);
}

function parseArgs(argv) {
  const options = {
    vault: "",
    source: "",
    dryRun: false,
    prune: false,
    help: false,
  };

  const readValue = (index, flag) => {
    const value = argv[index + 1];
    if (value == null || value.startsWith("-")) {
      throw new Error(`${flag} 값이 필요합니다.`);
    }
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--":
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "--vault":
        options.vault = readValue(i, arg);
        i += 1;
        break;
      case "--source":
        options.source = readValue(i, arg);
        i += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--prune":
        options.prune = true;
        break;
      default:
        throw new Error(`알 수 없는 옵션: ${arg}`);
    }
  }

  return options;
}

async function walkMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

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

async function pathExists(value) {
  try {
    await fs.access(value);
    return true;
  } catch {
    return false;
  }
}

async function discoverVaultPath() {
  const defaultObsidianRoot = path.join(
    os.homedir(),
    "Library",
    "Mobile Documents",
    "iCloud~md~obsidian",
    "Documents"
  );

  if (!(await pathExists(defaultObsidianRoot))) {
    throw new Error(
      `Obsidian iCloud 경로를 찾을 수 없습니다: ${defaultObsidianRoot}\n--vault 또는 OBSIDIAN_VAULT_PATH를 지정해주세요.`
    );
  }

  const entries = await fs.readdir(defaultObsidianRoot, { withFileTypes: true });
  const vaultCandidates = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => path.join(defaultObsidianRoot, entry.name));

  if (vaultCandidates.length === 1) {
    return vaultCandidates[0];
  }

  if (vaultCandidates.length === 0) {
    throw new Error(
      `Obsidian 볼트가 없습니다: ${defaultObsidianRoot}\n--vault 또는 OBSIDIAN_VAULT_PATH를 지정해주세요.`
    );
  }

  throw new Error(
    [
      "Obsidian 볼트가 여러 개입니다. --vault 또는 OBSIDIAN_VAULT_PATH를 지정해주세요.",
      "후보:",
      ...vaultCandidates.map((candidate) => `- ${candidate}`),
    ].join("\n")
  );
}

async function resolvePaths(options) {
  const vaultPath =
    options.vault ||
    process.env.OBSIDIAN_VAULT_PATH ||
    (await discoverVaultPath());

  const sourceOption = options.source || process.env.OBSIDIAN_FLEETING_DIR || DEFAULT_SOURCE_SUBDIR;
  const sourceDir = path.isAbsolute(sourceOption)
    ? sourceOption
    : path.join(vaultPath, sourceOption);

  if (!(await pathExists(vaultPath))) {
    throw new Error(`볼트 경로가 존재하지 않습니다: ${vaultPath}`);
  }
  if (!(await pathExists(sourceDir))) {
    throw new Error(`소스 경로가 존재하지 않습니다: ${sourceDir}`);
  }

  return {
    vaultPath,
    sourceDir,
  };
}

function buildFrontmatter({ title, date, description, tags, thumbnail, draft, source }) {
  const lines = [
    "---",
    `title: ${quoteYamlString(title)}`,
    `date: ${date}`,
    "type: fleeting",
    `description: ${quoteYamlString(description)}`,
    `tags: [${tags.map((tag) => quoteYamlString(tag)).join(", ")}]`,
    `thumbnail: ${quoteYamlString(thumbnail)}`,
    `source: ${quoteYamlString(source)}`,
  ];

  if (draft) {
    lines.push("draft: true");
  }

  lines.push("---");
  return `${lines.join("\n")}\n`;
}

function ensureTrailingNewline(value) {
  return value.endsWith("\n") ? value : `${value}\n`;
}

async function readManagedFiles() {
  if (!(await pathExists(TARGET_DIR))) {
    return [];
  }

  const markdownFiles = await walkMarkdownFiles(TARGET_DIR);
  const managed = [];

  for (const markdownPath of markdownFiles) {
    const raw = await fs.readFile(markdownPath, "utf8");
    const { data } = matter(raw);
    const source = typeof data.source === "string" ? data.source.trim() : "";

    if (source.startsWith("obsidian/")) {
      managed.push(markdownPath);
    }
  }

  return managed;
}

async function removeEmptyParentDirs(startDir) {
  let currentDir = startDir;
  const rootDir = path.resolve(TARGET_DIR);

  while (currentDir.startsWith(rootDir) && currentDir !== rootDir) {
    const entries = await fs.readdir(currentDir);
    if (entries.length > 0) {
      break;
    }
    await fs.rmdir(currentDir);
    currentDir = path.dirname(currentDir);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(USAGE);
    return;
  }

  const { vaultPath, sourceDir } = await resolvePaths(options);
  const sourceFiles = await walkMarkdownFiles(sourceDir);

  console.log(`[sync] vault: ${vaultPath}`);
  console.log(`[sync] source: ${sourceDir}`);
  console.log(`[sync] target: ${TARGET_DIR}`);
  console.log(`[sync] source files: ${sourceFiles.length}`);

  const generatedTargetPaths = new Set();
  const stats = {
    created: 0,
    updated: 0,
    unchanged: 0,
    removed: 0,
  };

  for (const sourcePath of sourceFiles) {
    const raw = await fs.readFile(sourcePath, "utf8");
    const fileStat = await fs.stat(sourcePath);
    const { data, content } = matter(raw);

    const relativeSourcePath = toPosix(path.relative(sourceDir, sourcePath));
    const relativeWithoutExt = relativeSourcePath.replace(/\.md$/i, "");
    const fallbackSlug = normalizePathLike(relativeWithoutExt.replace(/\/index$/i, ""));
    const explicitSlug = normalizePathLike(String(data.slug || ""));
    const slug = explicitSlug || fallbackSlug;

    if (!slug) {
      console.warn(`[skip] slug을 만들 수 없어 건너뜀: ${relativeSourcePath}`);
      continue;
    }

    const fallbackTitle = extractTitleFromContent(content) || path.basename(relativeWithoutExt);
    const title = String(data.title || fallbackTitle).trim();
    const description = String(data.description || buildDescription(content)).trim();
    const date = normalizeDate(data.date, fileStat.mtime.toISOString().slice(0, 10));
    const tags = normalizeTags(data.tags);
    const thumbnail = String(data.thumbnail || DEFAULT_THUMBNAIL).trim();
    const draft = Boolean(data.draft);
    const source = `obsidian/${relativeSourcePath}`;

    const frontmatter = buildFrontmatter({
      title: title || fallbackTitle,
      date,
      description: description || "짧은 메모",
      tags: tags.length > 0 ? tags : [DEFAULT_TAG],
      thumbnail: thumbnail.startsWith("/") ? thumbnail : DEFAULT_THUMBNAIL,
      draft,
      source,
    });
    const body = ensureTrailingNewline(content.trim() ? content.trim() : "## 메모\n");
    const nextMarkdown = `${frontmatter}\n${body}`;

    const targetPath = path.join(TARGET_DIR, ...slug.split("/"), "index.md");
    generatedTargetPaths.add(path.resolve(targetPath));

    const existed = await pathExists(targetPath);
    const prevMarkdown = existed ? await fs.readFile(targetPath, "utf8") : "";

    if (prevMarkdown === nextMarkdown) {
      stats.unchanged += 1;
      continue;
    }

    if (!options.dryRun) {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, nextMarkdown, "utf8");
    }

    if (existed) {
      stats.updated += 1;
      console.log(`[update] ${path.relative(ROOT, targetPath)}`);
    } else {
      stats.created += 1;
      console.log(`[create] ${path.relative(ROOT, targetPath)}`);
    }
  }

  if (options.prune) {
    const managedFiles = await readManagedFiles();
    for (const managedPath of managedFiles) {
      const normalizedManagedPath = path.resolve(managedPath);
      if (generatedTargetPaths.has(normalizedManagedPath)) {
        continue;
      }

      if (!options.dryRun) {
        await fs.unlink(managedPath);
        await removeEmptyParentDirs(path.dirname(managedPath));
      }

      stats.removed += 1;
      console.log(`[remove] ${path.relative(ROOT, managedPath)}`);
    }
  }

  console.log(
    `[done] created=${stats.created}, updated=${stats.updated}, unchanged=${stats.unchanged}, removed=${stats.removed}${options.dryRun ? " (dry-run)" : ""}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
