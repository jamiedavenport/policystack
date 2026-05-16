import {
	type ConsentModel,
	consentModelFor,
	type JurisdictionId,
	resolveJurisdiction,
} from "../jurisdiction-id";
import type { Category, Jurisdiction } from "./types";

export type { ConsentModel };

/**
 * Bridge the runtime uppercase `Jurisdiction` onto a canonical `JurisdictionId`.
 * Lowercasing maps `"US-CA"`→`us-ca`, `"EEA"`→`eea`, `"ROW"`→`row`;
 * `resolveJurisdiction` folds the long US-state tail (`"US-FL"`) → `us`. A
 * `null` resolve, `"AU"` (runtime-only — no canonical `au`), or anything
 * unrecognised falls back to `row` (conservative opt-in, per §4.2).
 */
export function toJurisdictionId(j: Jurisdiction | null): JurisdictionId {
	if (j === null) return "row";
	return resolveJurisdiction(j.toLowerCase()) ?? "row";
}

/**
 * The §4.2 flagship: the resolved visitor's jurisdiction → its default consent
 * posture, read from the same `JURISDICTION_TABLE` as the policy text.
 */
export function jurisdictionPosture(j: Jurisdiction | null): ConsentModel {
	return consentModelFor(toJurisdictionId(j));
}

/**
 * Turn a posture into the initial `decisions` map. Composes with the §4.1
 * lawful-basis bridge rather than duplicating it: a `locked` category (built
 * on a non-consent lawful basis — a standing legal ground) is always granted;
 * a consent-gated category takes the posture default — opt-out ⇒ on by
 * default (gated only by Do-Not-Sell/GPC), opt-in ⇒ off until affirmative
 * consent.
 */
export function postureDecisions(
	categories: Category[],
	model: ConsentModel,
): Record<string, boolean> {
	const on = model === "opt-out";
	return Object.fromEntries(categories.map((c) => [c.key, c.locked === true ? true : on]));
}
