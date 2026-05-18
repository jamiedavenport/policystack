import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { GPC_LEGALLY_REQUIRED_JURISDICTIONS, applyGPC, gpcApplies, readGPCSignal } from "./gpc";
import type { Category, ConsentState, PolicyStackConsentConfig } from "./types";

describe("GPC_LEGALLY_REQUIRED_JURISDICTIONS", () => {
	it("contains exactly the four legally-required US states", () => {
		expect(GPC_LEGALLY_REQUIRED_JURISDICTIONS).toEqual(["us-ca", "us-co", "us-ct", "us-va"]);
	});
});

describe("readGPCSignal", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("respects an explicit signal: true", () => {
		expect(readGPCSignal({ signal: true })).toBe(true);
	});

	it("respects an explicit signal: false", () => {
		expect(readGPCSignal({ signal: false })).toBe(false);
	});

	it("returns navigator.globalPrivacyControl when no override (Brave shape)", () => {
		vi.stubGlobal("navigator", { globalPrivacyControl: true });
		expect(readGPCSignal(undefined)).toBe(true);
	});

	it("returns false when navigator does not expose GPC (Chrome shape)", () => {
		vi.stubGlobal("navigator", {});
		expect(readGPCSignal(undefined)).toBe(false);
	});

	it("returns false when navigator.globalPrivacyControl is false", () => {
		vi.stubGlobal("navigator", { globalPrivacyControl: false });
		expect(readGPCSignal(undefined)).toBe(false);
	});

	it("returns false when navigator is undefined (SSR)", () => {
		vi.stubGlobal("navigator", undefined);
		expect(readGPCSignal(undefined)).toBe(false);
	});

	it("returns false when enabled is explicitly false, even if signal would be true", () => {
		vi.stubGlobal("navigator", { globalPrivacyControl: true });
		expect(readGPCSignal({ enabled: false })).toBe(false);
		expect(readGPCSignal({ enabled: false, signal: true })).toBe(false);
	});
});

describe("gpcApplies", () => {
	it("defaults to applying in all jurisdictions", () => {
		expect(gpcApplies("eea", undefined)).toBe(true);
		expect(gpcApplies("us", undefined)).toBe(true);
		expect(gpcApplies("row", undefined)).toBe(true);
		expect(gpcApplies(null, undefined)).toBe(true);
	});

	it("does not apply when explicitly disabled", () => {
		expect(gpcApplies("us-ca", { enabled: false })).toBe(false);
	});

	it("matches an explicit jurisdiction list", () => {
		const config = { applicableJurisdictions: GPC_LEGALLY_REQUIRED_JURISDICTIONS };
		expect(gpcApplies("us-ca", config)).toBe(true);
		expect(gpcApplies("us-va", config)).toBe(true);
		expect(gpcApplies("eea", config)).toBe(false);
		expect(gpcApplies("us", config)).toBe(false);
	});

	it("returns false for null jurisdiction when scope is an explicit list", () => {
		expect(gpcApplies(null, { applicableJurisdictions: ["us-ca"] })).toBe(false);
	});

	it('treats explicit "all" the same as default', () => {
		expect(gpcApplies("eea", { applicableJurisdictions: "all" })).toBe(true);
		expect(gpcApplies(null, { applicableJurisdictions: "all" })).toBe(true);
	});
});

describe("applyGPC", () => {
	const baseCategories: Category[] = [
		{ key: "essential", label: "Essential", locked: true },
		{ key: "analytics", label: "Analytics" },
		{ key: "marketing", label: "Marketing" },
	];

	function makeState(overrides: Partial<ConsentState> = {}): ConsentState {
		return {
			route: "cookie",
			categories: baseCategories,
			decisions: { essential: true, analytics: true, marketing: true },
			jurisdiction: "us-ca",
			policyVersion: "",
			decidedAt: null,
			source: "default",
			repromptReason: null,
			canWithdraw: false,
			consentModel: "opt-out",
			...overrides,
		};
	}

	function makeConfig(overrides: Partial<PolicyStackConsentConfig> = {}): PolicyStackConsentConfig {
		return { categories: baseCategories, gpc: { signal: true }, ...overrides };
	}

	it("denies all non-locked, non-respectGPC:false categories", () => {
		const next = applyGPC(makeState(), makeConfig());
		expect(next.decisions).toEqual({
			essential: true,
			analytics: false,
			marketing: false,
		});
		expect(next.source).toBe("gpc");
	});

	it("leaves route and decidedAt untouched (GPC is a signal, not a decision)", () => {
		const next = applyGPC(makeState(), makeConfig());
		expect(next.route).toBe("cookie");
		expect(next.decidedAt).toBeNull();
	});

	it("preserves categories with respectGPC: false", () => {
		const categories: Category[] = [
			{ key: "essential", label: "Essential", locked: true },
			{ key: "analytics", label: "Analytics", respectGPC: false },
			{ key: "marketing", label: "Marketing" },
		];
		const state = makeState({
			categories,
			decisions: { essential: true, analytics: true, marketing: true },
		});
		const next = applyGPC(state, makeConfig({ categories }));
		expect(next.decisions.analytics).toBe(true);
		expect(next.decisions.marketing).toBe(false);
	});

	it("does not close the banner when a respectGPC:false category remains true", () => {
		const categories: Category[] = [
			{ key: "essential", label: "Essential", locked: true },
			{ key: "analytics", label: "Analytics", respectGPC: false },
			{ key: "marketing", label: "Marketing" },
		];
		const state = makeState({
			categories,
			decisions: { essential: true, analytics: true, marketing: true },
		});
		const next = applyGPC(state, makeConfig({ categories }));
		expect(next.route).toBe("cookie");
		expect(next.decidedAt).toBeNull();
	});

	it("is a no-op when GPC signal is false", () => {
		const state = makeState();
		const next = applyGPC(state, makeConfig({ gpc: { signal: false } }));
		expect(next).toBe(state);
	});

	it("is a no-op when jurisdiction is not in the explicit applicable list", () => {
		const state = makeState({ jurisdiction: "eea" });
		const next = applyGPC(
			state,
			makeConfig({
				gpc: { signal: true, applicableJurisdictions: GPC_LEGALLY_REQUIRED_JURISDICTIONS },
			}),
		);
		expect(next).toBe(state);
	});

	it("applies in EEA under the privacy-positive default scope", () => {
		const state = makeState({ jurisdiction: "eea" });
		const next = applyGPC(state, makeConfig());
		expect(next.source).toBe("gpc");
		expect(next.decisions.marketing).toBe(false);
	});

	it("is a no-op when gpc.enabled is false", () => {
		const state = makeState();
		const next = applyGPC(state, makeConfig({ gpc: { enabled: false, signal: true } }));
		expect(next).toBe(state);
	});

	it("is a no-op when re-applied to an already-gpc state with no changes", () => {
		const initial = applyGPC(makeState(), makeConfig());
		const second = applyGPC(initial, makeConfig());
		expect(second).toBe(initial);
	});

	it("preserves explicit user decisions (affirmative consent overrides GPC)", () => {
		const state = makeState({
			source: "user",
			decidedAt: "2026-04-29T00:00:00.000Z",
			decisions: { essential: true, analytics: true, marketing: false },
		});
		const next = applyGPC(state, makeConfig());
		expect(next).toBe(state);
	});

	it("still applies GPC when source is user but no decidedAt is recorded", () => {
		const state = makeState({
			source: "user",
			decidedAt: null,
			decisions: { essential: true, analytics: true, marketing: true },
		});
		const next = applyGPC(state, makeConfig());
		expect(next.decisions.analytics).toBe(false);
		expect(next.source).toBe("gpc");
	});
});
