import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	ISSUE_CATALOG,
	type IssueCode,
	JURISDICTION_IDS,
	type JurisdictionId,
} from "@policystack/core";
import {
	Compliance,
	DataCategories,
	describeJurisdiction,
	LegalBases,
	Providers,
	renderLlmsTxt,
	Retention,
} from "@policystack/sdk";
import { scan } from "@policystack/vite/consent";
import { z } from "zod";
import { resolveValidateResult } from "../commands/validate";
import { getStubContents } from "../utils/stub";

/**
 * The frozen tool surface of `policystack mcp` (PS-29). Exactly these six names;
 * the drift test pins this list, and every enum below is built at *runtime*
 * from the frozen core tables — never a hand-typed copy — so a §6 union change
 * without a matching MCP update fails CI (the same guarantee PS-27 gave
 * `llms.txt`).
 */
export const TOOL_NAMES = [
	"validate_config",
	"scaffold_config",
	"explain_jurisdiction",
	"list_data_categories",
	"explain_issue",
	"scan_ungated",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

// Runtime-derived enums — the no-drift seam. `JURISDICTION_IDS` and
// `Object.keys(ISSUE_CATALOG)` ARE the frozen unions at runtime.
const jurisdictionIds = [...JURISDICTION_IDS] as [JurisdictionId, ...JurisdictionId[]];
const issueCodes = Object.keys(ISSUE_CATALOG) as IssueCode[] as [IssueCode, ...IssueCode[]];

type JsonObject = Record<string, unknown>;

/** Standard MCP tool result: structured payload + a JSON text rendering. */
function result(structured: JsonObject) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(structured, null, 2) }],
		structuredContent: structured,
	};
}

export function registerTools(server: McpServer): void {
	server.registerTool(
		"validate_config",
		{
			title: "Validate an policystack config",
			description:
				"Run the frozen validate() over the project's policystack config and return the structured ValidateResult ({ ok, config, issues, errorCount, warningCount, loadError }). Same result the `policystack validate --json` command emits. Use explain_issue for any returned code.",
			inputSchema: {
				cwd: z
					.string()
					.optional()
					.describe("Project directory (defaults to the server's working directory)"),
				config: z
					.string()
					.optional()
					.describe("Path to the config (defaults to src/policystack.ts, else policystack.ts)"),
			},
		},
		async ({ cwd, config }) => {
			const r = await resolveValidateResult({ cwd: cwd ?? process.cwd(), config });
			return result(r);
		},
	);

	server.registerTool(
		"scaffold_config",
		{
			title: "Scaffold a starter policystack config",
			description:
				"Return the contents of a minimal `defineConfig()` starter (the same stub `policystack init` writes). Set includeLlmsTxt to also get the canonical SDK reference to fill it in. Does not write any files.",
			inputSchema: {
				includeLlmsTxt: z
					.boolean()
					.optional()
					.describe("Also return the generated llms.txt SDK reference"),
			},
		},
		async ({ includeLlmsTxt }) =>
			result({
				filename: "policystack.ts",
				contents: getStubContents(),
				...(includeLlmsTxt ? { llmsTxt: renderLlmsTxt() } : {}),
			}),
	);

	server.registerTool(
		"explain_jurisdiction",
		{
			title: "Explain a jurisdiction id",
			description:
				"Explain a frozen JurisdictionId: its consent posture, policy-text tier, parent jurisdiction, and whether GPC is legally binding. Same derivation as llms.txt.",
			inputSchema: {
				jurisdiction: z
					.enum(jurisdictionIds)
					.describe("A frozen jurisdiction id (e.g. eea, uk, us-ca)"),
			},
		},
		async ({ jurisdiction }) => result(describeJurisdiction(jurisdiction)),
	);

	server.registerTool(
		"list_data_categories",
		{
			title: "List the SDK presets",
			description:
				"List the @policystack/sdk preset objects an agent can reference when authoring a config: data categories, lawful bases, retention periods, third-party providers, and compliance bundles. Categories in a real config are user-defined; these are the canonical examples (same set enumerated in llms.txt).",
		},
		async () =>
			result({
				dataCategories: DataCategories,
				legalBases: LegalBases,
				retention: Retention,
				providers: Providers,
				compliance: Compliance,
			}),
	);

	server.registerTool(
		"explain_issue",
		{
			title: "Explain a validate() issue code",
			description:
				"Explain a frozen IssueCode emitted by validate()/validate_config: its level (error|warning), a config-independent summary, and the remediation. Pair with validate_config to close the audit loop.",
			inputSchema: {
				code: z.enum(issueCodes).describe("A frozen IssueCode (e.g. data-context-missing)"),
			},
		},
		async ({ code }) => result({ code, ...ISSUE_CATALOG[code] }),
	);

	server.registerTool(
		"scan_ungated",
		{
			title: "Scan for un-consented cookie/vendor usage",
			description:
				"Statically scan a project's source for cookie writes and tracking-vendor usage that is NOT behind a consent gate. Returns { cookies, vendors, ungated } — `ungated` is the actionable list. Uses the same scanner as the @policystack/vite consent island.",
			inputSchema: {
				cwd: z
					.string()
					.optional()
					.describe("Project directory to scan (defaults to the server's working directory)"),
			},
		},
		async ({ cwd }) => {
			const r = await scan({ cwd: cwd ?? process.cwd() });
			return result({ cwd: cwd ?? process.cwd(), ...r });
		},
	);
}
