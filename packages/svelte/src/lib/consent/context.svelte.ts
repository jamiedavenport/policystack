import {
	createConsentStore,
	type ActionOptions,
	type Category,
	type ConsentExpr,
	type ConsentRecord,
	type ConsentState,
	type ConsentStore,
	type JurisdictionId,
	type PolicyStackConsentConfig,
	type RepromptReason,
	type Route,
} from "@policystack/core/consent";
import { getContext, onDestroy, setContext } from "svelte";

const CONTEXT_KEY = Symbol("policystack-consent");

const NOT_PROVIDED =
	"getConsent / getCategory / <ConsentGate> must be used inside a component tree where setPolicyStackConsentContext({ config }) was called";

export class ConsentRune {
	#store: ConsentStore;
	#state: ConsentState = $state(undefined!);

	constructor(store: ConsentStore) {
		this.#store = store;
		this.#state = store.getState();
	}

	/** @internal */
	_setState(next: ConsentState): void {
		this.#state = next;
	}

	/** @internal */
	_store(): ConsentStore {
		return this.#store;
	}

	get route(): Route {
		return this.#state.route;
	}

	get categories(): Category[] {
		return this.#state.categories;
	}

	get decisions(): Record<string, boolean> {
		return this.#state.decisions;
	}

	get jurisdiction(): JurisdictionId | null {
		return this.#state.jurisdiction;
	}

	get policyVersion(): string {
		return this.#state.policyVersion;
	}

	get decidedAt(): string | null {
		return this.#state.decidedAt;
	}

	get repromptReason(): RepromptReason | null {
		return this.#state.repromptReason;
	}

	acceptAll = (opts?: ActionOptions): void => this.#store.acceptAll(opts);
	acceptNecessary = (opts?: ActionOptions): void => this.#store.acceptNecessary(opts);
	reject = (opts?: ActionOptions): void => this.#store.reject(opts);
	toggle = (key: string, opts?: ActionOptions): void => this.#store.toggle(key, opts);
	save = (opts?: ActionOptions): void => this.#store.save(opts);
	setRoute = (route: Route): void => this.#store.setRoute(route);

	has = (expr: ConsentExpr): boolean => {
		void this.#state.decisions;
		return this.#store.has(expr);
	};

	getConsentRecord = (): ConsentRecord | null => {
		void this.#state;
		return this.#store.getConsentRecord();
	};

	getPreviousRecord = (): ConsentRecord | null => {
		void this.#state;
		return this.#store.getPreviousRecord();
	};
}

export class CategoryRune {
	#parent: ConsentRune;
	#key: string;

	constructor(parent: ConsentRune, key: string) {
		this.#parent = parent;
		this.#key = key;
	}

	get granted(): boolean {
		return this.#parent.decisions[this.#key] === true;
	}

	toggle = (): void => this.#parent._store().toggle(this.#key);
}

export type SetContextOptions =
	| { config: PolicyStackConsentConfig; store?: undefined }
	| { store: ConsentStore; config?: undefined };

export function setPolicyStackConsentContext(options: SetContextOptions): ConsentRune {
	const store = options.store ?? createConsentStore(options.config);
	const rune = new ConsentRune(store);
	const unsubscribe = store.subscribe((next) => rune._setState(next));
	onDestroy(unsubscribe);
	setContext(CONTEXT_KEY, rune);
	return rune;
}

export function getConsent(): ConsentRune {
	const rune = getContext<ConsentRune | undefined>(CONTEXT_KEY);
	if (!rune) throw new Error(NOT_PROVIDED);
	return rune;
}

export function getCategory(key: string): CategoryRune {
	return new CategoryRune(getConsent(), key);
}
