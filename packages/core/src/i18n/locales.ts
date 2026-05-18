import type { Locale } from "../types";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { nl } from "./nl";
import type { Dictionary } from "./types";

// `LOCALES`/`isLocale` live in ../locale (dependency-free) so the consent
// runtime can share them without pulling these dictionaries in. Re-exported
// here to keep the historical `@policystack/core` import path unchanged.
export { isLocale, LOCALES } from "../locale";

export const dictionaries: Record<Locale, Dictionary> = { en, fr, de, nl, es };
