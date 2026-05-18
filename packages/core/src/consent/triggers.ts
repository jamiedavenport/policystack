import type { JurisdictionId } from "../jurisdiction-id";
import { parseDuration } from "./duration";
import type { Category, ConsentRecord, RepromptReason, RepromptTriggers } from "./types";

export type TriggerInput = {
	record: ConsentRecord;
	triggers: RepromptTriggers | undefined;
	policyVersion: string;
	categories: Category[];
	jurisdiction: JurisdictionId | null;
	now: number;
};

export function evaluateTriggers(input: TriggerInput): RepromptReason | null {
	const { record, triggers, policyVersion, categories, jurisdiction, now } = input;
	if (!triggers) return null;

	if (triggers.policyVersionChanged === true && policyVersion !== record.policyVersion) {
		return "policyVersion";
	}

	if (triggers.categoriesAdded === true) {
		for (const c of categories) {
			if (!Object.hasOwn(record.decisions, c.key)) return "categoriesAdded";
		}
	}

	if (triggers.expiresAfter !== undefined) {
		const ms = parseDuration(triggers.expiresAfter);
		if (ms !== null) {
			const decidedAt = Date.parse(record.decidedAt);
			if (Number.isFinite(decidedAt) && now - decidedAt > ms) return "expired";
		}
	}

	if (
		triggers.jurisdictionChanged === true &&
		record.jurisdiction !== null &&
		jurisdiction !== null &&
		record.jurisdiction !== jurisdiction
	) {
		return "jurisdiction";
	}

	return null;
}
