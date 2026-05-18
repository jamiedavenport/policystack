import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
	clientGeoResolver,
	countryToJurisdiction,
	headerResolver,
	manualResolver,
	timezoneResolver,
} from "./jurisdiction";

describe("countryToJurisdiction", () => {
	it("maps EEA member states to eea", () => {
		for (const code of ["DE", "FR", "IT", "ES", "SE", "IS", "LI", "NO"]) {
			expect(countryToJurisdiction(code)).toBe("eea");
		}
	});

	it("maps GB to uk and CH to ch", () => {
		expect(countryToJurisdiction("GB")).toBe("uk");
		expect(countryToJurisdiction("CH")).toBe("ch");
	});

	it("maps US/BR/CA country codes to their canonical id; AU has no canonical id → row", () => {
		expect(countryToJurisdiction("US")).toBe("us");
		expect(countryToJurisdiction("BR")).toBe("br");
		expect(countryToJurisdiction("CA")).toBe("ca");
		// Australia has no canonical `au` member — folds to `row` (the same
		// conservative opt-in posture the pre-canonical bridge gave "AU").
		expect(countryToJurisdiction("AU")).toBe("row");
	});

	it("falls back to row for unknown countries", () => {
		expect(countryToJurisdiction("ZZ")).toBe("row");
		expect(countryToJurisdiction("JP")).toBe("row");
	});

	it("returns null for empty / nullish input", () => {
		expect(countryToJurisdiction(null)).toBeNull();
		expect(countryToJurisdiction(undefined)).toBeNull();
		expect(countryToJurisdiction("")).toBeNull();
		expect(countryToJurisdiction("   ")).toBeNull();
	});

	it("normalises case and whitespace", () => {
		expect(countryToJurisdiction("de")).toBe("eea");
		expect(countryToJurisdiction(" gb ")).toBe("uk");
	});
});

describe("headerResolver", () => {
	function ctx(entries: Record<string, string>): { headers: Headers } {
		return { headers: new Headers(entries) };
	}

	it("reads cf-ipcountry (Cloudflare)", () => {
		const r = headerResolver();
		expect(r.resolve(ctx({ "cf-ipcountry": "DE" }))).toBe("eea");
	});

	it("reads x-vercel-ip-country (Vercel)", () => {
		const r = headerResolver();
		expect(r.resolve(ctx({ "x-vercel-ip-country": "GB" }))).toBe("uk");
	});

	it("reads x-country fallback (Netlify / custom)", () => {
		const r = headerResolver();
		expect(r.resolve(ctx({ "x-country": "BR" }))).toBe("br");
	});

	it("prefers cf-ipcountry over Vercel and x-country", () => {
		const r = headerResolver();
		const result = r.resolve(
			ctx({
				"cf-ipcountry": "DE",
				"x-vercel-ip-country": "US",
				"x-country": "BR",
			}),
		);
		expect(result).toBe("eea");
	});

	it("falls through to Vercel when Cloudflare header is absent", () => {
		const r = headerResolver();
		const result = r.resolve(
			ctx({
				"x-vercel-ip-country": "US",
				"x-country": "BR",
			}),
		);
		expect(result).toBe("us");
	});

	it("returns null when no recognised header present", () => {
		const r = headerResolver();
		expect(r.resolve(ctx({ "x-other": "DE" }))).toBeNull();
		expect(r.resolve(ctx({}))).toBeNull();
	});

	it("returns null when no request given", () => {
		const r = headerResolver();
		expect(r.resolve()).toBeNull();
	});

	it("accepts a raw Request", () => {
		const r = headerResolver();
		const req = new Request("https://example.com", {
			headers: { "cf-ipcountry": "FR" },
		});
		expect(r.resolve(req)).toBe("eea");
	});

	it("maps unknown country to row", () => {
		const r = headerResolver();
		expect(r.resolve(ctx({ "cf-ipcountry": "ZZ" }))).toBe("row");
	});
});

describe("manualResolver", () => {
	it("returns the configured jurisdiction", () => {
		expect(manualResolver("eea").resolve()).toBe("eea");
		expect(manualResolver("us-ca").resolve()).toBe("us-ca");
		expect(manualResolver(null).resolve()).toBeNull();
	});

	it("ignores the request argument", () => {
		const r = manualResolver("uk");
		const req = new Request("https://example.com", {
			headers: { "cf-ipcountry": "US" },
		});
		expect(r.resolve(req)).toBe("uk");
	});
});

describe("timezoneResolver", () => {
	const realDateTimeFormat = Intl.DateTimeFormat;

	function stubZone(zone: string | undefined): void {
		function FakeDTF(): Intl.DateTimeFormat {
			return { resolvedOptions: () => ({ timeZone: zone }) } as unknown as Intl.DateTimeFormat;
		}
		Object.assign(FakeDTF, realDateTimeFormat);
		Intl.DateTimeFormat = FakeDTF as unknown as typeof Intl.DateTimeFormat;
	}

	afterEach(() => {
		Intl.DateTimeFormat = realDateTimeFormat;
	});

	it("maps an EEA zone to eea", () => {
		stubZone("Europe/Berlin");
		expect(timezoneResolver().resolve()).toBe("eea");
	});

	it("maps Europe/London to uk", () => {
		stubZone("Europe/London");
		expect(timezoneResolver().resolve()).toBe("uk");
	});

	it("maps Europe/Zurich to ch", () => {
		stubZone("Europe/Zurich");
		expect(timezoneResolver().resolve()).toBe("ch");
	});

	it("maps US zones to us (state-level not derivable from IANA zone)", () => {
		stubZone("America/Los_Angeles");
		expect(timezoneResolver().resolve()).toBe("us");
		stubZone("America/New_York");
		expect(timezoneResolver().resolve()).toBe("us");
	});

	it("maps a non-special-cased country zone to row", () => {
		stubZone("Asia/Tokyo");
		expect(timezoneResolver().resolve()).toBe("row");
	});

	it("returns null for an unknown zone", () => {
		stubZone("Mars/Jezero");
		expect(timezoneResolver().resolve()).toBeNull();
	});

	it("returns null when the zone is missing", () => {
		stubZone(undefined);
		expect(timezoneResolver().resolve()).toBeNull();
	});

	it("returns null when Intl.DateTimeFormat throws", () => {
		Intl.DateTimeFormat = (() => {
			throw new Error("boom");
		}) as unknown as typeof Intl.DateTimeFormat;
		expect(timezoneResolver().resolve()).toBeNull();
	});

	it("ignores the request argument", () => {
		stubZone("Europe/Paris");
		const req = new Request("https://example.com", {
			headers: { "cf-ipcountry": "US" },
		});
		expect(timezoneResolver().resolve(req)).toBe("eea");
	});
});

describe("clientGeoResolver", () => {
	function jsonResponse(body: unknown, ok = true): Response {
		return new Response(JSON.stringify(body), {
			status: ok ? 200 : 500,
			headers: { "content-type": "application/json" },
		});
	}

	it("normalises country to jurisdiction", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ country: "DE" }));
		const r = clientGeoResolver({ endpoint: "/geo", fetch: fetchImpl });
		expect(await r.resolve()).toBe("eea");
		expect(fetchImpl).toHaveBeenCalledWith("/geo");
	});

	it("combines US country + a canonical state region into a us-XX id", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ country: "US", region: "CA" }));
		const r = clientGeoResolver({ endpoint: "/geo", fetch: fetchImpl });
		expect(await r.resolve()).toBe("us-ca");
	});

	it("folds a US region with no canonical state id down to `us`", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ country: "US", region: "TX" }));
		const r = clientGeoResolver({ endpoint: "/geo", fetch: fetchImpl });
		expect(await r.resolve()).toBe("us");
	});

	it("ignores region for non-US countries", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ country: "DE", region: "BY" }));
		const r = clientGeoResolver({ endpoint: "/geo", fetch: fetchImpl });
		expect(await r.resolve()).toBe("eea");
	});

	it("returns null on non-OK response", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ country: "DE" }, false));
		const r = clientGeoResolver({ endpoint: "/geo", fetch: fetchImpl });
		expect(await r.resolve()).toBeNull();
	});

	it("returns null on fetch failure", async () => {
		const fetchImpl = vi.fn().mockRejectedValue(new Error("network"));
		const r = clientGeoResolver({ endpoint: "/geo", fetch: fetchImpl });
		expect(await r.resolve()).toBeNull();
	});

	it("returns null when response has no country", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}));
		const r = clientGeoResolver({ endpoint: "/geo", fetch: fetchImpl });
		expect(await r.resolve()).toBeNull();
	});
});
