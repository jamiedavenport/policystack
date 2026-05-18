import { type JurisdictionId, resolveJurisdiction } from "../jurisdiction-id";
import { TZ_COUNTRY } from "./tz-country";
import type { JurisdictionResolver, ResolverContext } from "./types";

const EEA_COUNTRIES = new Set([
	"AT",
	"BE",
	"BG",
	"HR",
	"CY",
	"CZ",
	"DK",
	"EE",
	"FI",
	"FR",
	"DE",
	"GR",
	"HU",
	"IE",
	"IT",
	"LV",
	"LT",
	"LU",
	"MT",
	"NL",
	"PL",
	"PT",
	"RO",
	"SK",
	"SI",
	"ES",
	"SE",
	"IS",
	"LI",
	"NO",
]);

// Country (ISO-3166 alpha-2) → canonical JurisdictionId. Country granularity
// only, so this never yields a US sub-state id (see clientGeoResolver for that).
// Australia has no canonical id — it folds to `row` (conservative opt-in), the
// same posture the pre-canonical bridge already gave "AU".
export function countryToJurisdiction(code: string | null | undefined): JurisdictionId | null {
	if (!code) return null;
	const c = code.trim().toUpperCase();
	if (c.length === 0) return null;
	if (EEA_COUNTRIES.has(c)) return "eea";
	if (c === "GB") return "uk";
	if (c === "CH") return "ch";
	if (c === "US") return "us";
	if (c === "BR") return "br";
	if (c === "CA") return "ca";
	return "row";
}

const HEADER_NAMES = ["cf-ipcountry", "x-vercel-ip-country", "x-country"] as const;

function headersOf(req: ResolverContext | undefined): Headers | null {
	if (!req) return null;
	const h = (req as { headers?: Headers }).headers;
	return h ?? null;
}

export function headerResolver(): JurisdictionResolver {
	return {
		resolve(req) {
			const headers = headersOf(req);
			if (!headers) return null;
			for (const name of HEADER_NAMES) {
				const value = headers.get(name);
				if (value) return countryToJurisdiction(value);
			}
			return null;
		},
	};
}

export function timezoneResolver(): JurisdictionResolver {
	return {
		resolve() {
			if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") return null;
			let zone: string | undefined;
			try {
				zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			} catch {
				return null;
			}
			if (!zone) return null;
			const country = TZ_COUNTRY[zone];
			if (!country) return null;
			return countryToJurisdiction(country);
		},
	};
}

export function manualResolver(jurisdiction: JurisdictionId | null): JurisdictionResolver {
	return {
		resolve() {
			return jurisdiction;
		},
	};
}

type GeoResponse = { country?: string; region?: string };

export function clientGeoResolver(opts: {
	endpoint: string;
	fetch?: typeof fetch;
}): JurisdictionResolver {
	const fetchImpl = opts.fetch ?? fetch;
	return {
		async resolve() {
			try {
				const res = await fetchImpl(opts.endpoint);
				if (!res.ok) return null;
				const body = (await res.json()) as GeoResponse;
				const base = countryToJurisdiction(body.country);
				if (base === "us" && body.region) {
					// us-ca/co/ct/va stay; any other US state folds to `us`.
					return resolveJurisdiction(`us-${body.region.trim().toLowerCase()}`) ?? "us";
				}
				return base;
			} catch {
				return null;
			}
		},
	};
}
