import fs from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import process from "node:process";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "content", "blog");

const USAGE = `
새 글 스캐폴딩 CLI

Usage:
  yarn new:post
  yarn new:post -- --type fleeting --slug cache-vs-network --title "짧은 메모" --description "요약"

Options:
      --type <article|fleeting> 글 유형 (기본값: article)
      --fleeting              --type fleeting 축약 옵션
  -c, --category <value>      카테고리 경로 (예: article, react)
  -s, --slug <value>          슬러그 경로 (예: my-first-post, react/server-components)
  -t, --title <value>         포스트 제목
  -d, --description <value>   포스트 설명
      --date <YYYY-MM-DD>     발행일 (기본값: 오늘)
      --tags <csv>            태그 목록 (쉼표 구분, 기본값: Article)
      --thumbnail <path>      썸네일 경로 (기본값: /thumbnails/hello-world.jpg)
      --draft                 draft: true로 생성
      --flat                  content/blog/<category>/<slug>.md 형태로 생성
      --dry-run               파일 생성 없이 결과만 출력
      --no-interactive        누락 값이 있으면 프롬프트 없이 실패
  -h, --help                  도움말 출력
`.trim();

function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function normalizeSegment(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/^\/+|\/+$/g, "");
}

function normalizePathLike(value) {
  return String(value)
    .split("/")
    .map(normalizeSegment)
    .filter(Boolean)
    .join("/");
}

function parseTags(rawTags) {
  if (!rawTags) {
    return [];
  }

  return rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizePostType(rawType) {
  const normalized = String(rawType || "article")
    .trim()
    .toLowerCase();

  if (normalized === "article" || normalized === "fleeting") {
    return normalized;
  }

  throw new Error(`type은 article 또는 fleeting 이어야 합니다: ${rawType}`);
}

function slugifyTitle(title) {
  const asciiSlug = String(title)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return asciiSlug || "";
}

function parseArgs(argv) {
  const options = {
    type: "article",
    category: "",
    slug: "",
    title: "",
    description: "",
    date: todayLocal(),
    tags: "",
    thumbnail: "/thumbnails/hello-world.jpg",
    draft: false,
    flat: false,
    dryRun: false,
    interactive: true,
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
      case "-c":
      case "--category":
        options.category = readValue(i, arg);
        i += 1;
        break;
      case "--type":
        options.type = readValue(i, arg);
        i += 1;
        break;
      case "--fleeting":
        options.type = "fleeting";
        break;
      case "-s":
      case "--slug":
        options.slug = readValue(i, arg);
        i += 1;
        break;
      case "-t":
      case "--title":
        options.title = readValue(i, arg);
        i += 1;
        break;
      case "-d":
      case "--description":
        options.description = readValue(i, arg);
        i += 1;
        break;
      case "--date":
        options.date = readValue(i, arg);
        i += 1;
        break;
      case "--tags":
        options.tags = readValue(i, arg);
        i += 1;
        break;
      case "--thumbnail":
        options.thumbnail = readValue(i, arg);
        i += 1;
        break;
      case "--draft":
        options.draft = true;
        break;
      case "--flat":
        options.flat = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--no-interactive":
        options.interactive = false;
        break;
      default:
        throw new Error(`알 수 없는 옵션: ${arg}`);
    }
  }

  return options;
}

async function promptMissing(options) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return options;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (label, fallback = "") => {
    const suffix = fallback ? ` (${fallback})` : "";
    const answer = await rl.question(`${label}${suffix}: `);
    const value = answer.trim();
    return value || fallback;
  };

  try {
    options.type = normalizePostType(options.type);

    const defaultCategory = options.type === "fleeting" ? "fleeting" : "article";
    options.category = options.category || (await ask("카테고리", defaultCategory));

    const defaultSlug = options.slug || slugifyTitle(options.title);
    options.slug = options.slug || (await ask("슬러그", defaultSlug || "new-post"));

    options.title = options.title || (await ask("제목", `${options.date} 새 글 제목`));
    options.description = options.description || (await ask("설명", "여기에 한 줄 요약을 작성하세요"));
    const defaultTags = options.type === "fleeting" ? "Fleeting" : "Article";
    options.tags = options.tags || (await ask("태그(쉼표 구분)", defaultTags));
    options.thumbnail =
      options.thumbnail || (await ask("썸네일", "/thumbnails/hello-world.jpg"));

    if (!options.draft) {
      const draftAnswer = (await ask("draft로 생성할까요? (y/N)", "N")).toLowerCase();
      options.draft = draftAnswer === "y" || draftAnswer === "yes";
    }
  } finally {
    rl.close();
  }

  return options;
}

function validate(options) {
  const type = normalizePostType(options.type);
  const defaultCategory = type === "fleeting" ? "fleeting" : "article";
  const category = normalizePathLike(options.category || defaultCategory);
  const slug = normalizePathLike(options.slug);
  const title = String(options.title).trim();
  const description = String(options.description).trim();
  const date = String(options.date).trim();
  const thumbnail = String(options.thumbnail).trim();
  const parsedTags = parseTags(options.tags);
  const tags = parsedTags.length > 0 ? parsedTags : [type === "fleeting" ? "Fleeting" : "Article"];

  if (!category) {
    throw new Error("category가 비어 있습니다.");
  }
  if (!slug) {
    throw new Error("slug가 비어 있습니다. --slug를 입력해주세요.");
  }
  if (!title) {
    throw new Error("title이 비어 있습니다. --title을 입력해주세요.");
  }
  if (!description) {
    throw new Error("description이 비어 있습니다. --description을 입력해주세요.");
  }
  if (!isValidDate(date)) {
    throw new Error(`date 형식이 올바르지 않습니다: ${date} (예: 2026-02-21)`);
  }
  if (!thumbnail.startsWith("/")) {
    throw new Error("thumbnail은 '/'로 시작해야 합니다. 예: /thumbnails/hello-world.jpg");
  }
  return {
    ...options,
    type,
    category,
    slug,
    title,
    description,
    date,
    thumbnail,
    tags,
  };
}

function buildFrontmatter(options) {
  const lines = [
    "---",
    `title: ${options.title}`,
    `date: ${options.date}`,
    `type: ${options.type}`,
    `description: ${options.description}`,
    `tags: [${options.tags.join(", ")}]`,
    `thumbnail: ${options.thumbnail}`,
  ];

  if (options.draft) {
    lines.push("draft: true");
  }

  lines.push("---", "", "## 들어가며", "", "## 본문", "", "## 마무리", "");

  return `${lines.join("\n")}`;
}

function resolveOutputPath(options) {
  if (options.flat) {
    return path.join(BLOG_DIR, options.category, `${options.slug}.md`);
  }

  return path.join(BLOG_DIR, options.category, options.slug, "index.md");
}

async function ensureTargetWritable(targetFilePath) {
  try {
    await fs.access(targetFilePath);
    throw new Error(`이미 존재하는 파일입니다: ${path.relative(ROOT, targetFilePath)}`);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

async function main() {
  let options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(USAGE);
    return;
  }

  if (options.interactive) {
    options = await promptMissing(options);
  }

  const normalized = validate(options);
  const targetFilePath = resolveOutputPath(normalized);
  const content = buildFrontmatter(normalized);
  const relativeTarget = path.relative(ROOT, targetFilePath);

  if (normalized.dryRun) {
    console.log("[dry-run] 생성 예정 파일:", relativeTarget);
    console.log("----");
    console.log(content);
    return;
  }

  await ensureTargetWritable(targetFilePath);
  await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
  await fs.writeFile(targetFilePath, content, "utf8");

  console.log("생성 완료:", relativeTarget);
  console.log("다음 단계:");
  console.log("  1) 내용 작성");
  console.log("  2) yarn generate:content");
  console.log("  3) yarn dev");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
