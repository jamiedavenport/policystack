import { expect, test } from "vite-plus/test";
import type { PrivacyPolicyConfig } from "./types";
import { validatePrivacyPolicy } from "./validate";

const baseConfig: PrivacyPolicyConfig = {
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
		used: { essential: true },
		context: { essential: { lawfulBasis: "legal_obligation" } },
	},
	thirdParties: [],
	userRights: [],
	jurisdictions: ["ca"],
};

test("validatePrivacyPolicy: no issues for a well-formed config", () => {
	expect(validatePrivacyPolicy(baseConfig)).toEqual([]);
});

test("validatePrivacyPolicy: errors when data.collected is empty", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		data: {
			collected: {},
			context: {},
		},
	});
	expect(issues.some((i) => i.message === "data.collected must have at least one entry")).toBe(
		true,
	);
});

test("validatePrivacyPolicy: errors when a collected category has no context entry", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		data: {
			collected: {
				"Account Information": ["Name"],
				"Session Data": ["IP"],
			},
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
	});
	expect(
		issues.some(
			(i) => i.level === "error" && i.message.includes('data.context["Session Data"] is missing'),
		),
	).toBe(true);
});

test("validatePrivacyPolicy: errors when a purpose is an empty string", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "   ",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot create or operate your account.",
					},
				},
			},
		},
	});
	expect(
		issues.some(
			(i) =>
				i.level === "error" &&
				i.message.includes(
					'data.context["Account Information"].purpose must be a non-empty string',
				),
		),
	).toBe(true);
});

test("validatePrivacyPolicy: errors when a context key has no matching collected category", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		data: {
			collected: { "Account Information": ["Name"] },
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
				"Orphan Category": {
					purpose: "Not attached to anything",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: {
						basis: "voluntary",
						consequences: "None",
					},
				},
			},
		},
	});
	expect(
		issues.some(
			(i) =>
				i.level === "error" &&
				i.message.includes('data.context["Orphan Category"] has no matching entry'),
		),
	).toBe(true);
});

test("validatePrivacyPolicy: emits lawful-basis-incomplete when EU jurisdiction has missing basis", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["eu"],
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: undefined as never,
					retention: "Until deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot create or operate your account.",
					},
				},
			},
		},
	});
	expect(issues.some((i) => i.code === "lawful-basis-incomplete" && i.level === "error")).toBe(
		true,
	);
});

test("validatePrivacyPolicy: emits lawful-basis-incomplete when UK jurisdiction has missing basis", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["uk"],
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: undefined as never,
					retention: "Until deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot create or operate your account.",
					},
				},
			},
		},
	});
	expect(issues.some((i) => i.code === "lawful-basis-incomplete" && i.level === "error")).toBe(
		true,
	);
});

test("validatePrivacyPolicy: emits lawful-basis-incomplete when a category has empty basis", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["eu"],
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "" as never,
					retention: "Until deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot create or operate your account.",
					},
				},
			},
		},
	});
	const hit = issues.find(
		(i) => i.code === "lawful-basis-incomplete" && i.message.includes("Account Information"),
	);
	expect(hit).toBeDefined();
});

test("validatePrivacyPolicy: does NOT emit lawful-basis-incomplete for non-GDPR jurisdictions", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["us-ca"],
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: undefined as never,
					retention: "Until deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot create or operate your account.",
					},
				},
			},
		},
	});
	expect(issues.some((i) => i.code === "lawful-basis-incomplete")).toBe(false);
});

test("validatePrivacyPolicy: well-formed lawfulBasis under GDPR has no lawful-basis errors", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["eu"],
		data: {
			collected: { "Account Information": ["Name"], "Marketing Data": ["Mailing list"] },
			context: {
				"Account Information": {
					purpose: "Providing the service",
					lawfulBasis: "contract",
					retention: "Until deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot create or operate your account.",
					},
				},
				"Marketing Data": {
					purpose: "Marketing communications",
					lawfulBasis: "consent",
					retention: "Until withdrawal",
					provision: {
						basis: "voluntary",
						consequences: "None — your service is unaffected.",
					},
				},
			},
		},
	});
	expect(issues.some((i) => i.code === "lawful-basis-incomplete")).toBe(false);
});

test("validatePrivacyPolicy: emits retention-incomplete when a category lacks retention", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		data: {
			collected: { "Account Information": ["Name"] },
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: undefined as never,
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot create or operate your account.",
					},
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

test("validatePrivacyPolicy: warns automated-decision-making when EU jurisdiction omits the field", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["eu"],
	});
	const hit = issues.find((i) => i.code === "automated-decision-making");
	expect(hit).toBeDefined();
	expect(hit?.level).toBe("warning");
});

test("validatePrivacyPolicy: warns automated-decision-making when UK jurisdiction omits the field", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["uk"],
	});
	expect(issues.some((i) => i.code === "automated-decision-making" && i.level === "warning")).toBe(
		true,
	);
});

test("validatePrivacyPolicy: does NOT warn automated-decision-making when explicitly empty under EU", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["eu"],
		automatedDecisionMaking: [],
	});
	expect(issues.some((i) => i.code === "automated-decision-making")).toBe(false);
});

test("validatePrivacyPolicy: does NOT warn automated-decision-making when populated under EU", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["eu"],
		automatedDecisionMaking: [
			{ name: "Fraud scoring", logic: "Rules engine", significance: "May decline" },
		],
	});
	expect(issues.some((i) => i.code === "automated-decision-making")).toBe(false);
});

test("validatePrivacyPolicy: does NOT warn automated-decision-making for non-GDPR jurisdictions", () => {
	const issues = validatePrivacyPolicy({
		...baseConfig,
		jurisdictions: ["us-ca"],
	});
	expect(issues.some((i) => i.code === "automated-decision-making")).toBe(false);
});
