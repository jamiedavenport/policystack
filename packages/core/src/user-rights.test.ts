import { expect, test } from "vite-plus/test";
import { compile } from "./documents";
import type { PolicyStackConfig, PolicyInput, UserRight } from "./types";
import { deriveUserRights } from "./user-rights";
import { validate } from "./validate";

const GDPR_RIGHTS: UserRight[] = [
	"access",
	"rectification",
	"erasure",
	"portability",
	"restriction",
	"objection",
];

test("deriveUserRights: EEA-only returns the six GDPR rights in canonical order", () => {
	expect(deriveUserRights(["eea"])).toEqual(GDPR_RIGHTS);
});

test("deriveUserRights: UK-only returns the six GDPR rights (UK-GDPR parity)", () => {
	expect(deriveUserRights(["uk"])).toEqual(GDPR_RIGHTS);
});

test("deriveUserRights: US-CA-only returns the four CCPA rights in canonical order", () => {
	expect(deriveUserRights(["us-ca"])).toEqual([
		"access",
		"erasure",
		"opt_out_sale",
		"non_discrimination",
	]);
});

test("deriveUserRights: EEA+US-CA returns the union in canonical order regardless of input order", () => {
	const expected: UserRight[] = [
		"access",
		"rectification",
		"erasure",
		"portability",
		"restriction",
		"objection",
		"opt_out_sale",
		"non_discrimination",
	];
	expect(deriveUserRights(["eea", "us-ca"])).toEqual(expected);
	expect(deriveUserRights(["us-ca", "eea"])).toEqual(expected);
});

test("deriveUserRights: EEA dedupes with UK (both grant the same GDPR rights)", () => {
	expect(deriveUserRights(["eea", "uk"])).toEqual(GDPR_RIGHTS);
});

test("deriveUserRights: a reserved jurisdiction with no shipped content returns an empty array", () => {
	expect(deriveUserRights(["ca"])).toEqual([]);
	expect(deriveUserRights(["us-va"])).toEqual([]);
});

test("buildUserRights: privacy policy omits 'Your Rights' section when derivation is empty", () => {
	const input: PolicyInput = {
		type: "privacy",
		effectiveDate: "2026-01-01",
		locale: "en",
		company: {
			name: "Acme Inc.",
			legalName: "Acme Corporation",
			address: "123 Main St, Springfield, USA",
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
		userRights: [],
		jurisdictions: ["ca"],
	};
	const document = compile(input);
	const hasRightsSection = document.sections.some((s) => s.id === "user-rights");
	expect(hasRightsSection).toBe(false);
});

test("validate: emits no userRights-related issues", () => {
	const config: PolicyStackConfig = {
		company: {
			name: "Acme Inc.",
			legalName: "Acme Corporation",
			address: "123 Main St, Springfield, USA",
			contact: { email: "privacy@acme.com" },
		},
		effectiveDate: "2026-01-01",
		jurisdictions: ["us-ca"],
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
	};
	const issues = validate(config);
	expect(issues.some((i) => i.message.toLowerCase().includes("userrights"))).toBe(false);
});
