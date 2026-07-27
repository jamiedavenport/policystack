"use client";

import type {
	Category,
	ConsentExpr,
	ConsentRecord,
	ConsentRecordSource,
	ConsentState,
	ConsentStore,
	JurisdictionId,
	RepromptReason,
	Route,
} from "@policystack/core/consent";
import { useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import { PolicyStackContext } from "./context";

// The consent hooks read the single store off the shared PolicyStack context —
// there is no separate consent provider. The store is `null` when the
// `<PolicyStack>` config declared no cookie categories (a policy-only config),
// in which case using a consent hook is a configuration error.
function useStore(): ConsentStore {
	const { store } = useContext(PolicyStackContext);
	if (!store) {
		throw new Error(
			"useConsent / useCategory / ConsentGate must be used inside <PolicyStack>, and the config must declare cookie categories",
		);
	}
	return store;
}

// Every hook below passes `store.server.*` as `getServerSnapshot` — live state
// there would mismatch on hydration for any returning visitor. React re-reads
// the live snapshot once hydration commits.

// State slice flows through useSyncExternalStore; the actions are the store's
// own closures, passed by reference (stable identity, no per-render wrappers).
// `subscribe`/`getState`/`refreshJurisdiction` are intentionally not exposed.
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
	const store = useStore();
	const state = useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => store.getState(),
		() => store.server.getState(),
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
function grantedSnapshot(state: ConsentState, key: string): boolean {
	return (state.draft ?? state.decisions)[key] === true;
}

export function useCategory(key: string): UseCategoryResult {
	const store = useStore();
	const granted = useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => grantedSnapshot(store.getState(), key),
		() => grantedSnapshot(store.server.getState(), key),
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
	const store = useStore();
	const granted = useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => store.has(requires),
		() => store.server.has(requires),
	);
	return <>{granted ? children : fallback}</>;
}
