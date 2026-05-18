import type { PolicyStackConfig, PrivacyPolicyConfig, SlotName } from "@policystack/core";
import { render } from "svelte/server";
import { expect, test } from "vite-plus/test";
import CookiePolicy from "./lib/CookiePolicy.svelte";
import PrivacyPolicy from "./lib/PrivacyPolicy.svelte";
import type { PolicyComponents } from "./lib/types";
import { compileDocument } from "./lib/usePolicyDocument.svelte";

const company = {
	name: "Acme",
	legalName: "Acme Inc.",
	address: "123 Main St",
	contact: { email: "privacy@acme.com" },
};

const privacyConfig: PrivacyPolicyConfig = {
	effectiveDate: "2026-01-01",
	locale: "en",
	company,
	data: {
		collected: { account: ["email", "name"] },
		context: {
			account: {
				purpose: "To authenticate users",
				lawfulBasis: "contract",
				retention: "2 years",
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
	userRights: ["access", "erasure"],
	jurisdictions: ["ca"],
};

test("compileDocument returns a Document for a privacy config", () => {
	const doc = compileDocument("privacy", privacyConfig);
	expect(doc).not.toBeNull();
	expect(doc?.type).toBe("document");
	expect(doc?.sections.length).toBeGreaterThan(0);
});

test("compileDocument returns null when config is undefined", () => {
	expect(compileDocument("privacy", undefined)).toBeNull();
});

test("compileDocument expands a PolicyStackConfig and picks the right policy", () => {
	const openConfig: PolicyStackConfig = {
		company,
		effectiveDate: "2026-01-01",
		jurisdictions: ["ca"],
		data: privacyConfig.data,
		cookies: privacyConfig.cookies,
		thirdParties: [],
	};
	const privacyDoc = compileDocument("privacy", openConfig);
	const cookieDoc = compileDocument("cookie", openConfig);
	expect(privacyDoc?.type).toBe("document");
	expect(cookieDoc?.type).toBe("document");
});

test("PrivacyPolicy SSR-renders a data-op-policy wrapper with sections", () => {
	const { body } = render(PrivacyPolicy, { props: { config: privacyConfig } });
	expect(body).toContain('data-op-policy=""');
	expect(body).toContain('data-op-section=""');
	expect(body).toContain("<h2");
});

test("CookiePolicy SSR-renders the cookie policy from a PolicyStackConfig", () => {
	const openConfig: PolicyStackConfig = {
		company,
		effectiveDate: "2026-01-01",
		jurisdictions: ["ca"],
		data: privacyConfig.data,
		cookies: privacyConfig.cookies,
		thirdParties: [],
	};
	const { body } = render(CookiePolicy, { props: { config: openConfig } });
	expect(body).toContain('data-op-policy=""');
});

// PS-15 (§2.4) drift guard: the Svelte override map must expose exactly the
// canonical slot set from `@policystack/core`. If this framework's keys ever
// diverge, `_keysAreCanonical` collapses to `never` and `vp check` fails.
type KeysAreCanonical = [keyof PolicyComponents] extends [SlotName]
	? [SlotName] extends [keyof PolicyComponents]
		? true
		: never
	: never;
const _keysAreCanonical: KeysAreCanonical = true;
void _keysAreCanonical;
