import type { UserConfig } from "@unocss/core";
import extractorSvelte from "@unocss/extractor-svelte";
import presetTypography from "@unocss/preset-typography";
import presetWind4 from "@unocss/preset-wind4";
import type { Theme } from "@unocss/preset-wind4/theme";
import transformerDirectives from "@unocss/transformer-directives";

export default {
	presets: [presetWind4(), presetTypography()],
	extractors: [extractorSvelte()],
	transformers: [transformerDirectives()],
	content: {
		filesystem: ["src/**/*.{astro,svelte,html,md,mdx,js,mjs,ts}"],
	},
	theme: {
		font: {
			sans: '"Roboto", ui-sans-serif, system-ui, sans-serif',
		},
	},
	// Keep component defaults below utilities regardless of stylesheet load order.
	layers: { components: -10 },
	outputToCssLayers: {
		allLayers: true,
		cssLayerName: (layer) => (layer === "default" ? "utilities" : layer),
	},
	shortcuts: {
		"expand-animation":
			"relative before:content-[''] before:ease-out before:transition active:bg-none hover:before:bg-[var(--btn-plain-bg-hover)] active:before:bg-[var(--btn-plain-bg-active)] z-0 before:absolute before:rounded-[inherit] before:inset-0 before:scale-[0.85] hover:before:scale-100 before:-z-10",
		"text-90": "text-black/90 dark:text-white/90",
		"text-75": "text-black/75 dark:text-white/75",
		"text-50": "text-black/50 dark:text-white/50",
		"text-30": "text-black/30 dark:text-white/30",
		"text-25": "text-black/25 dark:text-white/25",
	},
} satisfies UserConfig<Theme>;
