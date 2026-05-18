import {
	compile,
	compileCookiePolicy,
	compilePrivacyPolicy,
	type CookiePolicyConfig,
	type Document,
	isPolicyStackConfig,
	type PolicyStackConfig,
	type PolicyType,
	type PrivacyPolicyConfig,
} from "@policystack/core";
import { computed, type ComputedRef, inject, type MaybeRefOrGetter, toValue } from "vue";
import { PolicyStackContextKey } from "../context";

type ConfigInput = PolicyStackConfig | PrivacyPolicyConfig | CookiePolicyConfig | undefined;

export function usePolicyDocument(
	type: PolicyType,
	configProp: MaybeRefOrGetter<ConfigInput>,
): ComputedRef<Document | null> {
	const context = inject(PolicyStackContextKey, null);

	return computed(() => {
		const config = toValue(configProp) ?? context?.config.value;
		if (!config) return null;

		if (isPolicyStackConfig(config)) {
			return type === "privacy" ? compilePrivacyPolicy(config) : compileCookiePolicy(config);
		}

		return compile({ type, ...config } as Parameters<typeof compile>[0]);
	});
}
