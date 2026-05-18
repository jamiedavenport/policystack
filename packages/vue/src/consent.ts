import {
	computed,
	defineComponent,
	inject,
	onScopeDispose,
	provide,
	shallowRef,
	type App,
	type ComputedRef,
	type InjectionKey,
	type PropType,
	type Ref,
	type SlotsType,
} from "vue";
import {
	createConsentStore,
	type Category,
	type ConsentExpr,
	type ConsentRecord,
	type ConsentRecordSource,
	type ConsentState,
	type ConsentStore,
	type JurisdictionId,
	type PolicyStackConsentConfig,
	type RepromptReason,
	type Route,
} from "@policystack/core/consent";

const StoreKey: InjectionKey<ConsentStore> = Symbol("policystack-consent-store");

const NOT_PROVIDED_MESSAGE =
	"useConsent / useCategory / ConsentGate must be used after `app.use(PolicyStackConsentPlugin, { config })` " +
	"or inside <PolicyStackConsentProvider>";

function injectStore(): ConsentStore {
	const store = inject(StoreKey, null);
	if (!store) throw new Error(NOT_PROVIDED_MESSAGE);
	return store;
}

function useStoreState(store: ConsentStore): Ref<ConsentState> {
	const state = shallowRef(store.getState());
	const unsubscribe = store.subscribe((next) => {
		state.value = next;
	});
	onScopeDispose(unsubscribe);
	return state;
}

export type PolicyStackConsentPluginOptions =
	| { config: PolicyStackConsentConfig; store?: undefined }
	| { store: ConsentStore; config?: undefined };

export const PolicyStackConsentPlugin = {
	install(app: App, options: PolicyStackConsentPluginOptions): void {
		const store = resolveStore(options);
		app.provide(StoreKey, store);
	},
};

function resolveStore(options: PolicyStackConsentPluginOptions): ConsentStore {
	if (options.store) return options.store;
	return createConsentStore(options.config);
}

export const PolicyStackConsentProvider = defineComponent({
	name: "PolicyStackConsentProvider",
	props: {
		config: {
			type: Object as PropType<PolicyStackConsentConfig>,
			default: undefined,
		},
		store: {
			type: Object as PropType<ConsentStore>,
			default: undefined,
		},
	},
	slots: Object as SlotsType<{ default?: () => unknown }>,
	setup(props, { slots }) {
		if (!props.store && !props.config) {
			throw new Error("<PolicyStackConsentProvider> requires either a `config` or a `store` prop");
		}
		const store = props.store ?? createConsentStore(props.config!);
		provide(StoreKey, store);
		return () => slots.default?.();
	},
});

export type UseConsentResult = {
	route: ComputedRef<Route>;
	categories: ComputedRef<Category[]>;
	decisions: ComputedRef<Record<string, boolean>>;
	jurisdiction: ComputedRef<JurisdictionId | null>;
	policyVersion: ComputedRef<string>;
	decidedAt: ComputedRef<string | null>;
	repromptReason: ComputedRef<RepromptReason | null>;
	acceptAll: ConsentStore["acceptAll"];
	acceptNecessary: ConsentStore["acceptNecessary"];
	reject: ConsentStore["reject"];
	toggle: ConsentStore["toggle"];
	save: ConsentStore["save"];
	setRoute: ConsentStore["setRoute"];
	has: ConsentStore["has"];
	getConsentRecord: ConsentStore["getConsentRecord"];
	getPreviousRecord: ConsentStore["getPreviousRecord"];
};

export function useConsent(): UseConsentResult {
	const store = injectStore();
	const state = useStoreState(store);
	return {
		route: computed(() => state.value.route),
		categories: computed(() => state.value.categories),
		decisions: computed(() => state.value.decisions),
		jurisdiction: computed(() => state.value.jurisdiction),
		policyVersion: computed(() => state.value.policyVersion),
		decidedAt: computed(() => state.value.decidedAt),
		repromptReason: computed(() => state.value.repromptReason),
		acceptAll: (opts) => store.acceptAll(opts),
		acceptNecessary: (opts) => store.acceptNecessary(opts),
		reject: (opts) => store.reject(opts),
		toggle: (key, opts) => store.toggle(key, opts),
		save: (opts) => store.save(opts),
		setRoute: (route) => store.setRoute(route),
		has: (expr) => store.has(expr),
		getConsentRecord: () => store.getConsentRecord(),
		getPreviousRecord: () => store.getPreviousRecord(),
	};
}

export type UseCategoryResult = {
	granted: ComputedRef<boolean>;
	toggle: () => void;
};

export function useCategory(key: string): UseCategoryResult {
	const store = injectStore();
	const state = useStoreState(store);
	return {
		granted: computed(() => state.value.decisions[key] === true),
		toggle: () => store.toggle(key),
	};
}

export const ConsentGate = defineComponent({
	name: "ConsentGate",
	props: {
		requires: {
			type: [String, Object] as PropType<ConsentExpr>,
			required: true,
		},
	},
	slots: Object as SlotsType<{
		default?: () => unknown;
		fallback?: () => unknown;
	}>,
	setup(props, { slots }) {
		const store = injectStore();
		const state = useStoreState(store);
		const granted = computed(() => {
			void state.value;
			return store.has(props.requires);
		});
		return () => (granted.value ? slots.default?.() : slots.fallback?.());
	},
});

export type {
	Category,
	ConsentExpr,
	ConsentRecord,
	ConsentRecordSource,
	ConsentState,
	ConsentStore,
	JurisdictionId,
	PolicyStackConsentConfig,
	RepromptReason,
	Route,
};
