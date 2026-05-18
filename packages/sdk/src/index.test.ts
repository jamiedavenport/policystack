import { expect, test } from "vite-plus/test";
import type { OpenPolicyConfig } from "./index";
import { defineConfig } from "./index";

const fixture: OpenPolicyConfig = {
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["ca"],
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
};

test("defineConfig preserves input fields (company seeded, consent derived)", () => {
	const result = defineConfig(fixture);
	expect(result.effectiveDate).toBe(fixture.effectiveDate);
	expect(result.jurisdictions).toEqual(fixture.jurisdictions);
	expect(result.data).toEqual(fixture.data);
	expect(result.cookies).toEqual(fixture.cookies);
	// company is seeded (explicit values kept), consentMechanism is derived.
	expect(result.company.name).toBe("Acme Inc.");
	expect(result.company.contact.email).toBe("privacy@acme.com");
});

test("defineConfig populates privacyVersion and cookieVersion", () => {
	const result = defineConfig(fixture);
	expect(result.privacyVersion).toMatch(/^[0-9a-f]{8}$/);
	expect(result.cookieVersion).toMatch(/^[0-9a-f]{8}$/);
});

test("defineConfig omits privacyVersion when privacy is excluded via policies", () => {
	const result = defineConfig({
		company: fixture.company,
		effectiveDate: "2026-01-01",
		jurisdictions: ["ca"],
		data: fixture.data,
		cookies: fixture.cookies,
		policies: ["cookie"],
	});
	expect(result.privacyVersion).toBeUndefined();
	expect(result.cookieVersion).toMatch(/^[0-9a-f]{8}$/);
});

test("defineConfig omits cookieVersion when cookies field absent", () => {
	const result = defineConfig({
		company: fixture.company,
		effectiveDate: "2026-01-01",
		jurisdictions: ["ca"],
		data: fixture.data,
	});
	expect(result.cookieVersion).toBeUndefined();
	expect(result.privacyVersion).toMatch(/^[0-9a-f]{8}$/);
});

test("defineConfig respects manual privacyVersion override", () => {
	const result = defineConfig({ ...fixture, privacyVersion: "v3" });
	expect(result.privacyVersion).toBe("v3");
});

test("defineConfig respects manual cookieVersion override", () => {
	const result = defineConfig({ ...fixture, cookieVersion: "cookie-v3" });
	expect(result.cookieVersion).toBe("cookie-v3");
});

test("defineConfig versions are stable across key reordering", () => {
	const a = defineConfig(fixture);
	const b = defineConfig({
		jurisdictions: fixture.jurisdictions,
		cookies: fixture.cookies,
		thirdParties: fixture.thirdParties,
		data: fixture.data,
		effectiveDate: fixture.effectiveDate,
		company: fixture.company,
	});
	expect(b.privacyVersion).toBe(a.privacyVersion);
	expect(b.cookieVersion).toBe(a.cookieVersion);
});

test("defineConfig merges the scanned module passed as the second argument", () => {
	const scanned = {
		dataCollected: { "Scanned Cat": ["field"] },
		cookies: { essential: true as const, analytics: true },
		thirdParties: [{ name: "Stripe", purpose: "Payments", policyUrl: "https://stripe.com" }],
	};
	const result = defineConfig(
		{
			company: fixture.company,
			effectiveDate: "2026-01-01",
			jurisdictions: ["ca"],
			data: {
				collected: { Manual: ["x"] },
				context: { Manual: fixture.data.context["Account Information"] as never },
			},
			cookies: {
				context: {
					essential: { lawfulBasis: "legal_obligation" },
					analytics: { lawfulBasis: "consent" },
				},
			},
		},
		scanned,
	);
	// manual keys win on collision; scanned fills the rest.
	expect(result.data.collected).toEqual({ "Scanned Cat": ["field"], Manual: ["x"] });
	expect(result.cookies?.used).toEqual({ essential: true, analytics: true });
	expect(result.thirdParties).toEqual(scanned.thirdParties);
});

test("defineConfig derives consentMechanism from the cookie posture", () => {
	const gated = defineConfig({
		company: fixture.company,
		effectiveDate: "2026-01-01",
		jurisdictions: ["eea"],
		data: fixture.data,
		cookies: {
			used: { essential: true, analytics: true },
			context: {
				essential: { lawfulBasis: "legal_obligation" },
				analytics: { lawfulBasis: "consent" },
			},
		},
	});
	expect(gated.consentMechanism).toEqual({
		hasBanner: true,
		hasPreferencePanel: true,
		canWithdraw: true,
	});

	const essentialOnly = defineConfig({
		company: fixture.company,
		effectiveDate: "2026-01-01",
		jurisdictions: ["ca"],
		data: fixture.data,
		cookies: {
			used: { essential: true },
			context: { essential: { lawfulBasis: "legal_obligation" } },
		},
	});
	expect(essentialOnly.consentMechanism).toBeUndefined();
});

test("defineConfig seeds company from package.json; an explicit value wins", () => {
	// cwd is packages/sdk under `vp run -r test`; its package.json name is
	// "@openpolicy/sdk" and it has no homepage/author.
	const seeded = defineConfig({
		...fixture,
		company: { legalName: "L Corp", address: "1 St", contact: { email: "e@x.com" } },
	});
	expect(seeded.company.name).toBe("@openpolicy/sdk");
	expect(seeded.company.legalName).toBe("L Corp");

	expect(defineConfig(fixture).company.name).toBe("Acme Inc.");
});

test("defineConfig rejects data context missing entries for every collected category", () => {
	defineConfig({
		company: fixture.company,
		effectiveDate: "2026-01-01",
		jurisdictions: ["eea"],
		data: {
			collected: { "Account Information": ["Email"] },
			// @ts-expect-error — missing "Account Information" in context
			context: {},
		},
	});
	expect(true).toBe(true);
});

test("defineConfig rejects cookies.context without entry for every used cookie", () => {
	defineConfig({
		company: fixture.company,
		effectiveDate: "2026-01-01",
		jurisdictions: ["eea"],
		data: fixture.data,
		cookies: {
			used: { essential: true, analytics: true },
			// @ts-expect-error — missing "analytics" in context
			context: { essential: { lawfulBasis: "legal_obligation" } },
		},
	});
	expect(true).toBe(true);
});
