import type { T } from "./index";

export type CookieTypeMeta = { label: string; description: string };

// Cookie categories may be user-defined, so resolve the four dictionary-backed
// defaults first and use the locale's generic fallback for every other key.
// Shared by policy compilation and consent derivation so their default copy
// cannot drift.
export function resolveCookieTypeMeta(key: string, t: T): CookieTypeMeta {
	const known = t.cookie.types.labels as Record<
		string,
		{ label: () => string; description: () => string } | undefined
	>;
	// Own-property check, not a bare index: the key is user-authored, so
	// `constructor`/`toString` would otherwise resolve up the prototype chain
	// to a truthy non-entry and throw instead of taking the fallback.
	const entry = Object.hasOwn(known, key) ? known[key] : undefined;
	if (entry) return { label: entry.label(), description: entry.description() };
	return t.cookie.types.fallback({ key });
}
