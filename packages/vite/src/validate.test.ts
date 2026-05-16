import type { Issue, IssueCode } from "@openpolicy/core";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { renderGenModule, type Scanned } from "./scanned";
import { applyIssuePolicy, loadAndValidateConfig } from "./validate";

/**
 * Tmp dirs sit inside this package's own directory so that `bundle-require`'s
 * esbuild pass can resolve `@openpolicy/sdk` (a `workspace:*` devDependency,
 * symlinked at `packages/vite/node_modules/@openpolicy/sdk`) from the bundled
 * config. The workspace root doesn't have the SDK on its `node_modules` path
 * (pnpm doesn't hoist it), and `tmpdir()` would escape the workspace
 * entirely — either would make the SDK fail to resolve.
 */
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let tmp: string;

beforeEach(async () => {
	tmp = await mkdtemp(join(PACKAGE_ROOT, ".tmp-validate-"));
});

afterEach(async () => {
	await rm(tmp, { recursive: true, force: true });
});

async function writeConfig(source: string): Promise<string> {
	const file = join(tmp, "openpolicy.ts");
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, source, "utf8");
	return file;
}

/**
 * Writes the on-disk `openpolicy.gen.ts` module next to the tmp config, exactly
 * as the Vite plugin would, so configs that import `./openpolicy.gen` resolve
 * the scanned values through ordinary relative source.
 */
async function writeGen(scanned: Scanned): Promise<void> {
	await writeFile(join(tmp, "openpolicy.gen.ts"), renderGenModule(scanned), "utf8");
}

const VALID_CONFIG = `
import { ContractPrerequisite, defineConfig, LegalBases } from "@openpolicy/sdk";

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

test("returns no issues for a complete valid config", async () => {
	const file = await writeConfig(VALID_CONFIG);
	const result = await loadAndValidateConfig({ configFile: file });
	expect(result.loadError).toBeNull();
	expect(result.config).not.toBeNull();
	expect(result.issues).toEqual([]);
});

test("surfaces effective-date-required as an error", async () => {
	const file = await writeConfig(VALID_CONFIG.replace('effectiveDate: "2026-01-01",', ""));
	const result = await loadAndValidateConfig({ configFile: file });
	expect(result.loadError).toBeNull();
	const hit = result.issues.find((i) => i.code === "effective-date-required");
	expect(hit).toBeDefined();
	expect(hit?.level).toBe("error");
});

test("surfaces company-contact-phone-recommended warning under us-ca", async () => {
	const file = await writeConfig(
		VALID_CONFIG.replace('jurisdictions: ["eea"],', 'jurisdictions: ["us-ca"],'),
	);
	const result = await loadAndValidateConfig({ configFile: file });
	expect(result.loadError).toBeNull();
	const hit = result.issues.find((i) => i.code === "company-contact-phone-recommended");
	expect(hit).toBeDefined();
	expect(hit?.level).toBe("warning");
});

test("scanned data from the on-disk gen module flows into validators via spread", async () => {
	// User config imports `dataCollected` from the generated `./openpolicy.gen`
	// module and spreads it, but doesn't add a matching context entry for the
	// scanned-only category. The scanned key flows through `data.collected` as
	// ordinary relative source, so the missing-context check fires.
	const source = `
import { ContractPrerequisite, defineConfig, LegalBases } from "@openpolicy/sdk";
import { dataCollected } from "./openpolicy.gen";

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
		collected: { ...dataCollected },
		context: {},
	},
	automatedDecisionMaking: [],
});
`;
	const file = await writeConfig(source);
	await writeGen({
		dataCollected: { "Browser Telemetry": ["User-Agent"] },
		thirdParties: [],
		cookies: { essential: true },
		sharing: [],
		diagnostics: [],
	});
	const result = await loadAndValidateConfig({ configFile: file });
	expect(result.loadError).toBeNull();
	const hit = result.issues.find((i) => i.message.includes("Browser Telemetry"));
	expect(hit).toBeDefined();
});

test("single validator emits each code at most once (no dedupe pass needed)", async () => {
	// The single validator runs each required-field check once, so a missing
	// effectiveDate surfaces exactly one effective-date-required issue.
	const file = await writeConfig(VALID_CONFIG.replace('effectiveDate: "2026-01-01",', ""));
	const result = await loadAndValidateConfig({ configFile: file });
	const matches = result.issues.filter((i) => i.code === "effective-date-required");
	expect(matches.length).toBe(1);
});

test("captures load errors instead of throwing", async () => {
	const file = await writeConfig("export default this is not valid typescript;");
	const result = await loadAndValidateConfig({ configFile: file });
	expect(result.loadError).toBeInstanceOf(Error);
	expect(result.config).toBeNull();
	expect(result.issues).toEqual([]);
});

test("captures missing default export as a load error", async () => {
	const file = await writeConfig(`export const notDefault = 1;`);
	const result = await loadAndValidateConfig({ configFile: file });
	expect(result.loadError).toBeInstanceOf(Error);
	expect(result.loadError?.message).toContain("no default export");
});

// --- applyIssuePolicy (PS-13: strict + per-code suppression) ---

const warn = (code: IssueCode): Issue => ({ code, level: "warning", message: `${code} msg` });
const err = (code: IssueCode): Issue => ({ code, level: "error", message: `${code} msg` });

test("applyIssuePolicy: no options is the identity transform", () => {
	const issues = [err("effective-date-required"), warn("automated-decision-making")];
	expect(applyIssuePolicy(issues, {})).toEqual(issues);
});

test("applyIssuePolicy: suppress drops a warning code", () => {
	const issues = [warn("automated-decision-making"), warn("company-dpo-undeclared")];
	const out = applyIssuePolicy(issues, { suppress: ["automated-decision-making"] });
	expect(out).toEqual([warn("company-dpo-undeclared")]);
});

test("applyIssuePolicy: suppress drops an error code too (any level)", () => {
	const issues = [err("effective-date-required"), warn("automated-decision-making")];
	const out = applyIssuePolicy(issues, { suppress: ["effective-date-required"] });
	expect(out).toEqual([warn("automated-decision-making")]);
});

test("applyIssuePolicy: strict promotes every warning to an error, codes/messages preserved", () => {
	const issues = [err("effective-date-required"), warn("automated-decision-making")];
	const out = applyIssuePolicy(issues, { strict: true });
	expect(out).toEqual([
		{ code: "effective-date-required", level: "error", message: "effective-date-required msg" },
		{ code: "automated-decision-making", level: "error", message: "automated-decision-making msg" },
	]);
});

test("applyIssuePolicy: suppress runs before strict — a suppressed code is never promoted", () => {
	const issues = [warn("automated-decision-making"), warn("company-dpo-undeclared")];
	const out = applyIssuePolicy(issues, {
		strict: true,
		suppress: ["automated-decision-making"],
	});
	expect(out).toEqual([
		{ code: "company-dpo-undeclared", level: "error", message: "company-dpo-undeclared msg" },
	]);
});

test("loadAndValidateConfig: strict flips the us-ca phone warning to an error", async () => {
	const file = await writeConfig(
		VALID_CONFIG.replace('jurisdictions: ["eea"],', 'jurisdictions: ["us-ca"],'),
	);
	const result = await loadAndValidateConfig({ configFile: file, strict: true });
	expect(result.loadError).toBeNull();
	const hit = result.issues.find((i) => i.code === "company-contact-phone-recommended");
	expect(hit).toBeDefined();
	expect(hit?.level).toBe("error");
	expect(result.issues.some((i) => i.level === "warning")).toBe(false);
});

test("loadAndValidateConfig: suppress removes a code entirely", async () => {
	const file = await writeConfig(
		VALID_CONFIG.replace('jurisdictions: ["eea"],', 'jurisdictions: ["us-ca"],'),
	);
	const result = await loadAndValidateConfig({
		configFile: file,
		suppress: ["company-contact-phone-recommended"],
	});
	expect(result.loadError).toBeNull();
	expect(result.issues.some((i) => i.code === "company-contact-phone-recommended")).toBe(false);
});

test("loadAndValidateConfig: suppress does not silence config load failures", async () => {
	const file = await writeConfig("export default this is not valid typescript;");
	const result = await loadAndValidateConfig({
		configFile: file,
		suppress: ["effective-date-required"],
		strict: true,
	});
	expect(result.loadError).toBeInstanceOf(Error);
	expect(result.issues).toEqual([]);
});
