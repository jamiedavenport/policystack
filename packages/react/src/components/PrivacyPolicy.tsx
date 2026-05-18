import {
	compile,
	compilePrivacyPolicy,
	type Dictionary,
	isPolicyStackConfig,
	type Locale,
	type PolicyStackConfig,
	type PrivacyPolicyConfig,
} from "@policystack/core";
import { useContext } from "react";
import { PolicyStackContext } from "../context";
import { renderDocument } from "../render";
import type { PolicyComponents } from "../types";
import { DefaultRoot } from "./defaults";

type PrivacyPolicyProps = {
	config?: PolicyStackConfig | PrivacyPolicyConfig;
	locale?: Locale;
	dictionary?: Dictionary;
	components?: PolicyComponents;
	style?: unknown;
};

export function PrivacyPolicy({
	config: configProp,
	locale,
	dictionary,
	components,
	style,
}: PrivacyPolicyProps) {
	const { config: contextConfig } = useContext(PolicyStackContext);
	const baseConfig = configProp ?? contextConfig ?? undefined;
	if (!baseConfig) return null;
	const config = locale ? { ...baseConfig, locale } : baseConfig;
	const doc = isPolicyStackConfig(config)
		? compilePrivacyPolicy(config, dictionary)
		: compile({ type: "privacy", ...config }, dictionary);
	if (!doc) return null;
	const Root = components?.Root ?? DefaultRoot;
	return (
		<Root node={doc} style={style}>
			{renderDocument(doc, components)}
		</Root>
	);
}
