import type { EffectiveDate, Locale } from "../types";

const LOCALE_TAG: Record<Locale, string> = {
	en: "en-US",
	fr: "fr-FR",
	de: "de-DE",
	nl: "nl-NL",
	es: "es-ES",
};

// Format an EffectiveDate (YYYY-MM-DD) into a locale-appropriate long-form date.
// timeZone is pinned to UTC because EffectiveDate is calendar-only — without
// this, a US-West build server would emit "December 31, 2025" for "2026-01-01".
export function formatDate(date: EffectiveDate, locale: Locale): string {
	const [y, m, d] = date.split("-").map(Number);
	const utc = new Date(Date.UTC(y as number, (m as number) - 1, d as number));
	return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
		dateStyle: "long",
		timeZone: "UTC",
	}).format(utc);
}
