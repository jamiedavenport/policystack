import type { PolicyStackConfig } from "@policystack/core";
import type { VendorHit } from "./consent/types";
import { vendorById } from "./registry";
import type { Scanned } from "./scanned";

/**
 * The §4.3 declared-vs-used cross-check codes (PS-25). The OSS differentiator:
 * the policy declared in `policystack.ts` is checked *both ways* against what
 * the single walk actually found in the code. These live here, not in core's
 * frozen config-only `IssueCode` union — drift needs scanned data + config —
 * but they ride the same `strict` / `suppress` policy so a team can commit an
 * explicit accepted-gap decision.
 */
export type DriftCode =
	| "vendor-used-not-declared" //                error  — tracked vendor in code, absent from thirdParties
	| "vendor-declared-not-used" //                warn   — thirdParties entry with no detected use
	| "cookie-category-used-not-declared" //       error  — vendor's category not enabled in cookies.used
	| "cookie-category-declared-not-used" //       error  — cookies.used category nothing in code uses
	| "sharing-recipient-not-in-thirdparties" //   error  — sharing() to an undeclared recipient
	| "sharing-key-not-collected"; //              error  — sharing() a category never declared collected

export type DriftFinding = {
	code: DriftCode;
	level: "error" | "warning";
	message: string;
	suggestion?: string;
	file?: string;
	line?: number;
	column?: number;
};

const ESSENTIAL = "essential";

function declaredVendorNames(config: PolicyStackConfig): Set<string> {
	return new Set((config.thirdParties ?? []).map((t) => t.name));
}

function declaredCookieCategories(config: PolicyStackConfig): Set<string> {
	const used = config.cookies?.used ?? {};
	const out = new Set<string>();
	for (const [key, enabled] of Object.entries(used)) {
		if (enabled && key !== ESSENTIAL) out.add(key);
	}
	return out;
}

/**
 * Categories the code actually exercises: every detected tracking vendor's
 * category, plus every scanned `defineCookie()` category. `essential` is
 * never consent-gated so it is excluded from both drift directions.
 */
function usedCookieCategories(scanned: Scanned, vendors: VendorHit[]): Set<string> {
	const out = new Set<string>();
	for (const v of vendors) if (v.category !== ESSENTIAL) out.add(v.category);
	for (const [key, enabled] of Object.entries(scanned.cookies)) {
		if (enabled && key !== ESSENTIAL) out.add(key);
	}
	return out;
}

/**
 * Bidirectional policy↔runtime consistency check. Pure
 * `(config, scanned, vendors) => DriftFinding[]`. `vendors` are the
 * import/global hits from the unified walk; `scanned` is the merged policy
 * (sharing edges, cookie categories, declared third parties).
 */
export function crossCheck(
	config: PolicyStackConfig,
	scanned: Scanned,
	vendors: VendorHit[],
): DriftFinding[] {
	const findings: DriftFinding[] = [];
	const declaredVendors = declaredVendorNames(config);
	const declaredCookies = declaredCookieCategories(config);
	const declaredData = new Set(Object.keys(config.data?.collected ?? {}));

	// One representative hit per distinct detected vendor (first occurrence).
	const firstHitByVendor = new Map<string, VendorHit>();
	for (const v of vendors) if (!firstHitByVendor.has(v.vendor)) firstHitByVendor.set(v.vendor, v);

	const usedVendorNames = new Set<string>();
	for (const [vendorId, hit] of firstHitByVendor) {
		const rec = vendorById(vendorId);
		const name = rec?.name ?? vendorId;
		usedVendorNames.add(name);

		// used → declared (vendor)
		if (!declaredVendors.has(name)) {
			const suggestion = rec
				? `Add to policystack.ts thirdParties:\n` +
					`    { name: ${JSON.stringify(rec.name)}, purpose: ${JSON.stringify(
						rec.purpose,
					)}, policyUrl: ${JSON.stringify(rec.policyUrl)} }`
				: `Add a thirdParties entry for ${JSON.stringify(name)}.`;
			findings.push({
				code: "vendor-used-not-declared",
				level: "error",
				message: `${name} is used in code (detected via ${hit.detector}) but is not declared in thirdParties.`,
				suggestion,
				file: hit.file,
				line: hit.line,
				column: hit.column,
			});
		}

		// used → declared (cookie category implied by the vendor)
		if (hit.category !== ESSENTIAL && !declaredCookies.has(hit.category)) {
			findings.push({
				code: "cookie-category-used-not-declared",
				level: "error",
				message: `${name} implies the "${hit.category}" cookie category, but cookies.used["${hit.category}"] is not enabled.`,
				suggestion: `Set cookies.used["${hit.category}"] = true and add a cookies.context["${hit.category}"] entry (lawfulBasis).`,
				file: hit.file,
				line: hit.line,
				column: hit.column,
			});
		}
	}

	// A vendor the scanner itself found (an SDK `thirdParty()` call or the
	// `usePackageJson` dependency detector) is evidence of use too — only a
	// vendor backed by *nothing* the scanner saw is "declared but not used".
	for (const tp of scanned.thirdParties) usedVendorNames.add(tp.name);

	// declared → used (vendor): over-disclosure. A pure server-side processor
	// legitimately has no client-side detection, so this is a warning, not a
	// build failure (suppress to silence a known one).
	for (const name of declaredVendors) {
		if (!usedVendorNames.has(name)) {
			findings.push({
				code: "vendor-declared-not-used",
				level: "warning",
				message: `thirdParties declares "${name}" but no use of it was detected in code.`,
				suggestion: `Remove it from thirdParties if it no longer applies, or suppress "vendor-declared-not-used" if the integration is intentionally invisible to the scanner (e.g. a server-side processor).`,
			});
		}
	}

	// declared → used (cookie category): the headline §4.3 check.
	const usedCookies = usedCookieCategories(scanned, vendors);
	for (const cat of declaredCookies) {
		if (!usedCookies.has(cat)) {
			findings.push({
				code: "cookie-category-declared-not-used",
				level: "error",
				message: `cookies.used["${cat}"] is enabled, but nothing in the code uses the "${cat}" category.`,
				suggestion: `Disable cookies.used["${cat}"] if you no longer use it, or suppress "cookie-category-declared-not-used" to accept the gap.`,
			});
		}
	}

	// sharing() edges must point at declared recipients and declared data.
	for (const edge of scanned.sharing) {
		if (!declaredVendors.has(edge.recipient)) {
			findings.push({
				code: "sharing-recipient-not-in-thirdparties",
				level: "error",
				message: `sharing("${edge.key}", "${edge.recipient}", …) discloses data to "${edge.recipient}", which is not in thirdParties.`,
				suggestion: `Add a thirdParties entry for ${JSON.stringify(edge.recipient)}.`,
			});
		}
		if (!declaredData.has(edge.key)) {
			findings.push({
				code: "sharing-key-not-collected",
				level: "error",
				message: `sharing("${edge.key}", "${edge.recipient}", …) shares the "${edge.key}" category, which is not in data.collected.`,
				suggestion: `Add "${edge.key}" to data.collected and a data.context["${edge.key}"] entry.`,
			});
		}
	}

	return findings;
}

/**
 * The {@link DriftFinding} analogue of the validator's `applyIssuePolicy`
 * (same order: `suppress` drops by code at any level FIRST, then `strict`
 * promotes the remaining warnings to errors — so a suppressed code is never
 * promoted). Pure; an absent/empty policy is the identity transform.
 */
export function applyDriftPolicy(
	findings: DriftFinding[],
	policy: { strict?: boolean; suppress?: readonly string[] },
): DriftFinding[] {
	const suppressed = new Set(policy.suppress ?? []);
	const kept = suppressed.size > 0 ? findings.filter((f) => !suppressed.has(f.code)) : findings;
	if (!policy.strict) return kept;
	return kept.map((f) => (f.level === "warning" ? { ...f, level: "error" } : f));
}

/**
 * Formats a drift finding for the terminal — same greppable `[policystack]`
 * prefix as `formatIssue`, with an optional `file:line:col` and the
 * actionable "add this to policystack.ts" suggestion.
 */
export function formatDrift(f: DriftFinding): string {
	const loc = f.file && f.line !== undefined ? ` ${f.file}:${f.line}:${f.column ?? 0}` : "";
	const lines = [`[policystack]${loc} ${f.code}: ${f.message}`];
	if (f.suggestion) lines.push(`  ${f.suggestion.replace(/\n/g, "\n  ")}`);
	return lines.join("\n");
}
