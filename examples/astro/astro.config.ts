import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { policyStack } from "@policystack/vite";

export default defineConfig({
	adapter: node({ mode: "standalone" }),
	output: "server",
	integrations: [react()],
	vite: {
		plugins: [
			policyStack({
				consent: { mode: "warn" },
				// The example declares only strictly necessary cookies.
				suppress: ["consent-mechanism-undeclared"],
			}),
			tailwindcss(),
		],
	},
});
