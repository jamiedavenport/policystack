import { expect, test } from "vite-plus/test";
import {
	compileCookiePolicy,
	compilePrivacyPolicy,
	isPolicyStackConfig,
	shouldEmit,
} from "./index";
import type { PolicyStackConfig } from "./types";

const company = {
	name: "Acme Inc.",
	legalName: "Acme Corporation",
	address: "123 Main St, Springfield, USA",
	contact: { email: "privacy@acme.com" },
};

const fullConfig: PolicyStackConfig = {
	company,
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

test("isPolicyStackConfig returns true for flat config", () => {
	expect(isPolicyStackConfig(fullConfig)).toBe(true);
});

test("isPolicyStackConfig returns false for an object carrying a type discriminator", () => {
	expect(isPolicyStackConfig({ type: "privacy", company, effectiveDate: "2026-01-01" })).toBe(
		false,
	);
});

test("isPolicyStackConfig returns false for null/non-object", () => {
	expect(isPolicyStackConfig(null)).toBe(false);
	expect(isPolicyStackConfig("string")).toBe(false);
	expect(isPolicyStackConfig(42)).toBe(false);
});

test("isPolicyStackConfig returns false for object without effectiveDate", () => {
	expect(isPolicyStackConfig({ company })).toBe(false);
});

test("shouldEmit auto-detects privacy and cookie when both field sets are present", () => {
	expect(shouldEmit("privacy", fullConfig)).toBe(true);
	expect(shouldEmit("cookie", fullConfig)).toBe(true);
});

test("shouldEmit auto-detects privacy-only when cookies omitted", () => {
	const { cookies: _, ...privacyOnly } = fullConfig;
	expect(shouldEmit("privacy", privacyOnly)).toBe(true);
	expect(shouldEmit("cookie", privacyOnly)).toBe(false);
});

test("shouldEmit honours an explicit policies override", () => {
	const config: PolicyStackConfig = { ...fullConfig, policies: ["privacy"] };
	expect(shouldEmit("privacy", config)).toBe(true);
	expect(shouldEmit("cookie", config)).toBe(false);
});

test("shouldEmit emits neither when policies is an empty array", () => {
	const config: PolicyStackConfig = { ...fullConfig, policies: [] };
	expect(shouldEmit("privacy", config)).toBe(false);
	expect(shouldEmit("cookie", config)).toBe(false);
});

test("compilePrivacyPolicy returns a privacy Document when privacy should emit", () => {
	const doc = compilePrivacyPolicy(fullConfig);
	expect(doc?.type).toBe("document");
	expect(doc?.policyType).toBe("privacy");
	expect(doc?.sections.length).toBeGreaterThan(0);
});

test("compilePrivacyPolicy returns null when policies excludes privacy", () => {
	expect(compilePrivacyPolicy({ ...fullConfig, policies: ["cookie"] })).toBeNull();
});

test("compileCookiePolicy returns a cookie Document when cookies are present", () => {
	const doc = compileCookiePolicy(fullConfig);
	expect(doc?.type).toBe("document");
	expect(doc?.policyType).toBe("cookie");
	expect(doc?.sections.length).toBeGreaterThan(0);
});

test("compileCookiePolicy returns null when only privacy fields are present", () => {
	const { cookies: _, ...privacyOnly } = fullConfig;
	expect(compileCookiePolicy(privacyOnly)).toBeNull();
});

test("compilePrivacyPolicy intro renders version when privacyVersion is set", () => {
	const doc = compilePrivacyPolicy({ ...fullConfig, privacyVersion: "priv1234" });
	const intro = doc?.sections.find((s) => s.id === "introduction");
	expect(JSON.stringify(intro)).toContain("Version: priv1234");
});

test("compilePrivacyPolicy intro omits version when privacyVersion is unset", () => {
	const doc = compilePrivacyPolicy(fullConfig);
	const intro = doc?.sections.find((s) => s.id === "introduction");
	expect(JSON.stringify(intro)).not.toContain("Version:");
});

test("compileCookiePolicy intro renders version when cookieVersion is set", () => {
	const doc = compileCookiePolicy({ ...fullConfig, cookieVersion: "cook12345" });
	const intro = doc?.sections.find((s) => s.id === "cookie-introduction");
	expect(JSON.stringify(intro)).toContain("Version: cook12345");
});

test("compileCookiePolicy intro omits version when cookieVersion is unset", () => {
	const doc = compileCookiePolicy(fullConfig);
	const intro = doc?.sections.find((s) => s.id === "cookie-introduction");
	expect(JSON.stringify(intro)).not.toContain("Version:");
});

test("company.url renders the Website label in both contact sections (en)", () => {
	const withUrl: PolicyStackConfig = {
		...fullConfig,
		company: { ...company, url: "https://acme.example" },
	};
	for (const doc of [compilePrivacyPolicy(withUrl), compileCookiePolicy(withUrl)]) {
		const json = JSON.stringify(doc);
		expect(json).toContain("Website:");
		expect(json).toContain("https://acme.example");
	}
});

test("company.url is omitted from the contact section when unset", () => {
	for (const doc of [compilePrivacyPolicy(fullConfig), compileCookiePolicy(fullConfig)]) {
		expect(JSON.stringify(doc)).not.toContain("Website:");
	}
});
