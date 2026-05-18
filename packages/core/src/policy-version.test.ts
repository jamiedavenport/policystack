import { expect, test } from "vite-plus/test";
import { computeCookieVersion, computePrivacyVersion } from "./policy-version";
import type { PolicyStackConfig } from "./types";

const company = {
	name: "Acme Inc.",
	legalName: "Acme Corporation",
	address: "123 Main St, Springfield, USA",
	contact: { email: "privacy@acme.com" },
};

const base: PolicyStackConfig = {
	company,
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
	data: {
		collected: { "Account Information": ["Name", "Email"] },
		context: {
			"Account Information": {
				purpose: "To authenticate users",
				lawfulBasis: "contract",
				retention: "Until deletion",
				provision: {
					basis: "contract-prerequisite",
					consequences: "We cannot operate your account.",
				},
			},
		},
	},
	cookies: {
		used: { essential: true, analytics: false },
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
		},
	},
	thirdParties: [],
};

test("computePrivacyVersion returns an 8-char hex string", () => {
	const hash = computePrivacyVersion(base);
	expect(hash).toMatch(/^[0-9a-f]{8}$/);
});

test("computeCookieVersion returns an 8-char hex string", () => {
	const hash = computeCookieVersion(base);
	expect(hash).toMatch(/^[0-9a-f]{8}$/);
});

test("computePrivacyVersion returns undefined when privacy is excluded via policies", () => {
	expect(computePrivacyVersion({ ...base, policies: ["cookie"] })).toBeUndefined();
});

test("computeCookieVersion returns undefined when cookies are absent", () => {
	const { cookies: _, ...privacyOnly } = base;
	expect(computeCookieVersion(privacyOnly)).toBeUndefined();
});

test("computePrivacyVersion is stable across key reordering", () => {
	const a = computePrivacyVersion(base);
	const b = computePrivacyVersion({
		thirdParties: base.thirdParties,
		jurisdictions: base.jurisdictions,
		cookies: base.cookies,
		data: base.data,
		effectiveDate: base.effectiveDate,
		company: base.company,
	});
	expect(b).toBe(a);
});

test("computePrivacyVersion ignores the privacyVersion field itself", () => {
	const a = computePrivacyVersion(base);
	const b = computePrivacyVersion({ ...base, privacyVersion: "manual-v9" });
	expect(b).toBe(a);
});

test("computeCookieVersion ignores the cookieVersion field itself", () => {
	const a = computeCookieVersion(base);
	const b = computeCookieVersion({ ...base, cookieVersion: "manual-v9" });
	expect(b).toBe(a);
});

test("privacy-only field change shifts privacyVersion but not cookieVersion", () => {
	const before = base;
	const after: PolicyStackConfig = {
		...base,
		automatedDecisionMaking: [
			{ name: "Fraud", logic: "Rules engine", significance: "May decline" },
		],
	};
	expect(computePrivacyVersion(after)).not.toBe(computePrivacyVersion(before));
	expect(computeCookieVersion(after)).toBe(computeCookieVersion(before));
});

test("cookie-only field change shifts cookieVersion but not privacyVersion", () => {
	const after: PolicyStackConfig = {
		...base,
		consentMechanism: { hasBanner: true, hasPreferencePanel: true, canWithdraw: true },
	};
	expect(computeCookieVersion(after)).not.toBe(computeCookieVersion(base));
	expect(computePrivacyVersion(after)).toBe(computePrivacyVersion(base));
});

test("a shared field change (cookies.used) shifts both versions", () => {
	const after: PolicyStackConfig = {
		...base,
		cookies: {
			used: { essential: true, analytics: true },
			context: {
				essential: { lawfulBasis: "legal_obligation" },
				analytics: { lawfulBasis: "consent" },
			},
		},
	};
	expect(computePrivacyVersion(after)).not.toBe(computePrivacyVersion(base));
	expect(computeCookieVersion(after)).not.toBe(computeCookieVersion(base));
});

test("effectiveDate change shifts both versions", () => {
	const after: PolicyStackConfig = { ...base, effectiveDate: "2026-06-01" };
	expect(computePrivacyVersion(after)).not.toBe(computePrivacyVersion(base));
	expect(computeCookieVersion(after)).not.toBe(computeCookieVersion(base));
});

// Permanent guard for the no-churn invariant (policy-version.ts): `consent`
// is runtime-only wiring and MUST be absent from both hash allowlists.
// Swapping a storage adapter / resolver — or going from none to one — must
// produce byte-identical versions, or every visitor gets falsely re-prompted.
test("consent runtime knobs never affect privacyVersion or cookieVersion", () => {
	const withConsent: PolicyStackConfig = {
		...base,
		consent: {
			adapter: { read: () => null, write: () => {}, clear: () => {} },
			jurisdictionResolver: { resolve: () => null },
			initialRoute: "cookie",
			triggers: { policyVersionChanged: true },
		},
	};
	const swappedAdapter: PolicyStackConfig = {
		...base,
		consent: { adapter: { read: () => null, write: () => {}, clear: () => {} } },
	};
	expect(computePrivacyVersion(withConsent)).toBe(computePrivacyVersion(base));
	expect(computeCookieVersion(withConsent)).toBe(computeCookieVersion(base));
	expect(computePrivacyVersion(swappedAdapter)).toBe(computePrivacyVersion(base));
	expect(computeCookieVersion(swappedAdapter)).toBe(computeCookieVersion(base));
});

test("policies override gates the hash", () => {
	const onlyPrivacy: PolicyStackConfig = { ...base, policies: ["privacy"] };
	const onlyCookie: PolicyStackConfig = { ...base, policies: ["cookie"] };
	expect(computeCookieVersion(onlyPrivacy)).toBeUndefined();
	expect(computePrivacyVersion(onlyCookie)).toBeUndefined();
	expect(computePrivacyVersion(onlyPrivacy)).toMatch(/^[0-9a-f]{8}$/);
	expect(computeCookieVersion(onlyCookie)).toMatch(/^[0-9a-f]{8}$/);
});
