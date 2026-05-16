import {
	compile,
	compilePrivacyPolicy,
	isOpenPolicyConfig,
	type Locale,
	type OpenPolicyConfig,
	type PrivacyPolicyConfig,
} from "@openpolicy/core";
import { useContext } from "react";
import { OpenPolicyContext } from "../context";
import { renderDocument } from "../render";
import type { PolicyComponents } from "../types";
import { DefaultRoot } from "./defaults";

type PrivacyPolicyProps = {
	config?: OpenPolicyConfig | PrivacyPolicyConfig;
	locale?: Locale;
	components?: PolicyComponents;
	style?: unknown;
};

export function PrivacyPolicy({
	config: configProp,
	locale,
	components,
	style,
}: PrivacyPolicyProps) {
	const { config: contextConfig } = useContext(OpenPolicyContext);
	const baseConfig = configProp ?? contextConfig ?? undefined;
	if (!baseConfig) return null;
	const config = locale ? { ...baseConfig, locale } : baseConfig;
	const doc = isOpenPolicyConfig(config)
		? compilePrivacyPolicy(config)
		: compile({ type: "privacy", ...config });
	if (!doc) return null;
	const Root = components?.Root ?? DefaultRoot;
	return (
		<Root node={doc} style={style}>
			{renderDocument(doc, components)}
		</Root>
	);
}
