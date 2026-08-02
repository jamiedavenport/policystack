// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { hotjar } from "./hotjar.ts";
import { flushMicrotasks, makeFakeDoc, makeStore } from "./test-helpers.ts";

afterEach(() => {
	for (const k of ["hj", "_hjSettings"]) {
		delete (window as unknown as Record<string, unknown>)[k];
	}
});

describe("hotjar", () => {
	it("returns a script def matching the documented hotjar snippet", () => {
		const def = hotjar({ siteId: 1234567 });
		expect(def.id).toBe("hotjar");
		expect(def.requires).toBe("analytics");
		expect(def.src).toBe("https://static.hotjar.com/c/hotjar-1234567.js?sv=6");
		expect(def.queue).toEqual(["hj"]);
	});

	it("supports overriding the snippet version", () => {
		const def = hotjar({ siteId: "999", version: 7 });
		expect(def.src).toBe("https://static.hotjar.com/c/hotjar-999.js?sv=7");
	});

	it("sets _hjSettings and queues replayed hj calls in hj.q before the script loads", async () => {
		const store = makeStore();
		const drained: unknown[][] = [];
		let settingsAtLoad: unknown;
		// Mirrors the real hotjar script: it reads _hjSettings and drains the
		// snippet stub's hj.q queue when it boots.
		const { doc } = makeFakeDoc(() => {
			const w = window as unknown as { hj?: { q?: unknown[][] }; _hjSettings?: unknown };
			settingsAtLoad = w._hjSettings;
			for (const args of w.hj?.q ?? []) drained.push(args);
		});

		gateScript(store, hotjar({ siteId: 42 }), { document: doc });

		const w = window as unknown as { hj: (...args: unknown[]) => void };
		w.hj("event", "purchase");
		expect(drained).toEqual([]);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(settingsAtLoad).toEqual({ hjid: 42, hjsv: 6 });
		expect(drained).toEqual([["event", "purchase"]]);
	});
});
