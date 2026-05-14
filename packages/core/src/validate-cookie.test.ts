import { expect, test } from "vite-plus/test";
import type { CookiePolicyConfig } from "./types";
import { validateCookiePolicy } from "./validate-cookie";

const validConfig: CookiePolicyConfig = {
	effectiveDate: "2026-01-01",
	locale: "en",
	company: {
		name: "Acme",
		legalName: "Acme Inc.",
		address: "123 Main St",
		contact: { email: "privacy@acme.com" },
	},
	cookies: {
		used: {
			essential: true,
			analytics: false,
			functional: false,
			marketing: false,
		},
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
			functional: { lawfulBasis: "consent" },
			marketing: { lawfulBasis: "consent" },
		},
	},
	thirdParties: [],
	jurisdictions: ["ca"],
	consentMechanism: {
		hasBanner: true,
		hasPreferencePanel: true,
		canWithdraw: true,
	},
};

test("valid config produces no errors", () => {
	const issues = validateCookiePolicy(validConfig);
	expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
});

test("missing effectiveDate is an error", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		effectiveDate: "" as unknown as `${number}-${number}-${number}`,
	});
	expect(issues.some((i) => i.message.includes("effectiveDate"))).toBe(true);
});

test("missing company.name is an error", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		company: { ...validConfig.company, name: "" },
	});
	expect(issues.some((i) => i.message.includes("company.name"))).toBe(true);
});

test("missing company.legalName is an error", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		company: { ...validConfig.company, legalName: "" },
	});
	expect(issues.some((i) => i.message.includes("company.legalName"))).toBe(true);
});

test("missing company.address is an error", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		company: { ...validConfig.company, address: "" },
	});
	expect(issues.some((i) => i.message.includes("company.address"))).toBe(true);
});

test("missing company.contact is an error", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		company: { ...validConfig.company, contact: { email: "" } },
	});
	expect(issues.some((i) => i.message.includes("company.contact"))).toBe(true);
});

test("all cookies disabled is an error", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		cookies: {
			used: {
				essential: false as unknown as true,
				analytics: false,
				functional: false,
				marketing: false,
			},
			context: {
				essential: { lawfulBasis: "legal_obligation" },
				analytics: { lawfulBasis: "consent" },
				functional: { lawfulBasis: "consent" },
				marketing: { lawfulBasis: "consent" },
			},
		},
	});
	expect(issues.some((i) => i.level === "error" && i.message.includes("At least one cookie"))).toBe(
		true,
	);
});

test("no consentMechanism is a warning", () => {
	const { consentMechanism: _, ...configWithout } = validConfig;
	const issues = validateCookiePolicy(configWithout as CookiePolicyConfig);
	expect(issues.some((i) => i.level === "warning" && i.message.includes("consentMechanism"))).toBe(
		true,
	);
});

test("eu jurisdiction with canWithdraw false is a warning", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		jurisdictions: ["eu"],
		consentMechanism: {
			hasBanner: true,
			hasPreferencePanel: true,
			canWithdraw: false,
		},
	});
	expect(issues.some((i) => i.level === "warning" && i.message.includes("withdraw"))).toBe(true);
});

test("eu jurisdiction with canWithdraw true has no gdpr warning", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		jurisdictions: ["eu"],
		consentMechanism: {
			hasBanner: true,
			hasPreferencePanel: true,
			canWithdraw: true,
		},
	});
	expect(issues.some((i) => i.level === "warning" && i.message.includes("withdraw"))).toBe(false);
});

test("uk jurisdiction with canWithdraw false is a warning (UK-GDPR parity)", () => {
	const issues = validateCookiePolicy({
		...validConfig,
		jurisdictions: ["uk"],
		consentMechanism: {
			hasBanner: true,
			hasPreferencePanel: true,
			canWithdraw: false,
		},
	});
	expect(issues.some((i) => i.level === "warning" && i.message.includes("withdraw"))).toBe(true);
});
