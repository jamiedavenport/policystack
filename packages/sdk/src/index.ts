import type {
	CompanyConfig,
	Contact,
	CookieContextEntry,
	DataContextEntry,
	OpenPolicyConfig,
	ThirdParty,
} from "@openpolicy/core";
import {
	computeCookieVersion,
	computePrivacyVersion,
	normalizeOpenPolicyConfig,
} from "@openpolicy/core";
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
	OpenPolicyConfig,
	PolicyCategory,
	ProvisionBasis,
	ProvisionRequirement,
	ThirdParty,
	TrackingTechnology,
} from "@openpolicy/core";

export {
	computeCookieVersion,
	computePrivacyVersion,
	Contractual,
	ContractPrerequisite,
	createT,
	ISSUE_CATALOG,
	Statutory,
	Voluntary,
} from "@openpolicy/core";
export type { IssueExplanation } from "@openpolicy/core";

export type {
	ScannedCollectionKeys,
	ScannedCookieKeys,
	ScannedSharingKeys,
} from "./auto-collected";
export { collecting, Ignore } from "./collecting";
export { Compliance } from "./compliance";
export { describeJurisdiction, describeLawfulBasis } from "./describe";
export type { JurisdictionDescription, LawfulBasisDescription } from "./describe";
export { renderLlmsTxt } from "./llms";
export { renderSkillPack } from "./skills";
export type { SkillFile } from "./skills";
export { DataCategories, LegalBases, Retention } from "./data";
export { defineCookie } from "./define-cookie";
export { Providers } from "./providers";
export { sharing } from "./sharing";
export { thirdParty } from "./third-parties";

type ScannedDataKey = keyof ScannedCollectionKeys & string;
type ScannedCookieKey = keyof ScannedCookieKeys & string;

type DataKey<Collected> = Extract<keyof Collected, string> | ScannedDataKey;
type CookieKey<Used> = Extract<keyof Used, string> | ScannedCookieKey;

// `name`, `url` and `contact.email` are seeded from the host package.json by
// normalizeOpenPolicyConfig() — optional on input, an explicit value still
// wins. `legalName`/`address` stay required: a package.json cannot supply a
// registered legal entity.
type CompanyInput = Omit<CompanyConfig, "name" | "url" | "contact"> & {
	name?: string;
	url?: string;
	contact?: Partial<Contact>;
};

// The shape of an explicit `import * as scanned from "./openpolicy.gen"`
// passed as the second argument. All optional so the generated namespace
// (which always has every export) is structurally assignable, and so a
// hand-written partial works in tests.
export type ScannedModule = {
	dataCollected?: Record<string, string[]>;
	cookies?: { essential: true; [k: string]: boolean };
	thirdParties?: ThirdParty[];
	sharing?: { key: string; recipient: string }[];
};

type OpenPolicyConfigWithGenerics<
	Collected extends Record<string, string[]>,
	CookieUsed extends { essential: true; [k: string]: boolean },
> = Omit<OpenPolicyConfig, "data" | "cookies" | "company" | "consentMechanism"> & {
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
 * argument — `import * as scanned from "./openpolicy.gen"` — instead of
 * spreading `...dataCollected` / `cookies` / `thirdParties` by hand. The
 * static `import` keeps the gen module's `declare module "@openpolicy/sdk"`
 * augmentation reachable, so scanned categories are still type-required in
 * `data.context`. The returned config is normalized: `consentMechanism` is
 * derived from the cookie posture and `company.{name,url,contact.email}` are
 * seeded from the host package.json (an explicit value always wins).
 */
export function defineConfig<
	Collected extends Record<string, string[]> = Record<string, string[]>,
	CookieUsed extends { essential: true; [k: string]: boolean } = {
		essential: true;
		[k: string]: boolean;
	},
>(
	config: OpenPolicyConfigWithGenerics<Collected, CookieUsed>,
	scanned?: ScannedModule,
): OpenPolicyConfig {
	const resolved = config as OpenPolicyConfig;

	const mergedThirdParties = [...(scanned?.thirdParties ?? []), ...(resolved.thirdParties ?? [])];

	const merged: OpenPolicyConfig = {
		...resolved,
		data: {
			...resolved.data,
			// Manual keys win on collision; scanned keys fill the rest.
			collected: { ...scanned?.dataCollected, ...resolved.data.collected },
		},
		// Keep undefined when empty so the version hash is unchanged for configs
		// that never declared third parties.
		thirdParties: mergedThirdParties.length > 0 ? mergedThirdParties : resolved.thirdParties,
		// Only synthesize a cookies block when the author declared one or the
		// scan found cookies — preserves "no cookies ⇒ no consent runtime".
		cookies:
			resolved.cookies || scanned?.cookies
				? {
						used: {
							...(scanned?.cookies ?? { essential: true }),
							...resolved.cookies?.used,
						},
						context: resolved.cookies?.context ?? {},
					}
				: resolved.cookies,
	};

	const normalized = normalizeOpenPolicyConfig(merged);
	return {
		...normalized,
		privacyVersion: normalized.privacyVersion ?? computePrivacyVersion(normalized),
		cookieVersion: normalized.cookieVersion ?? computeCookieVersion(normalized),
	};
}
