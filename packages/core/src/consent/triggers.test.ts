import { describe, expect, it } from "vite-plus/test";
import { evaluateTriggers, type TriggerInput } from "./triggers";
import type { Category, ConsentRecord } from "./types";

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
];

const baseRecord: ConsentRecord = {
	schemaVersion: 1,
	decisions: { essential: true, analytics: true },
	policyVersion: "v1",
	decidedAt: "2026-04-01T00:00:00.000Z",
	jurisdiction: "eea",
	locale: "en-GB",
	source: "banner",
};

const NOW = Date.parse("2026-04-29T00:00:00.000Z");

function input(overrides: Partial<TriggerInput> = {}): TriggerInput {
	return {
		record: baseRecord,
		triggers: undefined,
		policyVersion: "v1",
		categories: baseCategories,
		jurisdiction: "eea",
		now: NOW,
		...overrides,
	};
}

describe("evaluateTriggers", () => {
	it("returns null when no triggers are configured", () => {
		expect(evaluateTriggers(input())).toBeNull();
	});

	it("returns null when triggers object is empty", () => {
		expect(evaluateTriggers(input({ triggers: {} }))).toBeNull();
	});

	describe("policyVersionChanged", () => {
		it("fires when policy versions differ", () => {
			expect(
				evaluateTriggers(input({ triggers: { policyVersionChanged: true }, policyVersion: "v2" })),
			).toBe("policyVersion");
		});

		it("does not fire when versions match", () => {
			expect(evaluateTriggers(input({ triggers: { policyVersionChanged: true } }))).toBeNull();
		});

		it("does nothing when the trigger is false/absent", () => {
			expect(evaluateTriggers(input({ policyVersion: "v2" }))).toBeNull();
			expect(
				evaluateTriggers(input({ triggers: { policyVersionChanged: false }, policyVersion: "v2" })),
			).toBeNull();
		});
	});

	describe("categoriesAdded", () => {
		it("fires when a new category is missing from the stored decisions", () => {
			const cats: Category[] = [...baseCategories, { key: "marketing", label: "Marketing" }];
			expect(
				evaluateTriggers(input({ triggers: { categoriesAdded: true }, categories: cats })),
			).toBe("categoriesAdded");
		});

		it("does not fire when every current category exists in the record", () => {
			expect(evaluateTriggers(input({ triggers: { categoriesAdded: true } }))).toBeNull();
		});

		it("does not fire if a category is removed (only adds re-prompt)", () => {
			const cats: Category[] = [{ key: "essential", label: "Essential", locked: true }];
			expect(
				evaluateTriggers(input({ triggers: { categoriesAdded: true }, categories: cats })),
			).toBeNull();
		});
	});

	describe("expiresAfter", () => {
		it("fires when the record is older than the duration", () => {
			expect(evaluateTriggers(input({ triggers: { expiresAfter: "1 day" } }))).toBe("expired");
		});

		it("does not fire when the duration has not elapsed", () => {
			expect(evaluateTriggers(input({ triggers: { expiresAfter: "13 months" } }))).toBeNull();
		});

		it("accepts numeric ms", () => {
			expect(evaluateTriggers(input({ triggers: { expiresAfter: 60_000 } }))).toBe("expired");
		});

		it("accepts ISO 8601 duration", () => {
			expect(evaluateTriggers(input({ triggers: { expiresAfter: "P1D" } }))).toBe("expired");
		});

		it("never expires when set to null", () => {
			expect(evaluateTriggers(input({ triggers: { expiresAfter: null } }))).toBeNull();
		});
	});

	describe("jurisdictionChanged", () => {
		it("fires when the visitor crosses a jurisdiction boundary", () => {
			expect(
				evaluateTriggers(input({ triggers: { jurisdictionChanged: true }, jurisdiction: "us" })),
			).toBe("jurisdiction");
		});

		it("does not fire when jurisdictions match", () => {
			expect(evaluateTriggers(input({ triggers: { jurisdictionChanged: true } }))).toBeNull();
		});

		it("does not fire when current jurisdiction is unresolved (null)", () => {
			expect(
				evaluateTriggers(input({ triggers: { jurisdictionChanged: true }, jurisdiction: null })),
			).toBeNull();
		});

		it("does not fire when stored jurisdiction is null (legacy record)", () => {
			const r = { ...baseRecord, jurisdiction: null };
			expect(
				evaluateTriggers(
					input({ triggers: { jurisdictionChanged: true }, record: r, jurisdiction: "eea" }),
				),
			).toBeNull();
		});
	});

	describe("priority", () => {
		it("returns policyVersion before any other reason", () => {
			const cats: Category[] = [...baseCategories, { key: "marketing", label: "Marketing" }];
			expect(
				evaluateTriggers(
					input({
						triggers: {
							policyVersionChanged: true,
							categoriesAdded: true,
							expiresAfter: 1,
							jurisdictionChanged: true,
						},
						policyVersion: "v2",
						categories: cats,
						jurisdiction: "us",
					}),
				),
			).toBe("policyVersion");
		});

		it("returns categoriesAdded before expired/jurisdiction when policy matches", () => {
			const cats: Category[] = [...baseCategories, { key: "marketing", label: "Marketing" }];
			expect(
				evaluateTriggers(
					input({
						triggers: {
							categoriesAdded: true,
							expiresAfter: 1,
							jurisdictionChanged: true,
						},
						categories: cats,
						jurisdiction: "us",
					}),
				),
			).toBe("categoriesAdded");
		});

		it("returns expired before jurisdiction when categories match", () => {
			expect(
				evaluateTriggers(
					input({
						triggers: { expiresAfter: 1, jurisdictionChanged: true },
						jurisdiction: "us",
					}),
				),
			).toBe("expired");
		});
	});
});
