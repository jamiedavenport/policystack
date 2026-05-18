/**
 * The single registry of stable public diagnostic codes emitted by validate().
 * **Frozen at 1.0 (§6)**: one entry per condition. `IssueCode` is *derived
 * from* this array (`(typeof ISSUE_CODES)[number]["code"]`) so the runtime list
 * and the type can never diverge — adding or removing a code is one edit here
 * and every drift-checked artifact (the generated `llms.txt`, the AI skill
 * pack) moves with it. PS-11 froze `IssueCode`/`Issue`; PS-32 makes the list
 * runtime-readable so a skill can enumerate and explain codes without drift.
 *
 * `level` is exactly what validate() emits — it stays pure and frozen.
 * Promotion (warnings→errors) and per-code suppression are applied downstream
 * by the @openpolicy/vite plugin's `strict` / `suppress` options (PS-13), not
 * here.
 *
 * `summary` is the durable, context-free description of the *rule* — what an
 * agent shows when explaining a code (the `policystack-audit` skill, PS-32).
 * validate() additionally emits an instance-specific `message` (which category,
 * which field); this is the stable description of the underlying requirement.
 */
export const ISSUE_CODES = [
	{
		code: "effective-date-required",
		level: "error",
		summary: "`effectiveDate` is required.",
	},
	{
		code: "company-name-required",
		level: "error",
		summary: "`company.name` is required.",
	},
	{
		code: "company-legal-name-required",
		level: "error",
		summary: "`company.legalName` is required.",
	},
	{
		code: "company-address-required",
		level: "error",
		summary: "`company.address` is required.",
	},
	{
		code: "company-contact-required",
		level: "error",
		summary: "`company.contact.email` is required.",
	},
	{
		code: "jurisdictions-required",
		level: "error",
		summary: "`jurisdictions` must list at least one jurisdiction id.",
	},
	{
		code: "jurisdiction-unknown",
		level: "error",
		summary: "A declared jurisdiction code is not a recognised `JurisdictionId`.",
	},
	{
		code: "locale-unknown",
		level: "error",
		summary: "`locale` is not one of the supported `LOCALES`.",
	},
	{
		code: "policy-empty",
		level: "error",
		summary:
			"The config produces no policy — add data-handling fields (`data`, `children`) or a `cookies` block.",
	},
	{
		code: "policy-cookie-empty",
		level: "error",
		summary: '`policies` includes "cookie" but no `cookies` block is set.',
	},
	{
		code: "data-missing",
		level: "error",
		summary:
			"`data` is required when a privacy policy is emitted — use an empty `data.collected` for a site that collects nothing.",
	},
	{
		code: "data-collected-empty",
		level: "warning",
		summary:
			"`data.collected` has no entries — the privacy policy will state that no personal data is collected.",
	},
	{
		code: "data-context-missing",
		level: "error",
		summary:
			"A collected category has no matching `data.context` entry (purpose, lawful basis, retention, provision).",
	},
	{
		code: "data-context-orphan",
		level: "error",
		summary: "A `data.context` entry has no matching category in `data.collected`.",
	},
	{
		code: "data-purpose-missing",
		level: "error",
		summary: "A `data.context` entry is missing its processing `purpose` (GDPR Art. 13(1)(c)).",
	},
	{
		code: "data-purpose-empty",
		level: "error",
		summary: "A `data.context` `purpose` is present but blank.",
	},
	{
		code: "lawful-basis-incomplete",
		level: "error",
		summary:
			"Under GDPR/UK-GDPR a collected category is missing its Article 6 `lawfulBasis` (Art. 13(1)(c)).",
	},
	{
		code: "statutory-contractual-obligation",
		level: "error",
		summary:
			"Under GDPR/UK-GDPR a category is missing the Art. 13(2)(e) `provision` (statutory / contractual / contract-prerequisite / voluntary) or its consequences.",
	},
	{
		code: "retention-incomplete",
		level: "error",
		summary: "A collected category is missing a `retention` period.",
	},
	{
		code: "automated-decision-making",
		level: "warning",
		summary:
			"Under GDPR/UK-GDPR `automatedDecisionMaking` is not declared (Art. 13(2)(f) / Art. 22) — set `[]` for none or list each activity.",
	},
	{
		code: "children-under-age-invalid",
		level: "error",
		summary: "`children.underAge` must be a positive number.",
	},
	{
		code: "company-dpo-undeclared",
		level: "warning",
		summary:
			"Under GDPR/UK-GDPR `company.dpo` is not declared (Art. 13(1)(b)) — set it, or `{ required: false }` to declare none.",
	},
	{
		code: "company-contact-phone-recommended",
		level: "warning",
		summary:
			"With a California (`us-ca`) jurisdiction, `company.contact.phone` is absent — CCPA §1798.130(a)(1) expects a toll-free number unless you operate exclusively online.",
	},
	{
		code: "cookies-empty",
		level: "error",
		summary: "No cookie category is enabled in `cookies.used`.",
	},
	{
		code: "cookie-lawful-basis-missing",
		level: "error",
		summary:
			"An enabled cookie category is missing its Article 6 `lawfulBasis` in `cookies.context`.",
	},
	{
		code: "consent-mechanism-undeclared",
		level: "warning",
		summary:
			"No enabled cookie category is consent-gated, so no consent mechanism is generated (correct for strictly-necessary cookies only).",
	},
	{
		code: "consent-withdrawal-required",
		level: "warning",
		summary:
			"Under GDPR/UK-GDPR users must be able to withdraw cookie consent — set `consentMechanism.canWithdraw`.",
	},
	{
		code: "consent-banner-required",
		level: "warning",
		summary:
			"A cookie category is consent-gated but `consentMechanism.hasBanner` is false — a banner is needed to collect affirmative consent.",
	},
	{
		code: "consent-preference-panel-required",
		level: "warning",
		summary:
			"`consentMechanism.canWithdraw` is true but `hasPreferencePanel` is false — withdrawal has no preference panel in the wired runtime.",
	},
	{
		code: "jurisdiction-generic-policy-text",
		level: "warning",
		summary:
			'A declared jurisdiction is supported only at the "equivalent" tier (posture-correct + parent text), not hand-authored "specific" text.',
	},
] as const satisfies readonly {
	code: string;
	level: "error" | "warning";
	summary: string;
}[];

/** One registry row: a stable code, the severity validate() emits, and the durable rule summary. */
export type IssueEntry = (typeof ISSUE_CODES)[number];

/**
 * The frozen public diagnostic codes. Derived from {@link ISSUE_CODES} so the
 * type cannot drift from the runtime list.
 */
export type IssueCode = IssueEntry["code"];

/** The codes alone, in registry order — a runtime peer of `JURISDICTION_IDS`. */
export const ISSUE_CODE_IDS = ISSUE_CODES.map((e) => e.code) as readonly IssueCode[];

/**
 * A single validation finding. `code`/`level` are the frozen surface agents
 * branch on; `message` is the instance-specific detail validate() composes.
 */
export type Issue = {
	code: IssueCode;
	level: "error" | "warning";
	message: string;
};
