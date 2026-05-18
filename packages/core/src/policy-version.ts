import { shouldEmit } from "./emit";
import type { PolicyStackConfig } from "./types";

function stableSerialize(value: unknown): string {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
	const entries = Object.entries(value as Record<string, unknown>)
		.filter(([, v]) => v !== undefined)
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`).join(",")}}`;
}

function fnv1a32(str: string): string {
	let hash = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, "0");
}

// Hashing is an explicit allowlist, NOT the whole config. Anything not listed
// below is excluded by construction. In particular:
// - The version fields themselves (chicken-and-egg).
// - `policies`: explicit opt-in/out for which documents render — orthogonal to per-document content.
// - `consent`: runtime-only knobs (adapter, jurisdictionResolver, …). It is
//   absent from both allowlists on purpose — swapping a storage adapter or
//   resolver MUST NOT churn privacyVersion/cookieVersion (which would falsely
//   re-prompt every visitor). policy-version.test.ts pins this invariant; do
//   not add "consent" to either list and do not switch to whole-object hashing.
// `locale` is included so same-config-different-locale produces distinct versions.
const PRIVACY_HASH_FIELDS = [
	"company",
	"effectiveDate",
	"jurisdictions",
	"locale",
	"data",
	"children",
	"thirdParties",
	"automatedDecisionMaking",
	"cookies",
] as const;

const COOKIE_HASH_FIELDS = [
	"company",
	"effectiveDate",
	"jurisdictions",
	"locale",
	"cookies",
	"thirdParties",
	"trackingTechnologies",
	"consentMechanism",
] as const;

function hashSlice(
	config: PolicyStackConfig,
	fields: readonly (keyof PolicyStackConfig)[],
): string {
	const slice: Record<string, unknown> = {};
	for (const field of fields) {
		const value = config[field];
		if (value !== undefined) slice[field] = value;
	}
	return fnv1a32(stableSerialize(slice));
}

// Hash a document's slice only when that document is actually emitted — the
// same gate the compiler and validator use (one shared `shouldEmit`).
export function computePrivacyVersion(config: PolicyStackConfig): string | undefined {
	if (!shouldEmit("privacy", config)) return undefined;
	return hashSlice(config, PRIVACY_HASH_FIELDS);
}

export function computeCookieVersion(config: PolicyStackConfig): string | undefined {
	if (!shouldEmit("cookie", config)) return undefined;
	return hashSlice(config, COOKIE_HASH_FIELDS);
}
