import { defineConfig } from "vite-plus";

export default defineConfig({
	pack: {
		// Split entries — `./policy` (renderers) and `./consent` (banner adapter)
		// never cross-import, so each tree-shakes the other out. `./provider`
		// is the explicit opt-in union (PolicyStackProvider): a consumer that
		// wants both pays for both; single-concern consumers keep importing
		// `./policy` or `./consent` and the split still holds.
		entry: ["./src/policy.ts", "./src/consent.tsx", "./src/provider.tsx"],
		format: "esm",
		dts: true,
		fixedExtension: false,
	},
});
