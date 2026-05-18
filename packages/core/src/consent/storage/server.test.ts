import { describe, expect, it, vi } from "vite-plus/test";
import type { ConsentRecord } from "../types";
import { serverAdapter } from "./server";

const sample: ConsentRecord = {
	schemaVersion: 1,
	decisions: { essential: true, analytics: false },
	jurisdiction: "us",
	policyVersion: "v1",
	decidedAt: "2026-04-29T00:00:00.000Z",
	locale: "en-GB",
	source: "banner",
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
		...init,
	});
}

describe("serverAdapter", () => {
	describe("read", () => {
		it("GETs the endpoint and returns the JSON record", async () => {
			const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sample));
			const adapter = serverAdapter({ endpoint: "/consent", fetch: fetchMock });
			await expect(adapter.read()).resolves.toEqual(sample);
			const [url, init] = fetchMock.mock.calls[0] ?? [];
			expect(url).toBe("/consent");
			expect((init as RequestInit).method).toBe("GET");
		});

		it("returns null on 404", async () => {
			const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
			const adapter = serverAdapter({ endpoint: "/consent", fetch: fetchMock });
			await expect(adapter.read()).resolves.toBeNull();
		});

		it("returns null and calls onError on network failure", async () => {
			const onError = vi.fn();
			const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
			const adapter = serverAdapter({ endpoint: "/consent", fetch: fetchMock, onError });
			await expect(adapter.read()).resolves.toBeNull();
			expect(onError).toHaveBeenCalledOnce();
		});

		it("returns null and calls onError on 500", async () => {
			const onError = vi.fn();
			const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
			const adapter = serverAdapter({ endpoint: "/consent", fetch: fetchMock, onError });
			await expect(adapter.read()).resolves.toBeNull();
			expect(onError).toHaveBeenCalledOnce();
		});
	});

	describe("write", () => {
		it("POSTs the record as JSON", async () => {
			const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
			const adapter = serverAdapter({ endpoint: "/consent", fetch: fetchMock });
			await adapter.write(sample);
			const [, init] = fetchMock.mock.calls[0] ?? [];
			const req = init as RequestInit;
			expect(req.method).toBe("POST");
			expect(req.body).toBe(JSON.stringify(sample));
			expect(new Headers(req.headers).get("Content-Type")).toBe("application/json");
		});

		it("merges custom headers on every request", async () => {
			const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
			const adapter = serverAdapter({
				endpoint: "/consent",
				fetch: fetchMock,
				headers: { Authorization: "Bearer token" },
			});
			await adapter.write(sample);
			const [, init] = fetchMock.mock.calls[0] ?? [];
			expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe("Bearer token");
		});

		it("supports a headers function (refreshed per call)", async () => {
			const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
			let n = 0;
			const adapter = serverAdapter({
				endpoint: "/consent",
				fetch: fetchMock,
				headers: () => ({ "X-Token": `t${++n}` }),
			});
			await adapter.write(sample);
			await adapter.write(sample);
			const calls = fetchMock.mock.calls as [unknown, RequestInit][];
			const a = new Headers(calls[0]![1].headers);
			const b = new Headers(calls[1]![1].headers);
			expect(a.get("X-Token")).toBe("t1");
			expect(b.get("X-Token")).toBe("t2");
		});

		it("does not throw on network failure", async () => {
			const onError = vi.fn();
			const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
			const adapter = serverAdapter({ endpoint: "/consent", fetch: fetchMock, onError });
			await expect(adapter.write(sample)).resolves.toBeUndefined();
			expect(onError).toHaveBeenCalledOnce();
		});
	});

	describe("clear", () => {
		it("DELETEs the endpoint", async () => {
			const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
			const adapter = serverAdapter({ endpoint: "/consent", fetch: fetchMock });
			await adapter.clear();
			const [, init] = fetchMock.mock.calls[0] ?? [];
			expect((init as RequestInit).method).toBe("DELETE");
		});

		it("treats 404 as success", async () => {
			const onError = vi.fn();
			const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
			const adapter = serverAdapter({ endpoint: "/consent", fetch: fetchMock, onError });
			await adapter.clear();
			expect(onError).not.toHaveBeenCalled();
		});
	});

	it("does not have a subscribe method", () => {
		const adapter = serverAdapter({ endpoint: "/consent", fetch: vi.fn() });
		expect("subscribe" in adapter).toBe(false);
	});
});
