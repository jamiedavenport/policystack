import type { IssueCode } from "./types";

/**
 * The static, agent-facing explanation for one {@link IssueCode}. `validate()`
 * still emits its own *contextual* `message` (interpolated with the offending
 * key) — this is the stable, config-independent summary + remediation an agent
 * reads to act on a code, surfaced by the `explain_issue` MCP tool (PS-29).
 *
 * `level` mirrors exactly what `validate()` emits for the code; it is repeated
 * here so the catalog is self-contained (the MCP tool never has to run a
 * validation to know whether a code is fatal).
 */
export type IssueExplanation = {
	level: "error" | "warning";
	summary: string;
	fix: string;
};

/**
 * Frozen explanation table for every {@link IssueCode} (§6 freeze, PS-29).
 *
 * This is the **no-drift guard**: the `Record<IssueCode, …>` literal is
 * compiler-exhaustive, so adding or removing an `IssueCode` without updating
 * this table is a type error (the same mechanism the frozen `Visitor<R>` map
 * uses). `Object.keys(ISSUE_CATALOG)` is therefore the canonical *runtime*
 * enumeration of issue codes — the MCP `explain_issue` tool builds its accepted
 * enum from it, and a drift test pins it to the live union.
 *
 * `validate()` is deliberately **not** rewired to source its messages from
 * here: it stays the pure, frozen validator (PS-11/PS-13). `summary` mirrors
 * the trailing `//` annotation on the `IssueCode` union; `fix` is the
 * actionable remediation distilled from the validator's own message.
 */
export const ISSUE_CATALOG: Record<IssueCode, IssueExplanation> = {
	"effective-date-required": {
		level: "error",
		summary: "effectiveDate is missing.",
		fix: "Set `effectiveDate` to the policy's effective date as a `YYYY-MM-DD` string.",
	},
	"company-name-required": {
		level: "error",
		summary: "company.name is missing.",
		fix: "Set `company.name` to the public-facing name of the entity.",
	},
	"company-legal-name-required": {
		level: "error",
		summary: "company.legalName is missing.",
		fix: "Set `company.legalName` to the registered legal entity name.",
	},
	"company-address-required": {
		level: "error",
		summary: "company.address is missing.",
		fix: "Set `company.address` to the company's registered postal address.",
	},
	"company-contact-required": {
		level: "error",
		summary: "company.contact.email is missing.",
		fix: "Set `company.contact.email` to a monitored privacy contact address.",
	},
	"jurisdictions-required": {
		level: "error",
		summary: "jurisdictions is empty.",
		fix: "Add at least one jurisdiction id to `jurisdictions` (see the `explain_jurisdiction` tool for valid codes).",
	},
	"jurisdiction-unknown": {
		level: "error",
		summary: "A jurisdictions entry is not a recognised JurisdictionId.",
		fix: "Replace it with a valid jurisdiction id; an unlisted `us-<state>` code falls back to `us`.",
	},
	"locale-unknown": {
		level: "error",
		summary: "locale is not one of the supported LOCALES.",
		fix: "Set `locale` to a supported locale, or omit it to default to `en`.",
	},
	"policy-empty": {
		level: "error",
		summary: "The config produces no policy at all.",
		fix: "Provide data-handling fields (`data`, `children`) or `cookies` so at least one policy is emitted.",
	},
	"policy-cookie-empty": {
		level: "error",
		summary: 'policies includes "cookie" but cookies is unset.',
		fix: 'Add a `cookies` block, or remove `"cookie"` from `policies`.',
	},
	"data-missing": {
		level: "error",
		summary: "data is required (a privacy policy is emitted) but omitted.",
		fix: "Add a `data` block; use an empty `data.collected` for a site that collects nothing.",
	},
	"data-collected-empty": {
		level: "warning",
		summary: "data.collected has no entries.",
		fix: "Add the collected categories if the site does collect personal data; otherwise the policy states none is collected.",
	},
	"data-context-missing": {
		level: "error",
		summary: "A collected category has no matching data.context entry.",
		fix: "Add `data.context[category]` with purpose, lawful basis, retention, and provision.",
	},
	"data-context-orphan": {
		level: "error",
		summary: "A data.context entry has no matching data.collected category.",
		fix: "Remove the orphan context entry, or declare its collected fields in `data.collected`.",
	},
	"data-purpose-missing": {
		level: "error",
		summary: "A data.context entry lacks a purpose (GDPR Art. 13(1)(c)).",
		fix: "Set `data.context[category].purpose` to the processing purpose.",
	},
	"data-purpose-empty": {
		level: "error",
		summary: "A data.context purpose is blank.",
		fix: "Set `data.context[category].purpose` to a non-empty string.",
	},
	"lawful-basis-incomplete": {
		level: "error",
		summary: "A collected category lacks an Article 6 lawful basis (GDPR Art. 13(1)(c)).",
		fix: "Set `data.context[category].lawfulBasis` to an Article 6 lawful basis (see the `explain_jurisdiction`/lawful-basis reference).",
	},
	"statutory-contractual-obligation": {
		level: "error",
		summary: "GDPR Art. 13(2)(e) provision disclosure is missing or has empty consequences.",
		fix: "Set `data.context[category].provision` with Statutory/Contractual/ContractPrerequisite/Voluntary and non-empty consequences.",
	},
	"retention-incomplete": {
		level: "error",
		summary: "A collected category has no retention period.",
		fix: "Set `data.context[category].retention` to a non-empty retention period.",
	},
	"automated-decision-making": {
		level: "warning",
		summary: "GDPR Art. 13(2)(f) automated decision-making is not declared.",
		fix: "Set `automatedDecisionMaking: []` to declare none, or list each activity with its logic and significance.",
	},
	"children-under-age-invalid": {
		level: "error",
		summary: "children.underAge is not a positive number.",
		fix: "Set `children.underAge` to a positive integer.",
	},
	"company-dpo-undeclared": {
		level: "warning",
		summary: "GDPR Art. 13(1)(b) Data Protection Officer contact is undeclared.",
		fix: "Set `company.dpo`, or `company.dpo = { required: false }` to declare none is needed.",
	},
	"company-contact-phone-recommended": {
		level: "warning",
		summary: "CCPA §1798.130(a)(1) toll-free phone is absent (us-ca declared).",
		fix: "Set `company.contact.phone`, unless you operate exclusively online.",
	},
	"cookies-empty": {
		level: "error",
		summary: "No cookie category is enabled.",
		fix: "Enable at least one cookie type in `cookies.used` (essential, analytics, functional, or marketing).",
	},
	"cookie-lawful-basis-missing": {
		level: "error",
		summary: "An enabled cookie category lacks a lawful basis.",
		fix: "Set `cookies.context[key].lawfulBasis` for every enabled cookie category.",
	},
	"consent-mechanism-undeclared": {
		level: "warning",
		summary: "consentMechanism is absent.",
		fix: "Add a `consentMechanism` describing how users manage cookie consent.",
	},
	"consent-withdrawal-required": {
		level: "warning",
		summary: "Consent withdrawal is not enabled under GDPR/UK scope.",
		fix: "Set `consentMechanism.canWithdraw` to true.",
	},
	"consent-banner-required": {
		level: "warning",
		summary: "A consent-gated category exists but consentMechanism.hasBanner is false.",
		fix: "Set `consentMechanism.hasBanner` to true so affirmative consent can be collected.",
	},
	"consent-preference-panel-required": {
		level: "warning",
		summary: "canWithdraw is true but hasPreferencePanel is false.",
		fix: "Set `consentMechanism.hasPreferencePanel` to true so withdrawal has a panel.",
	},
	"jurisdiction-generic-policy-text": {
		level: "warning",
		summary:
			"A declared jurisdiction ships only equivalent (parent) policy text, not hand-authored specific text.",
		fix: "Acceptable if the equivalent tier suffices; otherwise pick a jurisdiction supported at the specific tier (see the `explain_jurisdiction` tool).",
	},
};
