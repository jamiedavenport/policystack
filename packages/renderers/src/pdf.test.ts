import { expect, test } from "vite-plus/test";
import { compilePrivacyPolicy, type Document, type PolicyStackConfig } from "@policystack/core";
import { renderPDF } from "./pdf";

const config: PolicyStackConfig = {
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
				lawfulBasis: "contract",
				retention: "Until deletion",
				provision: {
					basis: "contract-prerequisite",
					consequences: "We cannot create or operate your account.",
				},
			},
		},
	},
	cookies: {
		used: { essential: true, analytics: false, marketing: false },
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
			marketing: { lawfulBasis: "consent" },
		},
	},
	thirdParties: [],
	jurisdictions: ["ca"],
};

function privacyDoc(): Document {
	const doc = compilePrivacyPolicy(config);
	if (!doc) throw new Error("expected a privacy document");
	return doc;
}

test("renderPDF returns a Buffer", async () => {
	const result = await renderPDF(privacyDoc());
	expect(result).toBeInstanceOf(Buffer);
	expect(result.length).toBeGreaterThan(100);
});

test("renderPDF output begins with PDF magic bytes", async () => {
	const result = await renderPDF(privacyDoc());
	expect(result.slice(0, 5).toString("ascii")).toBe("%PDF-");
});
