import type { Locale } from "../types";
import { en } from "./en";
import type { Dictionary } from "./types";

export const LOCALES: readonly Locale[] = ["en"] as const;

export const dictionaries: Record<Locale, Dictionary> = { en };

export function isLocale(value: unknown): value is Locale {
	return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
