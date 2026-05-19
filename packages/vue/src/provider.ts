import type { PolicyStackConfig } from "@policystack/core";
import { createConsentStore } from "@policystack/core/consent";
import { defineComponent, type PropType, provide, type SlotsType, toRef } from "vue";
import { PolicyStackContextKey } from "./context";

/**
 * The single PolicyStack provider. Pass the one `PolicyStackConfig` and it
 * supplies both halves of the context from it:
 *
 * - The policy components — `<PrivacyPolicy>` / `<CookiePolicy>` from
 *   `@policystack/vue/policy` — read `config`.
 * - The consent composables — `useConsent` / `useCategory` / `ConsentGate`
 *   from `@policystack/vue/consent` — read the consent `store`.
 *
 * The cookies → consent-categories derivation happens inside
 * `createConsentStore` (`@policystack/core/consent`); there is no separate
 * conversion step. A policy-only config (no cookie categories) provides no
 * store, so the consent composables correctly throw if used.
 */
export const PolicyStack = defineComponent({
	name: "PolicyStack",
	props: {
		config: {
			type: Object as PropType<PolicyStackConfig>,
			required: true,
		},
	},
	slots: Object as SlotsType<{ default?: () => unknown }>,
	setup(props, { slots }) {
		// Derive once per provider instance (snapshot of the initial config),
		// mirroring React's useState-initializer store.
		const store = createConsentStore(props.config);
		provide(PolicyStackContextKey, {
			config: toRef(props, "config"),
			store: store.getState().categories.length > 0 ? store : null,
		});
		return () => slots.default?.();
	},
});
