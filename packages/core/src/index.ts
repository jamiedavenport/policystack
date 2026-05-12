export type {
	BoldNode,
	ContentNode,
	Document,
	DocumentSection,
	HeadingNode,
	InlineNode,
	ItalicNode,
	LinkNode,
	ListItemNode,
	ListNode,
	Node,
	NodeContext,
	ParagraphNode,
	PolicyType,
	TableCellNode,
	TableNode,
	TableRowNode,
	TextNode,
} from "./documents";
export {
	bold,
	cell,
	compile,
	heading,
	italic,
	li,
	link,
	ol,
	p,
	row,
	section,
	table,
	text,
	ul,
} from "./documents";
export { isJurisdiction, JURISDICTIONS } from "./jurisdictions";
export type {
	AutomatedDecision,
	AutomatedDecisionMaking,
	ChildrenConfig,
	CompanyConfig,
	CompileOptions,
	ConsentMechanism,
	Contact,
	CookieContext,
	CookieContextEntry,
	CookiePolicyConfig,
	CookiePolicyCookies,
	CookieUsage,
	DataCollection,
	DataConfig,
	DataContext,
	DataContextEntry,
	Dpo,
	EffectiveDate,
	EuRepresentative,
	Jurisdiction,
	LegalBasis,
	OpenPolicyConfig,
	OutputFormat,
	PolicyCategory,
	PolicyInput,
	PrivacyPolicyConfig,
	ProvisionBasis,
	ProvisionRequirement,
	ThirdParty,
	TrackingTechnology,
	UserRight,
	ValidationIssue,
} from "./types";
export { isOpenPolicyConfig } from "./types";
export { Contractual, ContractPrerequisite, Statutory, Voluntary } from "./provision";
export { computeCookieVersion, computePrivacyVersion } from "./policy-version";
export { deriveUserRights } from "./user-rights";
export { validatePrivacyPolicy } from "./validate";
export { validateOpenPolicyConfig } from "./validate-config";
export { validateCookiePolicy } from "./validate-cookie";

import { compile } from "./documents";
import type { Document } from "./documents";
import type {
	CookiePolicyCookies,
	DataConfig,
	OpenPolicyConfig,
	PolicyCategory,
	PolicyInput,
} from "./types";
import { deriveUserRights } from "./user-rights";

const PRIVACY_FIELDS = ["data", "children"] as const;

function hasAnyPrivacyField(config: OpenPolicyConfig): boolean {
	return PRIVACY_FIELDS.some((field) => config[field] !== undefined);
}

function hasCookieField(config: OpenPolicyConfig): boolean {
	return config.cookies !== undefined;
}

export function shouldEmit(category: PolicyCategory, config: OpenPolicyConfig): boolean {
	if (config.policies) return config.policies.includes(category);
	return category === "privacy" ? hasAnyPrivacyField(config) : hasCookieField(config);
}

const EMPTY_DATA: DataConfig = {
	collected: {},
	context: {},
};
const EMPTY_COOKIES: CookiePolicyCookies = { used: { essential: true }, context: {} };

type PrivacyInput = Extract<PolicyInput, { type: "privacy" }>;
type CookieInput = Extract<PolicyInput, { type: "cookie" }>;

function buildPrivacyInput(config: OpenPolicyConfig): PrivacyInput | null {
	if (!shouldEmit("privacy", config)) return null;
	return {
		type: "privacy",
		company: config.company,
		effectiveDate: config.effectiveDate,
		jurisdictions: config.jurisdictions,
		data: config.data ?? EMPTY_DATA,
		cookies: config.cookies ?? EMPTY_COOKIES,
		thirdParties: config.thirdParties ?? [],
		userRights: deriveUserRights(config.jurisdictions),
		children: config.children,
		automatedDecisionMaking: config.automatedDecisionMaking,
		version: config.privacyVersion,
	};
}

function buildCookieInput(config: OpenPolicyConfig): CookieInput | null {
	if (!shouldEmit("cookie", config)) return null;
	return {
		type: "cookie",
		company: config.company,
		effectiveDate: config.effectiveDate,
		jurisdictions: config.jurisdictions,
		cookies: config.cookies ?? EMPTY_COOKIES,
		thirdParties: config.thirdParties ?? [],
		trackingTechnologies: config.trackingTechnologies,
		consentMechanism: config.consentMechanism,
		version: config.cookieVersion,
	};
}

export function expandOpenPolicyConfig(config: OpenPolicyConfig): PolicyInput[] {
	const inputs: PolicyInput[] = [];
	const privacy = buildPrivacyInput(config);
	if (privacy) inputs.push(privacy);
	const cookie = buildCookieInput(config);
	if (cookie) inputs.push(cookie);
	return inputs;
}

export function compilePrivacyPolicy(config: OpenPolicyConfig): Document | null {
	const input = buildPrivacyInput(config);
	return input ? compile(input) : null;
}

export function compileCookiePolicy(config: OpenPolicyConfig): Document | null {
	const input = buildCookieInput(config);
	return input ? compile(input) : null;
}
