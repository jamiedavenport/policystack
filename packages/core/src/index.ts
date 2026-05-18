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
	// TS2300 inherited from the v1 base and is dropped here. The AST's
	// `ProvenanceCode` (a different axis: why-a-node-exists, not diagnostics)
	// stays internal to ./documents — nothing outside core consumes it.
} from "./documents";
export {
	AST_VERSION,
	bold,
	cell,
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
	PolicyStackConfig,
	OutputFormat,
	PolicyCategory,
	ProvisionBasis,
	ProvisionRequirement,
	ThirdParty,
	TrackingTechnology,
	UserRight,
} from "./types";
export { isPolicyStackConfig, LAWFUL_BASIS_CONSENT_GATED, isConsentGated } from "./types";
export { Contractual, ContractPrerequisite, Statutory, Voluntary } from "./provision";
export { computeCookieVersion, computePrivacyVersion } from "./policy-version";
export { deriveUserRights } from "./user-rights";
export { validate } from "./validate";
export { deriveConsentMechanism, normalizePolicyStackConfig, seedCompany } from "./normalize";
export { ISSUE_CATALOG } from "./issue-catalog";
export type { IssueExplanation } from "./issue-catalog";
export { createT, isLocale, LOCALES } from "./i18n";
export type { Dictionary, T } from "./i18n";
export { shouldEmit } from "./emit";

import { AST_VERSION, compileCookieDocument, compilePrivacyDocument } from "./documents";
import type { Document } from "./documents";
import { shouldEmit } from "./emit";
import { createT } from "./i18n";
import type { Dictionary } from "./i18n";
import type { PolicyStackConfig } from "./types";

// The two public compile entry points. Each takes the flat, public
// PolicyStackConfig directly — there is no intermediate per-document
// projection. shouldEmit() gates emission; the section builders derive
// userRights / consentMechanism and read privacyVersion / cookieVersion
// straight off the config (the derivations live at their single point of use).
export function compilePrivacyPolicy(
	config: PolicyStackConfig,
	dictionary?: Dictionary,
): Document | null {
	if (!shouldEmit("privacy", config)) return null;
	const t = createT(config.locale ?? "en", dictionary);
	return {
		type: "document",
		astVersion: AST_VERSION,
		policyType: "privacy",
		sections: compilePrivacyDocument(config, t),
	};
}

export function compileCookiePolicy(
	config: PolicyStackConfig,
	dictionary?: Dictionary,
): Document | null {
	if (!shouldEmit("cookie", config)) return null;
	const t = createT(config.locale ?? "en", dictionary);
	return {
		type: "document",
		astVersion: AST_VERSION,
		policyType: "cookie",
		sections: compileCookieDocument(config, t),
	};
}
