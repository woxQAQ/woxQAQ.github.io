import { defineConfig } from "oxlint";

export default defineConfig({
	categories: {
		correctness: "error",
	},
	plugins: [
		"typescript", "unicorn", "oxc", "import", "node", "promise","jsdoc"
	],
	rules: {
		// "no-console": "error",
		"curly": ["error","multi-line"],
		"prefer-const": ["error", {destructuring:"all"}],
		"prefer-destructuring": ["error",{VariableDeclarator:{array:false,object:true}}],
		"unicode-bom": ["error","never"],
		"no-param-reassign": "error",
		"default-param-last": "error",
		"no-else-return": "error",
		"typescript/prefer-enum-initializers": "error",
		"typescript/no-inferrable-types": "error",
		"typescript/consistent-indexed-object-style": ["error","record"],
		"typescript/ban-ts-comment": ["error",{"ts-expect-error":"allow-with-description"}],
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
