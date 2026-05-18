// @vitest-environment happy-dom
import { gateScript } from "@policystack/core/consent";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { metaPixel } from "./meta-pixel.ts";
import { flushMicrotasks, makeFakeDoc, makeStore } from "./test-helpers.ts";

afterEach(() => {
	delete (window as unknown as Record<string, unknown>).fbq;
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

	it("queues fbq calls pre-consent and fires init/PageView + replay after", async () => {
		const store = makeStore();
		const realFbq = vi.fn();
		const { doc } = makeFakeDoc(() => {
			(window as unknown as Record<string, unknown>).fbq = realFbq;
		});

		gateScript(store, metaPixel({ pixelId: "PID" }), { document: doc });

		const w = window as unknown as { fbq: (...args: unknown[]) => void };
		w.fbq("track", "Purchase", { value: 100 });
		expect(realFbq).not.toHaveBeenCalled();

		store.toggle("marketing");
		store.save();
		await flushMicrotasks();

		expect(realFbq).toHaveBeenCalledWith("init", "PID");
		expect(realFbq).toHaveBeenCalledWith("track", "PageView");
		expect(realFbq).toHaveBeenCalledWith("track", "Purchase", { value: 100 });
	});
});
