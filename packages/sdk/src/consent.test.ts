import type { JurisdictionResolver } from "@openpolicy/core/consent";
import { expect, test } from "vite-plus/test";
import type { OpenPolicyConfig } from "./index";
import { toOpenCookiesConfig } from "./consent";

const policy: OpenPolicyConfig = {
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
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

test("lawful basis drives locked, not the category key name", () => {
	const config = toOpenCookiesConfig({
		...policy,
		cookies: {
			used: { essential: true, security: true },
			context: {
				// `essential` named but consent-based ⇒ gated (the old
				// key === "essential" heuristic would wrongly lock this).
				essential: { lawfulBasis: "consent" },
				// non-`essential` name but a non-consent basis ⇒ not gated.
				security: { lawfulBasis: "legal_obligation" },
			},
		},
	});
	expect(config.categories.find((c) => c.key === "essential")?.locked).toBe(false);
	expect(config.categories.find((c) => c.key === "security")?.locked).toBe(true);
});

test("non-consent lawful bases are all treated as not gated", () => {
	const config = toOpenCookiesConfig({
		...policy,
		cookies: {
			used: { essential: true, a: true, b: true, c: true, d: true },
			context: {
				essential: { lawfulBasis: "legal_obligation" },
				a: { lawfulBasis: "contract" },
				b: { lawfulBasis: "legitimate_interests" },
				c: { lawfulBasis: "vital_interests" },
				d: { lawfulBasis: "public_task" },
			},
		},
	});
	expect(config.categories.every((cat) => cat.locked === true)).toBe(true);
});

test("carries lawfulBasis onto each derived category", () => {
	const config = toOpenCookiesConfig(policy);
	expect(config.categories.find((c) => c.key === "essential")?.lawfulBasis).toBe(
		"legal_obligation",
	);
	expect(config.categories.find((c) => c.key === "analytics")?.lawfulBasis).toBe("consent");
});

test("leaves vendor and purpose unset (filled by downstream tickets)", () => {
	const config = toOpenCookiesConfig(policy);
	for (const cat of config.categories) {
		expect(cat.vendor).toBeUndefined();
		expect(cat.purpose).toBeUndefined();
	}
});

test("enabled cookie with no context entry is gated with no lawfulBasis", () => {
	const config = toOpenCookiesConfig({
		...policy,
		cookies: { used: { essential: true, analytics: true }, context: {} },
	});
	const analytics = config.categories.find((c) => c.key === "analytics");
	expect(analytics?.lawfulBasis).toBeUndefined();
	expect(analytics?.locked).toBe(false);
});

test("derives canWithdraw from policy.consentMechanism.canWithdraw", () => {
	const can = toOpenCookiesConfig({
		...policy,
		consentMechanism: { hasBanner: true, hasPreferencePanel: true, canWithdraw: true },
	});
	expect(can.canWithdraw).toBe(true);

	const cannot = toOpenCookiesConfig({
		...policy,
		consentMechanism: { hasBanner: true, hasPreferencePanel: false, canWithdraw: false },
	});
	expect(cannot.canWithdraw).toBe(false);
});

test("canWithdraw is unset when no consentMechanism is declared", () => {
	const config = toOpenCookiesConfig(policy);
	expect(config.canWithdraw).toBeUndefined();
});

test("explicit canWithdraw option overrides policy.consentMechanism", () => {
	const config = toOpenCookiesConfig(
		{
			...policy,
			consentMechanism: { hasBanner: true, hasPreferencePanel: true, canWithdraw: true },
		},
		{ canWithdraw: false },
	);
	expect(config.canWithdraw).toBe(false);
});

test("defaults triggers.policyVersionChanged on for automatic re-prompt", () => {
	const config = toOpenCookiesConfig({ ...policy, cookieVersion: "abc12345" });
	expect(config.triggers?.policyVersionChanged).toBe(true);
});

test("options.triggers merges over the policyVersionChanged default", () => {
	const config = toOpenCookiesConfig(policy, {
		triggers: { policyVersionChanged: false, jurisdictionChanged: true },
	});
	expect(config.triggers?.policyVersionChanged).toBe(false);
	expect(config.triggers?.jurisdictionChanged).toBe(true);
});

test("carries policy.locale into the OpenCookies config (one shared Locale)", () => {
	const config = toOpenCookiesConfig({ ...policy, locale: "fr" });
	expect(config.locale).toBe("fr");
});

test("explicit options.locale overrides policy.locale", () => {
	const config = toOpenCookiesConfig({ ...policy, locale: "fr" }, { locale: "de" });
	expect(config.locale).toBe("de");
});

test("locale is omitted when neither policy nor options provide one", () => {
	const config = toOpenCookiesConfig(policy);
	expect(config.locale).toBeUndefined();
});
