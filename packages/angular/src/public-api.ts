export { ConsentService } from "./consent.service";
export { injectCategory, type CategoryRef } from "./category";
export { ConsentGate } from "./consent-gate";
export { providePolicyStackConsent, type ProvidePolicyStackConsentOptions } from "./provider";
export { POLICYSTACK_CONSENT_STORE } from "./tokens";

export type {
	Category,
	ConsentExpr,
	ConsentRecord,
	ConsentRecordSource,
	ConsentState,
	ConsentStore,
	Jurisdiction,
	PolicyStackConsentConfig,
	RepromptReason,
	Route,
} from "@policystack/core/consent";
