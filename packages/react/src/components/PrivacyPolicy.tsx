import {
	compile,
	compilePrivacyPolicy,
	isOpenPolicyConfig,
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
	components?: PolicyComponents;
	style?: unknown;
};

export function PrivacyPolicy({ config: configProp, components, style }: PrivacyPolicyProps) {
	const { config: contextConfig } = useContext(OpenPolicyContext);
	const config = configProp ?? contextConfig ?? undefined;
	if (!config) return null;
	const doc = isOpenPolicyConfig(config)
		? compilePrivacyPolicy(config)
		: compile({ type: "privacy", ...config });
	if (!doc) return null;
	const Root = components?.Root ?? DefaultRoot;
	return <Root style={style}>{renderDocument(doc, components)}</Root>;
}
