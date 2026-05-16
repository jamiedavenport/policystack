import { describe, expect, it } from "vite-plus/test";
import {
	CONSENT_REGISTRY,
	KNOWN_COOKIE_PACKAGES,
	KNOWN_PACKAGES,
	REGISTRY,
	vendorForGlobal,
	vendorForImport,
	vendorForPackage,
} from "./registry";

// Migration contract (PS-25). The two legacy sources were merged into
// `registry.ts`; these tables are the frozen pre-merge expectations. Every
// legacy entry must still resolve, and the only category changes allowed are
// the documented vendors.json-wins conflicts.

const LEGACY_KNOWN_PACKAGES: Record<string, { name: string; purpose: string; policyUrl: string }> =
	{
		stripe: {
			name: "Stripe",
			purpose: "Payment processing",
			policyUrl: "https://stripe.com/privacy",
		},
		"@stripe/stripe-js": {
			name: "Stripe",
			purpose: "Payment processing",
			policyUrl: "https://stripe.com/privacy",
		},
		braintree: {
			name: "Braintree",
			purpose: "Payment processing",
			policyUrl: "https://www.braintreepayments.com/legal/braintree-privacy-policy",
		},
		"@braintree/browser-drop-in": {
			name: "Braintree",
			purpose: "Payment processing",
			policyUrl: "https://www.braintreepayments.com/legal/braintree-privacy-policy",
		},
		"@sentry/browser": {
			name: "Sentry",
			purpose: "Error tracking",
			policyUrl: "https://sentry.io/privacy/",
		},
		"@sentry/node": {
			name: "Sentry",
			purpose: "Error tracking",
			policyUrl: "https://sentry.io/privacy/",
		},
		"@sentry/nextjs": {
			name: "Sentry",
			purpose: "Error tracking",
			policyUrl: "https://sentry.io/privacy/",
		},
		"@sentry/react": {
			name: "Sentry",
			purpose: "Error tracking",
			policyUrl: "https://sentry.io/privacy/",
		},
		"@sentry/vue": {
			name: "Sentry",
			purpose: "Error tracking",
			policyUrl: "https://sentry.io/privacy/",
		},
		"@datadog/browser-rum": {
			name: "Datadog",
			purpose: "Monitoring",
			policyUrl: "https://www.datadoghq.com/legal/privacy/",
		},
		"dd-trace": {
			name: "Datadog",
			purpose: "Monitoring",
			policyUrl: "https://www.datadoghq.com/legal/privacy/",
		},
		"posthog-js": {
			name: "PostHog",
			purpose: "Product analytics",
			policyUrl: "https://posthog.com/privacy",
		},
		"posthog-node": {
			name: "PostHog",
			purpose: "Product analytics",
			policyUrl: "https://posthog.com/privacy",
		},
		"mixpanel-browser": {
			name: "Mixpanel",
			purpose: "Product analytics",
			policyUrl: "https://mixpanel.com/legal/privacy-policy/",
		},
		"@segment/analytics-next": {
			name: "Segment",
			purpose: "Customer data platform",
			policyUrl: "https://www.twilio.com/en-us/legal/privacy",
		},
		"@amplitude/analytics-browser": {
			name: "Amplitude",
			purpose: "Product analytics",
			policyUrl: "https://amplitude.com/privacy",
		},
		"amplitude-js": {
			name: "Amplitude",
			purpose: "Product analytics",
			policyUrl: "https://amplitude.com/privacy",
		},
		"@vercel/analytics": {
			name: "Vercel Analytics",
			purpose: "Web analytics",
			policyUrl: "https://vercel.com/legal/privacy-policy",
		},
		"plausible-tracker": {
			name: "Plausible",
			purpose: "Web analytics",
			policyUrl: "https://plausible.io/privacy",
		},
		logrocket: {
			name: "LogRocket",
			purpose: "Session recording",
			policyUrl: "https://logrocket.com/privacy/",
		},
		"@hotjar/browser": {
			name: "Hotjar",
			purpose: "Session recording",
			policyUrl: "https://www.hotjar.com/legal/policies/privacy/",
		},
		resend: {
			name: "Resend",
			purpose: "Transactional email",
			policyUrl: "https://resend.com/legal/privacy-policy",
		},
		"@sendgrid/mail": {
			name: "SendGrid",
			purpose: "Transactional email",
			policyUrl: "https://www.twilio.com/en-us/legal/privacy",
		},
		"intercom-client": {
			name: "Intercom",
			purpose: "Customer messaging",
			policyUrl: "https://www.intercom.com/legal/privacy",
		},
		"@intercom/messenger-js-sdk": {
			name: "Intercom",
			purpose: "Customer messaging",
			policyUrl: "https://www.intercom.com/legal/privacy",
		},
	};

// Legacy KNOWN_COOKIE_PACKAGES, with the three documented conflicts already
// resolved the vendors.json way.
const EXPECTED_COOKIE_CATEGORY: Record<string, string> = {
	stripe: "essential",
	"@stripe/stripe-js": "essential",
	braintree: "essential",
	"@braintree/browser-drop-in": "essential",
	"posthog-js": "analytics",
	"posthog-node": "analytics",
	"mixpanel-browser": "analytics",
	"@segment/analytics-next": "analytics",
	"@amplitude/analytics-browser": "analytics",
	"@vercel/analytics": "analytics",
	"plausible-tracker": "analytics",
	logrocket: "analytics",
	"@hotjar/browser": "analytics",
	// Conflicts — vendors.json wins:
	"@sentry/browser": "essential", // was analytics
	"@sentry/nextjs": "essential", // was analytics
	"@sentry/react": "essential", // was analytics
	"@sentry/vue": "essential", // was analytics
	"@datadog/browser-rum": "essential", // was analytics
	"intercom-client": "marketing", // was functional
	"@intercom/messenger-js-sdk": "marketing", // was functional
	"react-facebook-pixel": "marketing",
	"react-gtm-module": "marketing",
};

// The 14 legacy vendors.json tracking vendors (vendor → category), each of
// which must still be in CONSENT_REGISTRY.
const LEGACY_CONSENT_VENDORS: Record<string, string> = {
	"google-analytics": "analytics",
	"google-tag-manager": "marketing",
	"meta-pixel": "marketing",
	posthog: "analytics",
	segment: "analytics",
	mixpanel: "analytics",
	hotjar: "analytics",
	intercom: "marketing",
	"linkedin-insight": "marketing",
	"twitter-pixel": "marketing",
	"tiktok-pixel": "marketing",
	"reddit-pixel": "marketing",
	sentry: "essential",
	datadog: "essential",
};

describe("registry — KNOWN_PACKAGES migration", () => {
	it("resolves every legacy npm package to the same disclosure metadata", () => {
		for (const [pkg, entry] of Object.entries(LEGACY_KNOWN_PACKAGES)) {
			expect(KNOWN_PACKAGES.get(pkg), pkg).toEqual(entry);
		}
	});

	it("vendorForPackage resolves legacy packages to the right vendor record", () => {
		expect(vendorForPackage("posthog-js")?.vendor).toBe("posthog");
		expect(vendorForPackage("@stripe/stripe-js")?.name).toBe("Stripe");
		expect(vendorForPackage("not-a-real-pkg")).toBeUndefined();
	});
});

describe("registry — KNOWN_COOKIE_PACKAGES migration (vendors.json wins on conflict)", () => {
	it("maps every legacy package to its (conflict-resolved) category", () => {
		for (const [pkg, category] of Object.entries(EXPECTED_COOKIE_CATEGORY)) {
			expect(KNOWN_COOKIE_PACKAGES.get(pkg), pkg).toEqual([category]);
		}
	});

	it("resolves the documented category conflicts the OpenCookies way", () => {
		expect(KNOWN_COOKIE_PACKAGES.get("@sentry/browser")).toEqual(["essential"]);
		expect(KNOWN_COOKIE_PACKAGES.get("@datadog/browser-rum")).toEqual(["essential"]);
		expect(KNOWN_COOKIE_PACKAGES.get("@intercom/messenger-js-sdk")).toEqual(["marketing"]);
	});
});

describe("registry — CONSENT_REGISTRY migration", () => {
	it("keeps every legacy vendors.json tracking vendor with the same category", () => {
		for (const [vendor, category] of Object.entries(LEGACY_CONSENT_VENDORS)) {
			const entry = CONSENT_REGISTRY.find((v) => v.vendor === vendor);
			expect(entry, vendor).toBeDefined();
			expect(entry?.category, vendor).toBe(category);
		}
	});

	it("preserves vendors.json order (first-match detection is order-sensitive)", () => {
		expect(CONSENT_REGISTRY.map((v) => v.vendor)).toEqual(Object.keys(LEGACY_CONSENT_VENDORS));
	});

	it("excludes disclosure-only vendors from the consent scan", () => {
		const consentVendors = new Set(CONSENT_REGISTRY.map((v) => v.vendor));
		for (const v of ["stripe", "braintree", "resend", "sendgrid", "amplitude"]) {
			expect(consentVendors.has(v), v).toBe(false);
		}
		// …but they remain in the disclosure registry.
		expect(KNOWN_PACKAGES.get("stripe")?.name).toBe("Stripe");
	});

	it("resolves legacy vendors.json import + global lookups", () => {
		expect(vendorForImport("posthog-js")?.vendor).toBe("posthog");
		expect(vendorForImport("posthog-js/react")?.vendor).toBe("posthog");
		expect(vendorForImport("@sentry/browser")?.vendor).toBe("sentry");
		expect(vendorForImport("@sentry/svelte")?.vendor).toBe("sentry");
		expect(vendorForGlobal("fbq")?.vendor).toBe("meta-pixel");
		expect(vendorForGlobal("gtag")?.vendor).toBe("google-analytics");
		expect(vendorForImport("nope")).toBeUndefined();
	});
});

describe("registry — internal consistency", () => {
	it("has unique vendor ids", () => {
		const ids = REGISTRY.map((r) => r.vendor);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("every record carries non-empty disclosure metadata", () => {
		for (const r of REGISTRY) {
			expect(r.name.length, r.vendor).toBeGreaterThan(0);
			expect(r.purpose.length, r.vendor).toBeGreaterThan(0);
			expect(r.policyUrl.startsWith("https://"), r.vendor).toBe(true);
			expect(r.category.length, r.vendor).toBeGreaterThan(0);
		}
	});
});
