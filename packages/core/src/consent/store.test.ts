import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { GPC_LEGALLY_REQUIRED_JURISDICTIONS } from "./gpc";
import { manualResolver } from "./jurisdiction";
import { createConsentStore } from "./store";
import type {
	Category,
	ConsentRecord,
	JurisdictionResolver,
	OpenCookiesConfig,
	StorageAdapter,
} from "./types";

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

function makeConfig(overrides: Partial<OpenCookiesConfig> = {}): OpenCookiesConfig {
	return { categories: baseCategories, ...overrides };
}

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createConsentStore", () => {
	describe("initial state", () => {
		it("locked categories start true, others false", () => {
			const store = createConsentStore(makeConfig());
			expect(store.getState().decisions).toEqual({
				essential: true,
				analytics: false,
				marketing: false,
			});
		});

		it("bridge metadata (lawfulBasis/vendor/purpose) is inert — gating keys only on locked", () => {
			const store = createConsentStore(
				makeConfig({
					categories: [
						{ key: "essential", label: "Essential", locked: true, lawfulBasis: "consent" },
						{
							key: "analytics",
							label: "Analytics",
							lawfulBasis: "legitimate_interests",
							vendor: "Acme",
							purpose: "metrics",
						},
					],
				}),
			);
			expect(store.getState().decisions).toEqual({ essential: true, analytics: false });
		});

		it("decidedAt is null and route is 'cookie' by default", () => {
			const s = createConsentStore(makeConfig()).getState();
			expect(s.decidedAt).toBeNull();
			expect(s.route).toBe("cookie");
		});

		it("honors initialRoute config override", () => {
			const store = createConsentStore(makeConfig({ initialRoute: "closed" }));
			expect(store.getState().route).toBe("closed");
		});

		it("uses provided policyVersion or empty string", () => {
			expect(createConsentStore(makeConfig({ policyVersion: "v2" })).getState().policyVersion).toBe(
				"v2",
			);
			expect(createConsentStore(makeConfig()).getState().policyVersion).toBe("");
		});

		it("jurisdiction is null when no resolver is configured", () => {
			expect(createConsentStore(makeConfig()).getState().jurisdiction).toBeNull();
		});

		it("canWithdraw reflects config and defaults to false", () => {
			expect(createConsentStore(makeConfig()).getState().canWithdraw).toBe(false);
			expect(createConsentStore(makeConfig({ canWithdraw: true })).getState().canWithdraw).toBe(
				true,
			);
		});

		it("canWithdraw survives a policyVersion reprompt", () => {
			const adapter: StorageAdapter = {
				read: () => ({
					schemaVersion: 1,
					decisions: { essential: true, analytics: true, marketing: true },
					policyVersion: "old",
					decidedAt: "2026-01-01T00:00:00.000Z",
					jurisdiction: null,
					locale: "en",
					source: "banner",
				}),
				write: () => {},
				clear: () => {},
			};
			const store = createConsentStore(
				makeConfig({
					canWithdraw: true,
					policyVersion: "new",
					triggers: { policyVersionChanged: true },
					adapter,
				}),
			);
			expect(store.getState().repromptReason).toBe("policyVersion");
			expect(store.getState().canWithdraw).toBe(true);
		});
	});

	describe("jurisdiction resolver", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("populates jurisdiction synchronously when resolver is sync", () => {
			const store = createConsentStore(makeConfig({ jurisdictionResolver: manualResolver("EEA") }));
			expect(store.getState().jurisdiction).toBe("EEA");
		});

		it("starts null and notifies subscribers when resolver is async", async () => {
			const resolver: JurisdictionResolver = {
				resolve: () => Promise.resolve("UK"),
			};
			const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
			expect(store.getState().jurisdiction).toBeNull();
			const listener = vi.fn();
			store.subscribe(listener);
			await flushMicrotasks();
			expect(store.getState().jurisdiction).toBe("UK");
			expect(listener).toHaveBeenCalledWith(store.getState());
		});

		it("forwards config.request to the resolver", () => {
			const resolve = vi.fn().mockReturnValue("US");
			const req = { headers: new Headers({ "cf-ipcountry": "US" }) };
			createConsentStore(makeConfig({ jurisdictionResolver: { resolve }, request: req }));
			expect(resolve).toHaveBeenCalledWith(req);
		});

		it("swallows sync resolver errors and leaves jurisdiction null", () => {
			const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
			const resolver: JurisdictionResolver = {
				resolve: () => {
					throw new Error("boom");
				},
			};
			const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
			expect(store.getState().jurisdiction).toBeNull();
			expect(warn).toHaveBeenCalled();
		});

		it("swallows async resolver rejections and leaves jurisdiction null", async () => {
			const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
			const resolver: JurisdictionResolver = {
				resolve: () => Promise.reject(new Error("boom")),
			};
			const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
			await flushMicrotasks();
			expect(store.getState().jurisdiction).toBeNull();
			expect(warn).toHaveBeenCalled();
		});

		it("preserves jurisdiction across decision mutations", () => {
			const store = createConsentStore(makeConfig({ jurisdictionResolver: manualResolver("EEA") }));
			store.acceptAll();
			expect(store.getState().jurisdiction).toBe("EEA");
			store.acceptNecessary();
			expect(store.getState().jurisdiction).toBe("EEA");
			store.reject();
			expect(store.getState().jurisdiction).toBe("EEA");
			store.toggle("analytics");
			expect(store.getState().jurisdiction).toBe("EEA");
			store.save();
			expect(store.getState().jurisdiction).toBe("EEA");
		});
	});

	describe("refreshJurisdiction", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("re-invokes the resolver and commits the new value", async () => {
			let next: "EEA" | "US" = "EEA";
			const resolver: JurisdictionResolver = {
				resolve: () => next,
			};
			const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
			expect(store.getState().jurisdiction).toBe("EEA");
			next = "US";
			const result = await store.refreshJurisdiction();
			expect(result).toBe("US");
			expect(store.getState().jurisdiction).toBe("US");
		});

		it("notifies subscribers on refresh", async () => {
			let next: "EEA" | "UK" = "EEA";
			const store = createConsentStore(
				makeConfig({ jurisdictionResolver: { resolve: () => next } }),
			);
			const listener = vi.fn();
			store.subscribe(listener);
			next = "UK";
			await store.refreshJurisdiction();
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener.mock.calls[0]?.[0].jurisdiction).toBe("UK");
		});

		it("returns the current jurisdiction when no resolver is configured", async () => {
			const store = createConsentStore(makeConfig());
			const result = await store.refreshJurisdiction();
			expect(result).toBeNull();
		});

		it("forwards an explicit request override to the resolver", async () => {
			const resolve = vi.fn().mockReturnValue("EEA");
			const store = createConsentStore(makeConfig({ jurisdictionResolver: { resolve } }));
			resolve.mockClear();
			const req = { headers: new Headers({ "cf-ipcountry": "DE" }) };
			await store.refreshJurisdiction(req);
			expect(resolve).toHaveBeenCalledWith(req);
		});

		it("leaves jurisdiction unchanged when the resolver throws", async () => {
			vi.spyOn(console, "warn").mockImplementation(() => {});
			let mode: "ok" | "boom" = "ok";
			const resolver: JurisdictionResolver = {
				resolve: () => {
					if (mode === "boom") throw new Error("nope");
					return "EEA";
				},
			};
			const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
			mode = "boom";
			const result = await store.refreshJurisdiction();
			expect(result).toBe("EEA");
			expect(store.getState().jurisdiction).toBe("EEA");
		});

		it("leaves jurisdiction unchanged when the resolver rejects", async () => {
			vi.spyOn(console, "warn").mockImplementation(() => {});
			let mode: "ok" | "boom" = "ok";
			const resolver: JurisdictionResolver = {
				resolve: () =>
					mode === "boom" ? Promise.reject(new Error("nope")) : Promise.resolve("UK"),
			};
			const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
			await flushMicrotasks();
			expect(store.getState().jurisdiction).toBe("UK");
			mode = "boom";
			const result = await store.refreshJurisdiction();
			expect(result).toBe("UK");
			expect(store.getState().jurisdiction).toBe("UK");
		});
	});

	describe("acceptAll", () => {
		it("sets all decisions true, decidedAt, and closes route", () => {
			const store = createConsentStore(makeConfig());
			store.acceptAll();
			const s = store.getState();
			expect(s.decisions).toEqual({
				essential: true,
				analytics: true,
				marketing: true,
			});
			expect(s.route).toBe("closed");
			expect(s.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});
	});

	describe("acceptNecessary", () => {
		it("locked stays true, non-locked becomes false, route closes", () => {
			const store = createConsentStore(makeConfig());
			store.acceptAll();
			store.acceptNecessary();
			const s = store.getState();
			expect(s.decisions).toEqual({
				essential: true,
				analytics: false,
				marketing: false,
			});
			expect(s.route).toBe("closed");
			expect(s.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});
	});

	describe("reject", () => {
		it("matches acceptNecessary observable effect", () => {
			const a = createConsentStore(makeConfig());
			const b = createConsentStore(makeConfig());
			a.reject();
			b.acceptNecessary();
			expect(a.getState().decisions).toEqual(b.getState().decisions);
			expect(a.getState().route).toBe(b.getState().route);
		});
	});

	describe("toggle", () => {
		it("flips a non-locked category", () => {
			const store = createConsentStore(makeConfig());
			store.toggle("analytics");
			expect(store.getState().decisions.analytics).toBe(true);
			store.toggle("analytics");
			expect(store.getState().decisions.analytics).toBe(false);
		});

		it("is a no-op for locked categories", () => {
			const store = createConsentStore(makeConfig());
			const before = store.getState();
			store.toggle("essential");
			expect(store.getState()).toBe(before);
			expect(store.getState().decisions.essential).toBe(true);
		});

		it("is a no-op for unknown keys", () => {
			const store = createConsentStore(makeConfig());
			const before = store.getState();
			store.toggle("nope");
			expect(store.getState()).toBe(before);
		});

		it("does not set decidedAt", () => {
			const store = createConsentStore(makeConfig());
			store.toggle("analytics");
			expect(store.getState().decidedAt).toBeNull();
		});
	});

	describe("save", () => {
		it("sets decidedAt and closes route without touching decisions", () => {
			const store = createConsentStore(makeConfig());
			store.toggle("analytics");
			const decisionsBefore = store.getState().decisions;
			store.save();
			const s = store.getState();
			expect(s.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			expect(s.route).toBe("closed");
			expect(s.decisions).toEqual(decisionsBefore);
		});
	});

	describe("setRoute", () => {
		it("changes the route", () => {
			const store = createConsentStore(makeConfig());
			store.setRoute("preferences");
			expect(store.getState().route).toBe("preferences");
		});

		it("does not touch decisions or decidedAt", () => {
			const store = createConsentStore(makeConfig());
			store.setRoute("preferences");
			const s = store.getState();
			expect(s.decidedAt).toBeNull();
			expect(s.decisions.analytics).toBe(false);
		});

		it("is a no-op when the route is unchanged", () => {
			const store = createConsentStore(makeConfig());
			const before = store.getState();
			store.setRoute("cookie");
			expect(store.getState()).toBe(before);
		});
	});

	describe("has", () => {
		it("returns true for locked categories on init", () => {
			expect(createConsentStore(makeConfig()).has("essential")).toBe(true);
		});

		it("returns false for non-locked categories on init", () => {
			expect(createConsentStore(makeConfig()).has("analytics")).toBe(false);
		});

		it("reflects toggles", () => {
			const store = createConsentStore(makeConfig());
			store.toggle("analytics");
			expect(store.has("analytics")).toBe(true);
		});

		it("throws on unknown keys by default", () => {
			expect(() => createConsentStore(makeConfig()).has("ghost")).toThrow();
		});
	});

	describe("subscribe", () => {
		it("notifies the listener with the new state on each transition", () => {
			const store = createConsentStore(makeConfig());
			const listener = vi.fn();
			store.subscribe(listener);
			store.acceptAll();
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith(store.getState());
		});

		it("returns an unsubscribe function", () => {
			const store = createConsentStore(makeConfig());
			const listener = vi.fn();
			const unsubscribe = store.subscribe(listener);
			unsubscribe();
			store.acceptAll();
			expect(listener).not.toHaveBeenCalled();
		});

		it("notifies multiple listeners", () => {
			const store = createConsentStore(makeConfig());
			const a = vi.fn();
			const b = vi.fn();
			store.subscribe(a);
			store.subscribe(b);
			store.toggle("analytics");
			expect(a).toHaveBeenCalledTimes(1);
			expect(b).toHaveBeenCalledTimes(1);
		});
	});

	describe("getState reference stability", () => {
		it("returns the same reference between mutations", () => {
			const store = createConsentStore(makeConfig());
			expect(store.getState()).toBe(store.getState());
		});

		it("returns a new reference after a mutation", () => {
			const store = createConsentStore(makeConfig());
			const before = store.getState();
			store.toggle("analytics");
			expect(store.getState()).not.toBe(before);
		});
	});

	describe("source", () => {
		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("starts as 'default' with no GPC and no decisions", () => {
			expect(createConsentStore(makeConfig()).getState().source).toBe("default");
		});

		it("flips to 'user' on acceptAll", () => {
			const store = createConsentStore(makeConfig());
			store.acceptAll();
			expect(store.getState().source).toBe("user");
		});

		it("flips to 'user' on acceptNecessary, reject, toggle, save", () => {
			for (const action of ["acceptNecessary", "reject", "toggle", "save"] as const) {
				const store = createConsentStore(makeConfig());
				if (action === "toggle") store.toggle("analytics");
				else store[action]();
				expect(store.getState().source).toBe("user");
			}
		});

		it("does not change on setRoute", () => {
			const store = createConsentStore(makeConfig());
			store.setRoute("preferences");
			expect(store.getState().source).toBe("default");
		});
	});

	describe("GPC", () => {
		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("applies on init when signal is true (privacy-positive default scope)", () => {
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("EEA"),
					gpc: { signal: true },
				}),
			);
			const s = store.getState();
			expect(s.source).toBe("gpc");
			expect(s.route).toBe("cookie");
			expect(s.decidedAt).toBeNull();
		});

		it("does not apply when signal is false", () => {
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("US-CA"),
					gpc: { signal: false },
				}),
			);
			expect(store.getState().source).toBe("default");
			expect(store.getState().route).toBe("cookie");
		});

		it("applies in a legally-required US state", () => {
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("US-CA"),
					gpc: {
						signal: true,
						applicableJurisdictions: GPC_LEGALLY_REQUIRED_JURISDICTIONS,
					},
				}),
			);
			expect(store.getState().source).toBe("gpc");
		});

		it("does not apply in EEA when scope is restricted to the four US states", () => {
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("EEA"),
					gpc: {
						signal: true,
						applicableJurisdictions: GPC_LEGALLY_REQUIRED_JURISDICTIONS,
					},
				}),
			);
			expect(store.getState().source).toBe("default");
			expect(store.getState().route).toBe("cookie");
		});

		it("re-evaluates after async jurisdiction resolves", async () => {
			const resolver: JurisdictionResolver = {
				resolve: () => Promise.resolve("US-CA"),
			};
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: resolver,
					gpc: {
						signal: true,
						applicableJurisdictions: GPC_LEGALLY_REQUIRED_JURISDICTIONS,
					},
				}),
			);
			expect(store.getState().source).toBe("default");
			await flushMicrotasks();
			expect(store.getState().source).toBe("gpc");
			expect(store.getState().jurisdiction).toBe("US-CA");
		});

		it("respects per-category respectGPC: false", () => {
			const categories: Category[] = [
				{ key: "essential", label: "Essential", locked: true },
				{ key: "analytics", label: "Analytics", respectGPC: false },
				{ key: "marketing", label: "Marketing" },
			];
			const store = createConsentStore({
				categories,
				jurisdictionResolver: manualResolver("US-CA"),
				gpc: { signal: true },
			});
			const decisions = { ...store.getState().decisions };
			store.toggle("analytics");
			expect(store.getState().decisions.analytics).toBe(!decisions.analytics);
		});

		it("user mutation after GPC flips source back to 'user'", () => {
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("US-CA"),
					gpc: { signal: true },
				}),
			);
			expect(store.getState().source).toBe("gpc");
			store.acceptAll();
			expect(store.getState().source).toBe("user");
			expect(store.getState().decisions.marketing).toBe(true);
		});

		it("is fully bypassed when gpc.enabled is false (even with signal: true)", () => {
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("US-CA"),
					gpc: { enabled: false, signal: true },
				}),
			);
			expect(store.getState().source).toBe("default");
			expect(store.getState().route).toBe("cookie");
		});

		it("reads navigator.globalPrivacyControl when no signal override (Brave parity)", () => {
			vi.stubGlobal("navigator", { globalPrivacyControl: true });
			const store = createConsentStore(
				makeConfig({ jurisdictionResolver: manualResolver("US-CA") }),
			);
			expect(store.getState().source).toBe("gpc");
		});

		it("does not apply when navigator omits globalPrivacyControl (Chrome parity)", () => {
			vi.stubGlobal("navigator", {});
			const store = createConsentStore(
				makeConfig({ jurisdictionResolver: manualResolver("US-CA") }),
			);
			expect(store.getState().source).toBe("default");
			expect(store.getState().route).toBe("cookie");
		});
	});

	describe("storage adapter", () => {
		function makeAdapter(initial: ConsentRecord | null = null): {
			adapter: StorageAdapter;
			writes: ConsentRecord[];
			emit: (record: ConsentRecord | null) => void;
		} {
			const writes: ConsentRecord[] = [];
			let listener: ((record: ConsentRecord | null) => void) | null = null;
			return {
				writes,
				emit(record) {
					listener?.(record);
				},
				adapter: {
					read: () => initial,
					write: (record) => {
						writes.push(record);
					},
					clear: () => {},
					subscribe: (cb) => {
						listener = cb;
						return () => {
							listener = null;
						};
					},
				},
			};
		}

		function v1Record(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
			return {
				schemaVersion: 1,
				decisions: { essential: true, analytics: true, marketing: false },
				jurisdiction: "EEA",
				policyVersion: "v2",
				decidedAt: "2026-04-01T00:00:00.000Z",
				locale: "en-GB",
				source: "banner",
				...overrides,
			};
		}

		it("hydrates state from a sync adapter on init", () => {
			const { adapter } = makeAdapter(v1Record());
			const store = createConsentStore(makeConfig({ adapter }));
			const s = store.getState();
			expect(s.decisions).toEqual({ essential: true, analytics: true, marketing: false });
			expect(s.jurisdiction).toBe("EEA");
			expect(s.decidedAt).toBe("2026-04-01T00:00:00.000Z");
			expect(s.source).toBe("user");
		});

		it("closes the banner route when a stored record is hydrated on init", () => {
			const { adapter } = makeAdapter(v1Record());
			const store = createConsentStore(makeConfig({ adapter }));
			expect(store.getState().route).toBe("closed");
		});

		it("preserves a non-default initialRoute on hydration (e.g. 'preferences')", () => {
			const { adapter } = makeAdapter(v1Record());
			const store = createConsentStore(makeConfig({ adapter, initialRoute: "preferences" }));
			expect(store.getState().route).toBe("preferences");
		});

		it("closes the banner route after async hydration", async () => {
			const adapter: StorageAdapter = {
				read: () => Promise.resolve(v1Record()),
				write: () => {},
				clear: () => {},
			};
			const store = createConsentStore(makeConfig({ adapter }));
			expect(store.getState().route).toBe("cookie");
			await flushMicrotasks();
			expect(store.getState().route).toBe("closed");
		});

		it("hydrates state from an async adapter and notifies subscribers", async () => {
			const adapter: StorageAdapter = {
				read: () => Promise.resolve(v1Record({ jurisdiction: "UK", policyVersion: "" })),
				write: () => {},
				clear: () => {},
			};
			const store = createConsentStore(makeConfig({ adapter }));
			expect(store.getState().decidedAt).toBeNull();
			const listener = vi.fn();
			store.subscribe(listener);
			await flushMicrotasks();
			expect(store.getState().decisions.analytics).toBe(true);
			expect(store.getState().jurisdiction).toBe("UK");
			expect(listener).toHaveBeenCalled();
		});

		it("does not write back the just-hydrated record (no-op on init)", () => {
			const { adapter, writes } = makeAdapter(v1Record({ policyVersion: "v1" }));
			createConsentStore(makeConfig({ adapter, policyVersion: "v1", locale: "en-GB" }));
			expect(writes).toEqual([]);
		});

		it("persists each user decision via adapter.write", () => {
			const { adapter, writes } = makeAdapter();
			const store = createConsentStore(makeConfig({ adapter, locale: "en-GB" }));
			store.acceptAll();
			expect(writes).toHaveLength(1);
			expect(writes[0]?.decisions).toEqual({
				essential: true,
				analytics: true,
				marketing: true,
			});
			expect(writes[0]?.schemaVersion).toBe(1);
			expect(writes[0]?.locale).toBe("en-GB");
			expect(writes[0]?.source).toBe("banner");

			store.toggle("marketing");
			expect(writes).toHaveLength(2);
			expect(writes[1]?.decisions.marketing).toBe(false);
		});

		it("does not write when the record is unchanged (e.g. setRoute)", () => {
			const { adapter, writes } = makeAdapter();
			const store = createConsentStore(makeConfig({ adapter }));
			store.acceptAll();
			const before = writes.length;
			store.setRoute("preferences");
			store.setRoute("closed");
			expect(writes).toHaveLength(before);
		});

		it("merges external subscribe updates into state without re-writing", () => {
			const { adapter, writes, emit } = makeAdapter();
			const store = createConsentStore(makeConfig({ adapter }));
			const listener = vi.fn();
			store.subscribe(listener);

			emit(
				v1Record({
					decisions: { essential: true, analytics: true, marketing: false },
					policyVersion: "",
					decidedAt: "2026-04-02T00:00:00.000Z",
					source: "preferences",
				}),
			);

			expect(store.getState().decisions.analytics).toBe(true);
			expect(store.getState().decidedAt).toBe("2026-04-02T00:00:00.000Z");
			expect(listener).toHaveBeenCalledWith(store.getState());
			expect(writes).toEqual([]);
		});

		it("warns but does not throw when adapter.read fails", () => {
			const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
			const adapter: StorageAdapter = {
				read: () => {
					throw new Error("boom");
				},
				write: () => {},
				clear: () => {},
			};
			const store = createConsentStore(makeConfig({ adapter }));
			expect(store.getState().decidedAt).toBeNull();
			expect(warn).toHaveBeenCalled();
		});

		it("warns but does not throw when adapter.write fails", () => {
			const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
			const adapter: StorageAdapter = {
				read: () => null,
				write: () => {
					throw new Error("boom");
				},
				clear: () => {},
			};
			const store = createConsentStore(makeConfig({ adapter }));
			store.acceptAll();
			expect(warn).toHaveBeenCalled();
		});

		it("locked categories stay true even if record persisted them as false", () => {
			const { adapter } = makeAdapter(
				v1Record({
					decisions: { essential: false, analytics: true, marketing: false },
					jurisdiction: null,
					policyVersion: "",
				}),
			);
			const store = createConsentStore(makeConfig({ adapter }));
			expect(store.getState().decisions.essential).toBe(true);
			expect(store.getState().decisions.analytics).toBe(true);
		});

		it("migrates a legacy record on hydration ('user' source -> banner-shaped record)", () => {
			const legacyRaw = {
				decisions: { essential: true, analytics: true, marketing: false },
				jurisdiction: "EEA",
				policyVersion: "v1",
				decidedAt: "2026-04-01T00:00:00.000Z",
				source: "user",
			};
			const adapter: StorageAdapter = {
				read: () => legacyRaw as unknown as ConsentRecord,
				write: () => {},
				clear: () => {},
			};
			const store = createConsentStore(makeConfig({ adapter, locale: "en-GB" }));
			const record = store.getConsentRecord();
			expect(record).not.toBeNull();
			expect(record?.schemaVersion).toBe(1);
			expect(record?.source).toBe("banner");
			expect(record?.locale).toBe("en-GB");
		});

		it("hydrating from a malformed record (decidedAt missing) surfaces no record", () => {
			const adapter: StorageAdapter = {
				read: () =>
					({
						decisions: { essential: true },
						decidedAt: null,
					}) as unknown as ConsentRecord,
				write: () => {},
				clear: () => {},
			};
			const store = createConsentStore(makeConfig({ adapter }));
			expect(store.getConsentRecord()).toBeNull();
			expect(store.getState().decidedAt).toBeNull();
		});
	});

	describe("getConsentRecord", () => {
		it("returns null pre-decision", () => {
			const store = createConsentStore(makeConfig());
			expect(store.getConsentRecord()).toBeNull();
		});

		it("returns a v1 record after acceptAll with route-inferred source 'banner'", () => {
			const store = createConsentStore(makeConfig({ locale: "en-GB", policyVersion: "v2" }));
			store.acceptAll();
			const r = store.getConsentRecord();
			expect(r).not.toBeNull();
			expect(r?.schemaVersion).toBe(1);
			expect(r?.locale).toBe("en-GB");
			expect(r?.policyVersion).toBe("v2");
			expect(r?.source).toBe("banner");
			expect(r?.decisions).toEqual({ essential: true, analytics: true, marketing: true });
		});

		it("infers 'preferences' source when the user is in the preferences route", () => {
			const store = createConsentStore(makeConfig());
			store.setRoute("preferences");
			store.toggle("analytics");
			store.save();
			expect(store.getConsentRecord()?.source).toBe("preferences");
		});

		it("honors an explicit opts.source override (e.g. 'api')", () => {
			const store = createConsentStore(makeConfig());
			store.acceptAll({ source: "api" });
			expect(store.getConsentRecord()?.source).toBe("api");
		});

		it("does not surface a record for GPC-only state (no decision)", () => {
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("US-CA"),
					gpc: { signal: true },
				}),
			);
			expect(store.getState().source).toBe("gpc");
			expect(store.getConsentRecord()).toBeNull();
		});

		it("does not write to the adapter for GPC-only state", () => {
			const writes: ConsentRecord[] = [];
			const adapter: StorageAdapter = {
				read: () => null,
				write: (r) => {
					writes.push(r);
				},
				clear: () => {},
			};
			createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("US-CA"),
					gpc: { signal: true },
					adapter,
				}),
			);
			expect(writes).toEqual([]);
		});

		it("falls back to 'banner' source after GPC + a user decision", () => {
			const store = createConsentStore(
				makeConfig({
					jurisdictionResolver: manualResolver("US-CA"),
					gpc: { signal: true },
				}),
			);
			store.acceptAll();
			expect(store.getConsentRecord()?.source).toBe("banner");
		});
	});

	describe("locale resolution", () => {
		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("uses config.locale when provided", () => {
			const store = createConsentStore(makeConfig({ locale: "fr-FR" }));
			store.acceptAll();
			expect(store.getConsentRecord()?.locale).toBe("fr-FR");
		});

		it("falls back to navigator.language when config.locale is unset", () => {
			vi.stubGlobal("navigator", { language: "de-DE" });
			const store = createConsentStore(makeConfig());
			store.acceptAll();
			expect(store.getConsentRecord()?.locale).toBe("de-DE");
		});

		it("defaults to 'en' when neither config.locale nor navigator.language is available", () => {
			vi.stubGlobal("navigator", {});
			const store = createConsentStore(makeConfig());
			store.acceptAll();
			expect(store.getConsentRecord()?.locale).toBe("en");
		});
	});

	describe("re-consent triggers", () => {
		function v1Record(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
			return {
				schemaVersion: 1,
				decisions: { essential: true, analytics: true, marketing: true },
				jurisdiction: "EEA",
				policyVersion: "v1",
				decidedAt: "2026-04-01T00:00:00.000Z",
				locale: "en-GB",
				source: "banner",
				...overrides,
			};
		}

		function adapterFor(record: ConsentRecord | null): {
			adapter: StorageAdapter;
			writes: ConsentRecord[];
		} {
			const writes: ConsentRecord[] = [];
			return {
				writes,
				adapter: {
					read: () => record,
					write: (r) => {
						writes.push(r);
					},
					clear: () => {},
				},
			};
		}

		function listenForReprompt(): { events: { reason: string }[]; off: () => void } {
			const events: { reason: string }[] = [];
			const dispatchEvent = vi.fn((event: Event) => {
				if (event.type === "oncookies:reprompt") {
					const detail = (event as CustomEvent).detail as { reason: string };
					events.push(detail);
				}
				return true;
			});
			vi.stubGlobal("dispatchEvent", dispatchEvent);
			return {
				events,
				off: () => vi.unstubAllGlobals(),
			};
		}

		afterEach(() => {
			vi.useRealTimers();
			vi.unstubAllGlobals();
		});

		describe("policyVersionChanged", () => {
			it("invalidates state when stored policyVersion differs from config", () => {
				const { adapter } = adapterFor(v1Record({ policyVersion: "v1" }));
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v2",
						triggers: { policyVersionChanged: true },
					}),
				);
				const s = store.getState();
				expect(s.repromptReason).toBe("policyVersion");
				expect(s.route).toBe("cookie");
				expect(s.decidedAt).toBeNull();
				expect(s.decisions).toEqual({ essential: true, analytics: false, marketing: false });
				expect(store.getConsentRecord()).toBeNull();
				expect(store.getPreviousRecord()?.policyVersion).toBe("v1");
			});

			it("does not invalidate when versions match", () => {
				const { adapter } = adapterFor(v1Record({ policyVersion: "v1" }));
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v1",
						triggers: { policyVersionChanged: true },
					}),
				);
				expect(store.getState().repromptReason).toBeNull();
				expect(store.getPreviousRecord()).toBeNull();
			});
		});

		describe("categoriesAdded", () => {
			it("invalidates when a new category appears in config", () => {
				const stored = v1Record({
					decisions: { essential: true, analytics: true },
					policyVersion: "v1",
				});
				const { adapter } = adapterFor(stored);
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v1",
						triggers: { categoriesAdded: true },
					}),
				);
				expect(store.getState().repromptReason).toBe("categoriesAdded");
				expect(store.getPreviousRecord()).toMatchObject({
					decisions: { essential: true, analytics: true },
				});
			});

			it("does not fire if the existing category set matches", () => {
				const { adapter } = adapterFor(v1Record({ policyVersion: "v1" }));
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v1",
						triggers: { categoriesAdded: true },
					}),
				);
				expect(store.getState().repromptReason).toBeNull();
			});
		});

		describe("expiresAfter", () => {
			it("invalidates when the record is older than the duration", () => {
				vi.useFakeTimers();
				vi.setSystemTime(new Date("2026-04-29T00:00:00.000Z"));
				const { adapter } = adapterFor(
					v1Record({ policyVersion: "v1", decidedAt: "2026-04-01T00:00:00.000Z" }),
				);
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v1",
						triggers: { expiresAfter: "1 day" },
					}),
				);
				expect(store.getState().repromptReason).toBe("expired");
			});

			it("does not invalidate when within the duration", () => {
				vi.useFakeTimers();
				vi.setSystemTime(new Date("2026-04-01T01:00:00.000Z"));
				const { adapter } = adapterFor(
					v1Record({ policyVersion: "v1", decidedAt: "2026-04-01T00:00:00.000Z" }),
				);
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v1",
						triggers: { expiresAfter: "13 months" },
					}),
				);
				expect(store.getState().repromptReason).toBeNull();
			});
		});

		describe("jurisdictionChanged", () => {
			it("invalidates when the visitor crosses a jurisdiction boundary (sync resolver)", () => {
				const { adapter } = adapterFor(v1Record({ jurisdiction: "EEA", policyVersion: "v1" }));
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v1",
						jurisdictionResolver: manualResolver("US"),
						triggers: { jurisdictionChanged: true },
					}),
				);
				expect(store.getState().repromptReason).toBe("jurisdiction");
				expect(store.getState().jurisdiction).toBe("US");
			});

			it("invalidates after async jurisdiction resolution", async () => {
				const { adapter } = adapterFor(v1Record({ jurisdiction: "EEA", policyVersion: "v1" }));
				const resolver: JurisdictionResolver = {
					resolve: () => Promise.resolve("US"),
				};
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v1",
						jurisdictionResolver: resolver,
						triggers: { jurisdictionChanged: true },
					}),
				);
				expect(store.getState().repromptReason).toBeNull();
				await flushMicrotasks();
				expect(store.getState().repromptReason).toBe("jurisdiction");
				expect(store.getPreviousRecord()?.jurisdiction).toBe("EEA");
			});
		});

		describe("event dispatch", () => {
			it("emits oncookies:reprompt on globalThis when a trigger fires", async () => {
				const { events, off } = listenForReprompt();
				try {
					const { adapter } = adapterFor(v1Record({ policyVersion: "v1" }));
					createConsentStore(
						makeConfig({
							adapter,
							policyVersion: "v2",
							triggers: { policyVersionChanged: true },
						}),
					);
					await flushMicrotasks();
					expect(events).toHaveLength(1);
					expect(events[0]).toEqual({ reason: "policyVersion" });
				} finally {
					off();
				}
			});

			it("does not emit when no trigger fires", async () => {
				const { events, off } = listenForReprompt();
				try {
					const { adapter } = adapterFor(v1Record({ policyVersion: "v1" }));
					createConsentStore(
						makeConfig({
							adapter,
							policyVersion: "v1",
							triggers: { policyVersionChanged: true },
						}),
					);
					await flushMicrotasks();
					expect(events).toHaveLength(0);
				} finally {
					off();
				}
			});
		});

		describe("clearing reprompt state on user decision", () => {
			it("clears repromptReason and previousRecord after acceptAll", () => {
				const { adapter, writes } = adapterFor(v1Record({ policyVersion: "v1" }));
				const store = createConsentStore(
					makeConfig({
						adapter,
						policyVersion: "v2",
						triggers: { policyVersionChanged: true },
					}),
				);
				expect(store.getState().repromptReason).toBe("policyVersion");
				store.acceptAll();
				expect(store.getState().repromptReason).toBeNull();
				expect(store.getPreviousRecord()).toBeNull();
				expect(writes).toHaveLength(1);
				expect(writes[0]?.policyVersion).toBe("v2");
			});

			it("clears repromptReason after acceptNecessary, reject, and save", () => {
				const stored = v1Record({ policyVersion: "v1" });
				for (const action of ["acceptNecessary", "reject", "save"] as const) {
					const { adapter } = adapterFor(stored);
					const store = createConsentStore(
						makeConfig({
							adapter,
							policyVersion: "v2",
							triggers: { policyVersionChanged: true },
						}),
					);
					expect(store.getState().repromptReason).toBe("policyVersion");
					store[action]();
					expect(store.getState().repromptReason).toBeNull();
					expect(store.getPreviousRecord()).toBeNull();
				}
			});
		});

		it("getPreviousRecord is null when no trigger fired", () => {
			const { adapter } = adapterFor(v1Record({ policyVersion: "v1" }));
			const store = createConsentStore(
				makeConfig({
					adapter,
					policyVersion: "v1",
					triggers: { policyVersionChanged: true },
				}),
			);
			expect(store.getPreviousRecord()).toBeNull();
		});

		it("does not write to adapter while in repromptReason state", () => {
			const { adapter, writes } = adapterFor(v1Record({ policyVersion: "v1" }));
			createConsentStore(
				makeConfig({
					adapter,
					policyVersion: "v2",
					triggers: { policyVersionChanged: true },
				}),
			);
			expect(writes).toEqual([]);
		});
	});
});
