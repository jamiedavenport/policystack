import { computeCookieVersion, computePrivacyVersion } from "./policy-version";
import type { CompanyConfig, ConsentMechanism, PolicyStackConfig } from "./types";
import { isConsentGated } from "./types";

// Derive the consent mechanism from the only deterministic, config-visible
// signal: whether any enabled cookie category is consent-gated (§4.1). The
// three fields collapse to one — a banner is needed to collect affirmative
// consent, withdrawal must be as easy as giving it (GDPR Art. 7(3)), and the
// panel is where withdrawal happens. Authors no longer write these, so they
// can no longer contradict the wired runtime. `undefined` (no cookies, or
// nothing gated) makes buildConsent() emit no consent section — matching the
// pre-derivation "omit the field" behaviour for strictly-necessary cookies.
export function deriveConsentMechanism(config: PolicyStackConfig): ConsentMechanism | undefined {
	const used = config.cookies?.used;
	if (!used) return undefined;
	const anyGated = Object.entries(used)
		.filter(([, enabled]) => enabled)
		.some(([key]) => isConsentGated(config.cookies?.context?.[key]?.lawfulBasis));
	return anyGated ? { hasBanner: true, hasPreferencePanel: true, canWithdraw: true } : undefined;
}

// Normalize `company` into the shape downstream consumers (validate(), the
// policy renderers) require: `name`/`contact.email` are always strings (an
// omitted/empty value becomes "" so validate()'s `company-name-required` /
// `company-contact-required` checks fire), `url` stays `string | undefined`.
// No host package.json is read — normalize() is a pure, browser-safe seam
// (it runs in the client bundle via defineConfig()).
export function seedCompany(company: CompanyConfig): CompanyConfig {
	return {
		...company,
		name: company.name || "",
		url: company.url ?? undefined,
		contact: {
			...company.contact,
			email: company.contact?.email || "",
		},
	};
}

// The single normalization seam, applied at the defineConfig (sdk) boundary so
// every downstream consumer — the §4.1 bridge, buildConsent(), the policy
// renderers — observes one internally-consistent config. It (1) normalizes
// `company` into its type-safe shape, (2) derives `consentMechanism` from the
// cookie posture, then (3) fills `privacyVersion`/`cookieVersion` with stable content
// hashes unless set explicitly. Versions are computed last, after
// `consentMechanism` is derived, because the cookie hash slice covers it.
// Idempotent: the hash slices exclude the version fields, so
// normalize∘normalize == normalize.
export function normalizePolicyStackConfig(config: PolicyStackConfig): PolicyStackConfig {
	const seeded: PolicyStackConfig = {
		...config,
		company: seedCompany(config.company),
		consentMechanism: deriveConsentMechanism(config),
	};
	return {
		...seeded,
		privacyVersion: seeded.privacyVersion ?? computePrivacyVersion(seeded),
		cookieVersion: seeded.cookieVersion ?? computeCookieVersion(seeded),
	};
}
