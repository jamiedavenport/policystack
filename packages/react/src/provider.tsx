"use client";

import type { PolicyStackConfig } from "@policystack/core";
import { createConsentStore } from "@policystack/core/consent";
import { useState, type ReactNode } from "react";
import { PolicyStackContext, type PolicyStackContextValue } from "./context";

export type PolicyStackProps = {
	config: PolicyStackConfig;
	children?: ReactNode;
};

/**
 * The single PolicyStack provider. Pass the one `PolicyStackConfig` and it
 * supplies both halves of the context from it:
 *
 * - The policy components — `<PrivacyPolicy>` / `<CookiePolicy>` from
 *   `@policystack/react/policy` — read `config`.
 * - The consent hooks — `useConsent` / `useCategory` / `ConsentGate` from
 *   `@policystack/react/consent` — read the consent `store`.
 *
 * The cookies → consent-categories derivation happens inside
 * `createConsentStore` (`@policystack/core/consent`); there is no separate
 * conversion step. A policy-only config (no cookie categories) creates no
 * store, so the consent hooks correctly throw if used.
 *
 * Exported from `@policystack/react/provider`. `./policy` and `./consent` only
 * ever read this context, so a single-concern consumer importing just one of
 * them still tree-shakes the other (and `createConsentStore`) out.
 */
export function PolicyStack({ config, children }: PolicyStackProps) {
	// Derive once per provider instance. Each SSR request mounts its own
	// provider, so the consent store never leaks across requests.
	const [value] = useState<PolicyStackContextValue>(() => {
		const store = createConsentStore(config);
		// `categories` is the canonical derivation done inside the store. An
		// empty set means a policy-only config — expose no store so the consent
		// hooks throw their guard instead of silently no-op-ing.
		return {
			config,
			store: store.getState().categories.length > 0 ? store : null,
		};
	});

	return <PolicyStackContext.Provider value={value}>{children}</PolicyStackContext.Provider>;
}
