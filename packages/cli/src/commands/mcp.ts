import { defineCommand } from "citty";
import { runMcp } from "../mcp/server";

export const mcpCommand = defineCommand({
	meta: {
		name: "mcp",
		description:
			"Run the PolicyStack MCP server over stdio. Exposes validate_config, scaffold_config, explain_jurisdiction, list_data_categories, explain_issue, and scan_ungated — all resolved against the frozen SDK surface (no drift).",
	},
	async run() {
		await runMcp();
	},
});
