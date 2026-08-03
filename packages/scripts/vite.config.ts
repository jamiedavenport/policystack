import { defineConfig } from "vite-plus";

export default defineConfig({
	pack: {
		// One entry per vendor so consumers tree-shake to a single tag loader.
		entry: [
			"./src/index.ts",
			"./src/clarity.ts",
			"./src/ga4.ts",
			"./src/google-tag-manager.ts",
			"./src/hotjar.ts",
			"./src/meta-pixel.ts",
			"./src/posthog.ts",
			"./src/segment.ts",
		],
		format: "esm",
		dts: true,
		fixedExtension: false,
	},
});
