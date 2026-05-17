import { defineConfig } from "vite-plus";

export default defineConfig({
	fmt: {
		useTabs: true,
		// `**/__fixtures__/**`: vendored OpenCookies consent-scanner fixtures
		// (PS-19) are intentionally messy sample sources with frozen
		// `.expected.json` snapshots — never reformat them.
		// `plugin/**` + `.claude-plugin/**`: the generated PolicyStack skill
		// pack (PS-32) — `renderSkillPack()` is the single source of truth and
		// `packages/sdk/src/skills.test.ts` guards it byte-for-byte; Oxfmt would
		// rewrite the JSON/markdown and break the drift test.
		ignorePatterns: [
			"**/*.gen.ts",
			"**/CHANGELOG.md",
			"**/__fixtures__/**",
			"plugin/**",
			".claude-plugin/**",
		],
	},
	lint: {
		ignorePatterns: ["**/__fixtures__/**", "plugin/**", ".claude-plugin/**"],
	},
	test: {
		exclude: ["**/node_modules/**", "**/dist/**"],
	},
	staged: {
		// Include md/mdx/css so prose + styles are auto-formatted on commit.
		// `vp check` checks them in CI, so the staged set must match or content
		// edits drift red (the gap that left 21 apps/web files unformatted).
		"*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,json,jsonc,md,mdx,css}": "vp check --fix",
	},
});
