// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { ConsentRecord } from "../types";
import { localStorageAdapter } from "./local-storage";

const sample: ConsentRecord = {
	schemaVersion: 1,
	decisions: { essential: true, analytics: false },
	jurisdiction: "eea",
	policyVersion: "v1",
	decidedAt: "2026-04-29T00:00:00.000Z",
	locale: "en-GB",
	source: "banner",
};

describe("localStorageAdapter", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("writes and reads the same record (default key)", () => {
		const adapter = localStorageAdapter();
		adapter.write(sample);
		expect(adapter.read()).toEqual(sample);
		expect(localStorage.getItem("oc_consent")).toBe(JSON.stringify(sample));
	});

	it("uses a custom key", () => {
		const adapter = localStorageAdapter({ key: "custom" });
		adapter.write(sample);
		expect(localStorage.getItem("custom")).toBe(JSON.stringify(sample));
		expect(localStorage.getItem("oc_consent")).toBeNull();
	});

	it("returns null when nothing is stored", () => {
		expect(localStorageAdapter().read()).toBeNull();
	});

	it("returns null when stored value is corrupt", () => {
		localStorage.setItem("oc_consent", "{not json");
		expect(localStorageAdapter().read()).toBeNull();
	});

	it("clear() removes the value", () => {
		const adapter = localStorageAdapter();
		adapter.write(sample);
		adapter.clear();
		expect(adapter.read()).toBeNull();
	});

	it("falls back to in-memory when localStorage throws", () => {
		const broken: Storage = {
			getItem: () => {
				throw new Error("denied");
			},
			setItem: () => {
				throw new Error("denied");
			},
			removeItem: () => {
				throw new Error("denied");
			},
			clear: () => {},
			key: () => null,
			length: 0,
		};
		vi.stubGlobal("localStorage", broken);
		const adapter = localStorageAdapter();
		adapter.write(sample);
		expect(adapter.read()).toEqual(sample);
		adapter.clear();
		expect(adapter.read()).toBeNull();
	});

	it("falls back to in-memory when localStorage is undefined (SSR)", () => {
		vi.stubGlobal("localStorage", undefined);
		const adapter = localStorageAdapter();
		adapter.write(sample);
		expect(adapter.read()).toEqual(sample);
	});

	it("notifies subscribers on cross-tab storage events for the watched key", () => {
		const adapter = localStorageAdapter();
		const listener = vi.fn();
		const unsubscribe = adapter.subscribe?.(listener);
		expect(unsubscribe).toBeTypeOf("function");

		const event = new StorageEvent("storage", {
			key: "oc_consent",
			newValue: JSON.stringify(sample),
		});
		window.dispatchEvent(event);
		expect(listener).toHaveBeenCalledWith(sample);

		const otherEvent = new StorageEvent("storage", {
			key: "other_key",
			newValue: "x",
		});
		listener.mockClear();
		window.dispatchEvent(otherEvent);
		expect(listener).not.toHaveBeenCalled();

		unsubscribe?.();
	});

	it("subscribe returns a no-op unsubscribe when window is unavailable", () => {
		vi.stubGlobal("window", undefined);
		const adapter = localStorageAdapter();
		const unsubscribe = adapter.subscribe?.(() => {});
		expect(unsubscribe).toBeTypeOf("function");
		unsubscribe?.();
	});
});
