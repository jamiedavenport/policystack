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

// State slice flows through useSyncExternalStore; the actions are the store's
// own closures, passed by reference (stable identity, no per-render wrappers).
// `subscribe`/`getState`/`refreshJurisdiction` are intentionally not exposed.
export type UseConsentResult = {
	route: Route;
	categories: Category[];
	decisions: Record<string, boolean>;
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
		() => store.getState(),
	);
	return {
		route: state.route,
		categories: state.categories,
		decisions: state.decisions,
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

export function useCategory(key: string): UseCategoryResult {
	const store = useStore();
	const granted = useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => store.getState().decisions[key] === true,
		() => store.getState().decisions[key] === true,
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
		() => store.has(requires),
	);
	return <>{granted ? children : fallback}</>;
}
