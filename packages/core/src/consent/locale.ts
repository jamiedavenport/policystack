import type { Locale } from "../types";
import type { OpenCookiesConfig } from "./types";

// Canonical locale codes, kept dependency-free on purpose: importing the i18n
// locale registry would drag the policy dictionaries into the lean consent
// runtime. `satisfies` ties this list to the frozen `Locale` union (../types)
// — the single source of truth — so a stray code here is a compile error.
const CANONICAL_LOCALES = ["en", "fr", "de", "nl", "es"] as const satisfies readonly Locale[];

function isCanonicalLocale(value: string): value is Locale {
	return (CANONICAL_LOCALES as readonly string[]).includes(value);
}

// Silent best-effort mapping for environmental input (navigator.language).
// That is not a deprecated *configuration* — it is the runtime default and is
// almost always region-tagged (e.g. "en-US") — so it must not warn. Outlives
// the freeze (navigator.language stays a free string after PS-36).
function coerceLocale(input: string): Locale {
	if (isCanonicalLocale(input)) return input;
	const primary = input.toLowerCase().split(/[-_]/)[0] ?? "";
	return isCanonicalLocale(primary) ? primary : "en";
}

// ─── PS-26 warn-and-map migration shim — remove pre-freeze, PS-36 ───
// OpenCookies historically accepted a free-string `locale` (e.g. "en-GB",
// "fr_FR", "pt"). PolicyStack 1.0 freezes `Locale` to the closed union. This
// warns only for an explicitly *configured* free-string `locale` — the thing
// PS-36 will reject — mapping the primary subtag onto the canonical Locale so
// integrators migrate. PS-36 deletes this shim and tightens the surface to
// `Locale`; the silent `coerceLocale` (navigator fallback) survives.
export function normalizeLocale(input: string): Locale {
	if (isCanonicalLocale(input)) return input;
	const primary = input.toLowerCase().split(/[-_]/)[0] ?? "";
	if (isCanonicalLocale(primary)) {
		console.warn(
			`[opencookies] locale "${input}" is not a supported PolicyStack locale; ` +
				`mapping to "${primary}". Free-string locales are deprecated and will ` +
				`be rejected when Locale is frozen (PS-36). Use one of: ${CANONICAL_LOCALES.join(", ")}.`,
		);
		return primary;
	}
	console.warn(
		`[opencookies] locale "${input}" is not a supported PolicyStack locale; ` +
			`falling back to "en". Free-string locales are deprecated and will be ` +
			`rejected when Locale is frozen (PS-36). Use one of: ${CANONICAL_LOCALES.join(", ")}.`,
	);
	return "en";
}
// ─── end PS-26 shim ───

export function resolveLocale(config: OpenCookiesConfig): Locale {
	if (config.locale) return normalizeLocale(config.locale);
	const nav = (globalThis as { navigator?: { language?: string } }).navigator;
	return coerceLocale(nav?.language ?? "en");
}
