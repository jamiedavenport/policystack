import { defineConfig } from "vite-plus";

export default defineConfig({
	pack: {
		// Two entries on purpose: `./auto-collected` is kept as a separate chunk
		// so the `dist/index.js` bundle references it via a relative
		// `./auto-collected.js` import instead of inlining its contents. That
		// relative import is what `@openpolicy/vite`'s `resolveId` hook
		// intercepts to inline scanned categories at consumer build time.
		entry: {
			index: "./src/index.ts",
			"auto-collected": "./src/auto-collected.ts",
			opencookies: "./src/opencookies.ts",
		},
		format: "esm",
		dts: true,
		fixedExtension: false,
	},
});
