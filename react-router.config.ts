import fs from "node:fs";
import path from "node:path";

import type { Config } from "@react-router/dev/config";

type GeneratedPost = {
  path: string;
  draft?: boolean;
};

function getGeneratedPostPaths(): string[] {
  const generatedPath = path.resolve("app/generated/posts.json");

  if (!fs.existsSync(generatedPath)) {
    return [];
  }

  const posts = JSON.parse(fs.readFileSync(generatedPath, "utf8")) as GeneratedPost[];
  return posts.filter((post) => !post.draft).map((post) => post.path);
}

export default {
  ssr: false,
  prerender: ({ getStaticPaths }) => {
    const defaultPaths = getStaticPaths();
    const generatedPaths = getGeneratedPostPaths();
    return Array.from(new Set([...defaultPaths, ...generatedPaths]));
  },
} satisfies Config;
