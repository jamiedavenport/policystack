/**
 * Canonical, dual-scope root specifiers for the PolicyStack SDK.
 *
 * Recognising *both* scopes is what lets the `@openpolicy/` → `@policystack/`
 * rename (Phase 6 / PS-34) happen with **no scanner change at rename time** —
 * source files importing either scope keep being scanned. This array is the
 * only place PS-34 ever touches, and only to *drop* the old scope once the
 * rename window closes; the scanner code below never changes.
 */
export const CANONICAL_SDK_SPECIFIERS = ["@openpolicy/sdk", "@policystack/sdk"] as const;

/**
 * Decides whether an import source string is the PolicyStack SDK. The Vite
 * plugin swaps in a resolver-backed implementation so import aliases resolve;
 * the default ({@link isCanonicalSdkSpecifier}) is used everywhere a Vite
 * resolver isn't available (unit tests, SDK not installed) and as the
 * always-true base case inside the resolver-backed matcher.
 */
export type SdkSpecifierMatcher = (specifier: string) => boolean;

/**
 * Exact match against either canonical scope's *root* specifier. Subpaths
 * (`@openpolicy/sdk/foo`) and look-alikes (`@openpolicy/sdk-x`,
 * `@openpolicy/sdkk`) are intentionally rejected: the tracked exports
 * (`collecting` / `thirdParty` / `Ignore` / `defineCookie`) are package-root
 * exports only, so only the bare scope specifier can carry them.
 */
export function isCanonicalSdkSpecifier(specifier: string): boolean {
	return (CANONICAL_SDK_SPECIFIERS as readonly string[]).includes(specifier);
}
