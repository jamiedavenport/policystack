import type { Dictionary, Document, Locale, PolicyStackConfig } from "@policystack/core";
import { useContext } from "react";
import { PolicyStackContext } from "../context";
import { renderDocument } from "../render";
import type { PolicyComponents } from "../types";
import { DefaultRoot } from "./defaults";

export type PolicyDocumentProps = {
	config?: PolicyStackConfig;
	locale?: Locale;
	dictionary?: Dictionary;
	components?: PolicyComponents;
	style?: unknown;
};

// Shared body for <PrivacyPolicy>/<CookiePolicy>: identical context-fallback,
// locale-merge, compile-or-null, Root-wrap. Only the `compile` fn differs
// (compilePrivacyPolicy vs compileCookiePolicy). Internal — not exported from
// any subpath barrel.
export function PolicyDocument({
	compile,
	config: configProp,
	locale,
	dictionary,
	components,
	style,
}: PolicyDocumentProps & {
	compile: (config: PolicyStackConfig, dictionary?: Dictionary) => Document | null;
}) {
	const { config: contextConfig } = useContext(PolicyStackContext);
	const baseConfig = configProp ?? contextConfig ?? undefined;
	if (!baseConfig) return null;
	const config = locale ? { ...baseConfig, locale } : baseConfig;
	const doc = compile(config, dictionary);
	if (!doc) return null;
	const Root = components?.Root ?? DefaultRoot;
	return (
		<Root node={doc} style={style}>
			{renderDocument(doc, components)}
		</Root>
	);
}
