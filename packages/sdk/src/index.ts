import type {
	CompanyConfig,
	Contact,
	CookieContextEntry,
	CookieUsage,
	DataContextEntry,
	PolicyStackConfig,
	ThirdParty,
} from "@policystack/core";
import { normalizePolicyStackConfig } from "@policystack/core";
import type { ScannedCollectionKeys, ScannedCookieKeys } from "./auto-collected";

export type {
	AutomatedDecision,
	AutomatedDecisionMaking,
	ChildrenConfig,
	CompanyConfig,
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
	Dictionary,
	Dpo,
	EffectiveDate,
	EuRepresentative,
	JurisdictionId,
	LegalBasis,
	Locale,
	PolicyStackConfig,
	PolicyCategory,
	ProvisionBasis,
	ProvisionRequirement,
	ThirdParty,
	TrackingTechnology,
} from "@policystack/core";

export {
	computeCookieVersion,
	computePrivacyVersion,
	Contractual,
	ContractPrerequisite,
	createT,
	ISSUE_CATALOG,
	Statutory,
	Voluntary,
} from "@policystack/core";
export type { IssueExplanation } from "@policystack/core";

export type {
	ScannedCollectionKeys,
	ScannedCookieKeys,
	ScannedSharingKeys,
} from "./auto-collected";
export { Compliance } from "./compliance";
export { DataCategories, LegalBases, Retention } from "./data";
export { describeJurisdiction, describeLawfulBasis } from "./describe";
export type { JurisdictionDescription, LawfulBasisDescription } from "./describe";
export { renderLlmsTxt } from "./llms";
export { collecting, defineCookie, Ignore, sharing, thirdParty } from "./markers";
export { Providers } from "./providers";
export { renderSkillPack } from "./skills";
export type { SkillFile } from "./skills";

type ScannedDataKey = keyof ScannedCollectionKeys & string;
type ScannedCookieKey = keyof ScannedCookieKeys & string;

type DataKey<Collected> = Extract<keyof Collected, string> | ScannedDataKey;
type CookieKey<Used> = Extract<keyof Used, string> | ScannedCookieKey;

// `name`, `url` and `contact.email` are seeded from the host package.json by
// normalizePolicyStackConfig() — optional on input, an explicit value still
// wins. `legalName`/`address` stay required: a package.json cannot supply a
// registered legal entity.
type CompanyInput = Omit<CompanyConfig, "name" | "url" | "contact"> & {
	name?: string;
	url?: string;
	contact?: Partial<Contact>;
};

// The shape of an explicit `import * as scanned from "./policystack.gen"`
// passed as the second argument. All optional so the generated namespace
// (which always has every export) is structurally assignable, and so a
// hand-written partial works in tests. `sharing` edges are intentionally
// absent: they are consumed by `@policystack/vite`'s declared-vs-used
// cross-check via the `ScannedSharingKeys` typed seam, never by defineConfig.
export type ScannedModule = {
	dataCollected?: Record<string, string[]>;
	cookies?: CookieUsage;
	thirdParties?: ThirdParty[];
};

type PolicyStackConfigWithGenerics<
	Collected extends Record<string, string[]>,
	CookieUsed extends CookieUsage,
> = Omit<PolicyStackConfig, "data" | "cookies" | "company" | "consentMechanism"> & {
	// `consentMechanism` is omitted entirely: it is DERIVED from the cookie
	// posture so it can no longer be a lie.
	company: CompanyInput;
	data: {
		collected: Collected;
		context: { [P in DataKey<Collected>]: DataContextEntry };
	};
	cookies?: {
		// `used` is optional — scanned cookie categories are merged in from the
		// gen module by defineConfig, so the author need not restate them.
		used?: CookieUsed;
		context: { [P in CookieKey<CookieUsed>]: CookieContextEntry };
	};
};

/**
 * The canonical config entrypoint. Pass scanned data as the optional second
 * argument — `import * as scanned from "./policystack.gen"` — instead of
 * spreading `...dataCollected` / `cookies` / `thirdParties` by hand. The
 * static `import` keeps the gen module's `declare module "@policystack/sdk"`
 * augmentation reachable, so scanned categories are still type-required in
 * `data.context`. The returned config is normalized by
 * {@link normalizePolicyStackConfig}: `company.{name,url,contact.email}` are
 * seeded from the host package.json (an explicit value always wins),
 * `consentMechanism` is derived from the cookie posture, and
 * `privacyVersion`/`cookieVersion` are filled with stable content hashes
 * unless set explicitly.
 */
export function defineConfig<
	Collected extends Record<string, string[]> = Record<string, string[]>,
	CookieUsed extends CookieUsage = CookieUsage,
>(
	config: PolicyStackConfigWithGenerics<Collected, CookieUsed>,
	scanned?: ScannedModule,
): PolicyStackConfig {
	const mergedThirdParties = [...(scanned?.thirdParties ?? []), ...(config.thirdParties ?? [])];

	// The authoring type is structurally a `PolicyStackConfig` except for two
	// deliberate gaps, both closed before this object is observed:
	//   - `company` may omit the package.json-seeded fields →
	//     normalizePolicyStackConfig() seeds them;
	//   - `cookies.used` is optional → the branch below always materializes it.
	// This is the single, localized assertion bridging the two.
	const merged = {
		...config,
		data: {
			...config.data,
			// Manual keys win on collision; scanned keys fill the rest.
			collected: { ...scanned?.dataCollected, ...config.data.collected },
		},
		// Keep undefined when empty so the version hash is unchanged for configs
		// that never declared third parties.
		thirdParties: mergedThirdParties.length > 0 ? mergedThirdParties : config.thirdParties,
		// Only synthesize a cookies block when the author declared one or the
		// scan found cookies — preserves "no cookies ⇒ no consent runtime".
		cookies:
			config.cookies || scanned?.cookies
				? {
						used: {
							...(scanned?.cookies ?? { essential: true }),
							...config.cookies?.used,
						},
						context: config.cookies?.context ?? {},
					}
				: config.cookies,
	} as PolicyStackConfig;

	// The single normalization seam: company seeding, consentMechanism
	// derivation, and privacy/cookie version fill all live there so defineConfig
	// and validate() observe one internally-consistent config.
	return normalizePolicyStackConfig(merged);
}
