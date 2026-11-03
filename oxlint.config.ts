import { defineConfig } from "oxlint";

export default defineConfig({
	categories: {
		correctness: "error",
	},
	rules: {
		"no-param-reassign": "error",
		"default-param-last": "error",
		"no-else-return": "error",
		"typescript/prefer-as-const": "error",
		"typescript/prefer-enum-initializers": "error",
		"typescript/no-inferrable-types": "error",
		"unicorn/prefer-number-properties": "error",
	},
	ignorePatterns: [
		"src/public/**",
		"src/.excalidraw/**",
		"src/.obsidian/**",
		"dist/**",
		".astro/**",
		"node_modules/**",
	],
});
