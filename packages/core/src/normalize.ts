import { type HostPackageMeta, readHostPackageMeta } from "./host-package";
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

// Seed company.{name,url,contact.email} from the host package.json as
// overridable defaults. An explicit config value always wins; package.json
// only fills a gap (empty string counts as a gap so the CLI stub's "" reach
// the seed). legalName/address are NEVER seeded — a package.json cannot supply
// a registered legal entity name or address.
export function seedCompany(
	company: CompanyConfig,
	meta: HostPackageMeta = readHostPackageMeta(),
): CompanyConfig {
	return {
		...company,
		name: company.name || meta.name || "",
		url: company.url ?? meta.url,
		contact: {
			...company.contact,
			email: company.contact?.email || meta.email || "",
		},
	};
}

// The single normalization seam. Applied at the boundary of BOTH defineConfig
// (sdk) and validate()/buildCookieInput (core) so every consumer — the §4.1
// bridge, buildConsent(), the React parity copy, validate's required-field
// checks — observes one internally-consistent config regardless of entry path.
// Idempotent: normalize∘normalize == normalize.
export function normalizePolicyStackConfig(config: PolicyStackConfig): PolicyStackConfig {
	return {
		...config,
		company: seedCompany(config.company),
		consentMechanism: deriveConsentMechanism(config),
	};
}
