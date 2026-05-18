// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
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

	it("calls posthog.init with the api key + api_host once loaded and replays queued calls", async () => {
		const store = makeStore();
		const init = vi.fn();
		const capture = vi.fn();
		const { doc } = makeFakeDoc(() => {
			(window as unknown as Record<string, unknown>).posthog = { init, capture };
		});

		gateScript(store, posthog({ apiKey: "phc_abc", options: { autocapture: false } }), {
			document: doc,
		});

		const w = window as unknown as {
			posthog: { capture: (...args: unknown[]) => void };
		};
		w.posthog.capture("$pageview");

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(init).toHaveBeenCalledWith("phc_abc", {
			api_host: "https://us.i.posthog.com",
			autocapture: false,
		});
		expect(capture).toHaveBeenCalledWith("$pageview");
	});
});
