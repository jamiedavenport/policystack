import {
	compile,
	compileCookiePolicy,
	type CookiePolicyConfig,
	type Dictionary,
	isPolicyStackConfig,
	type Locale,
	type PolicyStackConfig,
} from "@policystack/core";
import { useContext } from "react";
import { PolicyStackContext } from "../context";
import { renderDocument } from "../render";
import type { PolicyComponents } from "../types";
import { DefaultRoot } from "./defaults";

type CookiePolicyProps = {
	config?: PolicyStackConfig | CookiePolicyConfig;
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
	const { config: contextConfig } = useContext(PolicyStackContext);
	const baseConfig = configProp ?? contextConfig ?? undefined;
	if (!baseConfig) return null;
	const config = locale ? { ...baseConfig, locale } : baseConfig;
	const doc = isPolicyStackConfig(config)
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
