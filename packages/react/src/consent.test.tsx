// @vitest-environment happy-dom
import type { PolicyStackConfig } from "@policystack/core";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ConsentGate, useCategory, useConsent } from "./consent";
import { PolicyStack } from "./provider";

// Cookie posture that derives to the same three categories the old hand-rolled
// `baseCategories` array used: essential (locked, legal obligation), analytics
// and marketing (consent-gated).
const policyConfig: PolicyStackConfig = {
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
	data: { collected: {}, context: {} },
	cookies: {
		used: { essential: true, analytics: true, marketing: true },
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
			marketing: { lawfulBasis: "consent" },
		},
	},
};

const expectedCategories = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics", locked: false },
	{ key: "marketing", label: "Marketing", locked: false },
];

function Wrapper({ children }: { children: ReactNode }) {
	return <PolicyStack config={policyConfig}>{children}</PolicyStack>;
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("consent hooks read the single PolicyStack context", () => {
	it("derives the store from the one config", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: Wrapper });
		expect(result.current.route).toBe("cookie");
		expect(result.current.decisions).toEqual({
			essential: true,
			analytics: false,
			marketing: false,
		});
	});

	it("throws when hooks are used outside <PolicyStack>", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => renderHook(() => useConsent())).toThrow(/must be used inside <PolicyStack>/);
	});
});

describe("useConsent", () => {
	it("returns the full state slice and actions", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: Wrapper });
		expect(result.current).toMatchObject({
			route: "cookie",
			categories: expectedCategories,
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
		function ToggleMarketing() {
			const { toggle } = useConsent();
			return (
				<button type="button" onClick={() => toggle("marketing")}>
					toggle-marketing
				</button>
			);
		}
		render(
			<PolicyStack config={policyConfig}>
				<ProbeAnalytics />
				<ProbeMarketing />
				<ToggleMarketing />
			</PolicyStack>,
		);
		const before = { ...renders };
		act(() => {
			screen.getByText("toggle-marketing").click();
		});
		expect(renders.analytics).toBe(before.analytics);
		expect(renders.marketing).toBeGreaterThan(before.marketing);
	});
});

describe("ConsentGate", () => {
	function GateHarness({ children }: { children: ReactNode }) {
		const { acceptAll } = useConsent();
		return (
			<>
				<button type="button" onClick={() => acceptAll()}>
					accept-all
				</button>
				{children}
			</>
		);
	}

	it("renders children when expression evaluates true", () => {
		render(
			<PolicyStack config={policyConfig}>
				<GateHarness>
					<ConsentGate requires="analytics">
						<span data-testid="child">visible</span>
					</ConsentGate>
				</GateHarness>
			</PolicyStack>,
		);
		expect(screen.queryByTestId("child")).toBeNull();
		act(() => {
			screen.getByText("accept-all").click();
		});
		expect(screen.getByTestId("child").textContent).toBe("visible");
	});

	it("renders fallback when expression is false", () => {
		render(
			<PolicyStack config={policyConfig}>
				<ConsentGate requires="analytics" fallback={<span data-testid="fb">nope</span>}>
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStack>,
		);
		expect(screen.queryByTestId("child")).toBeNull();
		expect(screen.getByTestId("fb").textContent).toBe("nope");
	});

	it("renders nothing when no fallback and gate is closed", () => {
		const { container } = render(
			<PolicyStack config={policyConfig}>
				<ConsentGate requires="analytics">
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStack>,
		);
		expect(container.textContent).toBe("");
	});

	it("evaluates compound expressions via the shared evaluator", () => {
		function ToggleBoth() {
			const { toggle } = useConsent();
			return (
				<>
					<button type="button" onClick={() => toggle("analytics")}>
						tog-a
					</button>
					<button type="button" onClick={() => toggle("marketing")}>
						tog-m
					</button>
				</>
			);
		}
		render(
			<PolicyStack config={policyConfig}>
				<ToggleBoth />
				<ConsentGate
					requires={{ and: ["analytics", "marketing"] }}
					fallback={<span data-testid="fb">need both</span>}
				>
					<span data-testid="child">both granted</span>
				</ConsentGate>
			</PolicyStack>,
		);
		expect(screen.queryByTestId("child")).toBeNull();
		act(() => {
			screen.getByText("tog-a").click();
		});
		expect(screen.queryByTestId("child")).toBeNull();
		act(() => {
			screen.getByText("tog-m").click();
		});
		expect(screen.getByTestId("child").textContent).toBe("both granted");
	});
});
