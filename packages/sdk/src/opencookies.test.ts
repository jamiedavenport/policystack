import type { JurisdictionResolver } from "@opencookies/core";
import { expect, test } from "vite-plus/test";
import type { OpenPolicyConfig } from "./index";
import { toOpenCookiesConfig } from "./opencookies";

const policy: OpenPolicyConfig = {
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eu"],
	data: { collected: {}, context: {} },
	cookies: {
		used: { essential: true, analytics: true, marketing: false },
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
			marketing: { lawfulBasis: "consent" },
		},
	},
};

test("derives categories from cookies.used, dropping disabled entries", () => {
	const config = toOpenCookiesConfig(policy);
	expect(config.categories.map((c) => c.key)).toEqual(["essential", "analytics"]);
});

test("locks the essential category", () => {
	const config = toOpenCookiesConfig(policy);
	const essential = config.categories.find((c) => c.key === "essential");
	const analytics = config.categories.find((c) => c.key === "analytics");
	expect(essential?.locked).toBe(true);
	expect(analytics?.locked).toBe(false);
});

test("capitalizes the category label", () => {
	const config = toOpenCookiesConfig(policy);
	expect(config.categories.find((c) => c.key === "analytics")?.label).toBe("Analytics");
});

test("returns no categories when policy has no cookies block", () => {
	const config = toOpenCookiesConfig({ ...policy, cookies: undefined });
	expect(config.categories).toEqual([]);
});

test("passes through overrides without mutating categories", () => {
	const resolver: JurisdictionResolver = { resolve: () => "EEA" };
	const config = toOpenCookiesConfig(policy, {
		policyVersion: "v3",
		jurisdictionResolver: resolver,
	});
	expect(config.policyVersion).toBe("v3");
	expect(config.jurisdictionResolver).toBe(resolver);
	expect(config.categories.map((c) => c.key)).toEqual(["essential", "analytics"]);
});

test("override cannot replace categories", () => {
	const config = toOpenCookiesConfig(policy, {
		// @ts-expect-error — categories are derived, not overridable
		categories: [],
	});
	expect(config.categories.map((c) => c.key)).toEqual(["essential", "analytics"]);
});

test("defaults policyVersion from policy.cookieVersion when no option is provided", () => {
	const config = toOpenCookiesConfig({ ...policy, cookieVersion: "abc12345" });
	expect(config.policyVersion).toBe("abc12345");
});

test("explicit policyVersion option overrides policy.cookieVersion", () => {
	const config = toOpenCookiesConfig(
		{ ...policy, cookieVersion: "abc12345" },
		{ policyVersion: "manual-v9" },
	);
	expect(config.policyVersion).toBe("manual-v9");
});

test("policy.privacyVersion is ignored by the bridge", () => {
	const config = toOpenCookiesConfig({ ...policy, privacyVersion: "priv12345" });
	expect(config.policyVersion).toBeUndefined();
});
