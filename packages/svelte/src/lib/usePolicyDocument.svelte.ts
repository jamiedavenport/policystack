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
import { getConfigContext } from "./context.svelte";

type ConfigInput = OpenPolicyConfig | PrivacyPolicyConfig | CookiePolicyConfig | undefined;

export function compileDocument(type: PolicyType, config: ConfigInput): Document | null {
	if (!config) return null;

	if (isOpenPolicyConfig(config)) {
		return type === "privacy" ? compilePrivacyPolicy(config) : compileCookiePolicy(config);
	}

	return compile({ type, ...config } as Parameters<typeof compile>[0]);
}

export function resolveDocument(type: PolicyType, configProp: ConfigInput): Document | null {
	const fallback = getConfigContext();
	return compileDocument(type, configProp ?? fallback?.());
}
