"use client";

import { isConsentGated, type OpenPolicyConfig } from "@openpolicy/core";
import type { Category, OpenCookiesConfig } from "@openpolicy/core/consent";
import { useState, type ReactNode } from "react";
import { OpenCookiesProvider } from "./consent";
import { OpenPolicyContext } from "./context";

// Local copy of the @openpolicy/sdk `toOpenCookiesConfig` derivation, narrowed
// to the authored `OpenPolicyConfig.consent` shape (policyVersion / locale /
// canWithdraw are ALWAYS derived from the policy, never authored in `consent`).
// Kept here — rather than importing `toOpenCookiesConfig` — so @openpolicy/
// react's only @openpolicy/* runtime dependency stays @openpolicy/core (no
// react → sdk edge). The canonical bridge is @openpolicy/sdk's
// `toOpenCookiesConfig`; provider.test.tsx pins this copy to it, so if either
// drifts the parity test fails. Exported as that parity seam and a legitimate
// escape hatch — equivalent to `toOpenCookiesConfig(policy, policy.consent)`.
export function deriveConsentConfig(policy: OpenPolicyConfig): OpenCookiesConfig {
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
	config: OpenPolicyConfig;
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
 * Exported from `@openpolicy/react/provider` — a deliberate third entry that
 * unions the `./policy` and `./consent` trees. Those two entries stay
 * untouched, so a single-concern consumer importing only `@openpolicy/react/
 * policy` or `/consent` still tree-shakes the other out.
 */
export function PolicyStackProvider({ config, children }: PolicyStackProviderProps) {
	// Derive once per provider instance. Each SSR request mounts its own
	// provider, so the consent store never leaks across requests — same
	// rationale as OpenCookiesProvider's own useState store memoization.
	const [consentConfig] = useState<OpenCookiesConfig>(() => deriveConsentConfig(config));

	return (
		<OpenPolicyContext.Provider value={{ config }}>
			{consentConfig.categories.length > 0 ? (
				<OpenCookiesProvider config={consentConfig}>{children}</OpenCookiesProvider>
			) : (
				children
			)}
		</OpenPolicyContext.Provider>
	);
}
