/**
 * The single canonical jurisdiction identifier, **frozen at 1.0**.
 *
 * Eleven members, decided in the v1 architecture plan (§4.2.1). The union
 * *membership* is the frozen part — a member's support tier (`specific` vs
 * `equivalent`) may be upgraded post-1.0 without a breaking change. Stems are
 * lowercase-kebab and legally precise (`eea`, not `eu`: GDPR applies EEA-wide).
 *
 * This is the **sole** jurisdiction id across the stack — config, validator,
 * and the AST `ComplianceReason` all speak it. There is no second enum and no
 * migration alias (clean cutover; see ADR 0001).
 */
export type JurisdictionId =
	| "eea" //   European Economic Area — GDPR
	| "uk" //    United Kingdom — UK-GDPR + PECR
	| "ch" //    Switzerland — revFADP
	| "br" //    Brazil — LGPD
	| "ca" //    Canada — PIPEDA (+ Quebec Law 25 via sub-jurisdiction)
	| "us" //    United States — federal baseline; opt-out by state
	| "us-ca" // California — CCPA / CPRA
	| "us-co" // Colorado — CPA
	| "us-ct" // Connecticut — CTDPA
	| "us-va" // Virginia — VCDPA
	| "row"; //  Rest of world — conservative opt-in fallback

/**
 * One row per jurisdiction — the single seam every axis reads (§4.2.1). Adding
 * a jurisdiction is one row, not edits in four places.
 */
export type JurisdictionCapability = {
	consentModel: "opt-in" | "opt-out"; //    §4.2 posture axis — table data only in PS-14; PS-24 wires the resolver
	policyText: "specific" | "equivalent"; // honesty flag — read by the validator, not the renderer
	parent?: JurisdictionId; //               sub-jurisdiction text/posture inheritance (the US state tail)
	gpcLegallyBinding: boolean; //            GPC is always a *signal*; this is whether it carries legal force
};

export type JurisdictionTable = Readonly<Record<JurisdictionId, JurisdictionCapability>>;

/** §4.2 default consent posture for a jurisdiction. */
export type ConsentModel = "opt-in" | "opt-out";

/**
 * 3 `specific` (hand-authored: `eea`, `uk`, `us-ca`) + 8 `equivalent`
 * (posture-correct + parent text + a suppressible diagnostic — a legitimate,
 * shippable v1 tier). `consentModel` per §4.2; `gpcLegallyBinding` per the
 * §4.2 authoritative set `["US-CA","US-CO","US-CT","US-VA"]`.
 */
export const JURISDICTION_TABLE: JurisdictionTable = {
	eea: { consentModel: "opt-in", policyText: "specific", gpcLegallyBinding: false },
	uk: { consentModel: "opt-in", policyText: "specific", gpcLegallyBinding: false },
	ch: { consentModel: "opt-in", policyText: "equivalent", gpcLegallyBinding: false },
	br: { consentModel: "opt-in", policyText: "equivalent", gpcLegallyBinding: false },
	ca: { consentModel: "opt-in", policyText: "equivalent", gpcLegallyBinding: false },
	us: { consentModel: "opt-out", policyText: "equivalent", gpcLegallyBinding: false },
	"us-ca": {
		consentModel: "opt-out",
		policyText: "specific",
		parent: "us",
		gpcLegallyBinding: true,
	},
	"us-co": {
		consentModel: "opt-out",
		policyText: "equivalent",
		parent: "us",
		gpcLegallyBinding: true,
	},
	"us-ct": {
		consentModel: "opt-out",
		policyText: "equivalent",
		parent: "us",
		gpcLegallyBinding: true,
	},
	"us-va": {
		consentModel: "opt-out",
		policyText: "equivalent",
		parent: "us",
		gpcLegallyBinding: true,
	},
	row: { consentModel: "opt-in", policyText: "equivalent", gpcLegallyBinding: false },
};

const JURISDICTION_IDS = Object.keys(JURISDICTION_TABLE) as readonly JurisdictionId[];

export function isJurisdictionId(value: string): value is JurisdictionId {
	return Object.hasOwn(JURISDICTION_TABLE, value);
}

/**
 * Map an arbitrary declared code onto a canonical id, or `null` if it is not a
 * jurisdiction we recognise. Exact table hit → that id. The 2025 US state-law
 * tail (`us-${string}` not itself in the table, e.g. `us-fl`) falls back to
 * its parent `us` (opt-out) — breadth without enumerating the long tail
 * (§4.2.1). Anything else is unknown.
 */
export function resolveJurisdiction(code: string): JurisdictionId | null {
	if (isJurisdictionId(code)) return code;
	if (code.startsWith("us-")) return "us";
	return null;
}

/**
 * The §4.2 posture for a canonical jurisdiction. The single seam the policy
 * renderer and the consent runtime both read, so policy prose and banner
 * behaviour provably agree (they cannot disagree about a jurisdiction's
 * posture if they consult the same table row).
 */
export function consentModelFor(id: JurisdictionId): ConsentModel {
	return JURISDICTION_TABLE[id].consentModel;
}

export { JURISDICTION_IDS };
