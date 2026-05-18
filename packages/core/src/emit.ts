import type { PolicyCategory, PolicyStackConfig } from "./types";

const PRIVACY_FIELDS = ["data", "children"] as const;

function hasAnyPrivacyField(config: PolicyStackConfig): boolean {
	return PRIVACY_FIELDS.some((field) => config[field] !== undefined);
}

function hasCookieField(config: PolicyStackConfig): boolean {
	return config.cookies !== undefined;
}

/**
 * The single decision for whether a config emits a given policy document.
 * Read by the compiler entry points (index.ts), the validator (validate.ts),
 * and the per-document version hash (policy-version.ts) so all three agree on
 * which documents a config produces. Lives in its own module so validate.ts
 * does not have to import the index barrel (which would re-introduce a cycle).
 */
export function shouldEmit(category: PolicyCategory, config: PolicyStackConfig): boolean {
	if (config.policies) return config.policies.includes(category);
	return category === "privacy" ? hasAnyPrivacyField(config) : hasCookieField(config);
}
