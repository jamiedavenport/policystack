import { defineConfig } from "vite-plus";

export default defineConfig({
	fmt: {
		useTabs: true,
		ignorePatterns: ["**/*.gen.ts", "**/CHANGELOG.md"],
	},
	test: {
		exclude: ["**/node_modules/**", "**/dist/**"],
	},
	staged: {
		"*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,json,jsonc}": "vp check --fix",
	},
});
