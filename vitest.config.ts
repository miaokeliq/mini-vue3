import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: [
      {
        // @guide-mini-vue/runtime-core/src
        find: /@guide-mini-vue\/(\w*)/,
        replacement: path.resolve(__dirname, "packages") + "/$1/src",
      },
    ],
  },
});
