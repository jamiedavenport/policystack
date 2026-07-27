"use client";

import type { ConsentStore } from "@policystack/core/consent";
import { useContext } from "react";
import { PolicyStackContext } from "./context";

/**
 * The consent store from the enclosing `<PolicyStack>`.
 *
 * `useConsent` / `useCategory` / `<ConsentGate>` cover the reactive cases and
 * should stay the default. Reach for the store itself only to hand it to a core
 * free function that takes one, such as `gateScript` from
 * `@policystack/core/consent`. For script gating specifically prefer
 * `<GatedScript>`, which owns the mount/unmount lifecycle for you.
 *
 * The store is deliberately not reactive: it is the same object for the life of
 * the provider, so reading it never re-renders the consumer. Subscribe through
 * the hooks above (or `store.subscribe`) to react to state.
 *
 * Throws when there is no store — either the call site is outside
 * `<PolicyStack>`, or the config is policy-only (no cookie categories) and so
 * declares no consent to manage. Both are configuration errors rather than
 * runtime states, which is why this never returns `null`.
 */
export function useConsentStore(): ConsentStore {
	const { store } = useContext(PolicyStackContext);
	if (!store) {
		throw new Error(
			"PolicyStack consent (useConsent / useCategory / useConsentStore / ConsentGate / GatedScript) must be used inside <PolicyStack>, and the config must declare cookie categories",
		);
	}
	return store;
}
