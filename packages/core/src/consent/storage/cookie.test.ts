// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { ConsentRecord } from "../types";
import { cookieAdapter } from "./cookie";

const sample: ConsentRecord = {
	schemaVersion: 1,
	decisions: { essential: true, analytics: false },
	jurisdiction: "eea",
	policyVersion: "v1",
	decidedAt: "2026-04-29T00:00:00.000Z",
	locale: "en-GB",
	source: "banner",
};

function clearCookies(): void {
	for (const part of document.cookie.split(";")) {
		const eq = part.indexOf("=");
		const name = (eq === -1 ? part : part.slice(0, eq)).trim();
		if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
	}
}

describe("cookieAdapter (browser)", () => {
	beforeEach(() => {
		clearCookies();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("round-trips via document.cookie with default name", () => {
		const adapter = cookieAdapter({ secure: false });
		adapter.write(sample);
		expect(document.cookie).toContain("oc_consent=");
		expect(adapter.read()).toEqual(sample);
	});

	it("uses a custom cookie name", () => {
		const adapter = cookieAdapter({ name: "consent", secure: false });
		adapter.write(sample);
		expect(document.cookie).toMatch(/(^|; )consent=[^;]+/);
		expect(adapter.read()).toEqual(sample);
		expect(cookieAdapter({ secure: false }).read()).toBeNull();
	});

	it("returns null when cookie is missing", () => {
		expect(cookieAdapter().read()).toBeNull();
	});

	it("returns null when cookie is corrupt", () => {
		document.cookie = "oc_consent=not-base64-json; Path=/";
		expect(cookieAdapter().read()).toBeNull();
	});

	it("clear() unsets the cookie", () => {
		const adapter = cookieAdapter({ secure: false });
		adapter.write(sample);
		adapter.clear();
		expect(adapter.read()).toBeNull();
	});

	it("Set-Cookie header includes Path, Max-Age, SameSite, Secure", () => {
		const adapter = cookieAdapter();
		const header = adapter.getSetCookieHeader(sample);
		expect(header).toContain("Path=/");
		expect(header).toContain("Max-Age=");
		expect(header).toContain("SameSite=Lax");
		expect(header).toContain("Secure");
	});

	it("clear header has Max-Age=0 and empty value", () => {
		const adapter = cookieAdapter();
		const header = adapter.getSetCookieHeader(null);
		expect(header).toMatch(/^oc_consent=; /);
		expect(header).toContain("Max-Age=0");
	});

	it("includes Domain when configured and respects sameSite/secure overrides", () => {
		const adapter = cookieAdapter({
			domain: "example.com",
			sameSite: "strict",
			secure: false,
		});
		const header = adapter.getSetCookieHeader(sample);
		expect(header).toContain("Domain=example.com");
		expect(header).toContain("SameSite=Strict");
		expect(header).not.toContain("Secure");
	});
});

describe("cookieAdapter (Edge / SSR)", () => {
	it("reads from a request-like object's cookie header", () => {
		const writer = cookieAdapter();
		const value = writer.getSetCookieHeader(sample).split(";")[0]?.split("=")[1] ?? "";
		const request = { headers: new Headers({ cookie: `oc_consent=${value}` }) };
		const adapter = cookieAdapter({ request });
		expect(adapter.read()).toEqual(sample);
	});

	it("returns null when request has no cookie header", () => {
		const request = { headers: new Headers() };
		expect(cookieAdapter({ request }).read()).toBeNull();
	});

	it("write() emits a Set-Cookie header via onSetCookie", () => {
		const onSetCookie = vi.fn();
		const adapter = cookieAdapter({ onSetCookie });
		adapter.write(sample);
		expect(onSetCookie).toHaveBeenCalledOnce();
		const header = onSetCookie.mock.calls[0]?.[0] as string;
		expect(header).toMatch(/^oc_consent=/);
		expect(header).toContain("Max-Age=");
	});

	it("parse() decodes a raw Set-Cookie header back to a record", () => {
		const adapter = cookieAdapter();
		const header = adapter.getSetCookieHeader(sample);
		expect(adapter.parse(header)).toEqual(sample);
	});

	it("works without document or Buffer fallbacks (atob/btoa path)", () => {
		expect(typeof btoa).toBe("function");
		expect(typeof atob).toBe("function");
		const adapter = cookieAdapter({ onSetCookie: () => {} });
		adapter.write(sample);
		const header = adapter.getSetCookieHeader(sample);
		expect(adapter.parse(header)).toEqual(sample);
	});
});
