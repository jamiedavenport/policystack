import type { Locale } from "../../types";
import type { ConsentRecord, ConsentRecordSource, ConsentState, Jurisdiction } from "../types";

const RECORD_SOURCES: ReadonlySet<ConsentRecordSource> = new Set([
	"banner",
	"preferences",
	"api",
	"import",
]);

// PS-26: write side is canonical Locale; ConsentRecord.locale stays `string`
// at rest for legacy tolerance. Read tolerance (fromUnknown) is deliberately
// untouched — see PS-36 for the eventual freeze.
export function toRecord(
	state: ConsentState,
	source: ConsentRecordSource,
	locale: Locale,
): ConsentRecord {
	if (state.decidedAt === null) {
		throw new Error("toRecord called before a decision was made");
	}
	return {
		schemaVersion: 1,
		decisions: { ...state.decisions },
		policyVersion: state.policyVersion,
		decidedAt: state.decidedAt,
		jurisdiction: state.jurisdiction,
		locale,
		source,
	};
}

export function recordEquals(a: ConsentRecord, b: ConsentRecord): boolean {
	if (
		a.schemaVersion !== b.schemaVersion ||
		a.policyVersion !== b.policyVersion ||
		a.decidedAt !== b.decidedAt ||
		a.jurisdiction !== b.jurisdiction ||
		a.locale !== b.locale ||
		a.source !== b.source
	) {
		return false;
	}
	const aKeys = Object.keys(a.decisions);
	const bKeys = Object.keys(b.decisions);
	if (aKeys.length !== bKeys.length) return false;
	for (const k of aKeys) {
		if (a.decisions[k] !== b.decisions[k]) return false;
	}
	return true;
}

export function fromUnknown(raw: unknown, fallbackLocale: string): ConsentRecord | null {
	if (typeof raw !== "object" || raw === null) return null;
	const obj = raw as Record<string, unknown>;

	const decidedAt =
		typeof obj.decidedAt === "string" && obj.decidedAt.length > 0 ? obj.decidedAt : null;
	if (decidedAt === null) return null;

	const decisions = isDecisions(obj.decisions) ? obj.decisions : {};
	const policyVersion = typeof obj.policyVersion === "string" ? obj.policyVersion : "";
	const jurisdiction = isJurisdiction(obj.jurisdiction) ? obj.jurisdiction : null;
	const locale =
		typeof obj.locale === "string" && obj.locale.length > 0 ? obj.locale : fallbackLocale;
	const source = isRecordSource(obj.source) ? obj.source : mapLegacySource(obj.source);

	return {
		schemaVersion: 1,
		decisions,
		policyVersion,
		decidedAt,
		jurisdiction,
		locale,
		source,
	};
}

function isDecisions(value: unknown): value is Record<string, boolean> {
	if (typeof value !== "object" || value === null) return false;
	for (const v of Object.values(value as Record<string, unknown>)) {
		if (typeof v !== "boolean") return false;
	}
	return true;
}

function isJurisdiction(value: unknown): value is Jurisdiction {
	return typeof value === "string" && value.length > 0;
}

function isRecordSource(value: unknown): value is ConsentRecordSource {
	return typeof value === "string" && RECORD_SOURCES.has(value as ConsentRecordSource);
}

function mapLegacySource(value: unknown): ConsentRecordSource {
	if (value === "user") return "banner";
	return "import";
}
