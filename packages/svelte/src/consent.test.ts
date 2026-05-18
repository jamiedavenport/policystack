// @vitest-environment happy-dom
import { createConsentStore, type Category } from "@policystack/core/consent";
import { cleanup, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createConsentReadable } from "./lib/consent/stores";
import Harness from "./__tests__/Harness.svelte";
import Orphan from "./__tests__/Orphan.svelte";

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("setPolicyStackConsentContext + getConsent", () => {
	it("provides a store created from config", () => {
		const { getByTestId } = render(Harness, { config: { categories: baseCategories } });
		expect(getByTestId("route").textContent).toBe("cookie");
		expect(getByTestId("analytics-granted").textContent).toBe("false");
	});

	it("uses a pre-created store when provided", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.toggle("analytics");
		const { getByTestId } = render(Harness, { store });
		expect(getByTestId("analytics-granted").textContent).toBe("true");
	});

	it("throws when getConsent is called without a provider", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(() => render(Orphan)).toThrow(/setPolicyStackConsentContext/);
	});

	it("re-renders consumers when state changes", () => {
		const store = createConsentStore({ categories: baseCategories });
		const { getByTestId } = render(Harness, { store });
		expect(getByTestId("route").textContent).toBe("cookie");
		store.acceptAll();
		flushSync();
		expect(getByTestId("route").textContent).toBe("closed");
		expect(getByTestId("analytics-granted").textContent).toBe("true");
	});

	it("toggle and save flow works", () => {
		const store = createConsentStore({ categories: baseCategories });
		const { getByTestId } = render(Harness, { store });
		store.toggle("analytics");
		flushSync();
		expect(getByTestId("analytics-granted").textContent).toBe("true");
		expect(getByTestId("decided-at").textContent).toBe("null");
		store.save();
		flushSync();
		expect(getByTestId("decided-at").textContent).not.toBe("null");
		expect(getByTestId("route").textContent).toBe("closed");
	});

	it("getConsentRecord returns null pre-decision and a v1 record after acceptAll", () => {
		const store = createConsentStore({ categories: baseCategories });
		const { getByTestId } = render(Harness, { store });
		expect(getByTestId("record-source").textContent).toBe("null");
		expect(getByTestId("record-schema").textContent).toBe("null");
		store.acceptAll();
		flushSync();
		expect(getByTestId("record-source").textContent).toBe("banner");
		expect(getByTestId("record-schema").textContent).toBe("1");
	});
});

describe("ConsentGate", () => {
	it("renders default snippet when expression is true", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.acceptAll();
		const { queryByTestId } = render(Harness, { store, requires: "analytics" });
		expect(queryByTestId("child")?.textContent).toBe("visible");
		expect(queryByTestId("fb")).toBeNull();
	});

	it("renders fallback snippet when expression is false", () => {
		const { queryByTestId } = render(Harness, {
			config: { categories: baseCategories },
			requires: "analytics",
		});
		expect(queryByTestId("child")).toBeNull();
		expect(queryByTestId("fb")?.textContent).toBe("nope");
	});

	it("renders nothing when no fallback and gate is closed", () => {
		const { queryByTestId } = render(Harness, {
			config: { categories: baseCategories },
			requires: "analytics",
			withFallback: false,
		});
		expect(queryByTestId("child")).toBeNull();
		expect(queryByTestId("fb")).toBeNull();
	});

	it("updates when state crosses the truth boundary", () => {
		const store = createConsentStore({ categories: baseCategories });
		const { queryByTestId } = render(Harness, { store, requires: "analytics" });
		expect(queryByTestId("child")).toBeNull();
		expect(queryByTestId("fb")?.textContent).toBe("nope");
		store.toggle("analytics");
		flushSync();
		expect(queryByTestId("child")?.textContent).toBe("visible");
		expect(queryByTestId("fb")).toBeNull();
	});

	it("evaluates compound expressions", () => {
		const store = createConsentStore({ categories: baseCategories });
		const { queryByTestId } = render(Harness, {
			store,
			requires: { and: ["analytics", "marketing"] },
		});
		expect(queryByTestId("child")).toBeNull();
		store.toggle("analytics");
		flushSync();
		expect(queryByTestId("child")).toBeNull();
		store.toggle("marketing");
		flushSync();
		expect(queryByTestId("child")?.textContent).toBe("visible");
	});
});

describe("createConsentReadable (svelte 4 stores fallback)", () => {
	it("emits initial state and updates", () => {
		const consent = createConsentReadable({ config: { categories: baseCategories } });
		const seen: string[] = [];
		const unsub = consent.subscribe((s) => seen.push(s.route));
		consent.acceptAll();
		unsub();
		expect(seen[0]).toBe("cookie");
		expect(seen.at(-1)).toBe("closed");
	});

	it("exposes action methods", () => {
		const consent = createConsentReadable({ config: { categories: baseCategories } });
		consent.toggle("analytics");
		let snapshot: { route: string; decisions: Record<string, boolean> } | undefined;
		const unsub = consent.subscribe((s) => {
			snapshot = { route: s.route, decisions: s.decisions };
		});
		unsub();
		expect(snapshot?.decisions.analytics).toBe(true);
		expect(consent.has("analytics")).toBe(true);
	});

	it("accepts a pre-created store", () => {
		const inner = createConsentStore({ categories: baseCategories });
		inner.acceptAll();
		const consent = createConsentReadable({ store: inner });
		let snapshot: { route: string } | undefined;
		const unsub = consent.subscribe((s) => {
			snapshot = { route: s.route };
		});
		unsub();
		expect(snapshot?.route).toBe("closed");
	});
});
