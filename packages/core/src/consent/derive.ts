import { isConsentGated } from "../types";
import type { PolicyStackConfig } from "../types";
import type { Category, PolicyStackConsentConfig } from "./types";

// Everything in PolicyStackConsentConfig bar `categories` — the runtime-only
// knobs that cannot be derived from the policy. Internal to core: the only way
// to author these is `PolicyStackConfig.consent` (a strict subset), and the
// only entry point is `createConsentStore(policyConfig)`.
type DeriveOptions = Omit<PolicyStackConsentConfig, "categories">;

// Derives a PolicyStackConsentConfig from the policy: categories + `locked`
// flags come from `cookies.used`/`.context`, version/locale/canWithdraw from
// the policy. `options` are the runtime-only knobs that cannot be derived.
//
// This is the single canonical derivation. It is NOT a public export — the one
// public path is `createConsentStore(policyConfig)`, which calls this internally
// so the framework providers (`<PolicyStack>`) and any direct caller all share
// one copy of the logic with no fork.
export function deriveConsentConfig(
	policy: PolicyStackConfig,
	options?: DeriveOptions,
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
	// consent config so policy text and consent UI agree. An explicit
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
