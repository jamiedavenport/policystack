import type { ThirdPartyEntry } from "./analyse";
import type { VendorRegistry } from "./consent/types";

/**
 * One canonical vendor in the merged registry (PS-25, decision 13). Replaces the
 * two legacy sources that were keyed on different dimensions and disagreed on
 * categories:
 *
 *  - OpenPolicy `known-packages.ts` — npm-dependency keyed, carried the
 *    disclosure metadata (`name` / `purpose` / `policyUrl`).
 *  - OpenCookies `vendors.json` — import/global/scriptUrl keyed, carried the
 *    consent `category`.
 *
 * Each vendor now carries every lookup dimension plus both metadata halves.
 * `category` is the OpenCookies value where the two disagreed (vendors.json
 * wins — Sentry/Datadog `analytics`→`essential`, Intercom `functional`→
 * `marketing`); the derived {@link KNOWN_COOKIE_PACKAGES} reflects that.
 */
export type VendorRecord = {
	/** Canonical vendor id (the OpenCookies `vendor` key, e.g. `"posthog"`). */
	vendor: string;
	/** Display name for the privacy-policy recipient list, e.g. `"PostHog"`. */
	name: string;
	/** Why the vendor is in the stack, e.g. `"Product analytics"`. */
	purpose: string;
	/** The vendor's privacy-policy URL. */
	policyUrl: string;
	/** Consent category. OpenCookies value is authoritative on conflict. */
	category: string;
	/**
	 * npm dependency names that imply this vendor. Drives the package.json
	 * detector (`usePackageJson`) and the derived {@link KNOWN_PACKAGES} /
	 * {@link KNOWN_COOKIE_PACKAGES} disclosure maps. Distinct from
	 * {@link imports}: a package may ship under a name you never `import`
	 * directly, and a tracking import (`@types/gtag.js`) may not be a runtime
	 * dependency.
	 */
	packages: string[];
	/**
	 * Import-specifier prefixes for the AST import detector. A specifier matches
	 * when it equals a prefix or starts with `prefix + "/"`. Empty for
	 * disclosure-only vendors (see {@link consent}).
	 */
	imports: string[];
	/** Global identifiers for the AST global detector. */
	globals: string[];
	/**
	 * Script-URL fragments. Carried so the dimension exists in the one
	 * registry; the script-URL detector itself is deferred (PS-25 scope
	 * decision) — the single oxc walk stays import + global only.
	 */
	scriptUrls: string[];
	/**
	 * Whether this vendor participates in the consent ungated scan. `true` for
	 * the tracking vendors that were in OpenCookies `vendors.json`; `false` for
	 * disclosure-only vendors (payments / transactional email) that should
	 * appear in the recipient list but must never raise an ungated finding.
	 * Keeping this explicit preserves the legacy consent behaviour exactly —
	 * widening consent coverage to more analytics SDKs is a separate change.
	 */
	consent: boolean;
};

const AD = "Advertising and conversion tracking";

/**
 * The one canonical registry. Hand-authored merge of the two legacy sources;
 * `registry.test.ts` asserts every legacy `known-packages.ts` /
 * `vendors.json` entry still resolves and that the documented category
 * conflicts resolved the OpenCookies way.
 */
export const REGISTRY: readonly VendorRecord[] = [
	{
		vendor: "google-analytics",
		name: "Google Analytics",
		purpose: "Web analytics",
		policyUrl: "https://policies.google.com/privacy",
		category: "analytics",
		packages: [],
		imports: ["@types/gtag.js", "react-ga4", "react-ga"],
		globals: ["gtag", "ga"],
		scriptUrls: ["googletagmanager.com/gtag/js", "google-analytics.com/analytics.js"],
		consent: true,
	},
	{
		vendor: "google-tag-manager",
		name: "Google Tag Manager",
		purpose: "Tag management",
		policyUrl: "https://policies.google.com/privacy",
		category: "marketing",
		packages: ["react-gtm-module"],
		imports: [],
		globals: [],
		scriptUrls: ["googletagmanager.com/gtm.js"],
		consent: true,
	},
	{
		vendor: "meta-pixel",
		name: "Meta Pixel",
		purpose: AD,
		policyUrl: "https://www.facebook.com/privacy/policy",
		category: "marketing",
		packages: ["react-facebook-pixel"],
		imports: [],
		globals: ["fbq"],
		scriptUrls: ["connect.facebook.net/en_US/fbevents.js"],
		consent: true,
	},
	{
		vendor: "posthog",
		name: "PostHog",
		purpose: "Product analytics",
		policyUrl: "https://posthog.com/privacy",
		category: "analytics",
		packages: ["posthog-js", "posthog-node"],
		imports: ["posthog-js", "posthog-node", "posthog-js/react"],
		globals: ["posthog"],
		scriptUrls: [],
		consent: true,
	},
	{
		vendor: "segment",
		name: "Segment",
		purpose: "Customer data platform",
		policyUrl: "https://www.twilio.com/en-us/legal/privacy",
		category: "analytics",
		packages: ["@segment/analytics-next"],
		imports: ["@segment/analytics-next", "@segment/analytics-node", "analytics"],
		globals: ["analytics"],
		scriptUrls: [],
		consent: true,
	},
	{
		vendor: "mixpanel",
		name: "Mixpanel",
		purpose: "Product analytics",
		policyUrl: "https://mixpanel.com/legal/privacy-policy/",
		category: "analytics",
		packages: ["mixpanel-browser"],
		imports: ["mixpanel-browser", "mixpanel"],
		globals: ["mixpanel"],
		scriptUrls: [],
		consent: true,
	},
	{
		vendor: "hotjar",
		name: "Hotjar",
		purpose: "Session recording",
		policyUrl: "https://www.hotjar.com/legal/policies/privacy/",
		category: "analytics",
		packages: ["@hotjar/browser"],
		imports: ["@hotjar/browser"],
		globals: ["hj"],
		scriptUrls: ["static.hotjar.com"],
		consent: true,
	},
	{
		vendor: "intercom",
		name: "Intercom",
		purpose: "Customer messaging",
		policyUrl: "https://www.intercom.com/legal/privacy",
		// vendors.json wins: was `functional` in known-packages.
		category: "marketing",
		packages: ["intercom-client", "@intercom/messenger-js-sdk"],
		imports: ["@intercom/messenger-js-sdk"],
		globals: ["Intercom"],
		scriptUrls: [],
		consent: true,
	},
	{
		vendor: "linkedin-insight",
		name: "LinkedIn Insight Tag",
		purpose: AD,
		policyUrl: "https://www.linkedin.com/legal/privacy-policy",
		category: "marketing",
		packages: [],
		imports: [],
		globals: ["_linkedin_partner_id", "lintrk"],
		scriptUrls: ["snap.licdn.com/li.lms-analytics"],
		consent: true,
	},
	{
		vendor: "twitter-pixel",
		name: "X (Twitter) Pixel",
		purpose: AD,
		policyUrl: "https://x.com/en/privacy",
		category: "marketing",
		packages: [],
		imports: [],
		globals: ["twq"],
		scriptUrls: ["static.ads-twitter.com/uwt.js"],
		consent: true,
	},
	{
		vendor: "tiktok-pixel",
		name: "TikTok Pixel",
		purpose: AD,
		policyUrl: "https://www.tiktok.com/legal/privacy-policy",
		category: "marketing",
		packages: [],
		imports: [],
		globals: ["ttq"],
		scriptUrls: ["analytics.tiktok.com/i18n/pixel"],
		consent: true,
	},
	{
		vendor: "reddit-pixel",
		name: "Reddit Pixel",
		purpose: AD,
		policyUrl: "https://www.reddit.com/policies/privacy-policy",
		category: "marketing",
		packages: [],
		imports: [],
		globals: ["rdt"],
		scriptUrls: ["www.redditstatic.com/ads/pixel.js"],
		consent: true,
	},
	{
		vendor: "sentry",
		name: "Sentry",
		purpose: "Error tracking",
		policyUrl: "https://sentry.io/privacy/",
		// vendors.json wins: was `analytics` in known-packages.
		category: "essential",
		packages: ["@sentry/browser", "@sentry/node", "@sentry/nextjs", "@sentry/react", "@sentry/vue"],
		imports: [
			"@sentry/browser",
			"@sentry/react",
			"@sentry/nextjs",
			"@sentry/node",
			"@sentry/vue",
			"@sentry/svelte",
			"@sentry/solid",
		],
		globals: [],
		scriptUrls: [],
		consent: true,
	},
	{
		vendor: "datadog",
		name: "Datadog",
		purpose: "Monitoring",
		policyUrl: "https://www.datadoghq.com/legal/privacy/",
		// vendors.json wins: `@datadog/browser-rum` was `analytics` in known-packages.
		category: "essential",
		packages: ["@datadog/browser-rum", "dd-trace"],
		imports: ["@datadog/browser-rum", "@datadog/browser-logs", "dd-trace"],
		globals: [],
		scriptUrls: [],
		consent: true,
	},
	// --- Disclosure-only vendors (known-packages.ts only; never in vendors.json).
	// `consent: false` keeps them out of the ungated scan so a server-side or
	// payment SDK import never raises a false ungated finding.
	{
		vendor: "stripe",
		name: "Stripe",
		purpose: "Payment processing",
		policyUrl: "https://stripe.com/privacy",
		category: "essential",
		packages: ["stripe", "@stripe/stripe-js"],
		imports: [],
		globals: [],
		scriptUrls: [],
		consent: false,
	},
	{
		vendor: "braintree",
		name: "Braintree",
		purpose: "Payment processing",
		policyUrl: "https://www.braintreepayments.com/legal/braintree-privacy-policy",
		category: "essential",
		packages: ["braintree", "@braintree/browser-drop-in"],
		imports: [],
		globals: [],
		scriptUrls: [],
		consent: false,
	},
	{
		vendor: "amplitude",
		name: "Amplitude",
		purpose: "Product analytics",
		policyUrl: "https://amplitude.com/privacy",
		category: "analytics",
		packages: ["@amplitude/analytics-browser", "amplitude-js"],
		imports: [],
		globals: [],
		scriptUrls: [],
		consent: false,
	},
	{
		vendor: "vercel-analytics",
		name: "Vercel Analytics",
		purpose: "Web analytics",
		policyUrl: "https://vercel.com/legal/privacy-policy",
		category: "analytics",
		packages: ["@vercel/analytics"],
		imports: [],
		globals: [],
		scriptUrls: [],
		consent: false,
	},
	{
		vendor: "plausible",
		name: "Plausible",
		purpose: "Web analytics",
		policyUrl: "https://plausible.io/privacy",
		category: "analytics",
		packages: ["plausible-tracker"],
		imports: [],
		globals: [],
		scriptUrls: [],
		consent: false,
	},
	{
		vendor: "logrocket",
		name: "LogRocket",
		purpose: "Session recording",
		policyUrl: "https://logrocket.com/privacy/",
		category: "analytics",
		packages: ["logrocket"],
		imports: [],
		globals: [],
		scriptUrls: [],
		consent: false,
	},
	{
		vendor: "resend",
		name: "Resend",
		purpose: "Transactional email",
		policyUrl: "https://resend.com/legal/privacy-policy",
		category: "essential",
		packages: ["resend"],
		imports: [],
		globals: [],
		scriptUrls: [],
		consent: false,
	},
	{
		vendor: "sendgrid",
		name: "SendGrid",
		purpose: "Transactional email",
		policyUrl: "https://www.twilio.com/en-us/legal/privacy",
		category: "essential",
		packages: ["@sendgrid/mail"],
		imports: [],
		globals: [],
		scriptUrls: [],
		consent: false,
	},
];

const byVendor: ReadonlyMap<string, VendorRecord> = new Map(REGISTRY.map((r) => [r.vendor, r]));

/**
 * npm package name → disclosure metadata. Derived from the one registry; the
 * package.json third-party detector (`thirdParties.usePackageJson`) and the
 * legacy `KNOWN_PACKAGES` consumers read this.
 */
export const KNOWN_PACKAGES: ReadonlyMap<string, ThirdPartyEntry> = new Map(
	REGISTRY.flatMap((r) =>
		r.packages.map(
			(pkg) => [pkg, { name: r.name, purpose: r.purpose, policyUrl: r.policyUrl }] as const,
		),
	),
);

/**
 * npm package name → cookie categories. Derived from the one registry's
 * `category` (OpenCookies-authoritative). Used by `cookies.usePackageJson`.
 */
export const KNOWN_COOKIE_PACKAGES: ReadonlyMap<string, readonly string[]> = new Map(
	REGISTRY.flatMap((r) => r.packages.map((pkg) => [pkg, [r.category]] as const)),
);

/**
 * The consent-scanner registry: only the tracking vendors
 * (`consent: true`), projected onto the unchanged OpenCookies
 * {@link VendorRegistry} shape. Behaviourally identical to the old
 * `vendors.json` so the ungated scan does not regress.
 */
export const CONSENT_REGISTRY: VendorRegistry = REGISTRY.filter((r) => r.consent).map((r) => ({
	vendor: r.vendor,
	category: r.category,
	imports: r.imports,
	globals: r.globals,
	scriptUrls: r.scriptUrls,
}));

/** Resolve an npm dependency name to its canonical vendor (exact match). */
export function vendorForPackage(pkg: string): VendorRecord | undefined {
	for (const r of REGISTRY) if (r.packages.includes(pkg)) return r;
	return undefined;
}

/**
 * Resolve an import specifier to its canonical vendor using the same
 * prefix rule as the legacy consent matcher: a specifier matches when it
 * equals an `imports` prefix or starts with `prefix + "/"`.
 */
export function vendorForImport(specifier: string): VendorRecord | undefined {
	for (const r of REGISTRY) {
		for (const prefix of r.imports) {
			if (specifier === prefix || specifier.startsWith(`${prefix}/`)) return r;
		}
	}
	return undefined;
}

/** Resolve a global identifier to its canonical vendor (exact match). */
export function vendorForGlobal(name: string): VendorRecord | undefined {
	for (const r of REGISTRY) if (r.globals.includes(name)) return r;
	return undefined;
}

/** Look up a canonical vendor by its id. */
export function vendorById(id: string): VendorRecord | undefined {
	return byVendor.get(id);
}
