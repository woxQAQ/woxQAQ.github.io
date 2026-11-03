import { defineConfig } from "oxfmt";

export default defineConfig({
  useTabs: true,
  printWidth: 80,
  sortImports: true,
  astro: true,
  experimentalOperatorPosition: "start",
  svelte: true,
  ignorePatterns: [
    "src/content/**",
    "src/public/**",
    "src/.excalidraw/**",
    "src/.obsidian/**",
    "dist/**",
    ".astro/**",
    "node_modules/**",
  ],
});
