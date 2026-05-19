"use client";

import type { PolicyStackConfig } from "@policystack/core";
import {
	toPolicyStackConsentConfig,
	type PolicyStackConsentConfig,
} from "@policystack/core/consent";
import { useState, type ReactNode } from "react";
import { PolicyStackConsentProvider } from "./consent";
import { PolicyStackContext } from "./context";

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
	const [consentConfig] = useState<PolicyStackConsentConfig>(() =>
		toPolicyStackConsentConfig(config, config.consent),
	);

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
