// @vitest-environment happy-dom
import { createConsentStore, type Category } from "@policystack/core/consent";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ConsentGate, PolicyStackConsentProvider, useCategory, useConsent } from "./consent";

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

function Wrapper({ children }: { children: ReactNode }) {
	return (
		<PolicyStackConsentProvider config={{ categories: baseCategories }}>
			{children}
		</PolicyStackConsentProvider>
	);
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("PolicyStackConsentProvider", () => {
	it("provides a store created from config", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: Wrapper });
		expect(result.current.route).toBe("cookie");
		expect(result.current.decisions).toEqual({
			essential: true,
			analytics: false,
			marketing: false,
		});
	});

	it("uses a pre-created store when provided", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.toggle("analytics");
		const { result } = renderHook(() => useConsent(), {
			wrapper: ({ children }) => (
				<PolicyStackConsentProvider store={store}>{children}</PolicyStackConsentProvider>
			),
		});
		expect(result.current.decisions.analytics).toBe(true);
	});

	it("throws when hooks are used outside the provider", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => renderHook(() => useConsent())).toThrow(/PolicyStackConsentProvider/);
	});
});

describe("useConsent", () => {
	it("returns the full state slice and actions", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: Wrapper });
		expect(result.current).toMatchObject({
			route: "cookie",
			categories: baseCategories,
			jurisdiction: null,
		});
		for (const key of [
			"acceptAll",
			"acceptNecessary",
			"reject",
			"toggle",
			"save",
			"setRoute",
			"has",
		] as const) {
			expect(typeof result.current[key]).toBe("function");
		}
	});

	it("re-renders consumers when state changes", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: Wrapper });
		act(() => {
			result.current.acceptAll();
		});
		expect(result.current.route).toBe("closed");
		expect(result.current.decisions.analytics).toBe(true);
	});

	it("setRoute updates the route", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: Wrapper });
		act(() => {
			result.current.setRoute("preferences");
		});
		expect(result.current.route).toBe("preferences");
	});

	it("toggle and save flow works through the hook", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: Wrapper });
		act(() => {
			result.current.toggle("analytics");
		});
		expect(result.current.decisions.analytics).toBe(true);
		expect(result.current.decidedAt).toBeNull();
		act(() => {
			result.current.save();
		});
		expect(result.current.decidedAt).not.toBeNull();
		expect(result.current.route).toBe("closed");
	});

	it("getConsentRecord returns null pre-decision and a v1 record after acceptAll", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: Wrapper });
		expect(result.current.getConsentRecord()).toBeNull();
		act(() => {
			result.current.acceptAll();
		});
		const record = result.current.getConsentRecord();
		expect(record).not.toBeNull();
		expect(record?.schemaVersion).toBe(1);
		expect(record?.source).toBe("banner");
	});
});

describe("useCategory", () => {
	it("returns granted false initially for non-locked categories", () => {
		const { result } = renderHook(() => useCategory("analytics"), {
			wrapper: Wrapper,
		});
		expect(result.current.granted).toBe(false);
	});

	it("returns granted true for locked categories", () => {
		const { result } = renderHook(() => useCategory("essential"), {
			wrapper: Wrapper,
		});
		expect(result.current.granted).toBe(true);
	});

	it("flips on toggle", () => {
		const { result } = renderHook(() => useCategory("analytics"), {
			wrapper: Wrapper,
		});
		act(() => {
			result.current.toggle();
		});
		expect(result.current.granted).toBe(true);
	});

	it("does not re-render when an unrelated category changes", () => {
		const renders = { analytics: 0, marketing: 0 };
		function ProbeAnalytics() {
			const a = useCategory("analytics");
			renders.analytics++;
			return <span data-testid="a">{String(a.granted)}</span>;
		}
		function ProbeMarketing() {
			const m = useCategory("marketing");
			renders.marketing++;
			return <span data-testid="m">{String(m.granted)}</span>;
		}
		const store = createConsentStore({ categories: baseCategories });
		render(
			<PolicyStackConsentProvider store={store}>
				<ProbeAnalytics />
				<ProbeMarketing />
			</PolicyStackConsentProvider>,
		);
		const before = { ...renders };
		act(() => {
			store.toggle("marketing");
		});
		expect(renders.analytics).toBe(before.analytics);
		expect(renders.marketing).toBeGreaterThan(before.marketing);
	});
});

describe("ConsentGate", () => {
	it("renders children when expression evaluates true", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.acceptAll();
		render(
			<PolicyStackConsentProvider store={store}>
				<ConsentGate requires="analytics">
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStackConsentProvider>,
		);
		expect(screen.getByTestId("child").textContent).toBe("visible");
	});

	it("renders fallback when expression is false", () => {
		render(
			<PolicyStackConsentProvider config={{ categories: baseCategories }}>
				<ConsentGate requires="analytics" fallback={<span data-testid="fb">nope</span>}>
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStackConsentProvider>,
		);
		expect(screen.queryByTestId("child")).toBeNull();
		expect(screen.getByTestId("fb").textContent).toBe("nope");
	});

	it("renders nothing when no fallback and gate is closed", () => {
		const { container } = render(
			<PolicyStackConsentProvider config={{ categories: baseCategories }}>
				<ConsentGate requires="analytics">
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStackConsentProvider>,
		);
		expect(container.textContent).toBe("");
	});

	it("updates when state crosses the truth boundary", () => {
		const store = createConsentStore({ categories: baseCategories });
		render(
			<PolicyStackConsentProvider store={store}>
				<ConsentGate requires="analytics" fallback={<span data-testid="fb">nope</span>}>
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStackConsentProvider>,
		);
		expect(screen.queryByTestId("child")).toBeNull();
		act(() => {
			store.toggle("analytics");
		});
		expect(screen.getByTestId("child").textContent).toBe("visible");
		expect(screen.queryByTestId("fb")).toBeNull();
	});

	it("evaluates compound expressions via OP-296's evaluator", () => {
		const store = createConsentStore({ categories: baseCategories });
		render(
			<PolicyStackConsentProvider store={store}>
				<ConsentGate
					requires={{ and: ["analytics", "marketing"] }}
					fallback={<span data-testid="fb">need both</span>}
				>
					<span data-testid="child">both granted</span>
				</ConsentGate>
			</PolicyStackConsentProvider>,
		);
		expect(screen.queryByTestId("child")).toBeNull();
		act(() => {
			store.toggle("analytics");
		});
		expect(screen.queryByTestId("child")).toBeNull();
		act(() => {
			store.toggle("marketing");
		});
		expect(screen.getByTestId("child").textContent).toBe("both granted");
	});
});
