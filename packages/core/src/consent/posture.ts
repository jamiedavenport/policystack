import { type ConsentModel, consentModelFor, type JurisdictionId } from "../jurisdiction-id";
import type { Category } from "./types";

export type { ConsentModel };

/**
 * The §4.2 flagship: the resolved visitor's jurisdiction → its default consent
 * posture, read from the same `JURISDICTION_TABLE` as the policy text. A `null`
 * resolve (no resolver configured, or the resolver returned null) defaults to
 * `row` — conservative opt-in.
 */
export function jurisdictionPosture(j: JurisdictionId | null): ConsentModel {
	return consentModelFor(j ?? "row");
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
