import type { PolicyStackConfig } from "@policystack/core";
import { getContext, setContext } from "svelte";
import type { PolicyComponents } from "./types";

const CONFIG_KEY = Symbol("policystack.config");
const OVERRIDES_KEY = Symbol("policystack.overrides");

type ConfigGetter = () => PolicyStackConfig | undefined;

export function setConfigContext(getter: ConfigGetter): void {
	setContext(CONFIG_KEY, getter);
}

export function getConfigContext(): ConfigGetter | undefined {
	return getContext<ConfigGetter | undefined>(CONFIG_KEY);
}

export function setOverridesContext(getter: () => PolicyComponents): void {
	setContext(OVERRIDES_KEY, getter);
}

export function getOverridesContext(): () => PolicyComponents {
	return getContext<(() => PolicyComponents) | undefined>(OVERRIDES_KEY) ?? (() => ({}));
}
