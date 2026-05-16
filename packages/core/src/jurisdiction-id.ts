/**
 * The single canonical jurisdiction identifier, **frozen at 1.0**.
 *
 * Eleven members, decided in the v1 architecture plan (§4.2.1). The union
 * *membership* is the frozen part — a member's support tier (`specific` vs
 * `equivalent`) may be upgraded post-1.0 without a breaking change. Stems are
 * lowercase-kebab and legally precise (`eea`, not `eu`: GDPR applies EEA-wide).
 *
 * This is intentionally distinct from the existing config `Jurisdiction` type
 * (`eu`/`uk`/…). The two coexist until the §4.2.1 capability-table ticket
 * migrates config onto this id; see ADR 0001.
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
