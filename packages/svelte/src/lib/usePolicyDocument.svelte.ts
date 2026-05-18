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
import { getConfigContext } from "./context.svelte";

type ConfigInput = PolicyStackConfig | PrivacyPolicyConfig | CookiePolicyConfig | undefined;

export function compileDocument(type: PolicyType, config: ConfigInput): Document | null {
	if (!config) return null;

	if (isPolicyStackConfig(config)) {
		return type === "privacy" ? compilePrivacyPolicy(config) : compileCookiePolicy(config);
	}

	return compile({ type, ...config } as Parameters<typeof compile>[0]);
}

export function resolveDocument(type: PolicyType, configProp: ConfigInput): Document | null {
	const fallback = getConfigContext();
	return compileDocument(type, configProp ?? fallback?.());
}
