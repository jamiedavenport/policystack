import { existsSync, statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

export function resolveStubPath(cwd: string, outOverride?: string): string {
	if (outOverride) {
		return isAbsolute(outOverride) ? outOverride : resolve(cwd, outOverride);
	}
	const srcDir = join(cwd, "src");
	if (existsSync(srcDir) && statSync(srcDir).isDirectory()) {
		return join(srcDir, "policystack.ts");
	}
	return join(cwd, "policystack.ts");
}

export function getStubContents(today = new Date().toISOString().slice(0, 10)) {
	return `import { defineConfig } from "@policystack/sdk";

export default defineConfig({
	// Your legal entity. \`legalName\` and \`address\` appear verbatim in the
	// generated policies and must be filled in. \`name\`, \`url\` and
	// \`contact.email\` are seeded from this project's package.json (name /
	// homepage / author.email) when omitted — add them here to override.
	company: {
		legalName: "",
		address: "",
	},
	// Date the policy takes effect (ISO 8601).
	effectiveDate: "${today}",
	// Jurisdictions you serve, as SDK codes (e.g. "eea", "us-ca", "uk").
	// See the SDK reference for the full list of valid codes.
	jurisdictions: [],
	// Personal data you collect. \`collected\` maps each category to its
	// fields; \`context\` gives that same category a purpose, lawful basis
	// and retention period.
	data: {
		collected: {},
		context: {},
	},

	// ── Cookies & consent ────────────────────────────────────────────────
	// Uncomment to declare cookies. The single provider (e.g.
	// \`@policystack/react/provider\`'s PolicyStackProvider) derives the consent
	// runtime from this block — categories, locked vs. consent-gated, the
	// automatic re-prompt on policy change, AND the consent mechanism (banner /
	// preference panel / withdrawal) — so consent is never configured by hand.
	// Import \`LegalBases\` from "@policystack/sdk" to use the values below; pass
	// a generated \`./policystack.gen\` module as defineConfig's second argument
	// to merge in scanned categories.
	//
	// cookies: {
	// 	used: { essential: true, analytics: true, marketing: true },
	// 	context: {
	// 		essential: { lawfulBasis: LegalBases.LegalObligation }, // always on
	// 		analytics: { lawfulBasis: LegalBases.Consent },         // consent-gated
	// 		marketing: { lawfulBasis: LegalBases.Consent },         // consent-gated
	// 	},
	// },
});
`;
}

type WriteStubResult = { path: string; written: boolean };

export async function writeStub(path: string, force: boolean): Promise<WriteStubResult> {
	if (existsSync(path) && !force) {
		return { path, written: false };
	}
	await writeFile(path, getStubContents());
	return { path, written: true };
}
