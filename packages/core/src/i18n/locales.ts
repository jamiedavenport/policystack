import type { Locale } from "../types";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { nl } from "./nl";
import type { Dictionary } from "./types";

export const LOCALES: readonly Locale[] = ["en", "fr", "de", "nl", "es"] as const;

export const dictionaries: Record<Locale, Dictionary> = { en, fr, de, nl, es };

export function isLocale(value: unknown): value is Locale {
	return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
