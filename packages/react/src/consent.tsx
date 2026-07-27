"use client";

import type {
	Category,
	ConsentExpr,
	ConsentRecord,
	ConsentRecordSource,
	ConsentStore,
	JurisdictionId,
	RepromptReason,
	Route,
} from "@policystack/core/consent";
import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { useConsentStore } from "./use-consent-store";

// The consent hooks read the single store off the shared PolicyStack context —
// there is no separate consent provider. `useConsentStore` owns that read (and
// the "no store" guard for a policy-only config); it is re-exported below so
// consumers can reach the store for core free functions like `gateScript`.
export { useConsentStore } from "./use-consent-store";

// The React binding for `gateScript` — the supported way to use
// `@policystack/scripts` here, so consumers rarely need the raw store.
export { GatedScript, type GatedScriptProps } from "./gated-script";

// State slice flows through useSyncExternalStore; the actions are the store's
// own closures, passed by reference (stable identity, no per-render wrappers).
// `subscribe`/`getState`/`refreshJurisdiction` are intentionally kept off this
// result — the hook already handles subscription. Callers that genuinely need
// them (to drive a core free function) take the store via `useConsentStore`.
export type UseConsentResult = {
	route: Route;
	categories: Category[];
	decisions: Record<string, boolean>;
	draft: Record<string, boolean> | null;
	jurisdiction: JurisdictionId | null;
	policyVersion: string;
	decidedAt: string | null;
	repromptReason: RepromptReason | null;
} & Pick<
	ConsentStore,
	| "acceptAll"
	| "acceptNecessary"
	| "reject"
	| "toggle"
	| "save"
	| "setRoute"
	| "has"
	| "getConsentRecord"
	| "getPreviousRecord"
>;

export function useConsent(): UseConsentResult {
	const store = useConsentStore();
	const state = useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => store.getState(),
		() => store.getState(),
	);
	return {
		route: state.route,
		categories: state.categories,
		decisions: state.decisions,
		draft: state.draft,
		jurisdiction: state.jurisdiction,
		policyVersion: state.policyVersion,
		decidedAt: state.decidedAt,
		repromptReason: state.repromptReason,
		acceptAll: store.acceptAll,
		acceptNecessary: store.acceptNecessary,
		reject: store.reject,
		toggle: store.toggle,
		save: store.save,
		setRoute: store.setRoute,
		has: store.has,
		getConsentRecord: store.getConsentRecord,
		getPreviousRecord: store.getPreviousRecord,
	};
}

export type { ConsentRecord, ConsentRecordSource, RepromptReason };

export type UseCategoryResult = {
	granted: boolean;
	toggle: () => void;
};

// `granted` is the checkbox view and includes staged draft edits; effective
// consent (`has()` / <ConsentGate>) only moves on save().
function grantedSnapshot(store: ConsentStore, key: string): boolean {
	const state = store.getState();
	return (state.draft ?? state.decisions)[key] === true;
}

export function useCategory(key: string): UseCategoryResult {
	const store = useConsentStore();
	const granted = useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => grantedSnapshot(store, key),
		() => grantedSnapshot(store, key),
	);
	const toggle = useCallback(() => {
		store.toggle(key);
	}, [store, key]);
	return { granted, toggle };
}

export type ConsentGateProps = {
	requires: ConsentExpr;
	fallback?: ReactNode;
	children: ReactNode;
};

export function ConsentGate({ requires, fallback = null, children }: ConsentGateProps) {
	const store = useConsentStore();
	const granted = useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => store.has(requires),
		() => store.has(requires),
	);
	return <>{granted ? children : fallback}</>;
}
