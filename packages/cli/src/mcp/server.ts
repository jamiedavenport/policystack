import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pkgJson from "../../package.json";
import { registerTools } from "./tools";

/**
 * Build the `openpolicy mcp` server with its six frozen tools registered, but
 * NOT connected to a transport. Pure and side-effect-free so the drift test
 * can drive it over an in-memory transport without a subprocess (PS-29).
 */
export function createMcpServer(): McpServer {
	const server = new McpServer({ name: "openpolicy", version: pkgJson.version });
	registerTools(server);
	return server;
}

/**
 * Run the server over stdio — the universal transport for an agent-launched
 * server (Claude Code, the PS-32 skill pack). stdout is the protocol channel,
 * so every tool path here is deliberately side-effect-free (no console/stdout
 * writes; `validate_config` reuses the pure `resolveValidateResult`).
 */
export async function runMcp(): Promise<void> {
	const server = createMcpServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
}
