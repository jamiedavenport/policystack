import {
	computed,
	defineComponent,
	inject,
	onMounted,
	onScopeDispose,
	onUnmounted,
	shallowRef,
	type ComputedRef,
	type PropType,
	type Ref,
	type SlotsType,
	watch,
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
	ScriptDefinition,
	ScriptEvent,
} from "@policystack/core/consent";
import { gateScript } from "@policystack/core/consent";
import { PolicyStackContextKey } from "./context";

const NOT_PROVIDED_MESSAGE =
	"PolicyStack consent (useConsent / useCategory / useConsentStore / ConsentGate / GatedScript) must be used inside <PolicyStack>, " +
	"and the config must declare cookie categories";

// The consent composables read the single store off the shared PolicyStack
// injection — there is no separate consent provider. The store is `null` when
// the `<PolicyStack>` config declared no cookie categories (a policy-only
// config), in which case using a consent composable is a configuration error.
/**
 * The stable, non-reactive consent store from the enclosing `<PolicyStack>`.
 * Prefer the reactive consent composables for UI reads; use this when a core
 * free function such as `gateScripts` needs the store itself.
 */
export function useConsentStore(): ConsentStore {
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
	draft: ComputedRef<Record<string, boolean> | null>;
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
	const store = useConsentStore();
	const state = useStoreState(store);
	return {
		route: computed(() => state.value.route),
		categories: computed(() => state.value.categories),
		decisions: computed(() => state.value.decisions),
		draft: computed(() => state.value.draft),
		jurisdiction: computed(() => state.value.jurisdiction),
		policyVersion: computed(() => state.value.policyVersion),
		decidedAt: computed(() => state.value.decidedAt),
		repromptReason: computed(() => state.value.repromptReason),
		acceptAll: (opts) => store.acceptAll(opts),
		acceptNecessary: (opts) => store.acceptNecessary(opts),
		reject: (opts) => store.reject(opts),
		toggle: (key) => store.toggle(key),
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

// `granted` is the checkbox view and includes staged draft edits; effective
// consent (`has()` / <ConsentGate>) only moves on save().
export function useCategory(key: string): UseCategoryResult {
	const store = useConsentStore();
	const state = useStoreState(store);
	return {
		granted: computed(() => (state.value.draft ?? state.value.decisions)[key] === true),
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
		const store = useConsentStore();
		const state = useStoreState(store);
		const granted = computed(() => {
			void state.value;
			return store.has(props.requires);
		});
		return () => (granted.value ? slots.default?.() : slots.fallback?.());
	},
});

export type GatedScriptProps = {
	def: ScriptDefinition;
	onEvent?: (event: ScriptEvent) => void;
};

/**
 * Consent-gates one third-party script for as long as it is mounted.
 * Renders no DOM and starts from `onMounted`, so it is inert during SSR.
 */
export const GatedScript = defineComponent({
	name: "GatedScript",
	props: {
		def: {
			type: Object as PropType<ScriptDefinition>,
			required: true,
		},
		onEvent: Function as PropType<(event: ScriptEvent) => void>,
	},
	setup(props) {
		const store = useConsentStore();
		let dispose: (() => void) | undefined;
		let stopWatching: (() => void) | undefined;

		const gate = () =>
			gateScript(store, props.def, {
				onEvent: (event) => props.onEvent?.(event),
			});

		onMounted(() => {
			dispose = gate();
			stopWatching = watch(
				() => props.def.id,
				() => {
					dispose?.();
					dispose = gate();
				},
			);
		});

		onUnmounted(() => {
			stopWatching?.();
			dispose?.();
		});

		return () => null;
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
	ScriptDefinition,
	ScriptEvent,
};
