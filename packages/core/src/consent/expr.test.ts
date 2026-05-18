import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { PolicyStackConsentError } from "./errors";
import { evaluate } from "./expr";
import { createConsentStore } from "./store";
import type {
	Category,
	ConsentState,
	PolicyStackConsentConfig,
	UnknownCategoryBehavior,
} from "./types";

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

function makeState(
	overrides: Partial<ConsentState> = {},
	configOverrides: Partial<PolicyStackConsentConfig> = {},
): ConsentState {
	const store = createConsentStore({
		categories: baseCategories,
		...configOverrides,
	});
	return { ...store.getState(), ...overrides };
}

function withDecisions(decisions: Record<string, boolean>): ConsentState {
	return makeState({ decisions: { essential: true, ...decisions } });
}

describe("evaluate", () => {
	describe("string atoms", () => {
		it("returns true for locked categories", () => {
			expect(evaluate("essential", withDecisions({}))).toBe(true);
		});

		it("returns true for granted non-locked categories", () => {
			expect(evaluate("analytics", withDecisions({ analytics: true }))).toBe(true);
		});

		it("returns false for denied non-locked categories", () => {
			expect(evaluate("analytics", withDecisions({ analytics: false }))).toBe(false);
		});

		it("locked categories evaluate true even if decisions disagree", () => {
			const state = makeState({
				decisions: { essential: false, analytics: false, marketing: false },
			});
			expect(evaluate("essential", state)).toBe(true);
		});
	});

	describe("and", () => {
		it("empty and is vacuously true", () => {
			expect(evaluate({ and: [] }, withDecisions({}))).toBe(true);
		});

		it("single-element and matches the atom", () => {
			expect(evaluate({ and: ["analytics"] }, withDecisions({ analytics: true }))).toBe(true);
			expect(evaluate({ and: ["analytics"] }, withDecisions({ analytics: false }))).toBe(false);
		});

		it("all-true and is true", () => {
			const state = withDecisions({ analytics: true, marketing: true });
			expect(evaluate({ and: ["analytics", "marketing"] }, state)).toBe(true);
		});

		it("one-false and is false", () => {
			const state = withDecisions({ analytics: true, marketing: false });
			expect(evaluate({ and: ["analytics", "marketing"] }, state)).toBe(false);
		});

		it("short-circuits on first false", () => {
			const state = withDecisions({ analytics: false });
			expect(() =>
				evaluate({ and: ["analytics", "ghost"] }, state, {
					onUnknownCategory: "throw",
				}),
			).not.toThrow();
		});
	});

	describe("or", () => {
		it("empty or is false", () => {
			expect(evaluate({ or: [] }, withDecisions({}))).toBe(false);
		});

		it("single-element or matches the atom", () => {
			expect(evaluate({ or: ["analytics"] }, withDecisions({ analytics: true }))).toBe(true);
			expect(evaluate({ or: ["analytics"] }, withDecisions({ analytics: false }))).toBe(false);
		});

		it("one-true or is true", () => {
			const state = withDecisions({ analytics: true, marketing: false });
			expect(evaluate({ or: ["analytics", "marketing"] }, state)).toBe(true);
		});

		it("all-false or is false", () => {
			const state = withDecisions({ analytics: false, marketing: false });
			expect(evaluate({ or: ["analytics", "marketing"] }, state)).toBe(false);
		});

		it("short-circuits on first true", () => {
			const state = withDecisions({ analytics: true });
			expect(() =>
				evaluate({ or: ["analytics", "ghost"] }, state, {
					onUnknownCategory: "throw",
				}),
			).not.toThrow();
		});
	});

	describe("not", () => {
		it("not(granted) is false", () => {
			expect(evaluate({ not: "analytics" }, withDecisions({ analytics: true }))).toBe(false);
		});

		it("not(denied) is true", () => {
			expect(evaluate({ not: "analytics" }, withDecisions({ analytics: false }))).toBe(true);
		});

		it("double-negation is identity", () => {
			const granted = withDecisions({ analytics: true });
			expect(evaluate({ not: { not: "analytics" } }, granted)).toBe(true);
			const denied = withDecisions({ analytics: false });
			expect(evaluate({ not: { not: "analytics" } }, denied)).toBe(false);
		});
	});

	describe("nesting", () => {
		it("and with not — full truth table", () => {
			const expr = { and: ["analytics", { not: "marketing" }] };
			const cases: Array<[boolean, boolean, boolean]> = [
				[true, true, false],
				[true, false, true],
				[false, true, false],
				[false, false, false],
			];
			for (const [analytics, marketing, expected] of cases) {
				expect(evaluate(expr, withDecisions({ analytics, marketing }))).toBe(expected);
			}
		});

		it("deeply nested or-of-ands", () => {
			const expr = {
				or: [{ and: ["analytics", "marketing"] }, { and: ["essential", { not: "analytics" }] }],
			};
			expect(evaluate(expr, withDecisions({ analytics: true, marketing: true }))).toBe(true);
			expect(evaluate(expr, withDecisions({ analytics: false, marketing: false }))).toBe(true);
			expect(evaluate(expr, withDecisions({ analytics: true, marketing: false }))).toBe(false);
		});
	});

	describe("unknown category handling", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("throws PolicyStackConsentError by default", () => {
			const state = withDecisions({});
			try {
				evaluate("ghost", state);
				expect.unreachable("should have thrown");
			} catch (err) {
				expect(err).toBeInstanceOf(PolicyStackConsentError);
				expect((err as PolicyStackConsentError).code).toBe("UNKNOWN_CATEGORY");
				expect((err as PolicyStackConsentError).message).toContain("ghost");
			}
		});

		it("warns and returns false when behavior is 'warn'", () => {
			const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const state = withDecisions({});
			const result = evaluate("ghost", state, { onUnknownCategory: "warn" });
			expect(result).toBe(false);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0]?.[0]).toContain("ghost");
		});

		it("returns false silently when behavior is 'silent'", () => {
			const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const state = withDecisions({});
			const result = evaluate("ghost", state, { onUnknownCategory: "silent" });
			expect(result).toBe(false);
			expect(spy).not.toHaveBeenCalled();
		});

		it("does not fire for short-circuited branches", () => {
			const state = withDecisions({ analytics: true });
			const behaviors: UnknownCategoryBehavior[] = ["throw", "warn", "silent"];
			const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
			for (const onUnknownCategory of behaviors) {
				expect(
					evaluate({ or: ["analytics", "ghost"] }, state, {
						onUnknownCategory,
					}),
				).toBe(true);
			}
			expect(spy).not.toHaveBeenCalled();
		});
	});
});

describe("store.has", () => {
	it("evaluates atom expressions against current decisions", () => {
		const store = createConsentStore({ categories: baseCategories });
		expect(store.has("analytics")).toBe(false);
		store.toggle("analytics");
		expect(store.has("analytics")).toBe(true);
	});

	it("evaluates compound expressions", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.acceptAll();
		expect(store.has({ and: ["analytics", "marketing"] })).toBe(true);
		expect(store.has({ or: ["analytics", "marketing"] })).toBe(true);
		expect(store.has({ not: "analytics" })).toBe(false);
	});

	it("threads onUnknownCategory from config", () => {
		const store = createConsentStore({
			categories: baseCategories,
			onUnknownCategory: "silent",
		});
		expect(store.has("ghost")).toBe(false);
	});

	it("throws by default on unknown category via has()", () => {
		const store = createConsentStore({ categories: baseCategories });
		expect(() => store.has("ghost")).toThrow(PolicyStackConsentError);
	});
});
