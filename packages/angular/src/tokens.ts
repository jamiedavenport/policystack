import { InjectionToken } from "@angular/core";
import type { ConsentStore } from "@policystack/core/consent";

export const POLICYSTACK_CONSENT_STORE = new InjectionToken<ConsentStore>(
	"POLICYSTACK_CONSENT_STORE",
);
