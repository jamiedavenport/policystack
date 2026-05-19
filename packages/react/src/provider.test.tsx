// @vitest-environment happy-dom
import type { PolicyStackConfig } from "@policystack/core";
import type { ConsentRecord, StorageAdapter } from "@policystack/core/consent";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { useContext, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ConsentGate, useConsent } from "./consent";
import { PolicyStackContext } from "./context";
import { PolicyStack } from "./provider";

const company = {
	name: "Acme Inc.",
	legalName: "Acme Corporation",
	address: "123 Main St, Springfield, USA",
	contact: { email: "privacy@acme.com" },
};

const policyOnly: PolicyStackConfig = {
	company,
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
	data: { collected: {}, context: {} },
};

const withCookies: PolicyStackConfig = {
	...policyOnly,
	cookieVersion: "v1",
	cookies: {
		used: { essential: true, analytics: true, marketing: false },
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

describe("PolicyStack — policy context", () => {
	it("always supplies the policy config via context", () => {
		function Probe() {
			return <span>{useContext(PolicyStackContext).config?.company.name}</span>;
		}
		render(
			<PolicyStack config={policyOnly}>
				<Probe />
			</PolicyStack>,
		);
		expect(screen.getByText("Acme Inc.")).toBeTruthy();
	});

	it("renders children", () => {
		render(
			<PolicyStack config={withCookies}>
				<div>hello</div>
			</PolicyStack>,
		);
		expect(screen.getByText("hello")).toBeTruthy();
	});
});

describe("PolicyStack — policy-only (no cookie categories)", () => {
	it("does not spin up a consent store; useConsent throws its provider error", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() =>
			renderHook(() => useConsent(), {
				wrapper: ({ children }: { children: ReactNode }) => (
					<PolicyStack config={policyOnly}>{children}</PolicyStack>
				),
			}),
		).toThrow(/must be used inside/);
	});
});

describe("PolicyStack — consent store derived from the one config", () => {
	function wrapper(config: PolicyStackConfig) {
		return ({ children }: { children: ReactNode }) => (
			<PolicyStack config={config}>{children}</PolicyStack>
		);
	}

	it("derives categories from cookies.used with lawful-basis locking", () => {
		const { result } = renderHook(() => useConsent(), { wrapper: wrapper(withCookies) });
		expect(result.current.categories.map((c) => c.key)).toEqual(["essential", "analytics"]);
		expect(result.current.categories.find((c) => c.key === "essential")?.locked).toBe(true);
		expect(result.current.categories.find((c) => c.key === "analytics")?.locked).toBe(false);
		expect(result.current.route).toBe("cookie");
		expect(result.current.policyVersion).toBe("v1");
	});

	it("ConsentGate stays closed until the gated category is granted", () => {
		const Harness = () => {
			const { acceptAll } = useConsent();
			return (
				<>
					<button type="button" onClick={() => acceptAll()}>
						accept
					</button>
					<ConsentGate requires="analytics">
						<span>analytics-on</span>
					</ConsentGate>
				</>
			);
		};
		render(
			<PolicyStack config={withCookies}>
				<Harness />
			</PolicyStack>,
		);
		expect(screen.queryByText("analytics-on")).toBeNull();
		act(() => {
			screen.getByText("accept").click();
		});
		expect(screen.getByText("analytics-on")).toBeTruthy();
	});

	it("honors config.consent.adapter (restores a stored decision)", () => {
		const stored: ConsentRecord = {
			schemaVersion: 1,
			decisions: { essential: true, analytics: true },
			policyVersion: "v1",
			decidedAt: "2026-05-01T00:00:00.000Z",
			jurisdiction: null,
			locale: "en",
			source: "banner",
		};
		const adapter: StorageAdapter = {
			read: () => stored,
			write: vi.fn(),
			clear: vi.fn(),
		};
		const { result } = renderHook(() => useConsent(), {
			wrapper: wrapper({ ...withCookies, consent: { adapter } }),
		});
		expect(result.current.decisions.analytics).toBe(true);
		expect(result.current.decidedAt).toBe("2026-05-01T00:00:00.000Z");
	});

	it("honors config.consent.jurisdictionResolver (sync resolve at init)", () => {
		const { result } = renderHook(() => useConsent(), {
			wrapper: wrapper({
				...withCookies,
				consent: { jurisdictionResolver: { resolve: () => "eea" } },
			}),
		});
		expect(result.current.jurisdiction).toBe("eea");
	});

	it("isolates the store per provider instance (no cross-request leak)", () => {
		const a = renderHook(() => useConsent(), { wrapper: wrapper(withCookies) });
		const b = renderHook(() => useConsent(), { wrapper: wrapper(withCookies) });
		act(() => {
			a.result.current.acceptAll();
		});
		expect(a.result.current.decisions.analytics).toBe(true);
		expect(b.result.current.decisions.analytics).toBe(false);
	});
});
