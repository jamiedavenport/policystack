// @vitest-environment happy-dom
import type { PolicyStackConfig } from "@policystack/core";
import type { ConsentRecord } from "@policystack/core/consent";
import { localStorageAdapter } from "@policystack/core/consent/storage/local-storage";
import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ConsentGate, useConsent } from "./consent";
import { PolicyStack } from "./provider";

// A fresh adapter per environment: the localStorage adapter keeps an in-memory
// fallback Map, and one shared instance would leak the server's view into the
// client's, hiding the divergence under test.
function makeConfig(): PolicyStackConfig {
	return {
		company: {
			name: "Acme Inc.",
			legalName: "Acme Corporation",
			address: "123 Main St, Springfield, USA",
			contact: { email: "privacy@acme.com" },
		},
		effectiveDate: "2026-01-01",
		jurisdictions: ["eea"],
		cookieVersion: "v1",
		data: { collected: {}, context: {} },
		cookies: {
			used: { essential: true, analytics: true },
			context: {
				essential: { lawfulBasis: "legal_obligation" },
				analytics: { lawfulBasis: "consent" },
			},
		},
		consent: { adapter: localStorageAdapter() },
	};
}

// `policyVersion` matches `cookieVersion` so the default `policyVersionChanged`
// trigger does not fire a reprompt and confound the assertions.
const RETURNING_VISITOR: ConsentRecord = {
	schemaVersion: 1,
	decisions: { essential: true, analytics: true },
	jurisdiction: "uk",
	policyVersion: "v1",
	decidedAt: "2026-07-01T00:00:00.000Z",
	locale: "en-GB",
	source: "banner",
};

function Banner() {
	const { route } = useConsent();
	if (route !== "cookie") return null;
	return <div data-testid="banner">Cookie banner</div>;
}

function Analytics() {
	return (
		<ConsentGate requires="analytics">
			<div data-testid="analytics">Analytics</div>
		</ConsentGate>
	);
}

// The subject sits inside a layout element, as in a real app. React tolerates
// leftover nodes at the container root, so a bare subject would let the "server
// rendered it, client did not" direction slip through unreported.
function App({ children }: { children: ReactNode }) {
	return (
		<PolicyStack config={makeConfig()}>
			<div id="app">{children}</div>
		</PolicyStack>
	);
}

// Renders as a server would: no localStorage, so the store finds no record. The
// adapter reads `globalThis.localStorage` lazily, so stubbing around the render
// is enough to reach the fallback path.
function renderOnServer(node: React.ReactNode): string {
	vi.stubGlobal("localStorage", undefined);
	try {
		return renderToString(node);
	} finally {
		vi.unstubAllGlobals();
	}
}

type HydrateResult = {
	container: HTMLElement;
	onRecoverableError: ReturnType<typeof vi.fn>;
	consoleError: ReturnType<typeof vi.spyOn>;
};

async function hydrate(html: string, node: React.ReactNode): Promise<HydrateResult> {
	const container = document.createElement("div");
	container.innerHTML = html;
	document.body.appendChild(container);

	const onRecoverableError = vi.fn();
	const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

	await act(async () => {
		hydrateRoot(container, node, { onRecoverableError });
	});

	return { container, onRecoverableError, consoleError };
}

afterEach(() => {
	document.body.innerHTML = "";
	localStorage.clear();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("SSR hydration", () => {
	it("hydrates a returning visitor without a mismatch, then shows live state", async () => {
		const html = renderOnServer(
			<App>
				<Banner />
			</App>,
		);
		// The server has no record, so it renders the banner.
		expect(html).toContain("Cookie banner");

		// The visitor already decided, so mergeRecord starts the live client
		// store at route "closed".
		localStorage.setItem("ps_consent", JSON.stringify(RETURNING_VISITOR));

		const { container, onRecoverableError, consoleError } = await hydrate(
			html,
			<App>
				<Banner />
			</App>,
		);

		expect(onRecoverableError).not.toHaveBeenCalled();
		expect(consoleError).not.toHaveBeenCalled();
		// ...and still converges on live state. A snapshot frozen forever would
		// pass the two assertions above and fail here.
		expect(container.querySelector("[data-testid='banner']")).toBeNull();
	});

	it("hydrates a ConsentGate without a mismatch, then reveals granted content", async () => {
		const html = renderOnServer(
			<App>
				<Analytics />
			</App>,
		);
		// No record and an opt-in posture, so the gate is closed on the server.
		expect(html).not.toContain("Analytics");

		localStorage.setItem("ps_consent", JSON.stringify(RETURNING_VISITOR));

		const { container, onRecoverableError, consoleError } = await hydrate(
			html,
			<App>
				<Analytics />
			</App>,
		);

		expect(onRecoverableError).not.toHaveBeenCalled();
		expect(consoleError).not.toHaveBeenCalled();
		expect(container.querySelector("[data-testid='analytics']")).not.toBeNull();
	});
});
