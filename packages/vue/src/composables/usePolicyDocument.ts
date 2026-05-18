import {
	compileCookiePolicy,
	compilePrivacyPolicy,
	type Document,
	type PolicyStackConfig,
	type PolicyType,
} from "@policystack/core";
import { computed, type ComputedRef, inject, type MaybeRefOrGetter, toValue } from "vue";
import { PolicyStackContextKey } from "../context";

type ConfigInput = PolicyStackConfig | undefined;

export function usePolicyDocument(
	type: PolicyType,
	configProp: MaybeRefOrGetter<ConfigInput>,
): ComputedRef<Document | null> {
	const context = inject(PolicyStackContextKey, null);

	return computed(() => {
		const config = toValue(configProp) ?? context?.config.value;
		if (!config) return null;
		return type === "privacy" ? compilePrivacyPolicy(config) : compileCookiePolicy(config);
	});
}
