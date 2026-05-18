import { expect, test } from "vite-plus/test";
import { compilePrivacyPolicy } from "../index";
import type { Locale, PolicyStackConfig } from "../types";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { formatDate } from "./format";
import { fr } from "./fr";
import { createT, dictionaries, isLocale, LOCALES } from "./index";
import { nl } from "./nl";

test("createT returns the English dictionary for 'en'", () => {
	const t = createT("en");
	expect(t.privacy.introduction.heading()).toBe("Introduction");
	expect(t.cookie.introduction.heading()).toBe("Cookie Policy");
});

test("createT falls back to English for an unknown locale", () => {
	const t = createT("xx" as Locale);
	expect(t.privacy.introduction.heading()).toBe("Introduction");
});

const customDictionary: typeof en = {
	...en,
	privacy: {
		...en.privacy,
		introduction: {
			...en.privacy.introduction,
			heading: () => "CUSTOM_INTRO_HEADING_XYZ",
		},
	},
};

test("createT returns a caller-supplied dictionary verbatim (full replacement)", () => {
	expect(createT("en", customDictionary).privacy.introduction.heading()).toBe(
		"CUSTOM_INTRO_HEADING_XYZ",
	);
	// The locale argument is irrelevant to string content once a custom
	// dictionary is supplied — it is used verbatim regardless of locale.
	expect(createT("fr", customDictionary).privacy.introduction.heading()).toBe(
		"CUSTOM_INTRO_HEADING_XYZ",
	);
});

test("compile uses a custom dictionary for emitted strings; locale still drives dates", () => {
	const doc = compilePrivacyPolicy(buildPrivacyConfig("fr"), customDictionary);
	const blob = JSON.stringify(doc);
	expect(blob).toContain("CUSTOM_INTRO_HEADING_XYZ");
	// `locale: "fr"` still governs date formatting independently of the dictionary.
	expect(blob).toContain("1 janvier 2026");
});

test("isLocale accepts registered locales and rejects others", () => {
	for (const locale of LOCALES) expect(isLocale(locale)).toBe(true);
	expect(isLocale("it")).toBe(false);
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

test("formatDate renders locale-appropriate long-form dates", () => {
	expect(formatDate("2026-01-01", "en")).toBe("January 1, 2026");
	expect(formatDate("2026-03-03", "en")).toBe("March 3, 2026");
	expect(formatDate("2026-01-01", "fr")).toBe("1 janvier 2026");
	expect(formatDate("2026-03-03", "fr")).toBe("3 mars 2026");
	expect(formatDate("2026-01-01", "de")).toBe("1. Januar 2026");
	expect(formatDate("2026-03-03", "de")).toBe("3. März 2026");
	expect(formatDate("2026-01-01", "nl")).toBe("1 januari 2026");
	expect(formatDate("2026-03-03", "nl")).toBe("3 maart 2026");
	expect(formatDate("2026-01-01", "es")).toBe("1 de enero de 2026");
	expect(formatDate("2026-03-03", "es")).toBe("3 de marzo de 2026");
});

test("formatDate is timezone-independent (UTC pinning)", () => {
	// Without timeZone: "UTC", a US-West runtime would shift 2026-01-01
	// to 2025-12-31 because new Date("2026-01-01") parses as midnight UTC,
	// then Intl renders it in the runtime's local TZ. Pinning to UTC fixes this.
	expect(formatDate("2026-01-01", "en")).toBe("January 1, 2026");
	expect(formatDate("2026-01-01", "fr")).toBe("1 janvier 2026");
	expect(formatDate("2026-01-01", "de")).toBe("1. Januar 2026");
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

function leafPaths(obj: unknown, prefix = ""): string[] {
	if (typeof obj === "function") return [prefix];
	if (obj === null || typeof obj !== "object") return [];
	return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
		leafPaths(v, prefix ? `${prefix}.${k}` : k),
	);
}

const NON_EN: { locale: Locale; dict: typeof en }[] = [
	{ locale: "fr", dict: fr },
	{ locale: "de", dict: de },
	{ locale: "nl", dict: nl },
	{ locale: "es", dict: es },
];

test("every non-English dictionary covers every key in English", () => {
	const enPaths = leafPaths(en).sort();
	for (const { locale, dict } of NON_EN) {
		const paths = leafPaths(dict).sort();
		expect(paths, `${locale} dictionary mismatch`).toEqual(enPaths);
	}
});

test("translated headings differ from English", () => {
	const enHeading = en.privacy.dataCollected.heading();
	for (const { locale, dict } of NON_EN) {
		expect(dict.privacy.dataCollected.heading(), locale).not.toBe(enHeading);
	}
});

test("each non-English locale's legal_basis labels cite article 6", () => {
	for (const { locale, dict } of NON_EN) {
		// "6" is in every translation; locale-specific phrasing differs.
		expect(dict.shared.legalBasisLabels.consent(), locale).toMatch(/6/);
		expect(dict.shared.legalBasisLabels.contract(), locale).toMatch(/6/);
	}
});

const ENGLISH_CANARIES = [
	"Effective Date:",
	"Information We Collect",
	"Your Rights",
	"GDPR Supplemental Disclosures",
	"Data Controller:",
	"Right to access your personal data",
	"Performance of a contract",
	"Cookies and Tracking",
	"Submitting requests.",
];

type LocaleCanary = {
	locale: Locale;
	mustContain: string[];
};

const NON_EN_CANARIES: LocaleCanary[] = [
	{
		locale: "fr",
		mustContain: [
			"Date d'entrée en vigueur",
			"Données que nous collectons",
			"Vos droits",
			"Responsable du traitement",
			"1 janvier 2026",
		],
	},
	{
		locale: "de",
		mustContain: [
			"Datum des Inkrafttretens",
			"Welche Daten wir erheben",
			"Ihre Rechte",
			"Verantwortlicher",
			"1. Januar 2026",
		],
	},
	{
		locale: "nl",
		mustContain: [
			"Ingangsdatum",
			"Welke gegevens wij verzamelen",
			"Uw rechten",
			"Verwerkingsverantwoordelijke",
			"1 januari 2026",
		],
	},
	{
		locale: "es",
		mustContain: [
			"Fecha de entrada en vigor",
			"Información que recopilamos",
			"Sus derechos",
			"Responsable del tratamiento",
			"1 de enero de 2026",
		],
	},
];

function buildPrivacyConfig(locale: Locale): PolicyStackConfig {
	return {
		effectiveDate: "2026-01-01",
		locale,
		company: {
			name: "Acme",
			legalName: "Acme SAS",
			address: "1 rue de la Paix, 75002 Paris, France",
			contact: { email: "privacy@acme.test" },
		},
		data: {
			collected: { Account: ["Email", "Name"] },
			context: {
				Account: {
					purpose: "Authenticate users",
					lawfulBasis: "contract",
					retention: "Until account deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot operate your account.",
					},
				},
			},
		},
		cookies: {
			used: { essential: true },
			context: { essential: { lawfulBasis: "legal_obligation" } },
		},
		thirdParties: [],
		jurisdictions: ["eea"],
	};
}

for (const { locale, mustContain } of NON_EN_CANARIES) {
	test(`${locale} privacy document compiles without English leakage`, () => {
		const doc = compilePrivacyPolicy(buildPrivacyConfig(locale));
		const blob = JSON.stringify(doc);
		for (const phrase of ENGLISH_CANARIES) {
			expect(blob, `${locale}: unexpected English phrase "${phrase}"`).not.toContain(phrase);
		}
		for (const phrase of mustContain) {
			expect(blob, `${locale}: missing expected phrase "${phrase}"`).toContain(phrase);
		}
	});
}
