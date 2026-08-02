// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineScript, gateScript, gateScripts } from "./scripts";
import { createConsentStore } from "./store";
import type { Category, ConsentStore, ScriptDefinition, ScriptEvent } from "./types";

const flushMicrotasks = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

function makeStore(initialAccept: string[] = []): ConsentStore {
	const store = createConsentStore({
		categories: baseCategories,
		gpc: { enabled: false },
	});
	for (const k of initialAccept) store.toggle(k);
	if (initialAccept.length > 0) store.save();
	return store;
}

type FakeScript = {
	tagName: string;
	async: boolean;
	src: string;
	attrs: Record<string, string>;
	_onLoad?: () => void;
	setAttribute(k: string, v: string): void;
	addEventListener(ev: string, cb: () => void, opts?: { once?: boolean }): void;
};

function makeFakeDoc(
	onScriptLoad?: (script: FakeScript) => void,
	opts?: { manualLoad?: boolean },
): { doc: Document; scripts: FakeScript[]; triggerLoad: () => void } {
	const scripts: FakeScript[] = [];
	const pending: FakeScript[] = [];
	const fire = (script: FakeScript): void => {
		onScriptLoad?.(script);
		script._onLoad?.();
	};
	const head = {
		appendChild<T>(el: T): T {
			const script = el as unknown as FakeScript;
			if (script._onLoad) {
				if (opts?.manualLoad) pending.push(script);
				else queueMicrotask(() => fire(script));
			}
			return el;
		},
	};
	const doc = {
		head,
		documentElement: head,
		createElement(tag: string): FakeScript {
			const el: FakeScript = {
				tagName: tag.toUpperCase(),
				async: false,
				src: "",
				attrs: {},
				setAttribute(k, v) {
					el.attrs[k] = v;
				},
				addEventListener(ev, cb) {
					if (ev === "load") el._onLoad = cb;
				},
			};
			scripts.push(el);
			return el;
		},
	};
	return {
		doc: doc as unknown as Document,
		scripts,
		triggerLoad: () => {
			for (const script of pending.splice(0)) fire(script);
		},
	};
}

// The official Meta snippet's stub shape: a function that dispatches to
// callMethod once fbevents attaches it, queueing argument lists until then.
type FbqStub = {
	(...args: unknown[]): void;
	callMethod?: (...args: unknown[]) => void;
	queue: unknown[][];
};

function installOfficialFbqStub(): void {
	const w = window as unknown as { fbq?: FbqStub };
	if (w.fbq) return;
	const fbq = ((...args: unknown[]) => {
		if (fbq.callMethod) fbq.callMethod(...args);
		else fbq.queue.push(args);
	}) as FbqStub;
	fbq.queue = [];
	w.fbq = fbq;
}

// Mirrors real fbevents.js: it DECORATES the existing window.fbq (attaches
// callMethod, drains fbq.queue) and never replaces it.
function fakeFbevents(calls: unknown[][]): void {
	const fbq = (window as unknown as { fbq?: FbqStub }).fbq;
	if (!fbq) return;
	fbq.callMethod = (...args: unknown[]) => {
		calls.push(args);
	};
	while (fbq.queue.length > 0) {
		const queued = fbq.queue.shift();
		if (queued) calls.push(queued);
	}
}

afterEach(() => {
	for (const k of ["gtag", "dataLayer", "fbq", "posthog", "nope"]) {
		delete (window as unknown as Record<string, unknown>)[k];
	}
});

describe("defineScript", () => {
	it("returns its argument unchanged (identity for tree-shake)", () => {
		const def: ScriptDefinition = { id: "x", requires: "analytics" };
		expect(defineScript(def)).toBe(def);
	});
});

describe("gateScript — already granted", () => {
	it("loads immediately when the requires expr is already true", async () => {
		const store = makeStore(["analytics"]);
		const { doc, scripts } = makeFakeDoc();
		const init = vi.fn();
		const events: ScriptEvent[] = [];

		gateScript(
			store,
			{
				id: "ga4",
				requires: "analytics",
				src: "https://example.test/ga.js",
				init,
			},
			{ document: doc, onEvent: (e) => events.push(e) },
		);

		await flushMicrotasks();
		expect(init).toHaveBeenCalledTimes(1);
		expect(scripts).toHaveLength(1);
		expect(scripts[0]!.src).toBe("https://example.test/ga.js");
		expect(events.some((e) => e.type === "script:loaded")).toBe(true);
		expect(events.some((e) => e.type === "script:gated")).toBe(false);
	});
});

describe("gateScript — pending consent", () => {
	it("emits script:gated and queues calls to listed window paths", () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		const events: ScriptEvent[] = [];
		gateScript(
			store,
			{ id: "ga4", requires: "analytics", queue: ["gtag"] },
			{ document: doc, onEvent: (e) => events.push(e) },
		);

		expect(events[0]).toEqual({ type: "script:gated", id: "ga4" });
		(window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "page_view");

		expect(events.find((e) => e.type === "script:queued")).toEqual({
			type: "script:queued",
			id: "ga4",
			path: "gtag",
			args: ["event", "page_view"],
		});
	});

	it("loads the script tag, runs init, replays queued calls, fires script:loaded", async () => {
		const store = makeStore();
		const { doc, scripts } = makeFakeDoc();
		const events: ScriptEvent[] = [];
		const realGtag = vi.fn();

		gateScript(
			store,
			{
				id: "ga4",
				requires: "analytics",
				src: "https://example.test/ga.js",
				init: () => {
					(window as unknown as Record<string, unknown>).gtag = realGtag;
				},
				queue: ["gtag"],
			},
			{ document: doc, onEvent: (e) => events.push(e) },
		);

		(window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "purchase");
		expect(realGtag).not.toHaveBeenCalled();

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(scripts).toHaveLength(1);
		expect(scripts[0]!.src).toBe("https://example.test/ga.js");
		expect(realGtag).toHaveBeenCalledWith("event", "purchase");
		expect(events.some((e) => e.type === "script:loaded")).toBe(true);
	});

	it("mirrors and records dataLayer.push pre-consent, and does not double on replay", async () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		gateScript(
			store,
			{
				id: "ga4",
				requires: "analytics",
				src: "https://example.test/ga.js",
				queue: ["dataLayer.push"],
			},
			{ document: doc },
		);

		const layer = (window as unknown as { dataLayer: unknown[] }).dataLayer;
		layer.push({ event: "purchase" });
		expect(layer).toHaveLength(1);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		// same array identity: the created dataLayer must survive the hand-off
		expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toBe(layer);
		expect(layer).toHaveLength(1);
	});

	it("runs only init when there is no src", async () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		const init = vi.fn();
		gateScript(
			store,
			{
				id: "pixel",
				requires: "marketing",
				init,
			},
			{ document: doc },
		);

		expect(init).not.toHaveBeenCalled();
		store.toggle("marketing");
		store.save();
		await flushMicrotasks();
		expect(init).toHaveBeenCalledTimes(1);
	});

	it("does not throw or loop when a queued path is mis-listed", async () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		gateScript(
			store,
			{
				id: "ga4",
				requires: "analytics",
				src: "https://example.test/ga.js",
				queue: ["nope"],
			},
			{ document: doc },
		);

		(window as unknown as { nope: (...args: unknown[]) => void }).nope("hi");
		store.toggle("analytics");
		store.save();
		await expect(flushMicrotasks()).resolves.toBeUndefined();
	});

	it("warns and no-ops when the same id is gated twice on the same store", () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		gateScript(store, { id: "dup", requires: "analytics", queue: ["gtag"] }, { document: doc });
		gateScript(store, { id: "dup", requires: "analytics", queue: ["gtag"] }, { document: doc });
		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});

	it("dispose() restores the original window value while still gated", () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		expect((window as unknown as Record<string, unknown>).gtag).toBeUndefined();
		const dispose = gateScript(
			store,
			{ id: "ga4", requires: "analytics", queue: ["gtag"] },
			{ document: doc },
		);
		expect(typeof (window as unknown as Record<string, unknown>).gtag).toBe("function");
		dispose();
		expect((window as unknown as Record<string, unknown>).gtag).toBeUndefined();
	});

	it("does not unload or re-init when consent is revoked after load", async () => {
		const store = makeStore();
		const { doc, scripts } = makeFakeDoc();
		const init = vi.fn();
		gateScript(
			store,
			{
				id: "ga4",
				requires: "analytics",
				src: "https://example.test/ga.js",
				init,
			},
			{ document: doc },
		);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();
		expect(init).toHaveBeenCalledTimes(1);
		expect(scripts).toHaveLength(1);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(init).toHaveBeenCalledTimes(1);
		expect(scripts).toHaveLength(1);
	});
});

describe("gateScript — SSR", () => {
	it("emits script:gated and returns a no-op dispose when window is unavailable", () => {
		const store = makeStore();
		const events: ScriptEvent[] = [];
		const dispose = gateScript(
			store,
			{ id: "ssr", requires: "analytics", queue: ["gtag"] },
			{
				window: undefined,
				document: undefined,
				onEvent: (e) => events.push(e),
			},
		);
		expect(events).toEqual([{ type: "script:gated", id: "ssr" }]);
		expect(typeof dispose).toBe("function");
		dispose();
	});
});

describe("gateScripts", () => {
	it("gates each definition and returns a combined dispose", async () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		const init1 = vi.fn();
		const init2 = vi.fn();
		const dispose = gateScripts(
			store,
			[
				{ id: "a", requires: "analytics", init: init1 },
				{ id: "b", requires: "marketing", init: init2 },
			],
			{ document: doc },
		);
		store.toggle("analytics");
		store.toggle("marketing");
		store.save();
		await flushMicrotasks();
		expect(init1).toHaveBeenCalledTimes(1);
		expect(init2).toHaveBeenCalledTimes(1);
		dispose();
	});
});

describe("gateScript — snippet-order lifecycle (#156)", () => {
	it("runs init before the script tag is injected", async () => {
		const store = makeStore(["analytics"]);
		const { doc, scripts } = makeFakeDoc();
		let scriptsAtInit = -1;

		gateScript(
			store,
			{
				id: "ga4",
				requires: "analytics",
				src: "https://example.test/ga.js",
				init: () => {
					scriptsAtInit = scripts.length;
				},
			},
			{ document: doc },
		);

		await flushMicrotasks();
		expect(scriptsAtInit).toBe(0);
		expect(scripts).toHaveLength(1);
	});

	it("creates the vendor stub before load on the already-granted path", async () => {
		const store = makeStore(["marketing"]);
		const calls: unknown[][] = [];
		let fbqPresentAtLoad = false;
		const { doc } = makeFakeDoc(() => {
			fbqPresentAtLoad = typeof (window as unknown as Record<string, unknown>).fbq === "function";
			fakeFbevents(calls);
		});

		gateScript(
			store,
			{
				id: "fbq",
				requires: "marketing",
				src: "https://connect.facebook.net/en_US/fbevents.js",
				init: () => {
					installOfficialFbqStub();
					(window as unknown as { fbq: (...args: unknown[]) => void }).fbq("init", "PID");
				},
				queue: ["fbq"],
			},
			{ document: doc },
		);

		await flushMicrotasks();
		expect(fbqPresentAtLoad).toBe(true);
		expect(calls).toEqual([["init", "PID"]]);
	});

	it("restores the original global before init runs", async () => {
		const original = vi.fn();
		(window as unknown as Record<string, unknown>).gtag = original;
		const store = makeStore();
		const { doc } = makeFakeDoc();
		let gtagAtInit: unknown;

		gateScript(
			store,
			{
				id: "ga4",
				requires: "analytics",
				queue: ["gtag"],
				init: () => {
					gtagAtInit = (window as unknown as Record<string, unknown>).gtag;
				},
			},
			{ document: doc },
		);

		expect((window as unknown as Record<string, unknown>).gtag).not.toBe(original);
		store.toggle("analytics");
		store.save();
		await flushMicrotasks();
		expect(gtagAtInit).toBe(original);
	});

	it("queues calls during download in the vendor stub and emits script:loaded only after the load event", async () => {
		const store = makeStore(["marketing"]);
		const calls: unknown[][] = [];
		const events: ScriptEvent[] = [];
		const { doc, triggerLoad } = makeFakeDoc(() => fakeFbevents(calls), { manualLoad: true });

		gateScript(
			store,
			{
				id: "fbq",
				requires: "marketing",
				src: "https://connect.facebook.net/en_US/fbevents.js",
				init: installOfficialFbqStub,
				queue: ["fbq"],
			},
			{ document: doc, onEvent: (e) => events.push(e) },
		);

		await flushMicrotasks();
		(window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "MidDownload");
		expect(events.some((e) => e.type === "script:loaded")).toBe(false);
		expect(calls).toEqual([]);

		triggerLoad();
		await flushMicrotasks();
		expect(calls).toEqual([["track", "MidDownload"]]);
		expect(events.some((e) => e.type === "script:loaded")).toBe(true);
	});

	it("delivers calls made after the script has loaded", async () => {
		const store = makeStore(["marketing"]);
		const calls: unknown[][] = [];
		const { doc } = makeFakeDoc(() => fakeFbevents(calls));

		gateScript(
			store,
			{
				id: "fbq",
				requires: "marketing",
				src: "https://connect.facebook.net/en_US/fbevents.js",
				init: installOfficialFbqStub,
				queue: ["fbq"],
			},
			{ document: doc },
		);

		await flushMicrotasks();
		(window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "Late");
		expect(calls).toEqual([["track", "Late"]]);
	});

	it("forwards calls through a captured stub reference after the hand-off", async () => {
		const store = makeStore();
		const calls: unknown[][] = [];
		const { doc } = makeFakeDoc(() => fakeFbevents(calls));

		gateScript(
			store,
			{
				id: "fbq",
				requires: "marketing",
				src: "https://connect.facebook.net/en_US/fbevents.js",
				init: installOfficialFbqStub,
				queue: ["fbq"],
			},
			{ document: doc },
		);

		const captured = (window as unknown as { fbq: (...args: unknown[]) => void }).fbq;
		captured("track", "Early");

		store.toggle("marketing");
		store.save();
		await flushMicrotasks();

		captured("track", "Late");
		expect(calls).toEqual([
			["track", "Early"],
			["track", "Late"],
		]);
	});

	it("removes stub-created parent objects on consent so init sees a clean slate", async () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		let posthogAtInit: unknown = "sentinel";

		gateScript(
			store,
			{
				id: "ph",
				requires: "analytics",
				queue: ["posthog.capture"],
				init: () => {
					posthogAtInit = (window as unknown as Record<string, unknown>).posthog;
				},
			},
			{ document: doc },
		);

		expect(typeof (window as unknown as Record<string, unknown>).posthog).toBe("object");
		store.toggle("analytics");
		store.save();
		await flushMicrotasks();
		expect(posthogAtInit).toBeUndefined();
	});

	it("does not emit script:loaded when disposed during download", async () => {
		const store = makeStore(["analytics"]);
		const events: ScriptEvent[] = [];
		const { doc, triggerLoad } = makeFakeDoc(undefined, { manualLoad: true });

		const dispose = gateScript(
			store,
			{ id: "ga4", requires: "analytics", src: "https://example.test/ga.js" },
			{ document: doc, onEvent: (e) => events.push(e) },
		);

		await flushMicrotasks();
		dispose();
		triggerLoad();
		await flushMicrotasks();
		expect(events.some((e) => e.type === "script:loaded")).toBe(false);
	});
});

describe("vendor snippet shapes", () => {
	it("works end-to-end with a GA4-style snippet", async () => {
		const store = makeStore();
		const { doc, scripts } = makeFakeDoc();
		gateScript(
			store,
			{
				id: "ga4",
				requires: "analytics",
				src: "https://www.googletagmanager.com/gtag/js?id=G-XXX",
				init: () => {
					const win = window as unknown as {
						dataLayer: unknown[];
						gtag: (...args: unknown[]) => void;
					};
					win.dataLayer = win.dataLayer || [];
					win.gtag = (...args: unknown[]) => {
						win.dataLayer.push(args);
					};
					win.gtag("js", new Date());
					win.gtag("config", "G-XXX");
				},
				queue: ["dataLayer.push"],
			},
			{ document: doc },
		);

		const layer = (window as unknown as { dataLayer: unknown[] }).dataLayer;
		layer.push({ event: "early" });
		expect(layer).toHaveLength(1);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		const after = (window as unknown as { dataLayer: unknown[] }).dataLayer;
		expect(after.length).toBeGreaterThanOrEqual(3);
		expect(scripts[0]!.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-XXX");
		expect(typeof (window as unknown as { gtag: unknown }).gtag).toBe("function");
	});

	it("works end-to-end with a Meta Pixel-style snippet (vendor decorates, never replaces)", async () => {
		const store = makeStore();
		const calls: unknown[][] = [];
		const { doc } = makeFakeDoc(() => fakeFbevents(calls));

		gateScript(
			store,
			{
				id: "fbq",
				requires: "marketing",
				src: "https://connect.facebook.net/en_US/fbevents.js",
				init: () => {
					installOfficialFbqStub();
					const w = window as unknown as { fbq: (...args: unknown[]) => void };
					w.fbq("init", "1234567890");
					w.fbq("track", "PageView");
				},
				queue: ["fbq"],
			},
			{ document: doc },
		);

		const w = window as unknown as { fbq: (...args: unknown[]) => void };
		w.fbq("track", "Purchase", { value: 100 });
		expect(calls).toEqual([]);

		store.toggle("marketing");
		store.save();
		await flushMicrotasks();

		expect(calls).toEqual([
			["init", "1234567890"],
			["track", "PageView"],
			["track", "Purchase", { value: 100 }],
		]);
	});

	it("works end-to-end with a PostHog-style snippet", async () => {
		const store = makeStore();
		const { doc } = makeFakeDoc();
		const captured: unknown[][] = [];

		gateScript(
			store,
			{
				id: "posthog",
				requires: "analytics",
				src: "https://us-assets.i.posthog.com/array.js",
				init: () => {
					(window as unknown as Record<string, unknown>).posthog = {
						capture: (...args: unknown[]) => captured.push(["capture", ...args]),
						identify: (...args: unknown[]) => captured.push(["identify", ...args]),
					};
				},
				queue: ["posthog.capture", "posthog.identify"],
			},
			{ document: doc },
		);

		const ph = (
			window as unknown as {
				posthog: {
					capture: (...args: unknown[]) => void;
					identify: (...args: unknown[]) => void;
				};
			}
		).posthog;
		ph.capture("$pageview");
		ph.identify("user-1", { plan: "pro" });
		expect(captured).toEqual([]);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(captured).toEqual([
			["capture", "$pageview"],
			["identify", "user-1", { plan: "pro" }],
		]);
	});
});
