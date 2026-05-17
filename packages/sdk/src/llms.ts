import {
	type JurisdictionId,
	JURISDICTION_TABLE,
	LAWFUL_BASIS_CONSENT_GATED,
	type LegalBasis,
	LOCALES,
} from "@openpolicy/core";
import { Compliance } from "./compliance";
import { DataCategories, LegalBases, Retention } from "./data";
import { describeJurisdiction, describeLawfulBasis } from "./describe";
import { Providers } from "./providers";

/**
 * The canonical `llms.txt` SDK reference, **generated from the live SDK and
 * core constants** so it cannot drift from the real API surface (PS-27).
 *
 * One source of truth, shipped three ways:
 *   1. `@openpolicy/sdk` ships `llms.txt` (this function, snapshotted by
 *      `scripts/gen-llms.mjs`; guarded by `llms.test.ts`).
 *   2. `apps/web` serves it at `/sdk.txt` by calling this function.
 *   3. The CLI writes it into the user's project on `init` and points the
 *      agent prompt at that local file.
 *
 * Every enumeration (jurisdictions, lawful bases, locales, the vendor /
 * data-category / retention presets) is derived at call time from the same
 * runtime tables the compiler and validator use — add a jurisdiction or a
 * provider and this document updates with it.
 */
export function renderLlmsTxt(): string {
	// Both row sets are derived from the shared `describe*` helpers — the same
	// source the `policystack mcp` tools use, so the prose cannot drift (PS-29).
	const jurisdictionRows = Object.keys(JURISDICTION_TABLE)
		.sort((a, b) => a.localeCompare(b))
		.map((id) => `- ${describeJurisdiction(id as JurisdictionId).summary}`);

	const lawfulBasisRows = Object.keys(LAWFUL_BASIS_CONSENT_GATED)
		.sort((a, b) => a.localeCompare(b))
		.map((basis) => `- ${describeLawfulBasis(basis as LegalBasis).summary}`);

	const localeList = [...LOCALES]
		.sort()
		.map((l) => `\`${l}\``)
		.join(", ");

	const dataCategoryKeys = Object.keys(DataCategories)
		.sort()
		.map((k) => `\`DataCategories.${k}\``)
		.join(", ");

	const legalBasesKeys = Object.entries(LegalBases)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `\`LegalBases.${k}\` (\`"${v}"\`)`)
		.join(", ");

	const retentionKeys = Object.entries(Retention)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `\`Retention.${k}\` (\`"${v}"\`)`)
		.join(", ");

	const providerKeys = Object.keys(Providers)
		.sort()
		.map((k) => `\`Providers.${k}\``)
		.join(", ");

	const complianceKeys = Object.keys(Compliance)
		.sort()
		.map((k) => `\`Compliance.${k}\``)
		.join(", ");

	return `# PolicyStack SDK reference (llms.txt)

> Generated from \`@openpolicy/sdk\` types — do not edit by hand. Feed this file
> to a coding agent so it can write a correct \`openpolicy.ts\`. One typed
> \`defineConfig()\` call is the single source of truth: it produces the privacy
> policy, the cookie policy, and — via the §4.1 bridge — the consent runtime.

## Entry point

\`\`\`ts
import { defineConfig } from "@openpolicy/sdk";

export default defineConfig({ /* OpenPolicyConfig */ });
\`\`\`

\`defineConfig(config)\` returns the config with \`privacyVersion\` and
\`cookieVersion\` filled in (stable content hashes) unless you set them yourself.
Output only a single \`openpolicy.ts\` — no explanations.

## OpenPolicyConfig shape

Required:

- \`company\`: \`{ name, legalName, address, contact: { email, phone? }, dpo?, euRepresentative? }\`
- \`effectiveDate\`: \`"YYYY-MM-DD"\`
- \`jurisdictions\`: non-empty array of jurisdiction ids (see below)
- \`data\`: \`{ collected, context }\` — the data posture (an empty \`collected\`
  is valid for a brochure site but emits a \`data-collected-empty\` warning)

Optional:

- \`locale\`: one of ${localeList} (default \`"en"\`) — governs only
  OpenPolicy-emitted boilerplate; your own strings pass through untouched
- \`children\`: \`{ underAge: number, noticeUrl? }\`
- \`thirdParties\`: \`{ name, purpose, policyUrl? }[]\`
- \`automatedDecisionMaking\`: \`{ name, logic, significance }[]\` (GDPR Art. 22)
- \`cookies\`: \`{ used, context }\` — see "Cookies & consent" below
- \`trackingTechnologies\`: \`string[]\`
- \`consentMechanism\`: \`{ hasBanner, hasPreferencePanel, canWithdraw }\`
- \`consent\`: runtime-only knobs for the consent banner —
  \`{ adapter?, jurisdictionResolver?, gpc?, initialRoute?, triggers?, onUnknownCategory?, request? }\`.
  The category data (categories, policyVersion, locale, canWithdraw) is **derived**
  from \`cookies\`/\`consentMechanism\`/\`locale\`, NOT authored here.
- \`policies\`: explicit \`("privacy" | "cookie")[]\` opt-out of auto-detection
- \`privacyVersion\` / \`cookieVersion\`: override the auto-computed hash

\`userRights\` is **not** authored — it is derived from \`jurisdictions\`.

## data.collected & data.context (symmetric per-key)

\`data.collected\` maps a human category label to the list of fields collected.
Every category key must have a matching \`data.context\` entry:

\`\`\`ts
data: {
  collected: { "Account Information": ["Name", "Email address"] },
  context: {
    "Account Information": {
      purpose: "Operate your account",
      lawfulBasis: "contract",          // a lawful basis (see below)
      retention: "Until account deletion",
      provision: Contractual("You cannot create an account without it."),
    },
  },
}
\`\`\`

\`provision\` is built with one of the helpers (GDPR Art. 13(2)(e)):
\`Statutory(consequences)\`, \`Contractual(consequences)\`,
\`ContractPrerequisite(consequences)\`, \`Voluntary(consequences)\`.

## Jurisdiction ids (frozen at 1.0)

Pick the codes that apply; the \`us-\${state}\` tail not listed falls back to
\`us\`. Posture and policy-text tier are read straight from the canonical table:

${jurisdictionRows.join("\n")}

## Lawful bases

Used by \`data.context[*].lawfulBasis\` and \`cookies.context[*].lawfulBasis\`.
The consent gating is an explicit, exhaustive table (§4.1) — only \`consent\`
is gated:

${lawfulBasisRows.join("\n")}

## Cookies & consent (the merged surface)

\`cookies.used\` is a flat map; \`essential\` is always \`true\`. Every enabled key
needs a \`cookies.context[key].lawfulBasis\`:

\`\`\`ts
cookies: {
  used: { essential: true, analytics: true, marketing: true },
  context: {
    essential:  { lawfulBasis: "legal_obligation" },
    analytics:  { lawfulBasis: "consent" },
    marketing:  { lawfulBasis: "consent" },
  },
}
\`\`\`

The consent category data is **derived** from this one config, never authored
separately:

- each truthy \`cookies.used\` key → a consent \`Category\`
- \`lawfulBasis === "consent"\` → toggleable; any other basis → \`locked: true\`
  (a missing basis stays gated and \`validate()\` hard-errors it)
- \`cookieVersion\` → \`policyVersion\`; a changed hash re-prompts automatically
- \`consentMechanism.canWithdraw\` → the preferences-route affordance
- \`config.locale\` → the consent UI locale (policy text and banner agree)

Authoring: put runtime-only wiring (storage adapter, jurisdiction resolver,
GPC, …) in the optional \`consent\` block, then pass the whole config to one
provider — \`<PolicyStackProvider config={config}>\` from
\`@openpolicy/react/provider\`. It supplies both the policy context and the
consent store; \`<PrivacyPolicy>\`/\`<CookiePolicy>\`, \`useConsent\`,
\`ConsentGate\` all work underneath it. For non-React frameworks (or advanced
composition), \`toOpenCookiesConfig(config, config.consent)\` from
\`@openpolicy/sdk/consent\` is the same derivation as a standalone primitive.

## Helper exports (from \`@openpolicy/sdk\`)

Static-analysis markers (return their value unchanged; scanned at build time):

- \`collecting(category, value, labels)\` — declare data at the point of storage;
  use \`Ignore\` as a label to exclude a field
- \`sharing(key, recipient, value)\` — record a data-egress edge (the CCPA
  sell/share signal), wrap the outbound payload
- \`thirdParty(name, purpose, policyUrl)\` — declare a vendor exists
- \`defineCookie(category)\` — declare a consent category at its use site

Presets (optional convenience — plain objects/strings, spread or reference):

- Data categories: ${dataCategoryKeys}
- Lawful bases: ${legalBasesKeys}
- Retention: ${retentionKeys}
- Providers: ${providerKeys}
- Compliance bundles: ${complianceKeys}

## Rules

- Output a single \`openpolicy.ts\` calling \`defineConfig()\`. No prose.
- Do not author \`userRights\`, \`privacyVersion\`, or \`cookieVersion\` — derived.
- Every \`data.collected\` / \`cookies.used\` key needs a matching \`context\` entry.
- OpenPolicy generates documents; it is not legal advice — a lawyer should
  review the output before publication.
`;
}
