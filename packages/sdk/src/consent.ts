// The canonical derivation now lives in @policystack/core/consent so
// @policystack/sdk and @policystack/react import one copy (no react → sdk edge,
// no forked parity test). This file stays as the stable public
// `@policystack/sdk/consent` entry point — re-exporting the bridge plus the
// authored-knobs type so SDK power users and the single-config provider flow
// are unaffected. The single-config flow is: author `PolicyStackConfig.consent`
// and pass the whole config to `<PolicyStackProvider>`, which calls
// `toPolicyStackConsentConfig(config, config.consent)` internally.
export {
	toPolicyStackConsentConfig,
	type ToConsentConfigOptions,
	type PolicyStackConsentOptions,
} from "@policystack/core/consent";
