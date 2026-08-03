# @policystack/solid

## 1.4.0

## 1.3.0

### Minor Changes

- 0d15fae: Vue, Solid, and Svelte now expose `<GatedScript def={...} />`, completing framework-native support for `gateScript` and the `@policystack/scripts` catalogue (#159). Each renderless component reads the enclosing consent store, gates only on the client, disposes with the component lifecycle, follows `def.id` across rerenders so inline definitions retain queued calls, and forwards the optional `onEvent` stream.

  Vue and Solid also export `useConsentStore()` for passing the provider's stable store to core free functions such as `gateScripts`. Svelte already supports injecting a pre-created store with `setPolicyStackConsentContext({ store })`.

## 1.2.0

### Minor Changes

- 279688a: Consent preference toggles are now staged. `toggle()` writes to `state.draft` instead of live decisions, and nothing is gated, persisted, or script-loaded until `save()` promotes the draft in one step — scripts no longer load on checkbox tick before "Save", and returning visitors no longer get their stored record rewritten on every tick (#157). Leaving the preferences route without saving discards the draft.

  API changes: `toggle(key)` no longer accepts `ActionOptions` (name the record source at `save()` instead), and `ConsentState` gains a required `draft` field. Per-category `granted` accessors in all framework bindings read `draft ?? decisions` so checkboxes respond instantly; custom panels rendering checkboxes from raw `decisions` should apply the same merge.

## 1.1.0

## 1.0.1
