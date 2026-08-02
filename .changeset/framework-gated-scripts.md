---
"@policystack/vue": minor
"@policystack/solid": minor
"@policystack/svelte": minor
---

Vue, Solid, and Svelte now expose `<GatedScript def={...} />`, completing framework-native support for `gateScript` and the `@policystack/scripts` catalogue (#159). Each renderless component reads the enclosing consent store, gates only on the client, disposes with the component lifecycle, follows `def.id` across rerenders so inline definitions retain queued calls, and forwards the optional `onEvent` stream.

Vue and Solid also export `useConsentStore()` for passing the provider's stable store to core free functions such as `gateScripts`. Svelte already supports injecting a pre-created store with `setPolicyStackConsentContext({ store })`.
