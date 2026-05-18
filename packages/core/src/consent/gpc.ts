import type { JurisdictionId } from "../jurisdiction-id";
import type { ConsentState, GPCConfig, PolicyStackConsentConfig } from "./types";

export const GPC_LEGALLY_REQUIRED_JURISDICTIONS: JurisdictionId[] = [
	"us-ca",
	"us-co",
	"us-ct",
	"us-va",
];

export function readGPCSignal(config: GPCConfig | undefined): boolean {
	if (config?.enabled === false) return false;
	if (config?.signal !== undefined) return config.signal;
	if (typeof navigator === "undefined") return false;
	return (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function gpcApplies(
	jurisdiction: JurisdictionId | null,
	config: GPCConfig | undefined,
): boolean {
	if (config?.enabled === false) return false;
	const scope = config?.applicableJurisdictions ?? "all";
	if (scope === "all") return true;
	if (jurisdiction === null) return false;
	return scope.includes(jurisdiction);
}

export function applyGPC(state: ConsentState, config: PolicyStackConsentConfig): ConsentState {
	if (!readGPCSignal(config.gpc)) return state;
	if (!gpcApplies(state.jurisdiction, config.gpc)) return state;
	// An explicit user decision (W3C GPC §"affirmative consent") overrides the signal.
	if (state.source === "user" && state.decidedAt !== null) return state;

	const decisions = { ...state.decisions };
	let changed = false;
	for (const cat of state.categories) {
		if (cat.locked === true) continue;
		if (cat.respectGPC === false) continue;
		if (decisions[cat.key] !== false) {
			decisions[cat.key] = false;
			changed = true;
		}
	}

	if (!changed && state.source === "gpc") return state;

	// GPC is a signal, not a decision: leave route/decidedAt untouched so the
	// banner remains visible and the user can affirmatively consent if they want.
	return { ...state, decisions, source: "gpc" };
}
