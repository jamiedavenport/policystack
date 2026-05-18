// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
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

	it("calls analytics.page() on init and replays queued tracks", async () => {
		const store = makeStore();
		const page = vi.fn();
		const track = vi.fn();
		const { doc } = makeFakeDoc(() => {
			(window as unknown as Record<string, unknown>).analytics = { page, track };
		});

		gateScript(store, segment({ writeKey: "WK" }), { document: doc });

		const w = window as unknown as {
			analytics: { track: (...args: unknown[]) => void };
		};
		w.analytics.track("Signed Up", { plan: "pro" });

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(page).toHaveBeenCalledTimes(1);
		expect(track).toHaveBeenCalledWith("Signed Up", { plan: "pro" });
	});
});
