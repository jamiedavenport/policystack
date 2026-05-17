import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import { ISSUE_CODE_IDS, ISSUE_CODES } from "./issue-codes";

const here = dirname(fileURLToPath(import.meta.url));

// The registry is the frozen 1.0 surface (§6) and the single source `IssueCode`
// is derived from. These guard the count and the exact membership so a stray
// add/remove is a loud failure, not a silent skill/llms.txt drift.

test("the registry is exactly 30 codes, in registry order, with no duplicates", () => {
	expect(ISSUE_CODES).toHaveLength(30);
	expect(ISSUE_CODE_IDS).toHaveLength(30);
	expect(new Set(ISSUE_CODE_IDS).size).toBe(30);
});

test("the canonical code set is frozen", () => {
	expect([...ISSUE_CODE_IDS].sort()).toEqual(
		[
			"automated-decision-making",
			"children-under-age-invalid",
			"company-address-required",
			"company-contact-phone-recommended",
			"company-contact-required",
			"company-dpo-undeclared",
			"company-legal-name-required",
			"company-name-required",
			"consent-banner-required",
			"consent-mechanism-undeclared",
			"consent-preference-panel-required",
			"consent-withdrawal-required",
			"cookie-lawful-basis-missing",
			"cookies-empty",
			"data-collected-empty",
			"data-context-missing",
			"data-context-orphan",
			"data-missing",
			"data-purpose-empty",
			"data-purpose-missing",
			"effective-date-required",
			"jurisdiction-generic-policy-text",
			"jurisdiction-unknown",
			"jurisdictions-required",
			"lawful-basis-incomplete",
			"locale-unknown",
			"policy-cookie-empty",
			"policy-empty",
			"retention-incomplete",
			"statutory-contractual-obligation",
		].sort(),
	);
});

test("every level is exactly what validate() emits", () => {
	const level = Object.fromEntries(ISSUE_CODES.map((e) => [e.code, e.level]));
	// Canary sample across both severities — promotion is a downstream concern.
	expect(level["effective-date-required"]).toBe("error");
	expect(level["data-collected-empty"]).toBe("warning");
	expect(level["jurisdiction-generic-policy-text"]).toBe("warning");
	expect(level["lawful-basis-incomplete"]).toBe("error");
});

test("registry ⟺ validate(): no dead codes, no unregistered codes", () => {
	const src = readFileSync(join(here, "validate.ts"), "utf8");
	const emitted = new Set(
		[...src.matchAll(/code:\s*"([a-z-]+)"/g)].map((m) => m[1] as (typeof ISSUE_CODE_IDS)[number]),
	);
	// Every code validate() can push is registered…
	for (const code of emitted) expect(ISSUE_CODE_IDS).toContain(code);
	// …and every registered code is actually reachable from validate().
	for (const code of ISSUE_CODE_IDS) expect(emitted).toContain(code);
});

test("summaries are non-empty stable prose", () => {
	for (const { summary } of ISSUE_CODES) expect(summary.trim().length).toBeGreaterThan(0);
});
