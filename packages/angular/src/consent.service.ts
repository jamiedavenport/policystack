import { DestroyRef, Injectable, computed, inject, signal, type Signal } from "@angular/core";
import type {
	ActionOptions,
	Category,
	ConsentExpr,
	ConsentRecord,
	ConsentState,
	ConsentStore,
	Jurisdiction,
	RepromptReason,
	Route,
} from "@policystack/core/consent";
import { POLICYSTACK_CONSENT_STORE } from "./tokens";

@Injectable({ providedIn: "root" })
export class ConsentService {
	private readonly store: ConsentStore = inject(POLICYSTACK_CONSENT_STORE);
	private readonly _state = signal<ConsentState>(this.store.getState());

	readonly state: Signal<ConsentState> = this._state.asReadonly();
	readonly route: Signal<Route> = computed(() => this._state().route);
	readonly categories: Signal<Category[]> = computed(() => this._state().categories);
	readonly decisions: Signal<Record<string, boolean>> = computed(() => this._state().decisions);
	readonly jurisdiction: Signal<Jurisdiction | null> = computed(() => this._state().jurisdiction);
	readonly policyVersion: Signal<string> = computed(() => this._state().policyVersion);
	readonly decidedAt: Signal<string | null> = computed(() => this._state().decidedAt);
	readonly repromptReason: Signal<RepromptReason | null> = computed(
		() => this._state().repromptReason,
	);

	constructor() {
		const unsubscribe = this.store.subscribe((next: ConsentState) => this._state.set(next));
		inject(DestroyRef).onDestroy(unsubscribe);
	}

	acceptAll(opts?: ActionOptions): void {
		this.store.acceptAll(opts);
	}

	acceptNecessary(opts?: ActionOptions): void {
		this.store.acceptNecessary(opts);
	}

	reject(opts?: ActionOptions): void {
		this.store.reject(opts);
	}

	toggle(category: string, opts?: ActionOptions): void {
		this.store.toggle(category, opts);
	}

	save(opts?: ActionOptions): void {
		this.store.save(opts);
	}

	setRoute(route: Route): void {
		this.store.setRoute(route);
	}

	has(expr: ConsentExpr): boolean {
		return this.store.has(expr);
	}

	getConsentRecord(): ConsentRecord | null {
		return this.store.getConsentRecord();
	}

	getPreviousRecord(): ConsentRecord | null {
		return this.store.getPreviousRecord();
	}
}
