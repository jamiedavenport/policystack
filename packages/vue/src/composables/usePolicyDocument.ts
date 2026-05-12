import {
	compile,
	compileCookiePolicy,
	compilePrivacyPolicy,
	type CookiePolicyConfig,
	type Document,
	isOpenPolicyConfig,
	type OpenPolicyConfig,
	type PolicyType,
	type PrivacyPolicyConfig,
} from "@openpolicy/core";
import { computed, type ComputedRef, inject, type MaybeRefOrGetter, toValue } from "vue";
import { OpenPolicyContextKey } from "../context";

type ConfigInput = OpenPolicyConfig | PrivacyPolicyConfig | CookiePolicyConfig | undefined;

export function usePolicyDocument(
	type: PolicyType,
	configProp: MaybeRefOrGetter<ConfigInput>,
): ComputedRef<Document | null> {
	const context = inject(OpenPolicyContextKey, null);

	return computed(() => {
		const config = toValue(configProp) ?? context?.config.value;
		if (!config) return null;

		if (isOpenPolicyConfig(config)) {
			return type === "privacy" ? compilePrivacyPolicy(config) : compileCookiePolicy(config);
		}

		return compile({ type, ...config } as Parameters<typeof compile>[0]);
	});
}
