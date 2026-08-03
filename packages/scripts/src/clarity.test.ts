// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { clarity } from "./clarity.ts";
import { flushMicrotasks, makeFakeDoc, makeStore } from "./test-helpers.ts";

afterEach(() => {
	delete (window as unknown as Record<string, unknown>).clarity;
});

describe("clarity", () => {
	it("returns a script def matching the documented clarity snippet", () => {
		const def = clarity({ projectId: "abc123" });
		expect(def.id).toBe("clarity");
		expect(def.requires).toBe("analytics");
		expect(def.src).toBe("https://www.clarity.ms/tag/abc123");
		expect(def.queue).toEqual(["clarity"]);
	});

	it("supports overriding the consent expression and id", () => {
		const def = clarity({
			projectId: "abc123",
			requires: { and: ["analytics", "marketing"] },
			id: "clarity-main",
		});
		expect(def.requires).toEqual({ and: ["analytics", "marketing"] });
		expect(def.id).toBe("clarity-main");
	});

	it("queues a denied-ads consentv2 call ahead of replayed calls before the script loads", async () => {
		const store = makeStore();
		const drained: unknown[][] = [];
		// Mirrors the real clarity script: it drains the snippet stub's
		// clarity.q queue when it boots.
		const { doc } = makeFakeDoc(() => {
			const w = window as unknown as { clarity?: { q?: unknown[][] } };
			for (const args of w.clarity?.q ?? []) drained.push(args);
		});

		gateScript(store, clarity({ projectId: "abc123" }), { document: doc });

		const w = window as unknown as { clarity: (...args: unknown[]) => void };
		w.clarity("event", "signup");
		expect(drained).toEqual([]);

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(drained).toEqual([
			["consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }],
			["event", "signup"],
		]);
	});

	it("sends ad_Storage granted when configured", async () => {
		const store = makeStore();
		const drained: unknown[][] = [];
		const { doc } = makeFakeDoc(() => {
			const w = window as unknown as { clarity?: { q?: unknown[][] } };
			for (const args of w.clarity?.q ?? []) drained.push(args);
		});

		gateScript(store, clarity({ projectId: "abc123", adStorage: "granted" }), { document: doc });

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(drained).toEqual([
			["consentv2", { ad_Storage: "granted", analytics_Storage: "granted" }],
		]);
	});
});
