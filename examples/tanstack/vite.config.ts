import { policyStack } from "@policystack/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite-plus";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [
		tailwindcss(),
		tsConfigPaths(),
		policyStack({ srcDir: "./src", thirdParties: { usePackageJson: true } }),
		tanstackStart(),
		nitro(),
		// react's vite plugin must come after start's vite plugin
		viteReact(),
		process.env.ANALYZE === "true" &&
			visualizer({
				filename: "bundle-stats.html",
				open: true,
				gzipSize: true,
				brotliSize: true,
			}),
	],
});
