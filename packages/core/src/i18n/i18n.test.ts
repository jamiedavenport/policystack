import { expect, test } from "vite-plus/test";
import type { Locale } from "../types";
import { en } from "./en";
import { formatDate } from "./format";
import { createT, dictionaries, isLocale, LOCALES } from "./index";

test("createT returns the English dictionary for 'en'", () => {
	const t = createT("en");
	expect(t.privacy.introduction.heading()).toBe("Introduction");
	expect(t.cookie.introduction.heading()).toBe("Cookie Policy");
});

test("createT falls back to English for an unknown locale", () => {
	const t = createT("xx" as Locale);
	expect(t.privacy.introduction.heading()).toBe("Introduction");
});

test("isLocale accepts registered locales and rejects others", () => {
	expect(isLocale("en")).toBe(true);
	expect(isLocale("fr")).toBe(false);
	expect(isLocale("de")).toBe(false);
	expect(isLocale("")).toBe(false);
	expect(isLocale(undefined)).toBe(false);
	expect(isLocale(123)).toBe(false);
});

test("LOCALES contains every key in dictionaries", () => {
	const dictKeys = Object.keys(dictionaries).sort();
	const localeKeys = [...LOCALES].sort();
	expect(dictKeys).toEqual(localeKeys);
});

test("interpolation works in template-function values", () => {
	const t = createT("en");
	const body = t.privacy.introduction.body({
		companyName: "Acme",
		effectiveDate: "2026-01-01",
		versionSuffix: " Version: abc123.",
	});
	expect(body).toContain("Acme");
	expect(body).toContain("2026-01-01");
	expect(body).toContain("Version: abc123.");
});

test("formatDate renders English long-form dates", () => {
	expect(formatDate("2026-01-01", "en")).toBe("January 1, 2026");
	expect(formatDate("2026-03-03", "en")).toBe("March 3, 2026");
});

test("formatDate is timezone-independent (UTC pinning)", () => {
	// Without timeZone: "UTC", a US-West runtime would shift 2026-01-01
	// to 2025-12-31 because new Date("2026-01-01") parses as midnight UTC,
	// then Intl renders it in the runtime's local TZ. Pinning to UTC fixes this.
	expect(formatDate("2026-01-01", "en")).toBe("January 1, 2026");
});

test("legal basis labels cover every member of the LegalBasis union", () => {
	const t = createT("en");
	expect(t.shared.legalBasisLabels.consent()).toBe("Consent (Article 6(1)(a))");
	expect(t.shared.legalBasisLabels.contract()).toBe("Performance of a contract (Article 6(1)(b))");
	expect(t.shared.legalBasisLabels.legal_obligation()).toBe(
		"Compliance with a legal obligation (Article 6(1)(c))",
	);
	expect(t.shared.legalBasisLabels.vital_interests()).toBe(
		"Protection of vital interests (Article 6(1)(d))",
	);
	expect(t.shared.legalBasisLabels.public_task()).toBe(
		"Performance of a public task (Article 6(1)(e))",
	);
	expect(t.shared.legalBasisLabels.legitimate_interests()).toBe(
		"Legitimate interests (Article 6(1)(f))",
	);
});

test("dictionary keys are stable references on en", () => {
	// Smoke test that the dictionary object itself is well-formed —
	// every top-level namespace exists.
	expect(en.shared).toBeDefined();
	expect(en.privacy).toBeDefined();
	expect(en.cookie).toBeDefined();
});
