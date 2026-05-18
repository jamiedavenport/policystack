import type { PolicyStackConfig } from "@policystack/core";
import { defineComponent, type InjectionKey, type PropType, provide, type Ref, toRef } from "vue";

type PolicyStackContextValue = {
	config: Ref<PolicyStackConfig>;
};

export const PolicyStackContextKey: InjectionKey<PolicyStackContextValue> =
	Symbol("PolicyStackContext");

export const PolicyStack = defineComponent({
	name: "PolicyStack",
	props: {
		config: {
			type: Object as PropType<PolicyStackConfig>,
			required: true,
		},
	},
	setup(props, { slots }) {
		provide(PolicyStackContextKey, {
			config: toRef(props, "config"),
		});
		return () => slots.default?.();
	},
});
