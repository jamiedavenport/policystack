import { defineCommand } from "citty";
import pkgJson from "../package.json";

export const mainCommand = defineCommand({
	meta: {
		name: "policystack",
		version: pkgJson.version,
		description:
			"Install PolicyStack and print a setup prompt for coding agents. PolicyStack generates policy documents from your config — it does not provide legal advice. Have a lawyer review your policies before publication. See https://policystack.dev/legal-notice",
	},
	subCommands: {
		init: () => import("./commands/init").then((m) => m.initCommand),
		validate: () => import("./commands/validate").then((m) => m.validateCommand),
		mcp: () => import("./commands/mcp").then((m) => m.mcpCommand),
	},
});

export async function run() {
	const { runMain } = await import("citty");
	await runMain(mainCommand);
}
