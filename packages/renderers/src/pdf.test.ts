import { expect, test } from "vite-plus/test";
import { compile, type PolicyInput } from "@policystack/core";
import { renderPDF } from "./pdf";

const input: PolicyInput = {
	type: "privacy",
	effectiveDate: "2026-01-01",
	locale: "en",
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St",
		contact: { email: "privacy@acme.com" },
	},
	data: {
		collected: { "Account Information": ["Name", "Email"] },
		context: {
			"Account Information": {
				purpose: "To authenticate users",
				lawfulBasis: "contract" as const,
				retention: "Until deletion",
				provision: {
					basis: "contract-prerequisite" as const,
					consequences: "We cannot create or operate your account.",
				},
			},
		},
	},
	cookies: {
		used: { essential: true, analytics: false, marketing: false },
		context: {
			essential: { lawfulBasis: "legal_obligation" as const },
			analytics: { lawfulBasis: "consent" as const },
			marketing: { lawfulBasis: "consent" as const },
		},
	},
	thirdParties: [],
	userRights: ["access" as const],
	jurisdictions: ["ca" as const],
};

test("renderPDF returns a Buffer", async () => {
	const doc = compile(input);
	const result = await renderPDF(doc);
	expect(result).toBeInstanceOf(Buffer);
	expect(result.length).toBeGreaterThan(100);
});

test("renderPDF output begins with PDF magic bytes", async () => {
	const doc = compile(input);
	const result = await renderPDF(doc);
	expect(result.slice(0, 5).toString("ascii")).toBe("%PDF-");
});
