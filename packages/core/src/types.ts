import type { JurisdictionId } from "./jurisdiction-id";
// MUST stay `import type` — it is erased to zero JS, so the `.` (compiler)
// bundle never pulls the consent runtime. See packages/core/vite.config.ts:
// `.` ⊥ `./consent` is the deliberate tree-shake split. Promoting this to a
// value import would break it.
import type { OpenPolicyConsentConfig } from "./consent/types";

export type OutputFormat = "markdown" | "html" | "pdf";

export type CompileOptions = { formats: OutputFormat[] };

export type PolicyCategory = "privacy" | "cookie";

// Languages OpenPolicy knows how to emit. User-supplied strings (company name,
// purposes, retention text, etc.) pass through untouched in whatever language
// the caller wrote them — this union only governs the strings OpenPolicy itself
// emits (headings, boilerplate, lookup-table labels).
export type Locale = "en" | "fr" | "de" | "nl" | "es";

export type UserRight =
	| "access"
	| "rectification"
	| "erasure"
	| "portability"
	| "restriction"
	| "objection"
	| "opt_out_sale"
	| "non_discrimination";

export type LegalBasis =
	| "consent"
	| "contract"
	| "legal_obligation"
	| "vital_interests"
	| "public_task"
	| "legitimate_interests";

// The explicit shared-config bridge (§4.1): a total, compiler-checked mapping
// from every Article 6 lawful basis to whether a category built on it is
// consent-gated. `Record<LegalBasis, …>` makes omitting a basis a type error,
// so this is a reviewable table rather than a lossy string heuristic. Only
// `consent` is gated; every other basis is a standing legal ground that does
// not require (and cannot be revoked by) a consent decision.
export const LAWFUL_BASIS_CONSENT_GATED: Record<LegalBasis, boolean> = {
	consent: true,
	contract: false,
	legal_obligation: false,
	vital_interests: false,
	public_task: false,
	legitimate_interests: false,
};

// A missing basis is treated as gated — the privacy-safe default for a config
// the bridge may run before validation (validate() hard-errors a missing basis
// via `cookie-lawful-basis-missing`).
export function isConsentGated(basis: LegalBasis | undefined): boolean {
	return basis == null ? true : LAWFUL_BASIS_CONSENT_GATED[basis];
}

// GDPR Art. 13(2)(f) requires disclosing each automated-decision-making
// or profiling activity (Art. 22) — the existence, the logic involved,
// and the significance and envisaged consequences for the data subject.
export type AutomatedDecision = {
	name: string;
	logic: string;
	significance: string;
};

export type AutomatedDecisionMaking = AutomatedDecision[];

export type Dpo =
	| { email: string; name?: string; phone?: string; address?: string }
	| { required: false; reason?: string };

// Art. 27 GDPR designated representative — required for non-EEA controllers
// subject to GDPR via Art. 3(2). Optional because EEA-established controllers
// do not need to designate one.
export type EuRepresentative = {
	name: string;
	address: string;
	email: string;
};

export type Contact = {
	email: string;
	phone?: string;
};

export type CompanyConfig = {
	name: string;
	legalName: string;
	address: string;
	contact: Contact;
	dpo?: Dpo;
	euRepresentative?: EuRepresentative;
};

export type EffectiveDate = `${number}-${number}-${number}`;

export type DataCollection = Record<string, string[]>;

// GDPR Art. 13(2)(e) — for each collected category, disclose whether
// provision of the data is required, and the consequences of failing to
// provide it.
export type ProvisionBasis =
	| "statutory" //              Required by law (e.g. tax record-keeping)
	| "contractual" //            Required under an existing contract
	| "contract-prerequisite" //  Necessary to enter into a contract
	| "voluntary"; //             Optional — provision is not required

export type ProvisionRequirement = {
	basis: ProvisionBasis;
	consequences: string;
};

// One row of per-category metadata. Every key in `data.collected` carries
// a matching `data.context[category]` entry so the renderers can pull
// purpose, lawful basis, retention, and provision disclosure together.
export type DataContextEntry = {
	purpose: string;
	lawfulBasis: LegalBasis;
	retention: string;
	provision: ProvisionRequirement;
};

export type DataContext = Record<string, DataContextEntry>;

export type DataConfig = {
	collected: DataCollection;
	context: DataContext;
};

export type ThirdParty = { name: string; purpose: string; policyUrl?: string };

export type ChildrenConfig = {
	underAge: number;
	noticeUrl?: string;
};

export type CookieUsage = {
	essential: true;
	[key: string]: boolean;
};

export type CookieContextEntry = {
	lawfulBasis: LegalBasis;
};

export type CookieContext = Record<string, CookieContextEntry>;

export type CookiePolicyCookies = {
	used: CookieUsage;
	context: CookieContext;
};

export type TrackingTechnology = string;

export type ConsentMechanism = {
	hasBanner: boolean;
	hasPreferencePanel: boolean;
	canWithdraw: boolean;
};

// Internal type consumed by section builders via PolicyInput.
// Produced by expandOpenPolicyConfig() — not part of the public API.
export type PrivacyPolicyConfig = {
	effectiveDate: EffectiveDate;
	locale: Locale;
	company: CompanyConfig;
	data: DataConfig;
	cookies: CookiePolicyCookies;
	thirdParties: ThirdParty[];
	userRights: UserRight[];
	jurisdictions: JurisdictionId[];
	children?: ChildrenConfig;
	automatedDecisionMaking?: AutomatedDecisionMaking;
	version?: string;
};

// Internal type consumed by section builders via PolicyInput.
// Produced by expandOpenPolicyConfig() — not part of the public API.
export type CookiePolicyConfig = {
	effectiveDate: EffectiveDate;
	locale: Locale;
	company: CompanyConfig;
	cookies: CookiePolicyCookies;
	thirdParties: ThirdParty[];
	trackingTechnologies?: TrackingTechnology[];
	consentMechanism?: ConsentMechanism;
	jurisdictions: JurisdictionId[];
	version?: string;
};

export type PolicyInput =
	| ({ type: "privacy" } & PrivacyPolicyConfig)
	| ({ type: "cookie" } & CookiePolicyConfig);

// Public config passed to defineConfig(). All fields live at the top level.
export type OpenPolicyConfig = {
	company: CompanyConfig;
	effectiveDate: EffectiveDate;
	jurisdictions: JurisdictionId[];

	// Language for OpenPolicy-emitted strings. Defaults to "en" when omitted.
	locale?: Locale;

	// Data handling — feeds the privacy policy. Required: every config must
	// declare its data posture. An empty `data.collected` is valid (e.g. a
	// plain landing page) but surfaces a `data-collected-empty` warning.
	data: DataConfig;
	children?: ChildrenConfig;
	thirdParties?: ThirdParty[];
	automatedDecisionMaking?: AutomatedDecisionMaking;

	// Cookie posture — feeds the cookie policy and the privacy cookie-overview section.
	cookies?: CookiePolicyCookies;
	trackingTechnologies?: TrackingTechnology[];
	consentMechanism?: ConsentMechanism;

	// Runtime-only consent knobs (storage adapter, jurisdiction resolver, GPC,
	// triggers, …). Authored here so policy + consent are ONE config; the
	// consent banner's category data is derived from `cookies`, not duplicated
	// here. Excluded from the version hash by construction (policy-version.ts
	// hashes an explicit field allowlist) so swapping an adapter never churns
	// privacyVersion/cookieVersion, and ignored by validate()/compile/llms —
	// this is runtime wiring, not document content.
	consent?: OpenPolicyConsentConfig;

	// Explicit opt-out. Omit to auto-detect based on which fields are present.
	policies?: PolicyCategory[];

	// Stable per-document version. Omit to have defineConfig() hash the relevant
	// config slice automatically; provide a string to override (e.g. "v3").
	privacyVersion?: string;
	cookieVersion?: string;
};

export function isOpenPolicyConfig(value: unknown): value is OpenPolicyConfig {
	if (value === null || typeof value !== "object") return false;
	const obj = value as Record<string, unknown>;
	return "company" in obj && "effectiveDate" in obj && !("type" in obj);
}

// The stable public diagnostic codes and the `Issue` shape live in their own
// module so the union can be *derived from* a runtime registry (PS-32) instead
// of hand-maintained twice. Still frozen at 1.0 (§6); re-exported here so the
// historical `@openpolicy/core` "./types" import path is unchanged (PS-11).
export type { Issue, IssueCode } from "./issue-codes";
