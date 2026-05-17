import type { CookieContextEntry, DataContextEntry, OpenPolicyConfig } from "@openpolicy/core";
import { computeCookieVersion, computePrivacyVersion } from "@openpolicy/core";
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
	Statutory,
	Voluntary,
} from "@openpolicy/core";

export type {
	ScannedCollectionKeys,
	ScannedCookieKeys,
	ScannedSharingKeys,
} from "./auto-collected";
export { collecting, Ignore } from "./collecting";
export { Compliance } from "./compliance";
export { renderLlmsTxt } from "./llms";
export { DataCategories, LegalBases, Retention } from "./data";
export { defineCookie } from "./define-cookie";
export { Providers } from "./providers";
export { sharing } from "./sharing";
export { thirdParty } from "./third-parties";

type ScannedDataKey = keyof ScannedCollectionKeys & string;
type ScannedCookieKey = keyof ScannedCookieKeys & string;

type DataKey<Collected> = Extract<keyof Collected, string> | ScannedDataKey;
type CookieKey<Used> = Extract<keyof Used, string> | ScannedCookieKey;

type OpenPolicyConfigWithGenerics<
	Collected extends Record<string, string[]>,
	CookieUsed extends { essential: true; [k: string]: boolean },
> = Omit<OpenPolicyConfig, "data" | "cookies"> & {
	data: {
		collected: Collected;
		context: { [P in DataKey<Collected>]: DataContextEntry };
	};
	cookies?: {
		used: CookieUsed;
		context: { [P in CookieKey<CookieUsed>]: CookieContextEntry };
	};
};

export function defineConfig<
	Collected extends Record<string, string[]> = Record<string, string[]>,
	CookieUsed extends { essential: true; [k: string]: boolean } = {
		essential: true;
		[k: string]: boolean;
	},
>(config: OpenPolicyConfigWithGenerics<Collected, CookieUsed>): OpenPolicyConfig {
	const resolved = config as OpenPolicyConfig;
	return {
		...resolved,
		privacyVersion: resolved.privacyVersion ?? computePrivacyVersion(resolved),
		cookieVersion: resolved.cookieVersion ?? computeCookieVersion(resolved),
	};
}
