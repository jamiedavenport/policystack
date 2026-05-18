import { describe, expect, it } from "vite-plus/test";
import { consentModelFor, type JurisdictionId, JURISDICTION_IDS } from "../jurisdiction-id";
import { jurisdictionPosture, postureDecisions } from "./posture";
import type { Category } from "./types";

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

describe("jurisdictionPosture — resolved visitor → posture", () => {
	it("opt-in for eea/uk/ch/br/ca/row and a null resolve (conservative)", () => {
		for (const j of ["eea", "uk", "ch", "br", "ca", "row", null] as (JurisdictionId | null)[]) {
			expect(jurisdictionPosture(j)).toBe("opt-in");
		}
	});

	it("opt-out for us and the canonical US states", () => {
		for (const j of ["us", "us-ca", "us-co", "us-ct", "us-va"] as JurisdictionId[]) {
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
