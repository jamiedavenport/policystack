export type {
	BoldNode,
	ComplianceReason,
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
	TableHeaderCellNode,
	TableHeaderRowNode,
	TableNode,
	TableRowNode,
	TextNode,
	UnknownNode,
	Visitor,
	// `IssueCode` is re-exported once from "./types" (PS-11 froze it there
	// alongside `Issue`); the duplicate "./documents" re-export was a latent
	// TS2300 inherited from the v1 base and is dropped here.
} from "./documents";
export {
	AST_VERSION,
	bold,
	cell,
	compile,
	headerCell,
	headerRow,
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
	visit,
} from "./documents";
export type {
	ConsentModel,
	JurisdictionCapability,
	JurisdictionId,
	JurisdictionTable,
} from "./jurisdiction-id";
export {
	consentModelFor,
	isJurisdictionId,
	JURISDICTION_IDS,
	JURISDICTION_TABLE,
	resolveJurisdiction,
} from "./jurisdiction-id";
export { ISSUE_CODE_IDS, ISSUE_CODES } from "./issue-codes";
export type { IssueEntry } from "./issue-codes";
export { CONTAINER_SLOTS, SLOT_NAMES } from "./slots";
export type { ContainerSlotName, SlotName, SlotNodes } from "./slots";
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
	Issue,
	IssueCode,
	LegalBasis,
	Locale,
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
} from "./types";
export { isOpenPolicyConfig, LAWFUL_BASIS_CONSENT_GATED, isConsentGated } from "./types";
export { Contractual, ContractPrerequisite, Statutory, Voluntary } from "./provision";
export { computeCookieVersion, computePrivacyVersion } from "./policy-version";
export { deriveUserRights } from "./user-rights";
export { validate } from "./validate";
export { ISSUE_CATALOG } from "./issue-catalog";
export type { IssueExplanation } from "./issue-catalog";
export { createT, isLocale, LOCALES } from "./i18n";
export type { Dictionary, T } from "./i18n";

import { compile } from "./documents";
import type { Document } from "./documents";
import type { Dictionary } from "./i18n";
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
		locale: config.locale ?? "en",
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
		locale: config.locale ?? "en",
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

export function compilePrivacyPolicy(
	config: OpenPolicyConfig,
	dictionary?: Dictionary,
): Document | null {
	const input = buildPrivacyInput(config);
	return input ? compile(input, dictionary) : null;
}

export function compileCookiePolicy(
	config: OpenPolicyConfig,
	dictionary?: Dictionary,
): Document | null {
	const input = buildCookieInput(config);
	return input ? compile(input, dictionary) : null;
}
