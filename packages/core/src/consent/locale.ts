import { isLocale, LOCALES } from "../locale";
import type { Locale } from "../types";
import type { PolicyStackConsentConfig } from "./types";

// `LOCALES`/`isLocale` come from ../locale — the single runtime mirror of the
// frozen `Locale` union, kept dependency-free so importing it here does NOT
// drag the i18n policy dictionaries into the lean consent runtime.

// Silent best-effort mapping for environmental input (navigator.language).
// That is not a deprecated *configuration* — it is the runtime default and is
// almost always region-tagged (e.g. "en-US") — so it must not warn. Outlives
// the freeze (navigator.language stays a free string after PS-36).
function coerceLocale(input: string): Locale {
	if (isLocale(input)) return input;
	const primary = input.toLowerCase().split(/[-_]/)[0] ?? "";
	return isLocale(primary) ? primary : "en";
}

// ─── PS-26 warn-and-map migration shim — remove pre-freeze, PS-36 ───
// PolicyStack Consent historically accepted a free-string `locale` (e.g. "en-GB",
// "fr_FR", "pt"). PolicyStack 1.0 freezes `Locale` to the closed union. This
// warns only for an explicitly *configured* free-string `locale` — the thing
// PS-36 will reject — mapping the primary subtag onto the canonical Locale so
// integrators migrate. PS-36 deletes this shim and tightens the surface to
// `Locale`; the silent `coerceLocale` (navigator fallback) survives.
export function normalizeLocale(input: string): Locale {
	if (isLocale(input)) return input;
	const primary = input.toLowerCase().split(/[-_]/)[0] ?? "";
	if (isLocale(primary)) {
		console.warn(
			`[policystack] locale "${input}" is not a supported PolicyStack locale; ` +
				`mapping to "${primary}". Free-string locales are deprecated and will ` +
				`be rejected when Locale is frozen (PS-36). Use one of: ${LOCALES.join(", ")}.`,
		);
		return primary;
	}
	console.warn(
		`[policystack] locale "${input}" is not a supported PolicyStack locale; ` +
			`falling back to "en". Free-string locales are deprecated and will be ` +
			`rejected when Locale is frozen (PS-36). Use one of: ${LOCALES.join(", ")}.`,
	);
	return "en";
}
// ─── end PS-26 shim ───

export function resolveLocale(config: PolicyStackConsentConfig): Locale {
	if (config.locale) return normalizeLocale(config.locale);
	const nav = (globalThis as { navigator?: { language?: string } }).navigator;
	return coerceLocale(nav?.language ?? "en");
}
