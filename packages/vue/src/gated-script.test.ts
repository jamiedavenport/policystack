// @vitest-environment happy-dom
import type { PolicyStackConfig } from "@policystack/core";
import {
	defineScript,
	type ConsentStore,
	type ScriptDefinition,
	type ScriptEvent,
} from "@policystack/core/consent";
import { mount, renderToString } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h, nextTick, ref, shallowRef } from "vue";
import { GatedScript, useConsentStore } from "./consent";
import { PolicyStack } from "./provider";

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
	const def = shallowRef(options?.def ?? analyticsDef());
	const onEvent = shallowRef(options?.onEvent);
	const secondDef = shallowRef<ScriptDefinition | undefined>(options?.secondDef);
	const mounted = ref(true);
	let store: ConsentStore | undefined;

	const Harness = defineComponent({
		setup: () => {
			store = useConsentStore();
			return () => [
				mounted.value ? h(GatedScript, { def: def.value, onEvent: onEvent.value }) : null,
				secondDef.value ? h(GatedScript, { def: secondDef.value, onEvent: onEvent.value }) : null,
			];
		},
	});

	const wrapper = mount(PolicyStack, {
		props: { config: policyConfig },
		slots: { default: () => h(Harness) },
	});

	return { wrapper, store: () => store!, def, onEvent, mounted };
}

function grant(store: ConsentStore, key = "analytics") {
	store.toggle(key);
	store.save();
}

afterEach(() => {
	vi.restoreAllMocks();
	for (const key of ["testTag", "mktTag", "calls"]) delete win()[key];
});

describe("GatedScript", () => {
	it("uses the provider store and renders no DOM", () => {
		const events: ScriptEvent[] = [];
		const { wrapper } = mountHarness({ onEvent: (event) => events.push(event) });
		expect(events).toEqual([{ type: "script:gated", id: "test-analytics" }]);
		expect(wrapper.html().replaceAll(/<!--.*?-->/g, "")).toBe("");
	});

	it("throws outside PolicyStack", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => mount(GatedScript, { props: { def: analyticsDef() } })).toThrow(
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

	it("loads immediately when consent already exists", async () => {
		const events: ScriptEvent[] = [];
		let store: ConsentStore | undefined;
		const show = ref(false);
		const Harness = defineComponent({
			setup: () => {
				store = useConsentStore();
				return () =>
					show.value
						? h(GatedScript, { def: analyticsDef(), onEvent: (e) => events.push(e) })
						: null;
			},
		});
		mount(PolicyStack, {
			props: { config: policyConfig },
			slots: { default: () => h(Harness) },
		});
		grant(store!);
		show.value = true;
		await nextTick();
		expect(events.map((event) => event.type)).toEqual(["script:loaded"]);
	});

	it("disposes a pending gate on unmount", async () => {
		const { mounted } = mountHarness();
		expect(win().testTag).toBeTypeOf("function");
		mounted.value = false;
		await nextTick();
		expect(win().testTag).toBeUndefined();
	});

	it("keeps one gate across same-ID inline definition updates", async () => {
		const events: ScriptEvent[] = [];
		const { def, store } = mountHarness({ onEvent: (event) => events.push(event) });
		(win().testTag as (...args: unknown[]) => void)("queued");
		def.value = analyticsDef();
		await nextTick();
		expect(events.filter((event) => event.type === "script:gated")).toHaveLength(1);
		grant(store());
		expect(win().calls).toEqual([["queued"]]);
	});

	it("re-gates when the definition ID changes", async () => {
		const events: ScriptEvent[] = [];
		const { def } = mountHarness({ onEvent: (event) => events.push(event) });
		def.value = analyticsDef("second");
		await nextTick();
		expect(events).toEqual([
			{ type: "script:gated", id: "test-analytics" },
			{ type: "script:gated", id: "second" },
		]);
	});

	it("uses the latest callback without re-gating", async () => {
		const first: ScriptEvent[] = [];
		const second: ScriptEvent[] = [];
		const { onEvent } = mountHarness({ onEvent: (event) => first.push(event) });
		onEvent.value = (event) => second.push(event);
		await nextTick();
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

	it("is inert during SSR", async () => {
		const events: ScriptEvent[] = [];
		const html = await renderToString(PolicyStack, {
			props: { config: policyConfig },
			slots: {
				default: () =>
					h(GatedScript, { def: analyticsDef(), onEvent: (event) => events.push(event) }),
			},
		});
		expect(html.replaceAll(/<!--.*?-->/g, "")).toBe("");
		expect(events).toEqual([]);
	});
});
