import type {
	ConsentExpr,
	ConsentState,
	ConsentStore,
	PolicyStackConsentConfig,
	Route,
} from "@policystack/core/consent";
import { createConsentStore } from "@policystack/core/consent";
import { readable, type Readable } from "svelte/store";

export type ConsentStoreReadable = Readable<ConsentState> & {
	acceptAll: () => void;
	acceptNecessary: () => void;
	reject: () => void;
	toggle: (key: string) => void;
	save: () => void;
	setRoute: (route: Route) => void;
	has: (expr: ConsentExpr) => boolean;
};

export function createConsentReadable(
	options: { config: PolicyStackConsentConfig; store?: undefined } | { store: ConsentStore },
): ConsentStoreReadable {
	const store = options.store ?? createConsentStore(options.config);
	const readableStore = readable<ConsentState>(store.getState(), (set) => {
		set(store.getState());
		return store.subscribe(set);
	});
	return {
		subscribe: readableStore.subscribe,
		acceptAll: () => store.acceptAll(),
		acceptNecessary: () => store.acceptNecessary(),
		reject: () => store.reject(),
		toggle: (key) => store.toggle(key),
		save: () => store.save(),
		setRoute: (route) => store.setRoute(route),
		has: (expr) => store.has(expr),
	};
}
