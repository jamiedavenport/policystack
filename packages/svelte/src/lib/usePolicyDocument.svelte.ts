import {
	compileCookiePolicy,
	compilePrivacyPolicy,
	type Document,
	type PolicyStackConfig,
	type PolicyType,
} from "@policystack/core";
import { getConfigContext } from "./context.svelte";

type ConfigInput = PolicyStackConfig | undefined;

export function compileDocument(type: PolicyType, config: ConfigInput): Document | null {
	if (!config) return null;
	return type === "privacy" ? compilePrivacyPolicy(config) : compileCookiePolicy(config);
}

export function resolveDocument(type: PolicyType, configProp: ConfigInput): Document | null {
	const fallback = getConfigContext();
	return compileDocument(type, configProp ?? fallback?.());
}
