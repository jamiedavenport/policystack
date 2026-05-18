// @vitest-environment happy-dom
import { createConsentStore, type Category } from "@policystack/core/consent";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
	ConsentGate,
	PolicyStackConsentProvider,
	useCategory,
	useConsent,
	type UseCategoryResult,
	type UseConsentResult,
} from "./index.ts";

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

function withProvider(probe: (consent: UseConsentResult) => unknown): UseConsentResult {
	let captured: UseConsentResult | undefined;
	render(() => (
		<PolicyStackConsentProvider config={{ categories: baseCategories }}>
			{(() => {
				captured = useConsent();
				probe(captured);
				return <div data-testid="probe" />;
			})()}
		</PolicyStackConsentProvider>
	));
	return captured!;
}

describe("PolicyStackConsentProvider", () => {
	it("provides a store created from config", () => {
		const consent = withProvider(() => {});
		expect(consent.route()).toBe("cookie");
		expect(consent.decisions()).toEqual({
			essential: true,
			analytics: false,
			marketing: false,
		});
	});

	it("uses a pre-created store when provided", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.acceptAll();
		let captured: UseConsentResult | undefined;
		render(() => (
			<PolicyStackConsentProvider store={store}>
				{(() => {
					captured = useConsent();
					return null;
				})()}
			</PolicyStackConsentProvider>
		));
		expect(captured?.route()).toBe("closed");
		expect(captured?.decisions().analytics).toBe(true);
	});

	it("throws when used outside any provider", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(() => <Orphan />)).toThrow(/PolicyStackConsentProvider/);
	});
});

function Orphan() {
	useConsent();
	return <div />;
}

describe("useConsent", () => {
	it("re-renders consumers when state changes", () => {
		const store = createConsentStore({ categories: baseCategories });
		render(() => (
			<PolicyStackConsentProvider store={store}>
				<RouteLabel />
			</PolicyStackConsentProvider>
		));
		expect(screen.getByTestId("route").textContent).toBe("cookie");
		store.acceptAll();
		expect(screen.getByTestId("route").textContent).toBe("closed");
	});

	it("toggle and save flow works", () => {
		const consent = withProvider(() => {});
		consent.toggle("analytics");
		expect(consent.decisions().analytics).toBe(true);
		expect(consent.decidedAt()).toBeNull();
		consent.save();
		expect(consent.decidedAt()).not.toBeNull();
		expect(consent.route()).toBe("closed");
	});

	it("setRoute updates the route", () => {
		const consent = withProvider(() => {});
		consent.setRoute("preferences");
		expect(consent.route()).toBe("preferences");
	});
});

function RouteLabel() {
	const { route } = useConsent();
	return <span data-testid="route">{route()}</span>;
}

describe("useCategory", () => {
	function withCategory(key: string): UseCategoryResult {
		let captured: UseCategoryResult | undefined;
		render(() => (
			<PolicyStackConsentProvider config={{ categories: baseCategories }}>
				{(() => {
					captured = useCategory(key);
					return null;
				})()}
			</PolicyStackConsentProvider>
		));
		return captured!;
	}

	it("returns granted false initially for non-locked categories", () => {
		expect(withCategory("analytics").granted()).toBe(false);
	});

	it("returns granted true for locked categories", () => {
		expect(withCategory("essential").granted()).toBe(true);
	});

	it("flips on toggle", () => {
		const cat = withCategory("analytics");
		cat.toggle();
		expect(cat.granted()).toBe(true);
	});
});

describe("ConsentGate", () => {
	it("renders default children when expression is true", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.acceptAll();
		render(() => (
			<PolicyStackConsentProvider store={store}>
				<ConsentGate requires="analytics">
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStackConsentProvider>
		));
		expect(screen.queryByTestId("child")?.textContent).toBe("visible");
	});

	it("renders fallback when expression is false", () => {
		render(() => (
			<PolicyStackConsentProvider config={{ categories: baseCategories }}>
				<ConsentGate requires="analytics" fallback={<span data-testid="fb">nope</span>}>
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStackConsentProvider>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		expect(screen.queryByTestId("fb")?.textContent).toBe("nope");
	});

	it("renders nothing when no fallback and gate is closed", () => {
		const { container } = render(() => (
			<PolicyStackConsentProvider config={{ categories: baseCategories }}>
				<ConsentGate requires="analytics">
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStackConsentProvider>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		expect(container.textContent).toBe("");
	});

	it("updates when state crosses the truth boundary", () => {
		const store = createConsentStore({ categories: baseCategories });
		render(() => (
			<PolicyStackConsentProvider store={store}>
				<ConsentGate requires="analytics" fallback={<span data-testid="fb">nope</span>}>
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStackConsentProvider>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		expect(screen.queryByTestId("fb")?.textContent).toBe("nope");
		store.toggle("analytics");
		expect(screen.queryByTestId("child")?.textContent).toBe("visible");
		expect(screen.queryByTestId("fb")).toBeNull();
	});

	it("evaluates compound expressions", () => {
		const store = createConsentStore({ categories: baseCategories });
		render(() => (
			<PolicyStackConsentProvider store={store}>
				<ConsentGate
					requires={{ and: ["analytics", "marketing"] }}
					fallback={<span data-testid="fb">need both</span>}
				>
					<span data-testid="child">both</span>
				</ConsentGate>
			</PolicyStackConsentProvider>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		store.toggle("analytics");
		expect(screen.queryByTestId("child")).toBeNull();
		store.toggle("marketing");
		expect(screen.queryByTestId("child")?.textContent).toBe("both");
	});

	it("toggle through accessor flips the gate", () => {
		render(() => (
			<PolicyStackConsentProvider config={{ categories: baseCategories }}>
				<ToggleProbe />
			</PolicyStackConsentProvider>
		));
		expect(screen.queryByTestId("gated")).toBeNull();
		fireEvent.click(screen.getByTestId("toggle"));
		expect(screen.queryByTestId("gated")?.textContent).toBe("on");
	});
});

function ToggleProbe() {
	const { toggle } = useConsent();
	return (
		<div>
			<button data-testid="toggle" onClick={() => toggle("analytics")} type="button">
				flip
			</button>
			<ConsentGate requires="analytics">
				<span data-testid="gated">on</span>
			</ConsentGate>
		</div>
	);
}
