// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { ga4 } from "./ga4.ts";
import { flushMicrotasks, makeFakeDoc, makeStore } from "./test-helpers.ts";

afterEach(() => {
	for (const k of ["gtag", "dataLayer"]) {
		delete (window as unknown as Record<string, unknown>)[k];
	}
});

describe("ga4", () => {
	it("returns a script def matching the documented gtag.js snippet", () => {
		const def = ga4({ measurementId: "G-XXX" });
		expect(def.id).toBe("ga4");
		expect(def.requires).toBe("analytics");
		expect(def.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-XXX");
		expect(def.queue).toEqual(["dataLayer.push", "gtag"]);
	});

	it("allows overriding requires and id", () => {
		const def = ga4({ measurementId: "G-X", requires: "marketing", id: "ga4-eu" });
		expect(def.id).toBe("ga4-eu");
		expect(def.requires).toBe("marketing");
	});

	it("queues dataLayer pushes and gtag calls before consent and replays after", async () => {
		const store = makeStore();
		const { doc, scripts } = makeFakeDoc();

		gateScript(store, ga4({ measurementId: "G-XXX" }), { document: doc });

		const win = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
		win.dataLayer.push({ event: "early-push" });
		win.gtag("event", "early-event");

		store.toggle("analytics");
		store.save();
		await flushMicrotasks();

		expect(scripts[0]!.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-XXX");
		expect(typeof win.gtag).toBe("function");
		expect(win.dataLayer.length).toBeGreaterThanOrEqual(3);
		expect(win.dataLayer).toContainEqual({ event: "early-push" });
	});

	it("passes config object through to gtag('config', ...)", async () => {
		const store = makeStore(["analytics"]);
		store.save();
		const { doc } = makeFakeDoc();

		gateScript(store, ga4({ measurementId: "G-Y", config: { send_page_view: false } }), {
			document: doc,
		});
		await flushMicrotasks();

		const win = window as unknown as { dataLayer: unknown[][] };
		const configCall = win.dataLayer.find(
			(entry): entry is unknown[] => Array.isArray(entry) && entry[0] === "config",
		);
		expect(configCall).toEqual(["config", "G-Y", { send_page_view: false }]);
	});
});
