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
		expect(localStorage.getItem("ps_consent")).toBe(JSON.stringify(sample));
	});

	it("uses a custom key", () => {
		const adapter = localStorageAdapter({ key: "custom" });
		adapter.write(sample);
		expect(localStorage.getItem("custom")).toBe(JSON.stringify(sample));
		expect(localStorage.getItem("ps_consent")).toBeNull();
		expect(localStorage.getItem("oc_consent")).toBeNull();
	});

	it("reads a pre-rebrand oc_consent record so visitors are not re-prompted", () => {
		localStorage.setItem("oc_consent", JSON.stringify(sample));
		expect(localStorageAdapter().read()).toEqual(sample);
	});

	it("prefers the canonical key over the legacy one", () => {
		const legacy: ConsentRecord = { ...sample, policyVersion: "v0" };
		localStorage.setItem("oc_consent", JSON.stringify(legacy));
		localStorage.setItem("ps_consent", JSON.stringify(sample));
		expect(localStorageAdapter().read()).toEqual(sample);
	});

	it("writes to the canonical key and leaves the legacy value untouched", () => {
		localStorage.setItem("oc_consent", JSON.stringify(sample));
		const adapter = localStorageAdapter();
		adapter.write(sample);
		expect(localStorage.getItem("ps_consent")).toBe(JSON.stringify(sample));
		expect(localStorage.getItem("oc_consent")).toBe(JSON.stringify(sample));
	});

	it("does not read the legacy key when a custom key is set", () => {
		localStorage.setItem("oc_consent", JSON.stringify(sample));
		expect(localStorageAdapter({ key: "custom" }).read()).toBeNull();
	});

	it("clear() removes the legacy key too, so consent is not resurrected", () => {
		localStorage.setItem("oc_consent", JSON.stringify(sample));
		const adapter = localStorageAdapter();
		adapter.write(sample);
		adapter.clear();
		expect(adapter.read()).toBeNull();
		expect(localStorage.getItem("oc_consent")).toBeNull();
	});

	it("returns null when nothing is stored", () => {
		expect(localStorageAdapter().read()).toBeNull();
	});

	it("returns null when stored value is corrupt", () => {
		localStorage.setItem("ps_consent", "{not json");
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
			key: "ps_consent",
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

	it("notifies subscribers on cross-tab writes to the legacy key", () => {
		const adapter = localStorageAdapter();
		const listener = vi.fn();
		const unsubscribe = adapter.subscribe?.(listener);

		window.dispatchEvent(
			new StorageEvent("storage", {
				key: "oc_consent",
				newValue: JSON.stringify(sample),
			}),
		);
		expect(listener).toHaveBeenCalledWith(sample);

		// Once the canonical key holds a value it wins, so a stale legacy-key
		// event must not roll the visitor back.
		localStorage.setItem("ps_consent", JSON.stringify(sample));
		listener.mockClear();
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: "oc_consent",
				newValue: JSON.stringify({ ...sample, policyVersion: "v0" }),
			}),
		);
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
