// The stable public `@policystack/sdk/consent` entry point. The cookies →
// consent-categories derivation is no longer a separate exported step: it lives
// inside `@policystack/core`'s `createConsentStore`, which the single
// `<PolicyStack>` provider (React/Vue/Solid) calls with the whole
// `PolicyStackConfig`. This entry now exposes only the one hand-authored
// surface — `PolicyStackConsentOptions`, the runtime-only knobs that live under
// `PolicyStackConfig.consent` (storage adapter, jurisdiction resolver, GPC,
// triggers, …) and cannot be derived from the policy.
export type { PolicyStackConsentOptions } from "@policystack/core/consent";
