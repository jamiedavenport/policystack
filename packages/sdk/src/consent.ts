import type { PolicyStackConfig } from "@policystack/core";
import { isConsentGated } from "@policystack/core";
import type { Category, PolicyStackConsentConfig } from "@policystack/core/consent";

export type ToConsentConfigOptions = Omit<PolicyStackConsentConfig, "categories">;

// The canonical home for these options is `PolicyStackConfig.consent` — re-export
// the type here so power users authoring the field import it alongside the
// bridge that consumes it.
export type { PolicyStackConsentOptions } from "@policystack/core/consent";

// Derives a PolicyStackConsentConfig from the policy: categories + `locked` flags come
// from `cookies.used`/`.context`, version/locale/canWithdraw from the policy.
// `options` are the runtime-only knobs that cannot be derived.
//
// This stays the public, pure derivation primitive for non-React frameworks and
// power users — but it is OFF the documented happy path. The single-config flow
// is: author `PolicyStackConfig.consent` and pass the whole config to
// `<PolicyStackProvider>`, which calls `toPolicyStackConsentConfig(config, config.consent)`
// internally. `PolicyStackConsentOptions` (the authored knobs — a `Pick` of
// `PolicyStackConsentConfig`) is a strict subset of `ToConsentConfigOptions`
// (everything bar `categories`, which is always derived), so passing
// `config.consent` here type-checks with no cast.
export function toPolicyStackConsentConfig(
	policy: PolicyStackConfig,
	options?: ToConsentConfigOptions,
): PolicyStackConsentConfig {
	const used: Record<string, boolean> = policy.cookies?.used ?? {};
	const context = policy.cookies?.context ?? {};
	const categories: Category[] = Object.keys(used)
		.filter((key) => used[key])
		.map((key) => {
			const lawfulBasis = context[key]?.lawfulBasis;
			return {
				key,
				label: key.charAt(0).toUpperCase() + key.slice(1),
				// Gating is the explicit, exhaustive bridge table (§4.1) — not a
				// `=== "consent"` string heuristic. `consent` ⇒ gated (not
				// locked); every other basis ⇒ locked; a missing basis stays
				// gated (privacy-safe; validate() hard-errors it separately).
				// The basis itself rides on the Category so the §4.2 posture
				// resolver and audit keep the full signal.
				locked: !isConsentGated(lawfulBasis),
				...(lawfulBasis ? { lawfulBasis } : {}),
			};
		});
	const policyVersion = options?.policyVersion ?? policy.cookieVersion;
	const canWithdraw = options?.canWithdraw ?? policy.consentMechanism?.canWithdraw;
	// The PolicyStack version hash drives an automatic re-prompt on policy
	// change: default `policyVersionChanged` on so a changed `cookieVersion`
	// actually invalidates stored consent. Callers can still override any
	// individual trigger via `options.triggers`.
	const triggers = { policyVersionChanged: true, ...options?.triggers };
	// PS-26: one shared Locale — the policy's canonical Locale flows into the
	// PolicyStack Consent config so policy text and consent UI agree. An explicit
	// options.locale still wins (same override convention as policyVersion).
	const locale = options?.locale ?? policy.locale;
	return {
		...options,
		...(policyVersion ? { policyVersion } : {}),
		...(canWithdraw != null ? { canWithdraw } : {}),
		...(locale ? { locale } : {}),
		triggers,
		categories,
	};
}
