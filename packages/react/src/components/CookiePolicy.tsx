import {
	compile,
	compileCookiePolicy,
	type CookiePolicyConfig,
	isOpenPolicyConfig,
	type OpenPolicyConfig,
} from "@openpolicy/core";
import { useContext } from "react";
import { OpenPolicyContext } from "../context";
import { renderDocument } from "../render";
import type { PolicyComponents } from "../types";
import { DefaultRoot } from "./defaults";

type CookiePolicyProps = {
	config?: OpenPolicyConfig | CookiePolicyConfig;
	components?: PolicyComponents;
	style?: unknown;
};

export function CookiePolicy({ config: configProp, components, style }: CookiePolicyProps) {
	const { config: contextConfig } = useContext(OpenPolicyContext);
	const config = configProp ?? contextConfig ?? undefined;
	if (!config) return null;
	const doc = isOpenPolicyConfig(config)
		? compileCookiePolicy(config)
		: compile({ type: "cookie", ...config });
	if (!doc) return null;
	const Root = components?.Root ?? DefaultRoot;
	return <Root style={style}>{renderDocument(doc, components)}</Root>;
}
