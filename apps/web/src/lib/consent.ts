import { timezoneResolver } from "@openpolicy/core/consent";
import { localStorageAdapter } from "@openpolicy/core/consent/storage/local-storage";
import type { OpenCookiesConfig } from "@openpolicy/core/consent";
import { toOpenCookiesConfig } from "@openpolicy/sdk/consent";

import policy from "../openpolicy";

// The site's own policy is the single source of truth for cookie categories.
// `toOpenCookiesConfig` derives the categories + `locked` flags from the policy's
// lawful bases (analytics is `Consent` ⇒ a real opt-in toggle; essential stays
// locked) and wires the `policyVersionChanged` re-prompt off `cookieVersion`.
//
// We pass this `config` to <OpenCookiesProvider> rather than a shared module
// store: the provider memoizes one store per component instance, so each SSR
// request gets its own store instead of leaking consent state across requests.
export const consentConfig: OpenCookiesConfig = {
	...toOpenCookiesConfig(policy),
	adapter: localStorageAdapter(),
	jurisdictionResolver: timezoneResolver(),
};
