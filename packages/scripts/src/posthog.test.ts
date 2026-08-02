// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { posthog } from "./posthog.ts";
import { flushMicrotasks, makeFakeDoc, makeStore } from "./test-helpers.ts";

afterEach(() => {
	delete (window as unknown as Record<string, unknown>).posthog;
});

describe("posthog", () => {
	it("returns a script def with the default US asset host and queue", () => {
		const def = posthog({ apiKey: "phc_abc" });
		expect(def.id).toBe("posthog");
		expect(def.requires).toBe("analytics");
		expect(def.src).toBe("https://us.i.posthog.com/static/array.js");
		expect(def.queue).toEqual([
			"posthog.capture",
			"posthog.identify",
			"posthog.alias",
			"posthog.set",
			"posthog.reset",
			"posthog.group",
		]);
	});

	it("respects a custom apiHost (e.g. EU region)", () => {
		const def = posthog({ apiKey: "phc_abc", apiHost: "https://eu.i.posthog.com" });
		expect(def.src).toBe("https://eu.i.posthog.com/static/array.js");
	});

	it("registers the api key in _i and queues calls where array.js drains them", async () => {
		const store = makeStore();
		const inits: unknown[][] = [];
		const drained: unknown[][] = [];
		let stubIsArrayAtLoad: boolean | null = null;
		// Mirrors real array.js: it hydrates the snippet's stub in place —
		// reads posthog._i for init registrations and drains the queued
		// [method, ...args] entries from the array. It never replaces it.
		const { doc } = makeFakeDoc(() => {
			const ph = (window as unknown as Record<string, unknown>).posthog as
				| (unknown[] & { _i?: unknown[][] })
				| undefined;
			stubIsArrayAtLoad = Array.isArray(ph);
			if (!ph) return;
			for (const entry of ph._i ?? []) inits.push(entry);
			while (ph.length > 0) drained.push(ph.shift() as unknown[]);
		});

		gateScript(store, posthog({ apiKey: "phc_abc", options: { autocapture: false } }), {
			document: doc,
		});

		const w = window as unknown as {
			posthog: { capture: (...args: unknown[]) => void };
		};
		w.posthog.capture("$pageview");
		expect(drained).toEqual([]);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(stubIsArrayAtLoad).toBe(true);
		expect(inits).toEqual([
			["phc_abc", { api_host: "https://us.i.posthog.com", autocapture: false }, "posthog"],
		]);
		expect(drained).toEqual([["capture", "$pageview"]]);
	});
});
