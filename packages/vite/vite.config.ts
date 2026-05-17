import { defineConfig } from "vite-plus";

export default defineConfig({
	pack: {
		// `./consent` is a second entry/chunk (the standalone scanner, PS-19):
		// the `policystack mcp` server's `scan_ungated` tool imports it without
		// pulling in the Vite plugin. `oxc-parser`/`tinyglobby` stay external
		// (they are runtime `dependencies`), so the native binding is not
		// bundled into either chunk.
		entry: {
			index: "./src/index.ts",
			consent: "./src/consent/index.ts",
		},
		format: "esm",
		dts: true,
		platform: "node",
		fixedExtension: false,
	},
});
