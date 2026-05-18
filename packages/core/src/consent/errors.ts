export type PolicyStackConsentErrorCode = "UNKNOWN_CATEGORY";

export class PolicyStackConsentError extends Error {
	readonly code: PolicyStackConsentErrorCode;

	constructor(code: PolicyStackConsentErrorCode, message: string) {
		super(message);
		this.name = "PolicyStackConsentError";
		this.code = code;
	}
}
