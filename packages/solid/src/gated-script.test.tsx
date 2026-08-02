// @vitest-environment happy-dom
import type { PolicyStackConfig } from "@policystack/core";
import {
	defineScript,
	type ConsentStore,
	type ScriptDefinition,
	type ScriptEvent,
} from "@policystack/core/consent";
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, Show } from "solid-js";
import {
	createEffect as createServerEffect,
	createRoot as createServerRoot,
} from "solid-js/dist/server.js";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { GatedScript, PolicyStack, useConsentStore } from "./index";

const policyConfig: PolicyStackConfig = {
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
	data: { collected: {}, context: {} },
	cookies: {
		used: { essential: true, analytics: true, marketing: true },
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
			marketing: { lawfulBasis: "consent" },
		},
	},
};

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
	def?: ScriptDefinition;
	onEvent?: (event: ScriptEvent) => void;
	secondDef?: ScriptDefinition;
}) {
	const [def, setDef] = createSignal(options?.def ?? analyticsDef());
	const [onEvent, setOnEvent] = createSignal(options?.onEvent);
	const [mounted, setMounted] = createSignal(true);
	let store: ConsentStore | undefined;

	const result = render(() => (
		<PolicyStack config={policyConfig}>
			{(() => {
				store = useConsentStore();
				return null;
			})()}
			<Show when={mounted()}>
				<GatedScript def={def()} onEvent={onEvent()} />
			</Show>
			{options?.secondDef ? <GatedScript def={options.secondDef} onEvent={onEvent()} /> : null}
		</PolicyStack>
	));

	return { ...result, store: () => store!, setDef, setOnEvent, setMounted };
}

function grant(store: ConsentStore, key = "analytics") {
	store.toggle(key);
	store.save();
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	for (const key of ["testTag", "mktTag", "calls"]) delete win()[key];
});

describe("GatedScript", () => {
	it("uses the provider store and renders no DOM", () => {
		const events: ScriptEvent[] = [];
		const { container } = mountHarness({ onEvent: (event) => events.push(event) });
		expect(events).toEqual([{ type: "script:gated", id: "test-analytics" }]);
		expect(container.innerHTML).toBe("");
	});

	it("throws outside PolicyStack", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(() => <GatedScript def={analyticsDef()} />)).toThrow(
			/must be used inside <PolicyStack>/,
		);
	});

	it("queues calls until consent is saved, then replays them", () => {
		const events: ScriptEvent[] = [];
		const { store } = mountHarness({ onEvent: (event) => events.push(event) });
		(win().testTag as (...args: unknown[]) => void)("event", "signup");
		expect(events.at(-1)).toMatchObject({ type: "script:queued", path: "testTag" });
		grant(store());
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
		grant(store(), "marketing");
		expect(events.map((event) => event.type)).toEqual(["script:gated"]);
	});

	it("loads immediately when consent already exists", () => {
		const events: ScriptEvent[] = [];
		const { store, setMounted } = mountHarness({ onEvent: (event) => events.push(event) });
		setMounted(false);
		grant(store());
		events.length = 0;
		setMounted(true);
		expect(events.map((event) => event.type)).toEqual(["script:loaded"]);
	});

	it("disposes a pending gate on unmount", () => {
		const { setMounted } = mountHarness();
		expect(win().testTag).toBeTypeOf("function");
		setMounted(false);
		expect(win().testTag).toBeUndefined();
	});

	it("keeps one gate across same-ID inline definition updates", () => {
		const events: ScriptEvent[] = [];
		const { setDef, store } = mountHarness({ onEvent: (event) => events.push(event) });
		(win().testTag as (...args: unknown[]) => void)("queued");
		setDef(analyticsDef());
		expect(events.filter((event) => event.type === "script:gated")).toHaveLength(1);
		grant(store());
		expect(win().calls).toEqual([["queued"]]);
	});

	it("re-gates when the definition ID changes", () => {
		const events: ScriptEvent[] = [];
		const { setDef } = mountHarness({ onEvent: (event) => events.push(event) });
		setDef(analyticsDef("second"));
		expect(events).toEqual([
			{ type: "script:gated", id: "test-analytics" },
			{ type: "script:gated", id: "second" },
		]);
	});

	it("uses the latest callback without re-gating", () => {
		const first: ScriptEvent[] = [];
		const second: ScriptEvent[] = [];
		const { setOnEvent } = mountHarness({ onEvent: (event) => first.push(event) });
		setOnEvent(() => (event) => second.push(event));
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
		grant(store());
		expect(events).toContainEqual({ type: "script:loaded", id: "test-analytics" });
		expect(events).not.toContainEqual({ type: "script:loaded", id: "test-marketing" });
	});

	it("is inert during SSR", () => {
		let effectRan = false;
		createServerRoot(() => {
			createServerEffect(() => {
				effectRan = true;
			});
		});
		// GatedScript owns all calls to gateScript inside createEffect. Solid's
		// server implementation intentionally drops that effect.
		expect(effectRan).toBe(false);
	});
});
