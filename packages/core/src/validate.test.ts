import { expect, test } from "vite-plus/test";
import { isJurisdictionId, JURISDICTION_IDS } from "./jurisdiction-id";
import type { OpenPolicyConfig } from "./types";
import { validate } from "./validate";

// Valid flat config under an `equivalent` (non-gating) jurisdiction. It emits
// exactly one issue — the `jurisdiction-generic-policy-text` honesty warning
// for "ca" — and zero errors. Tests override slices to exercise each check.
const baseConfig: OpenPolicyConfig = {
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
		used: { essential: true },
		context: { essential: { lawfulBasis: "legal_obligation" } },
	},
	consentMechanism: {
		hasBanner: true,
		hasPreferencePanel: true,
		canWithdraw: true,
	},
};

test("validate: a well-formed config emits only honesty/info warnings, no errors", () => {
	const issues = validate(baseConfig);
	// baseConfig is essential-only (legal_obligation) so the derived consent
	// mechanism is absent — that is now an honest informational warning, not
	// "you forgot to write it". Still zero errors.
	expect(issues.some((i) => i.level === "error")).toBe(false);
	expect(issues.map((i) => i.code).sort()).toEqual(
		["consent-mechanism-undeclared", "jurisdiction-generic-policy-text"].sort(),
	);
});

// --- jurisdiction guard + codes ---

test("isJurisdictionId is true for every canonical code", () => {
	for (const code of JURISDICTION_IDS) {
		expect(isJurisdictionId(code)).toBe(true);
	}
});

test("isJurisdictionId is false for retired codes and regulation names", () => {
	expect(isJurisdictionId("eu")).toBe(false);
	expect(isJurisdictionId("nz")).toBe(false);
	expect(isJurisdictionId("au")).toBe(false);
	expect(isJurisdictionId("jp")).toBe(false);
	expect(isJurisdictionId("sg")).toBe(false);
	expect(isJurisdictionId("other")).toBe(false);
	expect(isJurisdictionId("gdpr")).toBe(false);
	expect(isJurisdictionId("ccpa")).toBe(false);
	expect(isJurisdictionId("")).toBe(false);
});

test("validate rejects a retired code with a helpful message listing valid codes", () => {
	const issues = validate({ ...baseConfig, jurisdictions: ["eu" as never] });
	const bad = issues.find((i) => i.message.startsWith('Unknown jurisdiction "eu"'));
	expect(bad).toBeDefined();
	expect(bad?.code).toBe("jurisdiction-unknown");
	expect(bad?.level).toBe("error");
	for (const code of JURISDICTION_IDS) {
		expect(bad?.message).toContain(code);
	}
});

test("validate rejects a typo'd code", () => {
	const issues = validate({ ...baseConfig, jurisdictions: ["uss-ca" as never] });
	expect(
		issues.some(
			(i) => i.level === "error" && i.message.startsWith('Unknown jurisdiction "uss-ca"'),
		),
	).toBe(true);
});

test("validate accepts every canonical code", () => {
	for (const code of JURISDICTION_IDS) {
		const issues = validate({ ...baseConfig, jurisdictions: [code] });
		expect(issues.some((i) => i.message.startsWith("Unknown jurisdiction"))).toBe(false);
	}
});

test("validate: an equivalent jurisdiction emits jurisdiction-generic-policy-text once; specific does not", () => {
	const equivalent = validate({ ...baseConfig, jurisdictions: ["ch"] });
	const generic = equivalent.filter((i) => i.code === "jurisdiction-generic-policy-text");
	expect(generic).toHaveLength(1);
	expect(generic[0]?.level).toBe("warning");
	expect(generic[0]?.message).toContain('"ch"');

	const specific = validate({ ...baseConfig, jurisdictions: ["eea"] });
	expect(specific.some((i) => i.code === "jurisdiction-generic-policy-text")).toBe(false);
});

test("validate: the us-${string} state tail falls back to parent us — no unknown error", () => {
	const issues = validate({ ...baseConfig, jurisdictions: ["us-fl" as never] });
	expect(issues.some((i) => i.code === "jurisdiction-unknown")).toBe(false);
	const generic = issues.find((i) => i.code === "jurisdiction-generic-policy-text");
	expect(generic).toBeDefined();
	expect(generic?.level).toBe("warning");
	expect(generic?.message).toContain('resolved to "us"');
});

test("validate errors on an empty jurisdictions array", () => {
	const issues = validate({ ...baseConfig, jurisdictions: [] });
	expect(
		issues.some(
			(i) =>
				i.code === "jurisdictions-required" &&
				i.level === "error" &&
				i.message === "jurisdictions must have at least one entry",
		),
	).toBe(true);
});

test("validate errors on an unknown locale", () => {
	const issues = validate({ ...baseConfig, locale: "xx" as never });
	const hit = issues.find((i) => i.code === "locale-unknown");
	expect(hit?.level).toBe("error");
});

// --- required fields (single pass, emitted once) ---

test("validate errors on missing required fields", () => {
	const issues = validate({
		...baseConfig,
		effectiveDate: "" as never,
		company: { name: "", legalName: "", address: "", contact: { email: "" } },
	});
	for (const code of [
		"effective-date-required",
		"company-name-required",
		"company-legal-name-required",
		"company-address-required",
		"company-contact-required",
	]) {
		expect(issues.filter((i) => i.code === code)).toHaveLength(1);
	}
});

// --- data posture ---

test("validate: data-missing is an error when a privacy policy is requested without data", () => {
	const issues = validate({
		...baseConfig,
		data: undefined as never,
		policies: ["privacy"],
	});
	const hit = issues.find((i) => i.code === "data-missing");
	expect(hit).toBeDefined();
	expect(hit?.level).toBe("error");
});

test("validate: data-collected-empty is a warning (e.g. a plain landing page)", () => {
	const issues = validate({
		...baseConfig,
		data: { collected: {}, context: {} },
	});
	const hit = issues.find((i) => i.code === "data-collected-empty");
	expect(hit).toBeDefined();
	expect(hit?.level).toBe("warning");
	expect(issues.some((i) => i.level === "error")).toBe(false);
});

test("validate: errors when a collected category has no context entry", () => {
	const issues = validate({
		...baseConfig,
		data: {
			collected: { "Account Information": ["Name"], "Session Data": ["IP"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: { basis: "contract-prerequisite", consequences: "No account." },
				},
			},
		},
	});
	expect(
		issues.some(
			(i) =>
				i.code === "data-context-missing" &&
				i.level === "error" &&
				i.message.includes('data.context["Session Data"] is missing'),
		),
	).toBe(true);
});

test("validate: errors when a purpose is missing or an empty string", () => {
	const missing = validate({
		...baseConfig,
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: undefined as never,
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: { basis: "contract-prerequisite", consequences: "No account." },
				},
			},
		},
	});
	expect(missing.some((i) => i.code === "data-purpose-missing" && i.level === "error")).toBe(true);

	const empty = validate({
		...baseConfig,
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "   ",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: { basis: "contract-prerequisite", consequences: "No account." },
				},
			},
		},
	});
	expect(
		empty.some(
			(i) =>
				i.code === "data-purpose-empty" &&
				i.level === "error" &&
				i.message.includes(
					'data.context["Account Information"].purpose must be a non-empty string',
				),
		),
	).toBe(true);
});

test("validate: errors on a context key with no matching collected category", () => {
	const issues = validate({
		...baseConfig,
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: { basis: "contract-prerequisite", consequences: "No account." },
				},
				"Orphan Category": {
					purpose: "Not attached to anything",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: { basis: "voluntary", consequences: "None" },
				},
			},
		},
	});
	expect(
		issues.some(
			(i) =>
				i.code === "data-context-orphan" &&
				i.level === "error" &&
				i.message.includes('data.context["Orphan Category"] has no matching entry'),
		),
	).toBe(true);
});

test("validate: emits retention-incomplete when a category lacks retention", () => {
	const issues = validate({
		...baseConfig,
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: undefined as never,
					provision: { basis: "contract-prerequisite", consequences: "No account." },
				},
			},
		},
	});
	expect(
		issues.some(
			(i) =>
				i.code === "retention-incomplete" &&
				i.message.includes('data.context["Account Information"].retention'),
		),
	).toBe(true);
});

// --- GDPR lawful basis / provision ---

test("validate: emits lawful-basis-incomplete under EU/UK when a basis is missing or empty", () => {
	for (const jx of [["eea"], ["uk"]] as const) {
		const issues = validate({
			...baseConfig,
			jurisdictions: [...jx],
			data: {
				collected: { "Account Information": ["Name"] },
				context: {
					"Account Information": {
						purpose: "To authenticate users",
						lawfulBasis: undefined as never,
						retention: "Until deletion",
						provision: { basis: "contract-prerequisite", consequences: "No account." },
					},
				},
			},
		});
		expect(issues.some((i) => i.code === "lawful-basis-incomplete" && i.level === "error")).toBe(
			true,
		);
	}

	const emptyBasis = validate({
		...baseConfig,
		jurisdictions: ["eea"],
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "" as never,
					retention: "Until deletion",
					provision: { basis: "contract-prerequisite", consequences: "No account." },
				},
			},
		},
	});
	expect(
		emptyBasis.some(
			(i) => i.code === "lawful-basis-incomplete" && i.message.includes("Account Information"),
		),
	).toBe(true);
});

test("validate: no lawful-basis-incomplete for non-GDPR jurisdictions", () => {
	const issues = validate({
		...baseConfig,
		jurisdictions: ["us-ca"],
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: undefined as never,
					retention: "Until deletion",
					provision: { basis: "contract-prerequisite", consequences: "No account." },
				},
			},
		},
	});
	expect(issues.some((i) => i.code === "lawful-basis-incomplete")).toBe(false);
});

test("validate: emits statutory-contractual-obligation when provision is missing under GDPR", () => {
	const issues = validate({
		...baseConfig,
		jurisdictions: ["eea"],
		data: {
			collected: { "Account Information": ["Name", "Email"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: undefined as never,
				},
			},
		},
	});
	const hit = issues.find(
		(i) => i.code === "statutory-contractual-obligation" && i.level === "error",
	);
	expect(hit).toBeDefined();
	expect(hit?.message).toContain('data.context["Account Information"].provision');
	expect(hit?.message).toContain("Art. 13(2)(e)");
});

test("validate: emits statutory-contractual-obligation when consequences is empty", () => {
	const issues = validate({
		...baseConfig,
		jurisdictions: ["eea"],
		data: {
			collected: { "Account Information": ["Name", "Email"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: { basis: "contractual", consequences: "   " },
				},
			},
		},
	});
	expect(
		issues.some(
			(i) =>
				i.code === "statutory-contractual-obligation" &&
				i.message.includes("consequences is empty"),
		),
	).toBe(true);
});

test("validate: no statutory-contractual-obligation for non-GDPR jurisdictions", () => {
	const issues = validate({
		...baseConfig,
		jurisdictions: ["us-ca"],
		data: {
			collected: { "Account Information": ["Name", "Email"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: undefined as never,
				},
			},
		},
	});
	expect(issues.some((i) => i.code === "statutory-contractual-obligation")).toBe(false);
});

// --- automated decision-making ---

test("validate: warns automated-decision-making under EU/UK when the field is omitted", () => {
	for (const jx of [["eea"], ["uk"]] as const) {
		const issues = validate({ ...baseConfig, jurisdictions: [...jx] });
		expect(
			issues.some((i) => i.code === "automated-decision-making" && i.level === "warning"),
		).toBe(true);
	}
});

test("validate: no automated-decision-making warning when declared empty or populated", () => {
	const empty = validate({ ...baseConfig, jurisdictions: ["eea"], automatedDecisionMaking: [] });
	expect(empty.some((i) => i.code === "automated-decision-making")).toBe(false);

	const populated = validate({
		...baseConfig,
		jurisdictions: ["eea"],
		automatedDecisionMaking: [
			{ name: "Fraud scoring", logic: "Rules engine", significance: "May decline" },
		],
	});
	expect(populated.some((i) => i.code === "automated-decision-making")).toBe(false);
});

test("validate: no automated-decision-making warning for non-GDPR jurisdictions", () => {
	const issues = validate({ ...baseConfig, jurisdictions: ["us-ca"] });
	expect(issues.some((i) => i.code === "automated-decision-making")).toBe(false);
});

// --- DPO warning ---

test("validate: warns when an EU/UK jurisdiction has no company.dpo", () => {
	const issues = validate({ ...baseConfig, jurisdictions: ["eea"] });
	expect(issues.some((i) => i.code === "company-dpo-undeclared" && i.level === "warning")).toBe(
		true,
	);
});

test("validate: no DPO warning when company.dpo is provided or required:false", () => {
	const provided = validate({
		...baseConfig,
		jurisdictions: ["eea"],
		company: { ...baseConfig.company, dpo: { email: "dpo@acme.com" } },
	});
	expect(provided.some((i) => i.code === "company-dpo-undeclared")).toBe(false);

	const notNeeded = validate({
		...baseConfig,
		jurisdictions: ["eea"],
		company: { ...baseConfig.company, dpo: { required: false } },
	});
	expect(notNeeded.some((i) => i.code === "company-dpo-undeclared")).toBe(false);
});

test("validate: no DPO warning for non-EU/UK jurisdictions", () => {
	const issues = validate({ ...baseConfig, jurisdictions: ["us-ca"] });
	expect(issues.some((i) => i.code === "company-dpo-undeclared")).toBe(false);
});

// --- CCPA phone warning ---

test("validate: warns when a us-ca jurisdiction lacks company.contact.phone", () => {
	const issues = validate({ ...baseConfig, jurisdictions: ["us-ca"] });
	const hit = issues.find((i) => i.code === "company-contact-phone-recommended");
	expect(hit).toBeDefined();
	expect(hit?.level).toBe("warning");
	expect(hit?.message).toContain("CCPA");
});

test("validate: no phone warning when phone is set or jurisdiction is not us-ca", () => {
	const withPhone = validate({
		...baseConfig,
		jurisdictions: ["us-ca"],
		company: {
			...baseConfig.company,
			contact: { email: "privacy@acme.com", phone: "+1-800-555-0100" },
		},
	});
	expect(withPhone.some((i) => i.code === "company-contact-phone-recommended")).toBe(false);

	const nonCcpa = validate({ ...baseConfig, jurisdictions: ["eea"] });
	expect(nonCcpa.some((i) => i.code === "company-contact-phone-recommended")).toBe(false);
});

// --- cookies ---

test("validate: errors when every cookie category is disabled", () => {
	const issues = validate({
		...baseConfig,
		cookies: {
			used: { essential: false as unknown as true },
			context: { essential: { lawfulBasis: "legal_obligation" } },
		},
	});
	expect(issues.some((i) => i.code === "cookies-empty" && i.level === "error")).toBe(true);
});

test("validate: errors when an enabled cookie category lacks a lawful basis", () => {
	const issues = validate({
		...baseConfig,
		cookies: {
			used: { essential: true, analytics: true },
			context: { essential: { lawfulBasis: "legal_obligation" } } as never,
		},
	});
	expect(
		issues.some(
			(i) =>
				i.code === "cookie-lawful-basis-missing" &&
				i.message.includes('cookies.context["analytics"]'),
		),
	).toBe(true);
});

// --- consent mechanism: DERIVED from the cookie posture, never authored ---

const gatedCookies = {
	used: { essential: true, analytics: true },
	context: {
		essential: { lawfulBasis: "legal_obligation" },
		analytics: { lawfulBasis: "consent" },
	},
} as const;

test("validate: essential-only cookies → reworded informational consent-mechanism-undeclared", () => {
	// baseConfig's only cookie is essential/legal_obligation → not gated, so
	// no consent mechanism is derived.
	const m = validate(baseConfig).find((i) => i.code === "consent-mechanism-undeclared");
	expect(m?.level).toBe("warning");
	expect(m?.message).toContain("strictly-necessary");
});

test("validate: a consent-gated category derives a full mechanism — no consent warnings", () => {
	const issues = validate({ ...baseConfig, cookies: { ...gatedCookies } });
	for (const code of [
		"consent-mechanism-undeclared",
		"consent-withdrawal-required",
		"consent-banner-required",
		"consent-preference-panel-required",
	]) {
		expect(issues.some((i) => i.code === code)).toBe(false);
	}
});

test("validate: a hand-written consentMechanism cannot be a lie — the cookie posture wins", () => {
	// Author claims a full mechanism while every cookie is non-consent. The
	// derived value is `undefined`, so the honest "undeclared" warning still
	// fires and the cross-check codes (retained in source as a raw-core net
	// and for the frozen registry⟺validate scan) never fire from validate().
	const issues = validate({
		...baseConfig,
		jurisdictions: ["eea"],
		consentMechanism: { hasBanner: true, hasPreferencePanel: true, canWithdraw: true },
	});
	expect(issues.some((i) => i.code === "consent-mechanism-undeclared")).toBe(true);
	for (const code of [
		"consent-withdrawal-required",
		"consent-banner-required",
		"consent-preference-panel-required",
	]) {
		expect(issues.some((i) => i.code === code)).toBe(false);
	}
});

test("validate: gated cookies under EU/UK derive canWithdraw — no withdrawal warning", () => {
	for (const jx of [["eea"], ["uk"]] as const) {
		const issues = validate({
			...baseConfig,
			jurisdictions: [...jx],
			cookies: { ...gatedCookies },
		});
		expect(issues.some((i) => i.code === "consent-withdrawal-required")).toBe(false);
		expect(issues.some((i) => i.code === "consent-mechanism-undeclared")).toBe(false);
	}
});

// --- emission gating ---

test("validate: errors when the config produces no policy", () => {
	const issues = validate({ ...baseConfig, policies: [] });
	expect(issues.some((i) => i.code === "policy-empty" && i.level === "error")).toBe(true);
});

test("validate: errors when policies includes 'cookie' but cookies is unset", () => {
	const { cookies: _omit, ...noCookies } = baseConfig;
	const issues = validate({ ...noCookies, policies: ["privacy", "cookie"] });
	expect(issues.some((i) => i.code === "policy-cookie-empty" && i.level === "error")).toBe(true);
});
