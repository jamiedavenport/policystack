import {
	computed,
	defineComponent,
	inject,
	onScopeDispose,
	shallowRef,
	type ComputedRef,
	type PropType,
	type Ref,
	type SlotsType,
} from "vue";
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
import { PolicyStackContextKey } from "./context";

const NOT_PROVIDED_MESSAGE =
	"useConsent / useCategory / ConsentGate must be used inside <PolicyStack>, " +
	"and the config must declare cookie categories";

// The consent composables read the single store off the shared PolicyStack
// injection — there is no separate consent provider. The store is `null` when
// the `<PolicyStack>` config declared no cookie categories (a policy-only
// config), in which case using a consent composable is a configuration error.
function injectStore(): ConsentStore {
	const ctx = inject(PolicyStackContextKey, null);
	if (!ctx?.store) throw new Error(NOT_PROVIDED_MESSAGE);
	return ctx.store;
}

function useStoreState(store: ConsentStore): Ref<ConsentState> {
	const state = shallowRef(store.getState());
	const unsubscribe = store.subscribe((next) => {
		state.value = next;
	});
	onScopeDispose(unsubscribe);
	return state;
}

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
	RepromptReason,
	Route,
};
