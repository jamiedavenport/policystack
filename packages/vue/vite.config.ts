import { defineConfig } from "vite-plus";

export default defineConfig({
	pack: {
		// Split entries — `./policy` (renderers) and `./consent` (composables)
		// only ever read the shared, runtime-dep-free `./context`, so each
		// tree-shakes the other out. `./provider` holds the single
		// `<PolicyStack>` and the only `createConsentStore` import.
		entry: ["./src/policy.ts", "./src/consent.ts", "./src/provider.ts"],
		format: "esm",
		dts: true,
		fixedExtension: false,
	},
});
