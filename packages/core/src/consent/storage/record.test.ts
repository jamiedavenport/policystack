import { describe, expect, it } from "vite-plus/test";
import type { ConsentRecord, ConsentState } from "../types";
import { fromUnknown, recordEquals, toRecord } from "./record";

const baseState: ConsentState = {
	route: "closed",
	categories: [
		{ key: "essential", label: "Essential", locked: true },
		{ key: "analytics", label: "Analytics" },
	],
	decisions: { essential: true, analytics: true },
	jurisdiction: "EEA",
	policyVersion: "v2",
	decidedAt: "2026-04-29T00:00:00.000Z",
	source: "user",
	repromptReason: null,
	canWithdraw: false,
	consentModel: "opt-in",
};

// `locale: "en-GB"` exercises read-side legacy tolerance (ConsentRecord.locale
// stays `string` at rest — see PS-26 / PS-36). The write side (toRecord) only
// accepts a canonical `Locale`, so write-side fixtures use "en".
const v1: ConsentRecord = {
	schemaVersion: 1,
	decisions: { essential: true, analytics: true },
	policyVersion: "v2",
	decidedAt: "2026-04-29T00:00:00.000Z",
	jurisdiction: "EEA",
	locale: "en-GB",
	source: "banner",
};

const canonical: ConsentRecord = { ...v1, locale: "en" };

describe("toRecord", () => {
	it("emits a v1 record from state + source + canonical locale", () => {
		expect(toRecord(baseState, "banner", "en")).toEqual(canonical);
	});

	it("clones decisions (no aliasing)", () => {
		const record = toRecord(baseState, "banner", "en");
		record.decisions.analytics = false;
		expect(baseState.decisions.analytics).toBe(true);
	});

	it("throws when state has no decidedAt", () => {
		expect(() => toRecord({ ...baseState, decidedAt: null }, "banner", "en")).toThrow();
	});
});

describe("recordEquals", () => {
	it("returns true for the same record", () => {
		expect(recordEquals(v1, { ...v1 })).toBe(true);
	});

	it("returns false on any field difference", () => {
		expect(recordEquals(v1, { ...v1, locale: "fr-FR" })).toBe(false);
		expect(recordEquals(v1, { ...v1, source: "preferences" })).toBe(false);
		expect(recordEquals(v1, { ...v1, policyVersion: "v3" })).toBe(false);
		expect(recordEquals(v1, { ...v1, decidedAt: "2026-05-01T00:00:00.000Z" })).toBe(false);
		expect(recordEquals(v1, { ...v1, jurisdiction: "UK" })).toBe(false);
		expect(recordEquals(v1, { ...v1, decisions: { essential: true, analytics: false } })).toBe(
			false,
		);
	});

	it("treats different decision key counts as not equal", () => {
		expect(recordEquals(v1, { ...v1, decisions: { essential: true } })).toBe(false);
	});
});

describe("fromUnknown", () => {
	it("returns null for non-objects", () => {
		expect(fromUnknown(null, "en")).toBeNull();
		expect(fromUnknown("string", "en")).toBeNull();
		expect(fromUnknown(42, "en")).toBeNull();
		expect(fromUnknown(undefined, "en")).toBeNull();
	});

	it("returns null when decidedAt is missing or null", () => {
		expect(fromUnknown({ ...v1, decidedAt: null }, "en")).toBeNull();
		const { decidedAt: _omit, ...rest } = v1;
		void _omit;
		expect(fromUnknown(rest, "en")).toBeNull();
	});

	it("returns a v1 record as-is (round-trip)", () => {
		expect(fromUnknown(v1, "en")).toEqual(v1);
	});

	it("migrates a legacy OP-297 record (source 'user' -> 'banner')", () => {
		const legacy = {
			decisions: { essential: true, analytics: false },
			jurisdiction: "EEA",
			policyVersion: "v1",
			decidedAt: "2026-04-01T00:00:00.000Z",
			source: "user",
		};
		expect(fromUnknown(legacy, "en-GB")).toEqual({
			schemaVersion: 1,
			decisions: { essential: true, analytics: false },
			policyVersion: "v1",
			decidedAt: "2026-04-01T00:00:00.000Z",
			jurisdiction: "EEA",
			locale: "en-GB",
			source: "banner",
		});
	});

	it("maps unknown legacy sources to 'import'", () => {
		const legacy = {
			decisions: { essential: true },
			jurisdiction: null,
			policyVersion: "",
			decidedAt: "2026-04-01T00:00:00.000Z",
			source: "default",
		};
		expect(fromUnknown(legacy, "en")?.source).toBe("import");
	});

	it("uses fallbackLocale when record lacks locale", () => {
		const legacy = {
			decisions: { essential: true },
			decidedAt: "2026-04-01T00:00:00.000Z",
		};
		expect(fromUnknown(legacy, "fr-FR")?.locale).toBe("fr-FR");
	});

	it("preserves locale from the record when present", () => {
		expect(fromUnknown(v1, "fr-FR")?.locale).toBe("en-GB");
	});

	it("tolerates a record without policyVersion (per ticket)", () => {
		const legacy = {
			decisions: { essential: true },
			decidedAt: "2026-04-01T00:00:00.000Z",
			source: "user",
		};
		const out = fromUnknown(legacy, "en");
		expect(out).not.toBeNull();
		expect(out?.policyVersion).toBe("");
	});

	it("drops malformed decisions to {}", () => {
		const broken = {
			decisions: { good: true, bad: "yes" },
			decidedAt: "2026-04-01T00:00:00.000Z",
		};
		expect(fromUnknown(broken, "en")?.decisions).toEqual({});
	});
});
