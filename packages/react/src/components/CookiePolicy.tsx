import {
	compile,
	compileCookiePolicy,
	type CookiePolicyConfig,
	type Dictionary,
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
	dictionary?: Dictionary;
	components?: PolicyComponents;
	style?: unknown;
};

export function CookiePolicy({
	config: configProp,
	locale,
	dictionary,
	components,
	style,
}: CookiePolicyProps) {
	const { config: contextConfig } = useContext(OpenPolicyContext);
	const baseConfig = configProp ?? contextConfig ?? undefined;
	if (!baseConfig) return null;
	const config = locale ? { ...baseConfig, locale } : baseConfig;
	const doc = isOpenPolicyConfig(config)
		? compileCookiePolicy(config, dictionary)
		: compile({ type: "cookie", ...config }, dictionary);
	if (!doc) return null;
	const Root = components?.Root ?? DefaultRoot;
	return (
		<Root node={doc} style={style}>
			{renderDocument(doc, components)}
		</Root>
	);
}
