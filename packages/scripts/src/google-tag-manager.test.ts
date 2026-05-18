// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { googleTagManager } from "./google-tag-manager.ts";
import { flushMicrotasks, makeFakeDoc, makeStore } from "./test-helpers.ts";

afterEach(() => {
	delete (window as unknown as Record<string, unknown>).dataLayer;
});

describe("googleTagManager", () => {
	it("returns a script def matching the documented gtm.js snippet", () => {
		const def = googleTagManager({ containerId: "GTM-ABC" });
		expect(def.id).toBe("google-tag-manager");
		expect(def.requires).toBe("marketing");
		expect(def.src).toBe("https://www.googletagmanager.com/gtm.js?id=GTM-ABC");
		expect(def.queue).toEqual(["dataLayer.push"]);
	});

	it("seeds dataLayer with gtm.start and replays early pushes after consent", async () => {
		const store = makeStore();
		const { doc, scripts } = makeFakeDoc();

		gateScript(store, googleTagManager({ containerId: "GTM-ABC" }), {
			document: doc,
		});

		const win = window as unknown as { dataLayer: unknown[] };
		win.dataLayer.push({ event: "early" });

		store.toggle("marketing");
		store.save();
		await flushMicrotasks();

		expect(scripts[0]!.src).toBe("https://www.googletagmanager.com/gtm.js?id=GTM-ABC");
		expect(win.dataLayer).toContainEqual({ event: "early" });
		const startEntry = win.dataLayer.find(
			(e): e is Record<string, unknown> =>
				typeof e === "object" && e !== null && "gtm.start" in (e as object),
		);
		expect(startEntry).toMatchObject({ event: "gtm.js" });
	});
});
