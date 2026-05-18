"use client";

import { isConsentGated, type PolicyStackConfig } from "@policystack/core";
import type { Category, PolicyStackConsentConfig } from "@policystack/core/consent";
import { useState, type ReactNode } from "react";
import { PolicyStackConsentProvider } from "./consent";
import { PolicyStackContext } from "./context";

// Local copy of the @policystack/sdk `toPolicyStackConsentConfig` derivation, narrowed
// to the authored `PolicyStackConfig.consent` shape (policyVersion / locale /
// canWithdraw are ALWAYS derived from the policy, never authored in `consent`).
// Kept here — rather than importing `toPolicyStackConsentConfig` — so @policystack/
// react's only @policystack/* runtime dependency stays @policystack/core (no
// react → sdk edge). The canonical bridge is @policystack/sdk's
// `toPolicyStackConsentConfig`; provider.test.tsx pins this copy to it, so if either
// drifts the parity test fails. Exported as that parity seam and a legitimate
// escape hatch — equivalent to `toPolicyStackConsentConfig(policy, policy.consent)`.
export function deriveConsentConfig(policy: PolicyStackConfig): PolicyStackConsentConfig {
	const used: Record<string, boolean> = policy.cookies?.used ?? {};
	const context = policy.cookies?.context ?? {};
	const categories: Category[] = Object.keys(used)
		.filter((key) => used[key])
		.map((key) => {
			const lawfulBasis = context[key]?.lawfulBasis;
			return {
				key,
				label: key.charAt(0).toUpperCase() + key.slice(1),
				locked: !isConsentGated(lawfulBasis),
				...(lawfulBasis ? { lawfulBasis } : {}),
			};
		});
	const consent = policy.consent;
	// Default the policy-change re-prompt on; authored triggers merge over it.
	const triggers = { policyVersionChanged: true, ...consent?.triggers };
	return {
		...consent,
		...(policy.cookieVersion ? { policyVersion: policy.cookieVersion } : {}),
		...(policy.consentMechanism?.canWithdraw != null
			? { canWithdraw: policy.consentMechanism.canWithdraw }
			: {}),
		...(policy.locale ? { locale: policy.locale } : {}),
		triggers,
		categories,
	};
}

export type PolicyStackProviderProps = {
	config: PolicyStackConfig;
	children?: ReactNode;
};

/**
 * The single provider for the single config. Supplies the policy context
 * (`<PrivacyPolicy>` / `<CookiePolicy>`) AND, when the config declares cookie
 * categories, the consent store (`useConsent` / `useCategory` / `ConsentGate`).
 *
 * - Both: pass a config with `data` + `cookies` (+ optional `consent` knobs).
 * - Policy-only: omit `cookies` — no consent store is created; `useConsent`
 *   correctly throws if used.
 * - Consent-only: a minimal `data` with `cookies` still works; `<PrivacyPolicy>`
 *   simply renders nothing when there is no privacy content.
 *
 * Exported from `@policystack/react/provider` — a deliberate third entry that
 * unions the `./policy` and `./consent` trees. Those two entries stay
 * untouched, so a single-concern consumer importing only `@policystack/react/
 * policy` or `/consent` still tree-shakes the other out.
 */
export function PolicyStackProvider({ config, children }: PolicyStackProviderProps) {
	// Derive once per provider instance. Each SSR request mounts its own
	// provider, so the consent store never leaks across requests — same
	// rationale as PolicyStackConsentProvider's own useState store memoization.
	const [consentConfig] = useState<PolicyStackConsentConfig>(() => deriveConsentConfig(config));

	return (
		<PolicyStackContext.Provider value={{ config }}>
			{consentConfig.categories.length > 0 ? (
				<PolicyStackConsentProvider config={consentConfig}>{children}</PolicyStackConsentProvider>
			) : (
				children
			)}
		</PolicyStackContext.Provider>
	);
}
