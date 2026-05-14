import type { Locale } from "../types";
import { dictionaries } from "./locales";
import type { Dictionary } from "./types";

export type T = Dictionary;

export function createT(locale: Locale): T {
	return dictionaries[locale] ?? dictionaries.en;
}

export { formatDate } from "./format";
export { dictionaries, isLocale, LOCALES } from "./locales";
export type { CookieCategory, CookieType, Dictionary } from "./types";
