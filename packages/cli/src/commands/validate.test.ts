import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ArgsDef, CommandMeta } from "citty";
import consola from "consola";
import { afterAll, afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { runValidate, validateCommand } from "./validate";

/**
 * Tmp dirs sit inside this package's own directory so `bundle-require`'s
 * esbuild pass can resolve `@policystack/sdk` (a `workspace:*` devDependency,
 * symlinked at `packages/cli/node_modules/@policystack/sdk`) from the bundled
 * config — same constraint as the Vite plugin's loader test.
 */
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

let tmp: string;
let prevExitCode: typeof process.exitCode;

beforeEach(async () => {
	tmp = await mkdtemp(join(PACKAGE_ROOT, ".tmp-validate-"));
	prevExitCode = process.exitCode;
	process.exitCode = undefined;
	vi.spyOn(consola, "error").mockImplementation(() => {});
	vi.spyOn(consola, "warn").mockImplementation(() => {});
	vi.spyOn(consola, "success").mockImplementation(() => {});
});

afterEach(async () => {
	await rm(tmp, { recursive: true, force: true });
	process.exitCode = prevExitCode;
	vi.restoreAllMocks();
});

afterAll(() => {
	process.exitCode = 0;
});

async function writeConfig(source: string): Promise<string> {
	const file = join(tmp, "policystack.ts");
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, source, "utf8");
	return file;
}

const VALID_CONFIG = `
import { ContractPrerequisite, defineConfig, LegalBases } from "@policystack/sdk";

export default defineConfig({
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
		dpo: { required: false, reason: "small-scale processing" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
	data: {
		collected: { "Account Information": ["Name", "Email"] },
		context: {
			"Account Information": {
				purpose: "To authenticate users",
				lawfulBasis: LegalBases.Contract,
				retention: "Until deletion",
				provision: ContractPrerequisite("We cannot create or operate your account."),
			},
		},
	},
	automatedDecisionMaking: [],
});
`;

test("validateCommand has correct name and args", () => {
	expect((validateCommand.meta as CommandMeta)?.name).toBe("validate");
	const args = validateCommand.args as ArgsDef;
	expect(args?.config?.type).toBe("positional");
	expect(args?.cwd?.type).toBe("string");
	expect(args?.json?.type).toBe("boolean");
});

test("valid config: ok, no issues, exit code unset", async () => {
	const file = await writeConfig(VALID_CONFIG);
	const result = await runValidate({ cwd: tmp, config: file, json: false });
	expect(result.ok).toBe(true);
	expect(result.issues).toEqual([]);
	expect(result.errorCount).toBe(0);
	expect(result.loadError).toBeNull();
	expect(process.exitCode).toBeUndefined();
});

test("config with an error: not ok, frozen Issue shape, exit code 1", async () => {
	const file = await writeConfig(VALID_CONFIG.replace('effectiveDate: "2026-01-01",', ""));
	const result = await runValidate({ cwd: tmp, config: file, json: false });
	expect(result.ok).toBe(false);
	const hit = result.issues.find((i) => i.code === "effective-date-required");
	expect(hit).toEqual({
		code: "effective-date-required",
		level: "error",
		message: "effectiveDate is required",
	});
	expect(result.errorCount).toBeGreaterThanOrEqual(1);
	expect(process.exitCode).toBe(1);
});

test("warnings only: still ok and exit code unset", async () => {
	// us-ca without a contact phone → company-contact-phone-recommended (warning).
	const file = await writeConfig(
		VALID_CONFIG.replace('jurisdictions: ["eea"],', 'jurisdictions: ["us-ca"],'),
	);
	const result = await runValidate({ cwd: tmp, config: file, json: false });
	const hit = result.issues.find((i) => i.code === "company-contact-phone-recommended");
	expect(hit?.level).toBe("warning");
	expect(result.warningCount).toBeGreaterThanOrEqual(1);
	expect(result.ok).toBe(true);
	expect(process.exitCode).toBeUndefined();
});

test("--json emits exactly one parseable JSON object to stdout", async () => {
	const file = await writeConfig(VALID_CONFIG.replace('effectiveDate: "2026-01-01",', ""));
	const writes: string[] = [];
	vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
		writes.push(String(chunk));
		return true;
	});

	const result = await runValidate({ cwd: tmp, config: file, json: true });

	expect(writes).toHaveLength(1);
	const parsed = JSON.parse(writes[0] ?? "");
	expect(parsed).toEqual(result);
	expect(parsed.ok).toBe(false);
	expect(parsed.issues.some((i: { code: string }) => i.code === "effective-date-required")).toBe(
		true,
	);
	expect(process.exitCode).toBe(1);
});

test("missing config file: load error, not ok, no throw", async () => {
	const missing = join(tmp, "nope", "policystack.ts");
	const result = await runValidate({ cwd: tmp, config: missing, json: false });
	expect(result.ok).toBe(false);
	expect(result.issues).toEqual([]);
	expect(result.loadError).toContain("No config found");
	expect(process.exitCode).toBe(1);
});

test("invalid TypeScript: captured as a load error, not thrown", async () => {
	const file = await writeConfig("export default this is not valid typescript;");
	const result = await runValidate({ cwd: tmp, config: file, json: false });
	expect(result.ok).toBe(false);
	expect(result.loadError).not.toBeNull();
	expect(result.issues).toEqual([]);
	expect(process.exitCode).toBe(1);
});

test("missing default export: captured as a load error", async () => {
	const file = await writeConfig(`export const notDefault = 1;`);
	const result = await runValidate({ cwd: tmp, config: file, json: false });
	expect(result.ok).toBe(false);
	expect(result.loadError).toContain("no default export");
});

test("default config discovery resolves policystack.ts under cwd", async () => {
	await writeConfig(VALID_CONFIG);
	const result = await runValidate({ cwd: tmp, json: false });
	expect(result.config).toBe(join(tmp, "policystack.ts"));
	expect(result.ok).toBe(true);
});
