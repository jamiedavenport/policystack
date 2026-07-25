---
"@policystack/core": minor
"@policystack/react": minor
"@policystack/vue": minor
"@policystack/svelte": minor
"@policystack/solid": minor
"@policystack/angular": minor
---

Consent preference toggles are now staged. `toggle()` writes to `state.draft` instead of live decisions, and nothing is gated, persisted, or script-loaded until `save()` promotes the draft in one step — scripts no longer load on checkbox tick before "Save", and returning visitors no longer get their stored record rewritten on every tick (#157). Leaving the preferences route without saving discards the draft.

API changes: `toggle(key)` no longer accepts `ActionOptions` (name the record source at `save()` instead), and `ConsentState` gains a required `draft` field. Per-category `granted` accessors in all framework bindings read `draft ?? decisions` so checkboxes respond instantly; custom panels rendering checkboxes from raw `decisions` should apply the same merge.
