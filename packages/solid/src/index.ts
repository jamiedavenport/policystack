import {
	createComponent,
	createContext,
	createSignal,
	onCleanup,
	Show,
	useContext,
	type Accessor,
	type JSX,
} from "solid-js";
import type { PolicyStackConfig } from "@policystack/core";
import {
	createConsentStore,
	type Category,
	type ConsentExpr,
	type ConsentRecord,
	type ConsentRecordSource,
	type ConsentState,
	type ConsentStore,
	type JurisdictionId,
	type RepromptReason,
	type Route,
} from "@policystack/core/consent";

type Bound = {
	store: ConsentStore;
	state: Accessor<ConsentState>;
};

const Ctx = createContext<Bound | null>(null);

const NOT_PROVIDED_MESSAGE =
	"useConsent / useCategory / ConsentGate must be used inside <PolicyStack>, " +
	"and the config must declare cookie categories";

function useBound(): Bound {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error(NOT_PROVIDED_MESSAGE);
	return ctx;
}

export type PolicyStackProps = {
	config: PolicyStackConfig;
	children?: JSX.Element;
};

/**
 * The single PolicyStack provider. Pass the one `PolicyStackConfig` and the
 * consent composables (`useConsent` / `useCategory` / `ConsentGate`) read the
 * store from it. The cookies → consent-categories derivation happens inside
 * `createConsentStore` (`@policystack/core/consent`); there is no separate
 * conversion step. A policy-only config (no cookie categories) provides no
 * store, so the consent composables correctly throw if used.
 */
export function PolicyStack(props: PolicyStackProps): JSX.Element {
	const store = createConsentStore(props.config);
	// Empty category set ⇒ policy-only config: expose no store so the consent
	// composables throw their guard instead of silently no-op-ing.
	if (store.getState().categories.length === 0) {
		return createComponent(Ctx.Provider, {
			value: null,
			get children() {
				return props.children;
			},
		});
	}
	const [state, setState] = createSignal<ConsentState>(store.getState(), { equals: false });
	const unsubscribe = store.subscribe(setState);
	onCleanup(unsubscribe);
	return createComponent(Ctx.Provider, {
		value: { store, state },
		get children() {
			return props.children;
		},
	});
}

export type UseConsentResult = {
	route: Accessor<Route>;
	categories: Accessor<Category[]>;
	decisions: Accessor<Record<string, boolean>>;
	jurisdiction: Accessor<JurisdictionId | null>;
	policyVersion: Accessor<string>;
	decidedAt: Accessor<string | null>;
	repromptReason: Accessor<RepromptReason | null>;
	has: (expr: ConsentExpr) => boolean;
	acceptAll: ConsentStore["acceptAll"];
	acceptNecessary: ConsentStore["acceptNecessary"];
	reject: ConsentStore["reject"];
	toggle: ConsentStore["toggle"];
	save: ConsentStore["save"];
	setRoute: ConsentStore["setRoute"];
	getConsentRecord: ConsentStore["getConsentRecord"];
	getPreviousRecord: ConsentStore["getPreviousRecord"];
};

export function useConsent(): UseConsentResult {
	const { store, state } = useBound();
	return {
		route: () => state().route,
		categories: () => state().categories,
		decisions: () => state().decisions,
		jurisdiction: () => state().jurisdiction,
		policyVersion: () => state().policyVersion,
		decidedAt: () => state().decidedAt,
		repromptReason: () => state().repromptReason,
		has: (expr) => {
			state();
			return store.has(expr);
		},
		acceptAll: (opts) => store.acceptAll(opts),
		acceptNecessary: (opts) => store.acceptNecessary(opts),
		reject: (opts) => store.reject(opts),
		toggle: (key, opts) => store.toggle(key, opts),
		save: (opts) => store.save(opts),
		setRoute: (route) => store.setRoute(route),
		getConsentRecord: () => {
			state();
			return store.getConsentRecord();
		},
		getPreviousRecord: () => {
			state();
			return store.getPreviousRecord();
		},
	};
}

export type UseCategoryResult = {
	granted: Accessor<boolean>;
	toggle: () => void;
};

export function useCategory(key: string): UseCategoryResult {
	const { store, state } = useBound();
	return {
		granted: () => state().decisions[key] === true,
		toggle: () => store.toggle(key),
	};
}

export type ConsentGateProps = {
	requires: ConsentExpr;
	fallback?: JSX.Element;
	children?: JSX.Element;
};

export function ConsentGate(props: ConsentGateProps): JSX.Element {
	const { store, state } = useBound();
	return createComponent(
		Show as (props: {
			when: boolean;
			keyed?: false;
			fallback?: JSX.Element;
			children?: JSX.Element;
		}) => JSX.Element,
		{
			get when() {
				state();
				return store.has(props.requires);
			},
			get fallback() {
				return props.fallback;
			},
			get children() {
				return props.children;
			},
		},
	);
}

export type {
	Category,
	ConsentExpr,
	ConsentRecord,
	ConsentRecordSource,
	ConsentState,
	ConsentStore,
	JurisdictionId,
	RepromptReason,
	Route,
};
