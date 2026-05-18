import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ISSUE_CATALOG, JURISDICTION_IDS } from "@policystack/core";
import { expect, test } from "vite-plus/test";
import { createMcpServer } from "./server";
import { TOOL_NAMES } from "./tools";

async function connect(): Promise<Client> {
	const server = createMcpServer();
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	const client = new Client({ name: "test", version: "0.0.0" });
	await server.connect(serverTransport);
	await client.connect(clientTransport);
	return client;
}

/** Pull a property's JSON-schema `enum` off a listed tool's inputSchema. */
function propEnum(inputSchema: unknown, prop: string): string[] {
	const s = inputSchema as { properties?: Record<string, { enum?: string[] }> };
	return s.properties?.[prop]?.enum ?? [];
}

type CallResult = Awaited<ReturnType<Client["callTool"]>>;

function structured(res: CallResult): Record<string, unknown> {
	return (res.structuredContent ?? {}) as Record<string, unknown>;
}

test("exposes exactly the six frozen tools", async () => {
	const client = await connect();
	const { tools } = await client.listTools();
	expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
});

// Drift canaries: the accepted enums ride the same frozen runtime tables the
// compiler/validator use, so a §6 union change without an MCP update fails
// here (the guarantee PS-27 gave llms.txt, now extended to the tool surface).
test("explain_jurisdiction enum === the frozen JURISDICTION_IDS", async () => {
	const client = await connect();
	const { tools } = await client.listTools();
	const tool = tools.find((t) => t.name === "explain_jurisdiction");
	expect(propEnum(tool?.inputSchema, "jurisdiction").sort()).toEqual([...JURISDICTION_IDS].sort());
});

test("explain_issue enum === the frozen ISSUE_CATALOG keys", async () => {
	const client = await connect();
	const { tools } = await client.listTools();
	const tool = tools.find((t) => t.name === "explain_issue");
	expect(propEnum(tool?.inputSchema, "code").sort()).toEqual(Object.keys(ISSUE_CATALOG).sort());
});

test("explain_jurisdiction returns the live table value", async () => {
	const client = await connect();
	const res = await client.callTool({
		name: "explain_jurisdiction",
		arguments: { jurisdiction: "us-ca" },
	});
	const sc = structured(res);
	expect(sc.id).toBe("us-ca");
	expect(sc.consentModel).toBe("opt-out");
	expect(sc.policyText).toBe("specific");
	expect(sc.parent).toBe("us");
	expect(sc.gpcLegallyBinding).toBe(true);
});

test("explain_issue returns the live catalog entry", async () => {
	const code = "data-context-missing";
	const client = await connect();
	const res = await client.callTool({ name: "explain_issue", arguments: { code } });
	const sc = structured(res);
	expect(sc.code).toBe(code);
	expect(sc.level).toBe(ISSUE_CATALOG[code].level);
	expect(sc.summary).toBe(ISSUE_CATALOG[code].summary);
	expect(sc.fix).toBe(ISSUE_CATALOG[code].fix);
});

test("scaffold_config returns a defineConfig stub", async () => {
	const client = await connect();
	const res = await client.callTool({ name: "scaffold_config", arguments: {} });
	const sc = structured(res);
	expect(sc.filename).toBe("policystack.ts");
	expect(String(sc.contents)).toContain("defineConfig");
	expect(sc.llmsTxt).toBeUndefined();
	const withLlms = structured(
		await client.callTool({ name: "scaffold_config", arguments: { includeLlmsTxt: true } }),
	);
	expect(String(withLlms.llmsTxt)).toContain("PolicyStack SDK reference");
});

test("list_data_categories returns the SDK presets", async () => {
	const client = await connect();
	const sc = structured(await client.callTool({ name: "list_data_categories", arguments: {} }));
	expect(sc.dataCategories).toMatchObject({ AccountInfo: {} });
	expect(sc.legalBases).toMatchObject({ Consent: "consent" });
	expect(sc.retention).toBeDefined();
	expect(sc.providers).toBeDefined();
	expect(sc.compliance).toBeDefined();
});

test("validate_config reports a missing config (ok:false)", async () => {
	const dir = await mkdtemp(join(tmpdir(), "ps29-"));
	const client = await connect();
	const sc = structured(
		await client.callTool({ name: "validate_config", arguments: { cwd: dir } }),
	);
	expect(sc.ok).toBe(false);
	expect(typeof sc.loadError).toBe("string");
});

test("scan_ungated returns a ScanResult shape on an empty dir", async () => {
	const dir = await mkdtemp(join(tmpdir(), "ps29-scan-"));
	const client = await connect();
	const sc = structured(await client.callTool({ name: "scan_ungated", arguments: { cwd: dir } }));
	expect(Array.isArray(sc.cookies)).toBe(true);
	expect(Array.isArray(sc.vendors)).toBe(true);
	expect(Array.isArray(sc.ungated)).toBe(true);
});

test("rejects an unknown jurisdiction id", async () => {
	const client = await connect();
	let errored = false;
	try {
		const res = await client.callTool({
			name: "explain_jurisdiction",
			arguments: { jurisdiction: "zz" },
		});
		errored = res.isError === true;
	} catch {
		errored = true;
	}
	expect(errored).toBe(true);
});
