import type { Locale } from "../types";
import { dictionaries } from "./locales";
import type { Dictionary } from "./types";

export type T = Dictionary;

export function createT(locale: Locale, dictionary?: Dictionary): T {
	return dictionary ?? dictionaries[locale] ?? dictionaries.en;
}

export { formatDate } from "./format";
export { dictionaries, isLocale, LOCALES } from "./locales";
export type { Dictionary } from "./types";
