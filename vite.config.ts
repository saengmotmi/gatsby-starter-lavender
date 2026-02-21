import { reactRouter } from "@react-router/dev/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), vanillaExtractPlugin(), tsconfigPaths()],
  build: {
    // Prevent route-level CSS chunking which can cause a flash of unstyled content
    // during client-side navigations on slow networks.
    cssCodeSplit: false,
  },
});
