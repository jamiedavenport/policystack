import { expect, test } from "vite-plus/test";
import { deriveConsentMechanism, normalizeOpenPolicyConfig, seedCompany } from "./normalize";
import type { CompanyConfig, OpenPolicyConfig } from "./types";

const company: CompanyConfig = {
	name: "Acme Inc.",
	legalName: "Acme Corporation",
	address: "123 Main St",
	contact: { email: "privacy@acme.com" },
};

const base: OpenPolicyConfig = {
	company,
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
	data: { collected: {}, context: {} },
};

// --- deriveConsentMechanism ---

test("deriveConsentMechanism: no cookies block → undefined", () => {
	expect(deriveConsentMechanism(base)).toBeUndefined();
});

test("deriveConsentMechanism: essential-only (legal_obligation) → undefined", () => {
	expect(
		deriveConsentMechanism({
			...base,
			cookies: {
				used: { essential: true },
				context: { essential: { lawfulBasis: "legal_obligation" } },
			},
		}),
	).toBeUndefined();
});

test("deriveConsentMechanism: a consent-gated category → all-true", () => {
	expect(
		deriveConsentMechanism({
			...base,
			cookies: {
				used: { essential: true, analytics: true },
				context: {
					essential: { lawfulBasis: "legal_obligation" },
					analytics: { lawfulBasis: "consent" },
				},
			},
		}),
	).toEqual({ hasBanner: true, hasPreferencePanel: true, canWithdraw: true });
});

test("deriveConsentMechanism: missing lawfulBasis is treated as gated → all-true", () => {
	expect(
		deriveConsentMechanism({
			...base,
			cookies: { used: { essential: true }, context: {} },
		}),
	).toEqual({ hasBanner: true, hasPreferencePanel: true, canWithdraw: true });
});

test("deriveConsentMechanism: a disabled gated key is ignored", () => {
	expect(
		deriveConsentMechanism({
			...base,
			cookies: {
				used: { essential: true, analytics: false },
				context: {
					essential: { lawfulBasis: "legal_obligation" },
					analytics: { lawfulBasis: "consent" },
				},
			},
		}),
	).toBeUndefined();
});

// --- seedCompany (meta injected for determinism) ---

test("seedCompany: explicit values always win over package.json", () => {
	expect(
		seedCompany(
			{ ...company, url: "https://explicit.example" },
			{ name: "pkg-name", url: "https://pkg.example", email: "pkg@x.com" },
		),
	).toEqual({
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St",
		url: "https://explicit.example",
		contact: { email: "privacy@acme.com" },
	});
});

test("seedCompany: empty/absent fields fall back to package.json; legalName/address never seeded", () => {
	expect(
		seedCompany(
			{ name: "", legalName: "Acme Corporation", address: "123 Main St", contact: { email: "" } },
			{ name: "acme-app", url: "https://acme.example", email: "dev@acme.example" },
		),
	).toEqual({
		name: "acme-app",
		legalName: "Acme Corporation",
		address: "123 Main St",
		url: "https://acme.example",
		contact: { email: "dev@acme.example" },
	});
});

test("seedCompany: no package.json meta and empty fields → empty strings, no url", () => {
	expect(
		seedCompany({ name: "", legalName: "L", address: "A", contact: { email: "" } }, {}),
	).toEqual({ name: "", legalName: "L", address: "A", url: undefined, contact: { email: "" } });
});

// --- normalizeOpenPolicyConfig ---

test("normalizeOpenPolicyConfig is idempotent", () => {
	const cfg: OpenPolicyConfig = {
		...base,
		cookies: {
			used: { essential: true, analytics: true },
			context: {
				essential: { lawfulBasis: "legal_obligation" },
				analytics: { lawfulBasis: "consent" },
			},
		},
	};
	const once = normalizeOpenPolicyConfig(cfg);
	const twice = normalizeOpenPolicyConfig(once);
	expect(twice).toEqual(once);
	expect(once.consentMechanism).toEqual({
		hasBanner: true,
		hasPreferencePanel: true,
		canWithdraw: true,
	});
});
