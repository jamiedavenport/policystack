import solid from "vite-plugin-solid";
import { defineConfig } from "vite-plus";

export default defineConfig({
	plugins: [solid({ ssr: false })],
	resolve: {
		conditions: ["browser", "development"],
		alias: [
			{ find: /^solid-js\/web$/, replacement: "solid-js/web/dist/dev.js" },
			{ find: /^solid-js\/store$/, replacement: "solid-js/store/dist/dev.js" },
			{ find: /^solid-js$/, replacement: "solid-js/dist/dev.js" },
		],
	},
	test: {
		environment: "happy-dom",
		server: {
			deps: {
				inline: [/solid-js/, /@solidjs\//, /@testing-library\//],
			},
		},
	},
});
