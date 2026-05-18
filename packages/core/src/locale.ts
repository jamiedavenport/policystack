import type { Locale } from "./types";

// The canonical locale codes PolicyStack emits, and the single runtime mirror
// of the frozen `Locale` union. Kept here — dependency-free, deliberately NOT
// in ./i18n (which imports the policy dictionaries) — so the lean ./consent
// runtime can share one list/predicate without dragging the compiler bundle
// in. `satisfies` ties the list to `Locale` (./types, the single source of
// truth): a stray or missing code is a compile error.
export const LOCALES = ["en", "fr", "de", "nl", "es"] as const satisfies readonly Locale[];

export function isLocale(value: unknown): value is Locale {
	return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
