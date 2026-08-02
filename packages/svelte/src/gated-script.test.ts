// @vitest-environment happy-dom
import {
	createConsentStore,
	defineScript,
	type Category,
	type ConsentStore,
	type ScriptDefinition,
	type ScriptEvent,
} from "@policystack/core/consent";
import { cleanup, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { compile } from "svelte/compiler";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import GatedScriptHarness from "./__tests__/GatedScriptHarness.svelte";
import GatedScript from "./lib/consent/GatedScript.svelte";
import gatedScriptSource from "./lib/consent/GatedScript.svelte?raw";

const categories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

function analyticsDef(id = "test-analytics"): ScriptDefinition {
	return defineScript({
		id,
		requires: "analytics",
		queue: ["testTag"],
		init: () => {
			const target = window as unknown as {
				testTag: (...args: unknown[]) => void;
				calls: unknown[];
			};
			target.calls = target.calls ?? [];
			target.testTag = (...args) => target.calls.push(args);
		},
	});
}

function marketingDef(): ScriptDefinition {
	return defineScript({ id: "test-marketing", requires: "marketing", queue: ["mktTag"] });
}

type TestWindow = Record<string, unknown> & { calls?: unknown[] };

function win(): TestWindow {
	return window as unknown as TestWindow;
}

function mountHarness(options?: {
	store?: ConsentStore;
	def?: ScriptDefinition;
	onEvent?: (event: ScriptEvent) => void;
	secondDef?: ScriptDefinition;
}) {
	const store = options?.store ?? createConsentStore({ categories });
	const props = {
		store,
		def: options?.def ?? analyticsDef(),
		onEvent: options?.onEvent,
		secondDef: options?.secondDef,
	};
	const result = render(GatedScriptHarness, props);
	flushSync();
	return { ...result, store, props };
}

function grant(store: ConsentStore, key = "analytics") {
	store.toggle(key);
	store.save();
	flushSync();
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	for (const key of ["testTag", "mktTag", "calls"]) delete win()[key];
});

describe("GatedScript", () => {
	it("uses the context store and renders no DOM", () => {
		const events: ScriptEvent[] = [];
		const { container } = mountHarness({ onEvent: (event) => events.push(event) });
		expect(events).toEqual([{ type: "script:gated", id: "test-analytics" }]);
		expect(container.innerHTML.replaceAll(/<!--.*?-->/g, "").trim()).toBe("");
	});

	it("throws without consent context", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(GatedScript, { def: analyticsDef() })).toThrow(
			/setPolicyStackConsentContext/,
		);
	});

	it("queues calls until consent is saved, then replays them", () => {
		const events: ScriptEvent[] = [];
		const { store } = mountHarness({ onEvent: (event) => events.push(event) });
		(win().testTag as (...args: unknown[]) => void)("event", "signup");
		expect(events.at(-1)).toMatchObject({ type: "script:queued", path: "testTag" });
		grant(store);
		expect(events.map((event) => event.type)).toEqual([
			"script:gated",
			"script:queued",
			"script:loaded",
		]);
		expect(win().calls).toEqual([["event", "signup"]]);
	});

	it("ignores unrelated consent", () => {
		const events: ScriptEvent[] = [];
		const { store } = mountHarness({ onEvent: (event) => events.push(event) });
		grant(store, "marketing");
		expect(events.map((event) => event.type)).toEqual(["script:gated"]);
	});

	it("loads immediately when consent already exists", () => {
		const events: ScriptEvent[] = [];
		const store = createConsentStore({ categories });
		grant(store);
		mountHarness({ store, onEvent: (event) => events.push(event) });
		expect(events.map((event) => event.type)).toEqual(["script:loaded"]);
	});

	it("disposes a pending gate when destroyed", () => {
		const { unmount } = mountHarness();
		expect(win().testTag).toBeTypeOf("function");
		unmount();
		flushSync();
		expect(win().testTag).toBeUndefined();
	});

	it("keeps one gate across same-ID inline definition updates", async () => {
		const events: ScriptEvent[] = [];
		const { rerender, store, props } = mountHarness({ onEvent: (event) => events.push(event) });
		(win().testTag as (...args: unknown[]) => void)("queued");
		await rerender({ ...props, def: analyticsDef() });
		flushSync();
		expect(events.filter((event) => event.type === "script:gated")).toHaveLength(1);
		grant(store);
		expect(win().calls).toEqual([["queued"]]);
	});

	it("re-gates when the definition ID changes", async () => {
		const events: ScriptEvent[] = [];
		const { rerender, props } = mountHarness({ onEvent: (event) => events.push(event) });
		await rerender({ ...props, def: analyticsDef("second") });
		flushSync();
		expect(events).toEqual([
			{ type: "script:gated", id: "test-analytics" },
			{ type: "script:gated", id: "second" },
		]);
	});

	it("uses the latest callback without re-gating", async () => {
		const first: ScriptEvent[] = [];
		const second: ScriptEvent[] = [];
		const { rerender, props } = mountHarness({ onEvent: (event) => first.push(event) });
		await rerender({ ...props, onEvent: (event: ScriptEvent) => second.push(event) });
		flushSync();
		(win().testTag as (...args: unknown[]) => void)("late");
		expect(first).toEqual([{ type: "script:gated", id: "test-analytics" }]);
		expect(second[0]).toMatchObject({ type: "script:queued", path: "testTag" });
	});

	it("gates multiple definitions independently", () => {
		const events: ScriptEvent[] = [];
		const { store } = mountHarness({
			onEvent: (event) => events.push(event),
			secondDef: marketingDef(),
		});
		grant(store);
		expect(events).toContainEqual({ type: "script:loaded", id: "test-analytics" });
		expect(events).not.toContainEqual({ type: "script:loaded", id: "test-marketing" });
	});

	it("is inert during SSR", () => {
		const { js } = compile(gatedScriptSource, {
			filename: "GatedScript.svelte",
			generate: "server",
			runes: true,
		});
		// The server compiler removes the `$effect` body entirely: it neither
		// invokes gateScript nor emits markup into the renderer.
		expect(js.code).not.toContain("gateScript(consent");
		expect(js.code).not.toContain("$$renderer.push");
	});
});
