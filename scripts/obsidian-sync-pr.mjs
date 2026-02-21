import { spawnSync } from "node:child_process";
import process from "node:process";

const TARGET_DIR = "content/blog/fleeting";

const USAGE = `
Obsidian fleeting 동기화 + PR 자동 생성

Usage:
  yarn sync:obsidian:pr
  yarn sync:obsidian:pr -- --dry-run
  yarn sync:obsidian:pr -- --prune --base main
  yarn sync:obsidian:pr -- --branch codex/obsidian-sync-manual --title "chore: fleeting sync"

Options:
      --base <branch>   PR base 브랜치 (기본: main)
      --branch <name>   사용할 작업 브랜치 (기본: codex/obsidian-sync-<timestamp>)
      --title <text>    PR 제목 (기본: 자동 생성)
      --no-pr           커밋/푸시까지만 수행하고 PR 생성은 생략
      --help            도움말 출력

그 외 옵션(--dry-run, --prune, --vault, --source 등)은 sync:obsidian으로 전달됩니다.
주의: 안전을 위해 --base 브랜치에서만 실행됩니다.
`.trim();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.stdio || "pipe",
    cwd: options.cwd || process.cwd(),
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    const details = output ? `\n${output}` : "";
    throw new Error(`${command} ${args.join(" ")} 실패${details}`);
  }

  return (result.stdout || "").trim();
}

function parseArgs(argv) {
  const options = {
    base: "main",
    branch: "",
    title: "",
    noPr: false,
    help: false,
    syncArgs: [],
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
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--base":
        options.base = readValue(i, arg);
        i += 1;
        break;
      case "--branch":
        options.branch = readValue(i, arg);
        i += 1;
        break;
      case "--title":
        options.title = readValue(i, arg);
        i += 1;
        break;
      case "--no-pr":
        options.noPr = true;
        break;
      case "--":
        break;
      default:
        options.syncArgs.push(arg);
        break;
    }
  }

  return options;
}

function nowStamp() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function listChangedPaths() {
  const output = run("git", ["status", "--porcelain"]);
  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.slice(3).trim())
    .map((path) => {
      const arrow = path.indexOf("->");
      return arrow >= 0 ? path.slice(arrow + 2).trim() : path;
    })
    .filter(Boolean);
}

function isTargetPath(path) {
  return path === TARGET_DIR || path.startsWith(`${TARGET_DIR}/`);
}

function currentBranch() {
  return run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
}

function ensureBaseBranch(base) {
  const current = currentBranch();
  if (current !== base) {
    throw new Error(
      `현재 브랜치(${current})에서 실행할 수 없습니다. ${base} 브랜치로 이동해서 다시 실행해주세요.`
    );
  }
}

function ensureCleanForScopedCommit() {
  const paths = listChangedPaths();
  const outside = paths.filter((path) => !isTargetPath(path));
  if (outside.length === 0) {
    return;
  }

  throw new Error(
    [
      "Obsidian PR 자동화는 안전을 위해 content/blog/fleeting 외 변경이 있으면 중단합니다.",
      "아래 변경을 먼저 정리(커밋/스태시)한 뒤 다시 실행해주세요:",
      ...outside.map((path) => `- ${path}`),
    ].join("\n")
  );
}

function ensureCommandExists(command) {
  const result = spawnSync(command, ["--version"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} 명령을 찾을 수 없습니다. 설치 후 다시 실행해주세요.`);
  }
}

function hasTargetChanges() {
  const output = run("git", ["status", "--porcelain", "--", TARGET_DIR]);
  return output.length > 0;
}

function existingPrUrl(branch) {
  try {
    const output = run("gh", [
      "pr",
      "list",
      "--state",
      "open",
      "--head",
      branch,
      "--json",
      "url",
      "--jq",
      ".[0].url",
    ]);
    return output || "";
  } catch {
    return "";
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(USAGE);
    return;
  }

  ensureCommandExists("git");
  ensureBaseBranch(options.base);

  ensureCleanForScopedCommit();

  const syncScriptArgs = ["./scripts/sync-obsidian-fleeting.mjs", ...options.syncArgs];
  run("node", syncScriptArgs, { stdio: "inherit" });

  if (!hasTargetChanges()) {
    console.log("[skip] 동기화 결과 변경 사항이 없어 PR을 만들지 않습니다.");
    return;
  }

  const branch = options.branch || `codex/obsidian-sync-${nowStamp()}`;
  const prTitle = options.title || `chore: Obsidian fleeting 동기화 (${new Date().toISOString().slice(0, 10)})`;
  const commitMessage = prTitle;
  const changedFiles = run("git", ["status", "--porcelain", "--", TARGET_DIR])
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean);

  run("git", ["switch", "-c", branch], { stdio: "inherit" });
  run("git", ["add", TARGET_DIR], { stdio: "inherit" });
  run("git", ["commit", "-m", commitMessage], { stdio: "inherit" });
  run("git", ["push", "-u", "origin", branch], { stdio: "inherit" });

  if (options.noPr) {
    console.log(`[done] push 완료: ${branch}`);
    return;
  }

  ensureCommandExists("gh");

  const openPr = existingPrUrl(branch);
  if (openPr) {
    console.log(`[done] 기존 PR 재사용: ${openPr}`);
    return;
  }

  const body = [
    "## 변경 사항",
    "- Obsidian fleeting 노트를 블로그 콘텐츠로 동기화",
    "",
    "## 변경 파일",
    ...changedFiles.map((file) => `- \`${file}\``),
    "",
    "## 체크리스트",
    "- [x] Obsidian source -> content/blog/fleeting 동기화",
    "- [ ] 리뷰 후 머지",
  ].join("\n");

  const prUrl = run("gh", [
    "pr",
    "create",
    "--base",
    options.base,
    "--head",
    branch,
    "--title",
    prTitle,
    "--body",
    body,
  ]);

  console.log(`[done] PR 생성 완료: ${prUrl}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
