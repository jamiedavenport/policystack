import { defineConfig } from "vite-plus";

export default defineConfig({
	pack: {
		// Split entries — `./policy` (renderers) and `./consent` (hooks) only
		// ever read the shared, runtime-dep-free `./context`, so each still
		// tree-shakes the other out. `./provider` holds the single
		// `<PolicyStack>` and the only `createConsentStore` import: a consumer
		// that wants both pays for both; single-concern consumers keep importing
		// just `./policy` or `./consent` and the split still holds.
		entry: ["./src/policy.ts", "./src/consent.tsx", "./src/provider.tsx"],
		format: "esm",
		dts: true,
		fixedExtension: false,
	},
});
