import { describe, expect, it } from "vite-plus/test";
import { consentModelFor, JURISDICTION_IDS } from "../jurisdiction-id";
import { jurisdictionPosture, postureDecisions, toJurisdictionId } from "./posture";
import type { Category, Jurisdiction } from "./types";

describe("consentModelFor — all 11 canonical jurisdictions", () => {
	const OPT_OUT = ["us", "us-ca", "us-co", "us-ct", "us-va"];

	it("us/us-* are opt-out; eea/uk/ch/br/ca/row are opt-in (per JURISDICTION_TABLE)", () => {
		for (const id of JURISDICTION_IDS) {
			expect(consentModelFor(id)).toBe(OPT_OUT.includes(id) ? "opt-out" : "opt-in");
		}
	});

	it("covers exactly the 11 frozen ids", () => {
		expect(JURISDICTION_IDS).toHaveLength(11);
	});
});

describe("toJurisdictionId — runtime Jurisdiction → canonical id", () => {
	it("maps the recognised uppercase runtime codes", () => {
		expect(toJurisdictionId("EEA")).toBe("eea");
		expect(toJurisdictionId("UK")).toBe("uk");
		expect(toJurisdictionId("CH")).toBe("ch");
		expect(toJurisdictionId("BR")).toBe("br");
		expect(toJurisdictionId("CA")).toBe("ca");
		expect(toJurisdictionId("US")).toBe("us");
		expect(toJurisdictionId("US-CA")).toBe("us-ca");
		expect(toJurisdictionId("ROW")).toBe("row");
	});

	it("folds the unlisted US-state tail to `us`", () => {
		expect(toJurisdictionId("US-FL")).toBe("us");
		expect(toJurisdictionId("US-TX")).toBe("us");
	});

	it("falls back to `row` for null, AU, and anything unrecognised", () => {
		expect(toJurisdictionId(null)).toBe("row");
		// "AU" exists in the runtime union but has no canonical `au` member.
		expect(toJurisdictionId("AU")).toBe("row");
		expect(toJurisdictionId("XX" as Jurisdiction)).toBe("row");
	});
});

describe("jurisdictionPosture — resolved visitor → posture", () => {
	it("opt-in for EEA/UK/CH/BR/CA/AU/null/ROW (conservative)", () => {
		for (const j of ["EEA", "UK", "CH", "BR", "CA", "AU", "ROW", null] as (Jurisdiction | null)[]) {
			expect(jurisdictionPosture(j)).toBe("opt-in");
		}
	});

	it("opt-out for US and US states (listed + unlisted tail)", () => {
		for (const j of ["US", "US-CA", "US-CO", "US-CT", "US-VA", "US-FL"] as Jurisdiction[]) {
			expect(jurisdictionPosture(j)).toBe("opt-out");
		}
	});
});

describe("postureDecisions — composes with the §4.1 locked bridge", () => {
	const cats: Category[] = [
		{ key: "essential", label: "Essential", locked: true },
		{ key: "analytics", label: "Analytics" },
		{ key: "marketing", label: "Marketing" },
	];

	it("opt-in: locked granted, consent-gated off until consent", () => {
		expect(postureDecisions(cats, "opt-in")).toEqual({
			essential: true,
			analytics: false,
			marketing: false,
		});
	});

	it("opt-out: locked granted, consent-gated on by default (gated by Do-Not-Sell/GPC)", () => {
		expect(postureDecisions(cats, "opt-out")).toEqual({
			essential: true,
			analytics: true,
			marketing: true,
		});
	});

	it("gating keys only on `locked` — lawfulBasis/vendor/purpose metadata is inert", () => {
		const meta: Category[] = [
			{ key: "essential", label: "Essential", locked: true, lawfulBasis: "consent" },
			{
				key: "analytics",
				label: "Analytics",
				lawfulBasis: "legitimate_interests",
				vendor: "Acme",
				purpose: "metrics",
			},
		];
		expect(postureDecisions(meta, "opt-in")).toEqual({ essential: true, analytics: false });
		expect(postureDecisions(meta, "opt-out")).toEqual({ essential: true, analytics: true });
	});
});
