import type { PolicyStackConfig } from "@policystack/core";
import type { ConsentStore } from "@policystack/core/consent";
import type { InjectionKey, Ref } from "vue";

// The single PolicyStack injection. `<PolicyStack>` (the one provider, at
// `@policystack/vue/provider`) populates both halves from one
// `PolicyStackConfig`:
//   - `config` is read by the policy components (`@policystack/vue/policy`).
//   - `store` is read by the consent composables (`@policystack/vue/consent`);
//     it is `null` for a policy-only config (no cookie categories), which makes
//     the consent composables throw their "use inside <PolicyStack>" guard.
export type PolicyStackContextValue = {
	config: Ref<PolicyStackConfig>;
	store: ConsentStore | null;
};

export const PolicyStackContextKey: InjectionKey<PolicyStackContextValue> =
	Symbol("PolicyStackContext");
