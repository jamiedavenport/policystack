import { type EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import {
	createConsentStore,
	type ConsentStore,
	type PolicyStackConsentConfig,
} from "@policystack/core/consent";
import { POLICYSTACK_CONSENT_STORE } from "./tokens";

export type ProvidePolicyStackConsentOptions =
	| { config: PolicyStackConsentConfig; store?: undefined }
	| { store: ConsentStore; config?: undefined };

export function providePolicyStackConsent(
	options: ProvidePolicyStackConsentOptions,
): EnvironmentProviders {
	return makeEnvironmentProviders([
		{
			provide: POLICYSTACK_CONSENT_STORE,
			useFactory: () => (options.store ? options.store : createConsentStore(options.config)),
		},
	]);
}
