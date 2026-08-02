// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { segment } from "./segment.ts";
import { flushMicrotasks, makeFakeDoc, makeStore } from "./test-helpers.ts";

afterEach(() => {
	delete (window as unknown as Record<string, unknown>).analytics;
});

describe("segment", () => {
	it("returns a script def matching the documented analytics.js snippet", () => {
		const def = segment({ writeKey: "WK" });
		expect(def.id).toBe("segment");
		expect(def.requires).toBe("analytics");
		expect(def.src).toBe("https://cdn.segment.com/analytics.js/v1/WK/analytics.min.js");
		expect(def.queue).toEqual([
			"analytics.track",
			"analytics.page",
			"analytics.identify",
			"analytics.group",
			"analytics.alias",
			"analytics.reset",
		]);
	});

	it("queues page() and replayed tracks in the snippet array that analytics.min.js drains", async () => {
		const store = makeStore();
		const drained: unknown[][] = [];
		let stubIsArrayAtLoad: boolean | null = null;
		let writeKeyAtLoad: unknown;
		// Mirrors real analytics.min.js: it consumes window.analytics as an
		// ARRAY of queued [method, ...args] entries — a leftover plain object
		// breaks it, so the shape at load time is the regression under test.
		const { doc } = makeFakeDoc(() => {
			const analytics = (window as unknown as Record<string, unknown>).analytics as
				| (unknown[] & { _writeKey?: string })
				| undefined;
			stubIsArrayAtLoad = Array.isArray(analytics);
			if (!Array.isArray(analytics)) return;
			writeKeyAtLoad = analytics._writeKey;
			while (analytics.length > 0) drained.push(analytics.shift() as unknown[]);
		});

		gateScript(store, segment({ writeKey: "WK" }), { document: doc });

		const w = window as unknown as {
			analytics: { track: (...args: unknown[]) => void };
		};
		w.analytics.track("Signed Up", { plan: "pro" });
		expect(drained).toEqual([]);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(stubIsArrayAtLoad).toBe(true);
		expect(writeKeyAtLoad).toBe("WK");
		expect(drained).toEqual([["page"], ["track", "Signed Up", { plan: "pro" }]]);
	});
});
