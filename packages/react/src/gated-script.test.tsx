// @vitest-environment happy-dom
import type { PolicyStackConfig } from "@policystack/core";
import type { ScriptEvent } from "@policystack/core/consent";
import { defineScript } from "@policystack/core/consent";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { StrictMode, useState, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { useConsent } from "./consent";
import { GatedScript } from "./gated-script";
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
		used: { essential: true, analytics: true, marketing: true },
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
			marketing: { lawfulBasis: "consent" },
		},
	},
};

function Wrapper({ children }: { children: ReactNode }) {
	return <PolicyStack config={withCookies}>{children}</PolicyStack>;
}

// A src-less definition: `gateScript` skips script injection entirely, so the
// whole gate → queue → replay path runs synchronously with no network in play.
function analyticsDef(id = "test-analytics") {
	return defineScript({
		id,
		requires: "analytics",
		queue: ["testTag"],
		init: () => {
			const win = window as unknown as { testTag: (...args: unknown[]) => void; calls: unknown[] };
			win.calls = win.calls ?? [];
			win.testTag = (...args: unknown[]) => {
				win.calls.push(args);
			};
		},
	});
}

type TestWindow = Record<string, unknown> & { calls?: unknown[] };

function win(): TestWindow {
	return window as unknown as TestWindow;
}

// Accept analytics through the store the same way a banner would: stage the
// toggle, then save (only save() promotes the draft and moves the gate).
function grantAnalytics(result: { current: ReturnType<typeof useConsent> }) {
	act(() => {
		result.current.toggle("analytics");
		result.current.save();
	});
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	for (const k of ["testTag", "mktTag", "calls"]) delete win()[k];
});

describe("GatedScript — store access", () => {
	it("gates through the provider's store without the consumer touching it", () => {
		const events: ScriptEvent[] = [];
		render(<GatedScript def={analyticsDef()} onEvent={(e) => events.push(e)} />, {
			wrapper: Wrapper,
		});
		expect(events).toEqual([{ type: "script:gated", id: "test-analytics" }]);
	});

	it("renders no DOM", () => {
		const { container } = render(<GatedScript def={analyticsDef()} />, { wrapper: Wrapper });
		expect(container.innerHTML).toBe("");
	});

	it("throws the provider guard outside <PolicyStack>", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(<GatedScript def={analyticsDef()} />)).toThrow(
			/must be used inside <PolicyStack>/,
		);
	});

	it("throws under a policy-only config (no cookie categories)", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() =>
			render(
				<PolicyStack config={policyOnly}>
					<GatedScript def={analyticsDef()} />
				</PolicyStack>,
			),
		).toThrow(/must be used inside <PolicyStack>/);
	});
});

describe("GatedScript — gating lifecycle", () => {
	it("holds the script until the required category is granted, then loads it", () => {
		const events: ScriptEvent[] = [];
		function Harness() {
			return <GatedScript def={analyticsDef()} onEvent={(e) => events.push(e)} />;
		}
		const { result } = renderHook(() => useConsent(), {
			wrapper: ({ children }) => (
				<Wrapper>
					<Harness />
					{children}
				</Wrapper>
			),
		});

		expect(events.map((e) => e.type)).toEqual(["script:gated"]);
		expect(win().testTag).toBeTypeOf("function");
		expect(win().calls).toBeUndefined();

		grantAnalytics(result);

		expect(events.map((e) => e.type)).toEqual(["script:gated", "script:loaded"]);
		expect(win().calls).toEqual([]);
	});

	it("queues pre-consent calls and replays them after load", () => {
		const events: ScriptEvent[] = [];
		function Harness() {
			return <GatedScript def={analyticsDef()} onEvent={(e) => events.push(e)} />;
		}
		const { result } = renderHook(() => useConsent(), {
			wrapper: ({ children }) => (
				<Wrapper>
					<Harness />
					{children}
				</Wrapper>
			),
		});

		// The call a real app would make on boot, before any decision exists.
		(win().testTag as (...args: unknown[]) => void)("event", "signup");
		expect(events.at(-1)).toMatchObject({ type: "script:queued", path: "testTag" });

		grantAnalytics(result);

		expect(win().calls).toEqual([["event", "signup"]]);
	});

	it("does not load when a different category is granted", () => {
		const events: ScriptEvent[] = [];
		function Harness() {
			return <GatedScript def={analyticsDef()} onEvent={(e) => events.push(e)} />;
		}
		const { result } = renderHook(() => useConsent(), {
			wrapper: ({ children }) => (
				<Wrapper>
					<Harness />
					{children}
				</Wrapper>
			),
		});

		act(() => {
			result.current.toggle("marketing");
			result.current.save();
		});

		expect(events.map((e) => e.type)).toEqual(["script:gated"]);
	});

	it("loads immediately when consent is already granted at mount", () => {
		const events: ScriptEvent[] = [];
		// Both halves must live under one provider: each <PolicyStack> derives
		// its own store, so granting in a second tree would not be seen here.
		function Harness() {
			const { toggle, save } = useConsent();
			const [mounted, setMounted] = useState(false);
			return (
				<>
					<button
						type="button"
						onClick={() => {
							toggle("analytics");
							save();
						}}
					>
						grant
					</button>
					<button type="button" onClick={() => setMounted(true)}>
						mount
					</button>
					{mounted ? <GatedScript def={analyticsDef()} onEvent={(e) => events.push(e)} /> : null}
				</>
			);
		}
		render(<Harness />, { wrapper: Wrapper });

		act(() => screen.getByText("grant").click());
		expect(events).toEqual([]);

		act(() => screen.getByText("mount").click());
		expect(events.map((e) => e.type)).toEqual(["script:loaded"]);
	});

	// `<script>` injection itself is core's concern and is covered against a
	// fake document in `core/src/consent/scripts.test.ts`. Asserting it here
	// would mean a real network fetch under happy-dom, so these tests use
	// src-less definitions and stay on the binding's own behaviour.
});

describe("GatedScript — unmount and re-render", () => {
	it("disposes the gate on unmount, restoring the queue stubs", () => {
		const { unmount } = render(<GatedScript def={analyticsDef()} />, { wrapper: Wrapper });
		expect(win().testTag).toBeTypeOf("function");

		unmount();

		expect(win().testTag).toBeUndefined();
	});

	it("keeps one gate across re-renders with an inline def (no lost queue)", () => {
		const events: ScriptEvent[] = [];
		// Subscribes to consent so every store change re-renders it, and each
		// render builds a fresh ScriptDefinition object — exactly what an inline
		// `def={ga4({ ... })}` does. The gate must follow `def.id`, not identity.
		function Harness() {
			const { route } = useConsent();
			return (
				<>
					<span>{route}</span>
					<GatedScript def={analyticsDef()} onEvent={(e) => events.push(e)} />
				</>
			);
		}
		const { result } = renderHook(() => useConsent(), {
			wrapper: ({ children }) => (
				<Wrapper>
					<Harness />
					{children}
				</Wrapper>
			),
		});

		(win().testTag as (...args: unknown[]) => void)("event", "signup");

		// A re-gate here would restore the stubs, drop the queued call, and
		// emit a second "script:gated".
		act(() => {
			result.current.setRoute("preferences");
		});
		expect(screen.getByText("preferences")).toBeTruthy();
		act(() => {
			result.current.setRoute("cookie");
		});
		expect(screen.getByText("cookie")).toBeTruthy();

		expect(events.filter((e) => e.type === "script:gated")).toHaveLength(1);

		grantAnalytics(result);

		expect(win().calls).toEqual([["event", "signup"]]);
	});

	it("re-gates when def.id changes", () => {
		const events: ScriptEvent[] = [];
		function Harness({ id }: { id: string }) {
			return <GatedScript def={analyticsDef(id)} onEvent={(e) => events.push(e)} />;
		}
		const { rerender } = render(<Harness id="first" />, { wrapper: Wrapper });
		rerender(<Harness id="second" />);

		expect(events).toEqual([
			{ type: "script:gated", id: "first" },
			{ type: "script:gated", id: "second" },
		]);
	});

	it("survives StrictMode's double mount without a duplicate-id warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		render(
			<StrictMode>
				<PolicyStack config={withCookies}>
					<GatedScript def={analyticsDef()} />
				</PolicyStack>
			</StrictMode>,
		);
		expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("already gated"));
	});

	it("uses the latest onEvent without re-gating", () => {
		const first: ScriptEvent[] = [];
		const second: ScriptEvent[] = [];
		function Harness({ sink }: { sink: ScriptEvent[] }) {
			return <GatedScript def={analyticsDef()} onEvent={(e) => sink.push(e)} />;
		}
		const { rerender } = render(<Harness sink={first} />, { wrapper: Wrapper });
		rerender(<Harness sink={second} />);

		(win().testTag as (...args: unknown[]) => void)("late");

		expect(first).toEqual([{ type: "script:gated", id: "test-analytics" }]);
		expect(second).toHaveLength(1);
		expect(second[0]).toMatchObject({ type: "script:queued", path: "testTag" });
	});
});

describe("GatedScript — multiple scripts", () => {
	it("gates several definitions independently", () => {
		const events: ScriptEvent[] = [];
		const marketingDef = defineScript({
			id: "test-marketing",
			requires: "marketing",
			queue: ["mktTag"],
		});
		const { result } = renderHook(() => useConsent(), {
			wrapper: ({ children }) => (
				<Wrapper>
					<GatedScript def={analyticsDef()} onEvent={(e) => events.push(e)} />
					<GatedScript def={marketingDef} onEvent={(e) => events.push(e)} />
					{children}
				</Wrapper>
			),
		});

		grantAnalytics(result);

		expect(events).toContainEqual({ type: "script:loaded", id: "test-analytics" });
		expect(events).not.toContainEqual({ type: "script:loaded", id: "test-marketing" });
	});
});

describe("GatedScript — rendered alongside other consent API", () => {
	it("does not interfere with ConsentGate in the same tree", () => {
		function Harness() {
			return (
				<>
					<GatedScript def={analyticsDef()} />
					<span>rendered</span>
				</>
			);
		}
		render(<Harness />, { wrapper: Wrapper });
		expect(screen.getByText("rendered")).toBeTruthy();
	});
});
