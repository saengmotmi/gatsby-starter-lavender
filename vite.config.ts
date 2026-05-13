import path from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";
import { watchAndRun } from "vite-plugin-watch-and-run";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    watchAndRun([
      {
        name: "content",
        watch: [
          path.resolve("content/blog/**/*"),
          path.resolve("static/**/*"),
          path.resolve("site.config.json"),
        ],
        run: "node ./scripts/generate-content.mjs",
        delay: 200,
      },
    ]),
    reactRouter(),
    vanillaExtractPlugin(),
    tsconfigPaths(),
  ],
  build: {
    // Prevent route-level CSS chunking which can cause a flash of unstyled content
    // during client-side navigations on slow networks.
    cssCodeSplit: false,
  },
});
