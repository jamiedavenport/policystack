// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
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

	it("populates _hjSettings on load and replays queued hj calls", async () => {
		const store = makeStore();
		const realHj = vi.fn();
		const { doc } = makeFakeDoc(() => {
			(window as unknown as Record<string, unknown>).hj = realHj;
		});

		gateScript(store, hotjar({ siteId: 42 }), { document: doc });

		const w = window as unknown as { hj: (...args: unknown[]) => void };
		w.hj("event", "purchase");

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect((window as unknown as { _hjSettings: unknown })._hjSettings).toEqual({
			hjid: 42,
			hjsv: 6,
		});
		expect(realHj).toHaveBeenCalledWith("event", "purchase");
	});
});
