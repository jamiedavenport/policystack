import type { JurisdictionId } from "./jurisdiction-id";

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

// Stable public diagnostic codes emitted by validate(). Frozen at 1.0 (§6);
// each is one-per-condition. The trailing severity is exactly what validate()
// emits — it stays pure and frozen. Promotion (warnings→errors) and per-code
// suppression are applied downstream by the @openpolicy/vite plugin's
// `strict` / `suppress` options (PS-13), not here.
export type IssueCode =
	| "effective-date-required" //          error   — effectiveDate missing
	| "company-name-required" //            error   — company.name missing
	| "company-legal-name-required" //      error   — company.legalName missing
	| "company-address-required" //         error   — company.address missing
	| "company-contact-required" //         error   — company.contact.email missing
	| "jurisdictions-required" //           error   — jurisdictions empty
	| "jurisdiction-unknown" //             error   — code not a recognised JurisdictionId
	| "locale-unknown" //                   error   — locale not in LOCALES
	| "policy-empty" //                     error   — config produces no policy
	| "policy-cookie-empty" //              error   — policies has "cookie" but cookies unset
	| "data-missing" //                     error   — required data key omitted
	| "data-collected-empty" //             warning — data.collected has no entries
	| "data-context-missing" //             error   — collected category has no context entry
	| "data-context-orphan" //              error   — context entry with no collected match
	| "data-purpose-missing" //             error   — context entry lacks purpose
	| "data-purpose-empty" //               error   — context purpose is blank
	| "lawful-basis-incomplete" //          error   — GDPR Art. 13(1)(c) basis missing
	| "statutory-contractual-obligation" // error   — GDPR Art. 13(2)(e) provision missing/blank
	| "retention-incomplete" //             error   — retention period missing
	| "automated-decision-making" //        warning — GDPR Art. 13(2)(f) not declared
	| "children-under-age-invalid" //       error   — children.underAge not positive
	| "company-dpo-undeclared" //           warning — GDPR Art. 13(1)(b) DPO undeclared
	| "company-contact-phone-recommended" //warning — CCPA §1798.130(a)(1) phone absent
	| "cookies-empty" //                    error   — no cookie category enabled
	| "cookie-lawful-basis-missing" //      error   — enabled cookie lacks lawful basis
	| "consent-mechanism-undeclared" //     warning — consentMechanism absent
	| "consent-withdrawal-required" //      warning — withdrawal not enabled under GDPR/UK
	| "consent-banner-required" //          warning — gated category but consentMechanism.hasBanner false
	| "consent-preference-panel-required" //warning — canWithdraw true but hasPreferencePanel false
	| "jurisdiction-generic-policy-text"; //warning — declared jurisdiction ships only equivalent (parent) policy text

export type Issue = {
	code: IssueCode;
	level: "error" | "warning";
	message: string;
};
