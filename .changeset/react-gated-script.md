---
"@policystack/react": minor
---

`@policystack/react/consent` now exposes the provider's consent store, so `gateScript` and the `@policystack/scripts` catalogue are usable with the React bindings (#159). Previously `<PolicyStack>` created its store privately and nothing exported it, leaving no way to obtain the `ConsentStore` that `gateScript(store, def)` requires.

Two new exports:

- `<GatedScript def={...} />` — the React binding for `gateScript`. Takes the store from `<PolicyStack>`, gates the script for as long as it is mounted, and disposes on unmount. Renders no DOM and is inert during SSR. Building the definition inline (`def={ga4({ measurementId: "G-XXXXXXX" })}`) is safe: the gate follows `def.id`, so a fresh object each render neither re-gates nor drops queued pre-consent calls. Optional `onEvent` receives the `ScriptEvent` stream.
- `useConsentStore()` — returns the `ConsentStore` for handing to other core free functions such as `gateScripts`. Stable for the life of the provider and non-reactive; keep using `useConsent` / `useCategory` / `<ConsentGate>` to react to state.

Both throw the existing provider guard outside `<PolicyStack>` or under a policy-only config. That error message now names the full consent API rather than three of its members.
