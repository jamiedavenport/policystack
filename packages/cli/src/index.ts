import { defineCommand } from "citty";
import pkgJson from "../package.json";

export const mainCommand = defineCommand({
	meta: {
		name: "openpolicy",
		version: pkgJson.version,
		description:
			"Install OpenPolicy and print a setup prompt for coding agents. OpenPolicy generates policy documents from your config — it does not provide legal advice. Have a lawyer review your policies before publication. See https://openpolicy.sh/legal-notice",
	},
	subCommands: {
		init: () => import("./commands/init").then((m) => m.initCommand),
		validate: () => import("./commands/validate").then((m) => m.validateCommand),
	},
});

export async function run() {
	const { runMain } = await import("citty");
	await runMain(mainCommand);
}
