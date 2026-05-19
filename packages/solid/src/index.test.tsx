// @vitest-environment happy-dom
import type { PolicyStackConfig } from "@policystack/core";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
	ConsentGate,
	PolicyStack,
	useCategory,
	useConsent,
	type UseCategoryResult,
	type UseConsentResult,
} from "./index.ts";

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

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

function withProvider(probe: (consent: UseConsentResult) => unknown): UseConsentResult {
	let captured: UseConsentResult | undefined;
	render(() => (
		<PolicyStack config={policyConfig}>
			{(() => {
				captured = useConsent();
				probe(captured);
				return <div data-testid="probe" />;
			})()}
		</PolicyStack>
	));
	return captured!;
}

describe("PolicyStack provider", () => {
	it("derives the store from the one config", () => {
		const consent = withProvider(() => {});
		expect(consent.route()).toBe("cookie");
		expect(consent.decisions()).toEqual({
			essential: true,
			analytics: false,
			marketing: false,
		});
	});

	it("throws when used outside <PolicyStack>", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(() => <Orphan />)).toThrow(/must be used inside <PolicyStack>/);
	});
});

function Orphan() {
	useConsent();
	return <div />;
}

describe("useConsent", () => {
	it("re-renders consumers when state changes", () => {
		let consent: UseConsentResult | undefined;
		render(() => (
			<PolicyStack config={policyConfig}>
				<RouteLabel />
				{(() => {
					consent = useConsent();
					return null;
				})()}
			</PolicyStack>
		));
		expect(screen.getByTestId("route").textContent).toBe("cookie");
		consent?.acceptAll();
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
			<PolicyStack config={policyConfig}>
				{(() => {
					captured = useCategory(key);
					return null;
				})()}
			</PolicyStack>
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
		let consent: UseConsentResult | undefined;
		render(() => (
			<PolicyStack config={policyConfig}>
				{(() => {
					consent = useConsent();
					return null;
				})()}
				<ConsentGate requires="analytics">
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStack>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		consent?.acceptAll();
		expect(screen.queryByTestId("child")?.textContent).toBe("visible");
	});

	it("renders fallback when expression is false", () => {
		render(() => (
			<PolicyStack config={policyConfig}>
				<ConsentGate requires="analytics" fallback={<span data-testid="fb">nope</span>}>
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStack>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		expect(screen.queryByTestId("fb")?.textContent).toBe("nope");
	});

	it("renders nothing when no fallback and gate is closed", () => {
		const { container } = render(() => (
			<PolicyStack config={policyConfig}>
				<ConsentGate requires="analytics">
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStack>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		expect(container.textContent).toBe("");
	});

	it("updates when state crosses the truth boundary", () => {
		let consent: UseConsentResult | undefined;
		render(() => (
			<PolicyStack config={policyConfig}>
				{(() => {
					consent = useConsent();
					return null;
				})()}
				<ConsentGate requires="analytics" fallback={<span data-testid="fb">nope</span>}>
					<span data-testid="child">visible</span>
				</ConsentGate>
			</PolicyStack>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		expect(screen.queryByTestId("fb")?.textContent).toBe("nope");
		consent?.toggle("analytics");
		expect(screen.queryByTestId("child")?.textContent).toBe("visible");
		expect(screen.queryByTestId("fb")).toBeNull();
	});

	it("evaluates compound expressions", () => {
		let consent: UseConsentResult | undefined;
		render(() => (
			<PolicyStack config={policyConfig}>
				{(() => {
					consent = useConsent();
					return null;
				})()}
				<ConsentGate
					requires={{ and: ["analytics", "marketing"] }}
					fallback={<span data-testid="fb">need both</span>}
				>
					<span data-testid="child">both</span>
				</ConsentGate>
			</PolicyStack>
		));
		expect(screen.queryByTestId("child")).toBeNull();
		consent?.toggle("analytics");
		expect(screen.queryByTestId("child")).toBeNull();
		consent?.toggle("marketing");
		expect(screen.queryByTestId("child")?.textContent).toBe("both");
	});

	it("toggle through accessor flips the gate", () => {
		render(() => (
			<PolicyStack config={policyConfig}>
				<ToggleProbe />
			</PolicyStack>
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
