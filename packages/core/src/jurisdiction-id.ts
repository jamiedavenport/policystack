/** Every ISO 3166-2 subdivision for the 50 US states. */
export const US_STATE_JURISDICTION_IDS = [
	"us-al",
	"us-ak",
	"us-az",
	"us-ar",
	"us-ca",
	"us-co",
	"us-ct",
	"us-de",
	"us-fl",
	"us-ga",
	"us-hi",
	"us-id",
	"us-il",
	"us-in",
	"us-ia",
	"us-ks",
	"us-ky",
	"us-la",
	"us-me",
	"us-md",
	"us-ma",
	"us-mi",
	"us-mn",
	"us-ms",
	"us-mo",
	"us-mt",
	"us-ne",
	"us-nv",
	"us-nh",
	"us-nj",
	"us-nm",
	"us-ny",
	"us-nc",
	"us-nd",
	"us-oh",
	"us-ok",
	"us-or",
	"us-pa",
	"us-ri",
	"us-sc",
	"us-sd",
	"us-tn",
	"us-tx",
	"us-ut",
	"us-vt",
	"us-va",
	"us-wa",
	"us-wv",
	"us-wi",
	"us-wy",
] as const;

export type USStateJurisdictionId = (typeof US_STATE_JURISDICTION_IDS)[number];

/**
 * The single canonical jurisdiction identifier across config, validation,
 * policy rendering, and consent. US states use ISO 3166-2 postal stems so a
 * resolver never has to discard state-level privacy capabilities.
 */
export type JurisdictionId =
	| "eea" // European Economic Area — GDPR
	| "uk" // United Kingdom — UK-GDPR + PECR
	| "ch" // Switzerland — revFADP
	| "br" // Brazil — LGPD
	| "ca" // Canada — PIPEDA (+ Quebec Law 25 via sub-jurisdiction)
	| "us" // United States — federal baseline; opt-out by state
	| USStateJurisdictionId
	| "row"; // Rest of world — conservative opt-in fallback

export type JurisdictionCapability = {
	consentModel: "opt-in" | "opt-out";
	policyText: "specific" | "equivalent";
	parent?: JurisdictionId;
	gpcLegallyBinding: boolean;
};

export type JurisdictionTable = Readonly<Record<JurisdictionId, JurisdictionCapability>>;

/** Default consent posture for a jurisdiction. */
export type ConsentModel = "opt-in" | "opt-out";

/** States with an effective requirement to honour qualifying GPC signals. */
const GPC_LEGALLY_BINDING_US_STATE_IDS = new Set<USStateJurisdictionId>([
	"us-ca",
	"us-co",
	"us-ct",
	"us-de",
	"us-md",
	"us-mn",
	"us-mt",
	"us-ne",
	"us-nh",
	"us-nj",
	"us-or",
	"us-tx",
]);

const US_STATE_CAPABILITIES = Object.fromEntries(
	US_STATE_JURISDICTION_IDS.map((id) => [
		id,
		{
			consentModel: "opt-out",
			policyText: id === "us-ca" ? "specific" : "equivalent",
			parent: "us",
			gpcLegallyBinding: GPC_LEGALLY_BINDING_US_STATE_IDS.has(id),
		} satisfies JurisdictionCapability,
	]),
) as Record<USStateJurisdictionId, JurisdictionCapability>;

/** One capability row per canonical jurisdiction. */
export const JURISDICTION_TABLE: JurisdictionTable = {
	eea: { consentModel: "opt-in", policyText: "specific", gpcLegallyBinding: false },
	uk: { consentModel: "opt-in", policyText: "specific", gpcLegallyBinding: false },
	ch: { consentModel: "opt-in", policyText: "equivalent", gpcLegallyBinding: false },
	br: { consentModel: "opt-in", policyText: "equivalent", gpcLegallyBinding: false },
	ca: { consentModel: "opt-in", policyText: "equivalent", gpcLegallyBinding: false },
	us: { consentModel: "opt-out", policyText: "equivalent", gpcLegallyBinding: false },
	...US_STATE_CAPABILITIES,
	row: { consentModel: "opt-in", policyText: "equivalent", gpcLegallyBinding: false },
};

const JURISDICTION_IDS = Object.keys(JURISDICTION_TABLE) as readonly JurisdictionId[];

// Accepts `unknown` (symmetric with `isLocale`) so callers validating raw
// input — e.g. a persisted consent record — can guard in one call.
export function isJurisdictionId(value: unknown): value is JurisdictionId {
	return typeof value === "string" && Object.hasOwn(JURISDICTION_TABLE, value);
}

/** Whether a value is one of the 50 canonical US state jurisdiction ids. */
export function isUSStateJurisdictionId(value: unknown): value is USStateJurisdictionId {
	return (
		typeof value === "string" &&
		value.startsWith("us-") &&
		Object.hasOwn(US_STATE_CAPABILITIES, value)
	);
}

/**
 * Map an arbitrary declared code onto a canonical id, or `null` if it is not a
 * jurisdiction we recognise. Exact table hit → that id. An unknown
 * `us-${string}` subdivision falls back to its parent `us`; anything else is
 * unknown.
 */
export function resolveJurisdiction(code: string): JurisdictionId | null {
	if (isJurisdictionId(code)) return code;
	if (code.startsWith("us-")) return "us";
	return null;
}

/** The configured consent posture for a canonical jurisdiction. */
export function consentModelFor(id: JurisdictionId): ConsentModel {
	return JURISDICTION_TABLE[id].consentModel;
}

export { JURISDICTION_IDS };
