import type { OpenPolicyConfig } from "@openpolicy/core";
import { describe, expect, it } from "vite-plus/test";
import type { VendorHit } from "./consent/types";
import { applyDriftPolicy, crossCheck, type DriftFinding, formatDrift } from "./drift";
import type { Scanned } from "./scanned";

function cfg(over: Partial<OpenPolicyConfig>): OpenPolicyConfig {
	return {
		company: {
			name: "Acme",
			legalName: "Acme Inc.",
			address: "1 St",
			contact: { email: "p@acme.com" },
		},
		effectiveDate: "2026-01-01",
		jurisdictions: ["eea"],
		data: { collected: {}, context: {} },
		...over,
	} as OpenPolicyConfig;
}

function emptyScanned(over: Partial<Scanned> = {}): Scanned {
	return {
		dataCollected: {},
		thirdParties: [],
		cookies: { essential: true },
		sharing: [],
		diagnostics: [],
		...over,
	};
}

function vendorHit(over: Partial<VendorHit> = {}): VendorHit {
	return {
		file: "src/analytics.ts",
		line: 3,
		column: 1,
		vendor: "posthog",
		category: "analytics",
		via: "import",
		detector: "import",
		...over,
	};
}

describe("crossCheck — used → declared", () => {
	it("flags a tracked vendor used in code but absent from thirdParties", () => {
		const findings = crossCheck(cfg({}), emptyScanned(), [vendorHit()]);
		const f = findings.find((x) => x.code === "vendor-used-not-declared");
		expect(f).toBeDefined();
		expect(f?.level).toBe("error");
		expect(f?.message).toContain("PostHog");
		expect(f?.message).toContain("detected via import");
		expect(f?.suggestion).toContain("https://posthog.com/privacy");
		expect(f?.file).toBe("src/analytics.ts");
		expect(f?.line).toBe(3);
	});

	it("labels the detector that found the vendor", () => {
		const g = crossCheck(cfg({}), emptyScanned(), [
			vendorHit({ via: "global", detector: "global" }),
		]);
		expect(g.find((x) => x.code === "vendor-used-not-declared")?.message).toContain(
			"detected via global",
		);
	});

	it("flags a vendor whose category is not enabled in cookies.used", () => {
		const findings = crossCheck(
			cfg({
				thirdParties: [
					{
						name: "PostHog",
						purpose: "Product analytics",
						policyUrl: "https://posthog.com/privacy",
					},
				],
			}),
			emptyScanned(),
			[vendorHit()],
		);
		const f = findings.find((x) => x.code === "cookie-category-used-not-declared");
		expect(f?.level).toBe("error");
		expect(f?.message).toContain("analytics");
	});

	it("is clean when the used vendor + category are both declared", () => {
		const findings = crossCheck(
			cfg({
				thirdParties: [
					{
						name: "PostHog",
						purpose: "Product analytics",
						policyUrl: "https://posthog.com/privacy",
					},
				],
				cookies: {
					used: { essential: true, analytics: true },
					context: { essential: { lawfulBasis: "consent" }, analytics: { lawfulBasis: "consent" } },
				},
			}),
			emptyScanned({ cookies: { essential: true, analytics: true } }),
			[vendorHit()],
		);
		expect(findings).toEqual([]);
	});
});

describe("crossCheck — declared → used", () => {
	it("flags a declared cookie category nothing in code uses (the headline §4.3 check)", () => {
		const findings = crossCheck(
			cfg({
				cookies: {
					used: { essential: true, marketing: true },
					context: { essential: { lawfulBasis: "consent" }, marketing: { lawfulBasis: "consent" } },
				},
			}),
			emptyScanned(),
			[],
		);
		const f = findings.find((x) => x.code === "cookie-category-declared-not-used");
		expect(f?.level).toBe("error");
		expect(f?.message).toContain("marketing");
	});

	it("does not flag a declared vendor the scanner found via thirdParties (e.g. usePackageJson)", () => {
		const findings = crossCheck(
			cfg({
				thirdParties: [
					{
						name: "Stripe",
						purpose: "Payment processing",
						policyUrl: "https://stripe.com/privacy",
					},
				],
			}),
			emptyScanned({
				thirdParties: [
					{
						name: "Stripe",
						purpose: "Payment processing",
						policyUrl: "https://stripe.com/privacy",
					},
				],
			}),
			[],
		);
		expect(findings.find((x) => x.code === "vendor-declared-not-used")).toBeUndefined();
	});

	it("warns (not errors) on a declared vendor with no detected use", () => {
		const findings = crossCheck(
			cfg({
				thirdParties: [{ name: "Acme CRM", purpose: "CRM", policyUrl: "https://acme.example/p" }],
			}),
			emptyScanned(),
			[],
		);
		const f = findings.find((x) => x.code === "vendor-declared-not-used");
		expect(f?.level).toBe("warning");
		expect(f?.message).toContain("Acme CRM");
	});
});

describe("crossCheck — sharing() edges", () => {
	it("flags a sharing recipient not in thirdParties", () => {
		const findings = crossCheck(
			cfg({}),
			emptyScanned({ sharing: [{ key: "Email", recipient: "Mailchimp" }] }),
			[],
		);
		expect(findings.find((x) => x.code === "sharing-recipient-not-in-thirdparties")?.level).toBe(
			"error",
		);
	});

	it("flags a sharing key not in data.collected", () => {
		const findings = crossCheck(
			cfg({
				thirdParties: [{ name: "Stripe", purpose: "Payments", policyUrl: "https://stripe.com/p" }],
				data: { collected: { "Account Information": ["Name"] }, context: {} },
			}),
			emptyScanned({ sharing: [{ key: "Email", recipient: "Stripe" }] }),
			[],
		);
		const codes = findings.map((f) => f.code);
		expect(codes).toContain("sharing-key-not-collected");
		expect(codes).not.toContain("sharing-recipient-not-in-thirdparties");
	});
});

describe("applyDriftPolicy", () => {
	const sample: DriftFinding[] = [
		{ code: "vendor-used-not-declared", level: "error", message: "e" },
		{ code: "vendor-declared-not-used", level: "warning", message: "w" },
	];

	it("is the identity transform with an empty policy", () => {
		expect(applyDriftPolicy(sample, {})).toEqual(sample);
	});

	it("suppress drops by code at any level", () => {
		const out = applyDriftPolicy(sample, { suppress: ["vendor-used-not-declared"] });
		expect(out).toEqual([{ code: "vendor-declared-not-used", level: "warning", message: "w" }]);
	});

	it("strict promotes remaining warnings to errors", () => {
		const out = applyDriftPolicy(sample, { strict: true });
		expect(out.every((f) => f.level === "error")).toBe(true);
	});

	it("suppress runs before strict — a suppressed code is never promoted", () => {
		const out = applyDriftPolicy(sample, {
			strict: true,
			suppress: ["vendor-declared-not-used"],
		});
		expect(out).toEqual([{ code: "vendor-used-not-declared", level: "error", message: "e" }]);
	});
});

describe("formatDrift", () => {
	it("uses the greppable prefix, code, location and suggestion", () => {
		const line = formatDrift({
			code: "vendor-used-not-declared",
			level: "error",
			message: "PostHog is used",
			suggestion: "Add to openpolicy.ts thirdParties:\n    { name: ... }",
			file: "src/a.ts",
			line: 7,
			column: 2,
		});
		expect(line).toContain("[openpolicy] src/a.ts:7:2 vendor-used-not-declared:");
		expect(line).toContain("PostHog is used");
		expect(line).toContain("Add to openpolicy.ts thirdParties:");
	});
});
