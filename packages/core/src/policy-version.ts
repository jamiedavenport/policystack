import type { OpenPolicyConfig } from "./types";

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

// Excluded from the hash:
// - The version fields themselves (chicken-and-egg).
// - `policies`: explicit opt-in/out for which documents render — orthogonal to per-document content.
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

function hashSlice(config: OpenPolicyConfig, fields: readonly (keyof OpenPolicyConfig)[]): string {
	const slice: Record<string, unknown> = {};
	for (const field of fields) {
		const value = config[field];
		if (value !== undefined) slice[field] = value;
	}
	return fnv1a32(stableSerialize(slice));
}

function hasAnyPrivacyField(config: OpenPolicyConfig): boolean {
	return config.data !== undefined || config.children !== undefined;
}

function shouldHashPrivacy(config: OpenPolicyConfig): boolean {
	if (config.policies) return config.policies.includes("privacy");
	return hasAnyPrivacyField(config);
}

function shouldHashCookie(config: OpenPolicyConfig): boolean {
	if (config.policies) return config.policies.includes("cookie");
	return config.cookies !== undefined;
}

export function computePrivacyVersion(config: OpenPolicyConfig): string | undefined {
	if (!shouldHashPrivacy(config)) return undefined;
	return hashSlice(config, PRIVACY_HASH_FIELDS);
}

export function computeCookieVersion(config: OpenPolicyConfig): string | undefined {
	if (!shouldHashCookie(config)) return undefined;
	return hashSlice(config, COOKIE_HASH_FIELDS);
}
