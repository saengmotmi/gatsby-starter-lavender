import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const shouldSkipByEnv =
  process.env.HUSKY === "0" || process.env.CI === "true" || process.env.NETLIFY === "true";

if (shouldSkipByEnv) {
  process.exit(0);
}

const gitDir = path.resolve(".git");
if (!existsSync(gitDir)) {
  process.exit(0);
}

const huskyBinName = process.platform === "win32" ? "husky.cmd" : "husky";
const huskyBinPath = path.resolve("node_modules", ".bin", huskyBinName);

if (!existsSync(huskyBinPath)) {
  process.exit(0);
}

const result = spawnSync(huskyBinPath, [], { stdio: "inherit" });
if (result.error) {
  throw result.error;
}

if (typeof result.status === "number" && result.status !== 0) {
  process.exit(result.status);
}
