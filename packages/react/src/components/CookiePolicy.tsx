import {
	compile,
	compileCookiePolicy,
	type CookiePolicyConfig,
	isOpenPolicyConfig,
	type Locale,
	type OpenPolicyConfig,
} from "@openpolicy/core";
import { useContext } from "react";
import { OpenPolicyContext } from "../context";
import { renderDocument } from "../render";
import type { PolicyComponents } from "../types";
import { DefaultRoot } from "./defaults";

type CookiePolicyProps = {
	config?: OpenPolicyConfig | CookiePolicyConfig;
	locale?: Locale;
	components?: PolicyComponents;
	style?: unknown;
};

export function CookiePolicy({ config: configProp, locale, components, style }: CookiePolicyProps) {
	const { config: contextConfig } = useContext(OpenPolicyContext);
	const baseConfig = configProp ?? contextConfig ?? undefined;
	if (!baseConfig) return null;
	const config = locale ? { ...baseConfig, locale } : baseConfig;
	const doc = isOpenPolicyConfig(config)
		? compileCookiePolicy(config)
		: compile({ type: "cookie", ...config });
	if (!doc) return null;
	const Root = components?.Root ?? DefaultRoot;
	return <Root style={style}>{renderDocument(doc, components)}</Root>;
}
