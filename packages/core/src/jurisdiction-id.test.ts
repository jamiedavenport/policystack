import { expect, test } from "vite-plus/test";
import {
	isJurisdictionId,
	isUSStateJurisdictionId,
	JURISDICTION_IDS,
	JURISDICTION_TABLE,
	resolveJurisdiction,
	US_STATE_JURISDICTION_IDS,
} from "./jurisdiction-id";

const US_STATE_CODES = [
	"al",
	"ak",
	"az",
	"ar",
	"ca",
	"co",
	"ct",
	"de",
	"fl",
	"ga",
	"hi",
	"id",
	"il",
	"in",
	"ia",
	"ks",
	"ky",
	"la",
	"me",
	"md",
	"ma",
	"mi",
	"mn",
	"ms",
	"mo",
	"mt",
	"ne",
	"nv",
	"nh",
	"nj",
	"nm",
	"ny",
	"nc",
	"nd",
	"oh",
	"ok",
	"or",
	"pa",
	"ri",
	"sc",
	"sd",
	"tn",
	"tx",
	"ut",
	"vt",
	"va",
	"wa",
	"wv",
	"wi",
	"wy",
] as const;

const US_STATE_IDS = US_STATE_CODES.map((code) => `us-${code}`);

test("the canonical union includes all 50 US states", () => {
	expect(JURISDICTION_IDS).toHaveLength(57);
	expect(US_STATE_JURISDICTION_IDS).toEqual(US_STATE_IDS);
	expect(JURISDICTION_IDS.filter(isUSStateJurisdictionId)).toEqual(US_STATE_IDS);
});

test("exactly eea, uk, and us-ca have specific policy text", () => {
	const specific = JURISDICTION_IDS.filter(
		(id) => JURISDICTION_TABLE[id].policyText === "specific",
	);
	expect([...specific].sort()).toEqual(["eea", "uk", "us-ca"]);
});

test("all US state codes inherit parent `us`; nothing else has a parent", () => {
	for (const id of JURISDICTION_IDS) {
		const expected = isUSStateJurisdictionId(id) ? "us" : undefined;
		expect(JURISDICTION_TABLE[id].parent).toBe(expected);
	}
});

test("gpcLegallyBinding matches the currently effective US-state set", () => {
	const binding = JURISDICTION_IDS.filter((id) => JURISDICTION_TABLE[id].gpcLegallyBinding);
	expect(binding).toEqual([
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
});

test("consentModel: us and all US states are opt-out", () => {
	const optOut = JURISDICTION_IDS.filter((id) => JURISDICTION_TABLE[id].consentModel === "opt-out");
	expect(optOut).toEqual(["us", ...US_STATE_IDS]);
});

test("isJurisdictionId accepts every canonical code and rejects retired/regulation names", () => {
	for (const id of JURISDICTION_IDS) expect(isJurisdictionId(id)).toBe(true);
	for (const bad of ["eu", "au", "jp", "sg", "nz", "other", "gdpr", "ccpa", "us-zz", ""]) {
		expect(isJurisdictionId(bad)).toBe(false);
	}
});

test("isUSStateJurisdictionId accepts only the 50 canonical state ids", () => {
	for (const id of US_STATE_IDS) expect(isUSStateJurisdictionId(id)).toBe(true);
	for (const value of ["us", "us-dc", "us-pr", "us-zz", "ca", null]) {
		expect(isUSStateJurisdictionId(value)).toBe(false);
	}
});

test("resolveJurisdiction preserves states and folds unknown US subdivisions to us", () => {
	for (const id of JURISDICTION_IDS) expect(resolveJurisdiction(id)).toBe(id);
	expect(resolveJurisdiction("us-fl")).toBe("us-fl");
	expect(resolveJurisdiction("us-tx")).toBe("us-tx");
	expect(resolveJurisdiction("us-zz")).toBe("us");
	expect(resolveJurisdiction("eu")).toBeNull();
	expect(resolveJurisdiction("uss-ca")).toBeNull();
	expect(resolveJurisdiction("")).toBeNull();
});
