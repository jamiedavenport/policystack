// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { metaPixel } from "./meta-pixel.ts";
import { flushMicrotasks, makeFakeDoc, makeStore } from "./test-helpers.ts";

type FbqStub = {
	(...args: unknown[]): void;
	callMethod?: (...args: unknown[]) => void;
	queue: unknown[][];
};

// Mirrors real fbevents.js: it DECORATES the existing window.fbq (attaches
// callMethod, drains fbq.queue) and never replaces it — the official snippet's
// stub must already exist when the script runs.
function fakeFbevents(calls: unknown[][], state: { stubPresentAtLoad: boolean | null }): void {
	const fbq = (window as unknown as { fbq?: FbqStub }).fbq;
	state.stubPresentAtLoad = typeof fbq === "function" && Array.isArray(fbq.queue);
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
	for (const k of ["fbq", "_fbq"]) {
		delete (window as unknown as Record<string, unknown>)[k];
	}
});

describe("metaPixel", () => {
	it("returns a script def matching the documented fbevents snippet", () => {
		const def = metaPixel({ pixelId: "1234567890" });
		expect(def.id).toBe("meta-pixel");
		expect(def.requires).toBe("marketing");
		expect(def.src).toBe("https://connect.facebook.net/en_US/fbevents.js");
		expect(def.queue).toEqual(["fbq"]);
	});

	it("allows overriding requires and id", () => {
		const def = metaPixel({ pixelId: "1", requires: "analytics", id: "fb" });
		expect(def.id).toBe("fb");
		expect(def.requires).toBe("analytics");
	});

	it("queues fbq calls pre-consent and delivers init, PageView, then the replay", async () => {
		const store = makeStore();
		const calls: unknown[][] = [];
		const state = { stubPresentAtLoad: null as boolean | null };
		const { doc } = makeFakeDoc(() => fakeFbevents(calls, state));

		gateScript(store, metaPixel({ pixelId: "PID" }), { document: doc });

		const w = window as unknown as { fbq: (...args: unknown[]) => void };
		w.fbq("track", "Purchase", { value: 100 });
		expect(calls).toEqual([]);

		store.toggle("marketing");
		store.save();
		await flushMicrotasks();

		expect(state.stubPresentAtLoad).toBe(true);
		expect(calls).toEqual([
			["init", "PID"],
			["track", "PageView"],
			["track", "Purchase", { value: 100 }],
		]);
	});

	it("provides the snippet stub on the already-granted path and delivers post-load calls", async () => {
		const store = makeStore(["marketing"]);
		const calls: unknown[][] = [];
		const state = { stubPresentAtLoad: null as boolean | null };
		const { doc } = makeFakeDoc(() => fakeFbevents(calls, state));

		gateScript(store, metaPixel({ pixelId: "PID" }), { document: doc });
		await flushMicrotasks();

		expect(state.stubPresentAtLoad).toBe(true);
		expect(calls).toEqual([
			["init", "PID"],
			["track", "PageView"],
		]);

		(window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "Late");
		expect(calls).toContainEqual(["track", "Late"]);
	});
});
